import prisma from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { sendEmail, getEmailConfig } from "@/lib/email/config";
import {
  renderTemplate,
  renderSubject,
  getRawHtmlVariableNames,
  getVariablesForType,
  type TemplateVariables,
} from "@/lib/email/template-renderer";

/**
 * Represents the comparison result for a single laboratory.
 */
interface LabComparisonResult {
  laboratoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  tests: Array<{
    testMappingId: string;
    canonicalName: string;
    localTestName: string;
    price: number;
    similarity: number;
    matchType: string;
  }>;
  totalPrice: number;
  testCount: number;
  isComplete: boolean;
}

/**
 * Compare prices across laboratories for a given set of test mappings.
 *
 * Schema mapping:
 *   TestMapping.entries → TestMappingEntry[]
 *   TestMappingEntry has: localTestName, price, similarity, laboratoryId
 *
 * @param testMappingIds - Array of TestMapping IDs
 * @returns Comparison results sorted by total price (ascending)
 */
export async function compareLabPrices(
  testMappingIds: string[]
): Promise<LabComparisonResult[]> {
  if (testMappingIds.length === 0) {
    throw new Error("Au moins un test doit être sélectionné pour la comparaison");
  }

  const testMappings = await prisma.testMapping.findMany({
    where: { id: { in: testMappingIds } },
    include: {
      entries: {
        include: {
          laboratory: { select: { id: true, name: true, code: true, isActive: true } },
        },
      },
    },
  });

  if (testMappings.length === 0) {
    throw new Error("Aucun test mapping trouvé");
  }

  const labResults = new Map<string, LabComparisonResult>();

  for (const mapping of testMappings) {
    for (const entry of mapping.entries) {
      if (!entry.laboratory.isActive) continue;
      const labId = entry.laboratory.id;
      if (!labResults.has(labId)) {
        labResults.set(labId, {
          laboratoryId: labId,
          laboratoryName: entry.laboratory.name,
          laboratoryCode: entry.laboratory.code,
          tests: [],
          totalPrice: 0,
          testCount: 0,
          isComplete: false,
        });
      }
      const result = labResults.get(labId)!;
      const price = entry.price ?? 0;
      result.tests.push({
        testMappingId: mapping.id,
        canonicalName: mapping.canonicalName,
        localTestName: entry.localTestName,
        price,
        similarity: entry.similarity,
        matchType: entry.matchType,
      });
      result.totalPrice += price;
      result.testCount += 1;
    }
  }

  const requiredCount = testMappingIds.length;
  for (const result of labResults.values()) {
    result.isComplete = result.testCount === requiredCount;
  }

  return Array.from(labResults.values()).sort((a, b) => {
    if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
    return a.totalPrice - b.totalPrice;
  });
}

/**
 * Get detailed comparison for rendering a comparison table.
 * @param testMappingIds - Array of TestMapping IDs
 * @returns Structured comparison data with price matrix
 */
export async function getComparisonDetails(testMappingIds: string[]) {
  const results = await compareLabPrices(testMappingIds);
  const laboratories = results.map((r) => ({
    id: r.laboratoryId,
    name: r.laboratoryName,
    code: r.laboratoryCode,
    totalPrice: r.totalPrice,
    formattedTotalPrice: formatCurrency(r.totalPrice),
    isComplete: r.isComplete,
    testCount: r.testCount,
  }));

  const testMappings = await prisma.testMapping.findMany({
    where: { id: { in: testMappingIds } },
    select: { id: true, canonicalName: true, category: true },
    orderBy: { canonicalName: "asc" },
  });

  const priceMatrix: Record<string, Record<string, number | null>> = {};
  const matchMatrix: Record<string, Record<string, { matchType: string; similarity: number; localTestName: string } | null>> = {};
  for (const mapping of testMappings) {
    priceMatrix[mapping.id] = {};
    matchMatrix[mapping.id] = {};
    for (const lab of laboratories) {
      const labResult = results.find((r) => r.laboratoryId === lab.id);
      const test = labResult?.tests.find((t) => t.testMappingId === mapping.id);
      priceMatrix[mapping.id][lab.id] = test?.price ?? null;
      matchMatrix[mapping.id][lab.id] = test
        ? { matchType: test.matchType, similarity: test.similarity, localTestName: test.localTestName }
        : null;
    }
  }

  return {
    laboratories,
    testMappings,
    priceMatrix,
    matchMatrix,
    bestLaboratory: laboratories.find((l) => l.isComplete) ?? laboratories[0] ?? null,
  };
}

/**
 * Find the single best (cheapest) laboratory for a set of tests.
 * Only considers laboratories with complete coverage.
 */
export async function findBestLaboratory(
  testMappingIds: string[]
): Promise<LabComparisonResult | null> {
  const results = await compareLabPrices(testMappingIds);
  return results.find((r) => r.isComplete) ?? null;
}

