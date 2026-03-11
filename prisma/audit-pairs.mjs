import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import "dotenv/config";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const labs = await prisma.laboratory.findMany({ select: { id: true, name: true, code: true } });
console.log("Labs:", labs.map(l => l.code + ":" + l.name).join(", "));

const cdl = labs.find(l => l.code === "CDL");
const dyn = labs.find(l => l.code === "DYNACARE");
if (!cdl || !dyn) { console.log("Missing lab"); process.exit(1); }

// All mappings with at least one CDL or DYN entry
const allMappings = await prisma.testMapping.findMany({
  where: { entries: { some: { laboratoryId: { in: [cdl.id, dyn.id] } } } },
  include: {
    entries: {
      where: { laboratoryId: { in: [cdl.id, dyn.id] } },
      select: { laboratoryId: true, localTestName: true, price: true, code: true }
    }
  }
});

const paired = allMappings.filter(m => m.entries.some(e => e.laboratoryId === cdl.id) && m.entries.some(e => e.laboratoryId === dyn.id));
const cdlOnly = allMappings.filter(m => m.entries.some(e => e.laboratoryId === cdl.id) && !m.entries.some(e => e.laboratoryId === dyn.id));
const dynOnly = allMappings.filter(m => m.entries.some(e => e.laboratoryId === dyn.id) && !m.entries.some(e => e.laboratoryId === cdl.id));

console.log("\n=== Cross-lab pairing stats ===");
console.log("Both CDL + Dynacare (paired for comparison):", paired.length);
console.log("CDL only (no Dynacare match):", cdlOnly.length);
console.log("Dynacare only (no CDL match):", dynOnly.length);

// Same price pairs
const samePricePairs = paired.filter(m => {
  const c = m.entries.find(e => e.laboratoryId === cdl.id);
  const d = m.entries.find(e => e.laboratoryId === dyn.id);
  return c?.price != null && d?.price != null && Math.abs(c.price - d.price) < 0.01;
});
console.log("Paired with same price (regulated):", samePricePairs.length);
console.log("Paired with different prices (comparison useful):", paired.length - samePricePairs.length);

console.log("\n=== Sample paired tests (CDL vs DYN price) ===");
for (const m of paired.slice(0, 20)) {
  const c = m.entries.find(e => e.laboratoryId === cdl.id);
  const d = m.entries.find(e => e.laboratoryId === dyn.id);
  const diff = c?.price != null && d?.price != null ? (c.price - d.price).toFixed(2) : "N/A";
  const name = m.canonicalName.substring(0, 42).padEnd(43);
  console.log("  " + name + " CDL:" + String(c?.price ?? "N/A").padStart(7) + "  DYN:" + String(d?.price ?? "N/A").padStart(7) + "  diff:" + diff);
}

// Now find UNPAIRED tests where code or name matches across labs — potential missed pairs
// Get all CDL-only tests with codes
const cdlOnlyWithCode = cdlOnly.filter(m => {
  const e = m.entries.find(x => x.laboratoryId === cdl.id);
  return e?.code != null;
});
// Get all DYN-only tests with codes
const dynOnlyWithCode = dynOnly.filter(m => {
  const e = m.entries.find(x => x.laboratoryId === dyn.id);
  return e?.code != null;
});

// Build code map for DYN
const dynCodeMap = new Map();
for (const m of dynOnlyWithCode) {
  const e = m.entries.find(x => x.laboratoryId === dyn.id);
  if (e?.code) dynCodeMap.set(e.code.toUpperCase(), { mapping: m, entry: e });
}

// Find CDL tests whose code matches a DYN-only test
let codeMatches = [];
for (const m of cdlOnlyWithCode) {
  const e = m.entries.find(x => x.laboratoryId === cdl.id);
  if (e?.code && dynCodeMap.has(e.code.toUpperCase())) {
    const dynMatch = dynCodeMap.get(e.code.toUpperCase());
    codeMatches.push({ cdlMapping: m, dynMapping: dynMatch.mapping, code: e.code, cdlPrice: e.price, dynPrice: dynMatch.entry.price });
  }
}

console.log("\n=== Unpaired tests with SAME CODE across labs (potential missed pairs) ===");
console.log("Count:", codeMatches.length);
for (const p of codeMatches.slice(0, 20)) {
  console.log("  CODE:" + p.code.padEnd(12) + " CDL: " + p.cdlMapping.canonicalName.substring(0, 35).padEnd(36) + " DYN: " + p.dynMapping.canonicalName.substring(0, 35));
}

await prisma.$disconnect();
