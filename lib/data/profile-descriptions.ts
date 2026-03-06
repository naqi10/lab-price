/**
 * Profile test descriptions extracted from:
 * - CDL Répertoire des Services 2026 (CDL manual catalog .pdf), Section "Description de l'analyse"
 * - QC Specimen Collection Manual-FR 2023 (Dynacare), "Regroupements d'analyses" table
 *
 * These descriptions list the individual tests included in each profile.
 */

export const CDL_PROFILE_DESCRIPTIONS: Record<string, string> = {
  // ANALYSE D'URINE
  "URC+": "Analyse d'urine, culture d'urine.",

  // ANÉMIE
  "FA12":   "Vitamine B12, acide folique.",
  "IRN2":   "FSC, ferritine.",
  "IRON":   "Fer total, % de saturation, UIBC, TIBC.",
  "IRN6":   "Fer total, % de saturation, UIBC, TIBC + ferritine.",
  "IRN1":   "Fer total, % de saturation, UIBC, TIBC + FSC, ferritine.",
  "ANE1":   "Fer total, % de saturation, UIBC, TIBC + FSC, réticulocytes.",
  "ANE4":   "Fer total, % de saturation, UIBC, TIBC + FSC, réticulocytes, ferritine.",
  "ANE3":   "Fer total, % de saturation, UIBC, TIBC + FSC, acide folique, réticulocytes, vitamine B12, ferritine.",
  "IRN3":   "Fer total, % de saturation, UIBC, TIBC + FSC, acide folique, vitamine B12, ferritine.",

  // BIOCHIMIE
  "B2GP":   "Beta-2 glycoprotéine I, IgA/IgG/IgM.",
  "DIAB":   "Glucose, hémoglobine A1c (glyquée).",
  "LIV1":   "Phosphatase alcaline, ALT, AST, GGT, bilirubine totale.",
  "PANC":   "Amylase, lipase.",
  "REN2":   "Sodium, potassium, chlorure, urée, créatinine.",
  "BIO1":   "Glucose, urée, créatinine, ALT, acide urique, électrolytes.",
  "CHM1":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales.",
  "CHM2":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore.",
  "CHM5":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes.",
  "CHL3":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides.",
  "CHP3":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, FSC, analyse d'urine.",
  "BIO3":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, LDH, globulines.",
  "CHM4":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque.",
  "CHL4":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque.",
  "BIO4":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, globulines, LDH.",
  "CH4U":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphate, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, FSC.",
  "CHP4":   "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, FSC, analyse d'urine.",
  "CHP4T":  "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, FSC, analyse d'urine, TSH.",
  "CHP4A":  "Glucose, urée, créatinine, ALT, AST, GGT, albumine, bilirubine totale, calcium, phosphatase alcaline, protéines totales + acide urique, phosphore, électrolytes, cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque, FSC, analyse d'urine, TSH, APS.",

  // COAGULATION
  "COAG":   "FSC, fibrinogène, PT/INR, PTT.",
  "PTPT":   "PT/INR, PTT.",

  // CYTOLOGIE
  "PAPTHPV": "Test Pap ThinPrep et virus du papillome humain (VPH).",
  "PVTP":    "Virus du papillome humain (VPH), test Pap ThinPrep en cascade.",
  "TPPV":    "Test Pap ThinPrep, virus du papillome humain (VPH) en cascade.",

  // DÉPISTAGE PRÉNATAUX
  "PREN":   "FSC, groupe sanguin & Rh, hépatite B antigène de surface, syphilis, rubéole IgG, recherche d'anticorps.",
  "PRENG":  "FSC, groupe sanguin & Rh, hépatite B antigène de surface, syphilis, rubéole IgG, recherche d'anticorps + glucose AC.",
  "DAL2":   "FSC, groupe sanguin & Rh, hépatite B antigène de surface, syphilis, rubéole IgG, recherche d'anticorps + VIH, analyse d'urine, culture d'urine.",
  "DAL2G":  "FSC, groupe sanguin & Rh, hépatite B antigène de surface, syphilis, rubéole IgG, recherche d'anticorps + VIH, analyse d'urine, culture d'urine, glucose.",

  // DÉPISTAGES PRÉNATAUX NON-INVASIFS
  "PANO":   "Dépistage prénatal des troubles génétiques via ADN placentaire.",
  "PANOE":  "Dépistage prénatal des troubles génétiques via ADN placentaire + microdélétions : 22q11.2 (Di George), 1p36, Angelman, Prader-Willi, Cri-du-chat.",
  "HARMP":  "Dépistage prénatal des troubles génétiques via ADN placentaire.",

  // DROGUES D'ABUS
  "DRUGH":  "Amphétamines, cannabis, cocaïne, opiaciés, phencyclidine.",
  "DAU450": "Amphétamines (1000 ng/mL), cannabis (50 ng/mL), cocaïne (300 ng/mL), opiaciés (300 ng/mL).",
  "DAUP":   "Amphétamines, cannabis, cocaïne, opiaciés (seuil 300 ng/mL) + éthanol (3 mmol/L).",
  "DAUB50": "Amphétamines, cannabis, cocaïne, opiaciés (seuil 50 ng/mL) + phencyclidine (25 ng/mL).",

  // ÉCHOGRAPHIES
  "ENDPE":  "Échographie endovaginale et pelvienne.",
  "ENDV":   "Échographie endovaginale.",
  "1TRI":   "Échographie obstétricale — entre 11.3 et 13.6 semaines de grossesse.",
  "2TRI":   "Échographie obstétricale — entre 18 semaines et 22.6 semaines de grossesse.",
  "3TRI":   "Échographie obstétricale — après 34 semaines de grossesse.",
  "VIAB":   "Échographie de viabilité-datation.",

  // ENDOCRINOLOGIE
  "FERT":   "FSH, LH.",
  "MEN1":   "FSH, LH + estradiol.",
  "MEN3":   "FSH, LH + estradiol, progestérone.",
  "MEN2":   "FSH, LH + estradiol, DHEA-S, progestérone.",
  "MEN4":   "FSH, LH + estradiol, DHEA-s, testostérone totale, prolactine, androstenedione.",

  // THYROÏDE
  "THY1R":  "TSH en cascade — T4 libre effectuée si TSH anormal.",
  "THY2R":  "TSH en cascade — T4 libre si TSH anormal, puis T3 libre si T4 libre anormal.",
  "THY3R":  "TSH en cascade — T4 libre et T3 libre effectuées d'emblée si TSH anormal.",
  "THY1":   "TSH, T4 libre.",
  "THY3":   "TSH, T4 libre + T3 libre.",
  "THY4":   "TSH, T4 libre + T3 libre, anticorps thyroïdiens.",

  // GÉNÉRAL
  "CH3U":   "Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, acide urique, phosphore, cholestérol total, triglycérides.",
  "CHP1":   "Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, analyse d'urine.",
  "FIN1":   "Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, analyse d'urine + protéine C-réactive.",
  "CHP2":   "Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, analyse d'urine + acide urique, phosphore.",
  "CH4SC":  "Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, analyse d'urine + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, protéine C-réactive ultra-sensible.",
  "GN5":    "Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, analyse d'urine + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, LDH, globulines.",
  "PNL6":   "Albumine, phosphatase alcaline, ALT, AST, GGT, calcium, créatinine, glucose, bilirubine totale, protéines totales, urée, électrolytes, FSC, analyse d'urine + acide urique, phosphore, cholestérol total, triglycérides, HDL & LDL, non-HDL, LDH.",

  // HÉMATOLOGIE
  "CBCS":   "Formule sanguine complète, vitesse de sédimentation.",
  "MON+":   "Formule sanguine complète, monotest.",

  // IMMUNOLOGIE
  "CELP":   "Albumine, électrophorèse des protéines (sérum), anti-gliadine IgA, immunoglobulines IgA, anti-transglutaminase IgA.",

  // RISQUE CARDIOVASCULAIRE
  "CVRK":   "Cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque.",
  "CVK2":   "Cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque + apolipoprotéine B.",
  "CCL4":   "Cholestérol total, triglycérides, HDL & LDL, non-HDL, facteurs de risque + ALT, CK.",

  // SÉROLOGIE
  "CGPCR1": "Chlamydia par PCR, gonorrhée par PCR (1 échantillon).",
  "CGPCR2": "Chlamydia par PCR, gonorrhée par PCR (2 échantillons).",
  "CGPCR3": "Chlamydia par PCR, gonorrhée par PCR (3 échantillons).",
  "HPBA":   "Hépatite B antigène de surface, hépatite B anticorps de surface, hépatite B anticorps total.",
  "STD2":   "Chlamydia et gonorrhée par PCR, culture vaginale.",
  "STDMH":  "Chlamydia et gonorrhée par PCR, syphilis PCR, VIH.",
};

