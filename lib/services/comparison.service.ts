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
import { generateComparisonPdf } from "@/lib/services/pdf.service";

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
    turnaroundTime: string | null;
    similarity: number;
    matchType: string;
  }>;
  totalPrice: number;
  testCount: number;
  isComplete: boolean;
}

/**
 * Fetch turnaround times from Test records in active price lists.
 * Returns a Map keyed by "laboratoryId:testName" → turnaroundTime.
 */
async function fetchTurnaroundTimes(
  labTestPairs: { laboratoryId: string; localTestName: string }[]
): Promise<Map<string, string | null>> {
  if (labTestPairs.length === 0) return new Map();

  const labIds = [...new Set(labTestPairs.map((p) => p.laboratoryId))];
  const testNames = [...new Set(labTestPairs.map((p) => p.localTestName))];

  const tests = await prisma.test.findMany({
    where: {
      priceList: {
        laboratoryId: { in: labIds },
        isActive: true,
      },
      name: { in: testNames },
      isActive: true,
    },
    select: {
      name: true,
      turnaroundTime: true,
      priceList: { select: { laboratoryId: true } },
    },
  });

  const map = new Map<string, string | null>();
  for (const test of tests) {
    const key = `${test.priceList.laboratoryId}:${test.name}`;
    map.set(key, test.turnaroundTime);
  }
  return map;
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

  // Collect all (lab, testName) pairs to fetch turnaround times in one query
  const labTestPairs: { laboratoryId: string; localTestName: string }[] = [];
  for (const mapping of testMappings) {
    for (const entry of mapping.entries) {
      if (!entry.laboratory.isActive) continue;
      labTestPairs.push({ laboratoryId: entry.laboratory.id, localTestName: entry.localTestName });
    }
  }
  const tatMap = await fetchTurnaroundTimes(labTestPairs);

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
      const turnaroundTime = tatMap.get(`${labId}:${entry.localTestName}`) ?? null;
      result.tests.push({
        testMappingId: mapping.id,
        canonicalName: mapping.canonicalName,
        localTestName: entry.localTestName,
        price,
        turnaroundTime,
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
  const tatMatrix: Record<string, Record<string, string | null>> = {};
  const matchMatrix: Record<string, Record<string, { matchType: string; similarity: number; localTestName: string } | null>> = {};
  for (const mapping of testMappings) {
    priceMatrix[mapping.id] = {};
    tatMatrix[mapping.id] = {};
    matchMatrix[mapping.id] = {};
    for (const lab of laboratories) {
      const labResult = results.find((r) => r.laboratoryId === lab.id);
      const test = labResult?.tests.find((t) => t.testMappingId === mapping.id);
      priceMatrix[mapping.id][lab.id] = test?.price ?? null;
      tatMatrix[mapping.id][lab.id] = test?.turnaroundTime ?? null;
      matchMatrix[mapping.id][lab.id] = test
        ? { matchType: test.matchType, similarity: test.similarity, localTestName: test.localTestName }
        : null;
    }
  }

  return {
    laboratories,
    testMappings,
    priceMatrix,
    tatMatrix,
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

/** One test's assignment in a multi-lab selection. */
export interface SelectionTestAssignment {
  testMappingId: string;
  canonicalName: string;
  localTestName: string;
  laboratoryId: string;
  laboratoryName: string;
  price: number;
  formattedPrice: string;
  turnaroundTime: string | null;
}

/** Multi-lab selection summary (present when per-test selections are active). */
export interface MultiLabSelection {
  assignments: SelectionTestAssignment[];
  totalPrice: number;
  formattedTotalPrice: string;
  laboratories: { id: string; name: string; code: string }[];
}

/** Structured result for comparison with email. */
export interface ComparisonEmailResult {
  testNames: string[];
  laboratories: {
    id: string;
    name: string;
    code: string;
    tests: { canonicalName: string; localTestName: string; price: number; formattedPrice: string; turnaroundTime: string | null }[];
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
  /** Present only when per-test lab selections are active. */
  multiLabSelection?: MultiLabSelection;
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
  selections?: Record<string, string>;
}): Promise<ComparisonEmailResult> {
  const { testMappingIds, clientEmail, clientName, customerId, selections } = data;

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

  // ── Collect (lab, testName) pairs for turnaround time lookup ─────────────
  const emailLabTestPairs: { laboratoryId: string; localTestName: string }[] = [];
  for (const mapping of testMappings) {
    for (const entry of mapping.entries) {
      if (!entry.laboratory.isActive || entry.price == null) continue;
      emailLabTestPairs.push({ laboratoryId: entry.laboratory.id, localTestName: entry.localTestName });
    }
  }
  const emailTatMap = await fetchTurnaroundTimes(emailLabTestPairs);

  // ── Build per-lab price map ──────────────────────────────────────────────
  const labMap = new Map<
    string,
    {
      id: string;
      name: string;
      code: string;
      tests: { canonicalName: string; localTestName: string; price: number; turnaroundTime: string | null }[];
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
        turnaroundTime: emailTatMap.get(`${labId}:${entry.localTestName}`) ?? null,
      });
      lab.totalPrice += entry.price;
    }
  }

  // ── Filter: only labs offering ALL selected tests ────────────────────────
  const completeLabs = Array.from(labMap.values())
    .filter((lab) => lab.tests.length === requiredCount)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  const hasSelections = selections && Object.keys(selections).length === requiredCount;

  if (completeLabs.length === 0 && !hasSelections) {
    throw new Error(
      "Aucun laboratoire ne propose tous les tests sélectionnés avec des prix disponibles"
    );
  }

  const cheapest = completeLabs[0] ?? Array.from(labMap.values())[0];

  // ── Build multi-lab selection if selections provided ───────────────────
  let multiLabSelection: MultiLabSelection | undefined;

  if (hasSelections) {
    const assignments: SelectionTestAssignment[] = [];
    let selTotal = 0;
    const involvedLabIds = new Set<string>();

    for (const mapping of testMappings) {
      const labId = selections[mapping.id];
      if (!labId) continue;
      const lab = labMap.get(labId);
      if (!lab) continue;
      const test = lab.tests.find((t) => t.canonicalName === mapping.canonicalName);
      if (!test) continue;

      involvedLabIds.add(labId);
      selTotal += test.price;
      assignments.push({
        testMappingId: mapping.id,
        canonicalName: mapping.canonicalName,
        localTestName: test.localTestName,
        laboratoryId: labId,
        laboratoryName: lab.name,
        price: test.price,
        formattedPrice: formatCurrency(test.price),
        turnaroundTime: test.turnaroundTime,
      });
    }

    if (assignments.length > 0) {
      const involvedLabs = Array.from(involvedLabIds).map((id) => {
        const l = labMap.get(id)!;
        return { id: l.id, name: l.name, code: l.code };
      });

      multiLabSelection = {
        assignments,
        totalPrice: selTotal,
        formattedTotalPrice: formatCurrency(selTotal),
        laboratories: involvedLabs,
      };
    }
  }

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
        turnaroundTime: t.turnaroundTime,
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
    multiLabSelection,
  };

  const isMultiLab = !!result.multiLabSelection;

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
    const comparisonTableHtml = isMultiLab
      ? buildMultiLabComparisonTableHtml(result)
      : buildComparisonTableHtml(result);

    const variables: TemplateVariables = {
      clientName: clientName || undefined,
      testNames: result.testNames.join(", "),
      cheapestLabName: isMultiLab ? "Sélection optimisée" : cheapest.name,
      cheapestLabPrice: isMultiLab
        ? result.multiLabSelection!.formattedTotalPrice
        : formatCurrency(cheapest.totalPrice),
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
    htmlContent = isMultiLab
      ? buildMultiLabComparisonEmailHtml(result, clientName)
      : buildComparisonEmailHtml(result, clientName);
    emailSubject = isMultiLab
      ? `Comparaison de prix — ${result.testNames.join(" & ")} — Sélection optimisée`
      : `Comparaison de prix — ${result.testNames.join(" & ")} — ${cheapest.name}`;
  }

  // ── Generate comparison PDF ─────────────────────────────────────────────
  const pdfBuffer = await generateComparisonPdf(result, clientName);
  const pdfBase64 = pdfBuffer.toString("base64");

  await sendEmail({
    to: [{ email: clientEmail, name: clientName }],
    subject: emailSubject,
    htmlContent,
    attachments: [
      {
        name: `Comparaison_${result.testNames.join("_").replace(/\s+/g, "-").substring(0, 60)}.pdf`,
        content: pdfBase64,
      },
    ],
    source: "comparison",
    customerId,
  });

  return result;
}

