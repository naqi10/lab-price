import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import * as bcryptjs from "bcryptjs";
import {
  CANONICAL_TEST_REGISTRY,
  buildCanonicalIndexes,
  normalizeForLookup,
} from "../lib/data/canonical-test-registry.js";

// ── Inline tube colors + clean names from CDL specimen manual ──────────
const CDL_SEED1: Record<string, { tube: string; name: string }> = {
  HIAA: { tube: "24h Urine Container", name: "5-HIAA (5-Hydroxyindoleacetic Acid)" },
  ACBA: { tube: "Gold", name: "Acetylcholine, Anticorps Bloquants" },
  ACRA: { tube: "Gold", name: "Acetylcholine, Anticorps Liant" },
  FOLC: { tube: "Gold", name: "Acide Folique (Folate)" },
  MMAS: { tube: "Gold", name: "Acide Méthylmalonique" },
  URIC: { tube: "Gold", name: "Acide Urique" },
  "UA/U": { tube: "24h Urine Container", name: "Acide Urique (Urine 24h)" },
  VALP: { tube: "Red", name: "Acide Valproïque (Depakene/Epival)" },
  ADUL: { tube: "Red", name: "Adalimumab" },
  ALB: { tube: "Gold", name: "Albumine" },
  ALDO: { tube: "Red or Lavender", name: "Aldostérone" },
  A1AT: { tube: "Gold", name: "Alpha-1 Antitrypsine" },
  AFP: { tube: "Gold", name: "Alpha-Foetoprotéine" },
  ALT: { tube: "Gold", name: "ALT (SGPT)" },
  AL: { tube: "Royal Blue", name: "Aluminium" },
  AMPH: { tube: "Sterile Container", name: "Amphétamine (Dépistage)" },
  AMYL: { tube: "Gold", name: "Amylase" },
  ANDR: { tube: "Red", name: "Androsténédione" },
  ANA: { tube: "Gold", name: "Anti-Nucléaire Anticorps (ANA)" },
  ENA: { tube: "Gold", name: "Anti-Nucléaires Extractables (ENA)" },
  ASOT: { tube: "Gold", name: "Antistreptolysine O (ASO)" },
  APOA: { tube: "Gold", name: "Apolipoprotéine A-1" },
  APOB: { tube: "Gold", name: "Apolipoprotéine B" },
  APOE: { tube: "Lavender", name: "Apolipoprotéine E (Genotyping)" },
  BARS: { tube: "Royal Blue", name: "Arsenic" },
  AST: { tube: "Gold", name: "AST (SGOT)" },
  CTTBP: { tube: "Sterile Container", name: "Bacille de Koch (Tuberculose) Culture" },
  UBAR: { tube: "Sterile Container", name: "Barbituriques (Dépistage)" },
  BENZ: { tube: "Sterile Container", name: "Benzodiazépines (Dépistage)" },
  B2MG: { tube: "Gold", name: "Bêta-2 Microglobuline" },
  BHCG: { tube: "Gold", name: "Bêta-HCG Quantitative (Grossesse)" },
  PREG: { tube: "Gold", name: "Bêta-HCG Qualitative" },
  CO2P: { tube: "Green", name: "Bicarbonate (CO2 Total)" },
  DBIL: { tube: "Gold", name: "Bilirubine Directe" },
  TBIL: { tube: "Gold", name: "Bilirubine Totale" },
  BIOP: { tube: "Formalin Container", name: "Biopsie" },
  BORP: { tube: "UTM Swab", name: "Bordetella Pertussis (Coqueluche)" },
  C125: { tube: "Gold", name: "CA 125" },
  C153: { tube: "Gold", name: "CA 15-3" },
  C199: { tube: "Gold", name: "CA 19-9" },
  CD: { tube: "Royal Blue", name: "Cadmium" },
  CA: { tube: "Gold", name: "Calcium" },
  CAIP: { tube: "Green", name: "Calcium Ionisé" },
  CN50: { tube: "Sterile Container", name: "Cannabis (THC) Dépistage" },
  CARM: { tube: "Red", name: "Carbamazépine (Tegretol)" },
  CEA: { tube: "Gold", name: "Carcino-Embryonic Antigen (CEA)" },
  CLPTN: { tube: "Sterile Container", name: "Calprotectine" },
  UCAT: { tube: "24h Urine Container", name: "Catécholamines (Urine)" },
  CATS: { tube: "Lavender", name: "Catécholamines (Plasma)" },
  CUBP: { tube: "Gold", name: "Céruloplasmine" },
  CMPC: { tube: "PCR Kit", name: "Chlamydia (PCR Cervical/Endocervical)" },
  CMPCU: { tube: "Sterile Container", name: "Chlamydia (Urine)" },
  CL: { tube: "Gold", name: "Chlorure" },
  CHOL: { tube: "Gold", name: "Cholestérol Total" },
  HDL: { tube: "Gold", name: "Cholestérol HDL" },
  LDLD: { tube: "Gold", name: "Cholestérol LDL" },
  CK: { tube: "Gold", name: "Créatine Kinase (CK)" },
  CKMB: { tube: "Gold", name: "CK-MB" },
  CREA: { tube: "Gold", name: "Créatinine" },
  COKE: { tube: "Sterile Container", name: "Cocaïne (Dépistage)" },
  SCORT: { tube: "Gold", name: "Cortisol (AM/PM)" },
  CRP: { tube: "Gold", name: "Protéine C-Réactive (CRP)" },
  CRPHS: { tube: "Gold", name: "CRP Haute Sensibilité (Cardio)" },
  CULU: { tube: "Sterile Container / Pea Green Tube", name: "Urine (Culture)" },
  DDIM: { tube: "Light Blue", name: "D-Dimère" },
  "DH-S": { tube: "Gold", name: "DHEA-S" },
  DIGX: { tube: "Red", name: "Digoxin (Lanoxin)" },
  DHT: { tube: "Gold", name: "Dihydrotestostérone" },
  ELEC: { tube: "Gold", name: "Électrolytes (Na, K, Cl)" },
  SPEP: { tube: "Gold", name: "Électrophorèse des protéines (Sérum)" },
  ESTR: { tube: "Gold", name: "Estradiol" },
  SETH: { tube: "Gold", name: "Éthanol (Sérum)" },
  FE: { tube: "Gold", name: "Fer Total" },
  FERR: { tube: "Gold", name: "Ferritine" },
  FIB: { tube: "Light Blue", name: "Fibrinogène" },
  CBC: { tube: "Lavender", name: "Formule Sanguine Complète (FSC)" },
  FSH: { tube: "Gold", name: "FSH (Hormone Folliculo-stimulante)" },
  GGT: { tube: "Gold", name: "GGT" },
  ACGL: { tube: "Gold", name: "Glucose (À Jeun/AC)" },
  GLU: { tube: "Gold", name: "Glucose (Aléatoire)" },
  "2HGTT": { tube: "Gold", name: "Glucose Tolerance Test (2h)" },
  GLHBP: { tube: "Lavender", name: "HbA1c (Hémoglobine Glyquée)" },
  GONO: { tube: "PCR Kit", name: "Gonorrhée (PCR Cervical/Endocervical)" },
  GONOU: { tube: "Sterile Container", name: "Gonorrhée (Urine)" },
  BLDT: { tube: "Pink", name: "Groupe Sanguin & Rh" },
  HEPC: { tube: "Gold", name: "Hépatite C (Anticorps)" },
  HCVL: { tube: "Lavender", name: "Hépatite C Charge Virale" },
  HSAG: { tube: "Gold", name: "Hépatite B (Ag de surface - HBsAg)" },
  HIV: { tube: "Gold", name: "HIV (VIH) Dépistage" },
  HIVL: { tube: "Lavender", name: "HIV Charge Virale" },
  HCYS: { tube: "Lavender", name: "Homocystéine" },
  HPBT: { tube: "Breath Test Kit", name: "H. Pylori Breath Test" },
  IGA: { tube: "Gold", name: "Immunoglobuline A (IgA)" },
  IGG: { tube: "Gold", name: "Immunoglobuline G (IgG)" },
  IGM: { tube: "Gold", name: "Immunoglobuline M (IgM)" },
  IGE: { tube: "Gold", name: "Immunoglobuline E (IgE)" },
  ISLN: { tube: "Gold", name: "Insuline" },
  PT: { tube: "Light Blue", name: "INR / PT" },
  LD: { tube: "Gold", name: "Lactate Déshydrogénase (LDH)" },
  LITH: { tube: "Gold", name: "Lithium" },
  LASE: { tube: "Gold", name: "Lipase" },
  LH: { tube: "Gold", name: "LH (Hormone Lutéinisante)" },
  MG: { tube: "Gold", name: "Magnésium" },
  MONO: { tube: "Gold", name: "Monotest (Mononucléose)" },
  PARA: { tube: "Stool Container (x3)", name: "Ova and Parasites (Oeufs et Parasites) - Selles" },
  PTH: { tube: "Lavender", name: "Parathormone (PTH)" },
  PO4: { tube: "Gold", name: "Phosphore (Phosphate)" },
  PLT: { tube: "Lavender", name: "Plaquettes" },
  PB: { tube: "Royal Blue", name: "Plomb (Sang)" },
  K: { tube: "Gold", name: "Potassium" },
  PROG: { tube: "Gold", name: "Progestérone" },
  PRLA: { tube: "Gold", name: "Prolactine" },
  TP: { tube: "Gold", name: "Protéines Totales" },
  PSA: { tube: "Gold", name: "PSA (APS) Total" },
  FPSA: { tube: "Gold", name: "PSA (APS) Libre" },
  PTT: { tube: "Light Blue", name: "PTT (TCA)" },
  RTIC: { tube: "Lavender", name: "Réticulocytes" },
  RUBE: { tube: "Gold", name: "Rubéole IgG" },
  SEDI: { tube: "Lavender", name: "Sédimentation (Vitesse de)" },
  NA: { tube: "Gold", name: "Sodium" },
  SYPEIA: { tube: "Gold", name: "Syphilis (VDRL/RPR)" },
  FT3: { tube: "Gold", name: "T3 Libre" },
  FT4: { tube: "Gold", name: "T4 Libre" },
  TEST: { tube: "Gold", name: "Testostérone Totale" },
  TESBC: { tube: "Gold", name: "Testostérone Biodisponible" },
  TESFC: { tube: "Gold", name: "Testostérone Libre" },
  THYG: { tube: "Gold", name: "Thyroglobuline" },
  TRFN: { tube: "Gold", name: "Transferrine" },
  TRIG: { tube: "Gold", name: "Triglycérides" },
  TSH: { tube: "Gold", name: "TSH" },
  UREA: { tube: "Gold", name: "Urée" },
  URC: { tube: "Sterile Container", name: "Urine (Analyse)" },
  VARG: { tube: "Gold", name: "Varicelle IgG" },
  VB12: { tube: "Gold", name: "Vitamine B12" },
  "25D": { tube: "Gold", name: "Vitamine D (25-OH)" },
  ZN: { tube: "Royal Blue", name: "Zinc (Plasma)" },
};