export const QC_PROFILE_DESCRIPTIONS: Record<string, string> = {
  // REGROUPEMENTS CHLAMYDIA/GONORRHÉE
  "TGCD":     "Chlamydia, Neisseria Gonorrhea, Trichomonas Vaginalis — dépistage par TAAN.",
  "NGPCRD":   "Chlamydia, Neisseria Gonorrhoeae — dépistage par TAAN.",

  // ANÉMIE
  "ANEM1":    "Hémogramme, vitesse de sédimentation, TIBCP, vitamine B12, folates.",
  "ANEM11":   "Vitesse de sédimentation, hémogramme, ferritine.",
  "ANEM8":    "Vitesse de sédimentation, hémogramme, ferritine, TIBCP.",

  // BIOCHIMIE
  "SMA12":    "Glucose AC, albumine, phosphatase alcaline, AST, bilirubine totale, calcium, cholestérol, créatinine, LDH, protéines, urée, acide urique.",
  "SMA12LYT": "Glucose AC, albumine, phosphatase alcaline, AST, bilirubine totale, calcium, cholestérol, créatinine, LDH, protéines, urée, acide urique + électrolytes.",
  "SMAC":     "Glucose AC, calcium, phosphore, acide urique, urée, créatinine, bilirubine totale, phosphatase alcaline, LDH, AST, ALT, GGT, protéines, albumine, cholestérol, triglycérides.",
  "SMACLYT":  "Glucose AC, calcium, phosphore, acide urique, urée, créatinine, bilirubine totale, phosphatase alcaline, LDH, AST, ALT, GGT, protéines, albumine, cholestérol, triglycérides + électrolytes.",

  // COAGULATION
  "CBCCOAG":  "Hémogramme, INR, PTT.",
  "COAG":     "Hémogramme, INR, PTT, fibrinogène.",

  // CULTURE / INFECTIONS
  "STDMU":    "Culture génital, Chlamydia et Neisseria Gonorrhoeae par TAAN.",

  // HÉPATITES
  "HEPAB":    "Anticorps anti-HBs, anticorps anti-HBc, antigène HBs, anticorps anti-hépatite A IgM.",
  "HEPABC":   "Anticorps anti-HBs, anticorps anti-HBc, antigène HBs, anticorps anti-hépatite A IgM, anticorps anti-hépatite C.",
  "HEPB":     "Anticorps anti-HBs, anticorps anti-HBc, antigène HBs.",

  // MALADIE CŒLIAQUE
  "CELISCRE": "IgA totales, anticorps anti-transglutaminase IgA, anticorps anti-gliadine IgG.",
  "CELIAC":   "IgA totales, anticorps anti-transglutaminase IgA, anticorps anti-gliadine IgG et IgA.",

  // DIABÈTE
  "DIAB":     "Glucose AC, urée, créatinine, électrolytes, HbA1c, analyse d'urine, microalbuminurie.",
  "DIAB6":    "Glucose AC, HbA1c.",

  // FERTILITÉ
  "FERT1":    "FSH, LH.",
  "FERT2":    "FSH, LH, prolactine.",

  // GÉNÉRAL
  "GP1":      "Hémogramme, glucose AC, calcium, phosphore, acide urique, urée, créatinine, bilirubine totale, phosphatase alcaline, LDH, AST, ALT, GGT, protéines, albumine, cholestérol, triglycérides, analyse d'urine.",
  "GP2":      "Hémogramme, glucose AC, calcium, phosphore, acide urique, urée, créatinine, DFG, bilirubine totale, phosphatase alcaline, LDH, AST, ALT, GGT, protéines, albumine, cholestérol, triglycérides, électrolytes, analyse d'urine.",
  "GP3":      "Hémogramme, glucose AC, calcium, phosphore, acide urique, urée, créatinine, bilirubine totale, phosphatase alcaline, LDH, AST, ALT, GGT, protéines, albumine, cholestérol, triglycérides, analyse d'urine, HDL, LDL.",
  "GP4":      "Hémogramme, glucose AC, calcium, phosphore, acide urique, urée, créatinine, DFG, bilirubine totale, phosphatase alcaline, LDH, AST, ALT, GGT, protéines, albumine, cholestérol, triglycérides, HDL, LDL, électrolytes, analyse d'urine.",

  // INFECTIONS SEXUELLEMENT TRANSMISSIBLES
  "ITSS":     "Antigène HBs, VIH, syphilis, Chlamydia et Neisseria Gonorrhoeae par TAAN.",

  // HÉPATIQUE
  "LFT":      "ALT, AST, bilirubine totale, GGT, LDH, phosphatase alcaline.",

  // LIPIDIQUE
  "LIPID":    "Cholestérol total, triglycérides, HDL, LDL.",
  "LIPID18":  "Cholestérol total, triglycérides, HDL, LDL, apolipoprotéine B, CRP-hs.",
  "LIPID6":   "Cholestérol total, triglycérides, HDL, LDL, apolipoprotéine B.",

  // MARQUEURS PROSTATIQUES
  "FPSA":     "APS libre, APS totale.",

  // MONOTEST
  "MONOP":    "Formule sanguine complète, monotest.",

  // OSTÉOPOROSE
  "OSTEOP":   "PTH, électrophorèse des protéines, calcium ionisé, albumine, phosphatase alcaline, calcium, créatinine, phosphore, protéines, calcium-urine random, créatinine-urine random, phosphore-urine random, ratio cal/créat urine random.",

  // PRÉNATAL
  "PREN1":    "FSC + anticorps maternel, groupe sanguin.",
  "PREN2":    "FSC + anticorps maternel, groupe sanguin, rubella IgG.",
  "PREN3":    "FSC + anticorps maternel, groupe sanguin, rubella IgG, toxoplasmose IgG, glucose AC, glucose PC.",

  // BIOCHIMIE (SMA)
  "SMA16":    "Glucose AC, albumine, phosphatase alcaline, AST, bilirubine totale, calcium, cholestérol, créatinine, électrolytes, CO2 totale.",
  "SMA5":     "Glucose AC, créatinine, électrolytes.",
  "SMA6":     "Glucose AC, urée, créatinine, électrolytes.",
  "SMA7":     "Glucose AC, urée, créatinine, électrolytes, CO2 totale.",

  // THYROÏDE
  "TH2":      "TSH, T4 libre.",
  "TH6":      "TSH, T4 libre, anticorps anti-microsomes thyroïdiens.",

  // UROLITHIASE
  "STONE":    "Calcium, phosphore, électrolytes, acide urique, calcium-urines 24h, phosphore-urines 24h, créatinine-urines 24h, acide urique-urines 24h, oxalates-urines 24h, analyse d'urine.",
};