/**
 * Build just the comparison `<table>` HTML for use as the
 * `{{comparisonTableHtml}}` template variable.
 * Shows only the recommended (cheapest) lab's tests.
 */
function buildComparisonTableHtml(result: ComparisonEmailResult): string {
  const thStyle = "padding:10px 14px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;";
  const tdStyle = "padding:10px 14px;border:1px solid #e2e8f0;";

  const lab = result.laboratories.find((l) => l.isCheapest) ?? result.laboratories[0];
  if (!lab) return "";

  const rows = lab.tests
    .map(
      (t) => `<tr>
        <td style="${tdStyle}">${t.canonicalName}</td>
        <td style="${tdStyle}text-align:right;font-weight:600;">${t.formattedPrice}</td>
        <td style="${tdStyle}">${t.turnaroundTime ?? "—"}</td>
      </tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
  <thead>
    <tr>
      <th style="${thStyle}text-align:left;">Analyse</th>
      <th style="${thStyle}text-align:right;">Prix (MAD)</th>
      <th style="${thStyle}text-align:left;">Délai</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr style="background-color:#f0fdf4;">
      <td style="${tdStyle}font-weight:700;">Total</td>
      <td style="${tdStyle}text-align:right;font-weight:700;">${lab.formattedTotalPrice}</td>
      <td style="${tdStyle}"></td>
    </tr>
  </tfoot>
</table>`;
}

/**
 * Build comparison table for multi-lab (per-test) selections.
 * Each row shows the test, assigned lab, price and turnaround time.
 */
function buildMultiLabComparisonTableHtml(result: ComparisonEmailResult): string {
  const sel = result.multiLabSelection;
  if (!sel) return "";

  const thStyle = "padding:10px 14px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;";
  const tdStyle = "padding:10px 14px;border:1px solid #e2e8f0;";

  const rows = sel.assignments
    .map(
      (a) => `<tr>
        <td style="${tdStyle}">${a.canonicalName}</td>
        <td style="${tdStyle}">${a.laboratoryName}</td>
        <td style="${tdStyle}text-align:right;font-weight:600;">${a.formattedPrice}</td>
        <td style="${tdStyle}">${a.turnaroundTime ?? "—"}</td>
      </tr>`
    )
    .join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
  <thead>
    <tr>
      <th style="${thStyle}text-align:left;">Analyse</th>
      <th style="${thStyle}text-align:left;">Laboratoire</th>
      <th style="${thStyle}text-align:right;">Prix (MAD)</th>
      <th style="${thStyle}text-align:left;">Délai</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr style="background-color:#eff6ff;">
      <td style="${tdStyle}font-weight:700;" colspan="2">Total</td>
      <td style="${tdStyle}text-align:right;font-weight:700;">${sel.formattedTotalPrice}</td>
      <td style="${tdStyle}"></td>
    </tr>
  </tfoot>
</table>`;
}

/**
 * Full HTML email for multi-lab (per-test) selections (hard-coded fallback).
 */
function buildMultiLabComparisonEmailHtml(
  result: ComparisonEmailResult,
  clientName?: string
): string {
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const sel = result.multiLabSelection!;
  const thStyle = "padding:10px 14px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;";
  const tdStyle = "padding:10px 14px;border:1px solid #e2e8f0;";

  const rows = sel.assignments
    .map(
      (a) => `<tr>
        <td style="${tdStyle}">${a.canonicalName}</td>
        <td style="${tdStyle}">${a.laboratoryName}</td>
        <td style="${tdStyle}text-align:right;font-weight:600;">${a.formattedPrice}</td>
        <td style="${tdStyle}">${a.turnaroundTime ?? "—"}</td>
      </tr>`
    )
    .join("");

  const labList = sel.laboratories.map((l) => l.name).join(", ");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;">
  <div style="max-width:720px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f172a;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">Lab Price Comparator</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">Sélection optimisée multi-laboratoires</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;">${greeting}</p>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;">
        Voici la sélection optimisée pour
        <strong>${result.testNames.join("</strong>, <strong>")}</strong>
        répartie entre <strong>${labList}</strong>. Le document PDF détaillé est joint à cet email.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="${thStyle}text-align:left;">Analyse</th>
            <th style="${thStyle}text-align:left;">Laboratoire</th>
            <th style="${thStyle}text-align:right;">Prix (MAD)</th>
            <th style="${thStyle}text-align:left;">Délai</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background-color:#eff6ff;">
            <td style="${tdStyle}font-weight:700;" colspan="2">Total</td>
            <td style="${tdStyle}text-align:right;font-weight:700;">${sel.formattedTotalPrice}</td>
            <td style="${tdStyle}"></td>
          </tr>
        </tfoot>
      </table>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#2563eb;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Sélection optimisée</p>
        <p style="margin:0;font-size:16px;color:#1e40af;font-weight:500;">Laboratoires : ${labList}</p>
        <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1d4ed8;">Prix total : ${sel.formattedTotalPrice}</p>
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

/** Build a professional HTML email body for the comparison result (hard-coded fallback). */
function buildComparisonEmailHtml(
  result: ComparisonEmailResult,
  clientName?: string
): string {
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const thStyle = "padding:10px 14px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;";
  const tdStyle = "padding:10px 14px;border:1px solid #e2e8f0;";

  const lab = result.laboratories.find((l) => l.isCheapest) ?? result.laboratories[0];

  const testRows = lab
    ? lab.tests
        .map(
          (t) => `<tr>
            <td style="${tdStyle}">${t.canonicalName}</td>
            <td style="${tdStyle}text-align:right;font-weight:600;">${t.formattedPrice}</td>
            <td style="${tdStyle}">${t.turnaroundTime ?? "—"}</td>
          </tr>`
        )
        .join("")
    : "";

  const totalRow = lab
    ? `<tr style="background-color:#f0fdf4;">
        <td style="${tdStyle}font-weight:700;">Total</td>
        <td style="${tdStyle}text-align:right;font-weight:700;">${lab.formattedTotalPrice}</td>
        <td style="${tdStyle}"></td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;">
  <div style="max-width:720px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f172a;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">Lab Price Comparator</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">Comparaison automatique des prix</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;">${greeting}</p>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;">
        Voici le meilleur prix trouvé pour
        <strong>${result.testNames.join("</strong>, <strong>")}</strong>
        auprès de <strong>${result.cheapestLaboratory.name}</strong>. Le document PDF détaillé est joint à cet email.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="${thStyle}text-align:left;">Analyse</th>
            <th style="${thStyle}text-align:right;">Prix (MAD)</th>
            <th style="${thStyle}text-align:left;">Délai</th>
          </tr>
        </thead>
        <tbody>${testRows}</tbody>
        <tfoot>${totalRow}</tfoot>
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
