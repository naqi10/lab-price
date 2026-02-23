/**
 * CDL Laboratories Test Catalog Seed Data
 * Mapped from CDL Manual Catalog (2025-2026)
 */

export interface TestDefinition {
  code: string;
  name: string;
  tube: string;
  specimenType: string;
  turnaroundTime: string; // Business days
  notes?: string;
}

export const cdlSeedData: TestDefinition[] = [
  // --- A ---
  {
    code: "HIAA",
    name: "5-HIAA (5-Hydroxyindoleacetic Acid)",
    tube: "24h Urine Container",
    specimenType: "Urine (24h) with preservative (HCl 6N)",
    turnaroundTime: "5-9"
  },
  {
    code: "ACBA",
    name: "Acetylcholine, Anticorps Bloquants",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "7"
  },
  {
    code: "ACRA",
    name: "Acetylcholine, Anticorps Liant",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "FOLC",
    name: "Acide Folique (Folate)",
    tube: "Gold",
    specimenType: "Serum (SST) - Protect from light",
    turnaroundTime: "1"
  },
  {
    code: "MMAS",
    name: "Acide Méthylmalonique",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "6"
  },
  {
    code: "URIC",
    name: "Acide Urique",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "UA/U",
    name: "Acide Urique (Urine 24h)",
    tube: "24h Urine Container",
    specimenType: "Urine (24h) with preservative (NaOH)",
    turnaroundTime: "1"
  },
  {
    code: "VALP",
    name: "Acide Valproïque (Depakene/Epival)",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "1"
  },
  {
    code: "ADUL",
    name: "Adalimumab",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "10"
  },
  {
    code: "ALB",
    name: "Albumine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ALDO",
    name: "Aldostérone",
    tube: "Red or Lavender",
    specimenType: "Serum (No Gel) or Plasma (Lavender) - NO SST",
    turnaroundTime: "10"
  },
  {
    code: "A1AT",
    name: "Alpha-1 Antitrypsine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "5"
  },
  {
    code: "AFP",
    name: "Alpha-Foetoprotéine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ALT",
    name: "ALT (SGPT)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "AL",
    name: "Aluminium",
    tube: "Royal Blue",
    specimenType: "Whole Blood (Royal Blue) or Lavender",
    turnaroundTime: "4"
  },
  {
    code: "AMPH",
    name: "Amphétamine (Dépistage)",
    tube: "Sterile Container",
    specimenType: "Urine",
    turnaroundTime: "1"
  },
  {
    code: "AMYL",
    name: "Amylase",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ANDR",
    name: "Androsténédione",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "7"
  },
  {
    code: "ANA",
    name: "Anti-Nucléaire Anticorps (ANA)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "6"
  },
  {
    code: "ENA",
    name: "Anti-Nucléaires Extractables (ENA)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "9"
  },
  {
    code: "ASOT",
    name: "Antistreptolysine O (ASO)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "APOA",
    name: "Apolipoprotéine A-1",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "APOB",
    name: "Apolipoprotéine B",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "APOE",
    name: "Apolipoprotéine E (Genotyping)",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA) - Do Not Centrifuge",
    turnaroundTime: "8"
  },
  {
    code: "BARS",
    name: "Arsenic",
    tube: "Royal Blue",
    specimenType: "Whole Blood (Royal Blue)",
    turnaroundTime: "7"
  },
  {
    code: "AST",
    name: "AST (SGOT)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- B ---
  {
    code: "CTTBP",
    name: "Bacille de Koch (Tuberculose) Culture",
    tube: "Sterile Container",
    specimenType: "Sputum (3 samples over 3 days)",
    turnaroundTime: "60"
  },
  {
    code: "UBAR",
    name: "Barbituriques (Dépistage)",
    tube: "Sterile Container",
    specimenType: "Urine",
    turnaroundTime: "1"
  },
  {
    code: "BENZ",
    name: "Benzodiazépines (Dépistage)",
    tube: "Sterile Container",
    specimenType: "Urine",
    turnaroundTime: "1"
  },
  {
    code: "B2MG",
    name: "Bêta-2 Microglobuline",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "BHCG",
    name: "Bêta-HCG Quantitative (Grossesse)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PREG",
    name: "Bêta-HCG Qualitative",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CO2P",
    name: "Bicarbonate (CO2 Total)",
    tube: "Green",
    specimenType: "Whole Blood (Sodium Heparin) - Do Not Centrifuge",
    turnaroundTime: "1"
  },
  {
    code: "DBIL",
    name: "Bilirubine Directe",
    tube: "Gold",
    specimenType: "Serum (SST) - Protect from light",
    turnaroundTime: "1"
  },
  {
    code: "TBIL",
    name: "Bilirubine Totale",
    tube: "Gold",
    specimenType: "Serum (SST) - Protect from light",
    turnaroundTime: "1"
  },
  {
    code: "BIOP",
    name: "Biopsie",
    tube: "Formalin Container",
    specimenType: "Tissue",
    turnaroundTime: "6"
  },
  {
    code: "BORP",
    name: "Bordetella Pertussis (Coqueluche)",
    tube: "UTM Swab",
    specimenType: "Nasopharyngeal Swab",
    turnaroundTime: "1"
  },

  // --- C ---
  {
    code: "C125",
    name: "CA 125",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "C153",
    name: "CA 15-3",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "6"
  },
  {
    code: "C199",
    name: "CA 19-9",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "7"
  },
  {
    code: "CD",
    name: "Cadmium",
    tube: "Royal Blue",
    specimenType: "Whole Blood (Royal Blue)",
    turnaroundTime: "6"
  },
  {
    code: "CA",
    name: "Calcium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CAIP",
    name: "Calcium Ionisé",
    tube: "Green",
    specimenType: "Whole Blood (Green - Full)",
    turnaroundTime: "1"
  },
  {
    code: "CN50",
    name: "Cannabis (THC) Dépistage",
    tube: "Sterile Container",
    specimenType: "Urine",
    turnaroundTime: "1"
  },
  {
    code: "CARM",
    name: "Carbamazépine (Tegretol)",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "1"
  },
  {
    code: "CEA",
    name: "Carcino-Embryonic Antigen (CEA)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CLPTN",
    name: "Calprotectine",
    tube: "Sterile Container",
    specimenType: "Stool (Blue cap)",
    turnaroundTime: "6"
  },
  {
    code: "UCAT",
    name: "Catécholamines (Urine)",
    tube: "24h Urine Container",
    specimenType: "Urine (24h) with preservative (HCl 6N)",
    turnaroundTime: "7"
  },
  {
    code: "CATS",
    name: "Catécholamines (Plasma)",
    tube: "Lavender",
    specimenType: "Plasma (EDTA)",
    turnaroundTime: "7"
  },
  {
    code: "CUBP",
    name: "Céruloplasmine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "7"
  },
  {
    code: "CMPC",
    name: "Chlamydia (PCR Cervical/Endocervical)",
    tube: "PCR Kit",
    specimenType: "Swab",
    turnaroundTime: "2"
  },
  {
    code: "CMPCU",
    name: "Chlamydia (Urine)",
    tube: "Sterile Container",
    specimenType: "Urine (First catch)",
    turnaroundTime: "2"
  },
  {
    code: "CL",
    name: "Chlorure",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CHOL",
    name: "Cholestérol Total",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HDL",
    name: "Cholestérol HDL",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "LDLD",
    name: "Cholestérol LDL",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CK",
    name: "Créatine Kinase (CK)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CKMB",
    name: "CK-MB",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "CREA",
    name: "Créatinine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "COKE",
    name: "Cocaïne (Dépistage)",
    tube: "Sterile Container",
    specimenType: "Urine",
    turnaroundTime: "1"
  },
  {
    code: "SCORT",
    name: "Cortisol (AM/PM)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CRP",
    name: "Protéine C-Réactive (CRP)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CRPHS",
    name: "CRP Haute Sensibilité (Cardio)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CULU",
    name: "Urine (Culture)",
    tube: "Sterile Container / Pea Green Tube",
    specimenType: "Urine",
    turnaroundTime: "2"
  },

  // --- D ---
  {
    code: "DDIM",
    name: "D-Dimère",
    tube: "Light Blue",
    specimenType: "Whole Blood/Plasma (Citrate) - Full Tube",
    turnaroundTime: "1"
  },
  {
    code: "DH-S",
    name: "DHEA-S",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "DIGX",
    name: "Digoxin (Lanoxin)",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "5"
  },
  {
    code: "DHT",
    name: "Dihydrotestostérone",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "17"
  },

  // --- E ---
  {
    code: "ELEC",
    name: "Électrolytes (Na, K, Cl)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "SPEP",
    name: "Électrophorèse des protéines (Sérum)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "ESTR",
    name: "Estradiol",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "SETH",
    name: "Éthanol (Sérum)",
    tube: "Gold",
    specimenType: "Serum (SST) - Do not use alcohol swab",
    turnaroundTime: "1"
  },

  // --- F ---
  {
    code: "FE",
    name: "Fer Total",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FERR",
    name: "Ferritine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FIB",
    name: "Fibrinogène",
    tube: "Light Blue",
    specimenType: "Whole Blood (Citrate) - Full Tube",
    turnaroundTime: "2"
  },
  {
    code: "CBC",
    name: "Formule Sanguine Complète (FSC)",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "FSH",
    name: "FSH (Hormone Folliculo-stimulante)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- G ---
  {
    code: "GGT",
    name: "GGT",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ACGL",
    name: "Glucose (À Jeun/AC)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "GLU",
    name: "Glucose (Aléatoire)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "2HGTT",
    name: "Glucose Tolerance Test (2h)",
    tube: "Gold",
    specimenType: "Serum (SST) x 3-4",
    turnaroundTime: "1"
  },
  {
    code: "GLHBP",
    name: "HbA1c (Hémoglobine Glyquée)",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "GONO",
    name: "Gonorrhée (PCR Cervical/Endocervical)",
    tube: "PCR Kit",
    specimenType: "Swab",
    turnaroundTime: "2"
  },
  {
    code: "GONOU",
    name: "Gonorrhée (Urine)",
    tube: "Sterile Container",
    specimenType: "Urine (First catch)",
    turnaroundTime: "2"
  },
  {
    code: "BLDT",
    name: "Groupe Sanguin & Rh",
    tube: "Pink",
    specimenType: "Whole Blood (Pink)",
    turnaroundTime: "1"
  },

  // --- H ---
  {
    code: "HEPC",
    name: "Hépatite C (Anticorps)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HCVL",
    name: "Hépatite C Charge Virale",
    tube: "Lavender",
    specimenType: "Plasma (EDTA)",
    turnaroundTime: "4"
  },
  {
    code: "HSAG",
    name: "Hépatite B (Ag de surface - HBsAg)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HIV",
    name: "HIV (VIH) Dépistage",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HIVL",
    name: "HIV Charge Virale",
    tube: "Lavender",
    specimenType: "Plasma (EDTA)",
    turnaroundTime: "5"
  },
  {
    code: "HCYS",
    name: "Homocystéine",
    tube: "Lavender",
    specimenType: "Plasma (EDTA) - Ice, process immediately",
    turnaroundTime: "2"
  },
  {
    code: "HPBT",
    name: "H. Pylori Breath Test",
    tube: "Breath Test Kit",
    specimenType: "Breath",
    turnaroundTime: "2"
  },

  // --- I ---
  {
    code: "IGA",
    name: "Immunoglobuline A (IgA)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "IGG",
    name: "Immunoglobuline G (IgG)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "IGM",
    name: "Immunoglobuline M (IgM)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "IGE",
    name: "Immunoglobuline E (IgE)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "ISLN",
    name: "Insuline",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "PT",
    name: "INR / PT",
    tube: "Light Blue",
    specimenType: "Whole Blood (Citrate) - Full Tube",
    turnaroundTime: "1"
  },

  // --- L ---
  {
    code: "LD",
    name: "Lactate Déshydrogénase (LDH)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "LITH",
    name: "Lithium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "LASE",
    name: "Lipase",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "LH",
    name: "LH (Hormone Lutéinisante)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- M ---
  {
    code: "MG",
    name: "Magnésium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "MONO",
    name: "Monotest (Mononucléose)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- O ---
  {
    code: "PARA",
    name: "Ova and Parasites (Oeufs et Parasites) - Selles",
    tube: "Stool Container (x3)",
    specimenType: "Stool with formalin",
    turnaroundTime: "3"
  },

  // --- P ---
  {
    code: "PTH",
    name: "Parathormone (PTH)",
    tube: "Lavender",
    specimenType: "Whole Blood or Plasma",
    turnaroundTime: "6"
  },
  {
    code: "PO4",
    name: "Phosphore (Phosphate)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PLT",
    name: "Plaquettes",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "PB",
    name: "Plomb (Sang)",
    tube: "Royal Blue",
    specimenType: "Whole Blood (Royal Blue)",
    turnaroundTime: "6"
  },
  {
    code: "K",
    name: "Potassium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PROG",
    name: "Progestérone",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PRLA",
    name: "Prolactine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TP",
    name: "Protéines Totales",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PSA",
    name: "PSA (APS) Total",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FPSA",
    name: "PSA (APS) Libre",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PTT",
    name: "PTT (TCA)",
    tube: "Light Blue",
    specimenType: "Whole Blood (Citrate) - Full Tube",
    turnaroundTime: "1"
  },

  // --- R ---
  {
    code: "RTIC",
    name: "Réticulocytes",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "RUBE",
    name: "Rubéole IgG",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- S ---
  {
    code: "SEDI",
    name: "Sédimentation (Vitesse de)",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "NA",
    name: "Sodium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "SYPEIA",
    name: "Syphilis (VDRL/RPR)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- T ---
  {
    code: "FT3",
    name: "T3 Libre",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FT4",
    name: "T4 Libre",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TEST",
    name: "Testostérone Totale",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TESBC",
    name: "Testostérone Biodisponible",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TESFC",
    name: "Testostérone Libre",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "THYG",
    name: "Thyroglobuline",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "5"
  },
  {
    code: "TRFN",
    name: "Transferrine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TRIG",
    name: "Triglycérides",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TSH",
    name: "TSH",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- U ---
  {
    code: "UREA",
    name: "Urée",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "URC",
    name: "Urine (Analyse)",
    tube: "Sterile Container",
    specimenType: "Urine",
    turnaroundTime: "1"
  },

  // --- V ---
  {
    code: "VARG",
    name: "Varicelle IgG",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "6"
  },
  {
    code: "VB12",
    name: "Vitamine B12",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "25D",
    name: "Vitamine D (25-OH)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- Z ---
  {
    code: "ZN",
    name: "Zinc (Plasma)",
    tube: "Royal Blue",
    specimenType: "Plasma (Royal Blue)",
    turnaroundTime: "7"
  }
];



/**
 * Dynacare QC Specimen Collection Manual 2023
 * Seed Data for Test Codes, Tube Colors, and Specimen Types
 */

export interface TestDefinition {
  code: string;
  name: string;
  tube: string;
  specimenType: string;
  turnaroundTime: string; // In business days
  price?: string;
}

export const qcSeedData: TestDefinition[] = [
  // --- A ---
  {
    code: "APH ACETONE",
    name: "Acetaminophène & Acétone",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "VAL",
    name: "Acide Valproïque (Depakene)",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "1"
  },
  {
    code: "ALB",
    name: "Albumine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ALCO",
    name: "Alcool (Ethanol) - Sang",
    tube: "Gold",
    specimenType: "Serum (SST) - Do not use alcohol swab",
    turnaroundTime: "1"
  },
  {
    code: "DOST",
    name: "Aldostérone",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "11"
  },
  {
    code: "TRYP",
    name: "Alpha-1 Antitrypsine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "AFP",
    name: "Alpha-Foetoprotéine (AFP)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ALT",
    name: "ALT (SGPT)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "AMIK",
    name: "Amikacine (Au hasard/Pré/Post)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "AMITRIP",
    name: "Amitriptyline",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "11"
  },
  {
    code: "AMMO",
    name: "Ammoniaque",
    tube: "Lavender",
    specimenType: "Plasma (EDTA) - On Ice",
    turnaroundTime: "9"
  },
  {
    code: "AMYL",
    name: "Amylase",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ANDRO",
    name: "Androstènedione",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "11"
  },
  {
    code: "ANA",
    name: "Anticorps Antinucléaires (ANA)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "DNA",
    name: "Anticorps Anti-ADN (Double Brin)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "ASOT",
    name: "Antistreptolysine O (ASO)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "APOA",
    name: "Apolipoprotéine A-1",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "APOB",
    name: "Apolipoprotéine B",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ARSENIWB",
    name: "Arsenic (Sang Total)",
    tube: "Royal Blue",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "9"
  },
  {
    code: "AST",
    name: "AST (SGOT)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- B ---
  {
    code: "B2MICRO",
    name: "Beta-2 Microglobuline",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "15"
  },
  {
    code: "BSQUANT",
    name: "Beta-HCG Quantitative",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "BILIT",
    name: "Bilirubine Totale",
    tube: "Gold",
    specimenType: "Serum (SST) - Protect from Light",
    turnaroundTime: "1"
  },
  {
    code: "BILITD",
    name: "Bilirubine Directe",
    tube: "Gold",
    specimenType: "Serum (SST) - Protect from Light",
    turnaroundTime: "1"
  },
  {
    code: "BNP",
    name: "BNP (NT-pro-BNP)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },

  // --- C ---
  {
    code: "C3",
    name: "Complément C3",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "C4",
    name: "Complément C4",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "CA125",
    name: "CA 125",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CA153",
    name: "CA 15-3",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "CA19",
    name: "CA 19-9",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "CA",
    name: "Calcium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CAI",
    name: "Calcium Ionisé",
    tube: "Gold",
    specimenType: "Serum (SST) - Do not open tube",
    turnaroundTime: "4"
  },
  {
    code: "TEG",
    name: "Carbamazépine (Tegretol)",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "1"
  },
  {
    code: "CEA",
    name: "Carcino-Embryonic Antigen (CEA)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CERU",
    name: "Céruloplasmine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "CHOL",
    name: "Cholestérol Total",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CK",
    name: "Créatine Kinase (CK)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CKMB",
    name: "CK-MB",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CL",
    name: "Chlorure",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CO2",
    name: "CO2 Total (Bicarbonate)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "COD",
    name: "Coombs Direct",
    tube: "Pink",
    specimenType: "Whole Blood (Pink)",
    turnaroundTime: "3"
  },
  {
    code: "AMAT",
    name: "Coombs Indirect",
    tube: "Pink",
    specimenType: "Whole Blood (Pink) x 2",
    turnaroundTime: "3"
  },
  {
    code: "CORTIAM",
    name: "Cortisol (AM)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CORTIPM",
    name: "Cortisol (PM)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CREA",
    name: "Créatinine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CRP",
    name: "Protéine C-Réactive (CRP)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "CRPHS",
    name: "CRP Haute Sensibilité",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "COPPERWB",
    name: "Cuivre (Sang Total)",
    tube: "Royal Blue",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "5"
  },

  // --- D ---
  {
    code: "DHEA",
    name: "DHEA",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "21"
  },
  {
    code: "DHEAS",
    name: "DHEA-Sulfate",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "DIG",
    name: "Digoxine",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "3"
  },
  {
    code: "DHT",
    name: "Dihydrotestostérone",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "17"
  },
  {
    code: "DIL",
    name: "Dilantin (Phénytoïne)",
    tube: "Red",
    specimenType: "Serum (No Gel)",
    turnaroundTime: "1"
  },

  // --- E ---
  {
    code: "LYTES",
    name: "Électrolytes (Na, K, Cl)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ELEPRO",
    name: "Électrophorèse des protéines (Sérum)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "ESTRA",
    name: "Estradiol",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ESTRON",
    name: "Estrone",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "9"
  },

  // --- F ---
  {
    code: "FE",
    name: "Fer",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FERI",
    name: "Ferritine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FIBR",
    name: "Fibrinogène",
    tube: "Light Blue",
    specimenType: "Whole Blood (Citrate)",
    turnaroundTime: "1"
  },
  {
    code: "FOL",
    name: "Folate (Sérique)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FOLRBC",
    name: "Folates Érythrocytaires",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "4"
  },
  {
    code: "CBC",
    name: "Formule Sanguine Complète (FSC)",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "FSH",
    name: "FSH",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- G ---
  {
    code: "GGT",
    name: "GGT",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "AC",
    name: "Glucose (À Jeun/AC)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ACP",
    name: "Glucose (Aléatoire)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "GLU75",
    name: "Glucose 75g (2h) - Non Gestationnel",
    tube: "Gold",
    specimenType: "Serum (SST) x 2 (Fasting + 2h)",
    turnaroundTime: "1"
  },
  {
    code: "PREG50",
    name: "Glucose 50g (1h) - Gestationnel",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PREG75",
    name: "Glucose 75g (2h) - Gestationnel",
    tube: "Gold",
    specimenType: "Serum (SST) x 3 (Fasting, 1h, 2h)",
    turnaroundTime: "1"
  },
  {
    code: "BLOOD",
    name: "Groupe Sanguin & Rh",
    tube: "Pink",
    specimenType: "Whole Blood (Pink)",
    turnaroundTime: "3"
  },

  // --- H ---
  {
    code: "HBA1C",
    name: "HbA1c",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "HBS",
    name: "Hépatite B (HBsAg)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "ANHBS",
    name: "Hépatite B (Anti-HBs)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HEPBC",
    name: "Hépatite B (Anti-HBc Total)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HEPC",
    name: "Hépatite C (Anticorps)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HEPCQUANT",
    name: "Hépatite C (Charge Virale Quant.)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "16"
  },
  {
    code: "HIV",
    name: "HIV (Dépistage)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "HIVCV",
    name: "HIV Charge Virale",
    tube: "Lavender",
    specimenType: "Plasma (EDTA) x 2",
    turnaroundTime: "16"
  },
  {
    code: "LHOMO",
    name: "Homocystéine",
    tube: "Lavender",
    specimenType: "Plasma (EDTA) - On Ice, Sep <1h",
    turnaroundTime: "3"
  },
  {
    code: "HGH",
    name: "Hormone de Croissance (GH)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "9"
  },

  // --- I ---
  {
    code: "IGE",
    name: "IgE Totale",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "IMQUANT",
    name: "Immunoglobulines (IgG, IgA, IgM)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },
  {
    code: "PT",
    name: "INR (Rapport International Normalisé)",
    tube: "Light Blue",
    specimenType: "Whole Blood (Citrate)",
    turnaroundTime: "1"
  },
  {
    code: "INSUL",
    name: "Insuline",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- L ---
  {
    code: "LD",
    name: "Lactate Déshydrogénase (LDH)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "LH",
    name: "LH",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "LIP",
    name: "Lipase",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "LI",
    name: "Lithium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- M ---
  {
    code: "MG",
    name: "Magnésium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "MONO",
    name: "Mononucléose (Monotest)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- O ---
  {
    code: "OSM",
    name: "Osmolalité (Sérum)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "4"
  },

  // --- P ---
  {
    code: "PTH",
    name: "Parathormone (PTH)",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "PHOS",
    name: "Phosphore",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PbO",
    name: "Plomb (Sang)",
    tube: "Royal Blue",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "5"
  },
  {
    code: "K",
    name: "Potassium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PROG",
    name: "Progestérone",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PROL",
    name: "Prolactine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PSA",
    name: "PSA Total",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "FPSA",
    name: "PSA Libre (avec Total)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PROT",
    name: "Protéines Totales",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "PTT",
    name: "PTT (TCA)",
    tube: "Light Blue",
    specimenType: "Whole Blood (Citrate)",
    turnaroundTime: "1"
  },

  // --- Q ---
  {
    code: "QTB",
    name: "QuantiFERON-TB Gold",
    tube: "TB Kit",
    specimenType: "Whole Blood (4 tubes: Gray, Green, Yellow, Purple)",
    turnaroundTime: "14"
  },

  // --- R ---
  {
    code: "RETICP",
    name: "Réticulocytes",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "RF",
    name: "Rhumatoïde (Facteur)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "RUB",
    name: "Rubéole IgG",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- S ---
  {
    code: "SED",
    name: "Sédimentation (Vitesse)",
    tube: "Lavender",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "1"
  },
  {
    code: "NA",
    name: "Sodium",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "SYPH",
    name: "Syphilis (Dépistage)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- T ---
  {
    code: "T3F",
    name: "T3 Libre",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "T4F",
    name: "T4 Libre",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TEST",
    name: "Testostérone Totale",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TESBIO",
    name: "Testostérone Biodisponible",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "2"
  },
  {
    code: "TESLI",
    name: "Testostérone Libre",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "THYRO",
    name: "Thyroglobuline",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "3"
  },
  {
    code: "TRANS",
    name: "Transferrine",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TRIG",
    name: "Triglycérides",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "TSH",
    name: "TSH",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- U ---
  {
    code: "UREA",
    name: "Urée",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "URIC",
    name: "Acide Urique",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- V ---
  {
    code: "B12",
    name: "Vitamine B12",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },
  {
    code: "VITD",
    name: "Vitamine D (25-OH)",
    tube: "Gold",
    specimenType: "Serum (SST)",
    turnaroundTime: "1"
  },

  // --- Z ---
  {
    code: "ZINCWB",
    name: "Zinc (Sang Total)",
    tube: "Royal Blue",
    specimenType: "Whole Blood (EDTA)",
    turnaroundTime: "9"
  }
];