// ── Inline tube colors + clean names from Dynacare QC specimen manual ──
const QC_SEED1: Record<string, { tube: string; name: string }> = {
  "APH ACETONE": { tube: "Gold", name: "Acetaminophène & Acétone" },
  VAL: { tube: "Red", name: "Acide Valproïque (Depakene)" },
  ALB: { tube: "Gold", name: "Albumine" },
  ALCO: { tube: "Gold", name: "Alcool (Ethanol) - Sang" },
  DOST: { tube: "Gold", name: "Aldostérone" },
  TRYP: { tube: "Gold", name: "Alpha-1 Antitrypsine" },
  AFP: { tube: "Gold", name: "Alpha-Foetoprotéine (AFP)" },
  ALT: { tube: "Gold", name: "ALT (SGPT)" },
  AMIK: { tube: "Gold", name: "Amikacine (Au hasard/Pré/Post)" },
  AMITRIP: { tube: "Red", name: "Amitriptyline" },
  AMMO: { tube: "Lavender", name: "Ammoniaque" },
  AMYL: { tube: "Gold", name: "Amylase" },
  ANDRO: { tube: "Gold", name: "Androstènedione" },
  ANA: { tube: "Gold", name: "Anticorps Antinucléaires (ANA)" },
  DNA: { tube: "Gold", name: "Anticorps Anti-ADN (Double Brin)" },
  ASOT: { tube: "Gold", name: "Antistreptolysine O (ASO)" },
  APOA: { tube: "Gold", name: "Apolipoprotéine A-1" },
  APOB: { tube: "Gold", name: "Apolipoprotéine B" },
  ARSENIWB: { tube: "Royal Blue", name: "Arsenic (Sang Total)" },
  AST: { tube: "Gold", name: "AST (SGOT)" },
  B2MICRO: { tube: "Gold", name: "Beta-2 Microglobuline" },
  BSQUANT: { tube: "Gold", name: "Beta-HCG Quantitative" },
  BILIT: { tube: "Gold", name: "Bilirubine Totale" },
  BILITD: { tube: "Gold", name: "Bilirubine Directe" },
  BNP: { tube: "Gold", name: "BNP (NT-pro-BNP)" },
  C3: { tube: "Gold", name: "Complément C3" },
  C4: { tube: "Gold", name: "Complément C4" },
  CA125: { tube: "Gold", name: "CA 125" },
  CA153: { tube: "Gold", name: "CA 15-3" },
  CA19: { tube: "Gold", name: "CA 19-9" },
  CA: { tube: "Gold", name: "Calcium" },
  CAI: { tube: "Gold", name: "Calcium Ionisé" },
  TEG: { tube: "Red", name: "Carbamazépine (Tegretol)" },
  CEA: { tube: "Gold", name: "Carcino-Embryonic Antigen (CEA)" },
  CERU: { tube: "Gold", name: "Céruloplasmine" },
  CHOL: { tube: "Gold", name: "Cholestérol Total" },
  CK: { tube: "Gold", name: "Créatine Kinase (CK)" },
  CKMB: { tube: "Gold", name: "CK-MB" },
  CL: { tube: "Gold", name: "Chlorure" },
  CO2: { tube: "Gold", name: "CO2 Total (Bicarbonate)" },
  COD: { tube: "Pink", name: "Coombs Direct" },
  AMAT: { tube: "Pink", name: "Coombs Indirect" },
  CORTIAM: { tube: "Gold", name: "Cortisol (AM)" },
  CORTIPM: { tube: "Gold", name: "Cortisol (PM)" },
  CREA: { tube: "Gold", name: "Créatinine" },
  CRP: { tube: "Gold", name: "Protéine C-Réactive (CRP)" },
  CRPHS: { tube: "Gold", name: "CRP Haute Sensibilité" },
  COPPERWB: { tube: "Royal Blue", name: "Cuivre (Sang Total)" },
  DHEA: { tube: "Gold", name: "DHEA" },
  DHEAS: { tube: "Gold", name: "DHEA-Sulfate" },
  DIG: { tube: "Red", name: "Digoxine" },
  DHT: { tube: "Gold", name: "Dihydrotestostérone" },
  DIL: { tube: "Red", name: "Dilantin (Phénytoïne)" },
  LYTES: { tube: "Gold", name: "Électrolytes (Na, K, Cl)" },
  ELEPRO: { tube: "Gold", name: "Électrophorèse des protéines (Sérum)" },
  ESTRA: { tube: "Gold", name: "Estradiol" },
  ESTRON: { tube: "Gold", name: "Estrone" },
  FE: { tube: "Gold", name: "Fer" },
  FERI: { tube: "Gold", name: "Ferritine" },
  FIBR: { tube: "Light Blue", name: "Fibrinogène" },
  FOL: { tube: "Gold", name: "Folate (Sérique)" },
  FOLRBC: { tube: "Lavender", name: "Folates Érythrocytaires" },
  CBC: { tube: "Lavender", name: "Formule Sanguine Complète (FSC)" },
  FSH: { tube: "Gold", name: "FSH" },
  GGT: { tube: "Gold", name: "GGT" },
  AC: { tube: "Gold", name: "Glucose (À Jeun/AC)" },
  ACP: { tube: "Gold", name: "Glucose (Aléatoire)" },
  GLU75: { tube: "Gold", name: "Glucose 75g (2h) - Non Gestationnel" },
  PREG50: { tube: "Gold", name: "Glucose 50g (1h) - Gestationnel" },
  PREG75: { tube: "Gold", name: "Glucose 75g (2h) - Gestationnel" },
  BLOOD: { tube: "Pink", name: "Groupe Sanguin & Rh" },
  HBA1C: { tube: "Lavender", name: "HbA1c" },
  HBS: { tube: "Gold", name: "Hépatite B (HBsAg)" },
  ANHBS: { tube: "Gold", name: "Hépatite B (Anti-HBs)" },
  HEPBC: { tube: "Gold", name: "Hépatite B (Anti-HBc Total)" },
  HEPC: { tube: "Gold", name: "Hépatite C (Anticorps)" },
  HEPCQUANT: { tube: "Gold", name: "Hépatite C (Charge Virale Quant.)" },
  HIV: { tube: "Gold", name: "HIV (Dépistage)" },
  HIVCV: { tube: "Lavender", name: "HIV Charge Virale" },
  LHOMO: { tube: "Lavender", name: "Homocystéine" },
  HGH: { tube: "Gold", name: "Hormone de Croissance (GH)" },
  IGE: { tube: "Gold", name: "IgE Totale" },
  IMQUANT: { tube: "Gold", name: "Immunoglobulines (IgG, IgA, IgM)" },
  PT: { tube: "Light Blue", name: "INR (Rapport International Normalisé)" },
  INSUL: { tube: "Gold", name: "Insuline" },
  LD: { tube: "Gold", name: "Lactate Déshydrogénase (LDH)" },
  LH: { tube: "Gold", name: "LH" },
  LIP: { tube: "Gold", name: "Lipase" },
  LI: { tube: "Gold", name: "Lithium" },
  MG: { tube: "Gold", name: "Magnésium" },
  MONO: { tube: "Gold", name: "Mononucléose (Monotest)" },
  OSM: { tube: "Gold", name: "Osmolalité (Sérum)" },
  PTH: { tube: "Lavender", name: "Parathormone (PTH)" },
  PHOS: { tube: "Gold", name: "Phosphore" },
  PbO: { tube: "Royal Blue", name: "Plomb (Sang)" },
  K: { tube: "Gold", name: "Potassium" },
  PROG: { tube: "Gold", name: "Progestérone" },
  PROL: { tube: "Gold", name: "Prolactine" },
  PSA: { tube: "Gold", name: "PSA Total" },
  FPSA: { tube: "Gold", name: "PSA Libre (avec Total)" },
  PROT: { tube: "Gold", name: "Protéines Totales" },
  PTT: { tube: "Light Blue", name: "PTT (TCA)" },
  QTB: { tube: "TB Kit", name: "QuantiFERON-TB Gold" },
  RETICP: { tube: "Lavender", name: "Réticulocytes" },
  RF: { tube: "Gold", name: "Rhumatoïde (Facteur)" },
  RUB: { tube: "Gold", name: "Rubéole IgG" },
  SED: { tube: "Lavender", name: "Sédimentation (Vitesse)" },
  NA: { tube: "Gold", name: "Sodium" },
  SYPH: { tube: "Gold", name: "Syphilis (Dépistage)" },
  T3F: { tube: "Gold", name: "T3 Libre" },
  T4F: { tube: "Gold", name: "T4 Libre" },
  TEST: { tube: "Gold", name: "Testostérone Totale" },
  TESBIO: { tube: "Gold", name: "Testostérone Biodisponible" },
  TESLI: { tube: "Gold", name: "Testostérone Libre" },
  THYRO: { tube: "Gold", name: "Thyroglobuline" },
  TRANS: { tube: "Gold", name: "Transferrine" },
  TRIG: { tube: "Gold", name: "Triglycérides" },
  TSH: { tube: "Gold", name: "TSH" },
  UREA: { tube: "Gold", name: "Urée" },
  URIC: { tube: "Gold", name: "Acide Urique" },
  B12: { tube: "Gold", name: "Vitamine B12" },
  VITD: { tube: "Gold", name: "Vitamine D (25-OH)" },
  ZINCWB: { tube: "Royal Blue", name: "Zinc (Sang Total)" },
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Types for raw PDF-extracted data ────────────────────────────────────
// Field names match PDF source. Mapped to schema fields during insertion:
//   specimen → Test.tubeType
//   type     → Test.category
type RawTest = {
  code: string;
  name: string;
  description: string;
  specimen: string;
  price: number;
  turnaroundTime: string;
  type: "profile" | "individual";
};

// ── CDL Tests (478 tests extracted from CDL catalogue PDF) ────────────
const cdlTests: RawTest[] = [
  // --- PROFILES ---
  {
    code: 'URC+',
    name: 'ANALYSE ET CULTURE D\'URINE',
    description: 'Analyse d\'urine, culture d\'urine.',
    specimen: 'Urine mi-jet (min. 15 mL) - contenant stérile ou Tube vert pois + jaune',
    price: 90.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },
  {
    code: 'FA12',
    name: 'VITAMINE B12 ET ACIDE FOLIQUE',
    description: 'Vitamine B12, acide folique.',
    specimen: 'Sérum - tube SST',
    price: 140.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'IRN2',
    name: 'FER #2',
    description: 'FSC, ferritine.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 125.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'IRON',
    name: 'FER',
    description: 'Fer total, % de saturation, UIBC, TIBC.',
    specimen: 'Sérum - tube SST',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'IRN6',
    name: 'FER #6',
    description: 'PROFIL FER [IRON] + ferritine.',
    specimen: 'Sérum - tube SST',
    price: 145.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'IRN1',
    name: 'FER #1',
    description: 'PROFIL FER [IRON] + FSC, ferritine.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 165.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ANE1',
    name: 'ANÉMIE #1',
    description: 'PROFIL FER [IRON] + FSC, réticulocytes.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 155.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ANE4',
    name: 'ANÉMIE #4',
    description: 'PROFIL FER [IRON] + FSC, réticulocytes, ferritine.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 210.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ANE3',
    name: 'ANÉMIE #3',
    description: 'PROFIL FER [IRON] + FSC, acide folique, réticulocytes, vitamine B12, ferritine.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 260.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'IRN3',
    name: 'FER #3',
    description: 'PROFIL FER [IRON] + FSC, acide folique, vitamine B12, ferritine.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 235.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'B2GP',
    name: 'BETA 2 GLYCOPROTÉINE I ANTICORPS',
    description: 'Beta-2 glycoprotéine I, IgA/IgG/IgM',
    specimen: 'Sérum - 2 tubes SST',
    price: 155.00,
    turnaroundTime: '9 jours',
    type: 'profile'
  },
  {
    code: 'DIAB',
    name: 'DIABÉTIQUE #1',
    description: 'Glucose, hémoglobine A1c (glyquée).',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 105.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'LIV1',
    name: 'HÉPATIQUE #1',
    description: 'Phosphatase alcaline, ALT, AST, GGT, bilirubine totale.',
    specimen: 'Sérum - tube SST',
    price: 115.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'PANC',
    name: 'PANCRÉATIQUE',
    description: 'Amylase, lipase.',
    specimen: 'Sérum - tube SST',
    price: 90.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'REN2',
    name: 'RÉNAL #2',
    description: 'Sodium, potassium, chlorure, urée, créatinine.',
    specimen: 'Sérum - tube SST',
    price: 105.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'BIO1',
    name: 'BIOCHIMIE #1A',
    description: 'Glucose, urée, créatinine, ALT, acide urique, électrolytes.',
    specimen: 'Sérum - tube SST',
    price: 115.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHM1',
    name: 'BIOCHIMIE #1B',
    description: 'Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales.',
    specimen: 'Sérum - tube SST',
    price: 115.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHM2',
    name: 'BIOCHIMIE #2',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore.',
    specimen: 'Sérum - tube SST',
    price: 125.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHM5',
    name: 'BIOCHIMIE #2 AVEC ELECTROLYTES',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes.',
    specimen: 'Sérum - tube SST',
    price: 140.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHL3',
    name: 'BIOCHIMIE #3 AVEC ELECTROLYTES',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides.',
    specimen: 'Sérum - tube SST',
    price: 160.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHP3',
    name: 'GENERAL BIOCHEMISTRY #3',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, FSC, analyse d\'urine.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 210.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'BIO3',
    name: 'BIOCHIMIE #3',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, LDH, globulines.',
    specimen: 'Sérum - tube SST',
    price: 155.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHM4',
    name: 'BIOCHIMIE #4',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque.',
    specimen: 'Sérum - tube SST',
    price: 155.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHL4',
    name: 'BIOCHIMIE #4 AVEC ÉLECTROLYTES',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque.',
    specimen: 'Sérum - tube SST',
    price: 170.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'BIO4',
    name: 'BIOCHIMIE #4 COMPLET',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, globulines, LDH.',
    specimen: 'Sérum - tube SST',
    price: 170.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CH4U',
    name: 'COMPLETE BIOCHEMISTRY, WITHOUT URINE',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphate, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, FSC.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 215.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHP4',
    name: 'COMPLETE BIOCHEMISTRY',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, FSC, analyse d\'urine.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 230.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHP4T',
    name: 'COMPLETE BIOCHEMISTRY GENERAL & TSH',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, FSC, analyse d\'urine, TSH.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 300.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHP4A',
    name: 'COMPLETE BIOCHEMISTRY + TSH & PSA',
    description: 'PROFIL BIOCHIMIE #1B [CHM1] + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL + facteurs de risque, FSC, analyse d\'urine, TSH, APS.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 320.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'COAG',
    name: 'COAGULOGRAMME',
    description: 'FSC, fibrinogène, PT/INR, PTT.',
    specimen: 'Sang entier - tube lavande et Plasma (tube bleu)',
    price: 155.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'PTPT',
    name: 'PT ET PTT',
    description: 'PT/INR, PTT.',
    specimen: 'Sang entier - tube bleu',
    price: 70.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'PAPTHPV',
    name: 'TEST PAP THIN PREP + HPV DNA',
    description: 'Test Pap ThinPrep et virus du papillome humain (VPH).',
    specimen: 'Contenant ThinPrep™',
    price: 245.00,
    turnaroundTime: '6 jours',
    type: 'profile'
  },
  {
    code: 'PVTP',
    name: 'VPH DNA, TEST PAP THINPREP EN CASCADE',
    description: 'Virus du papillome humain (VPH), test Pap ThinPrep en cascade.',
    specimen: 'Contenant ThinPrep™',
    price: 185.00,
    turnaroundTime: '6 jours',
    type: 'profile'
  },
  {
    code: 'TPPV',
    name: 'TEST PAP THIN PREP, VPH DNA EN CASCADE',
    description: 'Test Pap ThinPrep, virus du papillome humain (VPH) en cascade.',
    specimen: 'Contenant ThinPrep™',
    price: 170.00,
    turnaroundTime: '6 jours',
    type: 'profile'
  },
  {
    code: 'PREN',
    name: 'PRÉNATAL #1',
    description: 'FSC, groupe sanguin & Rh, hépatite B antigène de surface, syphilis, rubéole IgG, recherche d\'anticorps.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Sang entier - tube rose',
    price: 285.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'PRENG',
    name: 'PRÉNATAL, GLUCOSE AC',
    description: 'PROFIL PRÉNATAL #1 [PREN] + glucose AC.',
    specimen: 'Sérum - 2 tubes SST, Sang entier - tube lavande, Sang entier - tube rose',
    price: 300.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'DAL2',
    name: 'PRÉNATAL #3',
    description: 'PROFIL PRÉNATAL #1 [PREN] + VIH, analyse, culture d\'urine.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Sang entier - tube rose, Urine mi-jet',
    price: 390.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },
  {
    code: 'DAL2G',
    name: 'PRÉNATAL #3, GLUCOSE',
    description: 'PROFIL PRÉNATAL #1 [PREN] + VIH, analyse d\'urine, culture d\'urine, glucose.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Sang entier - tube rose, Urine mi-jet',
    price: 410.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },
  {
    code: 'PANO',
    name: 'PANORAMA®',
    description: 'Dépistage prénatal des troubles génétiques via ADN placentaire.',
    specimen: 'Trousse spéciale (commander à CDL)',
    price: 610.00,
    turnaroundTime: '10 jours',
    type: 'profile'
  },
  {
    code: 'PANOE',
    name: 'PANORAMA® ET MICRODÉLÉTIONS',
    description: 'Panorama approfondit (Microdélétions: 22q11.2, 1p36, Angelman, Prader-Willi, Cri-du-chat).',
    specimen: 'Trousse spéciale (commander à CDL)',
    price: 810.00,
    turnaroundTime: '10 jours',
    type: 'profile'
  },
  {
    code: 'HARMP',
    name: 'HARMONY®',
    description: 'Dépistage prénatal des troubles génétiques via ADN placentaire',
    specimen: 'Trousse spéciale (commander à CDL)',
    price: 555.00,
    turnaroundTime: '10 jours',
    type: 'profile'
  },
  {
    code: 'DRUGH',
    name: 'DROGUES DANS LES CHEVEUX',
    description: 'Amphétamines, cannabis, cocaïne, opiaciés, phencyclidine.',
    specimen: 'Cheveux',
    price: 270.00,
    turnaroundTime: '6 jours',
    type: 'profile'
  },
  {
    code: 'DAU450',
    name: 'DROGUES 4 TESTS #1',
    description: 'Amphétamines (1000 ng/mL), cannabis (50 ng/mL), cocaïne (300 ng/mL), opiaciés (300 ng/mL).',
    specimen: 'Trousse de dépistage de drogues (Urine)',
    price: 195.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'DAUP',
    name: 'DROGUES 5 TESTS #1',
    description: 'PROFIL DROGUES 4 TESTS #1 [DAU450] + éthanol (3 mmol/L).',
    specimen: 'Trousse de dépistage de drogues (Urine)',
    price: 205.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'DAUB50',
    name: 'DROGUES 5 TESTS #2',
    description: 'PROFIL DROGUES 4 TESTS #1 [DAU450] + phencyclidine (25 ng/mL).',
    specimen: 'Trousse de dépistage de drogues (Urine)',
    price: 200.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ENDPE',
    name: 'ÉCHOGRAPHIE ENDOVAGINALE ET PELVIENNE',
    description: 'N/A',
    specimen: 'Sur rendez-vous',
    price: 190.00,
    turnaroundTime: '5 jours',
    type: 'profile'
  },
  {
    code: 'ENDV',
    name: 'ÉCHOGRAPHIE ENDOVAGINALE',
    description: 'N/A',
    specimen: 'Sur rendez-vous',
    price: 185.00,
    turnaroundTime: '5 jours',
    type: 'profile'
  },
  {
    code: '1TRI',
    name: 'ÉCHOGRAPHIE OBSTÉTRICALE, 1er Trimestre',
    description: 'Entre 11.3 et 13.6 semaines de grossesse.',
    specimen: 'Sur rendez-vous',
    price: 175.00,
    turnaroundTime: '5 jours',
    type: 'profile'
  },
  {
    code: '2TRI',
    name: 'ÉCHOGRAPHIE OBSTÉTRICALE, 2ème Trimestre',
    description: 'Entre 18 semaines et 22.6 semaines de grossesse.',
    specimen: 'Sur rendez-vous',
    price: 235.00,
    turnaroundTime: '3 jours',
    type: 'profile'
  },
  {
    code: '3TRI',
    name: 'ÉCHOGRAPHIE OBSTÉTRICALE, 3ème Trimestre',
    description: 'Après 34 semaines de grossesse.',
    specimen: 'Sur rendez-vous',
    price: 235.00,
    turnaroundTime: '3 jours',
    type: 'profile'
  },
  {
    code: 'VIAB',
    name: 'ÉCHOGRAPHIE DE VIABILITÉ-DATATION',
    description: 'N/A',
    specimen: 'Sur rendez-vous',
    price: 155.00,
    turnaroundTime: '3 jours',
    type: 'profile'
  },
  {
    code: 'FERT',
    name: 'FERTILITÉ #1',
    description: 'FSH, LH.',
    specimen: 'Sérum - tube SST',
    price: 150.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'MEN1',
    name: 'MÉNOPAUSE #1',
    description: 'PROFIL FERTILITÉ #1 [FERT] + estradiol.',
    specimen: 'Sérum - tube SST',
    price: 205.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'MEN3',
    name: 'MÉNOPAUSE #3',
    description: 'PROFIL FERTILITÉ #1 [FERT] + estradiol, progestérone.',
    specimen: 'Sérum - tube SST',
    price: 240.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'MEN2',
    name: 'MÉNOPAUSE #2',
    description: 'PROFIL FERTILITÉ #1 [FERT] + estradiol, DHEA-S, progestérone.',
    specimen: 'Sérum - tube SST',
    price: 300.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'MEN4',
    name: 'MÉNOPAUSE #4',
    description: 'PROFIL FERTILITÉ #1 [FERT] + estradiol, DHEA-s, testosterone totale, prolactine, androstenedione.',
    specimen: 'Sérum - tube SST et Sérum - tube rouge',
    price: 400.00,
    turnaroundTime: '7 jours',
    type: 'profile'
  },
  {
    code: 'THY1R',
    name: 'THYROÏDE #1, CASCADE',
    description: 'TSH, T4 libre sera effectuée si le TSH anormal',
    specimen: 'Sérum - tube SST',
    price: 145.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'THY3R',
    name: 'THYROÏDE #3, CASCADE',
    description: 'TSH, T4 libre et T3 libre seront effectuées d\'emblée si le TSH anormal.',
    specimen: 'Sérum - tube SST',
    price: 140.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'THY1',
    name: 'THYROÏDE #1',
    description: 'TSH, T4 libre',
    specimen: 'Sérum - tube SST',
    price: 150.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'THY3',
    name: 'THYROÏDE #3',
    description: 'PROFIL THYROÏDE #1 [THY1] + T3 libre',
    specimen: 'Sérum - tube SST',
    price: 210.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'THY4',
    name: 'THYROÏDE #4',
    description: 'PROFIL THYROÏDE #1 [THY1] + T3 libre, anticorps thyroïdiens.',
    specimen: 'Sérum - tube SST',
    price: 250.00,
    turnaroundTime: '6 jours',
    type: 'profile'
  },
  {
    code: 'CH3U',
    name: 'GÉNÉRAL #3, SANS URINE',
    description: 'Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, acide urique, phosphore, cholestérol total, triglycérides.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 180.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHP1',
    name: 'GÉNÉRAL #1',
    description: 'Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, analyse d\'urine.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 185.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'FIN1',
    name: 'GÉNÉRAL #1, CRP',
    description: 'PROFIL GÉNÉRAL #1 [CHP1] + protéine C-réactive.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 215.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CHP2',
    name: 'GÉNÉRAL #2',
    description: 'PROFIL GÉNÉRAL #1 [CHP1] + acide urique, phosphore.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 205.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CH4SC',
    name: 'COMPLET, CRP ULTRASENSIBLE',
    description: 'PROFIL GÉNÉRAL #1 [CHP1] + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, protéine C-réactive ultra-sensible.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 245.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'GN5',
    name: 'GÉNÉRAL #5',
    description: 'PROFIL GÉNÉRAL #1 [CHP1] + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, LDH, globulines.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 235.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'PNL6',
    name: 'GÉNÉRAL #6',
    description: 'PROFIL GÉNÉRAL #1 [CHP1] + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, LDH.',
    specimen: 'Sérum - tube SST, Sang entier - tube lavande, Urine mi-jet',
    price: 220.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CBCS',
    name: 'FORMULE SANGUINE COMPLÈTE ET SÉDIMENTATION',
    description: 'Formule sanguine complète, sédimentation.',
    specimen: 'Sang entier - tube lavande',
    price: 98.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'MON+',
    name: 'MONOTEST #1',
    description: 'Formule sanguine complète, monotest.',
    specimen: 'Sérum - tube SST et Sang entier - tube lavande',
    price: 120.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CELP',
    name: 'MALADIE COELIAQUE',
    description: 'Albumine, électrophorèse des protéines (serum), anti-gliadine IgA, immunoglobulines IgA, anti-transglutaminase IgA.',
    specimen: 'Sérum - tube SST',
    price: 365.00,
    turnaroundTime: '6 jours',
    type: 'profile'
  },
  {
    code: 'CVRK',
    name: 'RISQUE CARDIOVASCULAIRE #1',
    description: 'Cholestérol, triglycérides, HDL & LDL, non-HDL, facteurs de risque.',
    specimen: 'Sérum - tube SST',
    price: 95.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CVK2',
    name: 'RISQUE CARDIOVASCULAIRE #2 PLUS APOB',
    description: 'PROFIL RISQUE CARDIOVASCULAIRE #1 [CVRK] + apolipoprotéine B.',
    specimen: 'Sérum - tube SST',
    price: 155.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CCL4',
    name: 'CCL4',
    description: 'PROFIL RISQUE CARDIOVASCULAIRE #1 [CVRK] + ALT, CK',
    specimen: 'Sérum - tube SST',
    price: 150.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CGPCR1',
    name: 'CHLAMYDIA ET GONORRHÉE PAR PCR (1 échantillon)',
    description: 'Chlamydia par PCR, gonorrhée par PCR',
    specimen: 'Tube PCR ou Urine premier jet',
    price: 145.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },
  {
    code: 'CGPCR2',
    name: 'CHLAMYDIA ET GONORRHÉE PAR PCR (2 échantillons)',
    description: 'Chlamydia par PCR, gonorrhée par PCR',
    specimen: 'Tube PCR ou Urine premier jet',
    price: 230.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },
  {
    code: 'CGPCR3',
    name: 'CHLAMYDIA ET GONORRHÉE PAR PCR (3 échantillons)',
    description: 'Chlamydia par PCR, gonorrhée par PCR',
    specimen: 'Tube PCR ou Urine premier jet',
    price: 310.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },
  {
    code: 'HPBA',
    name: 'HÉPATITE B AIGÜE',
    description: 'Hépatite B antigène de surface, hépatite B anticorps de surface, hépatite B anticorps total.',
    specimen: 'Sérum - tube SST',
    price: 225.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'STD2',
    name: 'MTS #2, FEMME',
    description: 'Chlamydia et gonorrhée par PCR, culture vaginale.',
    specimen: 'Écouvillon double, Tube PCR ou Urine premier jet',
    price: 210.00,
    turnaroundTime: '4 jours',
    type: 'profile'
  },
  {
    code: 'STDMH',
    name: 'MTS #1, VIH - HOMME',
    description: 'Chlamydia et gonorrhée par PCR, syphilis PCR, VIH',
    specimen: 'Sérum - tube SST, Tube PCR ou Urine premier jet',
    price: 255.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },

  // --- INDIVIDUAL TESTS ---
  {
    code: 'HIAA',
    name: '5\'HIAA',
    description: 'Acide 5-hydroxyindolacétique',
    specimen: 'Urine 24h avec préservatif (HCL 6N)',
    price: 110.00,
    turnaroundTime: '5-9 jours',
    type: 'individual'
  },
  {
    code: 'ACBA',
    name: 'ACETYLCHOLINE, ANTICORPS BLOQUANTS',
    description: 'Anticorps bloquants anti-récepteurs de l\'acétylcholine',
    specimen: 'Sérum - 1 tube SST',
    price: 225.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'ACRA',
    name: 'ACETYLCHOLINE, ANTICORPS LIANT',
    description: 'Anticorps liant anti-récepteurs de l\'acétylcholine',
    specimen: 'Sérum - 1 tube SST',
    price: 200.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'ACMA',
    name: 'ACETYLCHOLINE, MODULATEURS D\'ANTICORPS',
    description: 'Anticorps modulateurs anti-récepteurs de l\'acétylcholine',
    specimen: 'Sérum - 1 tube SST',
    price: 270.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'FOLC',
    name: 'ACIDE FOLIQUE',
    description: 'Folate, vitamine B9',
    specimen: 'Sérum - 1 tube SST',
    price: 82.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'MMAS',
    name: 'ACIDE MÉTHYLMALONIQUE, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 250.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'URIC',
    name: 'ACIDE URIQUE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UA/U',
    name: 'ACIDE URIQUE, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Urine 24h avec préservatif (NaOH)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'VALP',
    name: 'ACIDE VALPROÏQUE',
    description: 'Épival',
    specimen: 'Sérum - 1 tube rouge',
    price: 78.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ADUL',
    name: 'ADALIMUMAB',
    description: 'N/A',
    specimen: 'Sérum - 2 tubes rouge',
    price: 500.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'ALB',
    name: 'ALBUMINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AGR',
    name: 'ALBUMINE / GLOBULINES RATIO',
    description: 'Inclut protéines totales et albumine.',
    specimen: 'Sérum - 1 tube SST',
    price: 70.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ADLASE',
    name: 'ALDOLASE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 102.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'ALDO',
    name: 'ALDOSTÉRONE',
    description: 'N/A',
    specimen: 'Plasma (tube lavande) ou Sérum (tube rouge) - SANS GEL',
    price: 115.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'A1AT',
    name: 'ALPHA 1 ANTITRYPSINE',
    description: 'Inhibiteur Alpha 1 Antiprotéase',
    specimen: 'Sérum - 1 tube SST',
    price: 100.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'AFP',
    name: 'ALPHAFÉTOPROTÉINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ALT',
    name: 'ALT',
    description: 'GPT, SGPT',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AL',
    name: 'ALUMINIUM, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 93.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'AMPH',
    name: 'AMPHETAMINE',
    description: '1000 ng/mL',
    specimen: 'Trousse de dépistage de drogues',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AMYL',
    name: 'AMYLASE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ANDR',
    name: 'ANDROSTÉNÉDIONE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube rouge (SANS GEL)',
    price: 125.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'APA',
    name: 'ANTI-CELLULES PARIÉTALES, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 107.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'CENP',
    name: 'ANTI-CENP',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 215.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'ADNAB',
    name: 'ANTICORPS SURRÉNALES',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 195.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'ANCAP',
    name: 'ANTI-CYTOPLASME DES NEUTROPHILES, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 320.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'BDNA',
    name: 'ANTI-DNASE B',
    description: 'DNase B',
    specimen: 'Sérum - 1 tube SST',
    price: 210.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'DNA',
    name: 'ANTI-ADNdb',
    description: 'Anticorps anti-ADN Double Brin',
    specimen: 'Sérum - 1 tube SST',
    price: 160.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'AEML',
    name: 'ANTI-ENDOMYSIAUX, ANTICORPS (IgA)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 150.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'GAD',
    name: 'ANTI-GAD AUTO-ANTICORPS',
    description: 'Acide Glutamique Decarboxylase (GAD)',
    specimen: 'Sérum - 1 tube SST',
    price: 200.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'GLIA',
    name: 'ANTI-GLIADINE IGA',
    description: 'Gliadine IgA, Maladie coeliaque',
    specimen: 'Sérum - 1 tube SST',
    price: 95.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'GLIG',
    name: 'ANTI-GLIADINE IGG',
    description: 'Gliadine IgG, maladie coeliaque',
    specimen: 'Sérum - 1 tube SST',
    price: 113.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'ALKM',
    name: 'ANTI-LKM, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 115.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'AMA',
    name: 'ANTI-MITOCHONDRIES, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 105.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'ASA',
    name: 'ANTI-MUSCLE LISSE, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 105.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'ANA',
    name: 'ANTI-NUCLÉAIRE, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 95.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'ENA',
    name: 'ANTI-NUCLÉAIRES EXTRACTABLES (DÉPISTAGE)',
    description: 'N/A',
    specimen: 'Sérum - 2 tubes SST',
    price: 235.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'PHOA',
    name: 'ANTIPHOSPHOLIPINE IGA',
    description: 'Anticardiolipide IgA',
    specimen: 'Sérum - 1 tube SST',
    price: 125.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'PHOG',
    name: 'ANTIPHOSPHOLIPINE IGG',
    description: 'Anticardiolipide IgG',
    specimen: 'Sérum - 1 tube SST',
    price: 110.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'PHOM',
    name: 'ANTIPHOSPHOLIPINE IGM',
    description: 'Anticardiolipide IgM',
    specimen: 'Sérum - 1 tube SST',
    price: 110.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'PHOS',
    name: 'ANTIPHOSPHOLIPINE IGM, IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 130.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'PHOP',
    name: 'ANTIPHOSPHOLIPINE IGM, IGG, IGA',
    description: 'N/A',
    specimen: 'Sérum - 2 tubes SST',
    price: 175.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'ASOT',
    name: 'ANTISTREPTOLYSINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 60.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AT3A',
    name: 'ANTITHROMBINE III, ANTIGÈNE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 100.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'AT3F',
    name: 'ANTITHROMBINE III, FONCTIONNELLE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 113.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'TPO',
    name: 'ANTI TPO',
    description: 'Anti-Microsome, anti-thyroperoxydase',
    specimen: 'Sérum - 1 tube SST',
    price: 90.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'TRSG',
    name: 'ANTI-TRANSGLUTAMINASE IGA',
    description: 'Transglutaminase IgA, TTG',
    specimen: 'Sérum - 1 tube SST',
    price: 200.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'GTTG',
    name: 'ANTI-TRANSGLUTAMINASE IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 150.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'APOA',
    name: 'APOLIPOPROTÉINE A-1',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 95.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'APOB',
    name: 'APOLIPOPROTÉINE B',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 87.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'APOE',
    name: 'APOLIPOPROTÉINE E',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande',
    price: 345.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'BARS',
    name: 'ARSENIC, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 108.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'AST',
    name: 'AST (GOT, SGOT)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CTTBP',
    name: 'BACILLE DE KOCH, CULTURE',
    description: 'TB, Tuberculose',
    specimen: 'Crachat (min. 1mL) - 3 contenants stériles',
    price: 200.00,
    turnaroundTime: '60 jours',
    type: 'individual'
  },
  {
    code: 'UBAR',
    name: 'BARBITURIQUE (200 ng/ml)',
    description: 'N/A',
    specimen: 'Urine - Trousse de dépistage de drogues',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BENZ',
    name: 'BENZODIAZÉPINE (200 ng/ml)',
    description: 'N/A',
    specimen: 'Trousse de dépistage de drogues',
    price: 72.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'B2MG',
    name: 'BÉTA-2 MICROGLOBULINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 58.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'DBIL',
    name: 'BILIRUBINE, DIRECTE',
    description: 'Bilirubine conjuguée',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'IBIL',
    name: 'BILIRUBINE, INDIRECTE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 83.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'BHCG',
    name: 'BÉTA-HCG INTACTE (QUANTITATIF)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 83.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TBIL',
    name: 'BILIRUBINE, TOTALE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PREG',
    name: 'BÉTA-HCG QUALITATIF, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 80.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BIOP',
    name: 'BIOPSIE',
    description: 'Indiquer la/les source(s) d\'échantillon(s) et information clinique.',
    specimen: 'Contenant(s) stérile (avec formaline)',
    price: 220.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CO2P',
    name: 'BICARBONATE ET CO2 TOTAL',
    description: 'Garder le tube fermé jusqu\'à l\'analyse.',
    specimen: 'Sang entier - 1 tube vert',
    price: 62.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BORP',
    name: 'BORDETELLA PERTUSSIS ET PARAPERTUSSIS',
    description: 'Coqueluche',
    specimen: 'Écouvillon nasopharyngé ou nasal avec medium de transport',
    price: 180.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'C125',
    name: 'CA-125',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 110.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BRCA1/2',
    name: 'BRCA 1/2 SEQUENÇAGE, DÉLÉTION ET DUPLICATION',
    description: 'Joindre le formulaire de consentement.',
    specimen: 'Sang entier - 3 tubes lavande',
    price: 1415.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'CD',
    name: 'CADMIUM, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 185.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CLTN',
    name: 'CALCITONINE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 125.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'C1EI',
    name: 'C1 INHIBITEUR ESTÉRASE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 115.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'CA',
    name: 'CALCIUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'C153',
    name: 'CA 15-3',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 120.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CACR',
    name: 'CALCIUM / CRÉATININE RATIO',
    description: 'Ce test inclut les analyses calcium et créatinine dans l\'urine.',
    specimen: 'Urine aléatoire (min. 5mL)',
    price: 60.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'C199',
    name: 'CA 19-9',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 150.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'CAIP',
    name: 'CALCIUM IONISÉ',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube vert plein',
    price: 83.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CN20',
    name: 'CANNABIS (20 ng/mL, 50 ng/mL)',
    description: 'Marijuana, THC',
    specimen: 'Trousse de dépistage de drogues',
    price: 80.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CA/U',
    name: 'CALCIUM, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures avec préservatif (HCL 6N)',
    price: 55.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CALU',
    name: 'CALCUL, ANALYSE DE',
    description: 'Indiquer le type de calcul sur la requête.',
    specimen: 'Contenant stérile',
    price: 150.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'CARM',
    name: 'CARBAMAZÉPINE',
    description: 'Tégrétol',
    specimen: 'Sérum - 1 tube rouge',
    price: 83.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CEA',
    name: 'CARCINO-EMBRYONIQUE ANTIGÈNE (CEA)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 103.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CLPTN',
    name: 'CALPROTECTINE',
    description: 'N/A',
    specimen: 'Échantillon de selles - contenant stérile bleu',
    price: 155.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'UCAT',
    name: 'CATÉCHOLAMINES URINAIRE, 24H',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures avec préservatif (HCL 6N)',
    price: 200.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'CATS',
    name: 'CATÉCHOLAMINES, PLASMA',
    description: 'Dopamine. Offert au siège social CDL seulement.',
    specimen: 'Jeun durant la nuit est recommandé.',
    price: 295.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'FKLP',
    name: 'CHAÎNES LÉGÈRES KAPPA ET LAMBDA LIBRE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 200.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'CD3',
    name: 'CD3, CD4, CD8',
    description: 'Inclut FSC.',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 140.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'CMPC',
    name: 'CHLAMYDIA PAR PCR',
    description: 'CERVICAL / GORGE',
    specimen: 'Trousse PCR',
    price: 125.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'CUBP',
    name: 'CÉRULOPLASMINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 85.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'KLCF',
    name: 'CHAÎNES LÉGÈRES KAPPA LIBRE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 190.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'CMPCR',
    name: 'CHLAMYDIA PAR PCR, RECTAL (INCLUANT LGV)',
    description: 'N/A',
    specimen: 'Trousse PCR',
    price: 130.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'CMPCU',
    name: 'CHLAMYDIA URINE',
    description: 'N/A',
    specimen: 'Urine premier jet (min. 10 mL) - contenant d\'urine stérile',
    price: 125.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'LLCF',
    name: 'CHAÎNES LÉGÈRES LAMBDA LIBRE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 100.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'NHDL',
    name: 'CHOLESTÉROL NON HDL',
    description: 'Il sagit d\'un calcul (CHOL - HDL)',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CL',
    name: 'CHLORURE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UCL',
    name: 'CHLORURE, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures (sans préservatif)',
    price: 47.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CHOL',
    name: 'CHOLESTÉROL, TOTAL',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CR',
    name: 'CHROME, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 135.00,
    turnaroundTime: '4-5 jours',
    type: 'individual'
  },
  {
    code: 'SCHL',
    name: 'CHOLÉRA, TEST (SELLES)',
    description: 'N/A',
    specimen: 'Échantillons de selles - contenant stérile',
    price: 165.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'HDL',
    name: 'CHOLESTÉROL HDL',
    description: 'N/A',
    specimen: 'Sérum-1 tube SST',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'LDLD',
    name: 'CHOLESTÉROL LDL',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 55.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CGA',
    name: 'CHROMOGRANINE A',
    description: 'N/A',
    specimen: 'Serum - 2 tubes rouge',
    price: 290.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'CHYL',
    name: 'CHYLOMICRONS',
    description: 'Prélever un tube supplémentaire si d\'autres analyses sont demandées.',
    specimen: 'Sérum - 1 tube SST',
    price: 55.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'CO',
    name: 'COBALT, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 150.00,
    turnaroundTime: '3-6 jours',
    type: 'individual'
  },
  {
    code: 'CI/U',
    name: 'CITRATE, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures (sans preservatif)',
    price: 120.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'CKMB',
    name: 'CK-MB',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 95.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'COKE',
    name: 'COCAÏNE',
    description: '$150ng/mL (COK150) / $300ng/mL (COKE)',
    specimen: 'Trousse de dépistage de drogues',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CTCL',
    name: 'CLAIRANCE DE LA CRÉATININE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST et Contenant d\'urine 24 heures (sans preservatif)',
    price: 79.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CDIF',
    name: 'CLOSTRIDIUM DIFFICILE, GÈNE DE LA TOXINE',
    description: 'C. Difficile, Toxine C. Difficile',
    specimen: 'Échantillon de selles - contenant de selles',
    price: 140.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'C1Q',
    name: 'COMPLÉMENT C1Q',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 165.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'C3',
    name: 'COMPLÉMENT C3',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'C4',
    name: 'COMPLÉMENT C4',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CPEP',
    name: 'C-PEPTIDE',
    description: 'Rejet: hémolyse, plasma',
    specimen: 'Sérum - 1 tube SST',
    price: 72.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CH50',
    name: 'COMPLÉMENT HÉMOLYTIQUE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 115.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'CK',
    name: 'CRÉATINE KINASE',
    description: 'CK, CPK',
    specimen: 'Sérum - 1 tube SST',
    price: 70.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'DCOM',
    name: 'COOMBS, DIRECT',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CREA',
    name: 'CRÉATININE, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST',
    price: 55.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'SCORT',
    name: 'CORTISOL AM/PM',
    description: 'Cortisol AM: 6:00 - 10:00. Cortisol PM: 16:00 - 20:00.',
    specimen: 'Sérum - 1 tube SST',
    price: 83.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CRYO',
    name: 'CRYOGOBULINE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 160.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'CORU',
    name: 'CORTISOL, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures (sans préservatif)',
    price: 100.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'CTPP',
    name: 'C-TÉLOPEPTIDES',
    description: 'Télopeptides C-terminaux (CTx), Cross-laps',
    specimen: 'Sang entier - 1 tube rouge',
    price: 150.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'CURBC',
    name: 'CUIVRE, GLOBULES ROUGES',
    description: 'N/A',
    specimen: 'Globules rouges - 1 tube bleu foncé',
    price: 120.00,
    turnaroundTime: '2-7 jours',
    type: 'individual'
  },
  {
    code: 'SPUT',
    name: 'CULTURE CRACHAT',
    description: 'N/A',
    specimen: 'Crachat (min. 1mL) - contenant stérile',
    price: 65.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CU',
    name: 'CUIVRE, PLASMA OU SÉRUM',
    description: 'N/A',
    specimen: 'Plasma ou Sérum',
    price: 97.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CFLU',
    name: 'CULTURE DE FLUIDE CORPOREL',
    description: 'N/A',
    specimen: 'Fluide corporel (min. 3mL) - contenant stérile',
    price: 76.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CU/U',
    name: 'CUIVRE, URINE 24 HEURES',
    description: 'Critère de rejet: urine acidifiée.',
    specimen: 'Contenant d\'urine 24 heures (sans préservatif)',
    price: 93.00,
    turnaroundTime: '2-6 jours',
    type: 'individual'
  },
  {
    code: 'CULF',
    name: 'CULTURE FONGIQUE (peau, cheveux, ongles)',
    description: 'Indiquer la source de l\'échantillon sur la requête.',
    specimen: 'Échantillon-contenant stérile',
    price: 130.00,
    turnaroundTime: '31 jours',
    type: 'individual'
  },
  {
    code: 'CULC',
    name: 'CULTURE CERVICALE',
    description: 'N/A',
    specimen: 'Écouvillon simple (avec gel)',
    price: 68.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'CCHMD',
    name: 'CULTURE, CHLAMYDIA',
    description: 'Sources acceptées: endocerviale, endouréthral, œil, nasopharyngé, mucose rectale, vaginale pour les enfants en bas de 13 ans.',
    specimen: 'Écouvillon UTM (tube rouge avec liquide rose)',
    price: 155.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CULFS',
    name: 'CULTURE FONGIQUE (autres)',
    description: 'Sources acceptée: oreille, oral, gorge, nez, occulaire, plaie ou génitale.',
    specimen: 'Écouvillon simple (avec gel)',
    price: 115.00,
    turnaroundTime: '31 jours',
    type: 'individual'
  },
  {
    code: 'GONT',
    name: 'CULTURE GONORRHÉE (GORGE / RECTAL)',
    description: 'N/A',
    specimen: 'Écouvillon simple (avec gel)',
    price: 65.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CULS',
    name: 'CULTURE SELLES (CULTURE TRADITIONNELLE)',
    description: 'N/A',
    specimen: 'Échantillon de selles - contenant stérile',
    price: 88.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'MYPS',
    name: 'CULTURE MYCOPLASMA',
    description: 'N/A',
    specimen: 'Écouvillon simple ou double (avec gel) ou Urine mi-jet/premier-jet',
    price: 115.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'STOOLPCR',
    name: 'CULTURE SELLES (MÉTHODE PCR)',
    description: 'N/A',
    specimen: 'Échantillon de selles - contenant stérile',
    price: 110.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CULN',
    name: 'CULTURE NEZ',
    description: 'N/A',
    specimen: 'Écouvillon double (avec gel)',
    price: 60.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'UPCU',
    name: 'CULTURE URÉAPLASMA ET MYCOPLASMA',
    description: 'N/A',
    specimen: 'Écouvillon simple ou double (avec gel) ou Urine mi-jet/premier-jet',
    price: 120.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'CULW',
    name: 'CULTURE PLAIE SUPPERFICIELLE',
    description: 'Indiquer la source de l\'échantillon sur la requête.',
    specimen: 'Écouvillon double (avec gel)',
    price: 76.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CULP',
    name: 'CULTURE URÉTHRALE',
    description: 'N/A',
    specimen: 'Écouvillon simple (avec gel)',
    price: 70.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CULZ',
    name: 'CULTURE PUS / PLAIE PROFONDE',
    description: 'Indiquer la source de l\'échantillon sur la requête.',
    specimen: 'Écouvillon double (avec gel)',
    price: 68.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CULV',
    name: 'CULTURE VAGINALE (CULTURE TRADITIONNELLE)',
    description: 'N/A',
    specimen: 'Écouvillon double (avec gel)',
    price: 90.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'PCRCULV',
    name: 'CULTURE VAGINALE (MÉTHODE PCR)',
    description: 'N/A',
    specimen: 'Trousse spéciale (Commander à CDL)',
    price: 115.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'CMVM',
    name: 'CYTOMÉGALOVIRUS IGM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 125.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CYSC',
    name: 'CYSTATIN C',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 65.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'DDIM',
    name: 'D-DIMÈRE',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu PLEIN ou Plasma',
    price: 125.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UCYT',
    name: 'CYTOLOGIE, URINE',
    description: 'Utiliser la requête de cytologie urinaire: RR-10-RQ-125',
    specimen: 'Urine mi-jet (min. 30 mL) - 3 contenants de cytologie liquide',
    price: 120.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'DH-S',
    name: 'DHEA-S',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 110.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'DIGX',
    name: 'DIGOXIN',
    description: 'Lanoxin',
    specimen: 'Sérum - 1 tube rouge',
    price: 100.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'CMV',
    name: 'CYTOMÉGALOVIRUS IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 115.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CMVP',
    name: 'CYTOMÉGALOVIRUS IgG, IgM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 210.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'DHT',
    name: 'DIHYDROTESTOSTÉRONE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'Jeun durant la nuit est recommandé.',
    price: 295.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'SPEP',
    name: 'ÉLECTROPHORÈSE DES PROTÉINES',
    description: 'Ce test inclut les analyses de protéines totales et albumine.',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 120.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'ECG',
    name: 'ÉLECTROCARDIOGRAMME AU REPOS (ECG)',
    description: 'N/A',
    specimen: 'Bande ECG',
    price: 95.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'UELP',
    name: 'ÉLECTROPHORÈSE DES PROTÉINES, URINE',
    description: 'Bence-Jones',
    specimen: 'Urine aléatoire (min. 15 mL) ou Urine 24 heures',
    price: 110.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'ECGW',
    name: 'ÉLECTROCARDIOGRAMME SANS INTERPRÉTATION',
    description: 'N/A',
    specimen: 'Bande ECG',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ACE',
    name: 'ENZYME DE CONVERSION ANGIOTENSINE (ACE)',
    description: 'Rejet: hémolyse, lipémie.',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 120.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'ELEC',
    name: 'ÉLECTROLYTES',
    description: 'Inclut sodium, potassium et chlorure.',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UELE',
    name: 'ÉLECTROLYTES, URINE 24 HEURES',
    description: 'Inclut sodium, potassium et chlorure.',
    specimen: 'Contenant d\'urine 24 heures (sans préservatif)',
    price: 63.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'EBVP',
    name: 'EPSTEIN-BARR, PROFIL (EBAR+EBVNA)',
    description: 'Epstein-Barr EBNA IgG + Epstein-Barr VCA IgM',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 165.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'EBVNA',
    name: 'EPSTEIN-BARR EBNA IGG',
    description: 'VEB (EBNA) IgG, antigènes nucléaire VEB',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 130.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'HBEL',
    name: 'ÉLECTROPHORÈSE DE L\'HÉMOGLOBINE',
    description: 'Ce test inclut une FSC.',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 110.00,
    turnaroundTime: '6-8 jours',
    type: 'individual'
  },
  {
    code: 'EBVG',
    name: 'EPSTEIN-BARR VCA IGG',
    description: 'VEB (VCA) IgG',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 125.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'ESTN',
    name: 'ESTRONE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube rouge',
    price: 103.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'EBAR',
    name: 'EPSTEIN-BARR VCA IGM',
    description: 'VEB (VCA) IgM, Anticorps IgM anti-VCA VEB',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 130.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'UETH',
    name: 'ÉTHANOL, URINE',
    description: 'N/A',
    specimen: 'Trousse de dépistage de drogues',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ERYT',
    name: 'ÉRYTHROPOIETINE',
    description: 'EPO',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 125.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'SETH',
    name: 'ÉTHANOL, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 80.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ESTR',
    name: 'ESTRADIOL (E2)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FIIM',
    name: 'FACTEUR II MUTATION',
    description: 'MutationFacteurll, Prothrombin',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 275.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'FERR',
    name: 'FERRITINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 92.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FVL',
    name: 'FACTEUR V LEIDEN',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 255.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'FAC8',
    name: 'FACTEUR VIII FONCTIONNEL',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 205.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'FIB',
    name: 'FIBRINOGÈNE',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu PLEIN',
    price: 90.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'IFAB',
    name: 'FACTEUR INTRINSÈQUE ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 125.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CFC',
    name: 'FIBROSE KYSTIQUE, DÉPISTAGE',
    description: 'Spécifier l\'ethnicité et l\'historique familial.',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 520.00,
    turnaroundTime: '20 jours',
    type: 'individual'
  },
  {
    code: 'RA',
    name: 'FACTEUR RHUMATOÏDE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 72.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CBC',
    name: 'FORMULE SANGUINE COMPLÈTE (FSC)',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FE',
    name: 'FER, TOTAL',
    description: 'Éviter les suppléments de fer 24 heures avant l\'analyse.',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 73.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FRUC',
    name: 'FRUCTOSAMINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 99.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'FSH',
    name: 'FSH',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ACGL',
    name: 'GLUCOSE AC',
    description: 'Jeun: 8 heures, eau permise.',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'GAST',
    name: 'GASTRINE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 105.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'GGT',
    name: 'GGT',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ACPC1H',
    name: 'GLUCOSE AC & PC 1H',
    description: 'Jeun: 6-8 heures, eau permise.',
    specimen: 'Sérum - 2 tubes SST (avec gel)',
    price: 76.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ACPC2H',
    name: 'GLUCOSE AC & PC 2H',
    description: 'Jeun: 6-8 heures, eau permise.',
    specimen: 'Sérum - 2 tubes SST (avec gel)',
    price: 76.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'GLOB',
    name: 'GLOBULINES',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PCGL',
    name: 'GLUCOSE PC',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'GLGN',
    name: 'GLUCAGON',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'Jeun: 12 heures / durant la nuit',
    price: 130.00,
    turnaroundTime: '15 jours',
    type: 'individual'
  },
  {
    code: 'G6PDQ',
    name: 'GLUCOSE-6-PO4-DH QUANTITATIF, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 120.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: '2HGTT',
    name: 'GLUCOSE TEST DE TOLÉRANCE, 2 HEURES',
    description: 'Hyperglycémie provoquée, GTT',
    specimen: 'Sérum - 4 tubes SST (avec gel)',
    price: 95.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'GLU',
    name: 'GLUCOSE, ALÉATOIRE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'GONO',
    name: 'GONORRHÉE PAR PCR',
    description: 'CERVIAL / RECTAL / GORGE',
    specimen: 'Trousse PCR',
    price: 125.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'GONOU',
    name: 'GONORRHÉE PAR PCR (URINE)',
    description: 'N/A',
    specimen: 'Urine premier jet (min. 10 mL) - contenant d\'urine stérile',
    price: 125.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'BLDT',
    name: 'GROUPE SANGUIN & RH',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube rose',
    price: 60.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HPGN',
    name: 'HAPTOGLOBINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 72.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'HELAG',
    name: 'H. PYLORI, SELLES',
    description: 'Helicobacter Pylori',
    specimen: 'Échantillon de selles - contenant stérile',
    price: 140.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'HPBT',
    name: 'H. PYLORI, TEST RESPIRATOIRE',
    description: 'Helicobacter Pylori',
    specimen: 'Trousse Urée C13',
    price: 195.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'GLHBP',
    name: 'HÉMOGLOBINE GLYQUÉE',
    description: 'HbA1c',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 90.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HAVG',
    name: 'HÉPATITE A IGG',
    description: 'HAV IgG',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 135.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'HAVM',
    name: 'HÉPATITE A IGM',
    description: 'HAV IgM',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 105.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'HAVT',
    name: 'HÉPATITE A TOTAL',
    description: 'HAV Total',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 105.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'HBCS',
    name: 'HÉPATITE B ANTICORPS (CORE TOTAL)',
    description: 'HBcAb',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 90.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CABM',
    name: 'HÉPATITE B ANTICORPS (CORE IGM)',
    description: 'HBcAb (IgM)',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 92.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'HSAG',
    name: 'HÉPATITE B ANTIGÈNE DE SURFACE',
    description: 'HBsAg',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 100.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HBCN',
    name: 'HÉPATITE B ANTIGÈNE DE SURFACE CONFIRMATION',
    description: 'HBsAg Confirmation',
    specimen: 'N/A',
    price: 76.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HBAB',
    name: 'HÉPATITE B ANTICORPS DE SURFACE',
    description: 'HBsAb',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 88.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HEPBL',
    name: 'HÉPATITE B CHARGE VIRALE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 400.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'HEAG',
    name: 'HÉPATITE B E ANTICORPS',
    description: 'HBeAb',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 90.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'HSVPCR',
    name: 'HÈRPES SIMPLEX VIRUS 1 ET 2 ADN, PCR',
    description: 'N/A',
    specimen: 'Écouvillon UTM (tube rouge avec liquide rose)',
    price: 210.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'HBEG',
    name: 'HÉPATITE B E ANTIGÈNE',
    description: 'HBeAg',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 90.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'HEPC',
    name: 'HÉPATITE ANTICORPS',
    description: 'HCV',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 120.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'SEH1',
    name: 'HÈRPES SIMPLEX VIRUS 1 IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 150.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'SEH2',
    name: 'HÈRPES SIMPLEX VIRUS 2 IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 145.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'HSSP',
    name: 'HÈRPES SIMPLEX VIRUS 1 ET 2 IgG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 205.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'HFE',
    name: 'HFE GÉNOTYPE',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 225.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'HCVL',
    name: 'HÉPATITE C CHARGE VIRALE',
    description: 'N/A',
    specimen: 'Plasma',
    price: 390.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'HB27',
    name: 'HLA B27',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 185.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'ACTH',
    name: 'HORMONE ADRÉNOCORTICOÏDE',
    description: 'N/A',
    specimen: 'Plasma',
    price: 110.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'AMH',
    name: 'HORMONE ANTI-MÜLÉRIENNE',
    description: 'AMH',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 195.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'HLACELIAC',
    name: 'HLA CELIAC',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 530.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'HLTR',
    name: 'HOLTER 24 HEURES',
    description: 'Test d\'une durée de 24 heures.',
    specimen: 'Sur rendez-vous seulement',
    price: 295.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'HLTR48',
    name: 'HOLTER 48 HEURES',
    description: 'Test d\'une durée de 48 heures.',
    specimen: 'Sur rendez-vous seulement',
    price: 325.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'GH',
    name: 'HORMONE DE CROISSANCE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 90.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'HCYS',
    name: 'HOMOCYSTÉINE',
    description: 'N/A',
    specimen: 'Plasma',
    price: 150.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'PTH',
    name: 'HORMONE PARATHYR OÏDIENNE',
    description: 'Parathormone, PTH',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 145.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'TSH',
    name: 'HORMONE DE STIMULATION THYROIDIENNE',
    description: 'TSH',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 105.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ICAB',
    name: 'ÎLOTS DE LANGERHANS, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 115.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'HTLV',
    name: 'HTLV I & II',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 165.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'IEP',
    name: 'IMMUNOÉLECTROPHORÈSE, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 180.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'IEUR',
    name: 'IMMUNOÉLECTROPHORÈSE, URINE',
    description: 'N/A',
    specimen: 'Urine aléatoire (min. 50 mL) - Contenant d\'urine stérile',
    price: 145.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'IGF1',
    name: 'IGF-1',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 120.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'IGGSUB',
    name: 'IGG SOUS CLASSE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 220.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'IEU',
    name: 'IMMUNOÉLECTROPHORÈSE, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures (sans préservatif)',
    price: 285.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'IL6',
    name: 'INTERLEUKINE 6',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 145.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'IMM',
    name: 'IMMUNOGLOBULINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 270.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'IGA',
    name: 'IMMUNOGLOBULINE IGA',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 80.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'ISLN',
    name: 'INSULINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 85.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'IGE',
    name: 'IMMUNOGLOBULINE IGE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 115.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'IODL',
    name: 'IODINE PLASMA',
    description: 'N/A',
    specimen: 'Plasma',
    price: 195.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'IGG',
    name: 'IMMUNOGLOBULINE IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 80.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'KART',
    name: 'KARYOTYPE',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube vert',
    price: 590.00,
    turnaroundTime: '45 jours',
    type: 'individual'
  },
  {
    code: 'IGM',
    name: 'IMMUNOGLOBULINE IGM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 80.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'FLUAPCR',
    name: 'INFLUENZA A, DÉPISTAGE',
    description: 'N/A',
    specimen: 'Écouvillon UTM (tube rouge avec liquide rose)',
    price: 105.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'LD',
    name: 'LACTATE DÉHYDROGÉNASE (LDH)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 69.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FLUBPCR',
    name: 'INFLUENZA B, DÉPISTAGE',
    description: 'N/A',
    specimen: 'Écouvillon UTM (tube rouge avec liquide rose)',
    price: 105.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'OLTT',
    name: 'LACTOSE TEST DE TOLÉRANCE, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 6 tubes SST (avec gel)',
    price: 160.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FLUABPCR',
    name: 'INFLUENZA A + B, DÉPISTAGE',
    description: 'N/A',
    specimen: 'Écouvillon UTM (tube rouge avec liquide rose)',
    price: 160.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'LPA',
    name: 'LP (A)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 140.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'LAGT',
    name: 'LUPUS ANTICOAGULANT',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 140.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'LAMT',
    name: 'LAMOTRIGINE',
    description: 'Lamictal',
    specimen: 'Sérum - 1 tube rouge',
    price: 150.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'LYMG',
    name: 'LYME, MALADIE DE, IGG ou IGM (LYMG/LYMM)',
    description: 'Borrelia burgdorferi',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 105.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'LH',
    name: 'LH',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'IBLYMP',
    name: 'LYME, MALADIE DE, IGG ou IGM (IMMUNOBLOT)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 325.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'LASE',
    name: 'LIPASE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 60.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'LYMSP1',
    name: 'LYMPHOCYTES',
    description: 'N/A',
    specimen: 'Sang entier -2 tubes lavande PLEIN',
    price: 305.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'LITH',
    name: 'LITHIUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 78.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'LYSZ',
    name: 'LYSOZYMES',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 205.00,
    turnaroundTime: '3-4 jours',
    type: 'individual'
  },
  {
    code: 'MNPRLA',
    name: 'MACROPROLACTINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 250.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'MG',
    name: 'MAGNÉSIUM, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 60.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'MN',
    name: 'MANGANESE, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 180.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'HG',
    name: 'MERCURE, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 115.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'METS',
    name: 'MÉTANÉPHRINES, PLASMA',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 355.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'MG/U',
    name: 'MAGNÉSIUM, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures (sans préservatif)',
    price: 58.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UMET',
    name: 'MÉTANÉPHRINES, URINAIRE (24 HEURES)',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures avec préservatif (HCL 6N)',
    price: 180.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'MALR',
    name: 'MALARIA, FROTTIS',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 72.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'UMDN',
    name: 'MÉTHADONE',
    description: 'N/A',
    specimen: 'Trousse de dépistage de drogues',
    price: 125.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'METHAM',
    name: 'MÉTHAMPHETAMINE',
    description: 'N/A',
    specimen: 'Trousse de dépistage de drogues',
    price: 230.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'UMICP',
    name: 'MICROSCOPIE URINAIRE',
    description: 'N/A',
    specimen: 'Urine aléatoire (min. 5mL)',
    price: 36.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'LUDE',
    name: 'MÉTHAQUALONE',
    description: 'N/A',
    specimen: 'Trousse de dépistage de drogues',
    price: 105.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'MONO',
    name: 'MONOTEST',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 60.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'MTHFR',
    name: 'MUTATION DU GÈNE MTHFR',
    description: 'Méthylène Tétrahydrofolate Réductase',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 205.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'A/CU',
    name: 'MICROALBUMINURIE (ALÉATOIRE)',
    description: 'Albumine, Ratio créatinine',
    specimen: 'Urine aléatoire (min. 5 mL)',
    price: 95.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'MPO',
    name: 'MYELOPEROXIDASE ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 170.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'MALB',
    name: 'MICROALBUMINURIE, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures (sans préservatif)',
    price: 72.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'YXMD',
    name: 'MICRODÉLÉTION DU CHROMOSOME Y',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 595.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'MYOSIT',
    name: 'MYOSITE',
    description: 'N/A',
    specimen: 'Sérum - 2 tubes rouge',
    price: 655.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'NIB',
    name: 'NICKEL, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 145.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'OPIT',
    name: 'OPIACÉS',
    description: 'N/A',
    specimen: 'Trousse de dépistage de drogues',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PARA',
    name: 'OEUFS & PARASITES, SELLES (SANS PRÉSERVATIF)',
    description: 'Certaines restrictions alimentaires s\'appliquent.',
    specimen: 'Échantillon de selles - 3 contenants (avec formaline)',
    price: 105.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'PARAPCR',
    name: 'OEUFS & PARASITES, SELLES (AVEC PRÉSERVATIF)',
    description: 'N/A',
    specimen: 'Échantillon de selles - contenant stérile',
    price: 120.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'MUMG',
    name: 'OREILLONS IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 105.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'MUMM',
    name: 'OREILLONS IGM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 108.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'OSMS',
    name: 'OSMOLALITÉ, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 80.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'BILH',
    name: 'OEUFS & PARASITES, URINE',
    description: 'Bilharziose, schistosomiase',
    specimen: 'Urine contenant d\'urine stérile / contenant d\'urine 24 heures',
    price: 95.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'OSMU',
    name: 'OSMOLALITÉ, URINE',
    description: 'N/A',
    specimen: 'Urine aléatoire (min. 15 mL) - contenant d\'urine stérile',
    price: 80.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PAPS',
    name: 'PAP, FROTTIS (TRADITIONNEL)',
    description: 'N/A',
    specimen: 'Frottis fixé dans une boîte de transport de lame.',
    price: 100.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'OSTO',
    name: 'OSTÉOCALCINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 155.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'OXAL',
    name: 'OXALATE, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d\'urine 24 heures avec préservatif (HCL 6N)',
    price: 175.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PAPT',
    name: 'PAP THINPREPTM, TEST',
    description: 'N/A',
    specimen: 'Contenant ThinPrep™',
    price: 120.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'PINW',
    name: 'OXYURES',
    description: 'Facturer chaque échantillon individuellement.',
    specimen: 'Échantillon- lame',
    price: 58.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'TPPV',
    name: 'PAP THINPREPT™ VPH EN CASCADE',
    description: 'Le VPH est effectué si le résultat ThinPrep™ est ASCUS.',
    specimen: 'Contenant ThinPrep™',
    price: 170.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PARV',
    name: 'PARVOVIRUS IGG',
    description: '5º maladie, Parvovirus B-19',
    specimen: 'Sérum-1 tube SST (avec gel)',
    price: 140.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PARM',
    name: 'PARVOVIRUS IGM',
    description: '5º maladie, Parvovirus B-19',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 130.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'PARP',
    name: 'PARVOVIRUS IgGIgM',
    description: '5ª maladie, Parvovirus B-19',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 195.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PATT',
    name: 'PATERNITÉ, TEST DE (ADN)',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 830.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'MATPAT',
    name: 'PATERNITÉ, TEST DE (SANG MATERNEL)',
    description: 'Grossesse d\'au moins 7 semaines.',
    specimen: 'Trousse spéciale (Commander à CDL)',
    price: 2305.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'CCPG',
    name: 'PEPTIDE CYCLIQUE CITRULLINÉ IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 270.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'PCP',
    name: 'PHENCYCLIDINE (PCP)',
    description: 'N/A',
    specimen: 'Trousse de dépistage de drogues',
    price: 75.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PHTN',
    name: 'PHÉNYTOINE',
    description: 'Dilantin',
    specimen: 'Sérum - 1 tube rouge',
    price: 78.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ALKP',
    name: 'PHOSPHATASE ALCALINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ALKPI',
    name: 'PHOSPHATASE ALCALINE ISOENZYMES',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 210.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'PO4',
    name: 'PHOSPHATE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PO/U',
    name: 'PHOSPHATE, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d’urine 24 heures avec préservatif (HCL 6N)',
    price: 55.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PLT',
    name: 'PLAQUETTES',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 59.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PLTB',
    name: 'PLAQUETTES (tube bleu)',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu PLEIN',
    price: 65.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PB',
    name: 'PLOMB, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 120.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'K',
    name: 'POTASSIUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PALB',
    name: 'PRÉALBUMINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 85.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: '17PGLN',
    name: 'PRÉGNENOLONE 17-OH',
    description: '17 Hydroxypregnenolone',
    specimen: 'Sérum - 1 tube rouge (SANS GEL)',
    price: 335.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'NTPROBNP',
    name: 'PRO-BNP',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 200.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PROG',
    name: 'PROGESTÉRONE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: '17PR',
    name: 'PROGESTÉRONE 17-OH',
    description: 'N/A',
    specimen: 'Sérum - 1 tube rouge',
    price: 125.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'PRLA',
    name: 'PROLACTINE',
    description: 'Un jeun peut être requis',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 88.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PRTASE',
    name: 'PROTEINASE-3 ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 159.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'PRCA',
    name: 'PROTÉINE C, ANTIGÈNE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 110.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PRCF',
    name: 'PROTÉINE C, FONCTIONNELLE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 108.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'CRP',
    name: 'PROTÉINE C-RÉACTIVE (CRP)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 78.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CRPHS',
    name: 'PROTÉINE C-RÉACTIVE HAUTE SENSIBILITÉ (CRPHS)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 84.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'P/CU',
    name: 'PROTÉINE CRÉATININE RATIO',
    description: 'N/A',
    specimen: 'Urine aléatoire (min. 5 mL)',
    price: 85.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PRSA',
    name: 'PROTÉINE S, ANTIGÈNE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 110.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PRSF',
    name: 'PROTÉINE S, FONCTIONNELLE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 118.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'TP',
    name: 'PROTÉINES TOTALES, SÉRUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PR/U',
    name: 'PROTÉINES, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d’urine 24 heures (sans préservatif)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PSA',
    name: 'PROSTATE, ANTIGÈNE PROSTATIQUE SPÉCIFIQUE TOTAL',
    description: 'APS (PSA)',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 87.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FPSA',
    name: 'PROSTATE, ANTIGÈNE PROSTATIQUE SPÉCIFIQUE LIBRE',
    description: 'APS libre (PSA). Ce test inclut APS total et le ratio.',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 140.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CLRYDX',
    name: 'PROSTATE, APS FACTEURS DE RISQUE CLARITYDX',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 300.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'PT',
    name: 'PT INR (TEMPS DE QUICK)',
    description: 'Taux de prothrombine',
    specimen: 'Sang entier - 1 tube bleu PLEIN',
    price: 55.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PTT',
    name: 'PTT (TCA)',
    description: 'Temps de céphaline activée',
    specimen: 'Sang entier - 1 tube bleu PLEIN',
    price: 58.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'QFINT',
    name: 'QUANTIFÉRON-TB GOLD',
    description: 'Envoyer du lundi au jeudi seulement avant 15h00.',
    specimen: 'Trousse spéciale (commander à CDL)',
    price: 285.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'RABIES',
    name: 'RAGE, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 185.00,
    turnaroundTime: '30 jours',
    type: 'individual'
  },
  {
    code: 'ABSN',
    name: 'RECHERCHE D’ANTICORPS',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube rose',
    price: 87.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'RENN',
    name: 'RÉNINE',
    description: 'N/A',
    specimen: 'Plasma',
    price: 105.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'RPC',
    name: 'RÉSISTANCE PROTÉINE C ACTIVÉE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 110.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'RTIC',
    name: 'RÉTICULOCYTES',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'RMES',
    name: 'ROUGEOLE IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 100.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'RMEM',
    name: 'ROUGEOLE IGM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 108.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'RUBE',
    name: 'RUBÉOLE IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 95.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'RUBM',
    name: 'RUBÉOLE IGM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 108.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'QIFOB',
    name: 'SANG DANS LES SELLES IMMUNOLOGIQUE, QUANTITATIF',
    description: 'Hemosure, sang occulte, IFOB ou FIT, RSOSi.',
    specimen: 'Échantillon de selles – contenant stérile',
    price: 110.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'SEDI',
    name: 'SÉDIMENTATION, VITESSE DE',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube lavande PLEIN',
    price: 62.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'SE',
    name: 'SÉLÉNIUM, SANG ENTIER',
    description: 'N/A',
    specimen: 'Sang entier - 1 tube bleu foncé',
    price: 145.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'SHBG',
    name: 'SHBG (GLOBULINE RELIÉE À L’HORMONE DU SEXE)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 110.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'NA',
    name: 'SODIUM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UNA',
    name: 'SODIUM, URINE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant d’urine 24 heures (sans préservatif)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'NACR',
    name: 'SODIUM / CRÉATININE RATIO',
    description: 'N/A',
    specimen: 'Urine aléatoire (min. 15 mL)',
    price: 57.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'SPGMF',
    name: 'SPERMOGRAMME FERTILITÉ',
    description: 'Sur rendez-vous seulement à CDL.',
    specimen: 'Voir section 8',
    price: 125.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'SPGMPV',
    name: 'SPERMOGRAMME POST-VASECTOMIE',
    description: 'Sur rendez-vous seulement à CDL.',
    specimen: 'Voir section 8',
    price: 115.00,
    turnaroundTime: 'N/A',
    type: 'individual'
  },
  {
    code: 'STPT',
    name: 'STREP A, CANDIDA',
    description: 'Spécifier la bactérie suspectée sur la requête.',
    specimen: '2 écouvillons simple (sans gel) et 1 écouvillon simple (avec gel)',
    price: 110.00,
    turnaroundTime: '1-2 jours',
    type: 'individual'
  },
  {
    code: 'STPCR',
    name: 'STREP A, C, G (PCR)',
    description: 'N/A',
    specimen: 'Écouvillon simple (sans gel)',
    price: 78.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CULT',
    name: 'STREP A, C, G (PCR), CANDIDA',
    description: 'Spécifier la bactérie suspectée sur la requête.',
    specimen: 'Écouvillon simple (sans gel) et écouvillon simple (avec gel)',
    price: 110.00,
    turnaroundTime: '1-2 jours',
    type: 'individual'
  },
  {
    code: 'STRP',
    name: 'STREP A, RAPIDE',
    description: 'N/A',
    specimen: 'Écouvillon simple (sans gel)',
    price: 68.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'VAGS',
    name: 'STREP GROUPE B PCR, VAGINAL',
    description: 'Groupe Strep B, GBS',
    specimen: 'Écouvillon simple (avec gel)',
    price: 70.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'FRGX',
    name: 'SYNDRÔME FRAGILE X',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 580.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'SYPEIA',
    name: 'SYPHILIS (EIA)',
    description: 'N/A',
    specimen: 'Sérum - 2 tubes SST (avec gel)',
    price: 80.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FT3',
    name: 'T3 LIBRE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 88.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'RT3',
    name: 'T3 REVERSE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 155.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'TT3',
    name: 'T3 TOTALE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 84.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'FT4',
    name: 'T4 LIBRE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 90.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TT4',
    name: 'T4 TOTAL',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 84.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'TCLM',
    name: 'TACROLIMUS (FK506, Prograf)',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 125.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'TAYS',
    name: 'TAY SACHS, PLAQUETTES',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 340.00,
    turnaroundTime: '20 jours',
    type: 'individual'
  },
  {
    code: 'TERI',
    name: 'TERIFLUNOMIDE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube rouge',
    price: 450.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'TESBC',
    name: 'TESTOSTÉRONE Biodisponible',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 120.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TESFC',
    name: 'TESTOSTÉRONE Libre',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 115.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TEST',
    name: 'TESTOSTÉRONE Total',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 100.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HBTDXP',
    name: 'TESTS RESPIRATOIRES D-XYLOSE',
    description: 'Sur rendez-vous à CDL.',
    specimen: 'N/A',
    price: 360.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'ATHAL',
    name: 'THALASSEMIE ALPHA',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN',
    price: 645.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'THYG',
    name: 'THYROGLOBULINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 105.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'TGAB',
    name: 'THYROGLOBULINE, ANTICORPS',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 68.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'THAB',
    name: 'THYROÏDIENS, ANTICORPS',
    description: 'Inclut TPO et TGAB.',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 120.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'TOXG',
    name: 'TOXOPLASMOSE IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 125.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'TOXM',
    name: 'TOXOPLASMOSE IGM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 115.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'TOXP',
    name: 'TOXOPLASMOSE IgG, IgM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 205.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'TRFN',
    name: 'TRANSFERRINE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 88.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CDT',
    name: 'TRANSFERRINE CARBOXY DÉFICIENTE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 250.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'TRIPCR',
    name: 'TRICHOMONAS VAGINALIS PCR',
    description: 'N/A',
    specimen: 'Écouvillon simple ou double (avec gel)',
    price: 89.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'UTRIPCR',
    name: 'TRICHOMONAS PCR (URINE)',
    description: 'N/A',
    specimen: 'Urine premier jet (10ml -20ml)',
    price: 89.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'TRIG',
    name: 'TRIGLYCÉRIDES',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TROPHS',
    name: 'TROPONINE T',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 108.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TRYP',
    name: 'TRYPTASE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 270.00,
    turnaroundTime: '3-6 jours',
    type: 'individual'
  },
  {
    code: 'TBII',
    name: 'TSH, ANTICORPS ANTI-RÉCEPTEUR',
    description: 'Taux d’immunoglobulines stimulant la thyroïde (TSI)',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 155.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'UREAP',
    name: 'URÉALYTICUM (PCR)',
    description: 'N/A',
    specimen: 'Trousse spéciale (commander à CDL)',
    price: 335.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'UREA',
    name: 'URÉE',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 52.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UCR',
    name: 'URÉE / CRÉATININE, RATIO',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 40.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UR/U',
    name: 'URÉE, URINE 24 HEURES (BUN)',
    description: 'N/A',
    specimen: 'Contenant d’urine 24 heures (sans préservatif)',
    price: 45.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'URC',
    name: 'URINE, ANALYSE',
    description: 'Microscopie urinaire effectuée si requise.',
    specimen: 'Urine mi-jet (min. 5 mL) - contenant d’urine stérile',
    price: 57.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CULU',
    name: 'URINE, CULTURE',
    description: 'N/A',
    specimen: 'Urine mi-jet (min. 5 mL) - contenant d’urine stérile',
    price: 77.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'VARG',
    name: 'VARICELLE IGG',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 88.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'VARM',
    name: 'VARICELLE IGM',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 105.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'HIV',
    name: 'VIH (VIRUS DE L’IMMUNODÉFICIENCE HUMAINE)',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 95.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HIVL',
    name: 'VIH (VIRUS IMMUNODÉFICIENCE HUMAINE), CHARGE VIRALE',
    description: 'N/A',
    specimen: 'Sang entier - 2 tubes lavande PLEIN ou Plasma',
    price: 340.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'VITA',
    name: 'VITAMINE A (RETINOL)',
    description: 'N/A',
    specimen: 'Serum - 1 tube SST (avec gel)',
    price: 140.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'VB12',
    name: 'VITAMINE B12',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 82.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'VITB6',
    name: 'VITAMINE B6',
    description: 'N/A',
    specimen: 'Plasma',
    price: 270.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: '125D',
    name: 'VITAMINE D 1,25 OH',
    description: 'N/A',
    specimen: 'Sérum - 1 tube rouge',
    price: 195.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: '25D',
    name: 'VITAMINE D 25 OH',
    description: 'N/A',
    specimen: 'Sérum - 1 tube SST (avec gel)',
    price: 150.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'VWF',
    name: 'VON WILLEBRAND, ANTIGÈNE',
    description: 'Offert au siège social CDL seulement.',
    specimen: 'N/A',
    price: 115.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'HPV',
    name: 'VPH (VIRUS DU PAPILLOME HUMAIN)',
    description: 'N/A',
    specimen: 'Contenant ThinPrep™',
    price: 155.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'PVTP',
    name: 'VPH AVEC THINPREP EN CASCADE',
    description: 'N/A',
    specimen: 'Contenant ThinPrep™',
    price: 185.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'GENHPV',
    name: 'VPH GENOTYPAGE (homme et femme)',
    description: 'N/A',
    specimen: 'OneSwab',
    price: 395.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'ZN',
    name: 'ZINC, PLASMA',
    description: 'N/A',
    specimen: 'Plasma',
    price: 88.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'ZNRBC',
    name: 'ZINC, GLOBULES ROUGES',
    description: 'N/A',
    specimen: 'Globules rouges - 1 tube bleu foncé',
    price: 88.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  }
];

// ── Dynacare Tests (208 tests extracted from Dynacare catalogue PDF) ──
const dynacareTests: RawTest[] = [
  // --- PROFILES (Regroupements d'analyses) ---
  {
    code: 'SMA7',
    name: 'Profil SMA-7',
    description: 'Glucose AC, Urée, Créatinine, Électrolytes, CO2 Total.',
    specimen: '1 tube gel',
    price: 71.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'TH2',
    name: 'Profil THYROÏDIEN No 2',
    description: 'TSH, T4 Libre.',
    specimen: '1 tube gel',
    price: 120.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'TH6',
    name: 'Profil THYROÏDIEN No 6',
    description: 'TSH, T4 Libre, Anticorps anti-microsomes thyroidiens.',
    specimen: '2 tubes gel',
    price: 202.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'STONE',
    name: 'Profil UROLITHIASE',
    description: 'Calcium, Phosphore, Électrolytes, Acide Urique, Calcium (24h), Phosphore (24h), Créatinine (24h), Acide Urique (24h), Oxalates (24h), Analyse d\'urine.',
    specimen: '1 tube gel, 1 contenant 24h (avec 25mL 6N HCl), 1 tube urine BD',
    price: 170.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'SMA12',
    name: 'Profil BIO-12',
    description: 'Glucose AC, Albumine, Phosphatase alcaline, AST, Bilirubine totale, Calcium, Cholestérol, Créatinine, LDH, Protéines, Urée, Acide urique.',
    specimen: '1 tube gel',
    price: 60.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'SMA12LYT',
    name: 'Profil BIO-12 AVEC ÉLECTROLYTES',
    description: 'Glucose AC, Albumine, Phosphatase alcaline, AST, Bilirubine totale, Calcium, Cholestérol, Créatinine, Électrolytes.',
    specimen: '1 tube gel',
    price: 69.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'SMAC',
    name: 'Profil BIO-C',
    description: 'Glucose AC, Calcium, Phosphore, Acide urique, Urée, Créatinine, Bilirubine totale, Phosphatase alcaline, LDH, AST, ALT, GGT, Protéines, Albumine, Cholestérol, Triglycérides.',
    specimen: '1 tube gel',
    price: 71.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'SMACLYT',
    name: 'Profil BIO-C AVEC ÉLECTROLYTES',
    description: 'Glucose AC, Calcium, Phosphore, Acide urique, Urée, Créatinine, Bilirubine totale, Phosphatase alcaline, LDH, AST, ALT, GGT, Protéines, Albumine, Cholestérol, Triglycérides, Électrolytes.',
    specimen: '1 tube gel',
    price: 91.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CBCCOAG',
    name: 'Profil COAGULATION/HÉMOGRAMME',
    description: 'Hémogramme, INR, PTT.',
    specimen: '1 tube lavande, 1 tube bleu pâle',
    price: 123.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'COAG',
    name: 'Profil COAGULOGRAMME',
    description: 'CBC, INR, PTT, Fibrinogène.',
    specimen: '1 tube lavande, 1 tube bleu pâle',
    price: 117.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'STDMU',
    name: 'Profil CULTURE GENITAL et GONO/CHLAM',
    description: 'Culture génitale et Chlamydia/Neisseria Gonorrhoeae TAAN.',
    specimen: '1 écouvillon Amies + écouvillon Aptima ou contenant Aptima urine',
    price: 120.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'HEPAB',
    name: 'Profil DÉPISTAGE HÉPATITE A et B',
    description: 'Anticorps anti-HBs, Anticorps anti-HBc, Antigène HBs, Anticorps anti-hépatite A IgM.',
    specimen: '1 tube gel',
    price: 273.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'HEPABC',
    name: 'Profil DÉPISTAGE HÉPATITE A, B et C',
    description: 'Anticorps anti-HBs, Anticorps anti-HBc, Antigène HBs, Anticorps anti-hépatite A IgM, Anticorps anti-hépatite C.',
    specimen: '1 tube gel',
    price: 273.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'HEPB',
    name: 'Profil DÉPISTAGE HÉPATITE B',
    description: 'Anticorps anti-HBs, Anticorps anti-HBc, Antigène HBs.',
    specimen: '1 tube gel',
    price: 188.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'CELISCRE',
    name: 'Profil DÉPISTAGE MALADIE COELIAQUE',
    description: 'IgA totales, Anticorps anti-transglutaminase IgA, Anticorps anti-gliadine IgG.',
    specimen: '1 tube gel',
    price: 104.00,
    turnaroundTime: '6 jours',
    type: 'profile'
  },
  {
    code: 'DIAB',
    name: 'Profil DIABÉTIQUE No 1',
    description: 'Glucose AC, Urée, Créatinine, Électrolytes, HbA1c, Analyse d\'urine, Microalbuminurie.',
    specimen: '1 tube lavande, 1 tube gel, 1 tube urine BD, 1 contenant stérile',
    price: 140.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'DIAB6',
    name: 'Profil DIABÉTIQUE No 6',
    description: 'Glucose AC, HbA1c.',
    specimen: '1 tube lavande, 1 tube gel',
    price: 72.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'FERT1',
    name: 'Profil FERTILITÉ No 1',
    description: 'FSH, LH.',
    specimen: '1 tube gel',
    price: 114.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'FERT2',
    name: 'Profil FERTILITÉ No 2',
    description: 'FSH, LH, Prolactine.',
    specimen: '1 tube gel',
    price: 180.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'GP1',
    name: 'Profil GÉNÉRAL No 1',
    description: 'Hémogramme, Glucose AC, Calcium, Phosphore, Acide urique, Urée, Créatinine, Bilirubine totale, Phosphatase alcaline, LDH, AST, ALT, GGT, Protéines, Albumine, Cholestérol, Triglycérides, Analyse d\'urine.',
    specimen: '1 tube lavande, 1 tube gel, 1 tube urine BD',
    price: 140.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'GP2',
    name: 'Profil GÉNÉRAL No 2',
    description: 'Hémogramme, Glucose AC, Calcium, Phosphore, Acide urique, Urée, Créatinine, DFG, Bilirubine totale, Phosphatase alcaline, LDH, AST, ALT, GGT, Protéines, Albumine, Cholestérol, Triglycérides, Électrolytes, Analyse d\'urine.',
    specimen: '1 tube lavande, 1 tube gel, 1 tube urine BD',
    price: 158.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'GP3',
    name: 'Profil GÉNÉRAL No 3',
    description: 'Glucose AC, Calcium, Phosphore, Acide urique, Urée, Créatinine, Bilirubine totale, Phosphatase alcaline, LDH, AST, ALT, GGT, Protéines, Albumine, Cholestérol, Triglycérides, Hémogramme, Analyse d\'urine, HDL, LDL.',
    specimen: '1 tube lavande, 1 tube gel, 1 tube urine BD',
    price: 166.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'GP4',
    name: 'Profil GÉNÉRAL No 4',
    description: 'Hémogramme, Glucose AC, Calcium, Phosphore, Acide urique, Urée, Créatinine, DFG, Bilirubine totale, Phosphatase alcaline, LDH, AST, ALT, GGT, Protéines, Albumine, Cholestérol, Triglycérides, HDL, LDL, Électrolytes, Analyse d\'urine.',
    specimen: '1 tube lavande, 1 tube gel, 1 tube urine BD',
    price: 183.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ITSS',
    name: 'Profil GONO-CHLAM',
    description: 'Antigène HBs, VIH, Syphilis, Gono-Chlamydia TAAN.',
    specimen: '1 tube gel, 1 écouvillon Aptima ou contenant urine Aptima',
    price: 212.00,
    turnaroundTime: '2 jours',
    type: 'profile'
  },
  {
    code: 'LFT',
    name: 'Profil HÉPATIQUE',
    description: 'ALT, AST, Bilirubine totale, GGT, LDH, Phosphatase alcaline.',
    specimen: '1 tube gel',
    price: 71.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'LIPID',
    name: 'Profil LIPIDIQUE CARDIOVASCULAIRE',
    description: 'Cholestérol, Triglycérides, HDL, LDL.',
    specimen: '1 tube gel',
    price: 72.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'LIPID18',
    name: 'Profil LIPIDIQUE CARDIOVASCULAIRE No 18',
    description: 'Cholestérol, Triglycérides, HDL, LDL, Apolipoprotéine B, CRP-hs.',
    specimen: '1 tube gel',
    price: 109.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'LIPID6',
    name: 'Profil LIPIDIQUE CARDIOVASCULAIRE No 6',
    description: 'Cholestérol, Triglycérides, HDL, LDL, Apolipoprotéine B.',
    specimen: '1 tube gel',
    price: 137.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'FPSA_PROF',
    name: 'Profil MARQUEURS PROSTATIQUES',
    description: 'APS Libre, APS Totale.',
    specimen: '1 tube gel',
    price: 115.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'MONOP',
    name: 'Profil MONOTEST',
    description: 'FSC, Monotest.',
    specimen: '1 tube lavande, 1 tube gel',
    price: 65.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'OSTEOP',
    name: 'Profil OSTEOPOROSIS',
    description: 'PTH, Électrophorèse des protéines, Calcium ionisé, Albumine, Phosphatase alcaline, Calcium, Créatinine, Phosphore, Protéine, Calcium-urine random, Créatinine-urine random, Phosphore-urine random, Ratio Cal/Creat.',
    specimen: '1 tube lavande, 4 tubes gel, 1 contenant d\'urine stérile',
    price: 314.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'PREN1',
    name: 'Profil PRÉNATAL No 1',
    description: 'FSC Interprétation + Anticorps maternel, Groupe sanguin.',
    specimen: '1 tube lavande, 1 tube rose',
    price: 134.00,
    turnaroundTime: '3 jours',
    type: 'profile'
  },
  {
    code: 'PREN2',
    name: 'Profil PRÉNATAL No 2',
    description: 'FSC Interprétation + Anticorps maternel, Groupe sanguin, Rubella IgG.',
    specimen: '2 tubes lavande, 1 tube gel, 1 tube rose',
    price: 164.00,
    turnaroundTime: '3 jours',
    type: 'profile'
  },
  {
    code: 'PREN3',
    name: 'Profil PRÉNATAL No 3',
    description: 'FSC Interprétation + Anticorps maternel, Groupe sanguin, Rubella IgG, Toxoplasmose IgG, Glucose AC, Glucose PC.',
    specimen: '1 tube lavande, 4 tubes gel, 1 tube rose',
    price: 187.00,
    turnaroundTime: '5 jours',
    type: 'profile'
  },
  {
    code: 'SMA16',
    name: 'Profil SMA-16',
    description: 'Glucose AC, Albumine, Phosphatase alcaline, AST, Bilirubine totale, Calcium, Cholestérol, Créatinine, Électrolytes, CO2 Total.',
    specimen: '1 tube gel',
    price: 74.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'SMA5',
    name: 'Profil SMA-5',
    description: 'Glucose AC, Créatinine, Électrolytes.',
    specimen: '1 tube gel',
    price: 74.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'SMA6',
    name: 'Profil SMA-6',
    description: 'Glucose AC, Urée, Créatinine, Électrolytes.',
    specimen: '1 tube gel',
    price: 69.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ANEM1',
    name: 'Profil ANÉMIE No 1',
    description: 'Hémogramme, Vitesse de sédimentation, TIBCP, Vitamine B12, Folates.',
    specimen: '1 tube lavande, 1 tube gel',
    price: 161.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ANEM11',
    name: 'Profil ANÉMIE No 11',
    description: 'Vitesse de sédimentation, Hémogramme, Ferritine.',
    specimen: '1 tube lavande, 1 tube gel',
    price: 121.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },
  {
    code: 'ANEM8',
    name: 'Profil ANÉMIE No 8',
    description: 'Vitesse de sédimentation, Hémogramme, Ferritine, TIBCP.',
    specimen: '1 tube lavande, 1 tube gel',
    price: 173.00,
    turnaroundTime: '1 jour',
    type: 'profile'
  },

  // --- INDIVIDUAL TESTS (Analyses individuelles) ---
  {
    code: 'CDT',
    name: '% CDT',
    description: 'Carbohydrate Deficient Transferrin',
    specimen: '1 tube gel',
    price: 63.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'VITD125',
    name: '1.25-DIHYDROXY-VITAMINE D',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 104.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: '17HYPROG',
    name: '17-HYDROXY-PROGESTERONE',
    description: '17-OH-PROGESTERONE',
    specimen: '1 tube gel',
    price: 109.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'VITD',
    name: '25-HYDROXY VITAMINE D',
    description: 'Cholecalciferol',
    specimen: '1 tube gel',
    price: 53.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: '24U5HIAA',
    name: '5-HIAA',
    description: 'Métabolite de la sérotonine (Urines de 24h)',
    specimen: 'Contenant 24h avec 25mL 6N HCl',
    price: 95.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'APH',
    name: 'ACÉTAMINOPHÈNE',
    description: 'Analyse quantitative',
    specimen: '1 tube gel',
    price: 90.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'ACETONE',
    name: 'ACÉTONE',
    description: 'Analyse quantitative',
    specimen: '1 tube gel',
    price: 50.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'VITC',
    name: 'ACIDE ASCORBIQUE (VITAMINE C)',
    description: 'Protéger de la lumière. Congeler.',
    specimen: '1 tube gel',
    price: 105.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'FOL',
    name: 'ACIDE FOLIQUE (FOLATE)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 45.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'B12FOL',
    name: 'ACIDE FOLIQUE ET VITAMINE B12',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 108.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'LAC',
    name: 'ACIDE LACTIQUE',
    description: 'À jeun depuis 10 heures.',
    specimen: '1 tube bouchon gris',
    price: 76.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'METMALAU',
    name: 'ACIDE MÉTHYLMALONIQUE - URINE',
    description: 'Analyse quantitative',
    specimen: 'Contenant stérile',
    price: 149.00,
    turnaroundTime: '37 jours',
    type: 'individual'
  },
  {
    code: 'METMALA',
    name: 'ACIDE MÉTHYLMALONIQUE - SANG',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 149.00,
    turnaroundTime: '37 jours',
    type: 'individual'
  },
  {
    code: 'URIC',
    name: 'ACIDE URIQUE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'URICURAN',
    name: 'ACIDE URIQUE - URINE AU HASARD',
    description: 'N/A',
    specimen: 'Contenant stérile',
    price: 36.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: '24UURIC',
    name: 'ACIDE URIQUE - URINES DE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant 24h',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'VAL',
    name: 'ACIDE VALPROÏQUE (DEPAKENE)',
    description: 'Taux résiduel juste avant la dose suivante.',
    specimen: 'Tube rouge avec activateur',
    price: 66.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'VMA',
    name: 'ACIDE VANYLMANDÉLIQUE (VMA)',
    description: 'Urines de 24h. Diète spéciale.',
    specimen: 'Contenant 24h avec 25mL 6N HCl',
    price: 96.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'FFA',
    name: 'ACIDES GRAS LIBRES',
    description: 'À jeun 12h. Congeler rapidement.',
    specimen: '1 tube gel',
    price: 55.00,
    turnaroundTime: '15 jours',
    type: 'individual'
  },
  {
    code: 'PROCACT',
    name: 'ACTIVITÉ DE LA PROTÉINE C',
    description: 'Collection au centre Dobrin.',
    specimen: '2 tubes bouchon bleu clair',
    price: 96.00,
    turnaroundTime: '17 jours',
    type: 'individual'
  },
  {
    code: 'AGG',
    name: 'AGGLUTININES FROIDES',
    description: 'Ne pas centrifuger.',
    specimen: '1 tube lavande',
    price: 37.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'ALB',
    name: 'ALBUMINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ALCO',
    name: 'ALCOOL (ETHANOL) - SANG',
    description: 'Ne pas désinfecter avec de l\'alcool.',
    specimen: '1 tube gel',
    price: 51.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ETOH',
    name: 'ALCOOL (ETHANOL) - URINE',
    description: 'N/A',
    specimen: 'Contenant stérile',
    price: 58.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'DOST',
    name: 'ALDOSTÉRONE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 100.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'DOSTU',
    name: 'ALDOSTÉRONE - URINES DE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant 24h',
    price: 95.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'TRYP_A1AT',
    name: 'ALPHA 1-ANTITRYPSINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 91.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'ALPHA2',
    name: 'ALPHA 2 MACROGLOBULINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 28.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'AFP',
    name: 'ALPHA-FŒTOPROTÉINE (AFP)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 80.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ALT',
    name: 'ALT',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AMIK',
    name: 'AMIKACINE',
    description: 'Au hasard, Pré-dose ou Post-dose.',
    specimen: '1 tube gel',
    price: 114.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'AMITRIP',
    name: 'AMITRIPTYLINE',
    description: 'Antidépresseur tricyclique.',
    specimen: '1 tube rouge avec activateur',
    price: 114.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'AMMO',
    name: 'AMMONIAQUE',
    description: 'À jeun. Plasma EDTA. Congeler immédiatement.',
    specimen: '1 tube lavande',
    price: 51.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'AMYL',
    name: 'AMYLASE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'URI',
    name: 'ANALYSE D\'URINE',
    description: 'Tube urine BD avec préservatif.',
    specimen: '1 tube urine BD',
    price: 31.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'KIDNEY',
    name: 'ANALYSE DES CALCULS RENAUX',
    description: 'N/A',
    specimen: 'Contenant stérile',
    price: 76.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'ANDRO',
    name: 'ANDROSTENE-DIONE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 93.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'LUPUS',
    name: 'ANTICOAGULANT LUPIQUE',
    description: 'Collection au centre Dobrin.',
    specimen: '2 tubes bleu clair + 1 tube gel',
    price: 137.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'DEGLIAG',
    name: 'ANTICORPS ANTI-GLIADINE DE TYPE IgG',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 53.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'DEGLIAA',
    name: 'ANTICORPS ANTI-GLIADINE DE TYPE IgA',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 53.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'DNA',
    name: 'ANTICORPS ANTI-ADN (Double brin)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 134.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'IFA',
    name: 'ANTICORPS ANTI-FACTEUR INTRINSÈQUE',
    description: 'N/A',
    specimen: '2 tubes gel',
    price: 120.00,
    turnaroundTime: '37 jours',
    type: 'individual'
  },
  {
    code: 'HISTAB',
    name: 'ANTICORPS ANTI-HISTONE',
    description: 'Seulement si ANA positif.',
    specimen: '1 tube gel',
    price: 72.00,
    turnaroundTime: '17 jours',
    type: 'individual'
  },
  {
    code: 'GBM',
    name: 'ANTICORPS ANTI-MEMBRANE BASALE GLOMERULAIRE',
    description: 'Anti-GBM',
    specimen: '1 tube gel',
    price: 57.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'HEPC',
    name: 'ANTICORPS ANTI-HEPATITE C',
    description: 'Anti-VHC',
    specimen: '1 tube gel',
    price: 76.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PARVO',
    name: 'ANTICORPS ANTI-PARVOVIRUS IgG ET IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 173.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'ENA',
    name: 'ANTICORPS ANTI-ENA',
    description: 'Anti-antigènes nucléaires solubles.',
    specimen: '1 tube gel',
    price: 108.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'MITOM2',
    name: 'ANTICORPS ANTI-MITOCHONDRIES M2',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 114.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'TAPRO',
    name: 'ANTICORPS ANTI-MICROSOMES THYROIDIENS',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 106.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'ACCP',
    name: 'ANTICORPS ANTI-CCP',
    description: 'Anti-cyclique citrulliné.',
    specimen: '1 tube gel',
    price: 83.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'B2GP',
    name: 'ANTICORPS ANTI-BETA 2-GLYCOPROTÉINE I (IgG/IgM/IgA)',
    description: 'IgG, IgM et IgA disponibles.',
    specimen: '1 tube gel',
    price: 90.00,
    turnaroundTime: '8 jours',
    type: 'individual'
  },
  {
    code: 'ANTICAR',
    name: 'ANTICORPS ANTI-CARDIOLIPINES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 70.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'APC',
    name: 'ANTICORPS ANTI-CELLULES PARIÉTALES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 106.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CMVG',
    name: 'ANTICORPS ANTI-CYTOMEGALOVIRUS IgG',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 93.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'CMVM',
    name: 'ANTICORPS ANTI-CYTOMEGALOVIRUS IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 93.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'ANCA',
    name: 'ANTICORPS ANTI-CYTOPLASME DES NEUTROPHILES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 142.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'HEPAM',
    name: 'ANTICORPS ANTI-HEPATITE A IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 89.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AMITO',
    name: 'ANTICORPS ANTI-MITOCHONDRIES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 93.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'AML',
    name: 'ANTICORPS ANTI-MUSCLE LISSE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 92.00,
    turnaroundTime: '5 jours',
    type: 'individual'
  },
  {
    code: 'ANA',
    name: 'ANTICORPS ANTINUCLÉAIRES (ANA)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 79.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'RABI',
    name: 'ANTICORPS ANTI-RABIQUES (RAGE)',
    description: 'Tube rouge sans gel.',
    specimen: '1 tube rouge avec activateur',
    price: 73.00,
    turnaroundTime: '30 jours',
    type: 'individual'
  },
  {
    code: 'ARA',
    name: 'ANTICORPS ANTI-RÉCEPTEUR DE L\'ACETYLCHOLINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 455.00,
    turnaroundTime: '32 jours',
    type: 'individual'
  },
  {
    code: 'ANTHY',
    name: 'ANTICORPS ANTI-RÉCEPTEURS TSH (TBII)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 171.00,
    turnaroundTime: '15 jours',
    type: 'individual'
  },
  {
    code: 'ASO',
    name: 'ANTICORPS ANTI-STREPTOLYSINE O',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 28.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TETA',
    name: 'ANTICORPS ANTITÉTANIQUES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 65.00,
    turnaroundTime: '30 jours',
    type: 'individual'
  },
  {
    code: 'TRANSGLUT',
    name: 'ANTICORPS ANTI-TRANSGLUTAMINASE IgA',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 89.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'EBVIGG',
    name: 'ANTICORPS ANTI-EBV IgG',
    description: 'Epstein-Barr Virus',
    specimen: '1 tube gel',
    price: 103.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'EBVIGM',
    name: 'ANTICORPS ANTI-EBV IgM',
    description: 'Epstein-Barr Virus',
    specimen: '1 tube gel',
    price: 103.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'VARIG',
    name: 'ANTICORPS ANTI-VARICELLE IgG',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 76.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'MUMPIGG',
    name: 'ANTICORPS ANTI-OREILLONS IgG',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 95.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'ROUGG',
    name: 'ANTICORPS ANTI-ROUGEOLE IgG',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 68.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'RUB',
    name: 'ANTICORPS ANTI-RUBÉOLE IgG',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 54.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HEPBCM',
    name: 'ANTICORPS ANTI-HBc IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 110.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'VARIM',
    name: 'ANTICORPS ANTI-VARICELLE IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 84.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'MUMPIGM',
    name: 'ANTICORPS ANTI-OREILLONS IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 79.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'ROUGM',
    name: 'ANTICORPS ANTI-ROUGEOLE IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 84.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'RUBIGM',
    name: 'ANTICORPS ANTI-RUBÉOLE IgM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 93.00,
    turnaroundTime: '10 jours',
    type: 'individual'
  },
  {
    code: 'HEPBC',
    name: 'ANTICORPS ANTI-HBc',
    description: 'Antigène capsidique hépatite B',
    specimen: '1 tube gel',
    price: 89.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HEPBE',
    name: 'ANTICORPS ANTI-HBe',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 73.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'HEPAG',
    name: 'ANTICORPS ANTI-HEPATITE A IgG',
    description: 'Totaux',
    specimen: '1 tube gel',
    price: 84.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CEA',
    name: 'ANTIGÈNE CARCINO-EMBRYONNAIRE (ACE)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 79.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HBS',
    name: 'ANTIGÈNE DE SURFACE HÉPATITE B (HBsAg)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 64.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HBEAG',
    name: 'ANTIGÈNE HÉPATITE Be (HBeAg)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 73.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'HLAB',
    name: 'ANTIGÈNE HLA-B27',
    description: 'N/A',
    specimen: '1 tube jaune clair',
    price: 184.00,
    turnaroundTime: '30 jours',
    type: 'individual'
  },
  {
    code: 'PSA',
    name: 'ANTIGÈNE PROSTATIQUE SPÉCIFIQUE (APS)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 69.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PROCAG',
    name: 'ANTIGÈNE PROTÉINE C',
    description: 'Collection au centre Dobrin.',
    specimen: '2 tubes bleu clair',
    price: 108.00,
    turnaroundTime: '19 jours',
    type: 'individual'
  },
  {
    code: 'ANHBS',
    name: 'ANTI-HBs',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 69.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ANTITH',
    name: 'ANTITHROMBINE III (ACTIVITÉ)',
    description: 'Collection au centre Dobrin.',
    specimen: '1 tube bleu clair',
    price: 84.00,
    turnaroundTime: '16 jours',
    type: 'individual'
  },
  {
    code: 'APOA',
    name: 'APOLIPOPROTÉINE A1',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 69.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'APOB',
    name: 'APOLIPOPROTÉINE B',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 60.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FPSA',
    name: 'APS LIBRE',
    description: 'APS Total et Ratio inclus.',
    specimen: '1 tube gel',
    price: 115.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ARSENIWB',
    name: 'ARSENIC SANG ENTIER',
    description: 'Éviter agents de contraste 48h.',
    specimen: '1 tube bleu foncé (K2EDTA)',
    price: 59.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'ARSENIRU',
    name: 'ARSENIC URINE',
    description: 'N/A',
    specimen: 'Contenant stérile',
    price: 59.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'AST',
    name: 'AST',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BERY',
    name: 'BÉRYLLIUM SANG ENTIER',
    description: 'N/A',
    specimen: '1 tube bleu foncé',
    price: 166.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'B2MICRO',
    name: 'BETA-2-MICROGLOBULINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 76.00,
    turnaroundTime: '15 jours',
    type: 'individual'
  },
  {
    code: 'CD4',
    name: 'BILAN D\'IMMUNODÉFICIENCE',
    description: 'CD4, CD8, CD3',
    specimen: '1 tube lavande',
    price: 253.00,
    turnaroundTime: '20 jours',
    type: 'individual'
  },
  {
    code: 'BILITD',
    name: 'BILIRUBINE DIRECTE/CONJUGUÉE',
    description: 'Inclus Bilirubine Totale.',
    specimen: '1 tube gel',
    price: 45.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BILINDP',
    name: 'BILIRUBINE INDIRECTE/NON CONJUGUÉE',
    description: 'Inclus Bilirubine Totale.',
    specimen: '1 tube gel',
    price: 54.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BILIT',
    name: 'BILIRUBINE TOTALE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'BRUC',
    name: 'BRUCELLA/BRUCELLOSE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 33.00,
    turnaroundTime: '30 jours',
    type: 'individual'
  },
  {
    code: 'CA19',
    name: 'CA 19-9',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 79.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CA125',
    name: 'CA 125',
    description: 'Ovaire',
    specimen: '1 tube gel',
    price: 82.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CA153',
    name: 'CA 15-3',
    description: 'Sein',
    specimen: '1 tube gel',
    price: 79.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'CADMIWB',
    name: 'CADMIUM SANG ENTIER',
    description: 'N/A',
    specimen: '1 tube bleu foncé',
    price: 58.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'CALCI',
    name: 'CALCITONINE',
    description: 'Congeler rapidement.',
    specimen: '1 tube gel',
    price: 136.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'CA',
    name: 'CALCIUM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CAI',
    name: 'CALCIUM IONISÉ',
    description: 'À jeun 12h. Anaérobique.',
    specimen: '1 tube gel',
    price: 47.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'CAURAN',
    name: 'CALCIUM - URINE AU HASARD',
    description: 'N/A',
    specimen: 'Contenant stérile',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: '24UCA',
    name: 'CALCIUM - URINES DE 24 HEURES',
    description: 'N/A',
    specimen: 'Contenant 24h',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TEG',
    name: 'CARBAMAZEPINE (TEGRETOL)',
    description: 'Taux résiduel.',
    specimen: '1 tube rouge avec activateur',
    price: 54.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CARNITH',
    name: 'CARNITINE',
    description: 'Congeler rapidement.',
    specimen: '1 tube gel',
    price: 53.00,
    turnaroundTime: '12 jours',
    type: 'individual'
  },
  {
    code: 'CATEMETA',
    name: 'CATÉCHOLAMINES ET MÉTANÉPHRINE (24H)',
    description: 'Diète spéciale.',
    specimen: 'Contenant 24h avec 25mL 6N HCl',
    price: 150.00,
    turnaroundTime: '11 jours',
    type: 'individual'
  },
  {
    code: 'CERU',
    name: 'CÉRULOPLASMINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 76.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'CH50',
    name: 'CH50, COMPLÉMENT TOTAL',
    description: 'Congeler rapidement.',
    specimen: '1 tube gel',
    price: 74.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'FLC',
    name: 'CHAÎNES LÉGÈRES LIBRES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 53.00,
    turnaroundTime: '7 jours',
    type: 'individual'
  },
  {
    code: 'HIVCV',
    name: 'CHARGE VIRALE (VIH)',
    description: 'N/A',
    specimen: '2 tubes lavande',
    price: 93.00,
    turnaroundTime: '16 jours',
    type: 'individual'
  },
  {
    code: 'TGCD',
    name: 'CHLAMYDIA/GONORRHOEAE/TRICHOMONAS (TAAN) - URINE',
    description: 'Dépistage',
    specimen: '2 contenants urine Aptima',
    price: 142.00,
    turnaroundTime: '6 jours',
    type: 'individual'
  },
  {
    code: 'CL',
    name: 'CHLORURES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CHOL',
    name: 'CHOLESTÉROL TOTAL',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CK',
    name: 'CK (CRÉATINE KINASE)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CKMB',
    name: 'CK-MB',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CLOS',
    name: 'CLOSTRIDIUM DIFFICILE',
    description: 'Selles.',
    specimen: 'Contenant stérile',
    price: 100.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'CO2',
    name: 'CO2 TOTAL (BICARBONATE)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'C3',
    name: 'COMPLÉMENT C3',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 70.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'C4',
    name: 'COMPLÉMENT C4',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 70.00,
    turnaroundTime: '4 jours',
    type: 'individual'
  },
  {
    code: 'CORTIAM',
    name: 'CORTISOL (MATIN)',
    description: '8h00',
    specimen: '1 tube gel',
    price: 63.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CREA',
    name: 'CRÉATININE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 27.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CRP',
    name: 'PROTÉINE C-RÉACTIVE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 49.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CRPHS',
    name: 'PROTÉINE C-RÉACTIVE HAUTE SENSIBILITÉ',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 49.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CSU',
    name: 'CULTURE: URINE',
    description: 'N/A',
    specimen: 'Contenant stérile',
    price: 64.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'UC',
    name: 'CULTURE D\'URINE + ANALYSE',
    description: 'N/A',
    specimen: 'Contenant stérile + tube urine BD',
    price: 69.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'STREP',
    name: 'CULTURE GORGE + STREP A RAPIDE',
    description: 'N/A',
    specimen: 'Écouvillon Stuart',
    price: 33.00,
    turnaroundTime: '2 jours',
    type: 'individual'
  },
  {
    code: 'DHEA',
    name: 'DHEA',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 114.00,
    turnaroundTime: '21 jours',
    type: 'individual'
  },
  {
    code: 'DHEAS',
    name: 'DHEAS',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 89.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AMPH',
    name: 'DROGUE: AMPHETAMINES',
    description: 'Urine',
    specimen: 'Contenant stérile',
    price: 58.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CAN',
    name: 'DROGUE: CANNABINOIDES',
    description: 'Urine',
    specimen: 'Contenant stérile',
    price: 51.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'COCAINE',
    name: 'DROGUE: COCAINE',
    description: 'Urine',
    specimen: 'Contenant stérile',
    price: 58.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ECG',
    name: 'ÉLECTROCARDIOGRAMME',
    description: 'Avec interprétation',
    specimen: 'ECG',
    price: 68.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'LYTES',
    name: 'ÉLECTROLYTES (Na, K, Cl)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 37.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ESTRA',
    name: 'ESTRADIOL',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 66.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FE',
    name: 'FER',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FERI',
    name: 'FERRITINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 69.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FIBR',
    name: 'FIBRINOGÈNE',
    description: 'N/A',
    specimen: '1 tube bleu pâle',
    price: 63.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'CBC',
    name: 'FORMULE SANGUINE COMPLETE (FSC)',
    description: 'N/A',
    specimen: '1 tube lavande',
    price: 53.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'FSH',
    name: 'FSH',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 63.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'AC',
    name: 'GLUCOSE AC',
    description: 'À jeun 8h.',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'ACP',
    name: 'GLUCOSE AU HASARD',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HBA1C',
    name: 'HÉMOGLOBINE A1C',
    description: 'N/A',
    specimen: '1 tube lavande',
    price: 53.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'HGH',
    name: 'HORMONE DE CROISSANCE (GH)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 76.00,
    turnaroundTime: '9 jours',
    type: 'individual'
  },
  {
    code: 'LH',
    name: 'LH',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 66.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'INSUL',
    name: 'INSULINE (À JEUN)',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 70.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'MG',
    name: 'MAGNÉSIUM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '3 jours',
    type: 'individual'
  },
  {
    code: 'MONO',
    name: 'MONONUCLÉOSE',
    description: 'Dépistage',
    specimen: '1 tube gel',
    price: 30.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PHOS',
    name: 'PHOSPHORE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PROG',
    name: 'PROGESTÉRONE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 66.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PROL',
    name: 'PROLACTINE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 71.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PROT',
    name: 'PROTÉINES TOTALES',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PT',
    name: 'RAPPORT INTERNATIONAL NORMALISÉ (INR)',
    description: 'Inclus PT.',
    specimen: '1 tube bleu pâle',
    price: 37.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'PTPTT',
    name: 'INR + PTT',
    description: 'N/A',
    specimen: '1 tube bleu pâle',
    price: 58.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'NA',
    name: 'SODIUM',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'T3F',
    name: 'T3 LIBRE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 47.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'T4F',
    name: 'T4 LIBRE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 63.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TEST',
    name: 'TESTOSTÉRONE TOTALE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 80.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'TSH',
    name: 'TSH ULTRASENSIBLE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 69.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'UREA',
    name: 'URÉE',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 38.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'B12',
    name: 'VITAMINE B12',
    description: 'N/A',
    specimen: '1 tube gel',
    price: 56.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  },
  {
    code: 'SED',
    name: 'VITESSE DE SÉDIMENTATION',
    description: 'N/A',
    specimen: '1 tube lavande',
    price: 42.00,
    turnaroundTime: '1 jour',
    type: 'individual'
  }
];


// ── Seed Function ───────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database with real lab data...");

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
  // Delete in FK-safe order
  await prisma.estimateEmail.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.testMappingEntry.deleteMany();
  await prisma.testMapping.deleteMany();
  await prisma.test.deleteMany();
  await prisma.priceList.deleteMany();
  console.log("  Cleaned existing test data");

  // ── 4. Helper: map raw PDF fields → schema fields ────────────────────
  // Build tube color lookups (clean tube cap colors)
  const cdlTubeByCode = new Map(Object.entries(CDL_SEED1).map(([code, d]) => [code, d.tube]));
  const qcTubeByCode = new Map(Object.entries(QC_SEED1).map(([code, d]) => [code, d.tube]));

  const mapTests = (tests: RawTest[], tubeLookup: Map<string, string>) =>
    tests.map((t) => ({
      code: t.code,
      name: t.name,
      description: t.description,
      tubeType: tubeLookup.get(t.code) ?? t.specimen,
      price: t.price,
      turnaroundTime: t.turnaroundTime,
      category: t.type === "profile" ? "Profil" : "Individuel",
    }));

  // ── 5. Create PriceLists with nested Tests ────────────────────────────
  const cdlPriceList = await prisma.priceList.create({
    data: {
      laboratoryId: cdlLab.id,
      fileName: "CDL_catalogue_2024.pdf",
      fileType: "PDF",
      fileSize: 2500000,
      isActive: true,
      tests: { create: mapTests(cdlTests, cdlTubeByCode) },
    },
    include: { tests: true },
  });
  console.log(
    `  Price list "${cdlPriceList.fileName}" with ${cdlPriceList.tests.length} tests`
  );

  const dynacarePriceList = await prisma.priceList.create({
    data: {
      laboratoryId: dynacareLab.id,
      fileName: "Dynacare_catalogue_2024.pdf",
      fileType: "PDF",
      fileSize: 1800000,
      isActive: true,
      tests: { create: mapTests(dynacareTests, qcTubeByCode) },
    },
    include: { tests: true },
  });
  console.log(
    `  Price list "${dynacarePriceList.fileName}" with ${dynacarePriceList.tests.length} tests`
  );

  // ── 6. Test Mappings via Canonical Registry ─────────────────────────
  // Deterministic: every raw test resolves to a canonical entry by code or alias.
  const { byCode, byAlias } = buildCanonicalIndexes(CANONICAL_TEST_REGISTRY);

  // Group all raw tests (from both labs) by their resolved canonical entry
  type LabTestInfo = { labId: string; rawTest: RawTest; dbTestId: string };
  const canonicalGroups = new Map<string, { def: (typeof CANONICAL_TEST_REGISTRY)[number]; labs: LabTestInfo[] }>();

  const allLabTests: { labId: string; rawTests: RawTest[]; dbTests: { id: string; name: string; code: string | null }[] }[] = [
    { labId: cdlLab.id, rawTests: cdlTests, dbTests: cdlPriceList.tests },
    { labId: dynacareLab.id, rawTests: dynacareTests, dbTests: dynacarePriceList.tests },
  ];

  let resolvedCount = 0;
  let unmatchedCount = 0;

  for (const { labId, rawTests, dbTests } of allLabTests) {
    // Build name→dbTest lookup for this lab
    const dbTestByName = new Map(dbTests.map((t) => [t.name, t]));

    for (const raw of rawTests) {
      // Resolution order: code first, then normalized name
      const def = byCode.get(raw.code) ?? byAlias.get(normalizeForLookup(raw.name));
      if (!def) {
        console.warn(`  ⚠ UNMATCHED: [${raw.code}] "${raw.name}" — add to canonical registry`);
        unmatchedCount++;
        continue;
      }

      const dbTest = dbTestByName.get(raw.name);
      if (!dbTest) continue; // shouldn't happen

      if (!canonicalGroups.has(def.canonicalName)) {
        canonicalGroups.set(def.canonicalName, { def, labs: [] });
      }
      canonicalGroups.get(def.canonicalName)!.labs.push({ labId, rawTest: raw, dbTestId: dbTest.id });
      resolvedCount++;
    }
  }

  console.log(`  ${resolvedCount} tests resolved via canonical registry`);
  if (unmatchedCount > 0) console.warn(`  ⚠ ${unmatchedCount} tests UNMATCHED (update registry!)`);

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

    const mapping = await prisma.testMapping.create({
      data: {
        canonicalName,
        code: def.code,
        category: def.category,
        aliases: def.aliases,
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
      // Find all db test IDs for this lab in this canonical group
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

  // Build name → id map from the mappings we just created
  const allMappings = await prisma.testMapping.findMany({ select: { id: true, canonicalName: true } });
  const nameToId = new Map(allMappings.map((m) => [m.canonicalName, m.id]));

  const bundleDefs = [
    {
      dealName: "Bilan Lipidique",
      description: "Exploration complète du profil lipidique",
      category: "Biochimie",
      icon: "🩸",
      popular: true,
      sortOrder: 0,
      canonicalNames: ["Cholestérol Total", "Cholestérol HDL", "Cholestérol LDL", "Triglycérides"],
      customRate: 150,
    },
    {
      dealName: "Bilan Hépatique",
      description: "Évaluation de la fonction hépatique",
      category: "Biochimie",
      icon: "🫁",
      popular: false,
      sortOrder: 1,
      canonicalNames: ["AST (SGOT)", "ALT (SGPT)", "GGT", "Bilirubine Totale"],
      customRate: 130,
    },
    {
      dealName: "Bilan Rénal",
      description: "Exploration de la fonction rénale",
      category: "Biochimie",
      icon: "🫀",
      popular: false,
      sortOrder: 2,
      canonicalNames: ["Créatinine", "Urée", "Acide Urique"],
      customRate: 80,
    },
    {
      dealName: "Bilan Thyroïdien",
      description: "Exploration complète de la thyroïde",
      category: "Hormonologie",
      icon: "🧬",
      popular: false,
      sortOrder: 3,
      canonicalNames: ["TSH", "T3 Libre", "T4 Libre"],
      customRate: 230,
    },
    {
      dealName: "Bilan Prénatal",
      description: "Bilan de suivi de grossesse",
      category: "Mixte",
      icon: "🤰",
      popular: false,
      sortOrder: 4,
      canonicalNames: ["Groupe Sanguin & Rh", "Formule Sanguine Complète (FSC)", "TOXOPLASMOSE IgG, IgM", "Rubéole IgG", "HIV (VIH) Dépistage"],
      customRate: 380,
    },
  ];

  for (const def of bundleDefs) {
    const testMappingIds = def.canonicalNames
      .map((name) => nameToId.get(name))
      .filter((id): id is string => !!id);

    await prisma.bundleDeal.create({
      data: {
        dealName: def.dealName,
        description: def.description,
        category: def.category,
        icon: def.icon,
        popular: def.popular,
        sortOrder: def.sortOrder,
        customRate: def.customRate,
        testMappingIds,
      },
    });
  }
  console.log(`  ✓ ${bundleDefs.length} bundle deals seeded`);

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
        {
          name: "clientName",
          label: "Nom du client",
          sampleValue: "Jean Dupont",
        },
        {
          name: "testNames",
          label: "Noms des analyses",
          sampleValue: "Glycémie, Créatinine",
        },
        {
          name: "comparisonTableHtml",
          label: "Tableau comparatif (HTML)",
          isHtml: true,
          sampleValue: "<table><tr><td>...</td></tr></table>",
        },
        {
          name: "cheapestLabName",
          label: "Labo le moins cher",
          sampleValue: "Laboratoires CDL",
        },
        {
          name: "cheapestLabPrice",
          label: "Prix le moins cher",
          sampleValue: "150,00 $",
        },
        {
          name: "companyLogoUrl",
          label: "URL du logo",
          sampleValue: "https://example.com/logo.png",
        },
        {
          name: "signatureHtml",
          label: "Signature HTML",
          isHtml: true,
          sampleValue:
            "<p>Cordialement,<br/>L'équipe Lab Price Comparator</p>",
        },
      ],
    },
  });
  console.log("  Default comparison email template");

  // ── Summary ───────────────────────────────────────────────────────────
  const totalTests = cdlPriceList.tests.length + dynacarePriceList.tests.length;
  console.log("\nSeeding completed!");
  console.log(`   - 1 admin user`);
  console.log(`   - 2 laboratories (CDL, Dynacare)`);
  console.log(`   - 2 price lists (${totalTests} tests total)`);
  console.log(`   - ${canonicalGroups.size} canonical test mappings (${crossLabCount} cross-lab, ${singleLabCount} single-lab)`);
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