/**
 * Look up the description for a profile by code.
 * Searches CDL first, then QC.
 */
export function getProfileDescription(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return CDL_PROFILE_DESCRIPTIONS[upper] ?? QC_PROFILE_DESCRIPTIONS[upper] ?? null;
}

/**
 * Explicit mapping of profile code → array of component TestMapping codes.
 * Used to resolve which individual tests each profile contains.
 * Codes must match the `code` field in the Test table (from active price lists).
 */
export const CDL_PROFILE_COMPONENTS: Record<string, string[]> = {
  // ANALYSE D'URINE
  "URC+":   ["URI", "URC+"],

  // ANÉMIE
  "FA12":   ["VB12", "FOL"],
  "IRN2":   ["CBC", "FERR"],
  "IRON":   ["IRON"],
  "IRN6":   ["IRON", "FERR"],
  "IRN1":   ["IRON", "CBC", "FERR"],
  "ANE1":   ["IRON", "CBC", "RTIC"],
  "ANE4":   ["IRON", "CBC", "RTIC", "FERR"],
  "ANE3":   ["IRON", "CBC", "FOL", "RTIC", "VB12", "FERR"],
  "IRN3":   ["IRON", "CBC", "FOL", "VB12", "FERR"],

  // BIOCHIMIE
  "B2GP":   ["B2GP"],
  "DIAB":   ["ACGL", "HBA1C"],
  "LIV1":   ["ALKP", "ALT", "AST", "GGT", "BILIT"],
  "PANC":   ["AMYL", "LASE"],
  "REN2":   ["ELEC", "UREA", "CREA"],
  "BIO1":   ["ACGL", "UREA", "CREA", "ALT", "URIC", "ELEC"],
  "CHM1":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP"],
  "CHM2":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4"],
  "CHM5":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC"],
  "CHL3":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG"],
  "CHP3":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "CBC", "URI"],
  "BIO3":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "LD"],
  "CHM4":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "CHOL", "TRIG", "HDL", "LDLD", "NHDL"],
  "CHL4":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "HDL", "LDLD", "NHDL"],
  "BIO4":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "HDL", "LDLD", "NHDL", "LD"],
  "CH4U":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "HDL", "LDLD", "NHDL", "CBC"],
  "CHP4":   ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "HDL", "LDLD", "NHDL", "CBC", "URI"],
  "CHP4T":  ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "HDL", "LDLD", "NHDL", "CBC", "URI", "TSH"],
  "CHP4A":  ["ACGL", "UREA", "CREA", "ALT", "AST", "GGT", "ALB", "BILIT", "CA", "ALKP", "TP", "URIC", "PO4", "ELEC", "CHOL", "TRIG", "HDL", "LDLD", "NHDL", "CBC", "URI", "TSH", "PSA"],

  // COAGULATION
  "COAG":   ["CBC", "FIB", "PT", "PTT"],
  "PTPT":   ["PT", "PTT"],

  // DÉPISTAGE PRÉNATAUX
  "PREN":   ["CBC", "BLDT", "HBS", "SYPEIA", "RUB", "ABSN"],
  "PRENG":  ["CBC", "BLDT", "HBS", "SYPEIA", "RUB", "ABSN", "ACGL"],
  "DAL2":   ["CBC", "BLDT", "HBS", "SYPEIA", "RUB", "ABSN", "HIV", "URI", "URC+"],
  "DAL2G":  ["CBC", "BLDT", "HBS", "SYPEIA", "RUB", "ABSN", "HIV", "URI", "URC+", "ACGL"],

  // ENDOCRINOLOGIE
  "FERT":   ["FSH", "LH"],
  "MEN1":   ["FSH", "LH", "ESTR"],
  "MEN3":   ["FSH", "LH", "ESTR", "PROG"],
  "MEN2":   ["FSH", "LH", "ESTR", "DH-S", "PROG"],
  "MEN4":   ["FSH", "LH", "ESTR", "DH-S", "TEST", "PROL", "ANDR"],

  // THYROÏDE
  "THY1R":  ["TSH"],
  "THY2R":  ["TSH"],
  "THY3R":  ["TSH"],
  "THY1":   ["TSH", "T4F"],
  "THY3":   ["TSH", "T4F", "T3F"],
  "THY4":   ["TSH", "T4F", "T3F", "THAB", "TPO"],

  // GÉNÉRAL
  "CH3U":   ["ALB", "ALKP", "ALT", "AST", "GGT", "CA", "CREA", "ACGL", "BILIT", "TP", "UREA", "ELEC", "CBC", "URIC", "PO4", "CHOL", "TRIG"],
  "CHP1":   ["ALB", "ALKP", "ALT", "AST", "GGT", "CA", "CREA", "ACGL", "BILIT", "TP", "UREA", "ELEC", "CBC", "URI"],
  "FIN1":   ["ALB", "ALKP", "ALT", "AST", "GGT", "CA", "CREA", "ACGL", "BILIT", "TP", "UREA", "ELEC", "CBC", "URI", "CRP"],
  "CHP2":   ["ALB", "ALKP", "ALT", "AST", "GGT", "CA", "CREA", "ACGL", "BILIT", "TP", "UREA", "ELEC", "CBC", "URI", "URIC", "PO4"],
  "CH4SC":  ["ALB", "ALKP", "ALT", "AST", "GGT", "CA", "CREA", "ACGL", "BILIT", "TP", "UREA", "ELEC", "CBC", "URI", "URIC", "PO4", "CHOL", "TRIG", "HDL", "LDLD", "CRPHS"],
  "GN5":    ["ALB", "ALKP", "ALT", "AST", "GGT", "CA", "CREA", "ACGL", "BILIT", "TP", "UREA", "ELEC", "CBC", "URI", "URIC", "PO4", "CHOL", "TRIG", "HDL", "LDLD", "LD"],
  "PNL6":   ["ALB", "ALKP", "ALT", "AST", "GGT", "CA", "CREA", "ACGL", "BILIT", "TP", "UREA", "ELEC", "CBC", "URI", "URIC", "PO4", "CHOL", "TRIG", "HDL", "LDLD", "LD"],

  // HÉMATOLOGIE
  "CBCS":   ["CBC", "SED"],
  "MON+":   ["CBC", "MONO"],

  // IMMUNOLOGIE
  "CELP":   ["ALB", "SPEP", "GLIA", "IGA", "TRANSGLUT"],

  // RISQUE CARDIOVASCULAIRE
  "CVRK":   ["CHOL", "TRIG", "HDL", "LDLD", "NHDL"],
  "CVK2":   ["CHOL", "TRIG", "HDL", "LDLD", "NHDL", "APOB"],
  "CCL4":   ["CHOL", "TRIG", "HDL", "LDLD", "NHDL", "ALT", "CK"],

  // SÉROLOGIE
  "CGPCR1": ["CMPCR", "GONOU"],
  "CGPCR2": ["CMPCR", "GONOU"],
  "CGPCR3": ["CMPCR", "GONOU"],
  "HPBA":   ["HBS", "HBAB", "HBCS"],
  "STD2":   ["CMPCR", "GONOU"],
  "STDMH":  ["CMPCR", "GONOU", "SYPEIA", "HIV"],

  // CYTOLOGIE / PAP (atomic tests — self-referential single mapping)
  "PAPTHPV": ["PAPTHPV"],
  "PVTP":    ["PVTP"],
  "TPPV":    ["TPPV"],

  // DÉPISTAGE PRÉNATAL NON-INVASIF (atomic — self-referential)
  "PANO":   ["PANO"],
  "PANOE":  ["PANOE"],
  "HARMP":  ["HARMP"],

  // DROGUES D'ABUS (atomic panels — self-referential)
  "DRUGH":  ["DRUGH"],
  "DAU450": ["DAU450"],
  "DAUP":   ["DAUP"],
  "DAUB50": ["DAUB50"],

  // ÉCHOGRAPHIES (atomic procedures — self-referential)
  "ENDPE":  ["ENDPE"],
  "ENDV":   ["ENDV"],
  "1TRI":   ["1TRI"],
  "2TRI":   ["2TRI"],
  "3TRI":   ["3TRI"],
  "VIAB":   ["VIAB"],
};

