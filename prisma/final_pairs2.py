import json

with open("D:/lab-price/prisma/cdl_only.json", encoding="utf-8") as f:
    cdl = json.load(f)
with open("D:/lab-price/prisma/dyn_only.json", encoding="utf-8") as f:
    dyn = json.load(f)

cdl_set = {item["canonical"] for item in cdl}
dyn_set = {item["canonical"] for item in dyn}

pairs = []

def add(cdl_key, dyn_key, reason):
    if cdl_key not in cdl_set:
        print(f"CDL NOT FOUND: {repr(cdl_key)}")
        return
    if dyn_key not in dyn_set:
        print(f"DYN NOT FOUND: {repr(dyn_key)}")
        return
    pairs.append({"cdlCanonical": cdl_key, "dynCanonical": dyn_key, "reason": reason})

# Use exact canonical values - CDL are mixed case, DYN are uppercase with accents
# We know the exact strings from our file reads

# Find exact DYN canonicals by iterating
def dyn_exact(key_part):
    for item in dyn:
        if key_part in item["canonical"]:
            return item["canonical"]
    return None

def cdl_exact(key_part):
    for item in cdl:
        if key_part.lower() in item["canonical"].lower():
            return item["canonical"]
    return None

# Now build all pairs using exact matching

# Bilirubin indirect
add("Bilirubine Indirecte", dyn_exact("BILIRUBINE INDIRECTE"),
    "Same test: indirect/unconjugated bilirubin, CDL short name, DYN includes both terms")

# C-telopeptide
add("C Telopeptides", dyn_exact("LOPEPTIDE-C"),
    "Same test: C-telopeptide bone resorption marker, different name order and accents")

# Calcium urine 24h
add("Calcium Urine 24 Heures (Urine 24h)", dyn_exact("CALCIUM URINES DE 24"),
    "Same test: 24-hour urine calcium")

# Calprotectin
add("Calprotectine", dyn_exact("CALPROTECTINE"),
    "Same test: fecal calprotectin, CDL name abbreviated")

# Free light chains
add("Chaines Legeres Kappa Lambda Libre", dyn_exact("CHAÎNES LÉGÈRES LIBRES") or dyn_exact("CHA\u00ceNES L\u00c9G\u00c8RES LIBRES"),
    "Same test: free kappa and lambda light chains combined panel")

# Chloride 24h
add("Chlorure Urine 24 Heures (Urine 24h)", dyn_exact("CHLORURES - URINES DE 24"),
    "Same test: 24-hour urine chloride")

# Cortisol AM/PM
add("Cortisol AM PM", dyn_exact("CORTISOL (MATIN ET"),
    "Same test: morning and afternoon cortisol measurement")

# Urinary free cortisol 24h
add("Cortisol Urine 24 Heures (Urine 24h)", dyn_exact("CORTISOL LIBRE - URINES"),
    "Same test: 24-hour urinary free cortisol")

# Cystatin C
add("Cystatin C", dyn_exact("CYSTATINE C"),
    "Same test: cystatin C renal function marker, English vs French spelling")

# DHEAS
add("Dheas", dyn_exact("DHEAS ("),
    "Same test: DHEA-sulfate, CDL canonical is abbreviated")

# Digoxin
add("Digoxin", dyn_exact("DIGOXINE"),
    "Same drug level test: digoxin, English vs French name")

# Electrolytes urine 24h
add("Electrolytes Urine 24 Heures (Urine 24h)", dyn_exact("LECTROLYTES - URINES DE 24"),
    "Same test: 24-hour urine electrolytes panel")

# EBV IgG
add("Epstein Barr VCA IGG", dyn_exact("EPSTEIN-BARR DE TYPE IgG"),
    "Same test: Epstein-Barr virus IgG antibody (VCA)")

# EBV IgM
add("Epstein Barr VCA IGM", dyn_exact("EPSTEIN-BARR DE TYPE IgM"),
    "Same test: Epstein-Barr virus IgM antibody (VCA)")

