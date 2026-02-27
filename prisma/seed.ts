import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import * as bcryptjs from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import {
  CANONICAL_TEST_REGISTRY,
  buildCanonicalIndexes,
  normalizeForLookup,
} from "../lib/data/canonical-test-registry.js";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// ── Types ─────────────────────────────────────────────────────────────────
type RawTest = {
  code: string;
  name: string;
  description: string;
  specimen: string;
  price: number;
  turnaroundTime: string;
  type: "profile" | "individual";
};

// ── Load data from JSON files ─────────────────────────────────────────────
function loadData(): { cdlTests: RawTest[]; dynacareTests: RawTest[] } {
  const rootDir = path.resolve(__dirname, "..");

  // CDL: final_cdl.json (main catalog)
  const cdlRaw: Array<{
    lab: string;
    raw_name: string;
    code: string;
    category: string | null;
    type: string;
    components: string[];
    price: number;
  }> = JSON.parse(fs.readFileSync(path.join(rootDir, "final_cdl.json"), "utf8"));

  // CDL Specimen Collection Manual: app/new.json (tube, temperature, turnaround)
  const specimenRaw: Array<{
    code: string;
    description: string;
    tube: string;
    temperature: string;
    turnaroundTime: string;
    price: string;
  }> = JSON.parse(fs.readFileSync(path.join(rootDir, "app/new.json"), "utf8"));

  // Dynacare: final_dynacare.json
  const dynRaw: Array<{
    lab: string;
    raw_name: string;
    code: string;
    category: string | null;
    type: string;
    components: string[];
    price: number;
  }> = JSON.parse(fs.readFileSync(path.join(rootDir, "final_dynacare.json"), "utf8"));

  // Build specimen lookup for CDL enrichment
  const specimenByCode = new Map<string, (typeof specimenRaw)[number]>();
  for (const s of specimenRaw) {
    specimenByCode.set(s.code, s);
  }

  // Comprehensive tube type map from CDL 2026 catalog image
  const tubeMap: Record<string, string | null> = JSON.parse(
    fs.readFileSync(path.join(rootDir, "prisma/cdl-tube-map.json"), "utf8")
  );

  // Deduplicate CDL: prefer non-null category entries,
  // BUT keep both when they are genuinely different tests sharing a code
  const cdlByCode = new Map<string, (typeof cdlRaw)[number][]>();
  for (const t of cdlRaw) {
    if (!cdlByCode.has(t.code)) {
      cdlByCode.set(t.code, [t]);
    } else {
      cdlByCode.get(t.code)!.push(t);
    }
  }

  const cdlTests: RawTest[] = [];
  for (const [, entries] of cdlByCode) {
    if (entries.length === 1) {
      // Single entry — straightforward
      const t = entries[0];
      const spec = specimenByCode.get(t.code);
      const tubeType = spec?.tube || tubeMap[t.code] || "";
      cdlTests.push({
        code: t.code,
        name: t.raw_name,
        description: t.raw_name,
        specimen: typeof tubeType === "string" ? tubeType : "",
        price: t.price,
        turnaroundTime: spec?.turnaroundTime ? `${spec.turnaroundTime} jour(s)` : "",
        type: t.type === "profile" ? "profile" : "individual",
      });
    } else {
      // Multiple entries sharing same code — check if genuinely different tests
      const withCat = entries.filter((e) => e.category !== null);
      const withoutCat = entries.filter((e) => e.category === null);

      // Check if there's a genuine name conflict (e.g. PHOS: Antiphospholipine vs Phosphore)
      const namesSimilar = (a: string, b: string) => {
        const na = a.toLowerCase().replace(/[^a-z0-9]/g, "");
        const nb = b.toLowerCase().replace(/[^a-z0-9]/g, "");
        return na.includes(nb) || nb.includes(na) || na === nb;
      };

      // Prefer category entry, but also keep any genuinely different null-category entries
      const kept = withCat.length > 0 ? [withCat[0]] : [entries[0]];
      for (const alt of withoutCat) {
        const isDuplicate = kept.some((k) => namesSimilar(k.raw_name, alt.raw_name));
        if (!isDuplicate) {
          kept.push(alt); // Genuinely different test (e.g. PHOS/Phosphore, TRYP/Alpha-1-Antitrypsine)
        }
      }

      for (const t of kept) {
        const spec = specimenByCode.get(t.code);
        const tubeType = spec?.tube || tubeMap[t.code] || "";
        cdlTests.push({
          code: t.code,
          name: t.raw_name,
          description: t.raw_name,
          specimen: typeof tubeType === "string" ? tubeType : "",
          price: t.price,
          turnaroundTime: spec?.turnaroundTime ? `${spec.turnaroundTime} jour(s)` : "",
          type: t.type === "profile" ? "profile" : "individual",
        });
      }
    }
  }

  // Convert Dynacare to RawTest format
  const dynacareTests: RawTest[] = dynRaw.map((t) => ({
    code: t.code,
    name: t.raw_name,
    description: t.raw_name,
    specimen: "",
    price: t.price,
    turnaroundTime: "",
    type: t.type === "profile" ? "profile" : "individual",
  }));

  return { cdlTests, dynacareTests };
}