export const QC_PROFILE_COMPONENTS: Record<string, string[]> = {
  // CHLAMYDIA/GONORRHÉE
  "TGCD":     ["CMPCR", "GONOU"],
  "NGPCRD":   ["CMPCR", "GONOU"],

  // ANÉMIE
  "ANEM1":    ["CBC", "SED", "IRON", "VB12", "FOL"],
  "ANEM11":   ["SED", "CBC", "FERR"],
  "ANEM8":    ["SED", "CBC", "FERR", "IRON"],

  // BIOCHIMIE
  "SMA12":    ["ACGL", "ALB", "ALKP", "AST", "BILIT", "CA", "CHOL", "CREA", "LD", "TP", "UREA", "URIC"],
  "SMA12LYT": ["ACGL", "ALB", "ALKP", "AST", "BILIT", "CA", "CHOL", "CREA", "LD", "TP", "UREA", "URIC", "ELEC"],
  "SMAC":     ["ACGL", "CA", "PO4", "URIC", "UREA", "CREA", "BILIT", "ALKP", "LD", "AST", "ALT", "GGT", "TP", "ALB", "CHOL", "TRIG"],
  "SMACLYT":  ["ACGL", "CA", "PO4", "URIC", "UREA", "CREA", "BILIT", "ALKP", "LD", "AST", "ALT", "GGT", "TP", "ALB", "CHOL", "TRIG", "ELEC"],

  // COAGULATION
  "CBCCOAG":  ["CBC", "PT", "PTT"],
  "COAG":     ["CBC", "PT", "PTT", "FIB"],

  // CULTURE/INFECTIONS
  "STDMU":    ["CMPCR", "GONOU"],

  // HÉPATITES
  "HEPAB":    ["HBAB", "HBCS", "HBS"],
  "HEPABC":   ["HBAB", "HBCS", "HBS"],
  "HEPB":     ["HBAB", "HBCS", "HBS"],

  // MALADIE CŒLIAQUE
  "CELISCRE": ["IGA", "TRANSGLUT", "DEGLIAG"],
  "CELIAC":   ["IGA", "TRANSGLUT", "DEGLIAG", "GLIA"],

  // DIABÈTE
  "DIAB":     ["ACGL", "UREA", "CREA", "ELEC", "HBA1C", "URI", "A/CU"],
  "DIAB6":    ["ACGL", "HBA1C"],

  // FERTILITÉ
  "FERT1":    ["FSH", "LH"],
  "FERT2":    ["FSH", "LH", "PROL"],

  // GÉNÉRAL
  "GP1":      ["CBC", "ACGL", "CA", "PO4", "URIC", "UREA", "CREA", "BILIT", "ALKP", "LD", "AST", "ALT", "GGT", "TP", "ALB", "CHOL", "TRIG", "URI"],
  "GP2":      ["CBC", "ACGL", "CA", "PO4", "URIC", "UREA", "CREA", "BILIT", "ALKP", "LD", "AST", "ALT", "GGT", "TP", "ALB", "CHOL", "TRIG", "ELEC", "URI"],
  "GP3":      ["CBC", "ACGL", "CA", "PO4", "URIC", "UREA", "CREA", "BILIT", "ALKP", "LD", "AST", "ALT", "GGT", "TP", "ALB", "CHOL", "TRIG", "URI", "HDL", "LDLD"],
  "GP4":      ["CBC", "ACGL", "CA", "PO4", "URIC", "UREA", "CREA", "BILIT", "ALKP", "LD", "AST", "ALT", "GGT", "TP", "ALB", "CHOL", "TRIG", "ELEC", "URI", "HDL", "LDLD"],

  // INFECTIONS SEXUELLEMENT TRANSMISSIBLES
  "ITSS":     ["HBS", "HIV", "SYPEIA", "CMPCR", "GONOU"],

  // HÉPATIQUE
  "LFT":      ["ALT", "AST", "BILIT", "GGT", "LD", "ALKP"],

  // LIPIDIQUE
  "LIPID":    ["CHOL", "TRIG", "HDL", "LDLD"],
  "LIPID18":  ["CHOL", "TRIG", "HDL", "LDLD", "APOB", "CRPHS"],
  "LIPID6":   ["CHOL", "TRIG", "HDL", "LDLD", "APOB"],

  // MARQUEURS PROSTATIQUES
  "FPSA":      ["FPSA", "PSA"],
  "FPSA_PROF": ["FPSA", "PSA"],

  // MONOTEST
  "MONOP":    ["CBC", "MONO"],

  // OSTÉOPOROSE
  "OSTEOP":   ["ALKP", "CA", "CREA", "PO4", "ALB", "TP", "SPEP"],

  // PRÉNATAL
  "PREN1":    ["CBC", "BLDT", "ABSN"],
  "PREN2":    ["CBC", "BLDT", "ABSN", "RUB"],
  "PREN3":    ["CBC", "BLDT", "ABSN", "RUB", "ACGL"],

  // SMA
  "SMA16":    ["ACGL", "ALB", "ALKP", "AST", "BILIT", "CA", "CHOL", "CREA", "ELEC"],
  "SMA5":     ["ACGL", "CREA", "ELEC"],
  "SMA6":     ["ACGL", "UREA", "CREA", "ELEC"],
  "SMA7":     ["ACGL", "UREA", "CREA", "ELEC"],

  // THYROÏDE
  "TH2":      ["TSH", "T4F"],
  "TH6":      ["TSH", "T4F", "TPO"],

  // UROLITHIASE
  "STONE":    ["CA", "PO4", "ELEC", "URIC", "URI"],
};

/**
 * Look up the component TestMapping codes for a profile.
 * Returns the list of individual test codes that make up this profile.
 */
export function getProfileComponents(code: string | null | undefined): string[] {
  if (!code) return [];
  const upper = code.toUpperCase();
  return CDL_PROFILE_COMPONENTS[upper] ?? QC_PROFILE_COMPONENTS[upper] ?? [];
}