// ---------------------------------------------------------------------------
// Comparison with Auto Email
// ---------------------------------------------------------------------------

/** Structured result for comparison with email. */
export interface ComparisonEmailResult {
  testNames: string[];
  laboratories: {
    id: string;
    name: string;
    code: string;
    tests: { canonicalName: string; localTestName: string; price: number; formattedPrice: string }[];
    totalPrice: number;
    formattedTotalPrice: string;
    isCheapest: boolean;
  }[];
  cheapestLaboratory: {
    id: string;
    name: string;
    code: string;
    totalPrice: number;
    formattedTotalPrice: string;
  };
}

/**
 * Compare tests across all laboratories, identify the cheapest lab
 * (only considering labs that offer ALL selected tests), and send
 * the result by email to the client.
 *
 * @param data.testMappingIds - One or more TestMapping IDs
 * @param data.clientEmail    - Recipient email address
 * @param data.clientName     - Optional recipient display name
 * @returns Structured comparison result
 */
export async function compareTestsWithEmail(data: {
  testMappingIds: string[];
  clientEmail: string;
  clientName?: string;
  customerId?: string;
}): Promise<ComparisonEmailResult> {
  const { testMappingIds, clientEmail, clientName, customerId } = data;

  // ── Validation ───────────────────────────────────────────────────────────
  if (!testMappingIds || testMappingIds.length === 0) {
    throw new Error("Au moins un test doit être sélectionné");
  }

  const requiredCount = testMappingIds.length;

  // ── Fetch test mappings with entries (Prisma ORM) ────────────────────────
  const testMappings = await prisma.testMapping.findMany({
    where: { id: { in: testMappingIds } },
    include: {
      entries: {
        include: {
          laboratory: {
            select: { id: true, name: true, code: true, isActive: true },
          },
        },
      },
    },
  });

  if (testMappings.length === 0) {
    throw new Error("Aucun test trouvé pour les identifiants fournis");
  }

  if (testMappings.length !== requiredCount) {
    const found = testMappings.map((tm) => tm.canonicalName).join(", ");
    throw new Error(
      `Certains tests n'ont pas été trouvés. Trouvé(s): ${found || "aucun"}`
    );
  }

  // ── Build per-lab price map ──────────────────────────────────────────────
  const labMap = new Map<
    string,
    {
      id: string;
      name: string;
      code: string;
      tests: { canonicalName: string; localTestName: string; price: number }[];
      totalPrice: number;
    }
  >();

  for (const mapping of testMappings) {
    for (const entry of mapping.entries) {
      if (!entry.laboratory.isActive) continue;
      if (entry.price == null) continue;

      const labId = entry.laboratory.id;
      if (!labMap.has(labId)) {
        labMap.set(labId, {
          id: labId,
          name: entry.laboratory.name,
          code: entry.laboratory.code,
          tests: [],
          totalPrice: 0,
        });
      }

      const lab = labMap.get(labId)!;
      lab.tests.push({
        canonicalName: mapping.canonicalName,
        localTestName: entry.localTestName,
        price: entry.price,
      });
      lab.totalPrice += entry.price;
    }
  }

  // ── Filter: only labs offering ALL selected tests ────────────────────────
  const completeLabs = Array.from(labMap.values())
    .filter((lab) => lab.tests.length === requiredCount)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  if (completeLabs.length === 0) {
    throw new Error(
      "Aucun laboratoire ne propose tous les tests sélectionnés avec des prix disponibles"
    );
  }

  const cheapest = completeLabs[0];

  // ── Build structured result ──────────────────────────────────────────────
  const result: ComparisonEmailResult = {
    testNames: testMappings.map((tm) => tm.canonicalName),
    laboratories: completeLabs.map((lab) => ({
      id: lab.id,
      name: lab.name,
      code: lab.code,
      tests: lab.tests.map((t) => ({
        canonicalName: t.canonicalName,
        localTestName: t.localTestName,
        price: t.price,
        formattedPrice: formatCurrency(t.price),
      })),
      totalPrice: lab.totalPrice,
      formattedTotalPrice: formatCurrency(lab.totalPrice),
      isCheapest: lab.id === cheapest.id,
    })),
    cheapestLaboratory: {
      id: cheapest.id,
      name: cheapest.name,
      code: cheapest.code,
      totalPrice: cheapest.totalPrice,
      formattedTotalPrice: formatCurrency(cheapest.totalPrice),
    },
  };

  // ── Auto-send email ──────────────────────────────────────────────────────
  const [template, emailConfig] = await Promise.all([
    prisma.emailTemplate.findFirst({
      where: { type: "COMPARISON", isDefault: true },
    }),
    getEmailConfig(),
  ]);

  let htmlContent: string;
  let emailSubject: string;

  if (template) {
    const comparisonTableHtml = buildComparisonTableHtml(result);

    const variables: TemplateVariables = {
      clientName: clientName || undefined,
      testNames: result.testNames.join(", "),
      cheapestLabName: cheapest.name,
      cheapestLabPrice: formatCurrency(cheapest.totalPrice),
      comparisonTableHtml,
      companyLogoUrl: emailConfig?.companyLogoUrl || undefined,
      signatureHtml: emailConfig?.signatureHtml || undefined,
    };

    const rawHtmlVars = getRawHtmlVariableNames(getVariablesForType("COMPARISON"));

    htmlContent = renderTemplate(template.htmlBody, variables, {
      missingStrategy: "remove",
      rawHtmlVariables: rawHtmlVars,
    });
    emailSubject = renderSubject(template.subject, variables, "remove");
  } else {
    // Fallback: use the hard-coded HTML builder
    htmlContent = buildComparisonEmailHtml(result, clientName);
    emailSubject = `Comparaison de prix — ${result.testNames.join(" & ")} — ${cheapest.name}`;
  }

  await sendEmail({
    to: [{ email: clientEmail, name: clientName }],
    subject: emailSubject,
    htmlContent,
    source: "comparison",
    customerId,
  });

  return result;
}

