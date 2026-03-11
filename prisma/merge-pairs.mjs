/**
 * merge-pairs.mjs
 * Merges cross-lab test canonicals so CDL + Dynacare appear side-by-side in comparison.
 *
 * Strategy per pair:
 *   1. Move the Dynacare TestMappingEntry from the DYN-only canonical → CDL canonical
 *   2. If the DYN canonical has no more entries, delete it
 *
 * Only confirmed same-test pairs are included.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import "dotenv/config";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const labs = await prisma.laboratory.findMany({ select: { id: true, code: true } });
const cdl = labs.find(l => l.code === "CDL");
const dyn = labs.find(l => l.code === "DYNACARE");
if (!cdl || !dyn) { console.log("Missing lab"); process.exit(1); }

// Helper: find a TestMapping by canonical name (case-insensitive partial)
async function findMapping(nameFragment) {
  const all = await prisma.testMapping.findMany({
    where: { canonicalName: { contains: nameFragment, mode: "insensitive" } },
    include: { entries: { select: { id: true, laboratoryId: true, localTestName: true, price: true } } }
  });
  return all;
}

// Merge: move DYN entry from dynCanonical → cdlCanonical, delete dynCanonical if empty
async function mergePair(cdlCanonicalId, dynCanonicalId, label) {
  // Check DYN entry exists
  const dynEntry = await prisma.testMappingEntry.findFirst({
    where: { testMappingId: dynCanonicalId, laboratoryId: dyn.id }
  });
  if (!dynEntry) {
    console.log(`  ⚠️  [${label}] No DYN entry found in dynCanonical — skip`);
    return false;
  }

  // Check CDL canonical doesn't already have a DYN entry
  const existing = await prisma.testMappingEntry.findFirst({
    where: { testMappingId: cdlCanonicalId, laboratoryId: dyn.id }
  });
  if (existing) {
    console.log(`  ⚠️  [${label}] CDL canonical already has a DYN entry — skip`);
    return false;
  }

  // Move the DYN entry
  await prisma.testMappingEntry.update({
    where: { id: dynEntry.id },
    data: { testMappingId: cdlCanonicalId }
  });

  // Check if dynCanonical has any remaining entries
  const remaining = await prisma.testMappingEntry.count({ where: { testMappingId: dynCanonicalId } });
  if (remaining === 0) {
    await prisma.testMapping.delete({ where: { id: dynCanonicalId } });
    console.log(`  ✅ [${label}] Merged + deleted empty DYN canonical`);
  } else {
    console.log(`  ✅ [${label}] Merged (DYN canonical still has ${remaining} entries)`);
  }
  return true;
}

// ─────────────────────────────────────────────────────────
// CONFIRMED PAIRS TO MERGE
// Format: [cdlNameFragment, dynNameFragment, label]
// ─────────────────────────────────────────────────────────
const PAIRS = [
  // HIGH confidence
  ["Fertilite 2", "SPERMOGRAMME - FERTILITÉ", "Spermogramme Fertilité"],
  ["Electrophorese Proteines Urine", "ÉLECTROPHORÈSE DES PROTÉINES - URINE", "Électrophorèse Protéines Urine"],
  ["Electrophorese Proteines", "ÉLECTROPHORÈSE DES PROTÉINES (SÉRIQUE)", "Électrophorèse Protéines Sérique"],
  ["Herpes Simplex Virus 1 2 IGG", "HERPÈS SIMPLEX DE TYPE IgG", "Herpes Simplex 1+2 IgG"],

  // MED confidence — confirmed same tests
  ["Citrate, Urine", "CITRATE URINES DE 24 HEURES", "Citrate Urine 24h"],
  ["Culture Urealasma", "UREAPLASMA ET MYCOPLASMA", "Uréaplasma & Mycoplasma"],
  ["Immunoelectrophorese", "IMMUNOÉLECTROPHORÈSE URINES DE 24 H", "Immunoélectrophorèse Urine"],
  ["Magnesium, Urine", "MAGNÉSIUM URINES DE 24 HEURES", "Magnésium Urine"],
  ["Vitamine B12", "VITAMINE B12 (CYANOCOBALAMINE)", "Vitamine B12"],
  ["Anti Gliadine IGA", "ANTICORPS ANTI-GLIADINE DE TYPE IgA", "Anti-Gliadine IgA"],
  ["Antithrombine III, Fonctionnelle", "ANTITHROMBINE III (ACTIVITÉ)", "Antithrombine III"],
  ["CD3", "BILAN D'IMMUNODÉFICIENCE", "CD3/CD4/CD8 Immunodéficience"],
];

console.log(`\n🔀 Starting cross-lab canonical merge (${PAIRS.length} pairs)\n`);

let merged = 0;
let skipped = 0;

for (const [cdlFrag, dynFrag, label] of PAIRS) {
  const cdlMappings = await findMapping(cdlFrag);
  const dynMappings = await findMapping(dynFrag);

  // Filter to only the right labs
  const cdlMap = cdlMappings.find(m => m.entries.some(e => e.laboratoryId === cdl.id) && !m.entries.some(e => e.laboratoryId === dyn.id));
  const dynMap = dynMappings.find(m => m.entries.some(e => e.laboratoryId === dyn.id) && !m.entries.some(e => e.laboratoryId === cdl.id));

  if (!cdlMap) {
    console.log(`  ⚠️  [${label}] CDL canonical not found for "${cdlFrag}"`);
    skipped++;
    continue;
  }
  if (!dynMap) {
    console.log(`  ⚠️  [${label}] DYN canonical not found for "${dynFrag}"`);
    skipped++;
    continue;
  }

  const cdlEntry = cdlMap.entries.find(e => e.laboratoryId === cdl.id);
  const dynEntry = dynMap.entries.find(e => e.laboratoryId === dyn.id);
  console.log(`\n  → [${label}]`);
  console.log(`     CDL: "${cdlMap.canonicalName}" $${cdlEntry?.price ?? "N/A"}`);
  console.log(`     DYN: "${dynMap.canonicalName}" $${dynEntry?.price ?? "N/A"}`);

  const ok = await mergePair(cdlMap.id, dynMap.id, label);
  if (ok) merged++;
  else skipped++;
}

// Final stats
const allMappings = await prisma.testMapping.findMany({
  where: { entries: { some: { laboratoryId: { in: [cdl.id, dyn.id] } } } },
  include: { entries: { where: { laboratoryId: { in: [cdl.id, dyn.id] } }, select: { laboratoryId: true } } }
});
const pairedNow = allMappings.filter(m => m.entries.some(e => e.laboratoryId === cdl.id) && m.entries.some(e => e.laboratoryId === dyn.id)).length;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Merge complete!
  Pairs merged:     ${merged}
  Pairs skipped:    ${skipped}
  Cross-lab paired: ${pairedNow} (was 188)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

await prisma.$disconnect();
