/**
 * One-shot patch: merge "Anticoagulant Lupique" canonical into "Lupus Anticoagulant"
 *
 * Problem: two separate TestMapping rows were created for the same real-world test:
 *   1. "Lupus Anticoagulant"   (code LAGT) → CDL entry $140
 *   2. "Anticoagulant Lupique" (code LUPUS) → Dynacare entry $137
 *
 * Fix: move the Dynacare TestMappingEntry to canonical #1, delete canonical #2.
 *
 * Run with:  npx tsx prisma/patch-lupus-pairing.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL!;


const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // 1. Find both canonical TestMappings
  const canonicalKeep = await prisma.testMapping.findFirst({
    where: { canonicalName: "Lupus Anticoagulant" },
    include: { entries: { include: { laboratory: true } } },
  });
  const canonicalDrop = await prisma.testMapping.findFirst({
    where: { canonicalName: "Anticoagulant Lupique" },
    include: { entries: { include: { laboratory: true } } },
  });

  if (!canonicalKeep) {
    console.error('❌  "Lupus Anticoagulant" canonical not found — run seed first');
    process.exit(1);
  }
  if (!canonicalDrop) {
    console.log('✅  "Anticoagulant Lupique" canonical not found — already patched or not seeded');
    return;
  }

  console.log(`\nKeeping : ${canonicalKeep.id}  "${canonicalKeep.canonicalName}"`);
  console.log(`Dropping: ${canonicalDrop.id}  "${canonicalDrop.canonicalName}"\n`);

  // 2. Check for lab conflicts (same lab already on keep canonical)
  const keepLabIds = new Set(canonicalKeep.entries.map((e) => e.laboratoryId));

  for (const entry of canonicalDrop.entries) {
    const labName = entry.laboratory.name;

    if (keepLabIds.has(entry.laboratoryId)) {
      // Conflict: keep canonical already has an entry for this lab — skip (don't duplicate)
      console.log(
        `  ⚠️  ${labName} already has an entry on "${canonicalKeep.canonicalName}" — skipping duplicate (price kept: $${
          canonicalKeep.entries.find((e) => e.laboratoryId === entry.laboratoryId)?.price ?? "?"
        })`
      );
    } else {
      // Move entry to the keep canonical
      await prisma.testMappingEntry.update({
        where: { id: entry.id },
        data: { testMappingId: canonicalKeep.id },
      });
      console.log(
        `  ✅  Moved ${labName} entry ($${entry.price}) → "${canonicalKeep.canonicalName}"`
      );
    }
  }

  // 3. Also update the keep canonical's aliases to include the merged names
  const existingAliases = canonicalKeep.aliases ?? [];
  const newAliases = ["LUPUS ANTICOAGULANT", "ANTICOAGULANT LUPIQUE"];
  const mergedAliases = Array.from(new Set([...existingAliases, ...newAliases]));

  await prisma.testMapping.update({
    where: { id: canonicalKeep.id },
    data: { aliases: mergedAliases },
  });
  console.log(`\n  📝  Updated aliases: ${mergedAliases.join(", ")}`);

  // 4. Delete the orphan canonical (no entries should remain)
  const remaining = await prisma.testMappingEntry.count({
    where: { testMappingId: canonicalDrop.id },
  });
  if (remaining === 0) {
    await prisma.testMapping.delete({ where: { id: canonicalDrop.id } });
    console.log(`  🗑️   Deleted orphan canonical "${canonicalDrop.canonicalName}"`);
  } else {
    console.log(
      `  ⚠️   ${remaining} entries still on "${canonicalDrop.canonicalName}" — not deleted`
    );
  }

  // 5. Verify final state
  const final = await prisma.testMapping.findUnique({
    where: { id: canonicalKeep.id },
    include: { entries: { include: { laboratory: true } } },
  });
  console.log(`\n✅  Final state for "${final?.canonicalName}":`);
  for (const e of final?.entries ?? []) {
    console.log(`   ${e.laboratory.name}: $${e.price}`);
  }
  if ((final?.entries.length ?? 0) >= 2) {
    console.log("\n🎉  Test is now PAIRED across both labs.");
  } else {
    console.log("\n⚠️   Test is still single-lab — check seed data.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
