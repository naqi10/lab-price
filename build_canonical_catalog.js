/**
 * Canonical Test Catalog Builder
 * ================================
 * Creates a standardized medical test catalog from:
 *   - CDL (final_cdl.json) — enriched with specimen data from new.json
 *   - Dynacare (final_dynacare.json)
 *
 * Architecture:
 *   1. Each unique (code + lab) = one distinct test offering
 *   2. Matching is STRICTLY cross-lab (CDL <-> Dynacare)
 *   3. Within the same lab, different codes are ALWAYS different tests
 *   4. Different specimen variants (serum vs urine, 24h vs random) are SEPARATE
 *   5. Original data fields are NEVER modified
 *
 * Output: A canonical catalog where each entry has:
 *   - A canonical medical concept name
 *   - Offerings from CDL and/or Dynacare
 */

const fs = require('fs');

// ─── Load datasets ───
const cdlRaw = require('./final_cdl.json');
const dynRaw = require('./final_dynacare.json');
const qcRaw = require('./app/new.json');

// ─── Deduplicate CDL (prefer non-null category) ───
function deduplicateCDL(entries) {
  const byCode = {};
  entries.forEach(t => {
    if (!byCode[t.code]) {
      byCode[t.code] = t;
    } else if (t.category !== null && byCode[t.code].category === null) {
      byCode[t.code] = t;
    }
  });
  return Object.values(byCode);
}

const cdl = deduplicateCDL(cdlRaw);
const dyn = dynRaw;

// ─── Enrich CDL with specimen collection data from new.json ───
const qcByCode = {};
qcRaw.forEach(t => { qcByCode[t.code] = t; });

let enrichedCount = 0;
cdl.forEach(t => {
  const specimen = qcByCode[t.code];
  if (specimen) {
    t.tube = specimen.tube || null;
    t.temperature = specimen.temperature || null;
    t.turnaroundTime = specimen.turnaroundTime || null;
    enrichedCount++;
  }
});

console.log(`CDL: ${cdl.length} (${enrichedCount} enriched with specimen data)`);
console.log(`Dynacare: ${dyn.length}`);

// ═══════════════════════════════════════════════
// SECTION 1: TEXT NORMALIZATION
// ═══════════════════════════════════════════════

