/**
 * merge-verified-pairs.mjs
 * Applies 89 manually verified cross-lab test pairs.
 * Moves DYN TestMappingEntry to CDL canonical so tests appear
 * side-by-side in comparisons. Deletes orphan DYN canonicals.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/index.js";
import "dotenv/config";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const labs = await prisma.laboratory.findMany({ select: { id: true, code: true } });
const cdl = labs.find(l => l.code === "CDL");
const dyn = labs.find(l => l.code === "DYNACARE");
if (!cdl || !dyn) { console.error("Missing lab"); process.exit(1); }

// All 89 verified pairs: [cdlCanonical (exact), dynCanonical (exact)]
const PAIRS = [
  ["Bilirubine Indirecte", "BILIRUBINE INDIRECTE/NON CONJUGUÉE"],
  ["C Telopeptides", "TÉLOPEPTIDE-C"],
  ["Calcium Urine 24 Heures (Urine 24h)", "CALCIUM URINES DE 24 HEURES"],
  ["Calprotectine", "CALPROTECTINE FÉCALE"],
  ["Chaines Legeres Kappa Lambda Libre", "CHAÎNES LÉGÈRES LIBRES"],
  ["Chlorure Urine 24 Heures (Urine 24h)", "CHLORURES - URINES DE 24 HEURES"],
  ["Cortisol AM PM", "CORTISOL (MATIN ET APRÈS-MIDI)"],
  ["Cortisol Urine 24 Heures (Urine 24h)", "CORTISOL LIBRE - URINES DE 24 HEURES"],
  ["Cystatin C", "CYSTATINE C"],
  ["Dheas", "DHEAS (SULFATE DE DÉSHYDROÉPIANDROSTÉRONE)"],
  ["Digoxin", "DIGOXINE"],
  ["Electrolytes Urine 24 Heures (Urine 24h)", "ÉLECTROLYTES - URINES DE 24 HEURES"],
  ["Epstein Barr VCA IGG", "ANTICORPS ANTI-VIRUS EPSTEIN-BARR DE TYPE IgG"],
  ["Epstein Barr VCA IGM", "ANTICORPS ANTI-VIRUS EPSTEIN-BARR DE TYPE IgM"],
  ["Glucose 6 PO4 DH Quantitatif Sang Entier (Sang Entier)", "G6PD (GLUCOSE-6-PHOSPHATE DÉSHYDROGÉNASE)"],
  ["Glucose Aleatoire", "GLUCOSE AU HASARD"],
  ["Glucose Test Tolerance 2 Heures", "GLUCOSE - HYPERGLYCÉMIE ORALE 75g NON-GESTATIONNEL (2 HEURES)"],
  ["Harmony®", "HARMONY (DÉPISTAGE PRÉNATAL NON INVASIF)"],
  ["Hepatite A IGG", "ANTICORPS TOTAUX ANTI-HÉPATITE A (IgG)"],
  ["Hepatite A IGM", "ANTICORPS ANTI-HÉPATITE A DE TYPE IgM"],
  ["Hepatite B Anticorps Core Total", "ANTICORPS ANTI-HBc (TOTAL)"],
  ["Hepatite B Anticorps Surface", "ANTI-HBs"],
  ["Hepatite B Charge Virale", "HÉPATITE B - ADN VIRAL"],
  ["Hepatite B E Anticorps", "ANTICORPS ANTI-HBe"],
  ["Hepatite C Charge Virale", "HÉPATITE C (ANALYSE QUANTITATIVE) - PCR"],
  ["Herpes Simplex Virus 1 2 ADN PCR", "HERPÈS - DÉTECTION PAR PCR (ÉCOUVILLON)"],
  ["Holter 24 Heures", "HOLTER (24 HRS) - ECG EN CONTINU"],
  ["Holter 48 Heures", "HOLTER (48 HRS) - ECG EN CONTINU"],
  ["IGF 1", "IGF-1 (SOMATOMÉDINE C)"],
  ["IGG Sous Classe", "SOUS-CLASSES D'IMMUNOGLOBULINE IgG"],
  ["Lamotrigine", "LAMOTRIGINE (LAMICTAL)"],
  ["LP A", "LIPOPROTÉINE A - Lp(a)"],
  ["Microalbuminurie Aleatoire", "MICROALBUMINE: RATIO ALBUMINE/CRÉATININE"],
  ["Microalbuminurie Urine 24 Heures (Urine 24h)", "MICROALBUMINE - URINES DE 24 HEURES"],
  ["Monotest (MONO)", "MONONUCLÉOSE - TEST DE DÉPISTAGE"],
  ["Oreillons IGG", "ANTICORPS IgG ANTI-VIRUS DES OREILLONS"],
  ["Oreillons IGM", "ANTICORPS IgM ANTI-VIRUS DES OREILLONS"],
  ["Oxalate Urine 24 Heures (Urine 24h)", "OXALATES - URINES DE 24 HEURES"],
  ["Oxyures", "OXYURES (SPATULE ADHÉSIVE)"],
  ["Phenytoine", "DILANTIN (PHÉNYTOÏNE)"],
  ["Phosphate Urine 24 Heures (Urine 24h)", "PHOSPHORE - URINES DE 24 HEURES"],
  ["Proteines Urine 24 Heures (Urine 24h)", "PROTÉINES - URINES DE 24 HEURES"],
  ["Rage Anticorps", "ANTICORPS ANTI-RABIQUES (RAGE)"],
  ["Recherche D\u2019anticorps", "RECHERCHE D'ANTICORPS (TEST DE COOMBS INDIRECT)"],
  ["Reticulocytes", "RÉTICULOCYTES (NUMÉRATION)"],
  ["Rougeole IGG", "ANTICORPS IgG ANTI-VIRUS DE LA ROUGEOLE"],
  ["Rougeole IGM", "ANTICORPS IgM ANTI-VIRUS DE LA ROUGEOLE"],
  ["Rubeole IGM", "ANTICORPS IgM ANTI-VIRUS DE LA RUBÉOLE"],
  ["Sodium Urine 24 Heures (Urine 24h)", "SODIUM URINES DE 24 HEURES"],
  ["Syphilis EIA", "SYPHILIS CMIA (DÉPISTAGE)"],
  ["T3 Totale", "T3 TOTALE (TRIIODOTHYRONINE)"],
  ["Tacrolimus Fk506 Prograf", "TACROLIMUS"],
  ["Toxoplasmose IGG", "TOXOPLASMOSE ANTICORPS DE TYPE IgG"],
  ["Toxoplasmose IGM", "TOXOPLASMOSE ANTICORPS DE TYPE IgM"],
  ["Trichomonas PCR Urine (Urine)", "TRICHOMONAS VAGINALIS URINE - DÉPISTAGE PAR TAAN"],
  ["Trichomonas Vaginalis PCR (Vaginal)", "TRICHOMONAS VAGINALIS ÉCOUVILLON - DÉPISTAGE PAR TAAN"],
  ["TSH Anticorps Anti Recepteur", "ANTICORPS ANTI-RÉCEPTEURS DE LA THYRÉOSTIMULINE (TBII)"],
  ["Uree Urine 24 Heures BUN (Urine 24h)", "URÉE - URINES DE 24 HEURES"],
  ["VIH Virus Immunodeficience Humaine Charge Virale", "CHARGE VIRALE (VIH)"],
  ["Varicelle IGG", "ANTICORPS IgG ANTI-VARICELLE"],
  ["Varicelle IGM", "ANTICORPS IgM ANTI-VARICELLE"],
  ["Anti Endomysiaux Anticorps IGA", "ANTICORPS ANTI-ENDOMYSIUM"],
  ["Anti GAD Auto Anticorps", "ANTICORPS ANTI-GLUTAMATE DÉCARBOXYLASE"],
  ["Anti TPO", "ANTICORPS ANTI-MICROSOMES THYROÏDIENS"],
  ["Chlamydia Urine (Urine)", "CHLAMYDIA URINE - DÉPISTAGE PAR TAAN"],
  ["Chlamydia PCR", "CHLAMYDIA ÉCOUVILLON - DÉPISTAGE PAR TAAN"],
  ["Gonorrhee PCR Urine (Urine)", "NEISSERIA GONORRHOEAE - DÉPISTAGE PAR TAAN URINE"],
  ["Gonorrhee PCR", "NEISSERIA GONORRHOEAE - DÉPISTAGE PAR TAAN ÉCOUVILLONNAGE"],
  ["Sang Dans Selles Immunologique Quantitatif (Selles)", "FIT (TEST IMMUNOCHIMIQUE FÉCAL)"],
  ["HFE Genotype", "MUTATION GÉNIQUE HÉMOCHROMATOSE (C282Y + H63D)"],
  ["HLA Celiac", "TYPAGE HLA DQ2/DQ8"],
  ["Immunoglobuline", "IMMUNOGLOBULINES (ANALYSE QUANTITATIVE)"],
  ["PAP Thinpreptm Test", "CYTOLOGIE: TEST DE PAPANICOLAOU ThinPrep (PAP TEST LIQUIDE)"],
  ["PAP Frottis Traditionnel", "CYTOLOGIE: TEST DE PAPANICOLAOU (SUR LAME)"],
  ["Test PAP Thin Prep HPV DNA", "CYTOLOGIE: ThinPrep + DÉPISTAGE VPH EN COMBO"],
  ["Lyme Maladie IGG OU IGM Lymg Lymm", "MALADIE DE LYME (ANTICORPS ANTI-BORRELIA BURGDORFERI)"],
  ["Estrone", "OESTRONE (ESTRONE)"],
  ["Cuivre Globules Rouges (Globules Rouges)", "CUIVRE SANG ENTIER"],
  ["C Peptide", "PEPTIDE C À JEUN"],
  ["Culture Cervicale (Cervical)", "CULTURE: COL UTÉRIN"],
  ["Culture Crachat (Crachat)", "CULTURE: EXPECTORATIONS"],
  ["Culture Vaginale Culture Traditionnelle (Vaginal)", "CULTURE: VAGIN"],
  ["Culture Urethrale", "CULTURE: URÈTRE"],
  ["Culture Fongique Peau Cheveux Ongles (Cheveux)", "CULTURE: CHAMPIGNONS"],
  ["Maladie Coeliaque", "PROFIL MALADIE COELIAQUE COMPLET (IgA TOTALES, ANTI-TRANSGLUTAMINASE IgA, ANTI-GLIADINE IgG ET IgA)"],
  ["PT PTT", "INR + PTT (TEMPS DE CÉPHALINE ACTIVÉE)"],
  ["Glucose AC", "GLUCOSE À JEUN"],
  ["Glucose AC PC 1H", "GLUCOSE PC (1HR-50g)"],
  ["Glucose AC PC 2H", "GLUCOSE PC (2HR-75g)"],
];

// Lookup all canonicals once for speed
const allMappings = await prisma.testMapping.findMany({
  include: {
    entries: {
      where: { laboratoryId: { in: [cdl.id, dyn.id] } },
      select: { id: true, laboratoryId: true, localTestName: true, price: true },
    },
  },
});

const byName = new Map(allMappings.map(m => [m.canonicalName, m]));

let merged = 0, skipped = 0, notFound = 0;

console.log(`\n🔀 Merging ${PAIRS.length} verified cross-lab pairs...\n`);

for (const [cdlName, dynName] of PAIRS) {
  const cdlMap = byName.get(cdlName);
  const dynMap = byName.get(dynName);

  if (!cdlMap) {
    console.log(`  ✗ NOT FOUND CDL: "${cdlName}"`);
    notFound++;
    continue;
  }
  if (!dynMap) {
    console.log(`  ✗ NOT FOUND DYN: "${dynName}"`);
    notFound++;
    continue;
  }

  const cdlEntry = cdlMap.entries.find(e => e.laboratoryId === cdl.id);
  const dynEntry = dynMap.entries.find(e => e.laboratoryId === dyn.id);

  if (!cdlEntry) {
    console.log(`  ⚠ No CDL entry in "${cdlName}" — skip`);
    skipped++;
    continue;
  }
  if (!dynEntry) {
    console.log(`  ⚠ No DYN entry in "${dynName}" — skip`);
    skipped++;
    continue;
  }

  // Already has DYN entry in CDL canonical?
  if (cdlMap.entries.some(e => e.laboratoryId === dyn.id)) {
    console.log(`  ⚠ Already paired: "${cdlName}" — skip`);
    skipped++;
    continue;
  }

  // Move DYN entry to CDL canonical
  await prisma.testMappingEntry.update({
    where: { id: dynEntry.id },
    data: { testMappingId: cdlMap.id },
  });

  // Delete orphan DYN canonical if now empty
  const remaining = await prisma.testMappingEntry.count({ where: { testMappingId: dynMap.id } });
  if (remaining === 0) {
    await prisma.testMapping.delete({ where: { id: dynMap.id } });
  }

  console.log(`  ✅ "${cdlName}" ← $${cdlEntry.price} | DYN "${dynName}" ← $${dynEntry.price}`);
  merged++;
}

// Final counts
const allNow = await prisma.testMapping.findMany({
  where: { entries: { some: { laboratoryId: { in: [cdl.id, dyn.id] } } } },
  include: { entries: { where: { laboratoryId: { in: [cdl.id, dyn.id] } }, select: { laboratoryId: true } } },
});
const pairedNow = allNow.filter(m =>
  m.entries.some(e => e.laboratoryId === cdl.id) &&
  m.entries.some(e => e.laboratoryId === dyn.id)
).length;
const cdlOnlyNow = allNow.filter(m => m.entries.some(e => e.laboratoryId === cdl.id) && !m.entries.some(e => e.laboratoryId === dyn.id)).length;
const dynOnlyNow = allNow.filter(m => m.entries.some(e => e.laboratoryId === dyn.id) && !m.entries.some(e => e.laboratoryId === cdl.id)).length;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Merge complete!

  Merged:           ${merged}
  Skipped:          ${skipped}
  Not found:        ${notFound}

  Cross-lab paired: ${pairedNow}  (was 200)
  CDL-only:         ${cdlOnlyNow}
  Dynacare-only:    ${dynOnlyNow}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

await prisma.$disconnect();
