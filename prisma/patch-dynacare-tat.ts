/**
 * Patch script: update turnaroundTime for Dynacare tests using qcSeedData.
 * Run with: npx tsx prisma/patch-dynacare-tat.ts
 * Safe to run multiple times (idempotent).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import { qcSeedData } from "./seed1.js";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Build code → TAT map from qcSeedData
  const tatByCode = new Map<string, string>();
  for (const t of qcSeedData) {
    if (t.turnaroundTime) tatByCode.set(t.code, `${t.turnaroundTime} jour(s)`);
  }

  // Find the Dynacare laboratory
  const dynacareLab = await prisma.laboratory.findFirst({
    where: { code: "DYNACARE" },
    select: { id: true, name: true },
  });

  if (!dynacareLab) {
    console.error("Dynacare laboratory not found");
    process.exit(1);
  }

  // Get all Dynacare tests
  const tests = await prisma.test.findMany({
    where: {
      priceList: { laboratoryId: dynacareLab.id },
      code: { not: null },
    },
    select: { id: true, code: true, turnaroundTime: true },
  });

  console.log(`Found ${tests.length} Dynacare tests`);

  let updated = 0;
  for (const test of tests) {
    if (!test.code) continue;
    const tat = tatByCode.get(test.code);
    if (tat && test.turnaroundTime !== tat) {
      await prisma.test.update({
        where: { id: test.id },
        data: { turnaroundTime: tat },
      });
      updated++;
    }
  }

  console.log(`Updated ${updated} tests with turnaround time data`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