/**
 * Build just the comparison `<table>` HTML for use as the
 * `{{comparisonTableHtml}}` template variable.
 */
function buildComparisonTableHtml(result: ComparisonEmailResult): string {
  const testHeaders = result.testNames
    .map(
      (name) =>
        `<th style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;background:#f8fafc;font-weight:600;">${name}</th>`
    )
    .join("");

  const cheapestLab = result.laboratories.find((lab) => lab.isCheapest);
  const labsToShow = cheapestLab
    ? [cheapestLab]
    : result.laboratories.slice(0, 1);

  const rows = labsToShow
    .map((lab) => {
      const priceCells = lab.tests
        .map(
          (t) =>
            `<td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;">${t.formattedPrice}</td>`
        )
        .join("");

      return `<tr style="background-color:#f0fdf4;">
        <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:500;">${lab.name}</td>
        ${priceCells}
        <td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;font-weight:700;">${lab.formattedTotalPrice}</td>
      </tr>`;
    })
    .join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
  <thead>
    <tr>
      <th style="padding:10px 14px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc;font-weight:600;">Laboratoire</th>
      ${testHeaders}
      <th style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;background:#f8fafc;font-weight:600;">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

/** Build a professional HTML email body for the comparison result (hard-coded fallback). */
function buildComparisonEmailHtml(
  result: ComparisonEmailResult,
  clientName?: string
): string {
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";

  const testHeaders = result.testNames
    .map(
      (name) =>
        `<th style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;background:#f8fafc;font-weight:600;">${name}</th>`
    )
    .join("");

  const cheapestLab = result.laboratories.find(lab => lab.isCheapest);
  const labsToShow = cheapestLab ? [cheapestLab] : result.laboratories.slice(0, 1);
  const testRows = labsToShow
    .map((lab) => {
      const priceCells = lab.tests
        .map(
          (t) =>
            `<td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;">${t.formattedPrice}</td>`
        )
        .join("");

      return `<tr style="background-color:#f0fdf4;">
        <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:500;">${lab.name}</td>
        ${priceCells}
        <td style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;font-weight:700;">${lab.formattedTotalPrice}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f172a;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">Lab Price Comparator</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">Comparaison automatique des prix</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;">${greeting}</p>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;">
        Voici le meilleur prix trouvé pour
        <strong>${result.testNames.join("</strong>, <strong>")}</strong>
        auprès du laboratoire le moins cher.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="padding:10px 14px;border:1px solid #e2e8f0;text-align:left;background:#f8fafc;font-weight:600;">Laboratoire</th>
            ${testHeaders}
            <th style="padding:10px 14px;border:1px solid #e2e8f0;text-align:right;background:#f8fafc;font-weight:600;">Total</th>
          </tr>
        </thead>
        <tbody>${testRows}</tbody>
      </table>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Laboratoire recommandé</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#15803d;">${result.cheapestLaboratory.name}</p>
        <p style="margin:4px 0 0;font-size:16px;color:#166534;">Prix total : ${result.cheapestLaboratory.formattedTotalPrice}</p>
      </div>
      <p style="margin:0;color:#64748b;font-size:13px;">
        Ce devis a été généré automatiquement par Lab Price Comparator.
        Pour toute question, n'hésitez pas à nous contacter.
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
        &copy; ${new Date().getFullYear()} Lab Price Comparator — Email automatique
      </p>
    </div>
  </div>
</body>
</html>`;
}
