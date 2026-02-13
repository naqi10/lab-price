import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(" Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
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
  console.log(` Admin user created: ${admin.email}`);

  // Create sample laboratories
  const labs = [
    {
      name: "Laboratoire Central",
      code: "LAB-CENTRAL",
      city: "Casablanca",
      address: "123 Boulevard Mohamed V, Casablanca",
      phone: "+212 522 123 456",
      email: "contact@lab-central.ma",
      contactName: "Dr. Ahmed Benali",
    },
    {
      name: "BioLab Maroc",
      code: "BIOLAB",
      city: "Rabat",
      address: "45 Avenue Hassan II, Rabat",
      phone: "+212 537 654 321",
      email: "info@biolab.ma",
      contactName: "Dr. Fatima Zahra",
    },
    {
      name: "MedAnalyse",
      code: "MEDANALYSE",
      city: "Marrakech",
      address: "78 Rue de la Liberté, Marrakech",
      phone: "+212 524 987 654",
      email: "contact@medanalyse.ma",
      contactName: "Dr. Karim Idrissi",
    },
  ];

  for (const lab of labs) {
    const created = await prisma.laboratory.upsert({
      where: { code: lab.code },
      update: {},
      create: lab,
    });
    console.log(` Laboratory created: ${created.name}`);
  }

  // Create default email config
  await prisma.emailConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "noreply@labprice.com",
      fromName: "Lab Price Comparator",
    },
  });
  console.log(" Default email config created");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
