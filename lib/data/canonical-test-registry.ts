/**
 * Canonical Test Registry — Auto-generated from database.
 * 576 canonical test definitions.
 * Generated: 2026-02-27T10:56:47.527Z
 *
 * DO NOT EDIT MANUALLY — regenerate with: node regenerate_registry.js
 */

export interface CanonicalTestDefinition {
  canonicalName: string;
  code: string;
  category: "Profil" | "Individuel";
  aliases: string[];
}

/**
 * Build fast-lookup indexes from the registry.
 */
export function buildCanonicalIndexes(registry: CanonicalTestDefinition[]) {
  const byCode = new Map<string, CanonicalTestDefinition>();
  const byAlias = new Map<string, CanonicalTestDefinition>();
  for (const def of registry) {
    if (def.code) byCode.set(def.code, def);
    byAlias.set(normalizeForLookup(def.canonicalName), def);
    for (const alias of def.aliases) {
      byAlias.set(normalizeForLookup(alias), def);
    }
  }
  return { byCode, byAlias };
}

/**
 * Normalize a string for lookup: uppercase, strip accents, collapse whitespace.
 */
export function normalizeForLookup(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const CANONICAL_TEST_REGISTRY: CanonicalTestDefinition[] = [
  {
    canonicalName: "% CDT",
    code: "CDT",
    category: "Individuel",
    aliases: [
      "TRANSFERRINE CARBOXY DÉFICIENTE",
      "% CDT",
    ],
  },
  {
    canonicalName: "1 25 Dihydroxy Vitamine D",
    code: "VITD125",
    category: "Individuel",
    aliases: [
      "1.25-DIHYDROXY- VITAMINE D",
      "1.25-DIHYDROXY-VITAMINE D",
      "VITAMINE D 1,25 OH",
    ],
  },
  {
    canonicalName: "17 Hydroxy Progesterone",
    code: "17HYPROG",
    category: "Individuel",
    aliases: [
      "17- HYDROXY- PROGESTERONE (17-OH-PROGESTERONE)",
      "17-HYDROXY-PROGESTERONE",
      "PROGESTÉRONE 17-OH",
    ],
  },
  {
    canonicalName: "25 Hydroxy Vitamine D",
    code: "VITD",
    category: "Individuel",
    aliases: [
      "25-HYDROXY VITAMINE D (CHOLECALCIFEROL)",
      "25-HYDROXY VITAMINE D",
      "VITAMINE D 25 OH",
    ],
  },
  {
    canonicalName: "5 Hiaa (Urine 24h)",
    code: "24U5HIAA",
    category: "Individuel",
    aliases: [
      "5-HIAA (MÉTABOLITE DE LA SEROTONINE) URINES DE 24 HEURES",
      "5-HIAA",
    ],
  },
  {
    canonicalName: "ALT",
    code: "ALT",
    category: "Individuel",
    aliases: [
      "ALT",
    ],
  },
  {
    canonicalName: "APS Libre",
    code: "FPSA",
    category: "Individuel",
    aliases: [
      "PROSTATE, ANTIGÈNE PROSTATIQUE SPÉCIFIQUE LIBRE",
      "APS LIBRE",
    ],
  },
  {
    canonicalName: "AST",
    code: "AST",
    category: "Individuel",
    aliases: [
      "AST (GOT, SGOT)",
      "AST",
    ],
  },
  {
    canonicalName: "Acetaminophene",
    code: "APH",
    category: "Individuel",
    aliases: [
      "ACETAMINOPHÈNE",
      "ACÉTAMINOPHÈNE",
    ],
  },
  {
    canonicalName: "Acetone",
    code: "ACETONE",
    category: "Individuel",
    aliases: [
      "ACÉTONE (ANALYSE QUANTITATIVE)",
      "ACÉTONE",
    ],
  },
  {
    canonicalName: "Acetylcholine Anticorps Bloquants",
    code: "ACBA",
    category: "Individuel",
    aliases: [
      "ACETYLCHOLINE, ANTICORPS BLOQUANTS",
    ],
  },
  {
    canonicalName: "Acetylcholine Anticorps Liant",
    code: "ACRA",
    category: "Individuel",
    aliases: [
      "ACETYLCHOLINE, ANTICORPS LIANT",
    ],
  },
  {
    canonicalName: "Acetylcholine Modulateurs Anticorps",
    code: "ACMA",
    category: "Individuel",
    aliases: [
      "ACETYLCHOLINE, MODULATEURS D'ANTICORPS",
    ],
  },
  {
    canonicalName: "Acide Ascorbique Vitamine C",
    code: "VITC",
    category: "Individuel",
    aliases: [
      "ACIDE ASCORBIQUE (VITAMINE C)",
    ],
  },
  {
    canonicalName: "Acide Folique Folate",
    code: "FOL",
    category: "Individuel",
    aliases: [
      "ACIDE FOLIQUE (FOLATE)",
      "ACIDE FOLIQUE",
    ],
  },
  {
    canonicalName: "Acide Folique Vitamine B12",
    code: "B12FOL",
    category: "Individuel",
    aliases: [
      "ACIDE FOLIQUE ET VITAMINE B12",
      "VITAMINE B12 ET ACIDE FOLIQUE",
    ],
  },
  {
    canonicalName: "Acide Lactique",
    code: "LAC",
    category: "Individuel",
    aliases: [
      "ACIDE LACTIQUE",
    ],
  },
  {
    canonicalName: "Acide Methylmalonique Sang",
    code: "METMALA",
    category: "Individuel",
    aliases: [
      "ACIDE MÉTHYLMALONIQUE - SANG",
    ],
  },
  {
    canonicalName: "Acide Methylmalonique Serum (Sérum)",
    code: "MMAS",
    category: "Individuel",
    aliases: [
      "ACIDE MÉTHYLMALONIQUE, SÉRUM",
    ],
  },
  {
    canonicalName: "Acide Methylmalonique Urine (Urine)",
    code: "METMALAU",
    category: "Individuel",
    aliases: [
      "ACIDE MÉTHYLMALONIQUE (ANALYSE QUANTITATIVE) - URINE",
      "ACIDE MÉTHYLMALONIQUE - URINE",
    ],
  },
  {
    canonicalName: "Acide Urique",
    code: "URIC",
    category: "Individuel",
    aliases: [
      "ACIDE URIQUE",
    ],
  },
  {
    canonicalName: "Acide Urique Urine Hasard (Urine Hasard)",
    code: "URICURAN",
    category: "Individuel",
    aliases: [
      "ACIDE URIQUE URINE AU HASARD",
      "ACIDE URIQUE - URINE AU HASARD",
    ],
  },
  {
    canonicalName: "Acide Urique Urines 24 Heures (Urine 24h)",
    code: "24UURIC",
    category: "Individuel",
    aliases: [
      "ACIDE URIQUE - URINES DE 24 HEURES",
      "ACIDE URIQUE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Acide Valproique Depakene",
    code: "VAL",
    category: "Individuel",
    aliases: [
      "ACIDE VALPROÏQUE (DEPAKENE)",
      "ACIDE VALPROÏQUE",
    ],
  },
  {
    canonicalName: "Acide Vanylmandelique VMA (Urine 24h)",
    code: "VMA",
    category: "Individuel",
    aliases: [
      "ACIDE VANYLMANDÉLIQUE (VMA) URINES DE 24 HEURES",
      "ACIDE VANYLMANDÉLIQUE (VMA)",
    ],
  },
  {
    canonicalName: "Acides Gras Libres",
    code: "FFA",
    category: "Individuel",
    aliases: [
      "ACIDES GRAS LIBRES",
    ],
  },
  {
    canonicalName: "Activite Proteine C",
    code: "PROCACT",
    category: "Individuel",
    aliases: [
      "ACTIVITÉ DE LA PROTÉINE C",
    ],
  },
  {
    canonicalName: "Adalimumab",
    code: "ADUL",
    category: "Individuel",
    aliases: [
      "ADALIMUMAB",
    ],
  },
  {
    canonicalName: "Agglutinines Froides",
    code: "AGG",
    category: "Individuel",
    aliases: [
      "AGGLUTININES FROIDES",
    ],
  },
  {
    canonicalName: "Albumine",
    code: "ALB",
    category: "Individuel",
    aliases: [
      "ALBUMINE",
    ],
  },
  {
    canonicalName: "Albumine Globulines Ratio",
    code: "AGR",
    category: "Individuel",
    aliases: [
      "ALBUMINE / GLOBULINES RATIO",
    ],
  },
  {
    canonicalName: "Alcool Ethanol Sang",
    code: "ALCO",
    category: "Individuel",
    aliases: [
      "ALCOOL (ETHANOL) - SANG",
    ],
  },
  {
    canonicalName: "Alcool Ethanol Urine (Urine)",
    code: "ETOH",
    category: "Individuel",
    aliases: [
      "ALCOOL (ETHANOL) URINE",
      "ALCOOL (ETHANOL) - URINE",
      "ÉTHANOL, URINE",
    ],
  },
  {
    canonicalName: "Aldolase",
    code: "ADLASE",
    category: "Individuel",
    aliases: [
      "ALDOLASE",
    ],
  },
  {
    canonicalName: "Aldosterone (ALDO)",
    code: "ALDO",
    category: "Individuel",
    aliases: [
      "ALDOSTÉRONE",
    ],
  },
  {
    canonicalName: "Aldosterone (DOST)",
    code: "DOST",
    category: "Individuel",
    aliases: [
      "ALDOSTÉRONE",
    ],
  },
  {
    canonicalName: "Aldosterone Urines 24 Heures (Urine 24h)",
    code: "DOSTU",
    category: "Individuel",
    aliases: [
      "ALDOSTÉRONE - URINES DE 24 HEURES",
    ],
  },
  {
    canonicalName: "Alpha 1 Antitrypsine",
    code: "A1AT",
    category: "Individuel",
    aliases: [
      "ALPHA 1 ANTITRYPSINE",
      "ALPHA 1-ANTITRYPSINE",
      "ALPHA 1- ANTITRYPSINE",
    ],
  },
  {
    canonicalName: "Alpha 2 Macroglobuline",
    code: "ALPHA2",
    category: "Individuel",
    aliases: [
      "ALPHA 2 MACROGLOBULINE",
    ],
  },
  {
    canonicalName: "Alphafetoproteine",
    code: "AFP",
    category: "Individuel",
    aliases: [
      "ALPHAFÉTOPROTÉINE",
      "ALPHA-FŒTOPROTÉINE (AFP)",
    ],
  },
  {
    canonicalName: "Aluminium Sang Entier (Sang Entier)",
    code: "AL",
    category: "Individuel",
    aliases: [
      "ALUMINIUM, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Amikacine",
    code: "AMIK",
    category: "Individuel",
    aliases: [
      "AMIKACINE",
    ],
  },
  {
    canonicalName: "Amitriptyline",
    code: "AMITRIP",
    category: "Individuel",
    aliases: [
      "AMITRIPTYLINE (ANTIDEPRESSEUR TRICYCLIQUE)",
      "AMITRIPTYLINE",
    ],
  },
  {
    canonicalName: "Ammoniaque",
    code: "AMMO",
    category: "Individuel",
    aliases: [
      "AMMONIAQUE",
    ],
  },
  {
    canonicalName: "Amphetamine",
    code: "AMPH",
    category: "Individuel",
    aliases: [
      "AMPHETAMINE",
      "DROGUE: AMPHETAMINES",
    ],
  },
  {
    canonicalName: "Amylase",
    code: "AMYL",
    category: "Individuel",
    aliases: [
      "AMYLASE",
    ],
  },
  {
    canonicalName: "Analyse Calculs Renaux",
    code: "KIDNEY",
    category: "Individuel",
    aliases: [
      "ANALYSE DES CALCULS RENAUX",
    ],
  },
  {
    canonicalName: "Analyse Culture Urine (Urine)",
    code: "URC+",
    category: "Profil",
    aliases: [
      "ANALYSE ET CULTURE D'URINE",
      "CULTURE D'URINE + ANALYSE",
    ],
  },
  {
    canonicalName: "Analyse Urine (Urine)",
    code: "URI",
    category: "Individuel",
    aliases: [
      "ANALYSE D'URINE",
      "URINE, ANALYSE",
    ],
  },
  {
    canonicalName: "Androstene Dione",
    code: "ANDRO",
    category: "Individuel",
    aliases: [
      "ANDROSTENE-DIONE",
    ],
  },
  {
    canonicalName: "Androstenedione",
    code: "ANDR",
    category: "Individuel",
    aliases: [
      "ANDROSTÉNÉDIONE",
    ],
  },
  {
    canonicalName: "Anemie 1",
    code: "ANE1",
    category: "Profil",
    aliases: [
      "ANÉMIE #1",
      "PROFIL ANÉMIE NO 1",
    ],
  },
  {
    canonicalName: "Anemie 11",
    code: "ANEM11",
    category: "Profil",
    aliases: [
      "PROFIL ANÉMIE NO 11",
    ],
  },
  {
    canonicalName: "Anemie 3",
    code: "ANE3",
    category: "Profil",
    aliases: [
      "ANÉMIE #3",
    ],
  },
  {
    canonicalName: "Anemie 4",
    code: "ANE4",
    category: "Profil",
    aliases: [
      "ANÉMIE #4",
    ],
  },
  {
    canonicalName: "Anemie 8",
    code: "ANEM8",
    category: "Profil",
    aliases: [
      "PROFIL ANÉMIE NO 8",
    ],
  },
  {
    canonicalName: "Anti Adndb",
    code: "DNA",
    category: "Individuel",
    aliases: [
      "ANTI-ADNDB",
      "ANTICORPS ANTI-ADN (DOUBLE BRIN)",
    ],
  },
  {
    canonicalName: "Anti Cellules Parietales Anticorps",
    code: "APA",
    category: "Individuel",
    aliases: [
      "ANTI-CELLULES PARIÉTALES, ANTICORPS",
      "ANTICORPS ANTI-CELLULES PARIÉTALES",
    ],
  },
  {
    canonicalName: "Anti Cenp",
    code: "CENP",
    category: "Individuel",
    aliases: [
      "ANTI-CENP",
    ],
  },
  {
    canonicalName: "Anti Dnase B",
    code: "BDNA",
    category: "Individuel",
    aliases: [
      "ANTI-DNASE B",
    ],
  },
  {
    canonicalName: "Anti Endomysiaux Anticorps IGA",
    code: "AEML",
    category: "Individuel",
    aliases: [
      "ANTI-ENDOMYSIAUX, ANTICORPS (IGA)",
    ],
  },
  {
    canonicalName: "Anti GAD Auto Anticorps",
    code: "GAD",
    category: "Individuel",
    aliases: [
      "ANTI-GAD AUTO-ANTICORPS",
    ],
  },
  {
    canonicalName: "Anti Gliadine IGA",
    code: "GLIA",
    category: "Individuel",
    aliases: [
      "ANTI-GLIADINE IGA",
      "ANTICORPS ANTI-GLIADINE DE TYPE IGA",
    ],
  },
  {
    canonicalName: "Anti HBS",
    code: "ANHBS",
    category: "Individuel",
    aliases: [
      "ANTI-HBS",
    ],
  },
  {
    canonicalName: "Anti LKM Anticorps",
    code: "ALKM",
    category: "Individuel",
    aliases: [
      "ANTI-LKM, ANTICORPS",
    ],
  },
  {
    canonicalName: "Anti Mitochondries Anticorps",
    code: "AMA",
    category: "Individuel",
    aliases: [
      "ANTI-MITOCHONDRIES, ANTICORPS",
      "ANTICORPS ANTI-MITOCHONDRIES",
    ],
  },
  {
    canonicalName: "Anti Muscle Lisse Anticorps",
    code: "ASA",
    category: "Individuel",
    aliases: [
      "ANTI-MUSCLE LISSE, ANTICORPS",
      "ANTICORPS ANTI-MUSCLE LISSE",
    ],
  },
  {
    canonicalName: "Anti Nucleaire Anticorps",
    code: "ANA",
    category: "Individuel",
    aliases: [
      "ANTI-NUCLÉAIRE, ANTICORPS",
      "ANTICORPS ANTINUCLÉAIRES (ANA)",
    ],
  },
  {
    canonicalName: "Anti TPO",
    code: "TPO",
    category: "Individuel",
    aliases: [
      "ANTI TPO",
    ],
  },
  {
    canonicalName: "Anti Transglutaminase IGG",
    code: "GTTG",
    category: "Individuel",
    aliases: [
      "ANTI-TRANSGLUTAMINASE IGG",
    ],
  },
  {
    canonicalName: "Anticoagulant Lupique",
    code: "LUPUS",
    category: "Individuel",
    aliases: [
      "ANTICOAGULANT LUPIQUE",
    ],
  },
  {
    canonicalName: "Anticorps Anti CCP",
    code: "ACCP",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI CYCLIQUE CITRULLINĖ (ANTICORPS ANTI-CCP)",
      "ANTICORPS ANTI-CCP",
    ],
  },
  {
    canonicalName: "Anticorps Anti Cardiolipines",
    code: "ANTICAR",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-CARDIOLIPINES",
    ],
  },
  {
    canonicalName: "Anticorps Anti Cytomegalovirus IGG",
    code: "CMVG",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-CYTOMEGALOVIRUS DE TYPE IGG",
      "ANTICORPS ANTI-CYTOMEGALOVIRUS IGG",
      "CYTOMÉGALOVIRUS IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti Cytoplasme Neutrophiles",
    code: "ANCA",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-CYTOPLASME DES NEUTROPHILES (ANCA)",
      "ANTICORPS ANTI-CYTOPLASME DES NEUTROPHILES",
      "ANTI-CYTOPLASME DES NEUTROPHILES, ANTICORPS",
    ],
  },
  {
    canonicalName: "Anticorps Anti Diphterie",
    code: "DIPH",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-DIPHTÉRIE",
    ],
  },
  {
    canonicalName: "Anticorps Anti EBV IGG",
    code: "EBVIGG",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-EBV IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti EBV IGM",
    code: "EBVIGM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-EBV IGM",
    ],
  },
  {
    canonicalName: "Anticorps Anti ENA",
    code: "ENA",
    category: "Individuel",
    aliases: [
      "ANTI-NUCLÉAIRES EXTRACTABLES (DÉPISTAGE)",
      "ANTICORPS ANTI-ENA",
    ],
  },
  {
    canonicalName: "Anticorps Anti Facteur Intrinseque",
    code: "IFA",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-FACTEUR INTRINSÈQUE",
      "FACTEUR INTRINSÈQUE ANTICORPS",
    ],
  },
  {
    canonicalName: "Anticorps Anti Gliadine IGG",
    code: "DEGLIAG",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-GLIADINE DE TYPE IGG",
      "ANTI-GLIADINE IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti HBC",
    code: "HEPBC",
    category: "Individuel",
    aliases: [
      "ANTICORPS DIRIGÉS CONTRE L'ANTIGÈNE CAPSIDIQUE DE L'HÉPATITE B (ANTI-HBC)",
      "ANTICORPS ANTI-HBC",
    ],
  },
  {
    canonicalName: "Anticorps Anti HBC IGM",
    code: "HEPBCM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-HBC IGM",
    ],
  },
  {
    canonicalName: "Anticorps Anti HBE",
    code: "HEPBE",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-HBE",
    ],
  },
  {
    canonicalName: "Anticorps Anti Hepatite A IGG",
    code: "HEPAG",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-HEPATITE A IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti Hepatite A IGM",
    code: "HEPAM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-HEPATITE A IGM",
    ],
  },
  {
    canonicalName: "Anticorps Anti Histone",
    code: "HISTAB",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-HISTONE",
    ],
  },
  {
    canonicalName: "Anticorps Anti Membrane Basale Glomerulaire",
    code: "GBM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-MEMBRANE BASALE GLOMERULAIRE (ANTI-GBM)",
      "ANTICORPS ANTI-MEMBRANE BASALE GLOMERULAIRE",
    ],
  },
  {
    canonicalName: "Anticorps Anti Microsomes Thyroidiens",
    code: "TAPRO",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-MICROSOMES THYROIDIENS",
    ],
  },
  {
    canonicalName: "Anticorps Anti Mitochondries M2",
    code: "MITOM2",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-MITOCHONDRIES DE TYPE M2",
      "ANTICORPS ANTI-MITOCHONDRIES M2",
    ],
  },
  {
    canonicalName: "Anticorps Anti Oreillons IGG",
    code: "MUMPIGG",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-OREILLONS IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti Oreillons IGM",
    code: "MUMPIGM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-OREILLONS IGM",
    ],
  },
  {
    canonicalName: "Anticorps Anti Parvovirus IGG IGM",
    code: "PARVO",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-PARVOVIRUS DE TYPES IGG ET IGM",
      "ANTICORPS ANTI-PARVOVIRUS IGG ET IGM",
    ],
  },
  {
    canonicalName: "Anticorps Anti Rabiques Rage",
    code: "RABI",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-RABIQUES (RAGE)",
    ],
  },
  {
    canonicalName: "Anticorps Anti Recepteur Acetylcholine",
    code: "ARA",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-RÉCEPTEUR DE L'ACETYLCHOLINE",
    ],
  },
  {
    canonicalName: "Anticorps Anti Recepteurs TSH Tbii",
    code: "ANTHY",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-RÉCEPTEURS TSH (TBII)",
    ],
  },
  {
    canonicalName: "Anticorps Anti Rougeole IGG",
    code: "ROUGG",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-ROUGEOLE IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti Rougeole IGM",
    code: "ROUGM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-ROUGEOLE IGM",
    ],
  },
  {
    canonicalName: "Anticorps Anti Rubeole IGG",
    code: "RUB",
    category: "Individuel",
    aliases: [
      "ANTICORPS DE TYPE IGG DIRIGÉS CONTRE LE VIRUS DE LA RUBÉOLE",
      "ANTICORPS ANTI-RUBÉOLE IGG",
      "RUBÉOLE IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti Rubeole IGM",
    code: "RUBIGM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-RUBÉOLE IGM",
    ],
  },
  {
    canonicalName: "Anticorps Anti Streptolysine O",
    code: "ASO",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-STREPTOLYSINE O",
    ],
  },
  {
    canonicalName: "Anticorps Anti Transglutaminase IGA",
    code: "TRANSGLUT",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-TRANSGLUTAMINASE DE TYPE IGA",
      "ANTICORPS ANTI-TRANSGLUTAMINASE IGA",
      "ANTI-TRANSGLUTAMINASE IGA",
    ],
  },
  {
    canonicalName: "Anticorps Anti Varicelle IGG",
    code: "VARIG",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-VARICELLE IGG",
    ],
  },
  {
    canonicalName: "Anticorps Anti Varicelle IGM",
    code: "VARIM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-VARICELLE IGM",
    ],
  },
  {
    canonicalName: "Anticorps Antitetaniques",
    code: "TETA",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTITÉTANIQUES",
    ],
  },
  {
    canonicalName: "Anticorps Surrenales",
    code: "ADNAB",
    category: "Individuel",
    aliases: [
      "ANTICORPS SURRÉNALES",
    ],
  },
  {
    canonicalName: "Antigene Hepatite BE Hbeag",
    code: "HBEAG",
    category: "Individuel",
    aliases: [
      "ANTIGÈNE HÉPATITE BE (HBEAG)",
    ],
  },
  {
    canonicalName: "Antigene Prostatique Specifique APS",
    code: "PSA",
    category: "Individuel",
    aliases: [
      "PROSTATE, ANTIGÈNE PROSTATIQUE SPÉCIFIQUE TOTAL",
      "ANTIGÈNE PROSTATIQUE SPÉCIFIQUE (APS)",
    ],
  },
  {
    canonicalName: "Antigene Surface Hepatite B Hbsag",
    code: "HBS",
    category: "Individuel",
    aliases: [
      "ANTIGÈNE DE SURFACE DE L'HÉPATITE B (HBSAG)",
      "ANTIGÈNE DE SURFACE HÉPATITE B (HBSAG)",
      "HÉPATITE B ANTIGÈNE DE SURFACE",
    ],
  },
  {
    canonicalName: "Antiphospholipine IGA",
    code: "PHOA",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGA",
    ],
  },
  {
    canonicalName: "Antiphospholipine IGG",
    code: "PHOG",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGG",
    ],
  },
  {
    canonicalName: "Antiphospholipine IGM",
    code: "PHOM",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGM",
    ],
  },
  {
    canonicalName: "Antiphospholipine IGM IGG IGA",
    code: "PHOP",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGM, IGG, IGA",
    ],
  },
  {
    canonicalName: "Antistreptolysine",
    code: "ASOT",
    category: "Individuel",
    aliases: [
      "ANTISTREPTOLYSINE",
    ],
  },
  {
    canonicalName: "Antithrombine III Activite",
    code: "ANTITH",
    category: "Individuel",
    aliases: [
      "ANTITHROMBINE III (ACTIVITÉ)",
    ],
  },
  {
    canonicalName: "Antithrombine III Antigene",
    code: "AT3A",
    category: "Individuel",
    aliases: [
      "ANTITHROMBINE III, ANTIGÈNE",
    ],
  },
  {
    canonicalName: "Antithrombine III Fonctionnelle",
    code: "AT3F",
    category: "Individuel",
    aliases: [
      "ANTITHROMBINE III, FONCTIONNELLE",
    ],
  },
  {
    canonicalName: "Apolipoproteine A1",
    code: "APOA",
    category: "Individuel",
    aliases: [
      "APOLIPOPROTÉINE A-1",
      "APOLIPOPROTÉINE A1",
    ],
  },
  {
    canonicalName: "Apolipoproteine B",
    code: "APOB",
    category: "Individuel",
    aliases: [
      "APOLIPOPROTÉINE B",
    ],
  },
  {
    canonicalName: "Apolipoproteine E",
    code: "APOE",
    category: "Individuel",
    aliases: [
      "APOLIPOPROTÉINE E",
    ],
  },
  {
    canonicalName: "Arsenic Sang Entier (Sang Entier) (ARSENIWB)",
    code: "ARSENIWB",
    category: "Individuel",
    aliases: [
      "ARSENIC SANG ENTIER",
    ],
  },
  {
    canonicalName: "Arsenic Urine (Urine)",
    code: "ARSENIRU",
    category: "Individuel",
    aliases: [
      "ARSENIC URINE",
    ],
  },
  {
    canonicalName: "BIO 12",
    code: "SMA12",
    category: "Individuel",
    aliases: [
      "PROFIL BIO-12",
    ],
  },
  {
    canonicalName: "BIO 12 Electrolytes",
    code: "SMA12LYT",
    category: "Profil",
    aliases: [
      "PROFIL BIO-12 AVEC ÉLECTROLYTES",
    ],
  },
  {
    canonicalName: "BIO C",
    code: "SMAC",
    category: "Profil",
    aliases: [
      "PROFIL BIO-C",
    ],
  },
  {
    canonicalName: "BIO C Electrolytes",
    code: "CHM5",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #2 AVEC ELECTROLYTES",
      "PROFIL BIO-C AVEC ÉLECTROLYTES",
    ],
  },
  {
    canonicalName: "Bacille Koch Culture",
    code: "CTTBP",
    category: "Individuel",
    aliases: [
      "BACILLE DE KOCH, CULTURE",
    ],
  },
  {
    canonicalName: "Barbiturique 200 NG ML",
    code: "UBAR",
    category: "Individuel",
    aliases: [
      "BARBITURIQUE (200 NG/ML)",
    ],
  },
  {
    canonicalName: "Benzodiazepine 200 NG ML",
    code: "BENZ",
    category: "Individuel",
    aliases: [
      "BENZODIAZÉPINE (200 NG/ML)",
    ],
  },
  {
    canonicalName: "Beryllium Sang Entier (Sang Entier)",
    code: "BERY",
    category: "Individuel",
    aliases: [
      "BÉRYLLIUM SANG ENTIER",
    ],
  },
  {
    canonicalName: "Beta 2 Glycoproteine I Anticorps",
    code: "B2GP",
    category: "Profil",
    aliases: [
      "BETA 2 GLYCOPROTÉINE I ANTICORPS",
      "ANTICORPS ANTI-BETA 2-GLYCOPROTÉINE I (IGG/IGM/IGA)",
    ],
  },
  {
    canonicalName: "Beta 2 Microglobuline (B2MICRO)",
    code: "B2MICRO",
    category: "Individuel",
    aliases: [
      "BETA-2-MICROGLOBULINE",
    ],
  },
  {
    canonicalName: "Beta HCG Intacte Quantitatif",
    code: "BHCG",
    category: "Individuel",
    aliases: [
      "BÉTA-HCG INTACTE (QUANTITATIF)",
    ],
  },
  {
    canonicalName: "Beta HCG Qualitatif Serum (Sérum)",
    code: "PREG",
    category: "Individuel",
    aliases: [
      "BÉTA-HCG QUALITATIF, SÉRUM",
    ],
  },
  {
    canonicalName: "Bicarbonate CO2 Total",
    code: "CO2P",
    category: "Individuel",
    aliases: [
      "BICARBONATE ET CO2 TOTAL",
      "CO2 TOTAL (BICARBONATE)",
    ],
  },
  {
    canonicalName: "Bilan Immunodeficience",
    code: "CD4",
    category: "Individuel",
    aliases: [
      "BILAN D'IMMUNODÉFICIENCE",
    ],
  },
  {
    canonicalName: "Bilirubine Directe Conjuguee",
    code: "BILITD",
    category: "Individuel",
    aliases: [
      "BILIRUBINE DIRECTE/CONJUGUÉE",
      "BILIRUBINE, DIRECTE",
    ],
  },
  {
    canonicalName: "Bilirubine Indirecte",
    code: "IBIL",
    category: "Individuel",
    aliases: [
      "BILIRUBINE, INDIRECTE",
      "BILIRUBINE INDIRECTE/NON CONJUGUÉE",
    ],
  },
  {
    canonicalName: "Bilirubine Totale (BILIT)",
    code: "BILIT",
    category: "Individuel",
    aliases: [
      "BILIRUBINE TOTALE",
    ],
  },
  {
    canonicalName: "Biochimie 1A",
    code: "BIO1",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #1A",
    ],
  },
  {
    canonicalName: "Biochimie 1B",
    code: "CHM1",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #1B",
    ],
  },
  {
    canonicalName: "Biochimie 2",
    code: "CHM2",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #2",
    ],
  },
  {
    canonicalName: "Biochimie 3",
    code: "BIO3",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #3",
    ],
  },
  {
    canonicalName: "Biochimie 3 Electrolytes",
    code: "CHL3",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #3 AVEC ELECTROLYTES",
    ],
  },
  {
    canonicalName: "Biochimie 4",
    code: "CHM4",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #4",
    ],
  },
  {
    canonicalName: "Biochimie 4 Complet",
    code: "BIO4",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #4 COMPLET",
    ],
  },
  {
    canonicalName: "Biochimie 4 Electrolytes",
    code: "CHL4",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #4 AVEC ÉLECTROLYTES",
    ],
  },
  {
    canonicalName: "Biopsie",
    code: "BIOP",
    category: "Individuel",
    aliases: [
      "BIOPSIE",
    ],
  },
  {
    canonicalName: "Bordetella Pertussis Parapertussis",
    code: "BORP",
    category: "Individuel",
    aliases: [
      "BORDETELLA PERTUSSIS ET PARAPERTUSSIS",
    ],
  },
  {
    canonicalName: "Brca 1 2 Sequencage Deletion Duplication",
    code: "BRCA1/2",
    category: "Individuel",
    aliases: [
      "BRCA 1/2 SEQUENÇAGE, DÉLÉTION ET DUPLICATION",
    ],
  },
  {
    canonicalName: "Brucella Brucellose",
    code: "BRUC",
    category: "Individuel",
    aliases: [
      "BRUCELLA/BRUCELLOSE",
    ],
  },
  {
    canonicalName: "C Peptide",
    code: "CPEP",
    category: "Individuel",
    aliases: [
      "C-PEPTIDE",
    ],
  },
  {
    canonicalName: "C Telopeptides",
    code: "CTPP",
    category: "Individuel",
    aliases: [
      "C-TÉLOPEPTIDES",
    ],
  },
  {
    canonicalName: "C1 Inhibiteur Esterase",
    code: "C1EI",
    category: "Individuel",
    aliases: [
      "C1 INHIBITEUR ESTÉRASE",
    ],
  },
  {
    canonicalName: "CA 125 (CA125)",
    code: "CA125",
    category: "Individuel",
    aliases: [
      "CA 125 (OVAIRE)",
      "CA 125",
    ],
  },
  {
    canonicalName: "CA 15 3 (CA153)",
    code: "CA153",
    category: "Individuel",
    aliases: [
      "CA 15-3 (SEIN)",
      "CA 15-3",
    ],
  },
  {
    canonicalName: "CA 19 9 (CA19)",
    code: "CA19",
    category: "Individuel",
    aliases: [
      "CA 19-9 (ANTIGENE CARBOHYDRATE 19-9)",
      "CA 19-9",
    ],
  },
  {
    canonicalName: "CD3 CD4 CD8",
    code: "CD3",
    category: "Individuel",
    aliases: [
      "CD3, CD4, CD8",
    ],
  },
  {
    canonicalName: "CK MB",
    code: "CKMB",
    category: "Individuel",
    aliases: [
      "CK-MB",
    ],
  },
  {
    canonicalName: "Cadmium Sang Entier (Sang Entier)",
    code: "CD",
    category: "Individuel",
    aliases: [
      "CADMIUM, SANG ENTIER",
      "CADMIUM SANG ENTIER",
    ],
  },
  {
    canonicalName: "Calcitonine",
    code: "CLTN",
    category: "Individuel",
    aliases: [
      "CALCITONINE",
    ],
  },
  {
    canonicalName: "Calcium",
    code: "CA",
    category: "Individuel",
    aliases: [
      "CALCIUM",
    ],
  },
  {
    canonicalName: "Calcium Creatinine Ratio",
    code: "CACR",
    category: "Individuel",
    aliases: [
      "CALCIUM / CRÉATININE RATIO",
    ],
  },
  {
    canonicalName: "Calcium Ionise (CAI)",
    code: "CAI",
    category: "Individuel",
    aliases: [
      "CALCIUM-IONISÉ (CALCIUM LIBRE)",
      "CALCIUM IONISÉ",
    ],
  },
  {
    canonicalName: "Calcium Urine 24 Heures (Urine 24h)",
    code: "CA/U",
    category: "Individuel",
    aliases: [
      "CALCIUM, URINE 24 HEURES",
      "CALCIUM - URINES DE 24 HEURES",
    ],
  },
  {
    canonicalName: "Calcium Urine Hasard (Urine Hasard)",
    code: "CAURAN",
    category: "Individuel",
    aliases: [
      "CALCIUM - URINE AU HASARD",
    ],
  },
  {
    canonicalName: "Calcul Analyse",
    code: "CALU",
    category: "Individuel",
    aliases: [
      "CALCUL, ANALYSE DE",
    ],
  },
  {
    canonicalName: "Calprotectine",
    code: "CLPTN",
    category: "Individuel",
    aliases: [
      "CALPROTECTINE",
    ],
  },
  {
    canonicalName: "Cannabis 20 NG ML 50 NG ML",
    code: "CN20",
    category: "Individuel",
    aliases: [
      "CANNABIS (20 NG/ML, 50 NG/ML)",
    ],
  },
  {
    canonicalName: "Carbamazepine Tegretol",
    code: "TEG",
    category: "Individuel",
    aliases: [
      "CARBAMAZEPINE (TEGRETOL)",
      "CARBAMAZÉPINE",
    ],
  },
  {
    canonicalName: "Carcino Embryonique Antigene CEA",
    code: "CEA",
    category: "Individuel",
    aliases: [
      "CARCINO-EMBRYONIQUE ANTIGÈNE (CEA)",
      "ANTIGÈNE CARCINO-EMBRYONNAIRE (ACE)",
    ],
  },
  {
    canonicalName: "Carnitine",
    code: "CARNITH",
    category: "Individuel",
    aliases: [
      "CARNITINE",
    ],
  },
  {
    canonicalName: "Catecholamines Metanephrine 24H",
    code: "CATEMETA",
    category: "Individuel",
    aliases: [
      "CATÉCHOLAMINES ET MÉTANÉPHRINE (24H)",
    ],
  },
  {
    canonicalName: "Catecholamines Plasma (Plasma)",
    code: "CATS",
    category: "Individuel",
    aliases: [
      "CATÉCHOLAMINES, PLASMA",
    ],
  },
  {
    canonicalName: "Catecholamines Urinaire 24H (Urine 24h)",
    code: "UCAT",
    category: "Individuel",
    aliases: [
      "CATÉCHOLAMINES URINAIRE, 24H",
    ],
  },
  {
    canonicalName: "Ccl4",
    code: "CCL4",
    category: "Profil",
    aliases: [
      "CCL4",
    ],
  },
  {
    canonicalName: "Ceruloplasmine",
    code: "CUBP",
    category: "Individuel",
    aliases: [
      "CÉRULOPLASMINE",
    ],
  },
  {
    canonicalName: "Ch50 Complement Total",
    code: "CH50",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT HÉMOLYTIQUE",
      "CH50, COMPLÉMENT TOTAL",
    ],
  },
  {
    canonicalName: "Chaines Legeres Kappa Lambda Libre",
    code: "FKLP",
    category: "Individuel",
    aliases: [
      "CHAÎNES LÉGÈRES KAPPA ET LAMBDA LIBRE",
    ],
  },
  {
    canonicalName: "Chaines Legeres Kappa Libre",
    code: "KLCF",
    category: "Individuel",
    aliases: [
      "CHAÎNES LÉGÈRES KAPPA LIBRE",
    ],
  },
  {
    canonicalName: "Chaines Legeres Lambda Libre",
    code: "LLCF",
    category: "Individuel",
    aliases: [
      "CHAÎNES LÉGÈRES LAMBDA LIBRE",
    ],
  },
  {
    canonicalName: "Chaines Legeres Libres",
    code: "FLC",
    category: "Individuel",
    aliases: [
      "CHAÎNES LÉGÈRES LIBRES",
    ],
  },
  {
    canonicalName: "Charge Virale VIH",
    code: "HIVCV",
    category: "Individuel",
    aliases: [
      "CHARGE VIRALE (VIH)",
    ],
  },
  {
    canonicalName: "Chlamydia Gonorrhee PCR 1 Echantillon",
    code: "CGPCR1",
    category: "Profil",
    aliases: [
      "CHLAMYDIA ET GONORRHÉE PAR PCR (1 ÉCHANTILLON)",
    ],
  },
  {
    canonicalName: "Chlamydia Gonorrhee PCR 2 Echantillons",
    code: "CGPCR2",
    category: "Profil",
    aliases: [
      "CHLAMYDIA ET GONORRHÉE PAR PCR (2 ÉCHANTILLONS)",
    ],
  },
  {
    canonicalName: "Chlamydia Gonorrhee PCR 3 Echantillons",
    code: "CGPCR3",
    category: "Profil",
    aliases: [
      "CHLAMYDIA ET GONORRHÉE PAR PCR (3 ÉCHANTILLONS)",
    ],
  },
  {
    canonicalName: "Chlamydia Gonorrhoeae Trichomonas Taan Urine (Urine)",
    code: "TGCD",
    category: "Individuel",
    aliases: [
      "CHLAMYDIA/GONORRHOEAE/TRICHOMONAS (TAAN) - URINE",
    ],
  },
  {
    canonicalName: "Chlamydia PCR",
    code: "CMPC",
    category: "Individuel",
    aliases: [
      "CHLAMYDIA PAR PCR",
    ],
  },
  {
    canonicalName: "Chlamydia PCR Rectal Incluant LGV (Rectal)",
    code: "CMPCR",
    category: "Individuel",
    aliases: [
      "CHLAMYDIA PAR PCR, RECTAL (INCLUANT LGV)",
    ],
  },
  {
    canonicalName: "Chlamydia Urine (Urine)",
    code: "CMPCU",
    category: "Individuel",
    aliases: [
      "CHLAMYDIA URINE",
    ],
  },
  {
    canonicalName: "Chlorure",
    code: "CL",
    category: "Individuel",
    aliases: [
      "CHLORURE",
      "CHLORURES",
    ],
  },
  {
    canonicalName: "Chlorure Urine 24 Heures (Urine 24h)",
    code: "UCL",
    category: "Individuel",
    aliases: [
      "CHLORURE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Cholera Test Selles (Selles)",
    code: "SCHL",
    category: "Individuel",
    aliases: [
      "CHOLÉRA, TEST (SELLES)",
    ],
  },
  {
    canonicalName: "Cholesterol HDL",
    code: "HDL",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL HDL",
    ],
  },
  {
    canonicalName: "Cholesterol LDL",
    code: "LDLD",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL LDL",
    ],
  },
  {
    canonicalName: "Cholesterol N HDL",
    code: "NHDL",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL NON HDL",
    ],
  },
  {
    canonicalName: "Cholesterol Total",
    code: "CHOL",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL, TOTAL",
      "CHOLESTÉROL TOTAL",
    ],
  },
  {
    canonicalName: "Chrome Sang Entier (Sang Entier)",
    code: "CR",
    category: "Individuel",
    aliases: [
      "CHROME, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Chromogranine A",
    code: "CGA",
    category: "Individuel",
    aliases: [
      "CHROMOGRANINE A",
    ],
  },
  {
    canonicalName: "Chylomicrons",
    code: "CHYL",
    category: "Individuel",
    aliases: [
      "CHYLOMICRONS",
    ],
  },
  {
    canonicalName: "Citrate Urine 24 Heures (Urine 24h)",
    code: "CI/U",
    category: "Individuel",
    aliases: [
      "CITRATE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Clairance Creatinine",
    code: "CTCL",
    category: "Individuel",
    aliases: [
      "CLAIRANCE DE LA CRÉATININE",
    ],
  },
  {
    canonicalName: "Clostridium Difficile",
    code: "CDIF",
    category: "Individuel",
    aliases: [
      "CLOSTRIDIUM DIFFICILE, GÈNE DE LA TOXINE",
      "CLOSTRIDIUM DIFFICILE",
    ],
  },
  {
    canonicalName: "Coagulation Hemogramme",
    code: "CBCCOAG",
    category: "Profil",
    aliases: [
      "PROFIL COAGULATION/HÉMOGRAMME",
    ],
  },
  {
    canonicalName: "Coagulogramme",
    code: "COAG",
    category: "Profil",
    aliases: [
      "COAGULOGRAMME",
      "PROFIL COAGULOGRAMME",
    ],
  },
  {
    canonicalName: "Cobalt Sang Entier (Sang Entier)",
    code: "CO",
    category: "Individuel",
    aliases: [
      "COBALT, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Cocaine",
    code: "COKE",
    category: "Individuel",
    aliases: [
      "COCAÏNE",
    ],
  },
  {
    canonicalName: "Complement C1Q",
    code: "C1Q",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT C1Q",
    ],
  },
  {
    canonicalName: "Complement C3",
    code: "C3",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT C3",
    ],
  },
  {
    canonicalName: "Complement C4",
    code: "C4",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT C4",
    ],
  },
  {
    canonicalName: "Complet CRP Ultrasensible",
    code: "CH4SC",
    category: "Profil",
    aliases: [
      "COMPLET, CRP ULTRASENSIBLE",
    ],
  },
  {
    canonicalName: "Complete Biochemistry",
    code: "CHP4",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY",
    ],
  },
  {
    canonicalName: "Complete Biochemistry General TSH",
    code: "CHP4T",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY GENERAL & TSH",
    ],
  },
  {
    canonicalName: "Complete Biochemistry TSH PSA",
    code: "CHP4A",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY + TSH & PSA",
    ],
  },
  {
    canonicalName: "Complete Biochemistry Without Urine (Urine)",
    code: "CH4U",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY, WITHOUT URINE",
    ],
  },
  {
    canonicalName: "Coombs Direct",
    code: "DCOM",
    category: "Individuel",
    aliases: [
      "COOMBS, DIRECT",
    ],
  },
  {
    canonicalName: "Cortisol AM PM",
    code: "SCORT",
    category: "Individuel",
    aliases: [
      "CORTISOL AM/PM",
    ],
  },
  {
    canonicalName: "Cortisol Matin",
    code: "CORTIAM",
    category: "Individuel",
    aliases: [
      "CORTISOL (MATIN)",
    ],
  },
  {
    canonicalName: "Cortisol Urine 24 Heures (Urine 24h)",
    code: "CORU",
    category: "Individuel",
    aliases: [
      "CORTISOL, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Creatine Kinase",
    code: "CK",
    category: "Individuel",
    aliases: [
      "CRÉATINE KINASE",
      "CK (CRÉATINE KINASE)",
    ],
  },
  {
    canonicalName: "Creatinine (Sérum)",
    code: "CREA",
    category: "Individuel",
    aliases: [
      "CRÉATININE, SÉRUM",
      "CRÉATININE",
    ],
  },
  {
    canonicalName: "Cryogobuline",
    code: "CRYO",
    category: "Individuel",
    aliases: [
      "CRYOGOBULINE",
    ],
  },
  {
    canonicalName: "Cuivre Globules Rouges (Globules Rouges)",
    code: "CURBC",
    category: "Individuel",
    aliases: [
      "CUIVRE, GLOBULES ROUGES",
    ],
  },
  {
    canonicalName: "Cuivre Plasma OU Serum (Plasma)",
    code: "CU",
    category: "Individuel",
    aliases: [
      "CUIVRE, PLASMA OU SÉRUM",
    ],
  },
  {
    canonicalName: "Cuivre Urine 24 Heures (Urine 24h)",
    code: "CU/U",
    category: "Individuel",
    aliases: [
      "CUIVRE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Culture Cervicale (Cervical)",
    code: "CULC",
    category: "Individuel",
    aliases: [
      "CULTURE CERVICALE",
    ],
  },
  {
    canonicalName: "Culture Chlamydia",
    code: "CCHMD",
    category: "Individuel",
    aliases: [
      "CULTURE, CHLAMYDIA",
    ],
  },
  {
    canonicalName: "Culture Crachat (Crachat)",
    code: "SPUT",
    category: "Individuel",
    aliases: [
      "CULTURE CRACHAT",
    ],
  },
  {
    canonicalName: "Culture Fluide Corporel",
    code: "CFLU",
    category: "Individuel",
    aliases: [
      "CULTURE DE FLUIDE CORPOREL",
    ],
  },
  {
    canonicalName: "Culture Fongique Autres",
    code: "CULFS",
    category: "Individuel",
    aliases: [
      "CULTURE FONGIQUE (AUTRES)",
    ],
  },
  {
    canonicalName: "Culture Fongique Peau Cheveux Ongles (Cheveux)",
    code: "CULF",
    category: "Individuel",
    aliases: [
      "CULTURE FONGIQUE (PEAU, CHEVEUX, ONGLES)",
    ],
  },
  {
    canonicalName: "Culture Genital Gono Chlam",
    code: "STDMU",
    category: "Profil",
    aliases: [
      "PROFIL CULTURE GENITAL ET GONO/CHLAM",
    ],
  },
  {
    canonicalName: "Culture Gonorrhee Gorge Rectal (Gorge)",
    code: "GONT",
    category: "Individuel",
    aliases: [
      "CULTURE GONORRHÉE (GORGE / RECTAL)",
    ],
  },
  {
    canonicalName: "Culture Gorge Strep A Rapide (Gorge)",
    code: "STREP",
    category: "Individuel",
    aliases: [
      "CULTURE GORGE + STREP A RAPIDE",
    ],
  },
  {
    canonicalName: "Culture Mycoplasma",
    code: "MYPS",
    category: "Individuel",
    aliases: [
      "CULTURE MYCOPLASMA",
    ],
  },
  {
    canonicalName: "Culture NEZ (Nasal)",
    code: "CULN",
    category: "Individuel",
    aliases: [
      "CULTURE NEZ",
    ],
  },
  {
    canonicalName: "Culture PUS Plaie Profonde (Plaie)",
    code: "CULZ",
    category: "Individuel",
    aliases: [
      "CULTURE PUS / PLAIE PROFONDE",
    ],
  },
  {
    canonicalName: "Culture Plaie Supperficielle (Plaie)",
    code: "CULW",
    category: "Individuel",
    aliases: [
      "CULTURE PLAIE SUPPERFICIELLE",
    ],
  },
  {
    canonicalName: "Culture Selles Culture Traditionnelle (Selles)",
    code: "CULS",
    category: "Individuel",
    aliases: [
      "CULTURE SELLES (CULTURE TRADITIONNELLE)",
    ],
  },
  {
    canonicalName: "Culture Selles Methode PCR (Selles)",
    code: "STOOLPCR",
    category: "Individuel",
    aliases: [
      "CULTURE SELLES (MÉTHODE PCR)",
    ],
  },
  {
    canonicalName: "Culture Ureaplasma Mycoplasma",
    code: "UPCU",
    category: "Individuel",
    aliases: [
      "CULTURE URÉAPLASMA ET MYCOPLASMA",
    ],
  },
  {
    canonicalName: "Culture Urethrale",
    code: "CULP",
    category: "Individuel",
    aliases: [
      "CULTURE URÉTHRALE",
    ],
  },
  {
    canonicalName: "Culture Vaginale Culture Traditionnelle (Vaginal)",
    code: "CULV",
    category: "Individuel",
    aliases: [
      "CULTURE VAGINALE (CULTURE TRADITIONNELLE)",
    ],
  },
  {
    canonicalName: "Culture Vaginale Methode PCR (Vaginal)",
    code: "PCRCULV",
    category: "Individuel",
    aliases: [
      "CULTURE VAGINALE (MÉTHODE PCR)",
    ],
  },
  {
    canonicalName: "Cystatin C",
    code: "CYSC",
    category: "Individuel",
    aliases: [
      "CYSTATIN C",
    ],
  },
  {
    canonicalName: "Cytologie Urine (Urine)",
    code: "UCYT",
    category: "Individuel",
    aliases: [
      "CYTOLOGIE, URINE",
    ],
  },
  {
    canonicalName: "Cytomegalovirus IGG IGM",
    code: "CMVP",
    category: "Individuel",
    aliases: [
      "CYTOMÉGALOVIRUS IGG, IGM",
    ],
  },
  {
    canonicalName: "Cytomegalovirus IGM",
    code: "CMVM",
    category: "Individuel",
    aliases: [
      "CYTOMÉGALOVIRUS IGM",
      "ANTICORPS ANTI-CYTOMEGALOVIRUS IGM",
    ],
  },
  {
    canonicalName: "D Dimere",
    code: "DDIM",
    category: "Individuel",
    aliases: [
      "D-DIMÈRE",
    ],
  },
  {
    canonicalName: "Depistage Hepatite A B",
    code: "HEPAB",
    category: "Profil",
    aliases: [
      "PROFIL DÉPISTAGE HÉPATITE A ET B",
    ],
  },
  {
    canonicalName: "Depistage Hepatite A B C",
    code: "HEPABC",
    category: "Profil",
    aliases: [
      "PROFIL DÉPISTAGE HÉPATITE A, B ET C",
    ],
  },
  {
    canonicalName: "Depistage Hepatite B",
    code: "HEPB",
    category: "Profil",
    aliases: [
      "PROFIL DÉPISTAGE HÉPATITE B",
    ],
  },
  {
    canonicalName: "Dhea",
    code: "DHEA",
    category: "Individuel",
    aliases: [
      "DHEA",
    ],
  },
  {
    canonicalName: "Dheas",
    code: "DH-S",
    category: "Individuel",
    aliases: [
      "DHEA-S",
      "DHEAS",
    ],
  },
  {
    canonicalName: "Diabetique 1",
    code: "DIAB",
    category: "Profil",
    aliases: [
      "DIABÉTIQUE #1",
      "PROFIL DIABÉTIQUE NO 1",
    ],
  },
  {
    canonicalName: "Diabetique 6",
    code: "DIAB6",
    category: "Profil",
    aliases: [
      "PROFIL DIABÉTIQUE NO 6",
    ],
  },
  {
    canonicalName: "Digoxin",
    code: "DIGX",
    category: "Individuel",
    aliases: [
      "DIGOXIN",
    ],
  },
  {
    canonicalName: "Dihydrotestosterone",
    code: "DHT",
    category: "Individuel",
    aliases: [
      "DIHYDROTESTOSTÉRONE",
    ],
  },
  {
    canonicalName: "Drogue Cannabinoides",
    code: "CAN",
    category: "Individuel",
    aliases: [
      "DROGUE: CANNABINOIDES",
    ],
  },
  {
    canonicalName: "Drogue Cocaine",
    code: "COCAINE",
    category: "Individuel",
    aliases: [
      "DROGUE: COCAINE",
    ],
  },
  {
    canonicalName: "Drogues 4 Tests 1",
    code: "DAU450",
    category: "Profil",
    aliases: [
      "DROGUES 4 TESTS #1",
    ],
  },
  {
    canonicalName: "Drogues 5 Tests 1",
    code: "DAUP",
    category: "Profil",
    aliases: [
      "DROGUES 5 TESTS #1",
    ],
  },
  {
    canonicalName: "Drogues 5 Tests 2",
    code: "DAUB50",
    category: "Profil",
    aliases: [
      "DROGUES 5 TESTS #2",
    ],
  },
  {
    canonicalName: "Drogues Dans Cheveux (Cheveux)",
    code: "DRUGH",
    category: "Profil",
    aliases: [
      "DROGUES DANS LES CHEVEUX",
    ],
  },
  {
    canonicalName: "Echographie Endovaginale",
    code: "ENDV",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE ENDOVAGINALE",
    ],
  },
  {
    canonicalName: "Echographie Endovaginale Pelvienne",
    code: "ENDPE",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE ENDOVAGINALE ET PELVIENNE",
    ],
  },
  {
    canonicalName: "Echographie Obstetricale 1ER Trimestre",
    code: "1TRI",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE OBSTÉTRICALE, 1ER TRIMESTRE",
    ],
  },
  {
    canonicalName: "Echographie Obstetricale 2eme Trimestre",
    code: "2TRI",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE OBSTÉTRICALE, 2ÈME TRIMESTRE",
    ],
  },
  {
    canonicalName: "Echographie Obstetricale 3eme Trimestre",
    code: "3TRI",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE OBSTÉTRICALE, 3ÈME TRIMESTRE",
    ],
  },
  {
    canonicalName: "Echographie Viabilite Datation",
    code: "VIAB",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE DE VIABILITÉ-DATATION",
    ],
  },
  {
    canonicalName: "Electrocardiogramme",
    code: "ECG",
    category: "Individuel",
    aliases: [
      "ÉLECTROCARDIOGRAMME AU REPOS (ECG)",
      "ÉLECTROCARDIOGRAMME",
    ],
  },
  {
    canonicalName: "Electrocardiogramme Sans Interpretation",
    code: "ECGW",
    category: "Individuel",
    aliases: [
      "ÉLECTROCARDIOGRAMME SANS INTERPRÉTATION",
    ],
  },
  {
    canonicalName: "Electrolytes",
    code: "ELEC",
    category: "Individuel",
    aliases: [
      "ÉLECTROLYTES",
    ],
  },
  {
    canonicalName: "Electrolytes NA K CL",
    code: "LYTES",
    category: "Individuel",
    aliases: [
      "ÉLECTROLYTES (NA, K, CL)",
    ],
  },
  {
    canonicalName: "Electrolytes Urine 24 Heures (Urine 24h)",
    code: "UELE",
    category: "Individuel",
    aliases: [
      "ÉLECTROLYTES, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Electrophorese Hemoglobine",
    code: "HBEL",
    category: "Individuel",
    aliases: [
      "ÉLECTROPHORÈSE DE L'HÉMOGLOBINE",
    ],
  },
  {
    canonicalName: "Electrophorese Proteines",
    code: "SPEP",
    category: "Individuel",
    aliases: [
      "ÉLECTROPHORÈSE DES PROTÉINES",
    ],
  },
  {
    canonicalName: "Electrophorese Proteines Urine (Urine)",
    code: "UELP",
    category: "Individuel",
    aliases: [
      "ÉLECTROPHORÈSE DES PROTÉINES, URINE",
    ],
  },
  {
    canonicalName: "Enzyme Conversion Angiotensine ACE",
    code: "ACE",
    category: "Individuel",
    aliases: [
      "ENZYME DE CONVERSION ANGIOTENSINE (ACE)",
    ],
  },
  {
    canonicalName: "Epstein Barr Ebar Ebvna",
    code: "EBVP",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR, PROFIL (EBAR+EBVNA)",
    ],
  },
  {
    canonicalName: "Epstein Barr Ebna IGG",
    code: "EBVNA",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR EBNA IGG",
    ],
  },
  {
    canonicalName: "Epstein Barr VCA IGG",
    code: "EBVG",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR VCA IGG",
    ],
  },
  {
    canonicalName: "Epstein Barr VCA IGM",
    code: "EBAR",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR VCA IGM",
    ],
  },
  {
    canonicalName: "Erythropoietine",
    code: "ERYT",
    category: "Individuel",
    aliases: [
      "ÉRYTHROPOIETINE",
    ],
  },
  {
    canonicalName: "Estradiol",
    code: "ESTR",
    category: "Individuel",
    aliases: [
      "ESTRADIOL (E2)",
      "ESTRADIOL",
    ],
  },
  {
    canonicalName: "Estrone",
    code: "ESTN",
    category: "Individuel",
    aliases: [
      "ESTRONE",
    ],
  },
  {
    canonicalName: "Ethanol Serum (Sérum)",
    code: "SETH",
    category: "Individuel",
    aliases: [
      "ÉTHANOL, SÉRUM",
    ],
  },
  {
    canonicalName: "FER (FE)",
    code: "FE",
    category: "Individuel",
    aliases: [
      "FER, TOTAL",
      "FER",
    ],
  },
  {
    canonicalName: "FER (IRON)",
    code: "IRON",
    category: "Profil",
    aliases: [
      "FER",
    ],
  },
  {
    canonicalName: "FER 1",
    code: "IRN1",
    category: "Profil",
    aliases: [
      "FER #1",
    ],
  },
  {
    canonicalName: "FER 2",
    code: "IRN2",
    category: "Profil",
    aliases: [
      "FER #2",
    ],
  },
  {
    canonicalName: "FER 3",
    code: "IRN3",
    category: "Profil",
    aliases: [
      "FER #3",
    ],
  },
  {
    canonicalName: "FER 6",
    code: "IRN6",
    category: "Profil",
    aliases: [
      "FER #6",
    ],
  },
  {
    canonicalName: "FSH",
    code: "FSH",
    category: "Individuel",
    aliases: [
      "FSH",
    ],
  },
  {
    canonicalName: "Facteur II Mutation",
    code: "FIIM",
    category: "Individuel",
    aliases: [
      "FACTEUR II MUTATION",
    ],
  },
  {
    canonicalName: "Facteur Rhumatoide",
    code: "RA",
    category: "Individuel",
    aliases: [
      "FACTEUR RHUMATOÏDE",
    ],
  },
  {
    canonicalName: "Facteur V Leiden",
    code: "FVL",
    category: "Individuel",
    aliases: [
      "FACTEUR V LEIDEN",
    ],
  },
  {
    canonicalName: "Facteur Viii Fonctionnel",
    code: "FAC8",
    category: "Individuel",
    aliases: [
      "FACTEUR VIII FONCTIONNEL",
    ],
  },
  {
    canonicalName: "Ferritine",
    code: "FERR",
    category: "Individuel",
    aliases: [
      "FERRITINE",
    ],
  },
  {
    canonicalName: "Fertilite 1",
    code: "FERT",
    category: "Profil",
    aliases: [
      "FERTILITÉ #1",
      "PROFIL FERTILITÉ NO 1",
    ],
  },
  {
    canonicalName: "Fertilite 2",
    code: "SPGMF",
    category: "Individuel",
    aliases: [
      "SPERMOGRAMME FERTILITÉ",
      "PROFIL FERTILITÉ NO 2",
    ],
  },
  {
    canonicalName: "Fibrinogene",
    code: "FIB",
    category: "Individuel",
    aliases: [
      "FIBRINOGÈNE",
    ],
  },
  {
    canonicalName: "Fibrose Kystique Depistage",
    code: "CFC",
    category: "Individuel",
    aliases: [
      "FIBROSE KYSTIQUE, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "Formule Sanguine Complete FSC",
    code: "CBC",
    category: "Individuel",
    aliases: [
      "FORMULE SANGUINE COMPLÈTE (FSC)",
      "FORMULE SANGUINE COMPLETE (FSC)",
    ],
  },
  {
    canonicalName: "Formule Sanguine Complete Sedimentation",
    code: "CBCS",
    category: "Profil",
    aliases: [
      "FORMULE SANGUINE COMPLÈTE ET SÉDIMENTATION",
    ],
  },
  {
    canonicalName: "Fructosamine",
    code: "FRUC",
    category: "Individuel",
    aliases: [
      "FRUCTOSAMINE",
    ],
  },
  {
    canonicalName: "GGT",
    code: "GGT",
    category: "Individuel",
    aliases: [
      "GGT",
    ],
  },
  {
    canonicalName: "Gastrine",
    code: "GAST",
    category: "Individuel",
    aliases: [
      "GASTRINE",
    ],
  },
  {
    canonicalName: "General 1",
    code: "CHP1",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #1",
      "PROFIL GÉNÉRAL NO 1",
    ],
  },
  {
    canonicalName: "General 1 CRP",
    code: "FIN1",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #1, CRP",
    ],
  },
  {
    canonicalName: "General 2",
    code: "CHP2",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #2",
      "PROFIL GÉNÉRAL NO 2",
    ],
  },
  {
    canonicalName: "General 3",
    code: "CHP3",
    category: "Profil",
    aliases: [
      "GENERAL BIOCHEMISTRY #3",
      "PROFIL GÉNÉRAL NO 3",
    ],
  },
  {
    canonicalName: "General 3 Sans Urine (Urine)",
    code: "CH3U",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #3, SANS URINE",
    ],
  },
  {
    canonicalName: "General 4",
    code: "GP4",
    category: "Profil",
    aliases: [
      "PROFIL GÉNÉRAL NO 4",
    ],
  },
  {
    canonicalName: "General 5",
    code: "GN5",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #5",
    ],
  },
  {
    canonicalName: "General 6",
    code: "PNL6",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #6",
    ],
  },
  {
    canonicalName: "Globulines",
    code: "GLOB",
    category: "Individuel",
    aliases: [
      "GLOBULINES",
    ],
  },
  {
    canonicalName: "Glucagon",
    code: "GLGN",
    category: "Individuel",
    aliases: [
      "GLUCAGON",
    ],
  },
  {
    canonicalName: "Glucose 6 PO4 DH Quantitatif Sang Entier (Sang Entier)",
    code: "G6PDQ",
    category: "Individuel",
    aliases: [
      "GLUCOSE-6-PO4-DH QUANTITATIF, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Glucose AC",
    code: "ACGL",
    category: "Individuel",
    aliases: [
      "GLUCOSE AC",
    ],
  },
  {
    canonicalName: "Glucose AC PC 1H",
    code: "ACPC1H",
    category: "Individuel",
    aliases: [
      "GLUCOSE AC & PC 1H",
    ],
  },
  {
    canonicalName: "Glucose AC PC 2H",
    code: "ACPC2H",
    category: "Individuel",
    aliases: [
      "GLUCOSE AC & PC 2H",
    ],
  },
  {
    canonicalName: "Glucose Aleatoire",
    code: "GLU",
    category: "Individuel",
    aliases: [
      "GLUCOSE, ALÉATOIRE",
    ],
  },
  {
    canonicalName: "Glucose Hasard",
    code: "ACP",
    category: "Individuel",
    aliases: [
      "GLUCOSE AU HASARD",
    ],
  },
  {
    canonicalName: "Glucose Hyperglycemie Orale 75G N Gestationnel 2 Heures",
    code: "GLU75",
    category: "Individuel",
    aliases: [
      "GLUCOSE - HYPERGLYCÉMIE ORALE 75G NON-GESTATIONNEL (2 HEURES)",
    ],
  },
  {
    canonicalName: "Glucose PC",
    code: "PCGL",
    category: "Individuel",
    aliases: [
      "GLUCOSE PC",
    ],
  },
  {
    canonicalName: "Glucose Test Tolerance 2 Heures",
    code: "2HGTT",
    category: "Individuel",
    aliases: [
      "GLUCOSE TEST DE TOLÉRANCE, 2 HEURES",
    ],
  },
  {
    canonicalName: "Gono Chlam",
    code: "ITSS",
    category: "Profil",
    aliases: [
      "PROFIL GONO-CHLAM",
    ],
  },
  {
    canonicalName: "Gonorrhee PCR",
    code: "GONO",
    category: "Individuel",
    aliases: [
      "GONORRHÉE PAR PCR",
    ],
  },
  {
    canonicalName: "Gonorrhee PCR Urine (Urine)",
    code: "GONOU",
    category: "Individuel",
    aliases: [
      "GONORRHÉE PAR PCR (URINE)",
    ],
  },
  {
    canonicalName: "Groupe Sanguin RH",
    code: "BLDT",
    category: "Individuel",
    aliases: [
      "GROUPE SANGUIN & RH",
    ],
  },
  {
    canonicalName: "H Pylori Selles (Selles)",
    code: "HELAG",
    category: "Individuel",
    aliases: [
      "H. PYLORI, SELLES",
    ],
  },
  {
    canonicalName: "H Pylori Test Respiratoire",
    code: "HPBT",
    category: "Individuel",
    aliases: [
      "H. PYLORI, TEST RESPIRATOIRE",
    ],
  },
  {
    canonicalName: "HFE Genotype",
    code: "HFE",
    category: "Individuel",
    aliases: [
      "HFE GÉNOTYPE",
    ],
  },
  {
    canonicalName: "HLA B27",
    code: "HB27",
    category: "Individuel",
    aliases: [
      "HLA B27",
      "ANTIGÈNE HLA-B27",
    ],
  },
  {
    canonicalName: "HLA Celiac",
    code: "HLACELIAC",
    category: "Individuel",
    aliases: [
      "HLA CELIAC",
    ],
  },
  {
    canonicalName: "Haptoglobine",
    code: "HPGN",
    category: "Individuel",
    aliases: [
      "HAPTOGLOBINE",
    ],
  },
  {
    canonicalName: "Harmony®",
    code: "HARMP",
    category: "Profil",
    aliases: [
      "HARMONY®",
    ],
  },
  {
    canonicalName: "Hemoglobine A1C",
    code: "HBA1C",
    category: "Individuel",
    aliases: [
      "HÉMOGLOBINE A1C",
    ],
  },
  {
    canonicalName: "Hemoglobine Glyquee",
    code: "GLHBP",
    category: "Individuel",
    aliases: [
      "HÉMOGLOBINE GLYQUÉE",
    ],
  },
  {
    canonicalName: "Hepatique",
    code: "LIV1",
    category: "Profil",
    aliases: [
      "HÉPATIQUE #1",
      "PROFIL HÉPATIQUE",
    ],
  },
  {
    canonicalName: "Hepatite A IGG",
    code: "HAVG",
    category: "Individuel",
    aliases: [
      "HÉPATITE A IGG",
    ],
  },
  {
    canonicalName: "Hepatite A IGM",
    code: "HAVM",
    category: "Individuel",
    aliases: [
      "HÉPATITE A IGM",
    ],
  },
  {
    canonicalName: "Hepatite A Total",
    code: "HAVT",
    category: "Individuel",
    aliases: [
      "HÉPATITE A TOTAL",
    ],
  },
  {
    canonicalName: "Hepatite Anticorps",
    code: "HEPC",
    category: "Individuel",
    aliases: [
      "HÉPATITE ANTICORPS",
      "ANTICORPS ANTI-HEPATITE C",
    ],
  },
  {
    canonicalName: "Hepatite B Aigue",
    code: "HPBA",
    category: "Profil",
    aliases: [
      "HÉPATITE B AIGÜE",
    ],
  },
  {
    canonicalName: "Hepatite B Anticorps Core IGM",
    code: "CABM",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTICORPS (CORE IGM)",
    ],
  },
  {
    canonicalName: "Hepatite B Anticorps Core Total",
    code: "HBCS",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTICORPS (CORE TOTAL)",
    ],
  },
  {
    canonicalName: "Hepatite B Anticorps Surface",
    code: "HBAB",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTICORPS DE SURFACE",
    ],
  },
  {
    canonicalName: "Hepatite B Antigene Surface Confirmation",
    code: "HBCN",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTIGÈNE DE SURFACE CONFIRMATION",
    ],
  },
  {
    canonicalName: "Hepatite B Charge Virale",
    code: "HEPBL",
    category: "Individuel",
    aliases: [
      "HÉPATITE B CHARGE VIRALE",
    ],
  },
  {
    canonicalName: "Hepatite B E Anticorps",
    code: "HEAG",
    category: "Individuel",
    aliases: [
      "HÉPATITE B E ANTICORPS",
    ],
  },
  {
    canonicalName: "Hepatite B E Antigene",
    code: "HBEG",
    category: "Individuel",
    aliases: [
      "HÉPATITE B E ANTIGÈNE",
    ],
  },
  {
    canonicalName: "Hepatite C Charge Virale",
    code: "HCVL",
    category: "Individuel",
    aliases: [
      "HÉPATITE C CHARGE VIRALE",
    ],
  },
  {
    canonicalName: "Herpes Simplex Virus 1 2 ADN PCR",
    code: "HSVPCR",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 1 ET 2 ADN, PCR",
    ],
  },
  {
    canonicalName: "Herpes Simplex Virus 1 2 IGG",
    code: "HSSP",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 1 ET 2 IGG",
    ],
  },
  {
    canonicalName: "Herpes Simplex Virus 1 IGG",
    code: "SEH1",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 1 IGG",
    ],
  },
  {
    canonicalName: "Herpes Simplex Virus 2 IGG",
    code: "SEH2",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 2 IGG",
    ],
  },
  {
    canonicalName: "Holter 24 Heures",
    code: "HLTR",
    category: "Individuel",
    aliases: [
      "HOLTER 24 HEURES",
    ],
  },
  {
    canonicalName: "Holter 48 Heures",
    code: "HLTR48",
    category: "Individuel",
    aliases: [
      "HOLTER 48 HEURES",
    ],
  },
  {
    canonicalName: "Homocysteine",
    code: "HCYS",
    category: "Individuel",
    aliases: [
      "HOMOCYSTÉINE",
    ],
  },
  {
    canonicalName: "Hormone Adrenocorticoide",
    code: "ACTH",
    category: "Individuel",
    aliases: [
      "HORMONE ADRÉNOCORTICOÏDE",
    ],
  },
  {
    canonicalName: "Hormone Anti Mulerienne",
    code: "AMH",
    category: "Individuel",
    aliases: [
      "HORMONE ANTI-MÜLÉRIENNE",
    ],
  },
  {
    canonicalName: "Hormone Croissance",
    code: "GH",
    category: "Individuel",
    aliases: [
      "HORMONE DE CROISSANCE",
      "HORMONE DE CROISSANCE (GH)",
    ],
  },
  {
    canonicalName: "Hormone Parathyr Oidienne",
    code: "PTH",
    category: "Individuel",
    aliases: [
      "HORMONE PARATHYR OÏDIENNE",
    ],
  },
  {
    canonicalName: "Htlv I II",
    code: "HTLV",
    category: "Individuel",
    aliases: [
      "HTLV I & II",
    ],
  },
  {
    canonicalName: "IGF 1",
    code: "IGF1",
    category: "Individuel",
    aliases: [
      "IGF-1",
    ],
  },
  {
    canonicalName: "IGG Sous Classe",
    code: "IGGSUB",
    category: "Individuel",
    aliases: [
      "IGG SOUS CLASSE",
    ],
  },
  {
    canonicalName: "INR PTT",
    code: "PTPTT",
    category: "Individuel",
    aliases: [
      "INR + PTT",
    ],
  },
  {
    canonicalName: "Ilots Langerhans Anticorps",
    code: "ICAB",
    category: "Individuel",
    aliases: [
      "ÎLOTS DE LANGERHANS, ANTICORPS",
    ],
  },
  {
    canonicalName: "Immunoelectrophorese Serum (Sérum)",
    code: "IEP",
    category: "Individuel",
    aliases: [
      "IMMUNOÉLECTROPHORÈSE, SÉRUM",
    ],
  },
  {
    canonicalName: "Immunoelectrophorese Urine (Urine)",
    code: "IEUR",
    category: "Individuel",
    aliases: [
      "IMMUNOÉLECTROPHORÈSE, URINE",
    ],
  },
  {
    canonicalName: "Immunoelectrophorese Urine 24 Heures (Urine 24h)",
    code: "IEU",
    category: "Individuel",
    aliases: [
      "IMMUNOÉLECTROPHORÈSE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Immunoglobuline",
    code: "IMM",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE",
    ],
  },
  {
    canonicalName: "Immunoglobuline IGA",
    code: "IGA",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGA",
    ],
  },
  {
    canonicalName: "Immunoglobuline IGE",
    code: "IGE",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGE",
    ],
  },
  {
    canonicalName: "Immunoglobuline IGG",
    code: "IGG",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGG",
    ],
  },
  {
    canonicalName: "Immunoglobuline IGM",
    code: "IGM",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGM",
    ],
  },
  {
    canonicalName: "Influenza A B Depistage",
    code: "FLUABPCR",
    category: "Individuel",
    aliases: [
      "INFLUENZA A + B, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "Influenza A Depistage",
    code: "FLUAPCR",
    category: "Individuel",
    aliases: [
      "INFLUENZA A, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "Influenza B Depistage",
    code: "FLUBPCR",
    category: "Individuel",
    aliases: [
      "INFLUENZA B, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "Insuline",
    code: "ISLN",
    category: "Individuel",
    aliases: [
      "INSULINE",
    ],
  },
  {
    canonicalName: "Insuline A Jeun",
    code: "INSUL",
    category: "Individuel",
    aliases: [
      "INSULINE (À JEUN)",
    ],
  },
  {
    canonicalName: "Interleukine 6",
    code: "IL6",
    category: "Individuel",
    aliases: [
      "INTERLEUKINE 6",
    ],
  },
  {
    canonicalName: "Iodine Plasma (Plasma)",
    code: "IODL",
    category: "Individuel",
    aliases: [
      "IODINE PLASMA",
    ],
  },
  {
    canonicalName: "Karyotype",
    code: "KART",
    category: "Individuel",
    aliases: [
      "KARYOTYPE",
    ],
  },
  {
    canonicalName: "LH",
    code: "LH",
    category: "Individuel",
    aliases: [
      "LH",
    ],
  },
  {
    canonicalName: "LP A",
    code: "LPA",
    category: "Individuel",
    aliases: [
      "LP (A)",
    ],
  },
  {
    canonicalName: "Lactate Dehydrogenase LDH",
    code: "LD",
    category: "Individuel",
    aliases: [
      "LACTATE DÉHYDROGÉNASE (LDH)",
    ],
  },
  {
    canonicalName: "Lactose Test Tolerance Serum (Sérum)",
    code: "OLTT",
    category: "Individuel",
    aliases: [
      "LACTOSE TEST DE TOLÉRANCE, SÉRUM",
    ],
  },
  {
    canonicalName: "Lamotrigine",
    code: "LAMT",
    category: "Individuel",
    aliases: [
      "LAMOTRIGINE",
    ],
  },
  {
    canonicalName: "Lipase",
    code: "LASE",
    category: "Individuel",
    aliases: [
      "LIPASE",
    ],
  },
  {
    canonicalName: "Lipidique Cardiovasculaire",
    code: "LIPID",
    category: "Profil",
    aliases: [
      "PROFIL LIPIDIQUE CARDIOVASCULAIRE",
    ],
  },
  {
    canonicalName: "Lipidique Cardiovasculaire 18",
    code: "LIPID18",
    category: "Profil",
    aliases: [
      "PROFIL LIPIDIQUE CARDIOVASCULAIRE NO 18",
    ],
  },
  {
    canonicalName: "Lipidique Cardiovasculaire 6",
    code: "LIPID6",
    category: "Profil",
    aliases: [
      "PROFIL LIPIDIQUE CARDIOVASCULAIRE NO 6",
    ],
  },
  {
    canonicalName: "Lithium",
    code: "LITH",
    category: "Individuel",
    aliases: [
      "LITHIUM",
    ],
  },
  {
    canonicalName: "Lupus Anticoagulant",
    code: "LAGT",
    category: "Individuel",
    aliases: [
      "LUPUS ANTICOAGULANT",
    ],
  },
  {
    canonicalName: "Lyme Maladie IGG OU IGM Immunoblot",
    code: "IBLYMP",
    category: "Individuel",
    aliases: [
      "LYME, MALADIE DE, IGG OU IGM (IMMUNOBLOT)",
    ],
  },
  {
    canonicalName: "Lyme Maladie IGG OU IGM Lymg Lymm",
    code: "LYMG",
    category: "Individuel",
    aliases: [
      "LYME, MALADIE DE, IGG OU IGM (LYMG/LYMM)",
    ],
  },
  {
    canonicalName: "Lymphocytes",
    code: "LYMSP1",
    category: "Individuel",
    aliases: [
      "LYMPHOCYTES",
    ],
  },
  {
    canonicalName: "Lysozymes",
    code: "LYSZ",
    category: "Individuel",
    aliases: [
      "LYSOZYMES",
    ],
  },
  {
    canonicalName: "MTS 1 VIH Homme",
    code: "STDMH",
    category: "Profil",
    aliases: [
      "MTS #1, VIH - HOMME",
    ],
  },
  {
    canonicalName: "MTS 2 Femme",
    code: "STD2",
    category: "Profil",
    aliases: [
      "MTS #2, FEMME",
    ],
  },
  {
    canonicalName: "Macroprolactine",
    code: "MNPRLA",
    category: "Individuel",
    aliases: [
      "MACROPROLACTINE",
    ],
  },
  {
    canonicalName: "Magnesium (Sérum)",
    code: "MG",
    category: "Individuel",
    aliases: [
      "MAGNÉSIUM, SÉRUM",
      "MAGNÉSIUM",
    ],
  },
  {
    canonicalName: "Magnesium Urine 24 Heures (Urine 24h)",
    code: "MG/U",
    category: "Individuel",
    aliases: [
      "MAGNÉSIUM, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Maladie Coeliaque",
    code: "CELP",
    category: "Profil",
    aliases: [
      "MALADIE COELIAQUE",
      "PROFIL DÉPISTAGE MALADIE COELIAQUE",
    ],
  },
  {
    canonicalName: "Malaria Frottis",
    code: "MALR",
    category: "Individuel",
    aliases: [
      "MALARIA, FROTTIS",
    ],
  },
  {
    canonicalName: "Manganese Sang Entier (Sang Entier)",
    code: "MN",
    category: "Individuel",
    aliases: [
      "MANGANESE, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Marqueurs Prostatiques",
    code: "FPSA_PROF",
    category: "Profil",
    aliases: [
      "PROFIL MARQUEURS PROSTATIQUES",
    ],
  },
  {
    canonicalName: "Menopause 1",
    code: "MEN1",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #1",
    ],
  },
  {
    canonicalName: "Menopause 2",
    code: "MEN2",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #2",
    ],
  },
  {
    canonicalName: "Menopause 3",
    code: "MEN3",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #3",
    ],
  },
  {
    canonicalName: "Menopause 4",
    code: "MEN4",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #4",
    ],
  },
  {
    canonicalName: "Mercure Sang Entier (Sang Entier)",
    code: "HG",
    category: "Individuel",
    aliases: [
      "MERCURE, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Metanephrines Plasma (Plasma)",
    code: "METS",
    category: "Individuel",
    aliases: [
      "MÉTANÉPHRINES, PLASMA",
    ],
  },
  {
    canonicalName: "Metanephrines Urinaire 24 Heures (Urine)",
    code: "UMET",
    category: "Individuel",
    aliases: [
      "MÉTANÉPHRINES, URINAIRE (24 HEURES)",
    ],
  },
  {
    canonicalName: "Methadone",
    code: "UMDN",
    category: "Individuel",
    aliases: [
      "MÉTHADONE",
    ],
  },
  {
    canonicalName: "Methamphetamine",
    code: "METHAM",
    category: "Individuel",
    aliases: [
      "MÉTHAMPHETAMINE",
    ],
  },
  {
    canonicalName: "Methaqualone",
    code: "LUDE",
    category: "Individuel",
    aliases: [
      "MÉTHAQUALONE",
    ],
  },
  {
    canonicalName: "Microalbuminurie Aleatoire",
    code: "A/CU",
    category: "Individuel",
    aliases: [
      "MICROALBUMINURIE (ALÉATOIRE)",
    ],
  },
  {
    canonicalName: "Microalbuminurie Urine 24 Heures (Urine 24h)",
    code: "MALB",
    category: "Individuel",
    aliases: [
      "MICROALBUMINURIE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Microdeletion Chromosome Y",
    code: "YXMD",
    category: "Individuel",
    aliases: [
      "MICRODÉLÉTION DU CHROMOSOME Y",
    ],
  },
  {
    canonicalName: "Microscopie Urinaire (Urine)",
    code: "UMICP",
    category: "Individuel",
    aliases: [
      "MICROSCOPIE URINAIRE",
    ],
  },
  {
    canonicalName: "Monotest (MON+)",
    code: "MON+",
    category: "Profil",
    aliases: [
      "MONOTEST #1",
      "PROFIL MONOTEST",
    ],
  },
  {
    canonicalName: "Monotest (MONO)",
    code: "MONO",
    category: "Individuel",
    aliases: [
      "MONOTEST",
      "MONONUCLÉOSE",
    ],
  },
  {
    canonicalName: "Mutation Gene Mthfr",
    code: "MTHFR",
    category: "Individuel",
    aliases: [
      "MUTATION DU GÈNE MTHFR",
    ],
  },
  {
    canonicalName: "Myeloperoxidase Anticorps",
    code: "MPO",
    category: "Individuel",
    aliases: [
      "MYELOPEROXIDASE ANTICORPS",
    ],
  },
  {
    canonicalName: "Myosite",
    code: "MYOSIT",
    category: "Individuel",
    aliases: [
      "MYOSITE",
    ],
  },
  {
    canonicalName: "Nickel Sang Entier (Sang Entier)",
    code: "NIB",
    category: "Individuel",
    aliases: [
      "NICKEL, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Oeufs Parasites Selles Preservatif (Selles)",
    code: "PARAPCR",
    category: "Individuel",
    aliases: [
      "OEUFS & PARASITES, SELLES (AVEC PRÉSERVATIF)",
    ],
  },
  {
    canonicalName: "Oeufs Parasites Selles Sans Preservatif (Selles)",
    code: "PARA",
    category: "Individuel",
    aliases: [
      "OEUFS & PARASITES, SELLES (SANS PRÉSERVATIF)",
    ],
  },
  {
    canonicalName: "Oeufs Parasites Urine (Urine)",
    code: "BILH",
    category: "Individuel",
    aliases: [
      "OEUFS & PARASITES, URINE",
    ],
  },
  {
    canonicalName: "Opiaces",
    code: "OPIT",
    category: "Individuel",
    aliases: [
      "OPIACÉS",
    ],
  },
  {
    canonicalName: "Oreillons IGG",
    code: "MUMG",
    category: "Individuel",
    aliases: [
      "OREILLONS IGG",
    ],
  },
  {
    canonicalName: "Oreillons IGM",
    code: "MUMM",
    category: "Individuel",
    aliases: [
      "OREILLONS IGM",
    ],
  },
  {
    canonicalName: "Osmolalite Serum (Sérum)",
    code: "OSMS",
    category: "Individuel",
    aliases: [
      "OSMOLALITÉ, SÉRUM",
    ],
  },
  {
    canonicalName: "Osmolalite Urine (Urine)",
    code: "OSMU",
    category: "Individuel",
    aliases: [
      "OSMOLALITÉ, URINE",
    ],
  },
  {
    canonicalName: "Osteocalcine",
    code: "OSTO",
    category: "Individuel",
    aliases: [
      "OSTÉOCALCINE",
    ],
  },
  {
    canonicalName: "Osteoporosis",
    code: "OSTEOP",
    category: "Profil",
    aliases: [
      "PROFIL OSTEOPOROSIS",
    ],
  },
  {
    canonicalName: "Oxalate Urine 24 Heures (Urine 24h)",
    code: "OXAL",
    category: "Individuel",
    aliases: [
      "OXALATE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Oxyures",
    code: "PINW",
    category: "Individuel",
    aliases: [
      "OXYURES",
    ],
  },
  {
    canonicalName: "PAP Frottis Traditionnel",
    code: "PAPS",
    category: "Individuel",
    aliases: [
      "PAP, FROTTIS (TRADITIONNEL)",
    ],
  },
  {
    canonicalName: "PAP Thinpreptm Test",
    code: "PAPT",
    category: "Individuel",
    aliases: [
      "PAP THINPREPTM, TEST",
    ],
  },
  {
    canonicalName: "PRO BNP",
    code: "NTPROBNP",
    category: "Individuel",
    aliases: [
      "PRO-BNP",
    ],
  },
  {
    canonicalName: "PT INR Temps Quick",
    code: "PT",
    category: "Individuel",
    aliases: [
      "PT INR (TEMPS DE QUICK)",
      "RAPPORT INTERNATIONAL NORMALISÉ (INR)",
    ],
  },
  {
    canonicalName: "PT PTT",
    code: "PTPT",
    category: "Profil",
    aliases: [
      "PT ET PTT",
    ],
  },
  {
    canonicalName: "PTT TCA",
    code: "PTT",
    category: "Individuel",
    aliases: [
      "PTT (TCA)",
    ],
  },
  {
    canonicalName: "Pancreatique",
    code: "PANC",
    category: "Profil",
    aliases: [
      "PANCRÉATIQUE",
    ],
  },
  {
    canonicalName: "Panorama®",
    code: "PANO",
    category: "Profil",
    aliases: [
      "PANORAMA®",
    ],
  },
  {
    canonicalName: "Panorama® Microdeletions",
    code: "PANOE",
    category: "Profil",
    aliases: [
      "PANORAMA® ET MICRODÉLÉTIONS",
    ],
  },
  {
    canonicalName: "Parvovirus IGG",
    code: "PARV",
    category: "Individuel",
    aliases: [
      "PARVOVIRUS IGG",
    ],
  },
  {
    canonicalName: "Parvovirus IGM",
    code: "PARM",
    category: "Individuel",
    aliases: [
      "PARVOVIRUS IGM",
    ],
  },
  {
    canonicalName: "Parvovirus Iggigm",
    code: "PARP",
    category: "Individuel",
    aliases: [
      "PARVOVIRUS IGGIGM",
    ],
  },
  {
    canonicalName: "Paternite Test ADN",
    code: "PATT",
    category: "Individuel",
    aliases: [
      "PATERNITÉ, TEST DE (ADN)",
    ],
  },
  {
    canonicalName: "Paternite Test Sang Maternel",
    code: "MATPAT",
    category: "Individuel",
    aliases: [
      "PATERNITÉ, TEST DE (SANG MATERNEL)",
    ],
  },
  {
    canonicalName: "Peptide Cyclique Citrulline IGG",
    code: "CCPG",
    category: "Individuel",
    aliases: [
      "PEPTIDE CYCLIQUE CITRULLINÉ IGG",
    ],
  },
  {
    canonicalName: "Phencyclidine PCP",
    code: "PCP",
    category: "Individuel",
    aliases: [
      "PHENCYCLIDINE (PCP)",
    ],
  },
  {
    canonicalName: "Phenytoine",
    code: "PHTN",
    category: "Individuel",
    aliases: [
      "PHÉNYTOINE",
    ],
  },
  {
    canonicalName: "Phosphatase Alcaline",
    code: "ALKP",
    category: "Individuel",
    aliases: [
      "PHOSPHATASE ALCALINE",
    ],
  },
  {
    canonicalName: "Phosphatase Alcaline Isoenzymes",
    code: "ALKPI",
    category: "Individuel",
    aliases: [
      "PHOSPHATASE ALCALINE ISOENZYMES",
    ],
  },
  {
    canonicalName: "Phosphate",
    code: "PO4",
    category: "Individuel",
    aliases: [
      "PHOSPHATE",
    ],
  },
  {
    canonicalName: "Phosphate Urine 24 Heures (Urine 24h)",
    code: "PO/U",
    category: "Individuel",
    aliases: [
      "PHOSPHATE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Phosphore",
    code: "PHOS",
    category: "Individuel",
    aliases: [
      "PHOSPHORE",
    ],
  },
  {
    canonicalName: "Antiphospholipine IGM IGG",
    code: "PHOS_MG",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGM, IGG",
    ],
  },
  {
    canonicalName: "Plaquettes",
    code: "PLT",
    category: "Individuel",
    aliases: [
      "PLAQUETTES",
    ],
  },
  {
    canonicalName: "Plaquettes Tube Bleu",
    code: "PLTB",
    category: "Individuel",
    aliases: [
      "PLAQUETTES (TUBE BLEU)",
    ],
  },
  {
    canonicalName: "Plomb Sang Entier (Sang Entier)",
    code: "PB",
    category: "Individuel",
    aliases: [
      "PLOMB, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Potassium",
    code: "K",
    category: "Individuel",
    aliases: [
      "POTASSIUM",
    ],
  },
  {
    canonicalName: "Prealbumine",
    code: "PALB",
    category: "Individuel",
    aliases: [
      "PRÉALBUMINE",
    ],
  },
  {
    canonicalName: "Pregnenolone 17 OH",
    code: "17PGLN",
    category: "Individuel",
    aliases: [
      "PRÉGNENOLONE 17-OH",
    ],
  },
  {
    canonicalName: "Prenatal 1",
    code: "PREN",
    category: "Profil",
    aliases: [
      "PRÉNATAL #1",
      "PROFIL PRÉNATAL NO 1",
    ],
  },
  {
    canonicalName: "Prenatal 2",
    code: "PREN2",
    category: "Profil",
    aliases: [
      "PROFIL PRÉNATAL NO 2",
    ],
  },
  {
    canonicalName: "Prenatal 3 (DAL2)",
    code: "DAL2",
    category: "Profil",
    aliases: [
      "PRÉNATAL #3",
    ],
  },
  {
    canonicalName: "Prenatal 3 (DAL2G)",
    code: "DAL2G",
    category: "Profil",
    aliases: [
      "PRÉNATAL #3, GLUCOSE",
      "PROFIL PRÉNATAL NO 3",
    ],
  },
  {
    canonicalName: "Prenatal Glucose AC",
    code: "PRENG",
    category: "Profil",
    aliases: [
      "PRÉNATAL, GLUCOSE AC",
    ],
  },
  {
    canonicalName: "Progesterone",
    code: "PROG",
    category: "Individuel",
    aliases: [
      "PROGESTÉRONE",
    ],
  },
  {
    canonicalName: "Prolactine (PRLA)",
    code: "PRLA",
    category: "Individuel",
    aliases: [
      "PROLACTINE",
    ],
  },
  {
    canonicalName: "Prolactine (PROL)",
    code: "PROL",
    category: "Individuel",
    aliases: [
      "PROLACTINE",
    ],
  },
  {
    canonicalName: "Prostate APS Facteurs Risque Claritydx",
    code: "CLRYDX",
    category: "Individuel",
    aliases: [
      "PROSTATE, APS FACTEURS DE RISQUE CLARITYDX",
    ],
  },
  {
    canonicalName: "Proteinase 3 Anticorps",
    code: "PRTASE",
    category: "Individuel",
    aliases: [
      "PROTEINASE-3 ANTICORPS",
    ],
  },
  {
    canonicalName: "Proteine C Antigene",
    code: "PRCA",
    category: "Individuel",
    aliases: [
      "PROTÉINE C, ANTIGÈNE",
      "ANTIGÈNE PROTÉINE C",
    ],
  },
  {
    canonicalName: "Proteine C Fonctionnelle",
    code: "PRCF",
    category: "Individuel",
    aliases: [
      "PROTÉINE C, FONCTIONNELLE",
    ],
  },
  {
    canonicalName: "Proteine C Reactive",
    code: "CRP",
    category: "Individuel",
    aliases: [
      "PROTÉINE C-RÉACTIVE (CRP)",
      "PROTÉINE C-RÉACTIVE",
    ],
  },
  {
    canonicalName: "Proteine C Reactive Haute Sensibilite",
    code: "CRPHS",
    category: "Individuel",
    aliases: [
      "PROTÉINE C-RÉACTIVE HAUTE SENSIBILITÉ (CRPHS)",
      "PROTÉINE C-RÉACTIVE HAUTE SENSIBILITÉ",
    ],
  },
  {
    canonicalName: "Proteine Creatinine Ratio",
    code: "P/CU",
    category: "Individuel",
    aliases: [
      "PROTÉINE CRÉATININE RATIO",
    ],
  },
  {
    canonicalName: "Proteine S Antigene",
    code: "PRSA",
    category: "Individuel",
    aliases: [
      "PROTÉINE S, ANTIGÈNE",
    ],
  },
  {
    canonicalName: "Proteine S Fonctionnelle",
    code: "PRSF",
    category: "Individuel",
    aliases: [
      "PROTÉINE S, FONCTIONNELLE",
    ],
  },
  {
    canonicalName: "Proteines Totales",
    code: "PROT",
    category: "Individuel",
    aliases: [
      "PROTÉINES TOTALES",
    ],
  },
  {
    canonicalName: "Proteines Totales Serum (Sérum)",
    code: "TP",
    category: "Individuel",
    aliases: [
      "PROTÉINES TOTALES, SÉRUM",
    ],
  },
  {
    canonicalName: "Proteines Urine 24 Heures (Urine 24h)",
    code: "PR/U",
    category: "Individuel",
    aliases: [
      "PROTÉINES, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Quantiferon TB Gold",
    code: "QFINT",
    category: "Individuel",
    aliases: [
      "QUANTIFÉRON-TB GOLD",
    ],
  },
  {
    canonicalName: "Rage Anticorps",
    code: "RABIES",
    category: "Individuel",
    aliases: [
      "RAGE, ANTICORPS",
    ],
  },
  {
    canonicalName: "Recherche D’anticorps",
    code: "ABSN",
    category: "Individuel",
    aliases: [
      "RECHERCHE D’ANTICORPS",
    ],
  },
  {
    canonicalName: "Renal 2",
    code: "REN2",
    category: "Profil",
    aliases: [
      "RÉNAL #2",
    ],
  },
  {
    canonicalName: "Renine",
    code: "RENN",
    category: "Individuel",
    aliases: [
      "RÉNINE",
    ],
  },
  {
    canonicalName: "Resistance Proteine C Activee",
    code: "RPC",
    category: "Individuel",
    aliases: [
      "RÉSISTANCE PROTÉINE C ACTIVÉE",
    ],
  },
  {
    canonicalName: "Reticulocytes",
    code: "RTIC",
    category: "Individuel",
    aliases: [
      "RÉTICULOCYTES",
    ],
  },
  {
    canonicalName: "Risque Cardiovasculaire 1",
    code: "CVRK",
    category: "Profil",
    aliases: [
      "RISQUE CARDIOVASCULAIRE #1",
    ],
  },
  {
    canonicalName: "Risque Cardiovasculaire 2 Plus Apob",
    code: "CVK2",
    category: "Profil",
    aliases: [
      "RISQUE CARDIOVASCULAIRE #2 PLUS APOB",
    ],
  },
  {
    canonicalName: "Rougeole IGG",
    code: "RMES",
    category: "Individuel",
    aliases: [
      "ROUGEOLE IGG",
    ],
  },
  {
    canonicalName: "Rougeole IGM",
    code: "RMEM",
    category: "Individuel",
    aliases: [
      "ROUGEOLE IGM",
    ],
  },
  {
    canonicalName: "Rubeole IGM",
    code: "RUBM",
    category: "Individuel",
    aliases: [
      "RUBÉOLE IGM",
    ],
  },
  {
    canonicalName: "SMA 16",
    code: "SMA16",
    category: "Profil",
    aliases: [
      "PROFIL SMA-16",
    ],
  },
  {
    canonicalName: "SMA 5",
    code: "SMA5",
    category: "Profil",
    aliases: [
      "PROFIL SMA-5",
    ],
  },
  {
    canonicalName: "SMA 6",
    code: "SMA6",
    category: "Profil",
    aliases: [
      "PROFIL SMA-6",
    ],
  },
  {
    canonicalName: "SMA 7",
    code: "SMA7",
    category: "Profil",
    aliases: [
      "PROFIL SMA-7",
    ],
  },
  {
    canonicalName: "Sang Dans Selles Immunologique Quantitatif (Selles)",
    code: "QIFOB",
    category: "Individuel",
    aliases: [
      "SANG DANS LES SELLES IMMUNOLOGIQUE, QUANTITATIF",
    ],
  },
  {
    canonicalName: "Selenium Sang Entier (Sang Entier)",
    code: "SE",
    category: "Individuel",
    aliases: [
      "SÉLÉNIUM, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Shbg Globuline Reliee A L’hormone Sexe",
    code: "SHBG",
    category: "Individuel",
    aliases: [
      "SHBG (GLOBULINE RELIÉE À L’HORMONE DU SEXE)",
    ],
  },
  {
    canonicalName: "Sodium",
    code: "NA",
    category: "Individuel",
    aliases: [
      "SODIUM",
    ],
  },
  {
    canonicalName: "Sodium Creatinine Ratio",
    code: "NACR",
    category: "Individuel",
    aliases: [
      "SODIUM / CRÉATININE RATIO",
    ],
  },
  {
    canonicalName: "Sodium Urine 24 Heures (Urine 24h)",
    code: "UNA",
    category: "Individuel",
    aliases: [
      "SODIUM, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Spermogramme Post Vasectomie",
    code: "SPGMPV",
    category: "Individuel",
    aliases: [
      "SPERMOGRAMME POST-VASECTOMIE",
    ],
  },
  {
    canonicalName: "Strep A C G PCR",
    code: "STPCR",
    category: "Individuel",
    aliases: [
      "STREP A, C, G (PCR)",
    ],
  },
  {
    canonicalName: "Strep A C G PCR Candida",
    code: "CULT",
    category: "Individuel",
    aliases: [
      "STREP A, C, G (PCR), CANDIDA",
    ],
  },
  {
    canonicalName: "Strep A Candida",
    code: "STPT",
    category: "Individuel",
    aliases: [
      "STREP A, CANDIDA",
    ],
  },
  {
    canonicalName: "Strep A Rapide",
    code: "STRP",
    category: "Individuel",
    aliases: [
      "STREP A, RAPIDE",
    ],
  },
  {
    canonicalName: "Strep Groupe B PCR Vaginal (Vaginal)",
    code: "VAGS",
    category: "Individuel",
    aliases: [
      "STREP GROUPE B PCR, VAGINAL",
    ],
  },
  {
    canonicalName: "Syndrome Fragile X",
    code: "FRGX",
    category: "Individuel",
    aliases: [
      "SYNDRÔME FRAGILE X",
    ],
  },
  {
    canonicalName: "Syphilis EIA",
    code: "SYPEIA",
    category: "Individuel",
    aliases: [
      "SYPHILIS (EIA)",
    ],
  },
  {
    canonicalName: "T3 Libre (T3F)",
    code: "T3F",
    category: "Individuel",
    aliases: [
      "T3 LIBRE",
    ],
  },
  {
    canonicalName: "T3 Reverse",
    code: "RT3",
    category: "Individuel",
    aliases: [
      "T3 REVERSE",
    ],
  },
  {
    canonicalName: "T3 Totale",
    code: "TT3",
    category: "Individuel",
    aliases: [
      "T3 TOTALE",
    ],
  },
  {
    canonicalName: "T4 Libre (T4F)",
    code: "T4F",
    category: "Individuel",
    aliases: [
      "T4 LIBRE",
    ],
  },
  {
    canonicalName: "T4 Total",
    code: "TT4",
    category: "Individuel",
    aliases: [
      "T4 TOTAL",
    ],
  },
  {
    canonicalName: "TAY Sachs Plaquettes",
    code: "TAYS",
    category: "Individuel",
    aliases: [
      "TAY SACHS, PLAQUETTES",
    ],
  },
  {
    canonicalName: "TSH Anticorps Anti Recepteur",
    code: "TBII",
    category: "Individuel",
    aliases: [
      "TSH, ANTICORPS ANTI-RÉCEPTEUR",
    ],
  },
  {
    canonicalName: "TSH Ultrasensible",
    code: "TSH",
    category: "Individuel",
    aliases: [
      "HORMONE DE STIMULATION THYROIDIENNE",
      "TSH ULTRASENSIBLE",
    ],
  },
  {
    canonicalName: "Tacrolimus Fk506 Prograf",
    code: "TCLM",
    category: "Individuel",
    aliases: [
      "TACROLIMUS (FK506, PROGRAF)",
    ],
  },
  {
    canonicalName: "Teriflunomide",
    code: "TERI",
    category: "Individuel",
    aliases: [
      "TERIFLUNOMIDE",
    ],
  },
  {
    canonicalName: "Test PAP Thin Prep HPV DNA",
    code: "PAPTHPV",
    category: "Profil",
    aliases: [
      "TEST PAP THIN PREP + HPV DNA",
    ],
  },
  {
    canonicalName: "Test PAP Thin Prep VPH DNA Cascade",
    code: "TPPV",
    category: "Profil",
    aliases: [
      "TEST PAP THIN PREP, VPH DNA EN CASCADE",
    ],
  },
  {
    canonicalName: "Testosterone Biodisponible",
    code: "TESBC",
    category: "Individuel",
    aliases: [
      "TESTOSTÉRONE BIODISPONIBLE",
    ],
  },
  {
    canonicalName: "Testosterone Libre",
    code: "TESFC",
    category: "Individuel",
    aliases: [
      "TESTOSTÉRONE LIBRE",
    ],
  },
  {
    canonicalName: "Testosterone Total",
    code: "TEST",
    category: "Individuel",
    aliases: [
      "TESTOSTÉRONE TOTAL",
      "TESTOSTÉRONE TOTALE",
    ],
  },
  {
    canonicalName: "Tests Respiratoires D Xylose",
    code: "HBTDXP",
    category: "Individuel",
    aliases: [
      "TESTS RESPIRATOIRES D-XYLOSE",
    ],
  },
  {
    canonicalName: "Thalassemie Alpha",
    code: "ATHAL",
    category: "Individuel",
    aliases: [
      "THALASSEMIE ALPHA",
    ],
  },
  {
    canonicalName: "Thyroglobuline",
    code: "THYG",
    category: "Individuel",
    aliases: [
      "THYROGLOBULINE",
    ],
  },
  {
    canonicalName: "Thyroglobuline Anticorps",
    code: "TGAB",
    category: "Individuel",
    aliases: [
      "THYROGLOBULINE, ANTICORPS",
    ],
  },
  {
    canonicalName: "Thyroide 1",
    code: "THY1",
    category: "Profil",
    aliases: [
      "THYROÏDE #1",
    ],
  },
  {
    canonicalName: "Thyroide 1 Cascade",
    code: "THY1R",
    category: "Profil",
    aliases: [
      "THYROÏDE #1, CASCADE",
    ],
  },
  {
    canonicalName: "Thyroide 3",
    code: "THY3",
    category: "Profil",
    aliases: [
      "THYROÏDE #3",
    ],
  },
  {
    canonicalName: "Thyroide 3 Cascade",
    code: "THY3R",
    category: "Profil",
    aliases: [
      "THYROÏDE #3, CASCADE",
    ],
  },
  {
    canonicalName: "Thyroide 4",
    code: "THY4",
    category: "Profil",
    aliases: [
      "THYROÏDE #4",
    ],
  },
  {
    canonicalName: "Thyroidien 2",
    code: "TH2",
    category: "Individuel",
    aliases: [
      "PROFIL THYROÏDIEN NO 2 (TSH, T4 LIBRE)",
      "PROFIL THYROÏDIEN NO 2",
    ],
  },
  {
    canonicalName: "Thyroidien 6",
    code: "TH6",
    category: "Profil",
    aliases: [
      "PROFIL THYROÏDIEN NO 6",
    ],
  },
  {
    canonicalName: "Thyroidiens Anticorps",
    code: "THAB",
    category: "Individuel",
    aliases: [
      "THYROÏDIENS, ANTICORPS",
    ],
  },
  {
    canonicalName: "Toxoplasmose IGG",
    code: "TOXG",
    category: "Individuel",
    aliases: [
      "TOXOPLASMOSE IGG",
    ],
  },
  {
    canonicalName: "Toxoplasmose IGG IGM",
    code: "TOXP",
    category: "Individuel",
    aliases: [
      "TOXOPLASMOSE IGG, IGM",
    ],
  },
  {
    canonicalName: "Toxoplasmose IGM",
    code: "TOXM",
    category: "Individuel",
    aliases: [
      "TOXOPLASMOSE IGM",
    ],
  },
  {
    canonicalName: "Transferrine",
    code: "TRFN",
    category: "Individuel",
    aliases: [
      "TRANSFERRINE",
    ],
  },
  {
    canonicalName: "Trichomonas PCR Urine (Urine)",
    code: "UTRIPCR",
    category: "Individuel",
    aliases: [
      "TRICHOMONAS PCR (URINE)",
    ],
  },
  {
    canonicalName: "Trichomonas Vaginalis PCR (Vaginal)",
    code: "TRIPCR",
    category: "Individuel",
    aliases: [
      "TRICHOMONAS VAGINALIS PCR",
    ],
  },
  {
    canonicalName: "Triglycerides",
    code: "TRIG",
    category: "Individuel",
    aliases: [
      "TRIGLYCÉRIDES",
    ],
  },
  {
    canonicalName: "Troponine T",
    code: "TROPHS",
    category: "Individuel",
    aliases: [
      "TROPONINE T",
    ],
  },
  {
    canonicalName: "Tryptase",
    code: "TRYP",
    category: "Individuel",
    aliases: [
      "TRYPTASE",
    ],
  },
  {
    canonicalName: "Urealyticum PCR",
    code: "UREAP",
    category: "Individuel",
    aliases: [
      "URÉALYTICUM (PCR)",
    ],
  },
  {
    canonicalName: "Uree",
    code: "UREA",
    category: "Individuel",
    aliases: [
      "URÉE",
    ],
  },
  {
    canonicalName: "Uree Creatinine Ratio",
    code: "UCR",
    category: "Individuel",
    aliases: [
      "URÉE / CRÉATININE, RATIO",
    ],
  },
  {
    canonicalName: "Uree Urine 24 Heures BUN (Urine 24h)",
    code: "UR/U",
    category: "Individuel",
    aliases: [
      "URÉE, URINE 24 HEURES (BUN)",
    ],
  },
  {
    canonicalName: "Urine Culture (Urine)",
    code: "CULU",
    category: "Individuel",
    aliases: [
      "URINE, CULTURE",
      "CULTURE: URINE",
    ],
  },
  {
    canonicalName: "Urolithiase",
    code: "STONE",
    category: "Profil",
    aliases: [
      "PROFIL UROLITHIASE",
    ],
  },
  {
    canonicalName: "VIH Virus Immunodeficience Humaine Charge Virale",
    code: "HIVL",
    category: "Individuel",
    aliases: [
      "VIH (VIRUS IMMUNODÉFICIENCE HUMAINE), CHARGE VIRALE",
    ],
  },
  {
    canonicalName: "VIH Virus L’immunodeficience Humaine",
    code: "HIV",
    category: "Individuel",
    aliases: [
      "VIH (VIRUS DE L’IMMUNODÉFICIENCE HUMAINE)",
    ],
  },
  {
    canonicalName: "VON Willebrand Antigene",
    code: "VWF",
    category: "Individuel",
    aliases: [
      "VON WILLEBRAND, ANTIGÈNE",
    ],
  },
  {
    canonicalName: "VPH DNA Test PAP Thinprep Cascade",
    code: "PVTP",
    category: "Profil",
    aliases: [
      "VPH DNA, TEST PAP THINPREP EN CASCADE",
    ],
  },
  {
    canonicalName: "VPH Genotypage Homme Femme",
    code: "GENHPV",
    category: "Individuel",
    aliases: [
      "VPH GENOTYPAGE (HOMME ET FEMME)",
    ],
  },
  {
    canonicalName: "VPH Virus Papillome Humain",
    code: "HPV",
    category: "Individuel",
    aliases: [
      "VPH (VIRUS DU PAPILLOME HUMAIN)",
    ],
  },
  {
    canonicalName: "Varicelle IGG",
    code: "VARG",
    category: "Individuel",
    aliases: [
      "VARICELLE IGG",
    ],
  },
  {
    canonicalName: "Varicelle IGM",
    code: "VARM",
    category: "Individuel",
    aliases: [
      "VARICELLE IGM",
    ],
  },
  {
    canonicalName: "Vitamine A Retinol",
    code: "VITA",
    category: "Individuel",
    aliases: [
      "VITAMINE A (RETINOL)",
    ],
  },
  {
    canonicalName: "Vitamine B12 (VB12)",
    code: "VB12",
    category: "Individuel",
    aliases: [
      "VITAMINE B12",
      "VITAMINE B12 (CYANOCOBALAMINE)",
    ],
  },
  {
    canonicalName: "Vitamine B6",
    code: "VITB6",
    category: "Individuel",
    aliases: [
      "VITAMINE B6",
    ],
  },
  {
    canonicalName: "Vitesse Sedimentation",
    code: "SED",
    category: "Individuel",
    aliases: [
      "VITESSE DE SÉDIMENTATION",
      "SÉDIMENTATION, VITESSE DE",
    ],
  },
  {
    canonicalName: "Zinc Globules Rouges (Globules Rouges)",
    code: "ZNRBC",
    category: "Individuel",
    aliases: [
      "ZINC, GLOBULES ROUGES",
    ],
  },
  {
    canonicalName: "Zinc Plasma (Plasma)",
    code: "ZN",
    category: "Individuel",
    aliases: [
      "ZINC, PLASMA",
    ],
  },
];