# G6PD
add("Glucose 6 PO4 DH Quantitatif Sang Entier (Sang Entier)", dyn_exact("G6PD ("),
    "Same test: glucose-6-phosphate dehydrogenase in whole blood")

# Random glucose
add("Glucose Aleatoire", dyn_exact("GLUCOSE AU HASARD"),
    "Same test: random glucose (aléatoire = au hasard)")

# OGTT 2h
add("Glucose Test Tolerance 2 Heures", dyn_exact("HYPERGLYCÉMIE ORALE") or dyn_exact("HYPERGLYC\u00c9MIE ORALE"),
    "Same test: 2-hour oral glucose tolerance test (non-gestational)")

# Harmony
add("Harmony\u00ae", dyn_exact("HARMONY ("),
    "Same test: Harmony prenatal cell-free DNA screening")

# Hepatitis A IgG total
add("Hepatite A IGG", dyn_exact("TOTAUX ANTI-"),
    "Same test: hepatitis A total IgG antibodies")

# Hepatitis A IgM
add("Hepatite A IGM", dyn_exact("HÉPATITE A DE TYPE IgM") or dyn_exact("H\u00c9PATITE A DE TYPE IgM"),
    "Same test: hepatitis A IgM antibody for acute infection")

# Anti-HBc total
add("Hepatite B Anticorps Core Total", dyn_exact("ANTI-HBc (TOTAL)"),
    "Same test: total anti-HBc hepatitis B core antibody")

# Anti-HBs
add("Hepatite B Anticorps Surface", dyn_exact("ANTI-HBs"),
    "Same test: hepatitis B surface antibody (anti-HBs)")

# HBV viral load
add("Hepatite B Charge Virale", dyn_exact("HÉPATITE B - ADN") or dyn_exact("H\u00c9PATITE B - ADN"),
    "Same test: hepatitis B viral load / DNA quantification")

# Anti-HBe
add("Hepatite B E Anticorps", dyn_exact("ANTI-HBe"),
    "Same test: hepatitis B e antibody (anti-HBe)")

# HCV viral load quantitative
add("Hepatite C Charge Virale", dyn_exact("QUANTITATIVE) - PCR"),
    "Same test: hepatitis C viral load by quantitative PCR")

# HSV PCR
add("Herpes Simplex Virus 1 2 ADN PCR", dyn_exact("HERPÈS - DÉTECTION") or dyn_exact("HERP\u00c8S - D\u00c9TECTION"),
    "Same test: herpes simplex virus 1 and 2 PCR detection from swab")

# Holter 24h
add("Holter 24 Heures", dyn_exact("HOLTER (24 HRS)"),
    "Same test: 24-hour Holter continuous ECG monitoring")

# Holter 48h
add("Holter 48 Heures", dyn_exact("HOLTER (48 HRS)"),
    "Same test: 48-hour Holter continuous ECG monitoring")

# IGF-1
add("IGF 1", dyn_exact("IGF-1 ("),
    "Same test: insulin-like growth factor 1 (somatomedin C)")

# IgG subclasses
add("IGG Sous Classe", dyn_exact("SOUS-CLASSES D"),
    "Same test: IgG subclass quantification")

# Lamotrigine
add("Lamotrigine", dyn_exact("LAMOTRIGINE ("),
    "Same drug level test: lamotrigine (Lamictal)")

# Lp(a)
add("LP A", dyn_exact("LIPOPROTÉINE A") or dyn_exact("LIPOPROT\u00c9INE A"),
    "Same test: lipoprotein(a), abbreviated vs full name")

# Microalbumin random/ratio
add("Microalbuminurie Aleatoire", dyn_exact("RATIO ALBUMINE/CRÉATININE") or dyn_exact("RATIO ALBUMINE/CR\u00c9ATININE"),
    "Same test: spot urine microalbumin (random), reported as albumin/creatinine ratio")

# Microalbumin 24h
add("Microalbuminurie Urine 24 Heures (Urine 24h)", dyn_exact("MICROALBUMINE - URINES"),
    "Same test: 24-hour urine microalbumin")

