/**
 * Canonical Test Registry — Single source of truth for test name resolution.
 *
 * Each entry defines a canonical test with all known name aliases from all labs.
 * During seeding/importing, every lab test is resolved to its canonical entry
 * by checking if its raw name appears in any alias list.
 */

export interface CanonicalTestDefinition {
  canonicalName: string;
  code: string;
  category: "Profil" | "Individuel";
  aliases: string[];
}

/**
 * Build lookup indexes for resolving test names to canonical definitions.
 *
 * Returns:
 * - byCode: code → CanonicalTestDefinition (exact code match, highest priority)
 * - byAlias: normalizedAlias → CanonicalTestDefinition (name-based fallback)
 *
 * Resolution order: try byCode first, then byAlias.
 */
export function buildCanonicalIndexes(registry: CanonicalTestDefinition[]): {
  byCode: Map<string, CanonicalTestDefinition>;
  byAlias: Map<string, CanonicalTestDefinition>;
} {
  const byCode = new Map<string, CanonicalTestDefinition>();
  const byAlias = new Map<string, CanonicalTestDefinition>();

  for (const def of registry) {
    byCode.set(def.code, def);

    for (const alias of def.aliases) {
      const key = alias
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      byAlias.set(key, def);
    }
  }

  return { byCode, byAlias };
}

