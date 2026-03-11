import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import "dotenv/config";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const labs = await prisma.laboratory.findMany({ select: { id: true, name: true, code: true } });
const cdl = labs.find(l => l.code === "CDL");
const dyn = labs.find(l => l.code === "DYNACARE");
if (!cdl || !dyn) { console.log("Missing lab"); process.exit(1); }

const allMappings = await prisma.testMapping.findMany({
  where: { entries: { some: { laboratoryId: { in: [cdl.id, dyn.id] } } } },
  include: {
    entries: {
      where: { laboratoryId: { in: [cdl.id, dyn.id] } },
      select: { laboratoryId: true, localTestName: true, price: true, code: true }
    }
  }
});

const cdlOnly = allMappings.filter(m => m.entries.some(e => e.laboratoryId === cdl.id) && !m.entries.some(e => e.laboratoryId === dyn.id));
const dynOnly = allMappings.filter(m => m.entries.some(e => e.laboratoryId === dyn.id) && !m.entries.some(e => e.laboratoryId === cdl.id));

// Word overlap similarity (same as comparison service)
function tokenize(s) {
  return new Set(
    s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}
function wordOverlap(a, b) {
  const wa = tokenize(a);
  const wb = tokenize(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / Math.max(wa.size, wb.size);
}

// Find potential missed pairs by name similarity
const THRESHOLD = 0.55; // slightly lower than seed threshold to find more candidates
const candidates = [];

for (const cm of cdlOnly) {
  const ce = cm.entries.find(e => e.laboratoryId === cdl.id);
  const cdlName = ce?.localTestName ?? cm.canonicalName;

  let bestScore = 0;
  let bestDyn = null;

  for (const dm of dynOnly) {
    const de = dm.entries.find(e => e.laboratoryId === dyn.id);
    const dynName = de?.localTestName ?? dm.canonicalName;

    const score = wordOverlap(cdlName, dynName);
    if (score > bestScore) {
      bestScore = score;
      bestDyn = { mapping: dm, entry: de, name: dynName };
    }
  }

  if (bestScore >= THRESHOLD && bestDyn) {
    candidates.push({
      cdlCanonical: cm.canonicalName,
      cdlName: cdlName,
      cdlCode: ce?.code,
      cdlPrice: ce?.price,
      dynCanonical: bestDyn.mapping.canonicalName,
      dynName: bestDyn.name,
      dynCode: bestDyn.entry?.code,
      dynPrice: bestDyn.entry?.price,
      score: bestScore,
      cdlId: cm.id,
      dynId: bestDyn.mapping.id,
    });
  }
}

// Sort by score descending
candidates.sort((a, b) => b.score - a.score);

console.log(`\n=== Potential missed pairs by name similarity (threshold >= ${THRESHOLD}) ===`);
console.log(`Found: ${candidates.length} candidates\n`);

const high = candidates.filter(c => c.score >= 0.75);
const mid = candidates.filter(c => c.score >= 0.6 && c.score < 0.75);
const low = candidates.filter(c => c.score >= THRESHOLD && c.score < 0.6);

console.log(`HIGH confidence (>= 0.75): ${high.length}`);
console.log(`MED confidence (0.60-0.75): ${mid.length}`);
console.log(`LOW confidence (0.55-0.60): ${low.length}\n`);

function printGroup(label, list) {
  if (list.length === 0) return;
  console.log(`--- ${label} ---`);
  for (const c of list) {
    const sc = c.score.toFixed(2);
    const cdlStr = (c.cdlName ?? c.cdlCanonical).substring(0, 35).padEnd(36);
    const dynStr = (c.dynName ?? c.dynCanonical).substring(0, 35).padEnd(36);
    const cdlP = String(c.cdlPrice ?? "N/A").padStart(7);
    const dynP = String(c.dynPrice ?? "N/A").padStart(7);
    console.log(`  [${sc}] CDL: ${cdlStr} DYN: ${dynStr} CDL$:${cdlP}  DYN$:${dynP}`);
  }
  console.log();
}

printGroup("HIGH (safe to merge)", high);
printGroup("MED (review before merge)", mid);
printGroup("LOW (probably different tests)", low);

// Output merge candidates as JSON for automation
const mergeReady = high.map(c => ({ cdlMappingId: c.cdlId, dynMappingId: c.dynId, score: c.score, cdlName: c.cdlCanonical, dynName: c.dynCanonical }));
if (mergeReady.length > 0) {
  console.log("\n=== JSON merge candidates (HIGH confidence) ===");
  console.log(JSON.stringify(mergeReady, null, 2));
}

await prisma.$disconnect();
