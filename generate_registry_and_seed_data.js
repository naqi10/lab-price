/**
 * Generates:
 * 1. Updated canonical-test-registry.ts from canonical_test_catalog.json
 * 2. Seed data arrays (CDL tests, Dynacare tests) for seed.ts
 */

const fs = require('fs');
const catalog = require('./canonical_test_catalog.json');

// ═══════════════════════════════════════════════
// 1. Generate canonical-test-registry.ts
// ═══════════════════════════════════════════════

function normalizeForLookup(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

const registryEntries = [];

for (const entry of catalog.canonical_catalog) {
  // Collect all raw names across offerings as aliases
  const aliases = new Set();
  const codes = new Set();

  for (const [lab, offering] of Object.entries(entry.offerings)) {
    aliases.add(offering.raw_name);
    codes.add(offering.code);
  }

  // Determine the primary code: prefer the code that appears in both labs
  const cdl = entry.offerings.CDL;
  const dyn = entry.offerings.Dynacare;
  let primaryCode;
  if (cdl && dyn && cdl.code === dyn.code) {
    primaryCode = cdl.code;
  } else if (cdl) {
    primaryCode = cdl.code;
  } else if (dyn) {
    primaryCode = dyn.code;
  }

  // Also add the other code as an alias if they differ
  if (cdl && dyn && cdl.code !== dyn.code) {
    aliases.add(cdl.code);
    aliases.add(dyn.code);
  }

  // Determine category based on type field
  const type = cdl ? cdl.type : (dyn ? dyn.type : 'individual');
  const category = type === 'profile' ? 'Profil' : 'Individuel';

  // Build a clean canonical name
  // Use the canonical_name but make it more human-readable
  let canonicalName = entry.canonical_name
    .replace(/\s*\[.*?\]\s*$/g, '')  // Remove [Serum], [Urine 24h] etc
    .trim();

  // Title-case it nicely
  canonicalName = canonicalName
    .split(' ')
    .map(word => {
      if (word.length <= 3 && word === word.toUpperCase()) return word; // Keep abbreviations like "ALT", "AST", "CK"
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // Add specimen qualifier back if not DEFAULT
  if (entry.specimen_type && entry.specimen_type !== 'DEFAULT') {
    const specLabels = {
      'SERUM': 'Sérum',
      'URINE': 'Urine',
      'URINE_24H': 'Urine 24h',
      'URINE_RANDOM': 'Urine Hasard',
      'WHOLE_BLOOD': 'Sang Entier',
      'PLASMA': 'Plasma',
      'STOOL': 'Selles',
      'THROAT': 'Gorge',
      'VAGINAL': 'Vaginal',
      'CERVICAL': 'Cervical',
      'RECTAL': 'Rectal',
      'NASAL': 'Nasal',
      'WOUND': 'Plaie',
      'SPUTUM': 'Crachat',
      'RBC': 'Globules Rouges',
      'HAIR': 'Cheveux',
    };
    const label = specLabels[entry.specimen_type] || entry.specimen_type;
    canonicalName += ` (${label})`;
  }

  // Ensure uniqueness of canonical names
  registryEntries.push({
    canonicalName,
    code: primaryCode,
    category,
    aliases: [...aliases],
    // Extra metadata for seed
    _matchConfidence: entry.match_confidence,
    _medicalCategory: entry.medical_category,
    _specimenType: entry.specimen_type,
    _canonicalId: entry.canonical_id,
  });
}

// Check for duplicate canonical names and make them unique
const nameCount = {};
registryEntries.forEach(e => {
  nameCount[e.canonicalName] = (nameCount[e.canonicalName] || 0) + 1;
});

const nameSeq = {};
registryEntries.forEach(e => {
  if (nameCount[e.canonicalName] > 1) {
    nameSeq[e.canonicalName] = (nameSeq[e.canonicalName] || 0) + 1;
    e.canonicalName += ` (${e.code})`;
  }
});

// Generate the TypeScript file
let tsContent = `/**
 * Canonical Test Registry — Auto-generated from canonical_test_catalog.json
 *
 * ${registryEntries.length} canonical test definitions covering:
 * - CDL Laboratories (enriched with specimen collection data)
 * - Dynacare
 *
 * Each entry defines a canonical test with all known name aliases from all labs.
 * During seeding, every lab test is resolved to its canonical entry
 * by checking code first, then alias matching.
 */

export interface CanonicalTestDefinition {
  canonicalName: string;
  code: string;
  category: "Profil" | "Individuel";
  aliases: string[];
}

/**
 * Build lookup indexes for resolving test names to canonical definitions.
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
      const key = alias.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();
      byAlias.set(key, def);
    }
  }

  return { byCode, byAlias };
}

/** Normalize a string for alias matching: lowercase + strip accents + trim. */
export function normalizeForLookup(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();
}

export const CANONICAL_TEST_REGISTRY: CanonicalTestDefinition[] = [
`;

for (const entry of registryEntries) {
  const aliasLines = entry.aliases.map(a => `      ${JSON.stringify(a)},`).join('\n');
  tsContent += `  {
    canonicalName: ${JSON.stringify(entry.canonicalName)},
    code: ${JSON.stringify(entry.code)},
    category: ${JSON.stringify(entry.category)},
    aliases: [
${aliasLines}
    ],
  },
`;
}

tsContent += `];\n`;

fs.writeFileSync('lib/data/canonical-test-registry.ts', tsContent, 'utf8');
console.log(`Generated canonical-test-registry.ts with ${registryEntries.length} entries`);

// ═══════════════════════════════════════════════
// 2. Verify coverage: check that all CDL and Dynacare tests can be resolved
// ═══════════════════════════════════════════════

const cdlRaw = require('./final_cdl.json');
const dynRaw = require('./final_dynacare.json');

// Build lookup indexes
const byCode = new Map();
const byAlias = new Map();
for (const def of registryEntries) {
  byCode.set(def.code, def);
  for (const alias of def.aliases) {
    const key = normalizeForLookup(alias);
    byAlias.set(key, def);
  }
}

function resolve(code, name) {
  return byCode.get(code) || byAlias.get(normalizeForLookup(name));
}

// Deduplicate CDL
const cdlByCode = {};
cdlRaw.forEach(t => {
  if (!cdlByCode[t.code]) cdlByCode[t.code] = t;
  else if (t.category !== null && cdlByCode[t.code].category === null) cdlByCode[t.code] = t;
});
const cdl = Object.values(cdlByCode);

let cdlResolved = 0, cdlUnresolved = 0;
const cdlUnmatched = [];
cdl.forEach(t => {
  if (resolve(t.code, t.raw_name)) cdlResolved++;
  else { cdlUnresolved++; cdlUnmatched.push(t.code + ': ' + t.raw_name); }
});

let dynResolved = 0, dynUnresolved = 0;
const dynUnmatched = [];
dynRaw.forEach(t => {
  if (resolve(t.code, t.raw_name)) dynResolved++;
  else { dynUnresolved++; dynUnmatched.push(t.code + ': ' + t.raw_name); }
});

console.log(`\nCoverage Check:`);
console.log(`  CDL: ${cdlResolved}/${cdl.length} resolved (${cdlUnresolved} unresolved)`);
console.log(`  Dynacare: ${dynResolved}/${dynRaw.length} resolved (${dynUnresolved} unresolved)`);

if (cdlUnmatched.length > 0) {
  console.log(`\n  CDL unresolved (first 10):`);
  cdlUnmatched.slice(0, 10).forEach(u => console.log(`    ${u}`));
}
if (dynUnmatched.length > 0) {
  console.log(`\n  Dynacare unresolved (first 10):`);
  dynUnmatched.slice(0, 10).forEach(u => console.log(`    ${u}`));
}