/** Normalize a string for alias matching: lowercase + strip accents + trim. */
export function normalizeForLookup(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export const CANONICAL_TEST_REGISTRY: CanonicalTestDefinition[] = [
  {
    canonicalName: "Vitamine B12",
    code: "VB12",
    category: "Individuel",
    aliases: [
      "VITAMINE B12",
      "Vitamine B12",
    ],
  },
  {
    canonicalName: "Acide Folique",
    code: "FOLC",
    category: "Individuel",
    aliases: [
      "ACIDE FOLIQUE",
      "ACIDE FOLIQUE (FOLATE)",
      "Acide Folique (Folate)",
      "Folate (Sérique)",
      "Acide Folique",
    ],
  },
  {
    canonicalName: "Vitamine D (25-OH)",
    code: "25D",
    category: "Individuel",
    aliases: [
      "VITAMINE D 25 OH",
      "25-HYDROXY VITAMINE D",
      "Vitamine D (25-OH)",
    ],
  },
  {
    canonicalName: "Ferritine",
    code: "FERR",
    category: "Individuel",
    aliases: [
      "FERRITINE",
      "Ferritine",
    ],
  },
  {
    canonicalName: "Fibrinogène",
    code: "FIB",
    category: "Individuel",
    aliases: [
      "FIBRINOGÈNE",
      "Fibrinogène",
    ],
  },
  {
    canonicalName: "Bilirubine Directe",
    code: "DBIL",
    category: "Individuel",
    aliases: [
      "BILIRUBINE, DIRECTE",
      "BILIRUBINE DIRECTE/CONJUGUÉE",
      "Bilirubine Directe",
    ],
  },
  {
    canonicalName: "Bilirubine Totale",
    code: "TBIL",
    category: "Individuel",
    aliases: [
      "BILIRUBINE, TOTALE",
      "BILIRUBINE TOTALE",
      "Bilirubine Totale",
    ],
  },
  {
    canonicalName: "Bilirubine Indirecte",
    code: "IBIL",
    category: "Individuel",
    aliases: [
      "BILIRUBINE, INDIRECTE",
      "BILIRUBINE INDIRECTE/NON CONJUGUÉE",
      "Bilirubine Indirecte",
    ],
  },
  {
    canonicalName: "Électrophorèse des Protéines",
    code: "SPEP",
    category: "Individuel",
    aliases: [
      "ÉLECTROPHORÈSE DES PROTÉINES",
      "Électrophorèse des protéines (Sérum)",
      "Électrophorèse des Protéines",
    ],
  },
  {
    canonicalName: "Aldostérone",
    code: "ALDO",
    category: "Individuel",
    aliases: [
      "ALDOSTÉRONE",
      "Aldostérone",
    ],
  },
  {
    canonicalName: "Estradiol",
    code: "ESTR",
    category: "Individuel",
    aliases: [
      "ESTRADIOL (E2)",
      "ESTRADIOL",
      "Estradiol",
    ],
  },
  {
    canonicalName: "Estrone",
    code: "ESTN",
    category: "Individuel",
    aliases: [
      "ESTRONE",
      "Estrone",
    ],
  },
  {
    canonicalName: "Prolactine",
    code: "PRLA",
    category: "Individuel",
    aliases: [
      "PROLACTINE",
      "Prolactine",
    ],
  },
  {
    canonicalName: "HbA1c (Hémoglobine Glyquée)",
    code: "GLHBP",
    category: "Individuel",
    aliases: [
      "HÉMOGLOBINE GLYQUÉE",
      "HÉMOGLOBINE A1C",
      "HbA1c (Hémoglobine Glyquée)",
      "HbA1c",
    ],
  },
  {
    canonicalName: "Cortisol",
    code: "SCORT",
    category: "Individuel",
    aliases: [
      "CORTISOL AM/PM",
      "CORTISOL (MATIN)",
      "Cortisol (AM/PM)",
      "Cortisol (AM)",
      "Cortisol",
    ],
  },
  {
    canonicalName: "Insuline",
    code: "ISLN",
    category: "Individuel",
    aliases: [
      "INSULINE",
      "INSULINE (À JEUN)",
      "Insuline",
    ],
  },
  {
    canonicalName: "Hormone de Croissance (GH)",
    code: "GH",
    category: "Individuel",
    aliases: [
      "HORMONE DE CROISSANCE",
      "HORMONE DE CROISSANCE (GH)",
      "Hormone de Croissance (GH)",
    ],
  },
  {
    canonicalName: "Électrolytes (Na, K, Cl)",
    code: "ELEC",
    category: "Individuel",
    aliases: [
      "ÉLECTROLYTES",
      "ÉLECTROLYTES (Na, K, Cl)",
      "Électrolytes (Na, K, Cl)",
    ],
  },
  {
    canonicalName: "Bicarbonate / CO2 Total",
    code: "CO2P",
    category: "Individuel",
    aliases: [
      "BICARBONATE ET CO2 TOTAL",
      "CO2 TOTAL (BICARBONATE)",
      "Bicarbonate (CO2 Total)",
      "CO2 Total (Bicarbonate)",
      "Bicarbonate / CO2 Total",
    ],
  },
  {
    canonicalName: "Protéines Totales",
    code: "TP",
    category: "Individuel",
    aliases: [
      "PROTÉINES TOTALES, SÉRUM",
      "PROTÉINES TOTALES",
      "Protéines Totales",
    ],
  },
  {
    canonicalName: "CA 125",
    code: "C125",
    category: "Individuel",
    aliases: [
      "CA-125",
      "CA 125",
    ],
  },
  {
    canonicalName: "CA 15-3",
    code: "C153",
    category: "Individuel",
    aliases: [
      "CA 15-3",
    ],
  },
  {
    canonicalName: "CA 19-9",
    code: "C199",
    category: "Individuel",
    aliases: [
      "CA 19-9",
    ],
  },
  {
    canonicalName: "Hépatite B (HBsAg)",
    code: "HSAG",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTIGÈNE DE SURFACE",
      "ANTIGÈNE DE SURFACE HÉPATITE B (HBsAg)",
      "Hépatite B (Ag de surface - HBsAg)",
      "Hépatite B (HBsAg)",
    ],
  },
  {
    canonicalName: "Hépatite B Anti-HBs",
    code: "HBAB",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTICORPS DE SURFACE",
      "ANTI-HBs",
      "Hépatite B (Anti-HBs)",
      "Hépatite B Anti-HBs",
    ],
  },
  {
    canonicalName: "Hépatite B Anti-HBc",
    code: "HBCS",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTICORPS (CORE TOTAL)",
      "ANTICORPS ANTI-HBc",
      "Hépatite B (Anti-HBc Total)",
      "Hépatite B Anti-HBc",
    ],
  },
  {
    canonicalName: "Hépatite B Anti-HBc IgM",
    code: "CABM",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTICORPS (CORE IGM)",
      "ANTICORPS ANTI-HBc IgM",
      "Hépatite B Anti-HBc IgM",
    ],
  },
  {
    canonicalName: "Hépatite B Anti-HBe",
    code: "HEAG",
    category: "Individuel",
    aliases: [
      "HÉPATITE B E ANTICORPS",
      "ANTICORPS ANTI-HBe",
      "Hépatite B Anti-HBe",
    ],
  },
  {
    canonicalName: "Hépatite B E Antigène",
    code: "HBEG",
    category: "Individuel",
    aliases: [
      "HÉPATITE B E ANTIGÈNE",
      "ANTIGÈNE HÉPATITE Be (HBeAg)",
      "Hépatite B E Antigène",
    ],
  },
  {
    canonicalName: "Hépatite A IgG",
    code: "HAVG",
    category: "Individuel",
    aliases: [
      "HÉPATITE A IGG",
      "ANTICORPS ANTI-HEPATITE A IgG",
      "Hépatite A IgG",
    ],
  },
  {
    canonicalName: "Hépatite A IgM",
    code: "HAVM",
    category: "Individuel",
    aliases: [
      "HÉPATITE A IGM",
      "ANTICORPS ANTI-HEPATITE A IgM",
      "Hépatite A IgM",
    ],
  },
  {
    canonicalName: "HIV Charge Virale",
    code: "HIVL",
    category: "Individuel",
    aliases: [
      "VIH (VIRUS IMMUNODÉFICIENCE HUMAINE), CHARGE VIRALE",
      "CHARGE VIRALE (VIH)",
      "HIV Charge Virale",
    ],
  },
  {
    canonicalName: "Antistreptolysine O (ASO)",
    code: "ASOT",
    category: "Individuel",
    aliases: [
      "ANTISTREPTOLYSINE",
      "ANTICORPS ANTI-STREPTOLYSINE O",
      "Antistreptolysine O (ASO)",
    ],
  },
  {
    canonicalName: "Anti-TPO (Microsomes Thyroïdiens)",
    code: "TPO",
    category: "Individuel",
    aliases: [
      "ANTI TPO",
      "ANTICORPS ANTI-MICROSOMES THYROIDIENS",
      "Anti-TPO (Microsomes Thyroïdiens)",
    ],
  },
  {
    canonicalName: "Anticorps Anti-Récepteur TSH",
    code: "TBII",
    category: "Individuel",
    aliases: [
      "TSH, ANTICORPS ANTI-RÉCEPTEUR",
      "ANTICORPS ANTI-RÉCEPTEURS TSH (TBII)",
      "Anticorps Anti-Récepteur TSH",
    ],
  },
  {
    canonicalName: "Anti-Cytoplasme Neutrophiles (ANCA)",
    code: "ANCAP",
    category: "Individuel",
    aliases: [
      "ANTI-CYTOPLASME DES NEUTROPHILES, ANTICORPS",
      "ANTICORPS ANTI-CYTOPLASME DES NEUTROPHILES",
      "Anti-Cytoplasme Neutrophiles (ANCA)",
    ],
  },
  {
    canonicalName: "Anti-Cellules Pariétales",
    code: "APA",
    category: "Individuel",
    aliases: [
      "ANTI-CELLULES PARIÉTALES, ANTICORPS",
      "ANTICORPS ANTI-CELLULES PARIÉTALES",
      "Anti-Cellules Pariétales",
    ],
  },
  {
    canonicalName: "Anti-Mitochondries",
    code: "AMA",
    category: "Individuel",
    aliases: [
      "ANTI-MITOCHONDRIES, ANTICORPS",
      "ANTICORPS ANTI-MITOCHONDRIES",
      "Anti-Mitochondries",
    ],
  },
  {
    canonicalName: "Anti-Muscle Lisse",
    code: "ASA",
    category: "Individuel",
    aliases: [
      "ANTI-MUSCLE LISSE, ANTICORPS",
      "ANTICORPS ANTI-MUSCLE LISSE",
      "Anti-Muscle Lisse",
    ],
  },
  {
    canonicalName: "Anti-Gliadine IgA",
    code: "GLIA",
    category: "Individuel",
    aliases: [
      "ANTI-GLIADINE IGA",
      "ANTICORPS ANTI-GLIADINE DE TYPE IgA",
      "Anti-Gliadine IgA",
    ],
  },
  {
    canonicalName: "Anti-Gliadine IgG",
    code: "GLIG",
    category: "Individuel",
    aliases: [
      "ANTI-GLIADINE IGG",
      "ANTICORPS ANTI-GLIADINE DE TYPE IgG",
      "Anti-Gliadine IgG",
    ],
  },
  {
    canonicalName: "Anti-Transglutaminase IgA",
    code: "TRSG",
    category: "Individuel",
    aliases: [
      "ANTI-TRANSGLUTAMINASE IGA",
      "ANTICORPS ANTI-TRANSGLUTAMINASE IgA",
      "Anti-Transglutaminase IgA",
    ],
  },
  {
    canonicalName: "Anticorps Anti-CCP",
    code: "CCPG",
    category: "Individuel",
    aliases: [
      "PEPTIDE CYCLIQUE CITRULLINÉ IGG",
      "ANTICORPS ANTI-CCP",
      "Anticorps Anti-CCP",
    ],
  },
  {
    canonicalName: "Facteur Intrinseque Anticorps",
    code: "IFAB",
    category: "Individuel",
    aliases: [
      "FACTEUR INTRINSÈQUE ANTICORPS",
      "ANTICORPS ANTI-FACTEUR INTRINSÈQUE",
      "Facteur Intrinseque Anticorps",
    ],
  },
  {
    canonicalName: "Facteur Rhumatoïde",
    code: "RA",
    category: "Individuel",
    aliases: [
      "FACTEUR RHUMATOÏDE",
      "Rhumatoïde (Facteur)",
      "Facteur Rhumatoïde",
    ],
  },
  {
    canonicalName: "Lupus Anticoagulant",
    code: "LAGT",
    category: "Individuel",
    aliases: [
      "LUPUS ANTICOAGULANT",
      "ANTICOAGULANT LUPIQUE",
      "Lupus Anticoagulant",
    ],
  },
  {
    canonicalName: "Cytomégalovirus IgG",
    code: "CMV",
    category: "Individuel",
    aliases: [
      "CYTOMÉGALOVIRUS IGG",
      "ANTICORPS ANTI-CYTOMEGALOVIRUS IgG",
      "Cytomégalovirus IgG",
    ],
  },
  {
    canonicalName: "Epstein-Barr VCA IgG",
    code: "EBVG",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR VCA IGG",
      "ANTICORPS ANTI-EBV IgG",
      "Epstein-Barr VCA IgG",
    ],
  },
  {
    canonicalName: "Epstein-Barr VCA IgM",
    code: "EBAR",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR VCA IGM",
      "ANTICORPS ANTI-EBV IgM",
      "Epstein-Barr VCA IgM",
    ],
  },
  {
    canonicalName: "Rubéole IgG",
    code: "RUBE",
    category: "Individuel",
    aliases: [
      "RUBÉOLE IGG",
      "ANTICORPS ANTI-RUBÉOLE IgG",
      "Rubéole IgG",
    ],
  },
  {
    canonicalName: "Rubéole IgM",
    code: "RUBM",
    category: "Individuel",
    aliases: [
      "RUBÉOLE IGM",
      "ANTICORPS ANTI-RUBÉOLE IgM",
      "Rubéole IgM",
    ],
  },
  {
    canonicalName: "Rougeole IgG",
    code: "RMES",
    category: "Individuel",
    aliases: [
      "ROUGEOLE IGG",
      "ANTICORPS ANTI-ROUGEOLE IgG",
      "Rougeole IgG",
    ],
  },
  {
    canonicalName: "Rougeole IgM",
    code: "RMEM",
    category: "Individuel",
    aliases: [
      "ROUGEOLE IGM",
      "ANTICORPS ANTI-ROUGEOLE IgM",
      "Rougeole IgM",
    ],
  },
  {
    canonicalName: "Varicelle IgG",
    code: "VARG",
    category: "Individuel",
    aliases: [
      "VARICELLE IGG",
      "ANTICORPS ANTI-VARICELLE IgG",
      "Varicelle IgG",
    ],
  },
  {
    canonicalName: "Varicelle IgM",
    code: "VARM",
    category: "Individuel",
    aliases: [
      "VARICELLE IGM",
      "ANTICORPS ANTI-VARICELLE IgM",
      "Varicelle IgM",
    ],
  },
  {
    canonicalName: "Oreillons IgG",
    code: "MUMG",
    category: "Individuel",
    aliases: [
      "OREILLONS IGG",
      "ANTICORPS ANTI-OREILLONS IgG",
      "Oreillons IgG",
    ],
  },
  {
    canonicalName: "Oreillons IgM",
    code: "MUMM",
    category: "Individuel",
    aliases: [
      "OREILLONS IGM",
      "ANTICORPS ANTI-OREILLONS IgM",
      "Oreillons IgM",
    ],
  },
  {
    canonicalName: "Toxoplasmose IgG",
    code: "TOXG",
    category: "Individuel",
    aliases: [
      "TOXOPLASMOSE IGG",
      "Toxoplasmose IgG",
    ],
  },
  {
    canonicalName: "Toxoplasmose IgM",
    code: "TOXM",
    category: "Individuel",
    aliases: [
      "TOXOPLASMOSE IGM",
      "Toxoplasmose IgM",
    ],
  },
  {
    canonicalName: "Rage Anticorps",
    code: "RABIES",
    category: "Individuel",
    aliases: [
      "RAGE, ANTICORPS",
      "ANTICORPS ANTI-RABIQUES (RAGE)",
      "Rage Anticorps",
    ],
  },
  {
    canonicalName: "Sédimentation (Vitesse de)",
    code: "SEDI",
    category: "Individuel",
    aliases: [
      "SÉDIMENTATION, VITESSE DE",
      "VITESSE DE SÉDIMENTATION",
      "Sédimentation (Vitesse de)",
      "Sédimentation (Vitesse)",
    ],
  },
  {
    canonicalName: "Réticulocytes",
    code: "RTIC",
    category: "Individuel",
    aliases: [
      "RÉTICULOCYTES",
      "Réticulocytes",
    ],
  },
  {
    canonicalName: "Antithrombine III",
    code: "AT3A",
    category: "Individuel",
    aliases: [
      "ANTITHROMBINE III, ANTIGÈNE",
      "ANTITHROMBINE III (ACTIVITÉ)",
      "Antithrombine III",
    ],
  },
  {
    canonicalName: "D-Dimère",
    code: "DDIM",
    category: "Individuel",
    aliases: [
      "D-DIMÈRE",
      "D-Dimère",
    ],
  },
  {
    canonicalName: "T3 Libre",
    code: "FT3",
    category: "Individuel",
    aliases: [
      "T3 LIBRE",
      "T3 Libre",
    ],
  },
  {
    canonicalName: "T4 Libre",
    code: "FT4",
    category: "Individuel",
    aliases: [
      "T4 LIBRE",
      "T4 Libre",
    ],
  },
  {
    canonicalName: "Thyroglobuline",
    code: "THYG",
    category: "Individuel",
    aliases: [
      "THYROGLOBULINE",
      "Thyroglobuline",
    ],
  },
  {
    canonicalName: "Androsténédione",
    code: "ANDR",
    category: "Individuel",
    aliases: [
      "ANDROSTÉNÉDIONE",
      "ANDROSTENE-DIONE",
      "Androsténédione",
      "Androstènedione",
    ],
  },
  {
    canonicalName: "Testostérone Biodisponible",
    code: "TESBC",
    category: "Individuel",
    aliases: [
      "TESTOSTÉRONE Biodisponible",
      "Testostérone Biodisponible",
    ],
  },
  {
    canonicalName: "Testostérone Libre",
    code: "TESFC",
    category: "Individuel",
    aliases: [
      "TESTOSTÉRONE Libre",
      "Testostérone Libre",
    ],
  },
  {
    canonicalName: "Arsenic (Sang)",
    code: "BARS",
    category: "Individuel",
    aliases: [
      "ARSENIC, SANG ENTIER",
      "ARSENIC SANG ENTIER",
      "Arsenic",
      "Arsenic (Sang Total)",
      "Arsenic (Sang)",
    ],
  },
  {
    canonicalName: "Cadmium (Sang)",
    code: "CD",
    category: "Individuel",
    aliases: [
      "CADMIUM, SANG ENTIER",
      "CADMIUM SANG ENTIER",
      "Cadmium",
      "Cadmium (Sang)",
    ],
  },
  {
    canonicalName: "Plomb (Sang)",
    code: "PB",
    category: "Individuel",
    aliases: [
      "PLOMB, SANG ENTIER",
      "Plomb (Sang)",
    ],
  },
  {
    canonicalName: "Zinc",
    code: "ZN",
    category: "Individuel",
    aliases: [
      "ZINC, PLASMA",
      "Zinc (Plasma)",
      "Zinc (Sang Total)",
      "Zinc",
    ],
  },
  {
    canonicalName: "Acide Valproïque",
    code: "VALP",
    category: "Individuel",
    aliases: [
      "ACIDE VALPROÏQUE",
      "ACIDE VALPROÏQUE (DEPAKENE)",
      "Acide Valproïque (Depakene/Epival)",
      "Acide Valproïque (Depakene)",
      "Acide Valproïque",
    ],
  },
  {
    canonicalName: "Alpha-1 Antitrypsine",
    code: "A1AT",
    category: "Individuel",
    aliases: [
      "ALPHA 1 ANTITRYPSINE",
      "Alpha-1 Antitrypsine",
    ],
  },
  {
    canonicalName: "Béta-2 Microglobuline",
    code: "B2MG",
    category: "Individuel",
    aliases: [
      "BÉTA-2 MICROGLOBULINE",
      "BETA-2-MICROGLOBULINE",
      "Bêta-2 Microglobuline",
      "Beta-2 Microglobuline",
      "Béta-2 Microglobuline",
    ],
  },
  {
    canonicalName: "Béta-HCG Quantitative",
    code: "BHCG",
    category: "Individuel",
    aliases: [
      "BÉTA-HCG INTACTE (QUANTITATIF)",
      "Bêta-HCG Quantitative (Grossesse)",
      "Beta-HCG Quantitative",
      "Béta-HCG Quantitative",
    ],
  },
  {
    canonicalName: "Calcium Ionisé",
    code: "CAIP",
    category: "Individuel",
    aliases: [
      "CALCIUM IONISÉ",
      "Calcium Ionisé",
    ],
  },
  {
    canonicalName: "Calcitonine",
    code: "CLTN",
    category: "Individuel",
    aliases: [
      "CALCITONINE",
      "Calcitonine",
    ],
  },
  {
    canonicalName: "Carbamazépine",
    code: "CARM",
    category: "Individuel",
    aliases: [
      "CARBAMAZÉPINE",
      "CARBAMAZEPINE (TEGRETOL)",
      "Carbamazépine (Tegretol)",
      "Carbamazépine",
    ],
  },
  {
    canonicalName: "Céruloplasmine",
    code: "CUBP",
    category: "Individuel",
    aliases: [
      "CÉRULOPLASMINE",
      "Céruloplasmine",
    ],
  },
  {
    canonicalName: "Transferrine",
    code: "TRFN",
    category: "Individuel",
    aliases: [
      "TRANSFERRINE",
      "Transferrine",
    ],
  },
  {
    canonicalName: "Cocaïne (Dépistage)",
    code: "COKE",
    category: "Individuel",
    aliases: [
      "COCAÏNE",
      "DROGUE: COCAINE",
      "Cocaïne (Dépistage)",
    ],
  },
  {
    canonicalName: "Clostridium Difficile",
    code: "CDIF",
    category: "Individuel",
    aliases: [
      "CLOSTRIDIUM DIFFICILE, GÈNE DE LA TOXINE",
      "CLOSTRIDIUM DIFFICILE",
      "Clostridium Difficile",
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
    canonicalName: "Homocystéine",
    code: "HCYS",
    category: "Individuel",
    aliases: [
      "HOMOCYSTÉINE",
      "Homocystéine",
    ],
  },
  {
    canonicalName: "Glucose (À Jeun)",
    code: "ACGL",
    category: "Individuel",
    aliases: [
      "GLUCOSE AC",
      "Glucose (À Jeun/AC)",
      "Glucose (À Jeun)",
    ],
  },
  {
    canonicalName: "Glucose (Aléatoire)",
    code: "GLU",
    category: "Individuel",
    aliases: [
      "GLUCOSE, ALÉATOIRE",
      "GLUCOSE AU HASARD",
      "Glucose (Aléatoire)",
    ],
  },
  {
    canonicalName: "DHEA-S",
    code: "DH-S",
    category: "Individuel",
    aliases: [
      "DHEA-S",
      "DHEAS",
      "DHEA-Sulfate",
    ],
  },
  {
    canonicalName: "Digoxin",
    code: "DIGX",
    category: "Individuel",
    aliases: [
      "DIGOXIN",
      "Digoxin (Lanoxin)",
      "Digoxine",
      "Digoxin",
    ],
  },
  {
    canonicalName: "Lipase",
    code: "LASE",
    category: "Individuel",
    aliases: [
      "LIPASE",
      "Lipase",
    ],
  },
  {
    canonicalName: "Lithium",
    code: "LITH",
    category: "Individuel",
    aliases: [
      "LITHIUM",
      "Lithium",
    ],
  },
  {
    canonicalName: "Groupe Sanguin & Rh",
    code: "BLDT",
    category: "Individuel",
    aliases: [
      "GROUPE SANGUIN & RH",
      "Groupe Sanguin & Rh",
    ],
  },
  {
    canonicalName: "Osmolalite (Serum)",
    code: "OSMS",
    category: "Individuel",
    aliases: [
      "OSMOLALITÉ, SÉRUM",
      "Osmolalité (Sérum)",
      "Osmolalite (Serum)",
    ],
  },
  {
    canonicalName: "Syphilis",
    code: "SYPEIA",
    category: "Individuel",
    aliases: [
      "SYPHILIS (EIA)",
      "Syphilis (VDRL/RPR)",
      "Syphilis (Dépistage)",
      "Syphilis",
    ],
  },
  {
    canonicalName: "Chaînes Légères Libres",
    code: "FKLP",
    category: "Individuel",
    aliases: [
      "CHAÎNES LÉGÈRES KAPPA ET LAMBDA LIBRE",
      "CHAÎNES LÉGÈRES LIBRES",
      "Chaînes Légères Libres",
    ],
  },
  {
    canonicalName: "Urine (Culture)",
    code: "CULU",
    category: "Individuel",
    aliases: [
      "URINE, CULTURE",
      "CULTURE: URINE",
      "Urine (Culture)",
    ],
  },
  {
    canonicalName: "Urine (Analyse)",
    code: "URC",
    category: "Individuel",
    aliases: [
      "URINE, ANALYSE",
      "ANALYSE D'URINE",
      "Urine (Analyse)",
    ],
  },
  {
    canonicalName: "Cannabis (Dépistage)",
    code: "CN20",
    category: "Individuel",
    aliases: [
      "CANNABIS (20 ng/mL, 50 ng/mL)",
      "DROGUE: CANNABINOIDES",
      "Cannabis (Dépistage)",
    ],
  },
  {
    canonicalName: "Éthanol",
    code: "SETH",
    category: "Individuel",
    aliases: [
      "ÉTHANOL, SÉRUM",
      "ALCOOL (ETHANOL) - SANG",
      "Éthanol (Sérum)",
      "Alcool (Ethanol) - Sang",
      "Éthanol",
    ],
  },
  {
    canonicalName: "Haptoglobine",
    code: "HPGN",
    category: "Individuel",
    aliases: [
      "HAPTOGLOBINE",
      "Haptoglobine",
    ],
  },
  {
    canonicalName: "PTT (TCA)",
    code: "PTT",
    category: "Individuel",
    aliases: [
      "PTT (TCA)",
      "INR + PTT",
    ],
  },
  {
    canonicalName: "Érythropoiétine",
    code: "ERYT",
    category: "Individuel",
    aliases: [
      "ÉRYTHROPOIETINE",
      "Érythropoiétine",
    ],
  },
  {
    canonicalName: "C-Peptide",
    code: "CPEP",
    category: "Individuel",
    aliases: [
      "C-PEPTIDE",
      "C-Peptide",
    ],
  },
  {
    canonicalName: "Gastrine",
    code: "GAST",
    category: "Individuel",
    aliases: [
      "GASTRINE",
      "Gastrine",
    ],
  },
  {
    canonicalName: "Électrophorèse de l'Hémoglobine",
    code: "HBEL",
    category: "Individuel",
    aliases: [
      "ÉLECTROPHORÈSE DE L'HÉMOGLOBINE",
      "Électrophorèse de l'Hémoglobine",
    ],
  },
  {
    canonicalName: "Chlamydia/Gonorrhée (TAAN) Urine",
    code: "CMPCU",
    category: "Individuel",
    aliases: [
      "CHLAMYDIA URINE",
      "CHLAMYDIA/GONORRHOEAE/TRICHOMONAS (TAAN) - URINE",
      "Chlamydia (Urine)",
      "Chlamydia/Gonorrhée (TAAN) Urine",
    ],
  },
  {
    canonicalName: "Bordetella Pertussis",
    code: "BORP",
    category: "Individuel",
    aliases: [
      "BORDETELLA PERTUSSIS ET PARAPERTUSSIS",
      "Bordetella Pertussis (Coqueluche)",
      "Bordetella Pertussis",
    ],
  },
  {
    canonicalName: "Calprotectine",
    code: "CLPTN",
    category: "Individuel",
    aliases: [
      "CALPROTECTINE",
      "Calprotectine",
    ],
  },
  {
    canonicalName: "Phosphore",
    code: "PO4",
    category: "Individuel",
    aliases: [
      "PHOSPHATE",
      "PHOSPHORE",
      "Phosphore (Phosphate)",
      "Phosphore",
    ],
  },
  {
    canonicalName: "Dihydrotestostérone",
    code: "DHT",
    category: "Individuel",
    aliases: [
      "DIHYDROTESTOSTÉRONE",
      "Dihydrotestostérone",
    ],
  },
  {
    canonicalName: "Cytomégalovirus IgM",
    code: "CMVM",
    category: "Individuel",
    aliases: [
      "CYTOMÉGALOVIRUS IGM",
      "Cytomégalovirus IgM",
    ],
  },
  {
    canonicalName: "Cholestérol HDL",
    code: "HDL",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL HDL",
      "Cholestérol HDL",
    ],
  },
  {
    canonicalName: "Cholestérol LDL",
    code: "LDLD",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL LDL",
      "Cholestérol LDL",
    ],
  },
  {
    canonicalName: "Triglycérides",
    code: "TRIG",
    category: "Individuel",
    aliases: [
      "TRIGLYCÉRIDES",
      "Triglycérides",
    ],
  },
  {
    canonicalName: "Potassium",
    code: "K",
    category: "Individuel",
    aliases: [
      "POTASSIUM",
      "Potassium",
    ],
  },
  {
    canonicalName: "Cholestérol Non HDL",
    code: "NHDL",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL NON HDL",
      "Cholestérol Non HDL",
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
    canonicalName: "Béta-HCG Qualitatif",
    code: "PREG",
    category: "Individuel",
    aliases: [
      "BÉTA-HCG QUALITATIF, SÉRUM",
      "Bêta-HCG Qualitative",
      "Béta-HCG Qualitatif",
    ],
  },
  {
    canonicalName: "Immunoglobuline A (IgA)",
    code: "IGA",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGA",
      "Immunoglobuline A (IgA)",
    ],
  },
  {
    canonicalName: "Immunoglobuline G (IgG)",
    code: "IGG",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGG",
      "Immunoglobuline G (IgG)",
    ],
  },
  {
    canonicalName: "Immunoglobuline M (IgM)",
    code: "IGM",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGM",
      "Immunoglobuline M (IgM)",
    ],
  },
  {
    canonicalName: "Immunoglobuline E (IgE)",
    code: "IGE",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE IGE",
      "Immunoglobuline E (IgE)",
    ],
  },
  {
    canonicalName: "Lactate Déshydrogénase (LDH)",
    code: "LD",
    category: "Individuel",
    aliases: [
      "LACTATE DÉHYDROGÉNASE (LDH)",
      "Lactate Déshydrogénase (LDH)",
    ],
  },
  {
    canonicalName: "Biopsie",
    code: "BIOP",
    category: "Individuel",
    aliases: [
      "BIOPSIE",
      "Biopsie",
    ],
  },
  {
    canonicalName: "Parathormone (PTH)",
    code: "PTH",
    category: "Individuel",
    aliases: [
      "HORMONE PARATHYR OÏDIENNE",
      "Parathormone (PTH)",
    ],
  },
  {
    canonicalName: "BETA 2 GLYCOPROTÉINE I ANTICORPS",
    code: "B2GP",
    category: "Profil",
    aliases: [
      "BETA 2 GLYCOPROTÉINE I ANTICORPS",
      "ANTICORPS ANTI-BETA 2-GLYCOPROTÉINE I (IgG/IgM/IgA)",
    ],
  },
  {
    canonicalName: "DIABÉTIQUE #1",
    code: "DIAB",
    category: "Profil",
    aliases: [
      "DIABÉTIQUE #1",
      "Profil DIABÉTIQUE No 1",
    ],
  },
  {
    canonicalName: "COAGULOGRAMME",
    code: "COAG",
    category: "Profil",
    aliases: [
      "COAGULOGRAMME",
      "Profil COAGULOGRAMME",
    ],
  },
  {
    canonicalName: "Acide Urique",
    code: "URIC",
    category: "Individuel",
    aliases: [
      "ACIDE URIQUE",
      "Acide Urique",
    ],
  },
  {
    canonicalName: "Albumine",
    code: "ALB",
    category: "Individuel",
    aliases: [
      "ALBUMINE",
      "Albumine",
    ],
  },
  {
    canonicalName: "Alpha-Foetoprotéine",
    code: "AFP",
    category: "Individuel",
    aliases: [
      "ALPHAFÉTOPROTÉINE",
      "ALPHA-FŒTOPROTÉINE (AFP)",
      "Alpha-Foetoprotéine",
      "Alpha-Foetoprotéine (AFP)",
    ],
  },
  {
    canonicalName: "ALT (SGPT)",
    code: "ALT",
    category: "Individuel",
    aliases: [
      "ALT",
      "ALT (SGPT)",
    ],
  },
  {
    canonicalName: "Amphétamine (Dépistage)",
    code: "AMPH",
    category: "Individuel",
    aliases: [
      "AMPHETAMINE",
      "DROGUE: AMPHETAMINES",
      "Amphétamine (Dépistage)",
    ],
  },
  {
    canonicalName: "Amylase",
    code: "AMYL",
    category: "Individuel",
    aliases: [
      "AMYLASE",
      "Amylase",
    ],
  },
  {
    canonicalName: "ANTI-ADNdb",
    code: "DNA",
    category: "Individuel",
    aliases: [
      "ANTI-ADNdb",
      "ANTICORPS ANTI-ADN (Double brin)",
      "Anticorps Anti-ADN (Double Brin)",
    ],
  },
  {
    canonicalName: "Anti-Nucléaire Anticorps (ANA)",
    code: "ANA",
    category: "Individuel",
    aliases: [
      "ANTI-NUCLÉAIRE, ANTICORPS",
      "ANTICORPS ANTINUCLÉAIRES (ANA)",
      "Anti-Nucléaire Anticorps (ANA)",
      "Anticorps Antinucléaires (ANA)",
    ],
  },
  {
    canonicalName: "Anti-Nucléaires Extractables (ENA)",
    code: "ENA",
    category: "Individuel",
    aliases: [
      "ANTI-NUCLÉAIRES EXTRACTABLES (DÉPISTAGE)",
      "ANTICORPS ANTI-ENA",
      "Anti-Nucléaires Extractables (ENA)",
    ],
  },
  {
    canonicalName: "Apolipoprotéine A-1",
    code: "APOA",
    category: "Individuel",
    aliases: [
      "APOLIPOPROTÉINE A-1",
      "APOLIPOPROTÉINE A1",
      "Apolipoprotéine A-1",
    ],
  },
  {
    canonicalName: "Apolipoprotéine B",
    code: "APOB",
    category: "Individuel",
    aliases: [
      "APOLIPOPROTÉINE B",
      "Apolipoprotéine B",
    ],
  },
  {
    canonicalName: "AST (SGOT)",
    code: "AST",
    category: "Individuel",
    aliases: [
      "AST (GOT, SGOT)",
      "AST",
      "AST (SGOT)",
    ],
  },
  {
    canonicalName: "Calcium",
    code: "CA",
    category: "Individuel",
    aliases: [
      "CALCIUM",
      "Calcium",
    ],
  },
  {
    canonicalName: "Carcino-Embryonic Antigen (CEA)",
    code: "CEA",
    category: "Individuel",
    aliases: [
      "CARCINO-EMBRYONIQUE ANTIGÈNE (CEA)",
      "ANTIGÈNE CARCINO-EMBRYONNAIRE (ACE)",
      "Carcino-Embryonic Antigen (CEA)",
    ],
  },
  {
    canonicalName: "Chlorure",
    code: "CL",
    category: "Individuel",
    aliases: [
      "CHLORURE",
      "CHLORURES",
      "Chlorure",
    ],
  },
  {
    canonicalName: "Cholestérol Total",
    code: "CHOL",
    category: "Individuel",
    aliases: [
      "CHOLESTÉROL, TOTAL",
      "CHOLESTÉROL TOTAL",
      "Cholestérol Total",
    ],
  },
  {
    canonicalName: "CK-MB",
    code: "CKMB",
    category: "Individuel",
    aliases: [
      "CK-MB",
    ],
  },
  {
    canonicalName: "COMPLÉMENT C3",
    code: "C3",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT C3",
      "Complément C3",
    ],
  },
  {
    canonicalName: "COMPLÉMENT C4",
    code: "C4",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT C4",
      "Complément C4",
    ],
  },
  {
    canonicalName: "COMPLÉMENT HÉMOLYTIQUE",
    code: "CH50",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT HÉMOLYTIQUE",
      "CH50, COMPLÉMENT TOTAL",
    ],
  },
  {
    canonicalName: "Créatine Kinase (CK)",
    code: "CK",
    category: "Individuel",
    aliases: [
      "CRÉATINE KINASE",
      "CK (CRÉATINE KINASE)",
      "Créatine Kinase (CK)",
    ],
  },
  {
    canonicalName: "Créatinine",
    code: "CREA",
    category: "Individuel",
    aliases: [
      "CRÉATININE, SÉRUM",
      "CRÉATININE",
      "Créatinine",
    ],
  },
  {
    canonicalName: "ÉLECTROCARDIOGRAMME AU REPOS (ECG)",
    code: "ECG",
    category: "Individuel",
    aliases: [
      "ÉLECTROCARDIOGRAMME AU REPOS (ECG)",
      "ÉLECTROCARDIOGRAMME",
    ],
  },
  {
    canonicalName: "Formule Sanguine Complète (FSC)",
    code: "CBC",
    category: "Individuel",
    aliases: [
      "FORMULE SANGUINE COMPLÈTE (FSC)",
      "FORMULE SANGUINE COMPLETE (FSC)",
      "Formule Sanguine Complète (FSC)",
    ],
  },
  {
    canonicalName: "Fer Total",
    code: "FE",
    category: "Individuel",
    aliases: [
      "FER, TOTAL",
      "FER",
      "Fer Total",
      "Fer",
    ],
  },
  {
    canonicalName: "FSH (Hormone Folliculo-stimulante)",
    code: "FSH",
    category: "Individuel",
    aliases: [
      "FSH",
      "FSH (Hormone Folliculo-stimulante)",
    ],
  },
  {
    canonicalName: "Hépatite C (Anticorps)",
    code: "HEPC",
    category: "Individuel",
    aliases: [
      "HÉPATITE ANTICORPS",
      "ANTICORPS ANTI-HEPATITE C",
      "Hépatite C (Anticorps)",
    ],
  },
  {
    canonicalName: "TSH",
    code: "TSH",
    category: "Individuel",
    aliases: [
      "HORMONE DE STIMULATION THYROIDIENNE",
      "TSH ULTRASENSIBLE",
      "TSH",
    ],
  },
  {
    canonicalName: "LH (Hormone Lutéinisante)",
    code: "LH",
    category: "Individuel",
    aliases: [
      "LH",
      "LH (Hormone Lutéinisante)",
    ],
  },
  {
    canonicalName: "Magnésium",
    code: "MG",
    category: "Individuel",
    aliases: [
      "MAGNÉSIUM, SÉRUM",
      "MAGNÉSIUM",
      "Magnésium",
    ],
  },
  {
    canonicalName: "Monotest (Mononucléose)",
    code: "MONO",
    category: "Individuel",
    aliases: [
      "MONOTEST",
      "MONONUCLÉOSE",
      "Monotest (Mononucléose)",
      "Mononucléose (Monotest)",
    ],
  },
  {
    canonicalName: "Progestérone",
    code: "PROG",
    category: "Individuel",
    aliases: [
      "PROGESTÉRONE",
      "Progestérone",
    ],
  },
  {
    canonicalName: "Protéine C-Réactive (CRP)",
    code: "CRP",
    category: "Individuel",
    aliases: [
      "PROTÉINE C-RÉACTIVE (CRP)",
      "PROTÉINE C-RÉACTIVE",
      "Protéine C-Réactive (CRP)",
    ],
  },
  {
    canonicalName: "CRP Haute Sensibilité (Cardio)",
    code: "CRPHS",
    category: "Individuel",
    aliases: [
      "PROTÉINE C-RÉACTIVE HAUTE SENSIBILITÉ (CRPHS)",
      "PROTÉINE C-RÉACTIVE HAUTE SENSIBILITÉ",
      "CRP Haute Sensibilité (Cardio)",
      "CRP Haute Sensibilité",
    ],
  },
  {
    canonicalName: "PSA (APS) Total",
    code: "PSA",
    category: "Individuel",
    aliases: [
      "PROSTATE, ANTIGÈNE PROSTATIQUE SPÉCIFIQUE TOTAL",
      "ANTIGÈNE PROSTATIQUE SPÉCIFIQUE (APS)",
      "PSA (APS) Total",
      "PSA Total",
    ],
  },
  {
    canonicalName: "PSA (APS) Libre",
    code: "FPSA",
    category: "Individuel",
    aliases: [
      "PROSTATE, ANTIGÈNE PROSTATIQUE SPÉCIFIQUE LIBRE",
      "APS LIBRE",
      "PSA (APS) Libre",
      "PSA Libre (avec Total)",
    ],
  },
  {
    canonicalName: "INR / PT",
    code: "PT",
    category: "Individuel",
    aliases: [
      "PT INR (TEMPS DE QUICK)",
      "RAPPORT INTERNATIONAL NORMALISÉ (INR)",
      "INR / PT",
      "INR (Rapport International Normalisé)",
    ],
  },
  {
    canonicalName: "Sodium",
    code: "NA",
    category: "Individuel",
    aliases: [
      "SODIUM",
      "Sodium",
    ],
  },
  {
    canonicalName: "Testostérone Totale",
    code: "TEST",
    category: "Individuel",
    aliases: [
      "TESTOSTÉRONE Total",
      "TESTOSTÉRONE TOTALE",
      "Testostérone Totale",
    ],
  },
  {
    canonicalName: "TRANSFERRINE CARBOXY DÉFICIENTE",
    code: "CDT",
    category: "Individuel",
    aliases: [
      "TRANSFERRINE CARBOXY DÉFICIENTE",
      "% CDT",
    ],
  },
  {
    canonicalName: "Urée",
    code: "UREA",
    category: "Individuel",
    aliases: [
      "URÉE",
      "Urée",
    ],
  },
  {
    canonicalName: "ANALYSE ET CULTURE D'URINE",
    code: "URC+",
    category: "Profil",
    aliases: [
      "ANALYSE ET CULTURE D'URINE",
    ],
  },
  {
    canonicalName: "VITAMINE B12 ET ACIDE FOLIQUE",
    code: "FA12",
    category: "Profil",
    aliases: [
      "VITAMINE B12 ET ACIDE FOLIQUE",
    ],
  },
  {
    canonicalName: "FER #2",
    code: "IRN2",
    category: "Profil",
    aliases: [
      "FER #2",
    ],
  },
  {
    canonicalName: "Profil FER",
    code: "IRON",
    category: "Profil",
    aliases: [
      "FER",
    ],
  },
  {
    canonicalName: "FER #6",
    code: "IRN6",
    category: "Profil",
    aliases: [
      "FER #6",
    ],
  },
  {
    canonicalName: "FER #1",
    code: "IRN1",
    category: "Profil",
    aliases: [
      "FER #1",
    ],
  },
  {
    canonicalName: "ANÉMIE #1",
    code: "ANE1",
    category: "Profil",
    aliases: [
      "ANÉMIE #1",
    ],
  },
  {
    canonicalName: "ANÉMIE #4",
    code: "ANE4",
    category: "Profil",
    aliases: [
      "ANÉMIE #4",
    ],
  },
  {
    canonicalName: "ANÉMIE #3",
    code: "ANE3",
    category: "Profil",
    aliases: [
      "ANÉMIE #3",
    ],
  },
  {
    canonicalName: "FER #3",
    code: "IRN3",
    category: "Profil",
    aliases: [
      "FER #3",
    ],
  },
  {
    canonicalName: "HÉPATIQUE #1",
    code: "LIV1",
    category: "Profil",
    aliases: [
      "HÉPATIQUE #1",
    ],
  },
  {
    canonicalName: "PANCRÉATIQUE",
    code: "PANC",
    category: "Profil",
    aliases: [
      "PANCRÉATIQUE",
    ],
  },
  {
    canonicalName: "RÉNAL #2",
    code: "REN2",
    category: "Profil",
    aliases: [
      "RÉNAL #2",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #1A",
    code: "BIO1",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #1A",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #1B",
    code: "CHM1",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #1B",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #2",
    code: "CHM2",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #2",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #2 AVEC ELECTROLYTES",
    code: "CHM5",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #2 AVEC ELECTROLYTES",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #3 AVEC ELECTROLYTES",
    code: "CHL3",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #3 AVEC ELECTROLYTES",
    ],
  },
  {
    canonicalName: "GENERAL BIOCHEMISTRY #3",
    code: "CHP3",
    category: "Profil",
    aliases: [
      "GENERAL BIOCHEMISTRY #3",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #3",
    code: "BIO3",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #3",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #4",
    code: "CHM4",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #4",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #4 AVEC ÉLECTROLYTES",
    code: "CHL4",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #4 AVEC ÉLECTROLYTES",
    ],
  },
  {
    canonicalName: "BIOCHIMIE #4 COMPLET",
    code: "BIO4",
    category: "Profil",
    aliases: [
      "BIOCHIMIE #4 COMPLET",
    ],
  },
  {
    canonicalName: "COMPLETE BIOCHEMISTRY, WITHOUT URINE",
    code: "CH4U",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY, WITHOUT URINE",
    ],
  },
  {
    canonicalName: "COMPLETE BIOCHEMISTRY",
    code: "CHP4",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY",
    ],
  },
  {
    canonicalName: "COMPLETE BIOCHEMISTRY GENERAL & TSH",
    code: "CHP4T",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY GENERAL & TSH",
    ],
  },
  {
    canonicalName: "COMPLETE BIOCHEMISTRY + TSH & PSA",
    code: "CHP4A",
    category: "Profil",
    aliases: [
      "COMPLETE BIOCHEMISTRY + TSH & PSA",
    ],
  },
  {
    canonicalName: "PT ET PTT",
    code: "PTPT",
    category: "Profil",
    aliases: [
      "PT ET PTT",
    ],
  },
  {
    canonicalName: "TEST PAP THIN PREP + HPV DNA",
    code: "PAPTHPV",
    category: "Profil",
    aliases: [
      "TEST PAP THIN PREP + HPV DNA",
    ],
  },
  {
    canonicalName: "VPH DNA, TEST PAP THINPREP EN CASCADE",
    code: "PVTP",
    category: "Profil",
    aliases: [
      "VPH DNA, TEST PAP THINPREP EN CASCADE",
    ],
  },
  {
    canonicalName: "TEST PAP THIN PREP, VPH DNA EN CASCADE",
    code: "TPPV",
    category: "Profil",
    aliases: [
      "TEST PAP THIN PREP, VPH DNA EN CASCADE",
    ],
  },
  {
    canonicalName: "PRÉNATAL #1",
    code: "PREN",
    category: "Profil",
    aliases: [
      "PRÉNATAL #1",
    ],
  },
  {
    canonicalName: "PRÉNATAL, GLUCOSE AC",
    code: "PRENG",
    category: "Profil",
    aliases: [
      "PRÉNATAL, GLUCOSE AC",
    ],
  },
  {
    canonicalName: "PRÉNATAL #3",
    code: "DAL2",
    category: "Profil",
    aliases: [
      "PRÉNATAL #3",
    ],
  },
  {
    canonicalName: "PRÉNATAL #3, GLUCOSE",
    code: "DAL2G",
    category: "Profil",
    aliases: [
      "PRÉNATAL #3, GLUCOSE",
    ],
  },
  {
    canonicalName: "PANORAMA®",
    code: "PANO",
    category: "Profil",
    aliases: [
      "PANORAMA®",
    ],
  },
  {
    canonicalName: "PANORAMA® ET MICRODÉLÉTIONS",
    code: "PANOE",
    category: "Profil",
    aliases: [
      "PANORAMA® ET MICRODÉLÉTIONS",
    ],
  },
  {
    canonicalName: "HARMONY®",
    code: "HARMP",
    category: "Profil",
    aliases: [
      "HARMONY®",
    ],
  },
  {
    canonicalName: "DROGUES DANS LES CHEVEUX",
    code: "DRUGH",
    category: "Profil",
    aliases: [
      "DROGUES DANS LES CHEVEUX",
    ],
  },
  {
    canonicalName: "DROGUES 4 TESTS #1",
    code: "DAU450",
    category: "Profil",
    aliases: [
      "DROGUES 4 TESTS #1",
    ],
  },
  {
    canonicalName: "DROGUES 5 TESTS #1",
    code: "DAUP",
    category: "Profil",
    aliases: [
      "DROGUES 5 TESTS #1",
    ],
  },
  {
    canonicalName: "DROGUES 5 TESTS #2",
    code: "DAUB50",
    category: "Profil",
    aliases: [
      "DROGUES 5 TESTS #2",
    ],
  },
  {
    canonicalName: "ÉCHOGRAPHIE ENDOVAGINALE ET PELVIENNE",
    code: "ENDPE",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE ENDOVAGINALE ET PELVIENNE",
    ],
  },
  {
    canonicalName: "ÉCHOGRAPHIE ENDOVAGINALE",
    code: "ENDV",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE ENDOVAGINALE",
    ],
  },
  {
    canonicalName: "ÉCHOGRAPHIE OBSTÉTRICALE, 1er Trimestre",
    code: "1TRI",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE OBSTÉTRICALE, 1er Trimestre",
    ],
  },
  {
    canonicalName: "ÉCHOGRAPHIE OBSTÉTRICALE, 2ème Trimestre",
    code: "2TRI",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE OBSTÉTRICALE, 2ème Trimestre",
    ],
  },
  {
    canonicalName: "ÉCHOGRAPHIE OBSTÉTRICALE, 3ème Trimestre",
    code: "3TRI",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE OBSTÉTRICALE, 3ème Trimestre",
    ],
  },
  {
    canonicalName: "ÉCHOGRAPHIE DE VIABILITÉ-DATATION",
    code: "VIAB",
    category: "Profil",
    aliases: [
      "ÉCHOGRAPHIE DE VIABILITÉ-DATATION",
    ],
  },
  {
    canonicalName: "FERTILITÉ #1",
    code: "FERT",
    category: "Profil",
    aliases: [
      "FERTILITÉ #1",
    ],
  },
  {
    canonicalName: "MÉNOPAUSE #1",
    code: "MEN1",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #1",
    ],
  },
  {
    canonicalName: "MÉNOPAUSE #3",
    code: "MEN3",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #3",
    ],
  },
  {
    canonicalName: "MÉNOPAUSE #2",
    code: "MEN2",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #2",
    ],
  },
  {
    canonicalName: "MÉNOPAUSE #4",
    code: "MEN4",
    category: "Profil",
    aliases: [
      "MÉNOPAUSE #4",
    ],
  },
  {
    canonicalName: "THYROÏDE #1, CASCADE",
    code: "THY1R",
    category: "Profil",
    aliases: [
      "THYROÏDE #1, CASCADE",
    ],
  },
  {
    canonicalName: "THYROÏDE #3, CASCADE",
    code: "THY3R",
    category: "Profil",
    aliases: [
      "THYROÏDE #3, CASCADE",
    ],
  },
  {
    canonicalName: "THYROÏDE #1",
    code: "THY1",
    category: "Profil",
    aliases: [
      "THYROÏDE #1",
    ],
  },
  {
    canonicalName: "THYROÏDE #3",
    code: "THY3",
    category: "Profil",
    aliases: [
      "THYROÏDE #3",
    ],
  },
  {
    canonicalName: "THYROÏDE #4",
    code: "THY4",
    category: "Profil",
    aliases: [
      "THYROÏDE #4",
    ],
  },
  {
    canonicalName: "GÉNÉRAL #3, SANS URINE",
    code: "CH3U",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #3, SANS URINE",
    ],
  },
  {
    canonicalName: "GÉNÉRAL #1",
    code: "CHP1",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #1",
    ],
  },
  {
    canonicalName: "GÉNÉRAL #1, CRP",
    code: "FIN1",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #1, CRP",
    ],
  },
  {
    canonicalName: "GÉNÉRAL #2",
    code: "CHP2",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #2",
    ],
  },
  {
    canonicalName: "COMPLET, CRP ULTRASENSIBLE",
    code: "CH4SC",
    category: "Profil",
    aliases: [
      "COMPLET, CRP ULTRASENSIBLE",
    ],
  },
  {
    canonicalName: "GÉNÉRAL #5",
    code: "GN5",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #5",
    ],
  },
  {
    canonicalName: "GÉNÉRAL #6",
    code: "PNL6",
    category: "Profil",
    aliases: [
      "GÉNÉRAL #6",
    ],
  },
  {
    canonicalName: "FORMULE SANGUINE COMPLÈTE ET SÉDIMENTATION",
    code: "CBCS",
    category: "Profil",
    aliases: [
      "FORMULE SANGUINE COMPLÈTE ET SÉDIMENTATION",
    ],
  },
  {
    canonicalName: "MONOTEST #1",
    code: "MON+",
    category: "Profil",
    aliases: [
      "MONOTEST #1",
    ],
  },
  {
    canonicalName: "MALADIE COELIAQUE",
    code: "CELP",
    category: "Profil",
    aliases: [
      "MALADIE COELIAQUE",
    ],
  },
  {
    canonicalName: "RISQUE CARDIOVASCULAIRE #1",
    code: "CVRK",
    category: "Profil",
    aliases: [
      "RISQUE CARDIOVASCULAIRE #1",
    ],
  },
  {
    canonicalName: "RISQUE CARDIOVASCULAIRE #2 PLUS APOB",
    code: "CVK2",
    category: "Profil",
    aliases: [
      "RISQUE CARDIOVASCULAIRE #2 PLUS APOB",
    ],
  },
  {
    canonicalName: "CCL4",
    code: "CCL4",
    category: "Profil",
    aliases: [
      "CCL4",
    ],
  },
  {
    canonicalName: "CHLAMYDIA ET GONORRHÉE PAR PCR (1 échantillon)",
    code: "CGPCR1",
    category: "Profil",
    aliases: [
      "CHLAMYDIA ET GONORRHÉE PAR PCR (1 échantillon)",
    ],
  },
  {
    canonicalName: "CHLAMYDIA ET GONORRHÉE PAR PCR (2 échantillons)",
    code: "CGPCR2",
    category: "Profil",
    aliases: [
      "CHLAMYDIA ET GONORRHÉE PAR PCR (2 échantillons)",
    ],
  },
  {
    canonicalName: "CHLAMYDIA ET GONORRHÉE PAR PCR (3 échantillons)",
    code: "CGPCR3",
    category: "Profil",
    aliases: [
      "CHLAMYDIA ET GONORRHÉE PAR PCR (3 échantillons)",
    ],
  },
  {
    canonicalName: "HÉPATITE B AIGÜE",
    code: "HPBA",
    category: "Profil",
    aliases: [
      "HÉPATITE B AIGÜE",
    ],
  },
  {
    canonicalName: "MTS #2, FEMME",
    code: "STD2",
    category: "Profil",
    aliases: [
      "MTS #2, FEMME",
    ],
  },
  {
    canonicalName: "MTS #1, VIH - HOMME",
    code: "STDMH",
    category: "Profil",
    aliases: [
      "MTS #1, VIH - HOMME",
    ],
  },
  {
    canonicalName: "5-HIAA (5-Hydroxyindoleacetic Acid)",
    code: "HIAA",
    category: "Individuel",
    aliases: [
      "5'HIAA",
      "5-HIAA (5-Hydroxyindoleacetic Acid)",
    ],
  },
  {
    canonicalName: "Acetylcholine, Anticorps Bloquants",
    code: "ACBA",
    category: "Individuel",
    aliases: [
      "ACETYLCHOLINE, ANTICORPS BLOQUANTS",
      "Acetylcholine, Anticorps Bloquants",
    ],
  },
  {
    canonicalName: "Acetylcholine, Anticorps Liant",
    code: "ACRA",
    category: "Individuel",
    aliases: [
      "ACETYLCHOLINE, ANTICORPS LIANT",
      "Acetylcholine, Anticorps Liant",
    ],
  },
  {
    canonicalName: "ACETYLCHOLINE, MODULATEURS D'ANTICORPS",
    code: "ACMA",
    category: "Individuel",
    aliases: [
      "ACETYLCHOLINE, MODULATEURS D'ANTICORPS",
    ],
  },
  {
    canonicalName: "Acide Méthylmalonique",
    code: "MMAS",
    category: "Individuel",
    aliases: [
      "ACIDE MÉTHYLMALONIQUE, SÉRUM",
      "Acide Méthylmalonique",
    ],
  },
  {
    canonicalName: "Acide Urique (Urine 24h)",
    code: "UA/U",
    category: "Individuel",
    aliases: [
      "ACIDE URIQUE, URINE 24 HEURES",
      "Acide Urique (Urine 24h)",
    ],
  },
  {
    canonicalName: "Adalimumab",
    code: "ADUL",
    category: "Individuel",
    aliases: [
      "ADALIMUMAB",
      "Adalimumab",
    ],
  },
  {
    canonicalName: "ALBUMINE / GLOBULINES RATIO",
    code: "AGR",
    category: "Individuel",
    aliases: [
      "ALBUMINE / GLOBULINES RATIO",
    ],
  },
  {
    canonicalName: "ALDOLASE",
    code: "ADLASE",
    category: "Individuel",
    aliases: [
      "ALDOLASE",
    ],
  },
  {
    canonicalName: "Aluminium",
    code: "AL",
    category: "Individuel",
    aliases: [
      "ALUMINIUM, SANG ENTIER",
      "Aluminium",
    ],
  },
  {
    canonicalName: "ANTI-CENP",
    code: "CENP",
    category: "Individuel",
    aliases: [
      "ANTI-CENP",
    ],
  },
  {
    canonicalName: "ANTICORPS SURRÉNALES",
    code: "ADNAB",
    category: "Individuel",
    aliases: [
      "ANTICORPS SURRÉNALES",
    ],
  },
  {
    canonicalName: "ANTI-DNASE B",
    code: "BDNA",
    category: "Individuel",
    aliases: [
      "ANTI-DNASE B",
    ],
  },
  {
    canonicalName: "ANTI-ENDOMYSIAUX, ANTICORPS (IgA)",
    code: "AEML",
    category: "Individuel",
    aliases: [
      "ANTI-ENDOMYSIAUX, ANTICORPS (IgA)",
    ],
  },
  {
    canonicalName: "ANTI-GAD AUTO-ANTICORPS",
    code: "GAD",
    category: "Individuel",
    aliases: [
      "ANTI-GAD AUTO-ANTICORPS",
    ],
  },
  {
    canonicalName: "ANTI-LKM, ANTICORPS",
    code: "ALKM",
    category: "Individuel",
    aliases: [
      "ANTI-LKM, ANTICORPS",
    ],
  },
  {
    canonicalName: "ANTIPHOSPHOLIPINE IGA",
    code: "PHOA",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGA",
    ],
  },
  {
    canonicalName: "ANTIPHOSPHOLIPINE IGG",
    code: "PHOG",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGG",
    ],
  },
  {
    canonicalName: "ANTIPHOSPHOLIPINE IGM",
    code: "PHOM",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGM",
    ],
  },
  {
    canonicalName: "ANTIPHOSPHOLIPINE IGM, IGG",
    code: "PHOS",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGM, IGG",
    ],
  },
  {
    canonicalName: "ANTIPHOSPHOLIPINE IGM, IGG, IGA",
    code: "PHOP",
    category: "Individuel",
    aliases: [
      "ANTIPHOSPHOLIPINE IGM, IGG, IGA",
    ],
  },
  {
    canonicalName: "ANTITHROMBINE III, FONCTIONNELLE",
    code: "AT3F",
    category: "Individuel",
    aliases: [
      "ANTITHROMBINE III, FONCTIONNELLE",
    ],
  },
  {
    canonicalName: "ANTI-TRANSGLUTAMINASE IGG",
    code: "GTTG",
    category: "Individuel",
    aliases: [
      "ANTI-TRANSGLUTAMINASE IGG",
    ],
  },
  {
    canonicalName: "Apolipoprotéine E (Genotyping)",
    code: "APOE",
    category: "Individuel",
    aliases: [
      "APOLIPOPROTÉINE E",
      "Apolipoprotéine E (Genotyping)",
    ],
  },
  {
    canonicalName: "Bacille de Koch (Tuberculose) Culture",
    code: "CTTBP",
    category: "Individuel",
    aliases: [
      "BACILLE DE KOCH, CULTURE",
      "Bacille de Koch (Tuberculose) Culture",
    ],
  },
  {
    canonicalName: "Barbituriques (Dépistage)",
    code: "UBAR",
    category: "Individuel",
    aliases: [
      "BARBITURIQUE (200 ng/ml)",
      "Barbituriques (Dépistage)",
    ],
  },
  {
    canonicalName: "Benzodiazépines (Dépistage)",
    code: "BENZ",
    category: "Individuel",
    aliases: [
      "BENZODIAZÉPINE (200 ng/ml)",
      "Benzodiazépines (Dépistage)",
    ],
  },
  {
    canonicalName: "BRCA 1/2 SEQUENÇAGE, DÉLÉTION ET DUPLICATION",
    code: "BRCA1/2",
    category: "Individuel",
    aliases: [
      "BRCA 1/2 SEQUENÇAGE, DÉLÉTION ET DUPLICATION",
    ],
  },
  {
    canonicalName: "C1 INHIBITEUR ESTÉRASE",
    code: "C1EI",
    category: "Individuel",
    aliases: [
      "C1 INHIBITEUR ESTÉRASE",
    ],
  },
  {
    canonicalName: "CALCIUM / CRÉATININE RATIO",
    code: "CACR",
    category: "Individuel",
    aliases: [
      "CALCIUM / CRÉATININE RATIO",
    ],
  },
  {
    canonicalName: "CALCIUM, URINE 24 HEURES",
    code: "CA/U",
    category: "Individuel",
    aliases: [
      "CALCIUM, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "CALCUL, ANALYSE DE",
    code: "CALU",
    category: "Individuel",
    aliases: [
      "CALCUL, ANALYSE DE",
    ],
  },
  {
    canonicalName: "Catécholamines (Urine)",
    code: "UCAT",
    category: "Individuel",
    aliases: [
      "CATÉCHOLAMINES URINAIRE, 24H",
      "Catécholamines (Urine)",
    ],
  },
  {
    canonicalName: "Catécholamines (Plasma)",
    code: "CATS",
    category: "Individuel",
    aliases: [
      "CATÉCHOLAMINES, PLASMA",
      "Catécholamines (Plasma)",
    ],
  },
  {
    canonicalName: "CD3, CD4, CD8",
    code: "CD3",
    category: "Individuel",
    aliases: [
      "CD3, CD4, CD8",
    ],
  },
  {
    canonicalName: "Chlamydia (PCR Cervical/Endocervical)",
    code: "CMPC",
    category: "Individuel",
    aliases: [
      "CHLAMYDIA PAR PCR",
      "Chlamydia (PCR Cervical/Endocervical)",
    ],
  },
  {
    canonicalName: "CHAÎNES LÉGÈRES KAPPA LIBRE",
    code: "KLCF",
    category: "Individuel",
    aliases: [
      "CHAÎNES LÉGÈRES KAPPA LIBRE",
    ],
  },
  {
    canonicalName: "CHLAMYDIA PAR PCR, RECTAL (INCLUANT LGV)",
    code: "CMPCR",
    category: "Individuel",
    aliases: [
      "CHLAMYDIA PAR PCR, RECTAL (INCLUANT LGV)",
    ],
  },
  {
    canonicalName: "CHAÎNES LÉGÈRES LAMBDA LIBRE",
    code: "LLCF",
    category: "Individuel",
    aliases: [
      "CHAÎNES LÉGÈRES LAMBDA LIBRE",
    ],
  },
  {
    canonicalName: "CHLORURE, URINE 24 HEURES",
    code: "UCL",
    category: "Individuel",
    aliases: [
      "CHLORURE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "CHROME, SANG ENTIER",
    code: "CR",
    category: "Individuel",
    aliases: [
      "CHROME, SANG ENTIER",
    ],
  },
  {
    canonicalName: "CHOLÉRA, TEST (SELLES)",
    code: "SCHL",
    category: "Individuel",
    aliases: [
      "CHOLÉRA, TEST (SELLES)",
    ],
  },
  {
    canonicalName: "CHROMOGRANINE A",
    code: "CGA",
    category: "Individuel",
    aliases: [
      "CHROMOGRANINE A",
    ],
  },
  {
    canonicalName: "CHYLOMICRONS",
    code: "CHYL",
    category: "Individuel",
    aliases: [
      "CHYLOMICRONS",
    ],
  },
  {
    canonicalName: "COBALT, SANG ENTIER",
    code: "CO",
    category: "Individuel",
    aliases: [
      "COBALT, SANG ENTIER",
    ],
  },
  {
    canonicalName: "CITRATE, URINE 24 HEURES",
    code: "CI/U",
    category: "Individuel",
    aliases: [
      "CITRATE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "CLAIRANCE DE LA CRÉATININE",
    code: "CTCL",
    category: "Individuel",
    aliases: [
      "CLAIRANCE DE LA CRÉATININE",
    ],
  },
  {
    canonicalName: "COMPLÉMENT C1Q",
    code: "C1Q",
    category: "Individuel",
    aliases: [
      "COMPLÉMENT C1Q",
    ],
  },
  {
    canonicalName: "COOMBS, DIRECT",
    code: "DCOM",
    category: "Individuel",
    aliases: [
      "COOMBS, DIRECT",
    ],
  },
  {
    canonicalName: "CRYOGOBULINE",
    code: "CRYO",
    category: "Individuel",
    aliases: [
      "CRYOGOBULINE",
    ],
  },
  {
    canonicalName: "CORTISOL, URINE 24 HEURES",
    code: "CORU",
    category: "Individuel",
    aliases: [
      "CORTISOL, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "C-TÉLOPEPTIDES",
    code: "CTPP",
    category: "Individuel",
    aliases: [
      "C-TÉLOPEPTIDES",
    ],
  },
  {
    canonicalName: "CUIVRE, GLOBULES ROUGES",
    code: "CURBC",
    category: "Individuel",
    aliases: [
      "CUIVRE, GLOBULES ROUGES",
    ],
  },
  {
    canonicalName: "CULTURE CRACHAT",
    code: "SPUT",
    category: "Individuel",
    aliases: [
      "CULTURE CRACHAT",
    ],
  },
  {
    canonicalName: "CUIVRE, PLASMA OU SÉRUM",
    code: "CU",
    category: "Individuel",
    aliases: [
      "CUIVRE, PLASMA OU SÉRUM",
    ],
  },
  {
    canonicalName: "CULTURE DE FLUIDE CORPOREL",
    code: "CFLU",
    category: "Individuel",
    aliases: [
      "CULTURE DE FLUIDE CORPOREL",
    ],
  },
  {
    canonicalName: "CUIVRE, URINE 24 HEURES",
    code: "CU/U",
    category: "Individuel",
    aliases: [
      "CUIVRE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "CULTURE FONGIQUE (peau, cheveux, ongles)",
    code: "CULF",
    category: "Individuel",
    aliases: [
      "CULTURE FONGIQUE (peau, cheveux, ongles)",
    ],
  },
  {
    canonicalName: "CULTURE CERVICALE",
    code: "CULC",
    category: "Individuel",
    aliases: [
      "CULTURE CERVICALE",
    ],
  },
  {
    canonicalName: "CULTURE, CHLAMYDIA",
    code: "CCHMD",
    category: "Individuel",
    aliases: [
      "CULTURE, CHLAMYDIA",
    ],
  },
  {
    canonicalName: "CULTURE FONGIQUE (autres)",
    code: "CULFS",
    category: "Individuel",
    aliases: [
      "CULTURE FONGIQUE (autres)",
    ],
  },
  {
    canonicalName: "CULTURE GONORRHÉE (GORGE / RECTAL)",
    code: "GONT",
    category: "Individuel",
    aliases: [
      "CULTURE GONORRHÉE (GORGE / RECTAL)",
    ],
  },
  {
    canonicalName: "CULTURE SELLES (CULTURE TRADITIONNELLE)",
    code: "CULS",
    category: "Individuel",
    aliases: [
      "CULTURE SELLES (CULTURE TRADITIONNELLE)",
    ],
  },
  {
    canonicalName: "CULTURE MYCOPLASMA",
    code: "MYPS",
    category: "Individuel",
    aliases: [
      "CULTURE MYCOPLASMA",
    ],
  },
  {
    canonicalName: "CULTURE SELLES (MÉTHODE PCR)",
    code: "STOOLPCR",
    category: "Individuel",
    aliases: [
      "CULTURE SELLES (MÉTHODE PCR)",
    ],
  },
  {
    canonicalName: "CULTURE NEZ",
    code: "CULN",
    category: "Individuel",
    aliases: [
      "CULTURE NEZ",
    ],
  },
  {
    canonicalName: "CULTURE URÉAPLASMA ET MYCOPLASMA",
    code: "UPCU",
    category: "Individuel",
    aliases: [
      "CULTURE URÉAPLASMA ET MYCOPLASMA",
    ],
  },
  {
    canonicalName: "CULTURE PLAIE SUPPERFICIELLE",
    code: "CULW",
    category: "Individuel",
    aliases: [
      "CULTURE PLAIE SUPPERFICIELLE",
    ],
  },
  {
    canonicalName: "CULTURE URÉTHRALE",
    code: "CULP",
    category: "Individuel",
    aliases: [
      "CULTURE URÉTHRALE",
    ],
  },
  {
    canonicalName: "CULTURE PUS / PLAIE PROFONDE",
    code: "CULZ",
    category: "Individuel",
    aliases: [
      "CULTURE PUS / PLAIE PROFONDE",
    ],
  },
  {
    canonicalName: "CULTURE VAGINALE (CULTURE TRADITIONNELLE)",
    code: "CULV",
    category: "Individuel",
    aliases: [
      "CULTURE VAGINALE (CULTURE TRADITIONNELLE)",
    ],
  },
  {
    canonicalName: "CULTURE VAGINALE (MÉTHODE PCR)",
    code: "PCRCULV",
    category: "Individuel",
    aliases: [
      "CULTURE VAGINALE (MÉTHODE PCR)",
    ],
  },
  {
    canonicalName: "CYSTATIN C",
    code: "CYSC",
    category: "Individuel",
    aliases: [
      "CYSTATIN C",
    ],
  },
  {
    canonicalName: "CYTOLOGIE, URINE",
    code: "UCYT",
    category: "Individuel",
    aliases: [
      "CYTOLOGIE, URINE",
    ],
  },
  {
    canonicalName: "CYTOMÉGALOVIRUS IgG, IgM",
    code: "CMVP",
    category: "Individuel",
    aliases: [
      "CYTOMÉGALOVIRUS IgG, IgM",
    ],
  },
  {
    canonicalName: "ÉLECTROPHORÈSE DES PROTÉINES, URINE",
    code: "UELP",
    category: "Individuel",
    aliases: [
      "ÉLECTROPHORÈSE DES PROTÉINES, URINE",
    ],
  },
  {
    canonicalName: "ÉLECTROCARDIOGRAMME SANS INTERPRÉTATION",
    code: "ECGW",
    category: "Individuel",
    aliases: [
      "ÉLECTROCARDIOGRAMME SANS INTERPRÉTATION",
    ],
  },
  {
    canonicalName: "ENZYME DE CONVERSION ANGIOTENSINE (ACE)",
    code: "ACE",
    category: "Individuel",
    aliases: [
      "ENZYME DE CONVERSION ANGIOTENSINE (ACE)",
    ],
  },
  {
    canonicalName: "ÉLECTROLYTES, URINE 24 HEURES",
    code: "UELE",
    category: "Individuel",
    aliases: [
      "ÉLECTROLYTES, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "EPSTEIN-BARR, PROFIL (EBAR+EBVNA)",
    code: "EBVP",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR, PROFIL (EBAR+EBVNA)",
    ],
  },
  {
    canonicalName: "EPSTEIN-BARR EBNA IGG",
    code: "EBVNA",
    category: "Individuel",
    aliases: [
      "EPSTEIN-BARR EBNA IGG",
    ],
  },
  {
    canonicalName: "ÉTHANOL, URINE",
    code: "UETH",
    category: "Individuel",
    aliases: [
      "ÉTHANOL, URINE",
    ],
  },
  {
    canonicalName: "FACTEUR II MUTATION",
    code: "FIIM",
    category: "Individuel",
    aliases: [
      "FACTEUR II MUTATION",
    ],
  },
  {
    canonicalName: "FACTEUR V LEIDEN",
    code: "FVL",
    category: "Individuel",
    aliases: [
      "FACTEUR V LEIDEN",
    ],
  },
  {
    canonicalName: "FACTEUR VIII FONCTIONNEL",
    code: "FAC8",
    category: "Individuel",
    aliases: [
      "FACTEUR VIII FONCTIONNEL",
    ],
  },
  {
    canonicalName: "FIBROSE KYSTIQUE, DÉPISTAGE",
    code: "CFC",
    category: "Individuel",
    aliases: [
      "FIBROSE KYSTIQUE, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "FRUCTOSAMINE",
    code: "FRUC",
    category: "Individuel",
    aliases: [
      "FRUCTOSAMINE",
    ],
  },
  {
    canonicalName: "GLUCOSE AC & PC 1H",
    code: "ACPC1H",
    category: "Individuel",
    aliases: [
      "GLUCOSE AC & PC 1H",
    ],
  },
  {
    canonicalName: "GLUCOSE AC & PC 2H",
    code: "ACPC2H",
    category: "Individuel",
    aliases: [
      "GLUCOSE AC & PC 2H",
    ],
  },
  {
    canonicalName: "GLOBULINES",
    code: "GLOB",
    category: "Individuel",
    aliases: [
      "GLOBULINES",
    ],
  },
  {
    canonicalName: "GLUCOSE PC",
    code: "PCGL",
    category: "Individuel",
    aliases: [
      "GLUCOSE PC",
    ],
  },
  {
    canonicalName: "GLUCAGON",
    code: "GLGN",
    category: "Individuel",
    aliases: [
      "GLUCAGON",
    ],
  },
  {
    canonicalName: "GLUCOSE-6-PO4-DH QUANTITATIF, SANG ENTIER",
    code: "G6PDQ",
    category: "Individuel",
    aliases: [
      "GLUCOSE-6-PO4-DH QUANTITATIF, SANG ENTIER",
    ],
  },
  {
    canonicalName: "Glucose Tolerance Test (2h)",
    code: "2HGTT",
    category: "Individuel",
    aliases: [
      "GLUCOSE TEST DE TOLÉRANCE, 2 HEURES",
      "Glucose Tolerance Test (2h)",
    ],
  },
  {
    canonicalName: "Gonorrhée (PCR Cervical/Endocervical)",
    code: "GONO",
    category: "Individuel",
    aliases: [
      "GONORRHÉE PAR PCR",
      "Gonorrhée (PCR Cervical/Endocervical)",
    ],
  },
  {
    canonicalName: "Gonorrhée (Urine)",
    code: "GONOU",
    category: "Individuel",
    aliases: [
      "GONORRHÉE PAR PCR (URINE)",
      "Gonorrhée (Urine)",
    ],
  },
  {
    canonicalName: "H. PYLORI, SELLES",
    code: "HELAG",
    category: "Individuel",
    aliases: [
      "H. PYLORI, SELLES",
    ],
  },
  {
    canonicalName: "H. Pylori Breath Test",
    code: "HPBT",
    category: "Individuel",
    aliases: [
      "H. PYLORI, TEST RESPIRATOIRE",
      "H. Pylori Breath Test",
    ],
  },
  {
    canonicalName: "HÉPATITE A TOTAL",
    code: "HAVT",
    category: "Individuel",
    aliases: [
      "HÉPATITE A TOTAL",
    ],
  },
  {
    canonicalName: "HÉPATITE B ANTIGÈNE DE SURFACE CONFIRMATION",
    code: "HBCN",
    category: "Individuel",
    aliases: [
      "HÉPATITE B ANTIGÈNE DE SURFACE CONFIRMATION",
    ],
  },
  {
    canonicalName: "HÉPATITE B CHARGE VIRALE",
    code: "HEPBL",
    category: "Individuel",
    aliases: [
      "HÉPATITE B CHARGE VIRALE",
    ],
  },
  {
    canonicalName: "HÈRPES SIMPLEX VIRUS 1 ET 2 ADN, PCR",
    code: "HSVPCR",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 1 ET 2 ADN, PCR",
    ],
  },
  {
    canonicalName: "HÈRPES SIMPLEX VIRUS 1 IGG",
    code: "SEH1",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 1 IGG",
    ],
  },
  {
    canonicalName: "HÈRPES SIMPLEX VIRUS 2 IGG",
    code: "SEH2",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 2 IGG",
    ],
  },
  {
    canonicalName: "HÈRPES SIMPLEX VIRUS 1 ET 2 IgG",
    code: "HSSP",
    category: "Individuel",
    aliases: [
      "HÈRPES SIMPLEX VIRUS 1 ET 2 IgG",
    ],
  },
  {
    canonicalName: "HFE GÉNOTYPE",
    code: "HFE",
    category: "Individuel",
    aliases: [
      "HFE GÉNOTYPE",
    ],
  },
  {
    canonicalName: "Hépatite C Charge Virale",
    code: "HCVL",
    category: "Individuel",
    aliases: [
      "HÉPATITE C CHARGE VIRALE",
      "Hépatite C Charge Virale",
    ],
  },
  {
    canonicalName: "HORMONE ADRÉNOCORTICOÏDE",
    code: "ACTH",
    category: "Individuel",
    aliases: [
      "HORMONE ADRÉNOCORTICOÏDE",
    ],
  },
  {
    canonicalName: "HORMONE ANTI-MÜLÉRIENNE",
    code: "AMH",
    category: "Individuel",
    aliases: [
      "HORMONE ANTI-MÜLÉRIENNE",
    ],
  },
  {
    canonicalName: "HLA CELIAC",
    code: "HLACELIAC",
    category: "Individuel",
    aliases: [
      "HLA CELIAC",
    ],
  },
  {
    canonicalName: "HOLTER 24 HEURES",
    code: "HLTR",
    category: "Individuel",
    aliases: [
      "HOLTER 24 HEURES",
    ],
  },
  {
    canonicalName: "HOLTER 48 HEURES",
    code: "HLTR48",
    category: "Individuel",
    aliases: [
      "HOLTER 48 HEURES",
    ],
  },
  {
    canonicalName: "ÎLOTS DE LANGERHANS, ANTICORPS",
    code: "ICAB",
    category: "Individuel",
    aliases: [
      "ÎLOTS DE LANGERHANS, ANTICORPS",
    ],
  },
  {
    canonicalName: "HTLV I & II",
    code: "HTLV",
    category: "Individuel",
    aliases: [
      "HTLV I & II",
    ],
  },
  {
    canonicalName: "IMMUNOÉLECTROPHORÈSE, SÉRUM",
    code: "IEP",
    category: "Individuel",
    aliases: [
      "IMMUNOÉLECTROPHORÈSE, SÉRUM",
    ],
  },
  {
    canonicalName: "IMMUNOÉLECTROPHORÈSE, URINE",
    code: "IEUR",
    category: "Individuel",
    aliases: [
      "IMMUNOÉLECTROPHORÈSE, URINE",
    ],
  },
  {
    canonicalName: "IGF-1",
    code: "IGF1",
    category: "Individuel",
    aliases: [
      "IGF-1",
    ],
  },
  {
    canonicalName: "IGG SOUS CLASSE",
    code: "IGGSUB",
    category: "Individuel",
    aliases: [
      "IGG SOUS CLASSE",
    ],
  },
  {
    canonicalName: "IMMUNOÉLECTROPHORÈSE, URINE 24 HEURES",
    code: "IEU",
    category: "Individuel",
    aliases: [
      "IMMUNOÉLECTROPHORÈSE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "INTERLEUKINE 6",
    code: "IL6",
    category: "Individuel",
    aliases: [
      "INTERLEUKINE 6",
    ],
  },
  {
    canonicalName: "IMMUNOGLOBULINE",
    code: "IMM",
    category: "Individuel",
    aliases: [
      "IMMUNOGLOBULINE",
    ],
  },
  {
    canonicalName: "IODINE PLASMA",
    code: "IODL",
    category: "Individuel",
    aliases: [
      "IODINE PLASMA",
    ],
  },
  {
    canonicalName: "KARYOTYPE",
    code: "KART",
    category: "Individuel",
    aliases: [
      "KARYOTYPE",
    ],
  },
  {
    canonicalName: "INFLUENZA A, DÉPISTAGE",
    code: "FLUAPCR",
    category: "Individuel",
    aliases: [
      "INFLUENZA A, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "INFLUENZA B, DÉPISTAGE",
    code: "FLUBPCR",
    category: "Individuel",
    aliases: [
      "INFLUENZA B, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "LACTOSE TEST DE TOLÉRANCE, SÉRUM",
    code: "OLTT",
    category: "Individuel",
    aliases: [
      "LACTOSE TEST DE TOLÉRANCE, SÉRUM",
    ],
  },
  {
    canonicalName: "INFLUENZA A + B, DÉPISTAGE",
    code: "FLUABPCR",
    category: "Individuel",
    aliases: [
      "INFLUENZA A + B, DÉPISTAGE",
    ],
  },
  {
    canonicalName: "LP (A)",
    code: "LPA",
    category: "Individuel",
    aliases: [
      "LP (A)",
    ],
  },
  {
    canonicalName: "LAMOTRIGINE",
    code: "LAMT",
    category: "Individuel",
    aliases: [
      "LAMOTRIGINE",
    ],
  },
  {
    canonicalName: "LYME, MALADIE DE, IGG ou IGM (LYMG/LYMM)",
    code: "LYMG",
    category: "Individuel",
    aliases: [
      "LYME, MALADIE DE, IGG ou IGM (LYMG/LYMM)",
    ],
  },
  {
    canonicalName: "LYME, MALADIE DE, IGG ou IGM (IMMUNOBLOT)",
    code: "IBLYMP",
    category: "Individuel",
    aliases: [
      "LYME, MALADIE DE, IGG ou IGM (IMMUNOBLOT)",
    ],
  },
  {
    canonicalName: "LYMPHOCYTES",
    code: "LYMSP1",
    category: "Individuel",
    aliases: [
      "LYMPHOCYTES",
    ],
  },
  {
    canonicalName: "LYSOZYMES",
    code: "LYSZ",
    category: "Individuel",
    aliases: [
      "LYSOZYMES",
    ],
  },
  {
    canonicalName: "MACROPROLACTINE",
    code: "MNPRLA",
    category: "Individuel",
    aliases: [
      "MACROPROLACTINE",
    ],
  },
  {
    canonicalName: "MANGANESE, SANG ENTIER",
    code: "MN",
    category: "Individuel",
    aliases: [
      "MANGANESE, SANG ENTIER",
    ],
  },
  {
    canonicalName: "MERCURE, SANG ENTIER",
    code: "HG",
    category: "Individuel",
    aliases: [
      "MERCURE, SANG ENTIER",
    ],
  },
  {
    canonicalName: "MÉTANÉPHRINES, PLASMA",
    code: "METS",
    category: "Individuel",
    aliases: [
      "MÉTANÉPHRINES, PLASMA",
    ],
  },
  {
    canonicalName: "MAGNÉSIUM, URINE 24 HEURES",
    code: "MG/U",
    category: "Individuel",
    aliases: [
      "MAGNÉSIUM, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "MÉTANÉPHRINES, URINAIRE (24 HEURES)",
    code: "UMET",
    category: "Individuel",
    aliases: [
      "MÉTANÉPHRINES, URINAIRE (24 HEURES)",
    ],
  },
  {
    canonicalName: "MALARIA, FROTTIS",
    code: "MALR",
    category: "Individuel",
    aliases: [
      "MALARIA, FROTTIS",
    ],
  },
  {
    canonicalName: "MÉTHADONE",
    code: "UMDN",
    category: "Individuel",
    aliases: [
      "MÉTHADONE",
    ],
  },
  {
    canonicalName: "MÉTHAMPHETAMINE",
    code: "METHAM",
    category: "Individuel",
    aliases: [
      "MÉTHAMPHETAMINE",
    ],
  },
  {
    canonicalName: "MICROSCOPIE URINAIRE",
    code: "UMICP",
    category: "Individuel",
    aliases: [
      "MICROSCOPIE URINAIRE",
    ],
  },
  {
    canonicalName: "MÉTHAQUALONE",
    code: "LUDE",
    category: "Individuel",
    aliases: [
      "MÉTHAQUALONE",
    ],
  },
  {
    canonicalName: "MUTATION DU GÈNE MTHFR",
    code: "MTHFR",
    category: "Individuel",
    aliases: [
      "MUTATION DU GÈNE MTHFR",
    ],
  },
  {
    canonicalName: "MICROALBUMINURIE (ALÉATOIRE)",
    code: "A/CU",
    category: "Individuel",
    aliases: [
      "MICROALBUMINURIE (ALÉATOIRE)",
    ],
  },
  {
    canonicalName: "MYELOPEROXIDASE ANTICORPS",
    code: "MPO",
    category: "Individuel",
    aliases: [
      "MYELOPEROXIDASE ANTICORPS",
    ],
  },
  {
    canonicalName: "MICROALBUMINURIE, URINE 24 HEURES",
    code: "MALB",
    category: "Individuel",
    aliases: [
      "MICROALBUMINURIE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "MICRODÉLÉTION DU CHROMOSOME Y",
    code: "YXMD",
    category: "Individuel",
    aliases: [
      "MICRODÉLÉTION DU CHROMOSOME Y",
    ],
  },
  {
    canonicalName: "MYOSITE",
    code: "MYOSIT",
    category: "Individuel",
    aliases: [
      "MYOSITE",
    ],
  },
  {
    canonicalName: "NICKEL, SANG ENTIER",
    code: "NIB",
    category: "Individuel",
    aliases: [
      "NICKEL, SANG ENTIER",
    ],
  },
  {
    canonicalName: "OPIACÉS",
    code: "OPIT",
    category: "Individuel",
    aliases: [
      "OPIACÉS",
    ],
  },
  {
    canonicalName: "Ova and Parasites (Oeufs et Parasites) - Selles",
    code: "PARA",
    category: "Individuel",
    aliases: [
      "OEUFS & PARASITES, SELLES (SANS PRÉSERVATIF)",
      "Ova and Parasites (Oeufs et Parasites) - Selles",
    ],
  },
  {
    canonicalName: "OEUFS & PARASITES, SELLES (AVEC PRÉSERVATIF)",
    code: "PARAPCR",
    category: "Individuel",
    aliases: [
      "OEUFS & PARASITES, SELLES (AVEC PRÉSERVATIF)",
    ],
  },
  {
    canonicalName: "OEUFS & PARASITES, URINE",
    code: "BILH",
    category: "Individuel",
    aliases: [
      "OEUFS & PARASITES, URINE",
    ],
  },
  {
    canonicalName: "OSMOLALITÉ, URINE",
    code: "OSMU",
    category: "Individuel",
    aliases: [
      "OSMOLALITÉ, URINE",
    ],
  },
  {
    canonicalName: "PAP, FROTTIS (TRADITIONNEL)",
    code: "PAPS",
    category: "Individuel",
    aliases: [
      "PAP, FROTTIS (TRADITIONNEL)",
    ],
  },
  {
    canonicalName: "OSTÉOCALCINE",
    code: "OSTO",
    category: "Individuel",
    aliases: [
      "OSTÉOCALCINE",
    ],
  },
  {
    canonicalName: "OXALATE, URINE 24 HEURES",
    code: "OXAL",
    category: "Individuel",
    aliases: [
      "OXALATE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "PAP THINPREPTM, TEST",
    code: "PAPT",
    category: "Individuel",
    aliases: [
      "PAP THINPREPTM, TEST",
    ],
  },
  {
    canonicalName: "OXYURES",
    code: "PINW",
    category: "Individuel",
    aliases: [
      "OXYURES",
    ],
  },
  {
    canonicalName: "PARVOVIRUS IGG",
    code: "PARV",
    category: "Individuel",
    aliases: [
      "PARVOVIRUS IGG",
    ],
  },
  {
    canonicalName: "PARVOVIRUS IGM",
    code: "PARM",
    category: "Individuel",
    aliases: [
      "PARVOVIRUS IGM",
    ],
  },
  {
    canonicalName: "PARVOVIRUS IgGIgM",
    code: "PARP",
    category: "Individuel",
    aliases: [
      "PARVOVIRUS IgGIgM",
    ],
  },
  {
    canonicalName: "PATERNITÉ, TEST DE (ADN)",
    code: "PATT",
    category: "Individuel",
    aliases: [
      "PATERNITÉ, TEST DE (ADN)",
    ],
  },
  {
    canonicalName: "PATERNITÉ, TEST DE (SANG MATERNEL)",
    code: "MATPAT",
    category: "Individuel",
    aliases: [
      "PATERNITÉ, TEST DE (SANG MATERNEL)",
    ],
  },
  {
    canonicalName: "PHENCYCLIDINE (PCP)",
    code: "PCP",
    category: "Individuel",
    aliases: [
      "PHENCYCLIDINE (PCP)",
    ],
  },
  {
    canonicalName: "PHÉNYTOINE",
    code: "PHTN",
    category: "Individuel",
    aliases: [
      "PHÉNYTOINE",
    ],
  },
  {
    canonicalName: "PHOSPHATASE ALCALINE",
    code: "ALKP",
    category: "Individuel",
    aliases: [
      "PHOSPHATASE ALCALINE",
    ],
  },
  {
    canonicalName: "PHOSPHATASE ALCALINE ISOENZYMES",
    code: "ALKPI",
    category: "Individuel",
    aliases: [
      "PHOSPHATASE ALCALINE ISOENZYMES",
    ],
  },
  {
    canonicalName: "PHOSPHATE, URINE 24 HEURES",
    code: "PO/U",
    category: "Individuel",
    aliases: [
      "PHOSPHATE, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "Plaquettes",
    code: "PLT",
    category: "Individuel",
    aliases: [
      "PLAQUETTES",
      "Plaquettes",
    ],
  },
  {
    canonicalName: "PLAQUETTES (tube bleu)",
    code: "PLTB",
    category: "Individuel",
    aliases: [
      "PLAQUETTES (tube bleu)",
    ],
  },
  {
    canonicalName: "PRÉALBUMINE",
    code: "PALB",
    category: "Individuel",
    aliases: [
      "PRÉALBUMINE",
    ],
  },
  {
    canonicalName: "PRÉGNENOLONE 17-OH",
    code: "17PGLN",
    category: "Individuel",
    aliases: [
      "PRÉGNENOLONE 17-OH",
    ],
  },
  {
    canonicalName: "PRO-BNP",
    code: "NTPROBNP",
    category: "Individuel",
    aliases: [
      "PRO-BNP",
    ],
  },
  {
    canonicalName: "PROGESTÉRONE 17-OH",
    code: "17PR",
    category: "Individuel",
    aliases: [
      "PROGESTÉRONE 17-OH",
    ],
  },
  {
    canonicalName: "PROTEINASE-3 ANTICORPS",
    code: "PRTASE",
    category: "Individuel",
    aliases: [
      "PROTEINASE-3 ANTICORPS",
    ],
  },
  {
    canonicalName: "PROTÉINE C, ANTIGÈNE",
    code: "PRCA",
    category: "Individuel",
    aliases: [
      "PROTÉINE C, ANTIGÈNE",
    ],
  },
  {
    canonicalName: "PROTÉINE C, FONCTIONNELLE",
    code: "PRCF",
    category: "Individuel",
    aliases: [
      "PROTÉINE C, FONCTIONNELLE",
    ],
  },
  {
    canonicalName: "PROTÉINE CRÉATININE RATIO",
    code: "P/CU",
    category: "Individuel",
    aliases: [
      "PROTÉINE CRÉATININE RATIO",
    ],
  },
  {
    canonicalName: "PROTÉINE S, ANTIGÈNE",
    code: "PRSA",
    category: "Individuel",
    aliases: [
      "PROTÉINE S, ANTIGÈNE",
    ],
  },
  {
    canonicalName: "PROTÉINE S, FONCTIONNELLE",
    code: "PRSF",
    category: "Individuel",
    aliases: [
      "PROTÉINE S, FONCTIONNELLE",
    ],
  },
  {
    canonicalName: "PROTÉINES, URINE 24 HEURES",
    code: "PR/U",
    category: "Individuel",
    aliases: [
      "PROTÉINES, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "PROSTATE, APS FACTEURS DE RISQUE CLARITYDX",
    code: "CLRYDX",
    category: "Individuel",
    aliases: [
      "PROSTATE, APS FACTEURS DE RISQUE CLARITYDX",
    ],
  },
  {
    canonicalName: "QUANTIFÉRON-TB GOLD",
    code: "QFINT",
    category: "Individuel",
    aliases: [
      "QUANTIFÉRON-TB GOLD",
    ],
  },
  {
    canonicalName: "RECHERCHE D’ANTICORPS",
    code: "ABSN",
    category: "Individuel",
    aliases: [
      "RECHERCHE D’ANTICORPS",
    ],
  },
  {
    canonicalName: "RÉNINE",
    code: "RENN",
    category: "Individuel",
    aliases: [
      "RÉNINE",
    ],
  },
  {
    canonicalName: "RÉSISTANCE PROTÉINE C ACTIVÉE",
    code: "RPC",
    category: "Individuel",
    aliases: [
      "RÉSISTANCE PROTÉINE C ACTIVÉE",
    ],
  },
  {
    canonicalName: "SANG DANS LES SELLES IMMUNOLOGIQUE, QUANTITATIF",
    code: "QIFOB",
    category: "Individuel",
    aliases: [
      "SANG DANS LES SELLES IMMUNOLOGIQUE, QUANTITATIF",
    ],
  },
  {
    canonicalName: "SÉLÉNIUM, SANG ENTIER",
    code: "SE",
    category: "Individuel",
    aliases: [
      "SÉLÉNIUM, SANG ENTIER",
    ],
  },
  {
    canonicalName: "SHBG (GLOBULINE RELIÉE À L’HORMONE DU SEXE)",
    code: "SHBG",
    category: "Individuel",
    aliases: [
      "SHBG (GLOBULINE RELIÉE À L’HORMONE DU SEXE)",
    ],
  },
  {
    canonicalName: "SODIUM, URINE 24 HEURES",
    code: "UNA",
    category: "Individuel",
    aliases: [
      "SODIUM, URINE 24 HEURES",
    ],
  },
  {
    canonicalName: "SODIUM / CRÉATININE RATIO",
    code: "NACR",
    category: "Individuel",
    aliases: [
      "SODIUM / CRÉATININE RATIO",
    ],
  },
  {
    canonicalName: "SPERMOGRAMME FERTILITÉ",
    code: "SPGMF",
    category: "Individuel",
    aliases: [
      "SPERMOGRAMME FERTILITÉ",
    ],
  },
  {
    canonicalName: "SPERMOGRAMME POST-VASECTOMIE",
    code: "SPGMPV",
    category: "Individuel",
    aliases: [
      "SPERMOGRAMME POST-VASECTOMIE",
    ],
  },
  {
    canonicalName: "STREP A, CANDIDA",
    code: "STPT",
    category: "Individuel",
    aliases: [
      "STREP A, CANDIDA",
    ],
  },
  {
    canonicalName: "STREP A, C, G (PCR)",
    code: "STPCR",
    category: "Individuel",
    aliases: [
      "STREP A, C, G (PCR)",
    ],
  },
  {
    canonicalName: "STREP A, C, G (PCR), CANDIDA",
    code: "CULT",
    category: "Individuel",
    aliases: [
      "STREP A, C, G (PCR), CANDIDA",
    ],
  },
  {
    canonicalName: "STREP A, RAPIDE",
    code: "STRP",
    category: "Individuel",
    aliases: [
      "STREP A, RAPIDE",
    ],
  },
  {
    canonicalName: "STREP GROUPE B PCR, VAGINAL",
    code: "VAGS",
    category: "Individuel",
    aliases: [
      "STREP GROUPE B PCR, VAGINAL",
    ],
  },
  {
    canonicalName: "SYNDRÔME FRAGILE X",
    code: "FRGX",
    category: "Individuel",
    aliases: [
      "SYNDRÔME FRAGILE X",
    ],
  },
  {
    canonicalName: "T3 REVERSE",
    code: "RT3",
    category: "Individuel",
    aliases: [
      "T3 REVERSE",
    ],
  },
  {
    canonicalName: "T3 TOTALE",
    code: "TT3",
    category: "Individuel",
    aliases: [
      "T3 TOTALE",
    ],
  },
  {
    canonicalName: "T4 TOTAL",
    code: "TT4",
    category: "Individuel",
    aliases: [
      "T4 TOTAL",
    ],
  },
  {
    canonicalName: "TACROLIMUS (FK506, Prograf)",
    code: "TCLM",
    category: "Individuel",
    aliases: [
      "TACROLIMUS (FK506, Prograf)",
    ],
  },
  {
    canonicalName: "TAY SACHS, PLAQUETTES",
    code: "TAYS",
    category: "Individuel",
    aliases: [
      "TAY SACHS, PLAQUETTES",
    ],
  },
  {
    canonicalName: "TERIFLUNOMIDE",
    code: "TERI",
    category: "Individuel",
    aliases: [
      "TERIFLUNOMIDE",
    ],
  },
  {
    canonicalName: "TESTS RESPIRATOIRES D-XYLOSE",
    code: "HBTDXP",
    category: "Individuel",
    aliases: [
      "TESTS RESPIRATOIRES D-XYLOSE",
    ],
  },
  {
    canonicalName: "THALASSEMIE ALPHA",
    code: "ATHAL",
    category: "Individuel",
    aliases: [
      "THALASSEMIE ALPHA",
    ],
  },
  {
    canonicalName: "THYROGLOBULINE, ANTICORPS",
    code: "TGAB",
    category: "Individuel",
    aliases: [
      "THYROGLOBULINE, ANTICORPS",
    ],
  },
  {
    canonicalName: "THYROÏDIENS, ANTICORPS",
    code: "THAB",
    category: "Individuel",
    aliases: [
      "THYROÏDIENS, ANTICORPS",
    ],
  },
  {
    canonicalName: "TOXOPLASMOSE IgG, IgM",
    code: "TOXP",
    category: "Individuel",
    aliases: [
      "TOXOPLASMOSE IgG, IgM",
    ],
  },
  {
    canonicalName: "TRICHOMONAS VAGINALIS PCR",
    code: "TRIPCR",
    category: "Individuel",
    aliases: [
      "TRICHOMONAS VAGINALIS PCR",
    ],
  },
  {
    canonicalName: "TRICHOMONAS PCR (URINE)",
    code: "UTRIPCR",
    category: "Individuel",
    aliases: [
      "TRICHOMONAS PCR (URINE)",
    ],
  },
  {
    canonicalName: "TROPONINE T",
    code: "TROPHS",
    category: "Individuel",
    aliases: [
      "TROPONINE T",
    ],
  },
  {
    canonicalName: "TRYPTASE",
    code: "TRYP",
    category: "Individuel",
    aliases: [
      "TRYPTASE",
    ],
  },
  {
    canonicalName: "URÉALYTICUM (PCR)",
    code: "UREAP",
    category: "Individuel",
    aliases: [
      "URÉALYTICUM (PCR)",
    ],
  },
  {
    canonicalName: "URÉE / CRÉATININE, RATIO",
    code: "UCR",
    category: "Individuel",
    aliases: [
      "URÉE / CRÉATININE, RATIO",
    ],
  },
  {
    canonicalName: "URÉE, URINE 24 HEURES (BUN)",
    code: "UR/U",
    category: "Individuel",
    aliases: [
      "URÉE, URINE 24 HEURES (BUN)",
    ],
  },
  {
    canonicalName: "HIV (VIH) Dépistage",
    code: "HIV",
    category: "Individuel",
    aliases: [
      "VIH (VIRUS DE L’IMMUNODÉFICIENCE HUMAINE)",
      "HIV (VIH) Dépistage",
    ],
  },
  {
    canonicalName: "VITAMINE A (RETINOL)",
    code: "VITA",
    category: "Individuel",
    aliases: [
      "VITAMINE A (RETINOL)",
    ],
  },
  {
    canonicalName: "VITAMINE B6",
    code: "VITB6",
    category: "Individuel",
    aliases: [
      "VITAMINE B6",
    ],
  },
  {
    canonicalName: "VITAMINE D 1,25 OH",
    code: "125D",
    category: "Individuel",
    aliases: [
      "VITAMINE D 1,25 OH",
    ],
  },
  {
    canonicalName: "VON WILLEBRAND, ANTIGÈNE",
    code: "VWF",
    category: "Individuel",
    aliases: [
      "VON WILLEBRAND, ANTIGÈNE",
    ],
  },
  {
    canonicalName: "VPH (VIRUS DU PAPILLOME HUMAIN)",
    code: "HPV",
    category: "Individuel",
    aliases: [
      "VPH (VIRUS DU PAPILLOME HUMAIN)",
    ],
  },
  {
    canonicalName: "VPH GENOTYPAGE (homme et femme)",
    code: "GENHPV",
    category: "Individuel",
    aliases: [
      "VPH GENOTYPAGE (homme et femme)",
    ],
  },
  {
    canonicalName: "ZINC, GLOBULES ROUGES",
    code: "ZNRBC",
    category: "Individuel",
    aliases: [
      "ZINC, GLOBULES ROUGES",
    ],
  },
  {
    canonicalName: "Profil SMA-7",
    code: "SMA7",
    category: "Profil",
    aliases: [
      "Profil SMA-7",
    ],
  },
  {
    canonicalName: "Profil THYROÏDIEN No 2",
    code: "TH2",
    category: "Profil",
    aliases: [
      "Profil THYROÏDIEN No 2",
    ],
  },
  {
    canonicalName: "Profil THYROÏDIEN No 6",
    code: "TH6",
    category: "Profil",
    aliases: [
      "Profil THYROÏDIEN No 6",
    ],
  },
  {
    canonicalName: "Profil UROLITHIASE",
    code: "STONE",
    category: "Profil",
    aliases: [
      "Profil UROLITHIASE",
    ],
  },
  {
    canonicalName: "Profil BIO-12",
    code: "SMA12",
    category: "Profil",
    aliases: [
      "Profil BIO-12",
    ],
  },
  {
    canonicalName: "Profil BIO-12 AVEC ÉLECTROLYTES",
    code: "SMA12LYT",
    category: "Profil",
    aliases: [
      "Profil BIO-12 AVEC ÉLECTROLYTES",
    ],
  },
  {
    canonicalName: "Profil BIO-C",
    code: "SMAC",
    category: "Profil",
    aliases: [
      "Profil BIO-C",
    ],
  },
  {
    canonicalName: "Profil BIO-C AVEC ÉLECTROLYTES",
    code: "SMACLYT",
    category: "Profil",
    aliases: [
      "Profil BIO-C AVEC ÉLECTROLYTES",
    ],
  },
  {
    canonicalName: "Profil COAGULATION/HÉMOGRAMME",
    code: "CBCCOAG",
    category: "Profil",
    aliases: [
      "Profil COAGULATION/HÉMOGRAMME",
    ],
  },
  {
    canonicalName: "Profil CULTURE GENITAL et GONO/CHLAM",
    code: "STDMU",
    category: "Profil",
    aliases: [
      "Profil CULTURE GENITAL et GONO/CHLAM",
    ],
  },
  {
    canonicalName: "Profil DÉPISTAGE HÉPATITE A et B",
    code: "HEPAB",
    category: "Profil",
    aliases: [
      "Profil DÉPISTAGE HÉPATITE A et B",
    ],
  },
  {
    canonicalName: "Profil DÉPISTAGE HÉPATITE A, B et C",
    code: "HEPABC",
    category: "Profil",
    aliases: [
      "Profil DÉPISTAGE HÉPATITE A, B et C",
    ],
  },
  {
    canonicalName: "Profil DÉPISTAGE HÉPATITE B",
    code: "HEPB",
    category: "Profil",
    aliases: [
      "Profil DÉPISTAGE HÉPATITE B",
    ],
  },
  {
    canonicalName: "Profil DÉPISTAGE MALADIE COELIAQUE",
    code: "CELISCRE",
    category: "Profil",
    aliases: [
      "Profil DÉPISTAGE MALADIE COELIAQUE",
    ],
  },
  {
    canonicalName: "Profil DIABÉTIQUE No 6",
    code: "DIAB6",
    category: "Profil",
    aliases: [
      "Profil DIABÉTIQUE No 6",
    ],
  },
  {
    canonicalName: "Profil FERTILITÉ No 1",
    code: "FERT1",
    category: "Profil",
    aliases: [
      "Profil FERTILITÉ No 1",
    ],
  },
  {
    canonicalName: "Profil FERTILITÉ No 2",
    code: "FERT2",
    category: "Profil",
    aliases: [
      "Profil FERTILITÉ No 2",
    ],
  },
  {
    canonicalName: "Profil GÉNÉRAL No 1",
    code: "GP1",
    category: "Profil",
    aliases: [
      "Profil GÉNÉRAL No 1",
    ],
  },
  {
    canonicalName: "Profil GÉNÉRAL No 2",
    code: "GP2",
    category: "Profil",
    aliases: [
      "Profil GÉNÉRAL No 2",
    ],
  },
  {
    canonicalName: "Profil GÉNÉRAL No 3",
    code: "GP3",
    category: "Profil",
    aliases: [
      "Profil GÉNÉRAL No 3",
    ],
  },
  {
    canonicalName: "Profil GÉNÉRAL No 4",
    code: "GP4",
    category: "Profil",
    aliases: [
      "Profil GÉNÉRAL No 4",
    ],
  },
  {
    canonicalName: "Profil GONO-CHLAM",
    code: "ITSS",
    category: "Profil",
    aliases: [
      "Profil GONO-CHLAM",
    ],
  },
  {
    canonicalName: "Profil HÉPATIQUE",
    code: "LFT",
    category: "Profil",
    aliases: [
      "Profil HÉPATIQUE",
    ],
  },
  {
    canonicalName: "Profil LIPIDIQUE CARDIOVASCULAIRE",
    code: "LIPID",
    category: "Profil",
    aliases: [
      "Profil LIPIDIQUE CARDIOVASCULAIRE",
    ],
  },
  {
    canonicalName: "Profil LIPIDIQUE CARDIOVASCULAIRE No 18",
    code: "LIPID18",
    category: "Profil",
    aliases: [
      "Profil LIPIDIQUE CARDIOVASCULAIRE No 18",
    ],
  },
  {
    canonicalName: "Profil LIPIDIQUE CARDIOVASCULAIRE No 6",
    code: "LIPID6",
    category: "Profil",
    aliases: [
      "Profil LIPIDIQUE CARDIOVASCULAIRE No 6",
    ],
  },
  {
    canonicalName: "Profil MARQUEURS PROSTATIQUES",
    code: "FPSA_PROF",
    category: "Profil",
    aliases: [
      "Profil MARQUEURS PROSTATIQUES",
    ],
  },
  {
    canonicalName: "Profil MONOTEST",
    code: "MONOP",
    category: "Profil",
    aliases: [
      "Profil MONOTEST",
    ],
  },
  {
    canonicalName: "Profil OSTEOPOROSIS",
    code: "OSTEOP",
    category: "Profil",
    aliases: [
      "Profil OSTEOPOROSIS",
    ],
  },
  {
    canonicalName: "Profil PRÉNATAL No 1",
    code: "PREN1",
    category: "Profil",
    aliases: [
      "Profil PRÉNATAL No 1",
    ],
  },
  {
    canonicalName: "Profil PRÉNATAL No 2",
    code: "PREN2",
    category: "Profil",
    aliases: [
      "Profil PRÉNATAL No 2",
    ],
  },
  {
    canonicalName: "Profil PRÉNATAL No 3",
    code: "PREN3",
    category: "Profil",
    aliases: [
      "Profil PRÉNATAL No 3",
    ],
  },
  {
    canonicalName: "Profil SMA-16",
    code: "SMA16",
    category: "Profil",
    aliases: [
      "Profil SMA-16",
    ],
  },
  {
    canonicalName: "Profil SMA-5",
    code: "SMA5",
    category: "Profil",
    aliases: [
      "Profil SMA-5",
    ],
  },
  {
    canonicalName: "Profil SMA-6",
    code: "SMA6",
    category: "Profil",
    aliases: [
      "Profil SMA-6",
    ],
  },
  {
    canonicalName: "Profil ANÉMIE No 1",
    code: "ANEM1",
    category: "Profil",
    aliases: [
      "Profil ANÉMIE No 1",
    ],
  },
  {
    canonicalName: "Profil ANÉMIE No 11",
    code: "ANEM11",
    category: "Profil",
    aliases: [
      "Profil ANÉMIE No 11",
    ],
  },
  {
    canonicalName: "Profil ANÉMIE No 8",
    code: "ANEM8",
    category: "Profil",
    aliases: [
      "Profil ANÉMIE No 8",
    ],
  },
  {
    canonicalName: "1.25-DIHYDROXY-VITAMINE D",
    code: "VITD125",
    category: "Individuel",
    aliases: [
      "1.25-DIHYDROXY-VITAMINE D",
    ],
  },
  {
    canonicalName: "17-HYDROXY-PROGESTERONE",
    code: "17HYPROG",
    category: "Individuel",
    aliases: [
      "17-HYDROXY-PROGESTERONE",
    ],
  },
  {
    canonicalName: "5-HIAA",
    code: "24U5HIAA",
    category: "Individuel",
    aliases: [
      "5-HIAA",
    ],
  },
  {
    canonicalName: "ACÉTAMINOPHÈNE",
    code: "APH",
    category: "Individuel",
    aliases: [
      "ACÉTAMINOPHÈNE",
    ],
  },
  {
    canonicalName: "ACÉTONE",
    code: "ACETONE",
    category: "Individuel",
    aliases: [
      "ACÉTONE",
    ],
  },
  {
    canonicalName: "ACIDE ASCORBIQUE (VITAMINE C)",
    code: "VITC",
    category: "Individuel",
    aliases: [
      "ACIDE ASCORBIQUE (VITAMINE C)",
    ],
  },
  {
    canonicalName: "ACIDE FOLIQUE ET VITAMINE B12",
    code: "B12FOL",
    category: "Individuel",
    aliases: [
      "ACIDE FOLIQUE ET VITAMINE B12",
    ],
  },
  {
    canonicalName: "ACIDE LACTIQUE",
    code: "LAC",
    category: "Individuel",
    aliases: [
      "ACIDE LACTIQUE",
    ],
  },
  {
    canonicalName: "ACIDE MÉTHYLMALONIQUE - URINE",
    code: "METMALAU",
    category: "Individuel",
    aliases: [
      "ACIDE MÉTHYLMALONIQUE - URINE",
    ],
  },
  {
    canonicalName: "ACIDE MÉTHYLMALONIQUE - SANG",
    code: "METMALA",
    category: "Individuel",
    aliases: [
      "ACIDE MÉTHYLMALONIQUE - SANG",
    ],
  },
  {
    canonicalName: "ACIDE URIQUE - URINE AU HASARD",
    code: "URICURAN",
    category: "Individuel",
    aliases: [
      "ACIDE URIQUE - URINE AU HASARD",
    ],
  },
  {
    canonicalName: "ACIDE URIQUE - URINES DE 24 HEURES",
    code: "24UURIC",
    category: "Individuel",
    aliases: [
      "ACIDE URIQUE - URINES DE 24 HEURES",
    ],
  },
  {
    canonicalName: "ACIDE VANYLMANDÉLIQUE (VMA)",
    code: "VMA",
    category: "Individuel",
    aliases: [
      "ACIDE VANYLMANDÉLIQUE (VMA)",
    ],
  },
  {
    canonicalName: "ACIDES GRAS LIBRES",
    code: "FFA",
    category: "Individuel",
    aliases: [
      "ACIDES GRAS LIBRES",
    ],
  },
  {
    canonicalName: "ACTIVITÉ DE LA PROTÉINE C",
    code: "PROCACT",
    category: "Individuel",
    aliases: [
      "ACTIVITÉ DE LA PROTÉINE C",
    ],
  },
  {
    canonicalName: "AGGLUTININES FROIDES",
    code: "AGG",
    category: "Individuel",
    aliases: [
      "AGGLUTININES FROIDES",
    ],
  },
  {
    canonicalName: "ALCOOL (ETHANOL) - URINE",
    code: "ETOH",
    category: "Individuel",
    aliases: [
      "ALCOOL (ETHANOL) - URINE",
    ],
  },
  {
    canonicalName: "ALDOSTÉRONE - URINES DE 24 HEURES",
    code: "DOSTU",
    category: "Individuel",
    aliases: [
      "ALDOSTÉRONE - URINES DE 24 HEURES",
    ],
  },
  {
    canonicalName: "ALPHA 1-ANTITRYPSINE",
    code: "TRYP_A1AT",
    category: "Individuel",
    aliases: [
      "ALPHA 1-ANTITRYPSINE",
    ],
  },
  {
    canonicalName: "ALPHA 2 MACROGLOBULINE",
    code: "ALPHA2",
    category: "Individuel",
    aliases: [
      "ALPHA 2 MACROGLOBULINE",
    ],
  },
  {
    canonicalName: "Amikacine (Au hasard/Pré/Post)",
    code: "AMIK",
    category: "Individuel",
    aliases: [
      "AMIKACINE",
      "Amikacine (Au hasard/Pré/Post)",
    ],
  },
  {
    canonicalName: "Amitriptyline",
    code: "AMITRIP",
    category: "Individuel",
    aliases: [
      "AMITRIPTYLINE",
      "Amitriptyline",
    ],
  },
  {
    canonicalName: "Ammoniaque",
    code: "AMMO",
    category: "Individuel",
    aliases: [
      "AMMONIAQUE",
      "Ammoniaque",
    ],
  },
  {
    canonicalName: "ANALYSE DES CALCULS RENAUX",
    code: "KIDNEY",
    category: "Individuel",
    aliases: [
      "ANALYSE DES CALCULS RENAUX",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTI-HISTONE",
    code: "HISTAB",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-HISTONE",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTI-MEMBRANE BASALE GLOMERULAIRE",
    code: "GBM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-MEMBRANE BASALE GLOMERULAIRE",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTI-PARVOVIRUS IgG ET IgM",
    code: "PARVO",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-PARVOVIRUS IgG ET IgM",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTI-MITOCHONDRIES M2",
    code: "MITOM2",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-MITOCHONDRIES M2",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTI-CARDIOLIPINES",
    code: "ANTICAR",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-CARDIOLIPINES",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTI-CYTOMEGALOVIRUS IgM",
    code: "CMVM",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-CYTOMEGALOVIRUS IgM",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTI-RÉCEPTEUR DE L'ACETYLCHOLINE",
    code: "ARA",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTI-RÉCEPTEUR DE L'ACETYLCHOLINE",
    ],
  },
  {
    canonicalName: "ANTICORPS ANTITÉTANIQUES",
    code: "TETA",
    category: "Individuel",
    aliases: [
      "ANTICORPS ANTITÉTANIQUES",
    ],
  },
  {
    canonicalName: "ANTIGÈNE PROTÉINE C",
    code: "PROCAG",
    category: "Individuel",
    aliases: [
      "ANTIGÈNE PROTÉINE C",
    ],
  },
  {
    canonicalName: "ARSENIC URINE",
    code: "ARSENIRU",
    category: "Individuel",
    aliases: [
      "ARSENIC URINE",
    ],
  },
  {
    canonicalName: "BÉRYLLIUM SANG ENTIER",
    code: "BERY",
    category: "Individuel",
    aliases: [
      "BÉRYLLIUM SANG ENTIER",
    ],
  },
  {
    canonicalName: "BILAN D'IMMUNODÉFICIENCE",
    code: "CD4",
    category: "Individuel",
    aliases: [
      "BILAN D'IMMUNODÉFICIENCE",
    ],
  },
  {
    canonicalName: "BRUCELLA/BRUCELLOSE",
    code: "BRUC",
    category: "Individuel",
    aliases: [
      "BRUCELLA/BRUCELLOSE",
    ],
  },
  {
    canonicalName: "CALCIUM - URINE AU HASARD",
    code: "CAURAN",
    category: "Individuel",
    aliases: [
      "CALCIUM - URINE AU HASARD",
    ],
  },
  {
    canonicalName: "CALCIUM - URINES DE 24 HEURES",
    code: "24UCA",
    category: "Individuel",
    aliases: [
      "CALCIUM - URINES DE 24 HEURES",
    ],
  },
  {
    canonicalName: "CARNITINE",
    code: "CARNITH",
    category: "Individuel",
    aliases: [
      "CARNITINE",
    ],
  },
  {
    canonicalName: "CATÉCHOLAMINES ET MÉTANÉPHRINE (24H)",
    code: "CATEMETA",
    category: "Individuel",
    aliases: [
      "CATÉCHOLAMINES ET MÉTANÉPHRINE (24H)",
    ],
  },
  {
    canonicalName: "CULTURE D'URINE + ANALYSE",
    code: "UC",
    category: "Individuel",
    aliases: [
      "CULTURE D'URINE + ANALYSE",
    ],
  },
  {
    canonicalName: "CULTURE GORGE + STREP A RAPIDE",
    code: "STREP",
    category: "Individuel",
    aliases: [
      "CULTURE GORGE + STREP A RAPIDE",
    ],
  },
  {
    canonicalName: "DHEA",
    code: "DHEA",
    category: "Individuel",
    aliases: [
      "DHEA",
    ],
  },
];