// ── Seed Function ─────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database with canonical lab data...");
  console.log(`  Registry: ${CANONICAL_TEST_REGISTRY.length} canonical test definitions`);

  const { cdlTests, dynacareTests } = loadData();
  console.log(`  CDL tests loaded: ${cdlTests.length}`);
  console.log(`  Dynacare tests loaded: ${dynacareTests.length}`);

  // ── 1. Admin user ─────────────────────────────────────────────────────
  const hashedPassword = await bcryptjs.hash("Admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@labprice.com" },
    update: {},
    create: {
      email: "admin@labprice.com",
      name: "Administrateur",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`  Admin user: ${admin.email}`);

  // ── 2. Laboratories ───────────────────────────────────────────────────
  const cdlLab = await prisma.laboratory.upsert({
    where: { code: "CDL" },
    update: { name: "Laboratoires CDL" },
    create: {
      code: "CDL",
      name: "Laboratoires CDL",
      city: "Montréal",
      phone: "514 344-8022",
      email: "info@laboratoirescdl.com",
    },
  });
  console.log(`  Laboratory: ${cdlLab.name}`);

  const dynacareLab = await prisma.laboratory.upsert({
    where: { code: "DYNACARE" },
    update: { name: "Dynacare" },
    create: {
      code: "DYNACARE",
      name: "Dynacare",
      city: "Montréal",
      phone: "800 565-5721",
      email: "info@dynacare.ca",
    },
  });
  console.log(`  Laboratory: ${dynacareLab.name}`);

  // ── 3. Clean existing data (idempotent re-seed) ───────────────────────
  await prisma.estimateEmail.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.testMappingEntry.deleteMany();
  await prisma.testMapping.deleteMany();
  await prisma.test.deleteMany();
  await prisma.priceList.deleteMany();
  console.log("  Cleaned existing test data");

  // ── 4. Helper: map raw test fields → schema fields ────────────────────
  const mapTests = (tests: RawTest[]) =>
    tests.map((t) => ({
      code: t.code,
      name: t.name,
      description: t.description,
      tubeType: t.specimen || null,
      price: t.price,
      turnaroundTime: t.turnaroundTime || null,
      category: t.type === "profile" ? "Profil" : "Individuel",
    }));

  // ── 5. Create PriceLists with nested Tests ────────────────────────────
  const cdlPriceList = await prisma.priceList.create({
    data: {
      laboratoryId: cdlLab.id,
      fileName: "CDL_catalogue_2025.pdf",
      fileType: "PDF",
      fileSize: 2500000,
      isActive: true,
      tests: { create: mapTests(cdlTests) },
    },
    include: { tests: true },
  });
  console.log(
    `  Price list "${cdlPriceList.fileName}" with ${cdlPriceList.tests.length} tests`
  );

  const dynacarePriceList = await prisma.priceList.create({
    data: {
      laboratoryId: dynacareLab.id,
      fileName: "Dynacare_catalogue_2025.pdf",
      fileType: "PDF",
      fileSize: 1800000,
      isActive: true,
      tests: { create: mapTests(dynacareTests) },
    },
    include: { tests: true },
  });
  console.log(
    `  Price list "${dynacarePriceList.fileName}" with ${dynacarePriceList.tests.length} tests`
  );

  // ── 6. Test Mappings via Canonical Registry ─────────────────────────
  const { byCode, byAlias } = buildCanonicalIndexes(CANONICAL_TEST_REGISTRY);

  type LabTestInfo = { labId: string; rawTest: RawTest; dbTestId: string };
  const canonicalGroups = new Map<
    string,
    { def: (typeof CANONICAL_TEST_REGISTRY)[number]; labs: LabTestInfo[] }
  >();

  const allLabTests: {
    labId: string;
    rawTests: RawTest[];
    dbTests: { id: string; name: string; code: string | null }[];
  }[] = [
    { labId: cdlLab.id, rawTests: cdlTests, dbTests: cdlPriceList.tests },
    {
      labId: dynacareLab.id,
      rawTests: dynacareTests,
      dbTests: dynacarePriceList.tests,
    },
  ];

  let resolvedCount = 0;
  let unmatchedCount = 0;

  for (const { labId, rawTests, dbTests } of allLabTests) {
    const dbTestByName = new Map(dbTests.map((t) => [t.name, t]));

    for (const raw of rawTests) {
      // Resolution: try both code and name lookup; prefer name match when it
      // finds a different canonical entry (handles code collisions like PHOS/TRYP)
      const normalizedName = normalizeForLookup(raw.name);
      const codeDef = byCode.get(raw.code);
      const nameDef = byAlias.get(normalizedName);
      const def = (nameDef && nameDef !== codeDef) ? nameDef : (codeDef ?? nameDef);
      if (!def) {
        console.warn(
          `  ⚠ UNMATCHED: [${raw.code}] "${raw.name}" — add to canonical registry`
        );
        unmatchedCount++;
        continue;
      }

      const dbTest = dbTestByName.get(raw.name);
      if (!dbTest) continue;

      if (!canonicalGroups.has(def.canonicalName)) {
        canonicalGroups.set(def.canonicalName, { def, labs: [] });
      }
      canonicalGroups
        .get(def.canonicalName)!
        .labs.push({ labId, rawTest: raw, dbTestId: dbTest.id });
      resolvedCount++;
    }
  }

  console.log(`  ${resolvedCount} tests resolved via canonical registry`);
  if (unmatchedCount > 0)
    console.warn(`  ⚠ ${unmatchedCount} tests UNMATCHED (update registry!)`);

  // Create TestMapping + TestMappingEntry records, then link Tests via FK
  let crossLabCount = 0;
  let singleLabCount = 0;

  for (const [canonicalName, { def, labs }] of Array.from(canonicalGroups)) {
    // Deduplicate entries per lab (keep first occurrence)
    const seenLabs = new Set<string>();
    const uniqueLabs: LabTestInfo[] = [];
    for (const entry of labs) {
      if (!seenLabs.has(entry.labId)) {
        seenLabs.add(entry.labId);
        uniqueLabs.push(entry);
      }
    }

    const mapping = await prisma.testMapping.create({
      data: {
        canonicalName,
        code: def.code,
        category: def.category,
        aliases: def.aliases,
        entries: {
          create: uniqueLabs.map((e) => ({
            laboratoryId: e.labId,
            localTestName: e.rawTest.name,
            matchType: "EXACT" as const,
            similarity: 1.0,
            price: e.rawTest.price,
          })),
        },
      },
      include: { entries: true },
    });

    // Link each Test record to its TestMappingEntry via FK
    for (const entry of mapping.entries) {
      const labTests = labs.filter((l) => l.labId === entry.laboratoryId);
      for (const lt of labTests) {
        await prisma.test.update({
          where: { id: lt.dbTestId },
          data: { testMappingEntryId: entry.id },
        });
      }
    }

    if (uniqueLabs.length > 1) crossLabCount++;
    else singleLabCount++;
  }

  console.log(`  ${crossLabCount} cross-lab test mappings`);
  console.log(`  ${singleLabCount} single-lab test mappings`);
  console.log(`  ${canonicalGroups.size} total canonical mappings`);

  // ── Bundle Deals ───────────────────────────────────────────────────
  await prisma.bundleDeal.deleteMany();

  const allMappings = await prisma.testMapping.findMany({
    select: { id: true, canonicalName: true },
  });
  const nameToId = new Map(allMappings.map((m) => [m.canonicalName, m.id]));

  const bundleDefs = [
    {
      dealName: "Bilan Lipidique",
      description: "Exploration complète du profil lipidique",
      category: "Biochimie",
      icon: "🩸",
      popular: true,
      sortOrder: 0,
      canonicalNames: [
        "Cholesterol Total",
        "Cholesterol HDL",
        "Cholesterol LDL",
        "Triglycerides",
      ],
      customRate: 150,
    },
    {
      dealName: "Bilan Hépatique",
      description: "Évaluation de la fonction hépatique",
      category: "Biochimie",
      icon: "🫁",
      popular: false,
      sortOrder: 1,
      canonicalNames: ["AST", "ALT", "GGT", "Bilirubine Totale (BILIT)"],
      customRate: 130,
    },
    {
      dealName: "Bilan Rénal",
      description: "Exploration de la fonction rénale",
      category: "Biochimie",
      icon: "🫀",
      popular: false,
      sortOrder: 2,
      canonicalNames: ["Creatinine (Sérum)", "Uree", "Acide Urique"],
      customRate: 80,
    },
    {
      dealName: "Bilan Thyroïdien",
      description: "Exploration complète de la thyroïde",
      category: "Hormonologie",
      icon: "🧬",
      popular: false,
      sortOrder: 3,
      canonicalNames: ["TSH Ultrasensible", "T3 Libre (T3F)", "T4 Libre (T4F)"],
      customRate: 230,
    },
  ];

  for (const def of bundleDefs) {
    const testMappingIds = def.canonicalNames
      .map((name) => nameToId.get(name))
      .filter((id): id is string => !!id);

    if (testMappingIds.length > 0) {
      await prisma.bundleDeal.create({
        data: {
          dealName: def.dealName,
          description: def.description,
          category: def.category,
          icon: def.icon,
          popular: def.popular,
          sortOrder: def.sortOrder,
          customRate: def.customRate,
          testMappingIds,
        },
      });
    }
  }
  console.log(`  ${bundleDefs.length} bundle deals seeded`);

  // ── 7. Default email template ─────────────────────────────────────────
  await prisma.emailTemplate.deleteMany();

  const comparisonHtml = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#0f172a;padding:24px 32px;">
      {{#companyLogoUrl}}<img src="{{companyLogoUrl}}" alt="Logo" style="max-height:48px;margin-bottom:8px;" />{{/companyLogoUrl}}
      <h1 style="margin:0;color:#ffffff;font-size:20px;">Lab Price Comparator</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">Comparaison automatique des prix</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;">Bonjour {{clientName}},</p>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;">
        Voici le meilleur prix trouvé pour <strong>{{testNames}}</strong>
        auprès du laboratoire le moins cher.
      </p>
      {{comparisonTableHtml}}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Laboratoire recommandé</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#15803d;">{{cheapestLabName}}</p>
        <p style="margin:4px 0 0;font-size:16px;color:#166534;">Prix total : {{cheapestLabPrice}}</p>
      </div>
      <p style="margin:0;color:#64748b;font-size:13px;">
        Ce devis a été généré automatiquement par Lab Price Comparator.
        Pour toute question, n'hésitez pas à nous contacter.
      </p>
      {{#signatureHtml}}<div style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:16px;">{{signatureHtml}}</div>{{/signatureHtml}}
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
        &copy; 2026 Lab Price Comparator — Email automatique
      </p>
    </div>
  </div>
</body>
</html>`;

  await prisma.emailTemplate.create({
    data: {
      type: "COMPARISON",
      name: "Comparaison — Modèle par défaut",
      subject:
        "Comparaison de prix — {{testNames}} — {{cheapestLabName}}",
      htmlBody: comparisonHtml,
      isDefault: true,
      variables: [
        { name: "clientName", label: "Nom du client", sampleValue: "Jean Dupont" },
        { name: "testNames", label: "Noms des analyses", sampleValue: "Glycémie, Créatinine" },
        { name: "comparisonTableHtml", label: "Tableau comparatif (HTML)", isHtml: true, sampleValue: "<table><tr><td>...</td></tr></table>" },
        { name: "cheapestLabName", label: "Labo le moins cher", sampleValue: "Laboratoires CDL" },
        { name: "cheapestLabPrice", label: "Prix le moins cher", sampleValue: "150,00 $" },
        { name: "companyLogoUrl", label: "URL du logo", sampleValue: "https://example.com/logo.png" },
        { name: "signatureHtml", label: "Signature HTML", isHtml: true, sampleValue: "<p>Cordialement,<br/>L'équipe Lab Price Comparator</p>" },
      ],
    },
  });
  console.log("  Default comparison email template");

  // ── Summary ───────────────────────────────────────────────────────────
  const totalTests = cdlPriceList.tests.length + dynacarePriceList.tests.length;
  console.log("\nSeeding completed!");
  console.log(`   - 1 admin user`);
  console.log(`   - 2 laboratories (CDL, Dynacare)`);
  console.log(
    `   - 2 price lists (${totalTests} tests total: ${cdlPriceList.tests.length} CDL + ${dynacarePriceList.tests.length} Dynacare)`
  );
  console.log(
    `   - ${canonicalGroups.size} canonical test mappings (${crossLabCount} cross-lab, ${singleLabCount} single-lab)`
  );
  console.log(`   - 1 default email template`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