# Mono screening
add("Monotest (MONO)", dyn_exact("MONONUCLÉOSE") or dyn_exact("MONONUCL\u00c9OSE"),
    "Same test: mononucleosis screening test")

# Mumps IgG
add("Oreillons IGG", dyn_exact("IgG ANTI-VIRUS DES OREILLONS"),
    "Same test: mumps IgG antibody")

# Mumps IgM
add("Oreillons IGM", dyn_exact("IgM ANTI-VIRUS DES OREILLONS"),
    "Same test: mumps IgM antibody")

# Oxalate 24h
add("Oxalate Urine 24 Heures (Urine 24h)", dyn_exact("OXALATES - URINES"),
    "Same test: 24-hour urine oxalates")

# Pinworm
add("Oxyures", dyn_exact("OXYURES ("),
    "Same test: pinworm detection, DYN specifies adhesive tape method")

# Phenytoin
add("Phenytoine", dyn_exact("DILANTIN ("),
    "Same drug level test: phenytoin (Dilantin), generic vs brand name first")

# Phosphorus/phosphate urine 24h
add("Phosphate Urine 24 Heures (Urine 24h)", dyn_exact("PHOSPHORE - URINES"),
    "Same test: 24-hour urine phosphate/phosphorus")

# Total protein 24h urine
add("Proteines Urine 24 Heures (Urine 24h)", dyn_exact("PROTÉINES - URINES DE 24") or dyn_exact("PROT\u00c9INES - URINES DE 24"),
    "Same test: 24-hour urine total protein")

# Rabies antibodies
add("Rage Anticorps", dyn_exact("ANTI-RABIQUES"),
    "Same test: rabies antibody titre")

# Antibody screen (Coombs indirect)
add("Recherche D\u00e9anticorps", dyn_exact("RECHERCHE D'ANTICORPS"),
    "Same test: antibody screen (indirect Coombs test)")

# Reticulocytes
add("Reticulocytes", dyn_exact("RÉTICULOCYTES") or dyn_exact("R\u00c9TICULOCYTES"),
    "Same test: reticulocyte count")

# Measles IgG
add("Rougeole IGG", dyn_exact("IgG ANTI-VIRUS DE LA ROUGEOLE"),
    "Same test: measles (rubeola) IgG antibody")

# Measles IgM
add("Rougeole IGM", dyn_exact("IgM ANTI-VIRUS DE LA ROUGEOLE"),
    "Same test: measles (rubeola) IgM antibody")

# Rubella IgM
add("Rubeole IGM", dyn_exact("IgM ANTI-VIRUS DE LA RUB"),
    "Same test: rubella IgM antibody")

# Sodium urine 24h
add("Sodium Urine 24 Heures (Urine 24h)", dyn_exact("SODIUM URINES DE 24"),
    "Same test: 24-hour urine sodium")

# Syphilis screening
add("Syphilis EIA", dyn_exact("SYPHILIS CMIA"),
    "Same test: syphilis serological screening (EIA and CMIA are equivalent immunoassay methods)")

# T3 total
add("T3 Totale", dyn_exact("T3 TOTALE ("),
    "Same test: total triiodothyronine (T3)")

# Tacrolimus
add("Tacrolimus Fk506 Prograf", dyn_exact("TACROLIMUS"),
    "Same drug level test: tacrolimus (FK506/Prograf)")

# Toxoplasma IgG
add("Toxoplasmose IGG", dyn_exact("TOXOPLASMOSE ANTICORPS DE TYPE IgG"),
    "Same test: toxoplasma IgG antibody")

# Toxoplasma IgM
add("Toxoplasmose IGM", dyn_exact("TOXOPLASMOSE ANTICORPS DE TYPE IgM"),
    "Same test: toxoplasma IgM antibody")

# Trichomonas urine TAAN
add("Trichomonas PCR Urine (Urine)", dyn_exact("TRICHOMONAS VAGINALIS URINE"),
    "Same test: Trichomonas vaginalis PCR/TAAN from urine")

