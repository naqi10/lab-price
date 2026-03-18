/**
 * seed_fix_profiles.ts
 *
 * Delta seed: patches 5 CDL BundleDeals whose testMappingIds were missing
 * GLOB (Globulines) and/or NHDL (Cholestérol Non-HDL) components.
 *
 * Profiles patched:
 *   BIO3  — BIOCHIMIE #3           → add GLOB
 *   BIO4  — BIOCHIMIE #4           → add GLOB
 *   CH4SC — COMPLET, CRP ULTRA     → add NHDL
 *   GN5   — GÉNÉRAL #5             → add NHDL + GLOB
 *   PNL6  — GÉNÉRAL #6             → add NHDL
 *
 * Idempotent: safe to run multiple times.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  console.log("Patching CDL profile components (GLOB + NHDL)...");

  // ── 1. Resolve the TestMapping IDs for GLOB and NHDL ─────────────────────
  const targets = await prisma.testMapping.findMany({
    where: { code: { in: ["GLOB", "NHDL"] } },
    select: { id: true, code: true, canonicalName: true },
  });

  const globMapping  = targets.find((t) => t.code === "GLOB");
  const nhdlMapping  = targets.find((t) => t.code === "NHDL");

  if (!globMapping) {
    console.error("  ✗ TestMapping for code GLOB not found. Run the full seed first.");
    process.exit(1);
  }
  if (!nhdlMapping) {
    console.error("  ✗ TestMapping for code NHDL not found. Run the full seed first.");
    process.exit(1);
  }

  console.log(`  GLOB → TestMapping ${globMapping.id} (${globMapping.canonicalName})`);
  console.log(`  NHDL → TestMapping ${nhdlMapping.id} (${nhdlMapping.canonicalName})`);

  // ── 2. Patch definitions ───────────────────────────────────────────────────
  const patches: Array<{
    profileCode: string;
    addIds: string[];
    label: string;
  }> = [
    { profileCode: "BIO3",  addIds: [globMapping.id],                    label: "+ GLOB" },
    { profileCode: "BIO4",  addIds: [globMapping.id],                    label: "+ GLOB" },
    { profileCode: "CH4SC", addIds: [nhdlMapping.id],                    label: "+ NHDL" },
    { profileCode: "GN5",   addIds: [nhdlMapping.id, globMapping.id],    label: "+ NHDL + GLOB" },
    { profileCode: "PNL6",  addIds: [nhdlMapping.id],                    label: "+ NHDL" },
  ];

  // ── 3. Apply patches ───────────────────────────────────────────────────────
  let patched = 0;
  let skipped = 0;

  for (const patch of patches) {
    const bundle = await prisma.bundleDeal.findFirst({
      where: {
        profileCode: patch.profileCode,
        sourceLabCode: "CDL",
      },
      select: { id: true, dealName: true, profileCode: true, testMappingIds: true },
    });

    if (!bundle) {
      console.warn(`  ⚠ BundleDeal not found: profileCode=${patch.profileCode} sourceLabCode=CDL`);
      continue;
    }

    // Check which IDs are genuinely new (idempotent guard)
    const newIds = patch.addIds.filter((id) => !bundle.testMappingIds.includes(id));

    if (newIds.length === 0) {
      console.log(`  ✓ ${bundle.profileCode} (${bundle.dealName}) — already up-to-date`);
      skipped++;
      continue;
    }

    await prisma.bundleDeal.update({
      where: { id: bundle.id },
      data: {
        testMappingIds: { set: [...bundle.testMappingIds, ...newIds] },
      },
    });

    console.log(
      `  ✓ ${bundle.profileCode} (${bundle.dealName}) — patched ${patch.label} ` +
      `(${bundle.testMappingIds.length} → ${bundle.testMappingIds.length + newIds.length} tests)`
    );
    patched++;
  }

  console.log(`\nDone. ${patched} bundle(s) patched, ${skipped} already correct.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
