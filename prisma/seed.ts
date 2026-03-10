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
import { cdlSeedData, qcSeedData } from "./seed1.js";
import { CDL_PROFILE_DESCRIPTIONS, QC_PROFILE_DESCRIPTIONS } from "../lib/data/profile-descriptions.js";

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

type UnmatchedCandidate = {
  labId: string;
  labCode: string;
  rawTest: RawTest;
  dbTestId: string;
};

function inferProfileType(raw: {
  raw_name: string;
  category: string | null;
  type: string;
}): "profile" | "individual" {
  const rawType = (raw.type || "").toLowerCase();
  if (rawType === "profile") return "profile";
  const category = (raw.category || "").toLowerCase();
  if (category === "profile" || category === "profil") return "profile";
  if (/^\s*profil\b/i.test(raw.raw_name)) return "profile";
  return "individual";
}

function parsePriceValue(value: string | number): number {
  if (typeof value === "number") return value;
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

  // Build lookups from seed1.ts (most accurate English tube names + clean French test names)
  // Merge both seed arrays: cdlSeedData + qcSeedData (cdlSeedData takes priority for duplicates)
  const seed1TubeByCode = new Map<string, string>();
  const seed1NameByCode = new Map<string, string>();
  const seed1TatByCode = new Map<string, string>(); // CDL TAT from seed1 catalog
  for (const t of [...qcSeedData, ...cdlSeedData.all]) {
    if (t.tube) {
      const tubeStr = Array.isArray(t.tube) ? t.tube.join(", ") : t.tube;
      seed1TubeByCode.set(t.code, tubeStr);
    }
    if (t.name) seed1NameByCode.set(t.code, t.name);
  }
  for (const t of cdlSeedData.all) {
    if (t.turnaroundTime) seed1TatByCode.set(t.code, String(t.turnaroundTime));
  }

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
      const tubeType = seed1TubeByCode.get(t.code) || tubeMap[t.code] || spec?.tube || "";
      const displayName = seed1NameByCode.get(t.code) || t.raw_name;
      cdlTests.push({
        code: t.code,
        name: displayName,
        description: t.raw_name,
        specimen: typeof tubeType === "string" ? tubeType : "",
        price: t.price,
        turnaroundTime: spec?.turnaroundTime
          ? `${spec.turnaroundTime} jour(s)`
          : seed1TatByCode.has(t.code)
            ? `${seed1TatByCode.get(t.code)} jour(s)`
            : "",
        type: inferProfileType(t),
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
        const tubeType = seed1TubeByCode.get(t.code) || tubeMap[t.code] || spec?.tube || "";
        const displayName = seed1NameByCode.get(t.code) || t.raw_name;
        cdlTests.push({
          code: t.code,
          name: displayName,
          description: t.raw_name,
          specimen: typeof tubeType === "string" ? tubeType : "",
          price: t.price,
          turnaroundTime: spec?.turnaroundTime
          ? `${spec.turnaroundTime} jour(s)`
          : seed1TatByCode.has(t.code)
            ? `${seed1TatByCode.get(t.code)} jour(s)`
            : "",
          type: inferProfileType(t),
        });
      }
    }
  }

  // Build lookup for Dynacare tube types from qcSeedData (+ cdlSeedData fallback)
  // qcSeedData is specifically for Dynacare/QC specimen collection
  const dynTubeByCode = new Map<string, string>();
  const dynTatByCode = new Map<string, string>();
  for (const t of [...cdlSeedData.all, ...qcSeedData]) {
    if (t.tube) {
      const tubeStr = Array.isArray(t.tube) ? t.tube.join(", ") : t.tube;
      dynTubeByCode.set(t.code, tubeStr);
    }
  }
  // Build TAT lookup from qcSeedData (Dynacare/QC catalog has actual turnaround times)
  for (const t of qcSeedData) {
    if (t.turnaroundTime) dynTatByCode.set(t.code, t.turnaroundTime);
  }

  // Default tube type for Dynacare tests with no seed1.ts match
  const inferDynacareTube = (code: string, name: string): string => {
    const lower = name.toLowerCase();
    // Urine tests
    if (lower.includes("urine") || lower.includes("urines") || code.startsWith("24U") || code.endsWith("U"))
      return "Urine Container";
    // Coagulation tests
    if (lower.includes("coagul") || lower.includes("inr") || lower.includes("ptt") || code === "PTPTT" || code === "COAG")
      return "Light Blue";
    // CBC / hematology
    if (lower.includes("hémogramme") || lower.includes("hemogramme") || code.includes("CBC"))
      return "Lavender";
    // Culture / swab tests
    if (lower.includes("culture") || lower.includes("écouvillon") || lower.includes("gorge"))
      return "Swab";
    // ECG (not blood)
    if (code === "ECG") return "";
    // Calculs renaux (not blood)
    if (code === "KIDNEY" || code === "STONE") return "Sterile";
    // Stool test
    if (lower.includes("selles") || code === "CLOS") return "Stool";
    // Drug screen / tox
    if (lower.includes("drogue") || lower.includes("cannabin") || lower.includes("cocaine"))
      return "Gold";
    // Default: Gold (SST) — most common tube for serology, chemistry, antibody tests
    return "Gold";
  };

  // Convert Dynacare to RawTest format — now with tube type from seed1.ts or inferred
  const dynacareTestsFromCatalog: RawTest[] = dynRaw.map((t) => ({
    code: t.code,
    name: t.raw_name,
    description: t.raw_name,
    specimen: dynTubeByCode.get(t.code) || inferDynacareTube(t.code, t.raw_name),
    price: t.price,
    turnaroundTime: dynTatByCode.has(t.code) ? `${dynTatByCode.get(t.code)} jour(s)` : "",
    type: inferProfileType(t),
  }));

  // Backfill missing Dynacare tests from qcSeedData when extraction JSON is incomplete.
  // This keeps catalog parity with the QC specimen manual (e.g. CYSTC/CYSTATINE C).
  const dynacareCodes = new Set(dynacareTestsFromCatalog.map((t) => t.code.toUpperCase()));
  const dynacareBackfill: RawTest[] = qcSeedData
    .filter((t) => !dynacareCodes.has(t.code.toUpperCase()))
    .map((t) => {
      const tube = Array.isArray(t.tube) ? t.tube.join(", ") : t.tube;
      const isProfile = !!t.componentCodes?.length || /^\s*profil\b/i.test(t.name);
      return {
        code: t.code,
        name: t.name,
        description: t.name,
        specimen: tube ?? inferDynacareTube(t.code, t.name),
        price: parsePriceValue(t.price),
        turnaroundTime: t.turnaroundTime ? `${t.turnaroundTime} jour(s)` : "",
        type: isProfile ? "profile" : "individual",
      };
    });

  const dynacareTests: RawTest[] = [...dynacareTestsFromCatalog, ...dynacareBackfill];

  return { cdlTests, dynacareTests };
}