# Trichomonas swab TAAN
add("Trichomonas Vaginalis PCR (Vaginal)", dyn_exact("TRICHOMONAS VAGINALIS ÉCOUVILLON") or dyn_exact("TRICHOMONAS VAGINALIS \u00c9COUVILLON"),
    "Same test: Trichomonas vaginalis PCR from swab/vaginal specimen")

# TSH receptor antibodies (TBII)
add("TSH Anticorps Anti Recepteur", dyn_exact("THYRÉOSTIMULINE (TBII)") or dyn_exact("THYR\u00c9OSTIMULINE (TBII)"),
    "Same test: TSH receptor antibodies (TBII/TRAb)")

# Urea urine 24h
add("Uree Urine 24 Heures BUN (Urine 24h)", dyn_exact("URÉE - URINES") or dyn_exact("UR\u00c9E - URINES"),
    "Same test: 24-hour urine urea")

# HIV viral load
add("VIH Virus Immunodeficience Humaine Charge Virale", dyn_exact("CHARGE VIRALE (VIH)"),
    "Same test: HIV viral load")

# Varicella IgG
add("Varicelle IGG", dyn_exact("IgG ANTI-VARICELLE"),
    "Same test: varicella-zoster virus IgG antibody")

# Varicella IgM
add("Varicelle IGM", dyn_exact("IgM ANTI-VARICELLE"),
    "Same test: varicella-zoster virus IgM antibody")

# Anti-endomysial IgA
add("Anti Endomysiaux Anticorps IGA", dyn_exact("ANTI-ENDOMYSIUM"),
    "Same test: anti-endomysial antibody IgA for celiac disease")

# Anti-GAD
add("Anti GAD Auto Anticorps", dyn_exact("GLUTAMATE DÉCARBOXYLASE") or dyn_exact("GLUTAMATE D\u00c9CARBOXYLASE"),
    "Same test: anti-GAD (glutamate decarboxylase) autoantibody")

# Anti-TPO = anti-microsomal
add("Anti TPO", dyn_exact("MICROSOMES THYROÏDIENS") or dyn_exact("MICROSOMES THYRO\u00cfdIENS"),
    "Same test: anti-TPO = anti-thyroid microsomal antibodies")

# Chlamydia urine TAAN
add("Chlamydia Urine (Urine)", dyn_exact("CHLAMYDIA URINE - DÉPISTAGE") or dyn_exact("CHLAMYDIA URINE - D\u00c9PISTAGE"),
    "Same test: chlamydia urine TAAN/PCR screening")

# Chlamydia swab TAAN
add("Chlamydia PCR", dyn_exact("CHLAMYDIA ÉCOUVILLON") or dyn_exact("CHLAMYDIA \u00c9COUVILLON"),
    "Same test: chlamydia swab PCR/TAAN screening")

# GC urine TAAN
add("Gonorrhee PCR Urine (Urine)", dyn_exact("GONORRHOEAE - DÉPISTAGE PAR TAAN URINE") or dyn_exact("GONORRHOEAE - D\u00c9PISTAGE PAR TAAN URINE"),
    "Same test: Neisseria gonorrhoeae urine PCR/TAAN")

# GC swab TAAN
add("Gonorrhee PCR", dyn_exact("GONORRHOEAE - DÉPISTAGE PAR TAAN ÉCOUVILLON") or dyn_exact("GONORRHOEAE - D\u00c9PISTAGE PAR TAAN \u00c9COUVILLONNAGE"),
    "Same test: Neisseria gonorrhoeae swab PCR/TAAN")

# FIT - fecal immunochemical test
add("Sang Dans Selles Immunologique Quantitatif (Selles)", dyn_exact("FIT (TEST IMMUNOCHIMIQUE"),
    "Same test: fecal immunochemical test (FIT) for occult blood")

# HFE hemochromatosis
add("HFE Genotype", dyn_exact("HÉMOCHROMATOSE (C282Y") or dyn_exact("H\u00c9MOCHROMATOSE (C282Y"),
    "Same test: HFE gene mutations C282Y and H63D for hereditary hemochromatosis")

# HLA celiac
add("HLA Celiac", dyn_exact("HLA DQ2/DQ8"),
    "Same test: HLA DQ2/DQ8 typing for celiac disease susceptibility")

