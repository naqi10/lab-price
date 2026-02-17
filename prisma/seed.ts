import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import bcryptjs from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin user ──────────────────────────────────────────────────────
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
  console.log(`  ✓ Admin user: ${admin.email}`);

  // ── Laboratories ────────────────────────────────────────────────────
  const labDefs = [
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

  const labs: Record<string, { id: string; name: string; code: string }> = {};
  for (const lab of labDefs) {
    const created = await prisma.laboratory.upsert({
      where: { code: lab.code },
      update: {},
      create: lab,
    });
    labs[lab.code] = created;
    console.log(`  ✓ Laboratory: ${created.name}`);
  }

  // ── Test definitions per lab ────────────────────────────────────────
  // Each lab uses slightly different naming conventions and prices

  const labCentralTests = [
    // Biochimie
    { name: "Glycémie à jeun", code: "BIO-001", price: 30, unit: "g/L", category: "Biochimie" },
    { name: "Hémoglobine glyquée (HbA1c)", code: "BIO-002", price: 120, unit: "%", category: "Biochimie" },
    { name: "Cholestérol total", code: "BIO-003", price: 40, unit: "g/L", category: "Biochimie" },
    { name: "HDL-Cholestérol", code: "BIO-004", price: 50, unit: "g/L", category: "Biochimie" },
    { name: "LDL-Cholestérol", code: "BIO-005", price: 50, unit: "g/L", category: "Biochimie" },
    { name: "Triglycérides", code: "BIO-006", price: 40, unit: "g/L", category: "Biochimie" },
    { name: "Créatinine sérique", code: "BIO-007", price: 35, unit: "mg/L", category: "Biochimie" },
    { name: "Urée sanguine", code: "BIO-008", price: 30, unit: "g/L", category: "Biochimie" },
    { name: "Acide urique", code: "BIO-009", price: 35, unit: "mg/L", category: "Biochimie" },
    { name: "Transaminases ASAT (TGO)", code: "BIO-010", price: 40, unit: "UI/L", category: "Biochimie" },
    { name: "Transaminases ALAT (TGP)", code: "BIO-011", price: 40, unit: "UI/L", category: "Biochimie" },
    { name: "Gamma GT", code: "BIO-012", price: 40, unit: "UI/L", category: "Biochimie" },
    { name: "Bilirubine totale", code: "BIO-013", price: 35, unit: "mg/L", category: "Biochimie" },
    { name: "Protéines totales", code: "BIO-014", price: 30, unit: "g/L", category: "Biochimie" },
    { name: "CRP (Protéine C-réactive)", code: "BIO-015", price: 60, unit: "mg/L", category: "Biochimie" },
    // Hématologie
    { name: "NFS (Numération Formule Sanguine)", code: "HEM-001", price: 60, unit: "", category: "Hématologie" },
    { name: "Vitesse de sédimentation (VS)", code: "HEM-002", price: 25, unit: "mm", category: "Hématologie" },
    { name: "TP / INR", code: "HEM-003", price: 50, unit: "%", category: "Hématologie" },
    { name: "TCA", code: "HEM-004", price: 50, unit: "sec", category: "Hématologie" },
    { name: "Fibrinogène", code: "HEM-005", price: 50, unit: "g/L", category: "Hématologie" },
    { name: "Groupage sanguin ABO-Rh", code: "HEM-006", price: 45, unit: "", category: "Hématologie" },
    // Hormonologie
    { name: "TSH (Thyréostimuline)", code: "HOR-001", price: 100, unit: "mUI/L", category: "Hormonologie" },
    { name: "T3 libre", code: "HOR-002", price: 90, unit: "pmol/L", category: "Hormonologie" },
    { name: "T4 libre", code: "HOR-003", price: 90, unit: "pmol/L", category: "Hormonologie" },
    { name: "PSA total", code: "HOR-004", price: 120, unit: "ng/mL", category: "Hormonologie" },
    { name: "Vitamine D (25-OH)", code: "HOR-005", price: 200, unit: "ng/mL", category: "Hormonologie" },
    { name: "Ferritine", code: "HOR-006", price: 100, unit: "ng/mL", category: "Hormonologie" },
    // Sérologie
    { name: "Sérologie Hépatite B (AgHBs)", code: "SER-001", price: 80, unit: "", category: "Sérologie" },
    { name: "Sérologie Hépatite C (Anti-HCV)", code: "SER-002", price: 100, unit: "", category: "Sérologie" },
    { name: "Sérologie HIV 1+2", code: "SER-003", price: 100, unit: "", category: "Sérologie" },
    { name: "Sérologie Toxoplasmose IgG/IgM", code: "SER-004", price: 120, unit: "", category: "Sérologie" },
    { name: "Sérologie Rubéole IgG/IgM", code: "SER-005", price: 120, unit: "", category: "Sérologie" },
    // Microbiologie
    { name: "ECBU (Examen cytobactériologique des urines)", code: "MIC-001", price: 80, unit: "", category: "Microbiologie" },
    { name: "Hémoculture", code: "MIC-002", price: 150, unit: "", category: "Microbiologie" },
    { name: "Coproculture", code: "MIC-003", price: 120, unit: "", category: "Microbiologie" },
  ];

  const bioLabTests = [
    // Biochimie — slightly different names, different prices
    { name: "Glucose sanguin à jeun", code: "GL-01", price: 28, unit: "g/L", category: "Biochimie" },
    { name: "HbA1c", code: "HBA-01", price: 110, unit: "%", category: "Biochimie" },
    { name: "Cholestérol Total", code: "CHO-01", price: 38, unit: "g/L", category: "Biochimie" },
    { name: "HDL Cholestérol", code: "CHO-02", price: 45, unit: "g/L", category: "Biochimie" },
    { name: "LDL Cholestérol", code: "CHO-03", price: 45, unit: "g/L", category: "Biochimie" },
    { name: "Triglycérides sériques", code: "TG-01", price: 38, unit: "g/L", category: "Biochimie" },
    { name: "Créatinine", code: "CR-01", price: 32, unit: "mg/L", category: "Biochimie" },
    { name: "Urée", code: "UR-01", price: 28, unit: "g/L", category: "Biochimie" },
    { name: "Acide Urique sérique", code: "AU-01", price: 32, unit: "mg/L", category: "Biochimie" },
    { name: "ASAT / GOT", code: "TRA-01", price: 38, unit: "UI/L", category: "Biochimie" },
    { name: "ALAT / GPT", code: "TRA-02", price: 38, unit: "UI/L", category: "Biochimie" },
    { name: "Gamma-Glutamyl Transférase", code: "GGT-01", price: 42, unit: "UI/L", category: "Biochimie" },
    { name: "Bilirubine Totale", code: "BIL-01", price: 32, unit: "mg/L", category: "Biochimie" },
    { name: "Protéines Totales sériques", code: "PT-01", price: 28, unit: "g/L", category: "Biochimie" },
    { name: "CRP ultra-sensible", code: "CRP-01", price: 55, unit: "mg/L", category: "Biochimie" },
    // Hématologie
    { name: "Hémogramme complet (NFS)", code: "NFS-01", price: 55, unit: "", category: "Hématologie" },
    { name: "VS (Vitesse de sédimentation)", code: "VS-01", price: 22, unit: "mm", category: "Hématologie" },
    { name: "Taux de Prothrombine (TP)", code: "TP-01", price: 48, unit: "%", category: "Hématologie" },
    { name: "Temps de Céphaline Activée", code: "TCA-01", price: 48, unit: "sec", category: "Hématologie" },
    { name: "Fibrinogène plasmatique", code: "FIB-01", price: 48, unit: "g/L", category: "Hématologie" },
    { name: "Groupage ABO Rhésus", code: "GR-01", price: 42, unit: "", category: "Hématologie" },
    // Hormonologie
    { name: "TSH ultra-sensible", code: "TSH-01", price: 95, unit: "mUI/L", category: "Hormonologie" },
    { name: "FT3 (T3 libre)", code: "FT3-01", price: 85, unit: "pmol/L", category: "Hormonologie" },
    { name: "FT4 (T4 libre)", code: "FT4-01", price: 85, unit: "pmol/L", category: "Hormonologie" },
    { name: "PSA Total", code: "PSA-01", price: 115, unit: "ng/mL", category: "Hormonologie" },
    { name: "25-OH Vitamine D", code: "VD-01", price: 180, unit: "ng/mL", category: "Hormonologie" },
    { name: "Ferritine sérique", code: "FER-01", price: 95, unit: "ng/mL", category: "Hormonologie" },
    // Sérologie
    { name: "Ag HBs (Hépatite B)", code: "HB-01", price: 75, unit: "", category: "Sérologie" },
    { name: "Anti-HCV (Hépatite C)", code: "HC-01", price: 95, unit: "", category: "Sérologie" },
    { name: "HIV 1 et 2 (Sérologie)", code: "HIV-01", price: 95, unit: "", category: "Sérologie" },
    { name: "Toxoplasmose IgG + IgM", code: "TOX-01", price: 110, unit: "", category: "Sérologie" },
    { name: "Rubéole IgG + IgM", code: "RUB-01", price: 110, unit: "", category: "Sérologie" },
    // Microbiologie
    { name: "Examen Cytobactériologique Urinaire", code: "ECB-01", price: 75, unit: "", category: "Microbiologie" },
    { name: "Hémoculture (aéro + anaéro)", code: "HEM-01", price: 140, unit: "", category: "Microbiologie" },
    { name: "Coproculture + Antibiogramme", code: "COP-01", price: 115, unit: "", category: "Microbiologie" },
  ];

  const medAnalyseTests = [
    // Biochimie — yet another naming style, different prices
    { name: "Glycémie", code: "G001", price: 35, unit: "g/L", category: "Biochimie" },
    { name: "Hémoglobine Glyquée A1c", code: "G002", price: 130, unit: "%", category: "Biochimie" },
    { name: "Dosage Cholestérol", code: "L001", price: 42, unit: "g/L", category: "Biochimie" },
    { name: "Dosage HDL", code: "L002", price: 55, unit: "g/L", category: "Biochimie" },
    { name: "Dosage LDL", code: "L003", price: 55, unit: "g/L", category: "Biochimie" },
    { name: "Dosage Triglycérides", code: "L004", price: 42, unit: "g/L", category: "Biochimie" },
    { name: "Créatininémie", code: "R001", price: 38, unit: "mg/L", category: "Biochimie" },
    { name: "Dosage Urée", code: "R002", price: 32, unit: "g/L", category: "Biochimie" },
    { name: "Uricémie", code: "R003", price: 38, unit: "mg/L", category: "Biochimie" },
    { name: "TGO (ASAT)", code: "H001", price: 42, unit: "UI/L", category: "Biochimie" },
    { name: "TGP (ALAT)", code: "H002", price: 42, unit: "UI/L", category: "Biochimie" },
    { name: "GGT", code: "H003", price: 38, unit: "UI/L", category: "Biochimie" },
    { name: "Bilirubine T", code: "H004", price: 38, unit: "mg/L", category: "Biochimie" },
    { name: "Protidémie", code: "P001", price: 32, unit: "g/L", category: "Biochimie" },
    { name: "CRP quantitative", code: "I001", price: 65, unit: "mg/L", category: "Biochimie" },
    // Hématologie
    { name: "Numération Formule Sanguine", code: "N001", price: 65, unit: "", category: "Hématologie" },
    { name: "Vitesse Sédimentation", code: "N002", price: 28, unit: "mm", category: "Hématologie" },
    { name: "TP-INR", code: "C001", price: 55, unit: "%", category: "Hématologie" },
    { name: "TCA (Temps Céphaline)", code: "C002", price: 55, unit: "sec", category: "Hématologie" },
    { name: "Dosage Fibrinogène", code: "C003", price: 55, unit: "g/L", category: "Hématologie" },
    { name: "Groupe Sanguin ABO-Rhésus", code: "N003", price: 48, unit: "", category: "Hématologie" },
    // Hormonologie
    { name: "Dosage TSH", code: "T001", price: 105, unit: "mUI/L", category: "Hormonologie" },
    { name: "T3 Libre", code: "T002", price: 95, unit: "pmol/L", category: "Hormonologie" },
    { name: "T4 Libre", code: "T003", price: 95, unit: "pmol/L", category: "Hormonologie" },
    { name: "Antigène Prostatique Spécifique", code: "M001", price: 125, unit: "ng/mL", category: "Hormonologie" },
    { name: "Vitamine D totale", code: "V001", price: 220, unit: "ng/mL", category: "Hormonologie" },
    { name: "Dosage Ferritine", code: "F001", price: 105, unit: "ng/mL", category: "Hormonologie" },
    // Sérologie
    { name: "Antigène HBs", code: "S001", price: 85, unit: "", category: "Sérologie" },
    { name: "Anticorps Anti-HCV", code: "S002", price: 105, unit: "", category: "Sérologie" },
    { name: "Sérologie VIH 1+2", code: "S003", price: 105, unit: "", category: "Sérologie" },
    { name: "Sérologie Toxoplasmose", code: "S004", price: 125, unit: "", category: "Sérologie" },
    { name: "Sérologie Rubéole", code: "S005", price: 125, unit: "", category: "Sérologie" },
    // Microbiologie
    { name: "ECBU", code: "B001", price: 85, unit: "", category: "Microbiologie" },
    { name: "Hémoculture", code: "B002", price: 160, unit: "", category: "Microbiologie" },
    { name: "Coproculture", code: "B003", price: 125, unit: "", category: "Microbiologie" },
  ];

  // ── Price Lists & Tests ─────────────────────────────────────────────
  // Clean existing data (in order to avoid duplicate key errors on re-seed)
  await prisma.testMappingEntry.deleteMany();
  await prisma.testMapping.deleteMany();
  await prisma.test.deleteMany();
  await prisma.priceList.deleteMany();
  console.log("  ✓ Cleaned existing test data");

  const labTestSets: [string, typeof labCentralTests, string][] = [
    [labs["LAB-CENTRAL"].id, labCentralTests, "tarifs-lab-central-2025.xlsx"],
    [labs["BIOLAB"].id, bioLabTests, "biolab-prix-catalogue.xlsx"],
    [labs["MEDANALYSE"].id, medAnalyseTests, "medanalyse-grille-tarifaire.pdf"],
  ];

  const priceListIds: Record<string, string> = {};

  for (const [labId, tests, fileName] of labTestSets) {
    const priceList = await prisma.priceList.create({
      data: {
        laboratoryId: labId,
        fileName,
        fileType: fileName.endsWith(".pdf") ? "PDF" : "EXCEL",
        fileSize: Math.floor(Math.random() * 500000) + 50000,
        isActive: true,
        tests: {
          create: tests,
        },
      },
      include: { tests: true },
    });
    priceListIds[labId] = priceList.id;
    console.log(`  ✓ Price list "${fileName}" with ${priceList.tests.length} tests`);
  }

  // ── Test Mappings (canonical names → lab-specific names) ────────────
  // Each mapping links the same test across all 3 labs for comparison

  const mappingDefs: {
    canonicalName: string;
    category: string;
    labCentral: string;
    bioLab: string;
    medAnalyse: string;
    // prices per lab in same order
    prices: [number, number, number];
  }[] = [
    // Biochimie
    { canonicalName: "Glycémie à jeun", category: "Biochimie", labCentral: "Glycémie à jeun", bioLab: "Glucose sanguin à jeun", medAnalyse: "Glycémie", prices: [30, 28, 35] },
    { canonicalName: "Hémoglobine glyquée (HbA1c)", category: "Biochimie", labCentral: "Hémoglobine glyquée (HbA1c)", bioLab: "HbA1c", medAnalyse: "Hémoglobine Glyquée A1c", prices: [120, 110, 130] },
    { canonicalName: "Cholestérol total", category: "Biochimie", labCentral: "Cholestérol total", bioLab: "Cholestérol Total", medAnalyse: "Dosage Cholestérol", prices: [40, 38, 42] },
    { canonicalName: "HDL-Cholestérol", category: "Biochimie", labCentral: "HDL-Cholestérol", bioLab: "HDL Cholestérol", medAnalyse: "Dosage HDL", prices: [50, 45, 55] },
    { canonicalName: "LDL-Cholestérol", category: "Biochimie", labCentral: "LDL-Cholestérol", bioLab: "LDL Cholestérol", medAnalyse: "Dosage LDL", prices: [50, 45, 55] },
    { canonicalName: "Triglycérides", category: "Biochimie", labCentral: "Triglycérides", bioLab: "Triglycérides sériques", medAnalyse: "Dosage Triglycérides", prices: [40, 38, 42] },
    { canonicalName: "Créatinine", category: "Biochimie", labCentral: "Créatinine sérique", bioLab: "Créatinine", medAnalyse: "Créatininémie", prices: [35, 32, 38] },
    { canonicalName: "Urée", category: "Biochimie", labCentral: "Urée sanguine", bioLab: "Urée", medAnalyse: "Dosage Urée", prices: [30, 28, 32] },
    { canonicalName: "Acide urique", category: "Biochimie", labCentral: "Acide urique", bioLab: "Acide Urique sérique", medAnalyse: "Uricémie", prices: [35, 32, 38] },
    { canonicalName: "ASAT (TGO)", category: "Biochimie", labCentral: "Transaminases ASAT (TGO)", bioLab: "ASAT / GOT", medAnalyse: "TGO (ASAT)", prices: [40, 38, 42] },
    { canonicalName: "ALAT (TGP)", category: "Biochimie", labCentral: "Transaminases ALAT (TGP)", bioLab: "ALAT / GPT", medAnalyse: "TGP (ALAT)", prices: [40, 38, 42] },
    { canonicalName: "Gamma GT", category: "Biochimie", labCentral: "Gamma GT", bioLab: "Gamma-Glutamyl Transférase", medAnalyse: "GGT", prices: [40, 42, 38] },
    { canonicalName: "Bilirubine totale", category: "Biochimie", labCentral: "Bilirubine totale", bioLab: "Bilirubine Totale", medAnalyse: "Bilirubine T", prices: [35, 32, 38] },
    { canonicalName: "CRP", category: "Biochimie", labCentral: "CRP (Protéine C-réactive)", bioLab: "CRP ultra-sensible", medAnalyse: "CRP quantitative", prices: [60, 55, 65] },
    // Hématologie
    { canonicalName: "NFS", category: "Hématologie", labCentral: "NFS (Numération Formule Sanguine)", bioLab: "Hémogramme complet (NFS)", medAnalyse: "Numération Formule Sanguine", prices: [60, 55, 65] },
    { canonicalName: "Vitesse de sédimentation", category: "Hématologie", labCentral: "Vitesse de sédimentation (VS)", bioLab: "VS (Vitesse de sédimentation)", medAnalyse: "Vitesse Sédimentation", prices: [25, 22, 28] },
    { canonicalName: "TP / INR", category: "Hématologie", labCentral: "TP / INR", bioLab: "Taux de Prothrombine (TP)", medAnalyse: "TP-INR", prices: [50, 48, 55] },
    { canonicalName: "TCA", category: "Hématologie", labCentral: "TCA", bioLab: "Temps de Céphaline Activée", medAnalyse: "TCA (Temps Céphaline)", prices: [50, 48, 55] },
    { canonicalName: "Groupage sanguin", category: "Hématologie", labCentral: "Groupage sanguin ABO-Rh", bioLab: "Groupage ABO Rhésus", medAnalyse: "Groupe Sanguin ABO-Rhésus", prices: [45, 42, 48] },
    // Hormonologie
    { canonicalName: "TSH", category: "Hormonologie", labCentral: "TSH (Thyréostimuline)", bioLab: "TSH ultra-sensible", medAnalyse: "Dosage TSH", prices: [100, 95, 105] },
    { canonicalName: "T3 libre", category: "Hormonologie", labCentral: "T3 libre", bioLab: "FT3 (T3 libre)", medAnalyse: "T3 Libre", prices: [90, 85, 95] },
    { canonicalName: "T4 libre", category: "Hormonologie", labCentral: "T4 libre", bioLab: "FT4 (T4 libre)", medAnalyse: "T4 Libre", prices: [90, 85, 95] },
    { canonicalName: "PSA total", category: "Hormonologie", labCentral: "PSA total", bioLab: "PSA Total", medAnalyse: "Antigène Prostatique Spécifique", prices: [120, 115, 125] },
    { canonicalName: "Vitamine D", category: "Hormonologie", labCentral: "Vitamine D (25-OH)", bioLab: "25-OH Vitamine D", medAnalyse: "Vitamine D totale", prices: [200, 180, 220] },
    { canonicalName: "Ferritine", category: "Hormonologie", labCentral: "Ferritine", bioLab: "Ferritine sérique", medAnalyse: "Dosage Ferritine", prices: [100, 95, 105] },
    // Sérologie
    { canonicalName: "Sérologie Hépatite B", category: "Sérologie", labCentral: "Sérologie Hépatite B (AgHBs)", bioLab: "Ag HBs (Hépatite B)", medAnalyse: "Antigène HBs", prices: [80, 75, 85] },
    { canonicalName: "Sérologie Hépatite C", category: "Sérologie", labCentral: "Sérologie Hépatite C (Anti-HCV)", bioLab: "Anti-HCV (Hépatite C)", medAnalyse: "Anticorps Anti-HCV", prices: [100, 95, 105] },
    { canonicalName: "Sérologie HIV", category: "Sérologie", labCentral: "Sérologie HIV 1+2", bioLab: "HIV 1 et 2 (Sérologie)", medAnalyse: "Sérologie VIH 1+2", prices: [100, 95, 105] },
    { canonicalName: "Sérologie Toxoplasmose", category: "Sérologie", labCentral: "Sérologie Toxoplasmose IgG/IgM", bioLab: "Toxoplasmose IgG + IgM", medAnalyse: "Sérologie Toxoplasmose", prices: [120, 110, 125] },
    { canonicalName: "Sérologie Rubéole", category: "Sérologie", labCentral: "Sérologie Rubéole IgG/IgM", bioLab: "Rubéole IgG + IgM", medAnalyse: "Sérologie Rubéole", prices: [120, 110, 125] },
    // Microbiologie
    { canonicalName: "ECBU", category: "Microbiologie", labCentral: "ECBU (Examen cytobactériologique des urines)", bioLab: "Examen Cytobactériologique Urinaire", medAnalyse: "ECBU", prices: [80, 75, 85] },
    { canonicalName: "Hémoculture", category: "Microbiologie", labCentral: "Hémoculture", bioLab: "Hémoculture (aéro + anaéro)", medAnalyse: "Hémoculture", prices: [150, 140, 160] },
    { canonicalName: "Coproculture", category: "Microbiologie", labCentral: "Coproculture", bioLab: "Coproculture + Antibiogramme", medAnalyse: "Coproculture", prices: [120, 115, 125] },
  ];

  const labIds = [labs["LAB-CENTRAL"].id, labs["BIOLAB"].id, labs["MEDANALYSE"].id];

  for (const m of mappingDefs) {
    await prisma.testMapping.create({
      data: {
        canonicalName: m.canonicalName,
        category: m.category,
        entries: {
          create: [
            {
              laboratoryId: labIds[0],
              localTestName: m.labCentral,
              matchType: "EXACT",
              similarity: 1.0,
              price: m.prices[0],
            },
            {
              laboratoryId: labIds[1],
              localTestName: m.bioLab,
              matchType: "FUZZY",
              similarity: 0.85,
              price: m.prices[1],
            },
            {
              laboratoryId: labIds[2],
              localTestName: m.medAnalyse,
              matchType: "FUZZY",
              similarity: 0.8,
              price: m.prices[2],
            },
          ],
        },
      },
    });
  }
  console.log(`  ✓ ${mappingDefs.length} test mappings with cross-lab entries created`);

  // ── Email Templates (defaults) ──────────────────────────────────────
  await prisma.emailTemplate.deleteMany();

  const quotationHtml = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f7fafc;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#1a365d;padding:20px 30px;border-radius:8px 8px 0 0;text-align:center;">
      {{#companyLogoUrl}}<img src="{{companyLogoUrl}}" alt="Logo" style="max-height:48px;margin-bottom:8px;" />{{/companyLogoUrl}}
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Lab Price Comparator</h1>
    </div>
    <div style="background:#ffffff;padding:30px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <p style="font-size:16px;color:#2d3748;margin-bottom:16px;">Bonjour {{clientName}},</p>
      <p style="font-size:14px;color:#4a5568;line-height:1.6;margin-bottom:12px;">
        {{customMessage}}
      </p>
      <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="font-size:16px;color:#1a365d;font-weight:700;margin:0 0 16px;">Devis N° {{quotationNumber}}</h2>
        <table style="width:100%;font-size:13px;">
          <tr><td style="color:#718096;padding:4px 0;width:180px;">Titre :</td><td style="color:#2d3748;font-weight:500;">{{title}}</td></tr>
          <tr><td style="color:#718096;padding:4px 0;">Laboratoire :</td><td style="color:#2d3748;font-weight:500;">{{laboratoryName}}</td></tr>
          <tr><td style="color:#718096;padding:4px 0;">Nombre d'analyses :</td><td style="color:#2d3748;font-weight:500;">{{itemCount}}</td></tr>
        </table>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:12px 0;" />
        <table style="width:100%;font-size:13px;">
          <tr><td style="color:#718096;padding:4px 0;width:180px;"><strong>Montant total :</strong></td><td style="font-size:16px;color:#1a365d;font-weight:700;">{{totalPrice}}</td></tr>
          <tr><td style="color:#718096;padding:4px 0;">Valide jusqu'au :</td><td style="color:#2d3748;font-weight:500;">{{validUntil}}</td></tr>
        </table>
      </div>
      <p style="font-size:14px;color:#4a5568;line-height:1.6;margin-bottom:12px;">Le détail complet du devis est disponible dans le fichier PDF joint.</p>
      <p style="font-size:14px;color:#4a5568;line-height:1.6;margin-bottom:12px;">Pour toute question, n'hésitez pas à nous contacter.</p>
      <p style="font-size:14px;color:#4a5568;margin-bottom:4px;">Cordialement,</p>
      <p style="font-size:14px;color:#4a5568;margin-bottom:4px;">L'équipe Lab Price Comparator</p>
      {{#signatureHtml}}<div style="margin-top:16px;border-top:1px solid #e2e8f0;padding-top:16px;">{{signatureHtml}}</div>{{/signatureHtml}}
    </div>
    <div style="background:#f7fafc;padding:20px 30px;border-radius:0 0 8px 8px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
      <p style="font-size:11px;color:#a0aec0;text-align:center;margin:4px 0;">Ce message a été envoyé automatiquement par Lab Price Comparator.</p>
      <p style="font-size:11px;color:#a0aec0;text-align:center;margin:4px 0;">Merci de ne pas répondre directement à cet email.</p>
    </div>
  </div>
</body>
</html>`;

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
      type: "QUOTATION",
      name: "Devis — Modèle par défaut",
      subject: "Devis {{quotationNumber}} — {{title}}",
      htmlBody: quotationHtml,
      isDefault: true,
      variables: [
        { name: "quotationNumber", label: "N° Devis", sampleValue: "QT-20260217-A3F1" },
        { name: "title", label: "Titre du devis", sampleValue: "Devis analyses biochimiques" },
        { name: "clientName", label: "Nom du client", sampleValue: "Jean Dupont" },
        { name: "clientEmail", label: "Email du client", sampleValue: "jean@example.com" },
        { name: "laboratoryName", label: "Nom du laboratoire", sampleValue: "Laboratoire Central" },
        { name: "totalPrice", label: "Montant total", sampleValue: "1 250,00 MAD" },
        { name: "validUntil", label: "Date de validité", sampleValue: "17/03/2026" },
        { name: "itemCount", label: "Nombre d'analyses", sampleValue: "5" },
        { name: "customMessage", label: "Message personnalisé", sampleValue: "" },
        { name: "companyLogoUrl", label: "URL du logo", sampleValue: "https://example.com/logo.png" },
        { name: "signatureHtml", label: "Signature HTML", isHtml: true, sampleValue: "<p>Cordialement,<br/>L'équipe Lab Price Comparator</p>" },
      ],
    },
  });
  console.log("  ✓ Default quotation email template");

  await prisma.emailTemplate.create({
    data: {
      type: "COMPARISON",
      name: "Comparaison — Modèle par défaut",
      subject: "Comparaison de prix — {{testNames}} — {{cheapestLabName}}",
      htmlBody: comparisonHtml,
      isDefault: true,
      variables: [
        { name: "clientName", label: "Nom du client", sampleValue: "Jean Dupont" },
        { name: "testNames", label: "Noms des analyses", sampleValue: "Glycémie, Créatinine" },
        { name: "comparisonTableHtml", label: "Tableau comparatif (HTML)", isHtml: true, sampleValue: "<table><tr><td>...</td></tr></table>" },
        { name: "cheapestLabName", label: "Labo le moins cher", sampleValue: "Laboratoire Central" },
        { name: "cheapestLabPrice", label: "Prix le moins cher", sampleValue: "850,00 MAD" },
        { name: "companyLogoUrl", label: "URL du logo", sampleValue: "https://example.com/logo.png" },
        { name: "signatureHtml", label: "Signature HTML", isHtml: true, sampleValue: "<p>Cordialement,<br/>L'équipe Lab Price Comparator</p>" },
      ],
    },
  });
  console.log("  ✓ Default comparison email template");

  console.log("\n✅ Seeding completed!");
  console.log(`   - 1 admin user`);
  console.log(`   - 3 laboratories`);
  console.log(`   - 3 price lists (35 tests each = 105 tests total)`);
  console.log(`   - ${mappingDefs.length} test mappings (${mappingDefs.length * 3} entries)`);
  console.log(`   - 2 default email templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