// ── Bundle helpers ─────────────────────────────────────────────────────────

function detectBundleCategory(name: string): string {
  const n = name.toUpperCase();
  if (/LIPI|CHOLEST|TRIGLYCÉ|BIOCHI|GÉNÉRA|SMA|HÉPATIQUE|RÉNAL|DIABÉTI|UROLITH|FER\b|FERRITIN|B12|FOLIQUE/.test(n))
    return "Biochimie";
  if (/THYROÏ|THYROID|HORMONO|FERTILI|FSH|PROLACT|TESTOS|ANDROG|CORTIS/.test(n))
    return "Hormonologie";
  if (/ANÉMIE|ANEM|HÉMATO|COAGUL|PRÉNATAL|PÉRINATAL|MONOTEST/.test(n))
    return "Hématologie";
  if (/HÉPATITE|HÉPATIT|VIH|GONO|CHLAMYD|ITSS|STD|SYPHIL|COELIAQUE|CELIAC|ALLERGI/.test(n))
    return "Immunologie";
  if (/CULTURE|MICROBI|URINE.*CULT|BACTÉRI/.test(n)) return "Microbiologie";
  return "Mixte";
}

function bundleCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Biochimie: "🧪",
    Hormonologie: "🧬",
    Hématologie: "🩸",
    Immunologie: "🛡️",
    Microbiologie: "🔬",
    Mixte: "⚗️",
  };
  return icons[category] ?? "🧫";
}