# Immunoglobulins quantitative
add("Immunoglobuline", dyn_exact("IMMUNOGLOBULINES (ANALYSE QUANTITATIVE)"),
    "Same test: quantitative immunoglobulins panel (IgG, IgA, IgM)")

# ThinPrep Pap
add("PAP Thinpreptm Test", dyn_exact("ThinPrep (PAP TEST"),
    "Same test: ThinPrep liquid-based Pap test")

# Traditional Pap smear
add("PAP Frottis Traditionnel", dyn_exact("SUR LAME)"),
    "Same test: traditional Pap smear on slide")

# ThinPrep + HPV co-test
add("Test PAP Thin Prep HPV DNA", dyn_exact("DÉPISTAGE VPH EN COMBO") or dyn_exact("D\u00c9PISTAGE VPH EN COMBO"),
    "Same test: ThinPrep Pap + HPV co-testing")

# Lyme disease antibodies
add("Lyme Maladie IGG OU IGM Lymg Lymm", dyn_exact("BORRELIA BURGDORFERI"),
    "Same test: Lyme disease Borrelia burgdorferi antibody screening (IgG/IgM)")

# Estrone
add("Estrone", dyn_exact("OESTRONE (ESTRONE)"),
    "Same test: estrone (E1) steroid hormone, English vs French/alternative spelling")

# Copper whole blood
add("Cuivre Globules Rouges (Globules Rouges)", dyn_exact("CUIVRE SANG ENTIER"),
    "Same test: copper in red blood cells/whole blood, both measure cellular copper")

# C-peptide
add("C Peptide", dyn_exact("PEPTIDE C À JEUN") or dyn_exact("PEPTIDE C \u00c0 JEUN"),
    "Same test: C-peptide, clinically measured fasting")

# Cervical culture
add("Culture Cervicale (Cervical)", dyn_exact("CULTURE: COL UTÉRIN") or dyn_exact("CULTURE: COL UT\u00c9RIN"),
    "Same test: cervical culture (col utérin = cervix)")

# Sputum culture
add("Culture Crachat (Crachat)", dyn_exact("CULTURE: EXPECTORATIONS"),
    "Same test: sputum culture (crachat = expectoration)")

# Vaginal culture
add("Culture Vaginale Culture Traditionnelle (Vaginal)", dyn_exact("CULTURE: VAGIN"),
    "Same test: traditional vaginal culture")

# Urethral culture
add("Culture Urethrale", dyn_exact("CULTURE: URÈTRE") or dyn_exact("CULTURE: UR\u00c8TRE"),
    "Same test: urethral culture")

# Fungal culture
add("Culture Fongique Peau Cheveux Ongles (Cheveux)", dyn_exact("CULTURE: CHAMPIGNONS"),
    "Same test: fungal culture of skin/hair/nails")

# Celiac complete panel
add("Maladie Coeliaque", dyn_exact("PROFIL MALADIE COELIAQUE COMPLET"),
    "Same test: comprehensive celiac disease antibody panel")

# PT + PTT
add("PT PTT", dyn_exact("INR + PTT ("),
    "Same test: prothrombin time (PT/INR) combined with activated partial thromboplastin time (PTT)")

# Fasting glucose
add("Glucose AC", dyn_exact("GLUCOSE À JEUN") or dyn_exact("GLUCOSE \u00c0 JEUN"),
    "Same test: fasting glucose (AC = avant les repas = à jeun = fasting)")

# 50g 1h challenge
add("Glucose AC PC 1H", dyn_exact("GLUCOSE PC (1HR-50g)"),
    "Same test: 1-hour 50g gestational glucose challenge test")

# 75g 2h OGTT gestational
add("Glucose AC PC 2H", dyn_exact("GLUCOSE PC (2HR-75g)"),
    "Same test: 2-hour 75g gestational oral glucose tolerance test")

print(f"\nTotal pairs: {len(pairs)}")
print()
print(json.dumps(pairs, ensure_ascii=False, indent=2))