function normalize(str) {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[''`]/g, "'")
    .replace(/[#]/g, ' ')
    .replace(/\bPROFIL\b/g, '')
    .replace(/\bNO\s*/g, '')
    .replace(/\bDE\s+LA\b/g, '')
    .replace(/\bDE\s+L'/g, '')
    .replace(/\bDU\b/g, '')
    .replace(/\bDES\b/g, '')
    .replace(/\bDE\b/g, '')
    .replace(/\bD'/g, '')
    .replace(/\bET\b/g, '')
    .replace(/\bLE\b/g, '')
    .replace(/\bLA\b/g, '')
    .replace(/\bLES\b/g, '')
    .replace(/\bDIRIGES?\s+CONTRE\b/g, '')
    .replace(/\bAVEC\b/g, '')
    .replace(/\bPAR\b/g, '')
    .replace(/\bAU\b/g, '')
    .replace(/\bEN\b/g, '')
    .replace(/\bTYPES?\b/g, '')
    .replace(/[()[\],.:;\/\-+&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str) {
  return normalize(str).split(/\s+/).filter(w => w.length > 0);
}

// ═══════════════════════════════════════════════
// SECTION 2: SPECIMEN TYPE EXTRACTION
// ═══════════════════════════════════════════════

const SPECIMEN_PATTERNS = [
  // 24-hour urine (must be checked BEFORE general urine)
  { regex: /URINE[S]?\s*(DE\s+)?24\s*H/i, specimen: 'URINE_24H' },
  { regex: /24\s*H(EURES?)?\s*(D[''E]\s*)?URINE/i, specimen: 'URINE_24H' },
  { regex: /URINES\s+DE\s+24\s+HEURES/i, specimen: 'URINE_24H' },
  { regex: /URINAIRE.*24H/i, specimen: 'URINE_24H' },

  // Random/spot urine
  { regex: /URINE\s+AU\s+HASARD/i, specimen: 'URINE_RANDOM' },
  { regex: /URINE\s+AL[EÉ]ATOIRE/i, specimen: 'URINE_RANDOM' },

  // General urine (must check after 24H and random)
  { regex: /\bURINE[S]?\b/i, specimen: 'URINE' },
  { regex: /\bURINAIRE\b/i, specimen: 'URINE' },

  // Whole blood
  { regex: /SANG\s+ENTIER/i, specimen: 'WHOLE_BLOOD' },

  // Plasma (explicit)
  { regex: /\bPLASMA\b/i, specimen: 'PLASMA' },

  // Serum (explicit)
  { regex: /\bS[ÉE]RUM\b/i, specimen: 'SERUM' },

  // Stool
  { regex: /\bSELLES\b/i, specimen: 'STOOL' },

  // Culture sites
  { regex: /\bGORGE\b/i, specimen: 'THROAT' },
  { regex: /\bVAGINAL/i, specimen: 'VAGINAL' },
  { regex: /\bCERVICAL/i, specimen: 'CERVICAL' },
  { regex: /\bRECTAL/i, specimen: 'RECTAL' },
  { regex: /\bNEZ\b|\bNASAL/i, specimen: 'NASAL' },
  { regex: /\bPLAIE|WOUND/i, specimen: 'WOUND' },
  { regex: /\bCRACHAT|SPUTUM/i, specimen: 'SPUTUM' },

  // RBC
  { regex: /GLOBULES\s+ROUGES/i, specimen: 'RBC' },

  // Hair
  { regex: /\bCHEVEUX\b/i, specimen: 'HAIR' },
];

function extractSpecimen(rawName) {
  const name = rawName.toUpperCase();
  for (const pat of SPECIMEN_PATTERNS) {
    if (pat.regex.test(name)) {
      return pat.specimen;
    }
  }
  return 'DEFAULT';
}

// ═══════════════════════════════════════════════
// SECTION 3: SIMILARITY FUNCTIONS
// ═══════════════════════════════════════════════

function jaccardSimilarity(setA, setB) {
  const a = setA instanceof Set ? setA : new Set(setA);
  const b = setB instanceof Set ? setB : new Set(setB);
  let intersection = 0;
  a.forEach(v => { if (b.has(v)) intersection++; });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
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

const MEDICAL_SYNONYMS = {
  'B12': ['VITAMINE B12', 'CYANOCOBALAMINE', 'VIT B12', 'VITB12', 'VB12'],
  'VITAMINE B12': ['B12', 'CYANOCOBALAMINE', 'VITB12', 'VB12'],
  'ACIDE FOLIQUE': ['FOLATE', 'FOL', 'VITAMINE B9'],
  'FOLATE': ['ACIDE FOLIQUE', 'FOL'],
  'VITAMINE D': ['25 HYDROXY VITAMINE D', 'CHOLECALCIFEROL', '25 OH D'],
  '25 HYDROXY VITAMINE D': ['VITAMINE D', '25 OH D'],
  'VITAMINE C': ['ACIDE ASCORBIQUE'],
  'ACIDE ASCORBIQUE': ['VITAMINE C'],
  'TSH': ['THYREOSTIMULINE', 'TSH ULTRASENSIBLE'],
  'TSH ULTRASENSIBLE': ['TSH', 'THYREOSTIMULINE'],
  'THYROIDE': ['THYROIDIEN'],
  'THYROIDIEN': ['THYROIDE'],
  'FORMULE SANGUINE COMPLETE': ['FSC', 'CBC', 'HEMOGRAMME'],
  'FSC': ['CBC', 'HEMOGRAMME', 'FORMULE SANGUINE COMPLETE'],
  'CBC': ['FSC', 'HEMOGRAMME'],
  'HEPATIQUE': ['LIVER', 'LFT'],
  'CREATININE': ['CREA'],
  'UREE': ['BUN', 'AZOTE UREIQUE'],
  'COAGULOGRAMME': ['COAG'],
  'HEMOGLOBINE A1C': ['HBA1C', 'A1C'],
  'PROLACTINE': ['PROL', 'PRLA'],
  'PROGESTERONE': ['PROG'],
  'ESTRADIOL': ['E2', 'ESTR'],
  'TESTOSTERONE': ['TEST'],
  'LH': ['HORMONE LUTEINISANTE'],
  'FSH': ['HORMONE FOLLICULOSTIMULANTE'],
  'DHEAS': ['DHEA S', 'DH S'],
  'ANA': ['ANTICORPS ANTINUCLEAIRES'],
  'CRP': ['PROTEINE C REACTIVE'],
  'PROTEINE C REACTIVE HAUTE SENSIBILITE': ['CRPHS'],
  'PSA': ['APS', 'ANTIGENE PROSTATIQUE SPECIFIQUE'],
  'CEA': ['ACE', 'ANTIGENE CARCINO EMBRYONNAIRE'],
  'SODIUM': ['NA'],
  'POTASSIUM': ['K'],
  'CHLORURE': ['CL', 'CHLORURES'],
  'CALCIUM': ['CA'],
  'MAGNESIUM': ['MG'],
  'PHOSPHORE': ['PHOSPHATE', 'PO4', 'PHOS'],
  'SEDIMENTATION': ['SED', 'VS', 'ESR', 'VITESSE SEDIMENTATION'],
  'VITESSE SEDIMENTATION': ['SED', 'VS', 'ESR'],
  'LACTATE DESHYDROGENASE': ['LDH', 'LD'],
  'CREATINE KINASE': ['CK', 'CPK'],
  'CALCITONINE': ['CALCI', 'CLTN'],
  'CERULOPLASMINE': ['CERU', 'CUBP'],
  'BIOCHIMIE': ['BIO', 'BIOCHEMISTRY', 'SMA'],
  'FERTILITE': ['FERT'],
  'PRENATAL': ['PREN'],
  'ANEMIE': ['ANEM'],
  'MONOTEST': ['MONONUCLEOSE', 'MONO'],
  'FERRITINE': ['FERR'],
  'FIBRINOGENE': ['FIB', 'FIBR'],
  'ALBUMINE': ['ALB'],
  'TRANSFERRINE': ['TRFN'],
};

function synonymScore(normA, normB) {
  for (const [key, synonyms] of Object.entries(MEDICAL_SYNONYMS)) {
    const normKey = normalize(key);
    const normSyns = synonyms.map(s => normalize(s));
    const allForms = [normKey, ...normSyns];
    for (const formA of allForms) {
      for (const formB of allForms) {
        if (formA === formB) continue;
        if (normA.includes(formA) && normB.includes(formB)) return 0.3;
      }
    }
  }
  return 0;
}

// ═══════════════════════════════════════════════
// SECTION 4: FALSE POSITIVE GUARDS
// ═══════════════════════════════════════════════

function hasWord(str, word) {
  return new RegExp('\\b' + word + '\\b').test(str);
}

function extractNumbers(str) {
  const nums = str.match(/\b(\d+)\b/g);
  return nums ? nums.map(Number) : [];
}

function isBlockedPair(normA, normB) {
  const strA = tokenize(normA).join(' ');
  const strB = tokenize(normB).join(' ');

  // FER ≠ FERTILITE
  const ironFertBlocks = [['FER', 'FERTILITE'], ['FER', 'FERT'], ['IRON', 'FERTILITE'], ['IRON', 'FERT']];
  for (const [wA, wB] of ironFertBlocks) {
    if ((hasWord(strA, wA) && !hasWord(strA, wB) && hasWord(strB, wB) && !hasWord(strB, wA)) ||
        (hasWord(strB, wA) && !hasWord(strB, wB) && hasWord(strA, wB) && !hasWord(strA, wA))) {
      return true;
    }
  }

  // Screening panels ≠ single tests
  const aScreen = strA.includes('DEPISTAGE') || strA.includes('SCREENING');
  const bScreen = strB.includes('DEPISTAGE') || strB.includes('SCREENING');
  if (aScreen !== bScreen) {
    const other = aScreen ? strB : strA;
    if (other.includes('TOTAL') || other.includes('IGG') || other.includes('IGM') || other.includes('AIGU')) {
      return true;
    }
  }
  return false;
}

function hasNumberConflict(normA, normB) {
  const numsA = extractNumbers(normA);
  const numsB = extractNumbers(normB);
  if (numsA.length === 1 && numsB.length === 1) return numsA[0] !== numsB[0];
  return false;
}

// ═══════════════════════════════════════════════
// SECTION 5: CROSS-LAB MATCH SCORING
// ═══════════════════════════════════════════════

function computeScore(cdlTest, dynTest) {
  const normA = normalize(cdlTest.raw_name);
  const normB = normalize(dynTest.raw_name);

  if (isBlockedPair(normA, normB)) return { score: 0, reasons: ['blocked'] };
  if (hasNumberConflict(normA, normB) && cdlTest.code !== dynTest.code) {
    return { score: 0, reasons: ['number_conflict'] };
  }

  // Specimen compatibility check — but BYPASS if codes match exactly
  // (same code = same test, even if one lab omits specimen info from name)
  const specA = extractSpecimen(cdlTest.raw_name);
  const specB = extractSpecimen(dynTest.raw_name);
  const codeMatch = cdlTest.code === dynTest.code;
  if (specA !== specB && !codeMatch) {
    const ok = (specA === 'DEFAULT' && specB === 'SERUM') ||
               (specB === 'DEFAULT' && specA === 'SERUM') ||
               (specA === 'DEFAULT' && specB === 'DEFAULT');
    if (!ok) return { score: 0, reasons: ['specimen_mismatch'] };
  }

  let score = 0;
  let reasons = [];

  // 1. Exact code match (strongest signal)
  if (cdlTest.code === dynTest.code) {
    score += 0.50;
    reasons.push('exact_code');
  }

  // 2. Name similarity
  if (normA === normB) {
    score += 0.45;
    reasons.push('exact_name');
  } else {
    const tokA = new Set(tokenize(normA));
    const tokB = new Set(tokenize(normB));

    const jaccard = jaccardSimilarity(tokA, tokB);
    if (jaccard > 0.3) {
      score += jaccard * 0.35;
      reasons.push(`jaccard:${jaccard.toFixed(2)}`);
    }

    const lenRatio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
    if (lenRatio > 0.5) {
      const levSim = normalizedLevenshtein(normA, normB);
      if (levSim > 0.6) {
        score += levSim * 0.15;
        reasons.push(`lev:${levSim.toFixed(2)}`);
      }
    }

    const synB = synonymScore(normA, normB);
    if (synB > 0) {
      score += synB;
      reasons.push('synonym');
    }

    // Containment: one name's tokens are a subset of the other
    let matchCount = 0;
    const smaller = tokA.size <= tokB.size ? tokA : tokB;
    const larger = tokA.size <= tokB.size ? tokB : tokA;
    smaller.forEach(w => { if (larger.has(w)) matchCount++; });
    const cont = smaller.size > 0 ? matchCount / smaller.size : 0;
    if (cont > 0.7) {
      score += cont * 0.10;
      reasons.push(`contain:${cont.toFixed(2)}`);
    }
  }

  // 3. Same type bonus
  if (cdlTest.type && dynTest.type && cdlTest.type === dynTest.type) {
    score += 0.02;
  }

  return { score: Math.min(score, 1.0), reasons };
}

// ═══════════════════════════════════════════════
// SECTION 6: 1:1 CROSS-LAB MATCHING
// ═══════════════════════════════════════════════

console.log('Running 1:1 cross-lab matching...');

const MATCH_THRESHOLD = 0.35;

// Pre-compute normalizations
const cdlNorm = cdl.map(t => normalize(t.raw_name));
const dynNorm = dyn.map(t => normalize(t.raw_name));

// For each Dynacare test, find all CDL candidates above threshold
const dynCandidates = new Map(); // dynIdx -> [{cdlIdx, score, reasons}]

for (let d = 0; d < dyn.length; d++) {
  if (d % 20 === 0) process.stdout.write(`  Scoring Dynacare ${d}/${dyn.length}\r`);
  const candidates = [];
  for (let c = 0; c < cdl.length; c++) {
    const { score, reasons } = computeScore(cdl[c], dyn[d]);
    if (score >= MATCH_THRESHOLD) {
      candidates.push({ cdlIdx: c, score, reasons });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  dynCandidates.set(d, candidates);
}
console.log('');

// Greedy 1:1 assignment (Hungarian-lite): highest-scoring pairs first
const allPotentialPairs = [];
for (const [dynIdx, candidates] of dynCandidates.entries()) {
  for (const cand of candidates) {
    allPotentialPairs.push({ dynIdx, cdlIdx: cand.cdlIdx, score: cand.score, reasons: cand.reasons });
  }
}
allPotentialPairs.sort((a, b) => b.score - a.score);

const cdlMatched = new Set();  // CDL indices already matched
const dynMatched = new Set();  // Dynacare indices already matched
const matchedPairs = [];       // final 1:1 matches
const conflicts = [];          // ambiguous matches

for (const pair of allPotentialPairs) {
  if (cdlMatched.has(pair.cdlIdx) || dynMatched.has(pair.dynIdx)) continue;
  cdlMatched.add(pair.cdlIdx);
  dynMatched.add(pair.dynIdx);
  matchedPairs.push(pair);
}

// Detect conflicts (Dynacare test with multiple strong CDL candidates close in score)
for (const [dynIdx, candidates] of dynCandidates.entries()) {
  if (candidates.length >= 2 && candidates[0].score - candidates[1].score < 0.15) {
    conflicts.push({
      dynacare: { code: dyn[dynIdx].code, raw_name: dyn[dynIdx].raw_name },
      cdl_candidates: candidates.slice(0, 3).map(c => ({
        code: cdl[c.cdlIdx].code, raw_name: cdl[c.cdlIdx].raw_name,
        score: Math.round(c.score * 100) / 100, reasons: c.reasons
      }))
    });
  }
}

console.log(`Matched pairs: ${matchedPairs.length}`);
console.log(`Unmatched CDL: ${cdl.length - cdlMatched.size}`);
console.log(`Unmatched Dynacare: ${dyn.length - dynMatched.size}`);
console.log(`Conflicts: ${conflicts.length}`);

// ═══════════════════════════════════════════════
// SECTION 7: BUILD CANONICAL CATALOG
// ═══════════════════════════════════════════════

console.log('Building canonical catalog...');

function classifyCategory(name) {
  const n = normalize(name).toLowerCase();
  if (n.includes('thyro') || n.includes('tsh') || n.match(/\bt[34]\b/)) return 'Thyroid';
  if (n.includes('hepat') || n.includes('foie') || n.includes('liver') || (n.match(/\balt\b/) && !n.includes('anti')) || n.match(/\bast\b/) || n.match(/\bggt\b/) || n.includes('bilirubine')) return 'Hepatic/Liver';
  if (n.includes('renal') || (n.includes('creatinine') && !n.includes('kinase')) || n.includes('uree') || n.includes('bun')) return 'Renal/Kidney';
  if (n.match(/\bfer\b/) || n.includes('iron') || n.includes('ferritin') || n.includes('anem') || n.includes('transferrin')) return 'Iron/Anemia';
  if (n.includes('coag') || n.includes('fibr') || n.match(/\binr\b/) || n.match(/\bptt?\b/) || n.includes('dimere') || n.includes('plaquette')) return 'Coagulation';
  if (n.includes('diab') || n.includes('glucose') || n.includes('hba1c') || n.includes('insuline') || n.includes('a1c')) return 'Diabetes/Glucose';
  if (n.includes('lipid') || n.includes('cholesterol') || n.includes('triglyceri') || n.includes('hdl') || n.includes('ldl') || n.includes('cardiovasc')) return 'Lipids/Cardiovascular';
  if (n.includes('prenatal') || n.includes('pren')) return 'Prenatal';
  if (n.includes('vitamine') || n.includes('vit ') || n.includes('b12') || n.includes('folique') || n.includes('folate') || n.includes('acide ascorb')) return 'Vitamins';
  if (n.includes('anticorps') || n.includes('anti ') || n.match(/\bana\b/) || n.includes('immunoglobuline') || n.includes('complement') || n.includes('lupus')) return 'Immunology/Antibodies';
  if (n.includes('culture') || n.includes('chlamydia') || n.includes('gonorrh') || n.includes('strep') || n.includes('clostridium')) return 'Microbiology';
  if (n.includes('hormone') || n.includes('prolactine') || n.includes('testosterone') || n.includes('estradiol') || n.includes('progesterone') || n.match(/\bfsh\b/) || n.match(/\blh\b/) || n.includes('fertili') || n.includes('menopause') || n.includes('dhea') || n.includes('cortisol') || n.includes('aldoster')) return 'Hormones/Endocrine';
  if (n.includes('ca 1') || n.includes('cea') || n.includes('psa') || n.includes('afp') || n.includes('carcino') || n.includes('marqueur')) return 'Tumor Markers';
  if (n.includes('electrolyte') || n.includes('sodium') || n.includes('potassium') || n.includes('calcium') || n.includes('magnesium') || n.includes('phospho') || n.includes('chlor')) return 'Electrolytes/Minerals';
  if (n.includes('biochim') || n.includes('sma') || n.includes('general') || n.includes('complet')) return 'Biochemistry Panels';
  if (n.includes('urine') || n.includes('urinaire')) return 'Urinalysis';
  if (n.includes('drogue') || n.includes('cannabis') || n.includes('cocaine') || n.includes('opiac') || n.includes('ampheta')) return 'Toxicology';
  if (n.includes('hepatite') || n.includes('vih') || n.includes('hiv') || n.includes('syphilis') || n.includes('herpes')) return 'Infectious Disease';
  if (n.includes('pap') || n.includes('cytologie') || n.includes('biopsie')) return 'Cytology/Pathology';
  if (n.includes('echographie') || n.includes('ecg') || n.includes('holter')) return 'Imaging/Diagnostics';
  return 'General';
}

function specimenLabel(spec) {
  const labels = {
    'DEFAULT': null,
    'SERUM': 'Serum',
    'URINE': 'Urine',
    'URINE_24H': 'Urine 24h',
    'URINE_RANDOM': 'Urine Random',
    'WHOLE_BLOOD': 'Whole Blood',
    'PLASMA': 'Plasma',
    'STOOL': 'Stool',
    'THROAT': 'Throat',
    'VAGINAL': 'Vaginal',
    'CERVICAL': 'Cervical',
    'RECTAL': 'Rectal',
    'NASAL': 'Nasal',
    'WOUND': 'Wound',
    'SPUTUM': 'Sputum',
    'CSF': 'CSF',
    'RBC': 'RBC',
    'HAIR': 'Hair',
  };
  return labels[spec] || spec;
}

function buildOffering(test, lab) {
  const offering = {
    lab: lab,
    code: test.code,
    raw_name: test.raw_name,
    type: test.type || 'individual',
    category: test.category || null,
    price: test.price,
  };
  // Preserve enriched specimen data (CDL)
  if (test.tube) offering.tube = test.tube;
  if (test.temperature) offering.temperature = test.temperature;
  if (test.turnaroundTime) offering.turnaroundTime = test.turnaroundTime;
  // Preserve components
  if (test.components && test.components.length > 0) offering.components = test.components;
  return offering;
}

const catalog = [];
let canonId = 0;

// 1. Matched pairs → canonical concepts with both labs
for (const pair of matchedPairs) {
  const cdlTest = cdl[pair.cdlIdx];
  const dynTest = dyn[pair.dynIdx];
  const specimen = extractSpecimen(cdlTest.raw_name);
  const specLabel = specimenLabel(specimen);

  // Use the shorter normalized name as canonical
  const normA = normalize(cdlTest.raw_name);
  const normB = normalize(dynTest.raw_name);
  const canonName = normA.length <= normB.length ? normA : normB;
  const fullName = specLabel ? `${canonName} [${specLabel}]` : canonName;

  canonId++;
  catalog.push({
    canonical_id: `CAN-${String(canonId).padStart(4, '0')}`,
    canonical_name: fullName,
    medical_category: classifyCategory(cdlTest.raw_name),
    specimen_type: specimen,
    match_confidence: Math.round(pair.score * 100) / 100,
    match_reasons: pair.reasons,
    offerings: {
      CDL: buildOffering(cdlTest, 'CDL'),
      Dynacare: buildOffering(dynTest, 'Dynacare'),
    }
  });
}

// 2. Unmatched CDL tests → CDL-only canonical concepts
cdl.forEach((t, i) => {
  if (cdlMatched.has(i)) return;
  const specimen = extractSpecimen(t.raw_name);
  const specLabel = specimenLabel(specimen);
  const canonName = normalize(t.raw_name);
  const fullName = specLabel ? `${canonName} [${specLabel}]` : canonName;

  canonId++;
  catalog.push({
    canonical_id: `CAN-${String(canonId).padStart(4, '0')}`,
    canonical_name: fullName,
    medical_category: classifyCategory(t.raw_name),
    specimen_type: specimen,
    match_confidence: null,
    match_reasons: null,
    offerings: {
      CDL: buildOffering(t, 'CDL'),
    }
  });
});

// 3. Unmatched Dynacare tests → Dynacare-only canonical concepts
dyn.forEach((t, i) => {
  if (dynMatched.has(i)) return;
  const specimen = extractSpecimen(t.raw_name);
  const specLabel = specimenLabel(specimen);
  const canonName = normalize(t.raw_name);
  const fullName = specLabel ? `${canonName} [${specLabel}]` : canonName;

  canonId++;
  catalog.push({
    canonical_id: `CAN-${String(canonId).padStart(4, '0')}`,
    canonical_name: fullName,
    medical_category: classifyCategory(t.raw_name),
    specimen_type: specimen,
    match_confidence: null,
    match_reasons: null,
    offerings: {
      Dynacare: buildOffering(t, 'Dynacare'),
    }
  });
});

// Sort: matched (both labs) first by confidence desc, then single-lab alphabetically
catalog.sort((a, b) => {
  const aHasBoth = a.offerings.CDL && a.offerings.Dynacare;
  const bHasBoth = b.offerings.CDL && b.offerings.Dynacare;
  if (aHasBoth && !bHasBoth) return -1;
  if (!aHasBoth && bHasBoth) return 1;
  if (aHasBoth && bHasBoth) return (b.match_confidence || 0) - (a.match_confidence || 0);
  return a.canonical_name.localeCompare(b.canonical_name);
});

// Reassign canonical IDs after sort
catalog.forEach((c, i) => {
  c.canonical_id = `CAN-${String(i + 1).padStart(4, '0')}`;
});

// ═══════════════════════════════════════════════
// SECTION 8: SPECIMEN VARIANT VERIFICATION
// ═══════════════════════════════════════════════

// Find tests that exist in multiple specimen forms (to verify they're separate)
function stripSpecimenWords(str) {
  return str
    .replace(/\s*\[.*?\]\s*$/g, '')  // remove [Serum], [Urine 24h] suffix
    .replace(/\bURINE[S]?\b/gi, '')
    .replace(/\bURINAIRE\b/gi, '')
    .replace(/\b24\s*H(EURES?)?\b/gi, '')
    .replace(/\bHASARD\b/gi, '')
    .replace(/\bALEATOIRE\b/gi, '')
    .replace(/\bSANG\s+ENTIER\b/gi, '')
    .replace(/\bSERUM\b/gi, '')
    .replace(/\bPLASMA\b/gi, '')
    .replace(/\bGLOBULES\s+ROUGES\b/gi, '')
    .replace(/\bSELLES\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const byBaseConcept = {};
catalog.forEach(c => {
  const base = stripSpecimenWords(c.canonical_name);
  if (!byBaseConcept[base]) byBaseConcept[base] = [];
  byBaseConcept[base].push({
    canonical_id: c.canonical_id,
    canonical_name: c.canonical_name,
    specimen_type: c.specimen_type,
  });
});
const specimenVariants = Object.entries(byBaseConcept)
  .filter(([_, entries]) => {
    const uniqueSpecs = new Set(entries.map(e => e.specimen_type));
    return uniqueSpecs.size > 1;
  })
  .map(([base, entries]) => ({ base_concept: base, variants: entries }));

// ═══════════════════════════════════════════════
// SECTION 9: OUTPUT
// ═══════════════════════════════════════════════

const matched = catalog.filter(c => c.offerings.CDL && c.offerings.Dynacare);
const cdlOnly = catalog.filter(c => c.offerings.CDL && !c.offerings.Dynacare);
const dynOnly = catalog.filter(c => !c.offerings.CDL && c.offerings.Dynacare);

// Category distribution
const catDist = {};
catalog.forEach(c => {
  catDist[c.medical_category] = (catDist[c.medical_category] || 0) + 1;
});

const output = {
  metadata: {
    generated_at: new Date().toISOString(),
    description: 'Canonical Test Catalog — CDL (enriched with specimen collection data) matched against Dynacare',
    source_counts: {
      CDL_main: cdlRaw.length,
      CDL_specimen_manual_entries: qcRaw.length,
      CDL_enriched_with_specimen_data: enrichedCount,
      CDL_deduplicated: cdl.length,
      Dynacare: dyn.length,
    },
    matching_summary: {
      total_canonical_concepts: catalog.length,
      matched_both_labs: matched.length,
      cdl_only: cdlOnly.length,
      dynacare_only: dynOnly.length,
      conflicts_detected: conflicts.length,
      match_threshold: MATCH_THRESHOLD,
    },
    confidence_distribution: (() => {
      const bins = { '0.90-1.00': 0, '0.70-0.89': 0, '0.50-0.69': 0, '0.35-0.49': 0 };
      matched.forEach(c => {
        if (c.match_confidence >= 0.90) bins['0.90-1.00']++;
        else if (c.match_confidence >= 0.70) bins['0.70-0.89']++;
        else if (c.match_confidence >= 0.50) bins['0.50-0.69']++;
        else bins['0.35-0.49']++;
      });
      return bins;
    })(),
    specimen_variant_separation: {
      count: specimenVariants.length,
      examples: specimenVariants.slice(0, 10),
    },
    category_distribution: catDist,
  },
  canonical_catalog: catalog,
  conflicts: conflicts,
};

fs.writeFileSync('canonical_test_catalog.json', JSON.stringify(output, null, 2), 'utf8');

// ─── Console Summary ───
console.log('\n════════════════════════════════════════════');
console.log('  CANONICAL TEST CATALOG — FINAL SUMMARY');
console.log('════════════════════════════════════════════');
console.log(`\nSources: CDL=${cdl.length} (${enrichedCount} enriched) | Dynacare=${dyn.length}`);
console.log(`\nCanonical Concepts: ${catalog.length}`);
console.log(`  Matched (both labs):  ${matched.length}`);
console.log(`  CDL only:             ${cdlOnly.length}`);
console.log(`  Dynacare only:        ${dynOnly.length}`);

console.log(`\nConfidence Distribution:`);
const bins = output.metadata.confidence_distribution;
Object.entries(bins).forEach(([range, count]) => console.log(`  ${range}: ${count}`));

console.log(`\nSpecimen Variant Separation: ${specimenVariants.length} concepts properly separated`);
specimenVariants.slice(0, 5).forEach(sv => {
  console.log(`  "${sv.base_concept}":`);
  sv.variants.forEach(v => console.log(`    -> ${v.canonical_name} (${v.specimen_type})`));
});

console.log(`\nConflicts: ${conflicts.length}`);
conflicts.slice(0, 5).forEach(c => {
  console.log(`  Dynacare ${c.dynacare.code}: "${c.dynacare.raw_name}"`);
  c.cdl_candidates.forEach(m => console.log(`    -> CDL ${m.code}: "${m.raw_name}" [${m.score}]`));
});

console.log(`\n=== SAMPLE MATCHED (top 10) ===`);
matched.slice(0, 10).forEach(c => {
  const tube = c.offerings.CDL.tube ? ` | tube: ${c.offerings.CDL.tube}` : '';
  console.log(`  ${c.canonical_id} [${c.match_confidence}]: ${c.canonical_name}`);
  console.log(`    CDL: ${c.offerings.CDL.code} "$${c.offerings.CDL.price}"${tube}`);
  console.log(`    DYN: ${c.offerings.Dynacare.code} "$${c.offerings.Dynacare.price}"`);
});

console.log(`\n=== SAMPLE CDL-ONLY (first 5) ===`);
cdlOnly.slice(0, 5).forEach(c => {
  const tube = c.offerings.CDL.tube ? ` | tube: ${c.offerings.CDL.tube}` : '';
  console.log(`  ${c.canonical_id}: ${c.canonical_name} — CDL: ${c.offerings.CDL.code} "$${c.offerings.CDL.price}"${tube}`);
});

console.log(`\n=== SAMPLE DYNACARE-ONLY (first 5) ===`);
dynOnly.slice(0, 5).forEach(c => {
  console.log(`  ${c.canonical_id}: ${c.canonical_name} — DYN: ${c.offerings.Dynacare.code} "$${c.offerings.Dynacare.price}"`);
});

const fsize = fs.statSync('canonical_test_catalog.json').size;
console.log(`\nOutput: canonical_test_catalog.json (${(fsize / 1024).toFixed(1)} KB)`);
