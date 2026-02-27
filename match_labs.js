/**
 * Medical Semantic Lab Matching Engine
 * Matches CDL and Dynacare lab tests using:
 *   1. Exact code matches
 *   2. Medical name normalization & similarity
 *   3. Abbreviation/contraction expansion (B12 = Vitamin B12, etc.)
 *   4. Order-insensitive combination matching
 *   5. Profile component similarity
 *   6. Shared code matching
 */

const fs = require('fs');

const cdlRaw = require('./final_cdl.json');
const dynRaw = require('./final_dynacare.json');

// ─── Deduplicate CDL: prefer entries with non-null category ───
function deduplicateCDL(entries) {
  const byCode = {};
  entries.forEach(t => {
    if (!byCode[t.code]) {
      byCode[t.code] = t;
    } else {
      // Prefer non-null category
      if (t.category !== null && byCode[t.code].category === null) {
        byCode[t.code] = t;
      }
    }
  });
  return Object.values(byCode);
}

const cdl = deduplicateCDL(cdlRaw);
const dyn = dynRaw; // Dynacare has no duplicates

console.log(`CDL after dedup: ${cdl.length}, Dynacare: ${dyn.length}`);

// ─── Text normalization ───
function normalize(str) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .toUpperCase()
    .replace(/[''`]/g, "'")
    .replace(/[#]/g, ' ')
    .replace(/\bPROFIL\b/gi, '')
    .replace(/\bNO\s*/gi, '')  // "No 2" -> "2"
    .replace(/\bDE\s+LA\b/gi, '')
    .replace(/\bDE\s+L['']/gi, '')
    .replace(/\bDU\b/gi, '')
    .replace(/\bDES\b/gi, '')
    .replace(/\bDE\b/gi, '')
    .replace(/\bD['']/gi, '')
    .replace(/\bET\b/gi, '')
    .replace(/\bLE\b/gi, '')
    .replace(/\bLA\b/gi, '')
    .replace(/\bLES\b/gi, '')
    .replace(/\bDIRIGES?\s+CONTRE\b/gi, '')
    .replace(/\bAVEC\b/gi, '')
    .replace(/\bPAR\b/gi, '')
    .replace(/\bAU\b/gi, '')
    .replace(/\bEN\b/gi, '')
    .replace(/[()[\],.:;\/\-+&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Medical abbreviation expansion map ───
const MEDICAL_SYNONYMS = {
  // Vitamins
  'B12': ['VITAMINE B12', 'CYANOCOBALAMINE', 'VIT B12', 'COBALAMINE'],
  'VITAMINE B12': ['B12', 'CYANOCOBALAMINE', 'VIT B12'],
  'ACIDE FOLIQUE': ['FOLATE', 'FOL', 'VITAMINE B9'],
  'FOLATE': ['ACIDE FOLIQUE', 'FOL', 'VITAMINE B9'],
  'VITAMINE D': ['25 HYDROXY VITAMINE D', 'CHOLECALCIFEROL', '25 OH D', 'VIT D'],
  '25 HYDROXY VITAMINE D': ['VITAMINE D', 'VIT D', '25 OH D'],
  'VITAMINE C': ['ACIDE ASCORBIQUE'],
  'ACIDE ASCORBIQUE': ['VITAMINE C'],

  // Thyroid
  'TSH': ['THYREOSTIMULINE', 'HORMONE STIMULATION THYROIDIENNE', 'TSH ULTRASENSIBLE'],
  'T3 LIBRE': ['FT3', 'FREE T3', 'T3L'],
  'T4 LIBRE': ['FT4', 'FREE T4', 'T4L'],
  'THYROIDE': ['THYROIDIEN'],
  'THYROIDIEN': ['THYROIDE'],

  // Iron studies
  'FER': ['IRON', 'FE'],
  'FERRITINE': ['FERR'],
  'TRANSFERRINE': ['TRFN'],

  // CBC
  'FORMULE SANGUINE COMPLETE': ['FSC', 'CBC', 'HEMOGRAMME', 'FORMULE SANGUINE'],
  'FSC': ['FORMULE SANGUINE COMPLETE', 'CBC', 'HEMOGRAMME'],
  'HEMOGRAMME': ['FSC', 'CBC', 'FORMULE SANGUINE COMPLETE'],

  // Liver
  'HEPATIQUE': ['LIVER', 'LFT', 'BILAN HEPATIQUE', 'FOIE'],
  'ALT': ['ALAT', 'SGPT', 'ALANINE AMINOTRANSFERASE'],
  'AST': ['ASAT', 'GOT', 'SGOT', 'ASPARTATE AMINOTRANSFERASE'],
  'GGT': ['GAMMA GLUTAMYLTRANSFERASE', 'GAMMA GT'],
  'PHOSPHATASE ALCALINE': ['PAL', 'ALP', 'ALKP'],
  'BILIRUBINE': ['BILI'],

  // Kidney
  'CREATININE': ['CREA', 'CR'],
  'UREE': ['BUN', 'AZOTE UREIQUE', 'UREUM'],
  'RENAL': ['KIDNEY', 'REIN'],

  // Lipids
  'CHOLESTEROL': ['CHOL'],
  'TRIGLYCERIDES': ['TRIG', 'TG'],
  'HDL': ['CHOLESTEROL HDL', 'HDL CHOLESTEROL'],
  'LDL': ['CHOLESTEROL LDL', 'LDL CHOLESTEROL'],
  'LIPIDIQUE': ['LIPID', 'BILAN LIPIDIQUE'],

  // Coagulation
  'COAGULOGRAMME': ['COAG', 'BILAN COAGULATION'],
  'PT': ['INR', 'TEMPS QUICK', 'RAPPORT INTERNATIONAL NORMALISE'],
  'PTT': ['TCA', 'TEMPS CEPHALINE ACTIVEE'],
  'FIBRINOGENE': ['FIB', 'FIBR'],

  // Diabetes
  'HEMOGLOBINE A1C': ['HBA1C', 'A1C', 'GLYCOSYLEE'],
  'GLUCOSE': ['GLYCEMIE', 'SUCRE'],
  'DIABETIQUE': ['DIABETE', 'DIAB'],
  'INSULINE': ['INSUL'],

  // Hormones
  'PROLACTINE': ['PRL', 'PRLA', 'PROL'],
  'PROGESTERONE': ['PROG'],
  'ESTRADIOL': ['E2', 'OESTRADIOL', 'ESTR'],
  'TESTOSTERONE': ['TEST'],
  'LH': ['HORMONE LUTEINISANTE'],
  'FSH': ['HORMONE FOLLICULOSTIMULANTE'],
  'CORTISOL': ['CORT'],
  'DHEAS': ['DHEA S', 'DH S', 'DEHYDROEPIANDROSTERONE SULFATE'],
  'DHEA': ['DEHYDROEPIANDROSTERONE'],

  // Immunology
  'ANTICORPS ANTINUCLEAIRES': ['ANA', 'FAN'],
  'ANA': ['ANTICORPS ANTINUCLEAIRES', 'FAN', 'ANTI NUCLEAIRE ANTICORPS'],
  'FACTEUR RHUMATOIDE': ['RF', 'RA'],
  'CRP': ['PROTEINE C REACTIVE', 'C REACTIVE PROTEIN'],
  'PROTEINE C REACTIVE': ['CRP'],
  'PROTEINE C REACTIVE HAUTE SENSIBILITE': ['CRPHS', 'HS CRP', 'CRP HAUTE SENSIBILITE'],
  'COMPLEMENT C3': ['C3'],
  'COMPLEMENT C4': ['C4'],
  'IMMUNOGLOBULINE': ['IG'],

  // Tumor markers
  'ANTIGENE PROSTATIQUE SPECIFIQUE': ['PSA', 'APS'],
  'PSA': ['APS', 'ANTIGENE PROSTATIQUE SPECIFIQUE'],
  'ANTIGENE CARCINO EMBRYONNAIRE': ['CEA', 'ACE'],
  'CA 125': ['C125', 'CA125'],
  'CA 15 3': ['C153', 'CA153'],
  'CA 19 9': ['C199', 'CA19', 'CA199'],

  // Electrolytes
  'SODIUM': ['NA'],
  'POTASSIUM': ['K'],
  'CHLORURE': ['CL', 'CHLORURES'],
  'ELECTROLYTES': ['LYTES', 'NA K CL', 'ELEC'],
  'BICARBONATE': ['CO2 TOTAL', 'CO2', 'HCO3'],
  'CALCIUM': ['CA'],
  'MAGNESIUM': ['MG'],
  'PHOSPHORE': ['PHOSPHATE', 'PO4', 'PHOS'],

  // Microbiology
  'CULTURE URINE': ['CULTURE D URINE', 'UROCULTURE', 'CSU'],
  'ANALYSE URINE': ['ANALYSE D URINE', 'URI', 'URC'],
  'CULTURE': ['CUL'],
  'CHLAMYDIA': ['CHLAM'],
  'GONORRHEE': ['GONORRHOEA', 'GONO'],
  'MONOTEST': ['MONONUCLEOSE', 'MONO'],

  // Hepatitis
  'HEPATITE A': ['HAV', 'HEPA'],
  'HEPATITE B': ['HBV', 'HEPB'],
  'HEPATITE C': ['HCV', 'HEPC'],

  // Other common
  'SEDIMENTATION': ['SED', 'VS', 'VITESSE SEDIMENTATION', 'ESR'],
  'VITESSE SEDIMENTATION': ['SED', 'VS', 'ESR', 'SEDIMENTATION'],
  'AMYLASE': ['AMYL'],
  'ACIDE URIQUE': ['URIC', 'URATE'],
  'PROTEINE': ['PROT'],
  'ALBUMINE': ['ALB'],
  'D DIMERE': ['DDIM', 'D DIMER'],
  'TROPONINE': ['TROP', 'TROPHS'],
  'LIPASE': ['LASE', 'LPS'],
  'OSMOLALITE': ['OSMO'],
  'CALCITONINE': ['CALCI', 'CLTN'],
  'CERULOPLASMINE': ['CERU', 'CUBP'],
  'LACTATE DESHYDROGENASE': ['LDH', 'LD'],
  'CREATINE KINASE': ['CK', 'CPK'],
  'UREE': ['BUN', 'UREA'],

  // Prenatal
  'PRENATAL': ['PREN'],

  // Anemia
  'ANEMIE': ['ANEM', 'ANEMIA'],

  // Urolithiasis
  'UROLITHIASE': ['CALCUL', 'STONE', 'CALCULS RENAUX'],

  // Profiles
  'BIOCHIMIE': ['BIO', 'BIOCHEMISTRY', 'SMA', 'CHEM'],
  'CARDIOVASCULAIRE': ['CARDIO', 'CVD'],
  'FERTILITE': ['FERT'],
  'MENOPAUSE': ['MEN'],
  'GENERAL': ['COMPLET', 'GP'],
  'COAGULATION': ['COAG'],
  'COELIAQUE': ['CELIAC', 'MALADIE COELIAQUE'],
  'OSTEOPOROSE': ['OSTEOPOROSIS', 'OSTEOP'],
};

// ─── Compute word tokens from normalized string ───
function tokenize(str) {
  return normalize(str).split(/\s+/).filter(w => w.length > 0);
}

// ─── Jaccard similarity on token sets ───
function jaccardSimilarity(setA, setB) {
  const a = new Set(setA);
  const b = new Set(setB);
  let intersection = 0;
  a.forEach(v => { if (b.has(v)) intersection++; });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Levenshtein distance ───
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function normalizedLevenshtein(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Check synonym match ───
function synonymScore(normA, normB) {
  const tokA = tokenize(normA);
  const tokB = tokenize(normB);
  const strA = tokA.join(' ');
  const strB = tokB.join(' ');

  for (const [key, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
    const normKey = normalize(key);
    const normSyns = synonyms.map(s => normalize(s));
    const allForms = [normKey, ...normSyns];

    // Check if strA contains one form and strB contains another form
    for (const formA of allForms) {
      for (const formB of allForms) {
        if (formA === formB) continue;
        if (strA.includes(formA) && strB.includes(formB)) {
          return 0.3; // synonym bonus
        }
      }
    }
  }
  return 0;
}

// ─── Order-insensitive match ───
// "VITAMINE B12 ET ACIDE FOLIQUE" should match "ACIDE FOLIQUE ET VITAMINE B12"
function orderInsensitiveScore(normA, normB) {
  const tokA = new Set(tokenize(normA));
  const tokB = new Set(tokenize(normB));
  return jaccardSimilarity(tokA, tokB);
}

// ─── Containment check ───
function containmentScore(normA, normB) {
  const tokA = tokenize(normA);
  const tokB = tokenize(normB);
  if (tokA.length === 0 || tokB.length === 0) return 0;

  const setA = new Set(tokA);
  const setB = new Set(tokB);

  let matchCount = 0;
  setA.forEach(w => { if (setB.has(w)) matchCount++; });

  const smaller = Math.min(setA.size, setB.size);
  return smaller === 0 ? 0 : matchCount / smaller;
}

// ─── Profile name pattern matching ───
// "DIABÉTIQUE #1" should match "Profil DIABÉTIQUE No 1"
function profilePatternScore(normA, normB) {
  // Extract base concept and number
  const extractPattern = (str) => {
    const norm = normalize(str);
    const numMatch = norm.match(/(\d+)/);
    const num = numMatch ? numMatch[1] : null;
    const base = norm.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
    return { base, num };
  };

  const pA = extractPattern(normA);
  const pB = extractPattern(normB);

  // If both have numbers, they must match
  if (pA.num !== null && pB.num !== null && pA.num !== pB.num) {
    return 0;
  }

  // Compare bases
  const baseSim = jaccardSimilarity(pA.base.split(' '), pB.base.split(' '));

  // Bonus if numbers match
  const numBonus = (pA.num !== null && pB.num !== null && pA.num === pB.num) ? 0.15 : 0;

  return baseSim + numBonus;
}

// ─── False positive blocklist ───
// Pairs of normalized substrings that should NEVER match each other
const FALSE_POSITIVE_BLOCKS = [
  ['FER', 'FERTILITE'],   // Iron ≠ Fertility
  ['FER', 'FERT'],
  ['IRON', 'FERTILITE'],
  ['IRON', 'FERT'],
];

// ─── Number mismatch penalty ───
// Extracts all numbers from a normalized string
function extractNumbers(str) {
  const nums = str.match(/\b(\d+)\b/g);
  return nums ? nums.map(Number) : [];
}

// Check if two tests have conflicting numbered variants
function hasNumberConflict(normA, normB) {
  const numsA = extractNumbers(normA);
  const numsB = extractNumbers(normB);
  if (numsA.length === 0 || numsB.length === 0) return false;

  // If both have exactly one number, they must match
  if (numsA.length === 1 && numsB.length === 1) {
    return numsA[0] !== numsB[0];
  }
  return false;
}

// ─── Check false positive blocks (word-boundary aware) ───
function hasWord(str, word) {
  const re = new RegExp('\\b' + word + '\\b');
  return re.test(str);
}

function isBlockedPair(normA, normB) {
  const tokA = tokenize(normA);
  const tokB = tokenize(normB);
  const strA = tokA.join(' ');
  const strB = tokB.join(' ');

  for (const [wordA, wordB] of FALSE_POSITIVE_BLOCKS) {
    // Check both directions using word boundaries
    if ((hasWord(strA, wordA) && !hasWord(strA, wordB) && hasWord(strB, wordB) && !hasWord(strB, wordA)) ||
        (hasWord(strB, wordA) && !hasWord(strB, wordB) && hasWord(strA, wordB) && !hasWord(strA, wordA))) {
      return true;
    }
  }

  // Block "DEPISTAGE" (screening panel) matching single tests
  const aIsScreening = strA.includes('DEPISTAGE') || strA.includes('SCREENING');
  const bIsScreening = strB.includes('DEPISTAGE') || strB.includes('SCREENING');
  if (aIsScreening !== bIsScreening) {
    // Only block if the non-screening one is a specific single test
    const nonScreening = aIsScreening ? strB : strA;
    if (nonScreening.includes('TOTAL') || nonScreening.includes('IGG') || nonScreening.includes('IGM') ||
        nonScreening.includes('AIGU')) {
      return true;
    }
  }

  return false;
}

// ─── Main matching function ───
function computeMatchScore(cdlTest, dynTest) {
  let score = 0;
  let reasons = [];

  const normCDL = normalize(cdlTest.raw_name);
  const normDYN = normalize(dynTest.raw_name);

  // Pre-check: block known false positives
  if (isBlockedPair(normCDL, normDYN)) {
    return { score: 0, reasons: ['blocked_false_positive'] };
  }

  // Pre-check: number conflict (e.g. #1 vs #6)
  if (hasNumberConflict(normCDL, normDYN)) {
    // Only allow if code matches exactly
    if (cdlTest.code !== dynTest.code) {
      return { score: 0, reasons: ['number_conflict'] };
    }
  }

  // 1. Exact code match (strongest signal)
  if (cdlTest.code === dynTest.code) {
    score += 0.50;
    reasons.push('exact_code_match');
  }

  // 2. Normalized name exact match
  if (normCDL === normDYN) {
    score += 0.45;
    reasons.push('exact_name_match');
  } else {
    // 3. Order-insensitive token Jaccard
    const jaccard = orderInsensitiveScore(normCDL, normDYN);
    if (jaccard > 0.3) {
      score += jaccard * 0.35;
      reasons.push(`token_jaccard:${jaccard.toFixed(2)}`);
    }

    // 4. Levenshtein similarity on full normalized string
    const levSim = normalizedLevenshtein(normCDL, normDYN);
    if (levSim > 0.6) {
      score += levSim * 0.15;
      reasons.push(`levenshtein:${levSim.toFixed(2)}`);
    }

    // 5. Synonym expansion bonus
    const synBonus = synonymScore(normCDL, normDYN);
    if (synBonus > 0) {
      score += synBonus;
      reasons.push('synonym_match');
    }

    // 6. Profile pattern matching
    const patternSc = profilePatternScore(normCDL, normDYN);
    if (patternSc > 0.5) {
      score += patternSc * 0.15;
      reasons.push(`profile_pattern:${patternSc.toFixed(2)}`);
    }

    // 7. Containment score (one name contains most words of the other)
    const containSc = containmentScore(normCDL, normDYN);
    if (containSc > 0.7) {
      score += containSc * 0.10;
      reasons.push(`containment:${containSc.toFixed(2)}`);
    }
  }

  // 8. Same type bonus (profile-profile or individual-individual)
  if (cdlTest.type === dynTest.type) {
    score += 0.02;
  }

  // 9. Component overlap (if both have components)
  if (cdlTest.components && dynTest.components &&
      cdlTest.components.length > 0 && dynTest.components.length > 0) {
    const compSetA = new Set(cdlTest.components.map(normalize));
    const compSetB = new Set(dynTest.components.map(normalize));
    const compJaccard = jaccardSimilarity(compSetA, compSetB);
    if (compJaccard > 0) {
      score += compJaccard * 0.20;
      reasons.push(`component_overlap:${compJaccard.toFixed(2)}`);
    }
  }

  return { score: Math.min(score, 1.0), reasons };
}

// ─── Pre-compute normalizations ───
console.log('Pre-computing normalizations...');
const cdlNorm = cdl.map(t => normalize(t.raw_name));
const dynNorm = dyn.map(t => normalize(t.raw_name));
const cdlTokens = cdlNorm.map(n => new Set(n.split(/\s+/).filter(w => w.length > 0)));
const dynTokens = dynNorm.map(n => new Set(n.split(/\s+/).filter(w => w.length > 0)));

// ─── Optimized matching function using pre-computed values ───
function computeMatchScoreFast(cIdx, dIdx) {
  const normCDL = cdlNorm[cIdx];
  const normDYN = dynNorm[dIdx];
  const cdlTest = cdl[cIdx];
  const dynTest = dyn[dIdx];

  // Pre-check: block known false positives
  if (isBlockedPair(normCDL, normDYN)) {
    return { score: 0, reasons: ['blocked_false_positive'] };
  }

  // Pre-check: number conflict (e.g. #1 vs #6)
  if (hasNumberConflict(normCDL, normDYN) && cdlTest.code !== dynTest.code) {
    return { score: 0, reasons: ['number_conflict'] };
  }

  let score = 0;
  let reasons = [];

  // 1. Exact code match
  if (cdlTest.code === dynTest.code) {
    score += 0.50;
    reasons.push('exact_code_match');
  }

  // 2. Normalized name exact match
  if (normCDL === normDYN) {
    score += 0.45;
    reasons.push('exact_name_match');
  } else {
    // 3. Token Jaccard (using pre-computed token sets)
    const jaccard = jaccardSimilarity(cdlTokens[cIdx], dynTokens[dIdx]);
    if (jaccard > 0.3) {
      score += jaccard * 0.35;
      reasons.push(`token_jaccard:${jaccard.toFixed(2)}`);
    }

    // 4. Levenshtein - only compute if strings are similar length (optimization)
    const lenRatio = Math.min(normCDL.length, normDYN.length) / Math.max(normCDL.length, normDYN.length);
    if (lenRatio > 0.5) {
      const levSim = normalizedLevenshtein(normCDL, normDYN);
      if (levSim > 0.6) {
        score += levSim * 0.15;
        reasons.push(`levenshtein:${levSim.toFixed(2)}`);
      }
    }

    // 5. Synonym bonus
    const synBonus = synonymScore(normCDL, normDYN);
    if (synBonus > 0) {
      score += synBonus;
      reasons.push('synonym_match');
    }

    // 6. Profile pattern
    const patternSc = profilePatternScore(normCDL, normDYN);
    if (patternSc > 0.5) {
      score += patternSc * 0.15;
      reasons.push(`profile_pattern:${patternSc.toFixed(2)}`);
    }

    // 7. Containment
    const containSc = containmentScore(normCDL, normDYN);
    if (containSc > 0.7) {
      score += containSc * 0.10;
      reasons.push(`containment:${containSc.toFixed(2)}`);
    }
  }

  // 8. Same type bonus
  if (cdlTest.type === dynTest.type) {
    score += 0.02;
  }

  return { score: Math.min(score, 1.0), reasons };
}

// ─── Run matching ───
console.log('Running matching...');

const MATCH_THRESHOLD = 0.35;
const matchedPairs = [];
const cdlMatched = new Set();
const dynMatched = new Set();
const conflicts = [];

// Build code index for fast code-based lookup
const cdlByCode = {};
cdl.forEach((t, i) => { cdlByCode[t.code] = i; });

const dynBestMatches = new Map();

for (let d = 0; d < dyn.length; d++) {
  if (d % 20 === 0) process.stdout.write(`  Processing Dynacare ${d}/${dyn.length}\r`);
  const candidates = [];

  for (let c = 0; c < cdl.length; c++) {
    const { score, reasons } = computeMatchScoreFast(c, d);
    if (score >= MATCH_THRESHOLD) {
      candidates.push({ cdlIdx: c, score, reasons });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  dynBestMatches.set(d, candidates);
}
console.log('');

// Greedy assignment: prioritize highest-confidence matches
const allPairs = [];
for (const [dynIdx, candidates] of dynBestMatches.entries()) {
  for (const cand of candidates) {
    allPairs.push({ dynIdx, cdlIdx: cand.cdlIdx, score: cand.score, reasons: cand.reasons });
  }
}
allPairs.sort((a, b) => b.score - a.score);

for (const pair of allPairs) {
  if (cdlMatched.has(pair.cdlIdx) || dynMatched.has(pair.dynIdx)) {
    // Check for conflict (if the Dynacare test matched something else with similar score)
    continue;
  }

  cdlMatched.add(pair.cdlIdx);
  dynMatched.add(pair.dynIdx);

  matchedPairs.push({
    lab_a: {
      lab: 'CDL',
      code: cdl[pair.cdlIdx].code,
      raw_name: cdl[pair.cdlIdx].raw_name,
      type: cdl[pair.cdlIdx].type,
      price: cdl[pair.cdlIdx].price
    },
    lab_b: {
      lab: 'Dynacare',
      code: dyn[pair.dynIdx].code,
      raw_name: dyn[pair.dynIdx].raw_name,
      type: dyn[pair.dynIdx].type,
      price: dyn[pair.dynIdx].price
    },
    confidence: Math.round(pair.score * 100) / 100,
    match_reasons: pair.reasons
  });
}

// Check for conflicts (Dynacare tests that had multiple strong CDL candidates)
for (const [dynIdx, candidates] of dynBestMatches.entries()) {
  if (candidates.length >= 2) {
    const top = candidates[0];
    const second = candidates[1];
    // If second best is within 15% of top and both above threshold
    if (second.score >= MATCH_THRESHOLD && (top.score - second.score) < 0.15) {
      conflicts.push({
        dynacare_test: {
          code: dyn[dynIdx].code,
          raw_name: dyn[dynIdx].raw_name
        },
        competing_cdl_matches: candidates.slice(0, 3).map(c => ({
          code: cdl[c.cdlIdx].code,
          raw_name: cdl[c.cdlIdx].raw_name,
          confidence: Math.round(c.score * 100) / 100,
          reasons: c.reasons
        }))
      });
    }
  }
}

// Unmatched
const unmatchedCDL = cdl
  .filter((_, i) => !cdlMatched.has(i))
  .map(t => ({ code: t.code, raw_name: t.raw_name, type: t.type, price: t.price }));

const unmatchedDynacare = dyn
  .filter((_, i) => !dynMatched.has(i))
  .map(t => ({ code: t.code, raw_name: t.raw_name, type: t.type, price: t.price }));

// ─── Canonical groups ───
// Group matched pairs by medical concept
function extractCanonicalName(cdlName, dynName) {
  const normA = normalize(cdlName);
  const normB = normalize(dynName);
  // Use the shorter one as canonical, or the one without "Profil"
  const a = normA.replace(/\s+/g, ' ').trim();
  const b = normB.replace(/\s+/g, ' ').trim();
  return a.length <= b.length ? a : b;
}

const canonicalGroups = {};
matchedPairs.forEach(pair => {
  const canonical = extractCanonicalName(pair.lab_a.raw_name, pair.lab_b.raw_name);

  // Group by medical category
  let category = 'General';
  const cn = canonical.toLowerCase();
  if (cn.includes('thyro') || cn.includes('tsh') || cn.includes('t3') || cn.includes('t4')) category = 'Thyroid';
  else if (cn.includes('hepat') || cn.includes('foie') || cn.includes('liver') || cn.includes('alt') || cn.includes('ast') || cn.includes('ggt') || cn.includes('bilirubine')) category = 'Hepatic/Liver';
  else if (cn.includes('renal') || cn.includes('ren') || cn.includes('creatinine') || cn.includes('uree')) category = 'Renal/Kidney';
  else if (cn.includes('fer ') || cn.includes('iron') || cn.includes('ferritin') || cn.includes('anem')) category = 'Iron/Anemia';
  else if (cn.includes('coag') || cn.includes('pt') || cn.includes('ptt') || cn.includes('fibr') || cn.includes('inr')) category = 'Coagulation';
  else if (cn.includes('diab') || cn.includes('glucose') || cn.includes('hba1c') || cn.includes('insuline')) category = 'Diabetes';
  else if (cn.includes('lipid') || cn.includes('cholesterol') || cn.includes('triglyceri') || cn.includes('hdl') || cn.includes('ldl') || cn.includes('cardiovasc')) category = 'Lipids/Cardiovascular';
  else if (cn.includes('prenatal') || cn.includes('pren')) category = 'Prenatal';
  else if (cn.includes('vitamine') || cn.includes('vit ') || cn.includes('b12') || cn.includes('folique') || cn.includes('folate')) category = 'Vitamins';
  else if (cn.includes('anticorps') || cn.includes('anti ') || cn.includes('ana') || cn.includes('immunoglobuline')) category = 'Immunology/Antibodies';
  else if (cn.includes('culture') || cn.includes('chlamydia') || cn.includes('gonorrhee') || cn.includes('urine')) category = 'Microbiology/Urinalysis';
  else if (cn.includes('hormone') || cn.includes('prolactine') || cn.includes('testosterone') || cn.includes('estradiol') || cn.includes('progesterone') || cn.includes('fsh') || cn.includes('lh') || cn.includes('fertili')) category = 'Hormones/Fertility';
  else if (cn.includes('tumeur') || cn.includes('ca 1') || cn.includes('cea') || cn.includes('psa') || cn.includes('afp') || cn.includes('marqueur')) category = 'Tumor Markers';
  else if (cn.includes('electrolyte') || cn.includes('sodium') || cn.includes('potassium') || cn.includes('calcium') || cn.includes('magnesium') || cn.includes('phospho')) category = 'Electrolytes/Minerals';
  else if (cn.includes('biochim') || cn.includes('bio') || cn.includes('sma') || cn.includes('general') || cn.includes('complet')) category = 'Biochemistry Panels';

  if (!canonicalGroups[category]) canonicalGroups[category] = [];
  canonicalGroups[category].push({
    canonical_name: canonical,
    members: [
      { lab: 'CDL', code: pair.lab_a.code, raw_name: pair.lab_a.raw_name },
      { lab: 'Dynacare', code: pair.lab_b.code, raw_name: pair.lab_b.raw_name }
    ]
  });
});

// ─── Build output ───
const output = {
  metadata: {
    generated_at: new Date().toISOString(),
    lab_a: 'CDL',
    lab_b: 'Dynacare',
    lab_a_total_tests: cdl.length,
    lab_b_total_tests: dyn.length,
    total_matched: matchedPairs.length,
    total_unmatched_lab_a: unmatchedCDL.length,
    total_unmatched_lab_b: unmatchedDynacare.length,
    total_conflicts: conflicts.length,
    match_threshold: MATCH_THRESHOLD
  },
  matched_pairs: matchedPairs.sort((a, b) => b.confidence - a.confidence),
  unmatched_in_lab_a: unmatchedCDL,
  unmatched_in_lab_b: unmatchedDynacare,
  potential_canonical_groups: canonicalGroups,
  conflicts: conflicts
};

fs.writeFileSync('lab_matching_results.json', JSON.stringify(output, null, 2), 'utf8');

// ─── Summary ───
console.log('\n=== MATCHING SUMMARY ===');
console.log(`CDL tests (deduplicated): ${cdl.length}`);
console.log(`Dynacare tests: ${dyn.length}`);
console.log(`Matched pairs: ${matchedPairs.length}`);
console.log(`Unmatched CDL: ${unmatchedCDL.length}`);
console.log(`Unmatched Dynacare: ${unmatchedDynacare.length}`);
console.log(`Conflicts: ${conflicts.length}`);
console.log(`Canonical groups: ${Object.keys(canonicalGroups).length}`);

console.log('\n=== CONFIDENCE DISTRIBUTION ===');
const bins = { '0.90-1.00': 0, '0.80-0.89': 0, '0.70-0.79': 0, '0.60-0.69': 0, '0.50-0.59': 0, '0.35-0.49': 0 };
matchedPairs.forEach(p => {
  if (p.confidence >= 0.90) bins['0.90-1.00']++;
  else if (p.confidence >= 0.80) bins['0.80-0.89']++;
  else if (p.confidence >= 0.70) bins['0.70-0.79']++;
  else if (p.confidence >= 0.60) bins['0.60-0.69']++;
  else if (p.confidence >= 0.50) bins['0.50-0.59']++;
  else bins['0.35-0.49']++;
});
Object.entries(bins).forEach(([range, count]) => console.log(`  ${range}: ${count}`));

console.log('\n=== TOP 10 MATCHED PAIRS ===');
matchedPairs.slice(0, 10).forEach(p => {
  console.log(`  [${p.confidence}] ${p.lab_a.code}:"${p.lab_a.raw_name}" <-> ${p.lab_b.code}:"${p.lab_b.raw_name}" (${p.match_reasons.join(', ')})`);
});

console.log('\n=== LOWEST CONFIDENCE MATCHES (bottom 10) ===');
matchedPairs.slice(-10).forEach(p => {
  console.log(`  [${p.confidence}] ${p.lab_a.code}:"${p.lab_a.raw_name}" <-> ${p.lab_b.code}:"${p.lab_b.raw_name}" (${p.match_reasons.join(', ')})`);
});

console.log('\n=== CONFLICTS (top 5) ===');
conflicts.slice(0, 5).forEach(c => {
  console.log(`  Dynacare ${c.dynacare_test.code}:"${c.dynacare_test.raw_name}"`);
  c.competing_cdl_matches.forEach(m => {
    console.log(`    -> CDL ${m.code}:"${m.raw_name}" [${m.confidence}]`);
  });
});

console.log('\n=== UNMATCHED DYNACARE (sample) ===');
unmatchedDynacare.slice(0, 15).forEach(t => {
  console.log(`  ${t.code}: ${t.raw_name}`);
});

console.log('\nResults written to lab_matching_results.json');