function resolveToMappingId(
  componentName: string,
  nameToId: Map<string, string>
): string | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(componentName);
  // Exact match
  for (const [canonical, id] of nameToId) {
    if (norm(canonical) === target) return id;
  }
  // Prefix match (at least 4 chars)
  if (target.length >= 4) {
    for (const [canonical, id] of nameToId) {
      const can = norm(canonical);
      if (can.startsWith(target) || target.startsWith(can)) return id;
    }
  }
  return undefined;
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
    labCode: string;
    rawTests: RawTest[];
    dbTests: { id: string; name: string; code: string | null }[];
  }[] = [
    { labId: cdlLab.id, labCode: "CDL", rawTests: cdlTests, dbTests: cdlPriceList.tests },
    {
      labId: dynacareLab.id,
      labCode: "DYNACARE",
      rawTests: dynacareTests,
      dbTests: dynacarePriceList.tests,
    },
  ];

  let resolvedCount = 0;
  let unmatchedCount = 0;
  const unmatchedCandidates: UnmatchedCandidate[] = [];

  for (const { labId, labCode, rawTests, dbTests } of allLabTests) {
    const dbTestByName = new Map(dbTests.map((t) => [t.name, t]));

    for (const raw of rawTests) {
      // Resolution: try both code and name lookup; prefer name match when it
      // finds a different canonical entry (handles code collisions like PHOS/TRYP)
      // Use description (original catalog name) for alias lookup since name may be from seed1.ts
      const lookupName = raw.description || raw.name;
      const normalizedName = normalizeForLookup(lookupName);
      const codeDef = byCode.get(raw.code);
      const nameDef = byAlias.get(normalizedName);
      const def = (nameDef && nameDef !== codeDef) ? nameDef : (codeDef ?? nameDef);
      if (!def) {
        const dbTest = dbTestByName.get(raw.name);
        if (dbTest) {
          unmatchedCandidates.push({
            labId,
            labCode,
            rawTest: raw,
            dbTestId: dbTest.id,
          });
        }
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

  // ── 6b. Safe auto-mapping for unmatched tests ─────────────────────────
  // Group by code + normalized local name to avoid fake cross-lab matches.
  // This keeps unmatched tests selectable in search/comparison while preserving
  // strict matching behavior.
  const unmatchedGroups = new Map<string, UnmatchedCandidate[]>();
  for (const candidate of unmatchedCandidates) {
    const key = `${candidate.rawTest.code.toUpperCase()}::${normalizeForLookup(candidate.rawTest.description || candidate.rawTest.name)}`;
    if (!unmatchedGroups.has(key)) unmatchedGroups.set(key, []);
    unmatchedGroups.get(key)!.push(candidate);
  }

  let autoMappedUnmatchedCount = 0;
  for (const group of unmatchedGroups.values()) {
    if (group.length === 0) continue;
    const sample = group[0];
    const mapping = await prisma.testMapping.create({
      data: {
        canonicalName: sample.rawTest.name,
        code: sample.rawTest.code,
        category: sample.rawTest.type === "profile" ? "Profil" : "Individuel",
        aliases: [sample.rawTest.description || sample.rawTest.name],
        entries: {
          create: group.map((g) => ({
            laboratoryId: g.labId,
            localTestName: g.rawTest.name,
            matchType: "MANUAL" as const,
            similarity: 1.0,
            price: g.rawTest.price,
          })),
        },
      },
      include: { entries: true },
    });

    for (const entry of mapping.entries) {
      const labTests = group.filter((g) => g.labId === entry.laboratoryId);
      for (const lt of labTests) {
        await prisma.test.update({
          where: { id: lt.dbTestId },
          data: { testMappingEntryId: entry.id },
        });
      }
    }
    autoMappedUnmatchedCount++;
  }
  if (autoMappedUnmatchedCount > 0) {
    console.log(`  ${autoMappedUnmatchedCount} unmatched canonical mappings auto-created`);
  }

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

    // Enrich aliases with seed1.ts French names for better searchability
    const enrichedAliases = [...def.aliases];
    const allSeed1 = [...qcSeedData, ...cdlSeedData.all];
    const seed1Entry = allSeed1.find((s) => s.code === def.code);
    if (seed1Entry && !enrichedAliases.some((a) => a.toUpperCase() === seed1Entry.name.toUpperCase())) {
      enrichedAliases.push(seed1Entry.name);
    }

    const mapping = await prisma.testMapping.create({
      data: {
        canonicalName,
        code: def.code,
        category: def.category,
        aliases: enrichedAliases,
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

  // Build code → testMappingId lookup from seeded tests
  const seededTests = await prisma.test.findMany({
    where: { code: { not: null } },
    select: { code: true, testMappingEntryId: true },
  });
  const entryIds = seededTests.map((t) => t.testMappingEntryId).filter(Boolean) as string[];
  const seededEntries = entryIds.length
    ? await prisma.testMappingEntry.findMany({
        where: { id: { in: entryIds } },
        select: { id: true, testMappingId: true },
      })
    : [];
  const entryToMappingId = new Map(seededEntries.map((e) => [e.id, e.testMappingId]));
  const codeToMappingId = new Map<string, string>();
  for (const test of seededTests) {
    if (test.code && test.testMappingEntryId) {
      const mappingId = entryToMappingId.get(test.testMappingEntryId);
      if (mappingId) codeToMappingId.set(test.code.toUpperCase(), mappingId);
    }
  }

  // Build lookup: CDL profile code → componentCodes from seed1.ts
  const cdlProfileComponentMap = new Map<string, string[]>(
    cdlSeedData.profiles
      .filter((p) => p.componentCodes && p.componentCodes.length > 0)
      .map((p) => [p.code, p.componentCodes!])
  );

  // Build lookup: QC profile code → componentCodes from seed1.ts
  const qcComponentMap = new Map<string, string[]>(
    qcSeedData
      .filter((p) => p.componentCodes && p.componentCodes.length > 0)
      .map((p) => [p.code, p.componentCodes!])
  );

  const cdlProfiles = cdlTests.filter((t) => t.type === "profile");
  const qcProfiles = dynacareTests.filter((t) => t.type === "profile");
  let bundleCount = 0;

  function cleanProfileName(name: string): string {
    return name.replace(/,\s*PROFIL(E)?$/i, "").replace(/\s+PROFIL(E)?$/i, "").trim();
  }

  function resolveComponentIds(componentCodes: string[]): string[] {
    const ids = new Set<string>();
    for (const code of componentCodes) {
      const id = codeToMappingId.get(code.toUpperCase());
      if (id) ids.add(id);
    }
    return Array.from(ids);
  }

  function resolveFromName(name: string): string[] {
    // Try splitting compound names like "VITAMINE B12 ET ACIDE FOLIQUE"
    const parts = name.split(/\s+ET\s+/gi).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts
        .map((n) => resolveToMappingId(n, nameToId))
        .filter((id): id is string => !!id);
    }
    return [];
  }

  for (let i = 0; i < cdlProfiles.length; i++) {
    const p = cdlProfiles[i];
    const category = detectBundleCategory(p.name);

    // Try: componentCodes from seed1 → else parse name
    const compCodes = cdlProfileComponentMap.get(p.code);
    const testMappingIds = compCodes
      ? resolveComponentIds(compCodes)
      : resolveFromName(p.name);

    await prisma.bundleDeal.create({
      data: {
        dealName: cleanProfileName(p.name),
        description: CDL_PROFILE_DESCRIPTIONS[p.code.toUpperCase()] ?? `Profil CDL — ${p.code}`,
        category,
        icon: bundleCategoryIcon(category),
        popular: false,
        sortOrder: i,
        customRate: p.price,
        testMappingIds,
        sourceLabCode: "CDL",
        profileCode: p.code,
        profilePrice: p.price,
        isAutoGenerated: true,
      },
    });
    bundleCount++;
  }

  for (let i = 0; i < qcProfiles.length; i++) {
    const p = qcProfiles[i];
    const category = detectBundleCategory(p.name);

    // Try: componentCodes from seed1 → else parse parenthesized name
    const compCodes = qcComponentMap.get(p.code);
    let testMappingIds: string[];
    if (compCodes) {
      testMappingIds = resolveComponentIds(compCodes);
    } else {
      const fullName = qcSeedData.find((s) => s.code === p.code)?.name ?? p.name;
      const parenMatch = fullName.match(/\(([^)]+)\)/);
      const componentNames = parenMatch
        ? parenMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      testMappingIds = componentNames
        .map((n) => resolveToMappingId(n, nameToId))
        .filter((id): id is string => !!id);
    }

    await prisma.bundleDeal.create({
      data: {
        dealName: cleanProfileName(p.name),
        description: QC_PROFILE_DESCRIPTIONS[p.code.toUpperCase()] ?? `Profil Dynacare — ${p.code}`,
        category,
        icon: bundleCategoryIcon(category),
        popular: false,
        sortOrder: cdlProfiles.length + i,
        customRate: p.price,
        testMappingIds,
        sourceLabCode: "QC",
        profileCode: p.code,
        profilePrice: p.price,
        isAutoGenerated: true,
      },
    });
    bundleCount++;
  }

  console.log(`  ${bundleCount} bundle deals seeded (${cdlProfiles.length} CDL + ${qcProfiles.length} QC)`);

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
