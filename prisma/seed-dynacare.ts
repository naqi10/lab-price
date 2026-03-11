/**
 * seed-dynacare.ts
 * Re-seeds Dynacare (DYN) lab tests from prisma/dynacare-tests.json.
 *
 * Rules:
 * 1. CDL data is NEVER touched.
 * 2. All existing DYN tests + mapping entries are deleted, then re-created.
 * 3. Orphan test_mappings (no entries remaining) are pruned.
 * 4. Existing CDL canonicals are reused when name similarity >= 0.65.
 * 5. New canonicals are created for unmatched Dynacare tests.
 * 6. One TestMappingEntry per canonical per lab (enforced by DB unique constraint).
 * 7. Each Test row gets a testMappingEntryId.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type DynTest = {
  code: string | null;
  name: string;
  price: number | null;
  turnaroundTime: string | null;
  tubeType: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordOverlap(a: string, b: string): number {
  const wa = new Set(normalize(a).split(" ").filter((w) => w.length > 2));
  const wb = new Set(normalize(b).split(" ").filter((w) => w.length > 2));
  if (wa.size === 0 && wb.size === 0) return 0;
  const intersection = [...wa].filter((w) => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return union === 0 ? 0 : intersection / union;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄  Starting Dynacare reseed…\n");

  // Load test data
  const dataPath = path.join(__dirname, "dynacare-tests.json");
  const dynTests: DynTest[] = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  console.log(`📋  Loaded ${dynTests.length} Dynacare tests from JSON\n`);

  // ── 1. Find DYN laboratory ──────────────────────────────────────────────────
  const dynLab = await prisma.laboratory.findFirst({
    where: { OR: [{ code: "DYN" }, { code: "DYNACARE" }] },
  });
  if (!dynLab) throw new Error("DYN/DYNACARE laboratory not found in database");
  console.log(`✅  DYN lab: ${dynLab.name} (${dynLab.id})`);

  // ── 2. Find active DYN price list ───────────────────────────────────────────
  const dynPriceList = await prisma.priceList.findFirst({
    where: { laboratoryId: dynLab.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!dynPriceList) throw new Error("No active DYN price list found");
  console.log(`✅  DYN price list: ${dynPriceList.id}`);

  // ── 3. Delete all existing DYN tests ────────────────────────────────────────
  const { count: deletedTests } = await prisma.test.deleteMany({
    where: { priceListId: dynPriceList.id },
  });
  console.log(`🗑️   Deleted ${deletedTests} DYN tests`);

  // ── 4. Delete all existing DYN mapping entries ──────────────────────────────
  const { count: deletedEntries } = await prisma.testMappingEntry.deleteMany({
    where: { laboratoryId: dynLab.id },
  });
  console.log(`🗑️   Deleted ${deletedEntries} DYN mapping entries`);

  // ── 5. Prune orphan test_mappings ───────────────────────────────────────────
  const deletedOrphans = await prisma.$executeRaw`
    DELETE FROM test_mappings
    WHERE id NOT IN (SELECT DISTINCT test_mapping_id FROM test_mapping_entries)
  `;
  console.log(`🗑️   Deleted ${deletedOrphans} orphan test_mappings\n`);

  // ── 6. Load existing canonicals for matching ─────────────────────────────────
  const existingMappings = await prisma.testMapping.findMany({
    select: { id: true, canonicalName: true, code: true },
  });
  console.log(`📚  ${existingMappings.length} existing canonical mappings loaded`);

  // Build code index for fast lookup
  const codeIndex = new Map<string, string>(); // code → mappingId
  for (const m of existingMappings) {
    if (m.code) codeIndex.set(m.code.toUpperCase(), m.id);
  }

  // ── 7. Process each Dynacare test ───────────────────────────────────────────
  let newCanonicals = 0;
  let reuseCanonicals = 0;
  let errors = 0;

  // Track canonical IDs already claimed by a DYN entry in this run
  const usedCanonicalIds = new Set<string>();

  console.log("\n⚙️   Processing tests…");

  for (const t of dynTests) {
    try {
      // --- Find best matching canonical (not already used) ---
      let mappingId: string | null = null;
      let matchReason = "";

      // a) Exact code match (only if code looks like a real lab code)
      if (t.code && t.code.length <= 12 && /^[A-Z0-9]+$/i.test(t.code)) {
        const byCode = codeIndex.get(t.code.toUpperCase());
        if (byCode && !usedCanonicalIds.has(byCode)) {
          mappingId = byCode;
          matchReason = `code=${t.code}`;
        }
      }

      // b) Name similarity if no code match
      if (!mappingId) {
        let bestScore = 0;
        let bestId: string | null = null;
        for (const m of existingMappings) {
          if (usedCanonicalIds.has(m.id)) continue;
          const score = wordOverlap(t.name, m.canonicalName);
          if (score > bestScore) {
            bestScore = score;
            bestId = m.id;
          }
        }
        if (bestScore >= 0.65 && bestId) {
          mappingId = bestId;
          matchReason = `similarity=${bestScore.toFixed(2)}`;
        }
      }

      let testMappingId: string;

      if (mappingId) {
        // Reuse existing canonical
        testMappingId = mappingId;
        usedCanonicalIds.add(mappingId);
        reuseCanonicals++;
        if (process.env.DEBUG_SEED) {
          const m = existingMappings.find((x) => x.id === mappingId);
          console.log(`  REUSE "${t.name}" → "${m?.canonicalName}" (${matchReason})`);
        }
      } else {
        // Create new canonical
        const created = await prisma.testMapping.create({
          data: {
            canonicalName: t.name,
            code: t.code && /^[A-Z0-9]+$/i.test(t.code) ? t.code : null,
            turnaroundTime: t.turnaroundTime ?? null,
            tubeType: t.tubeType ?? null,
          },
        });
        testMappingId = created.id;
        usedCanonicalIds.add(created.id);
        // Add to in-memory index for subsequent tests
        existingMappings.push({ id: created.id, canonicalName: t.name, code: created.code });
        if (created.code) codeIndex.set(created.code.toUpperCase(), created.id);
        newCanonicals++;
        if (process.env.DEBUG_SEED) {
          console.log(`  NEW  "${t.name}"`);
        }
      }

      // --- Create TestMappingEntry for DYN ---
      const entry = await prisma.testMappingEntry.create({
        data: {
          testMappingId,
          laboratoryId: dynLab.id,
          localTestName: t.name,
          matchType: "MANUAL",
          similarity: 1.0,
          price: t.price ?? null,
          code: t.code && /^[A-Z0-9]+$/i.test(t.code) ? t.code : null,
          duration: t.turnaroundTime ?? null,
        },
      });

      // --- Create Test row ---
      await prisma.test.create({
        data: {
          priceListId: dynPriceList.id,
          testMappingEntryId: entry.id,
          name: t.name,
          code: t.code && /^[A-Z0-9]+$/i.test(t.code) ? t.code : null,
          price: t.price ?? 0,
          turnaroundTime: t.turnaroundTime ?? null,
          tubeType: t.tubeType ?? null,
        },
      });
    } catch (err) {
      console.error(`  ❌ Failed "${t.name}":`, (err as Error).message);
      errors++;
    }
  }

  // ── 8. Integrity report ──────────────────────────────────────────────────────
  const totalDynTests = await prisma.test.count({ where: { priceListId: dynPriceList.id } });
  const totalDynEntries = await prisma.testMappingEntry.count({ where: { laboratoryId: dynLab.id } });
  const totalMappings = await prisma.testMapping.count();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Dynacare reseed complete!

  Input tests:          ${dynTests.length}
  New canonicals:       ${newCanonicals}
  Reused canonicals:    ${reuseCanonicals}
  Errors / skipped:     ${errors}

  DB — DYN tests:       ${totalDynTests}
  DB — DYN entries:     ${totalDynEntries}
  DB — Total mappings:  ${totalMappings}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
