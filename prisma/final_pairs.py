import json

with open("D:/lab-price/prisma/cdl_only.json", encoding="utf-8") as f:
    cdl = json.load(f)
with open("D:/lab-price/prisma/dyn_only.json", encoding="utf-8") as f:
    dyn = json.load(f)

# Build lookup sets
cdl_set = {item["canonical"] for item in cdl}
dyn_set = {item["canonical"] for item in dyn}

# Find exact canonical values from files
def get_cdl(substr_upper):
    for item in cdl:
        if substr_upper in item["canonical"].upper():
            return item["canonical"]
    return None

def get_dyn(substr_upper):
    for item in dyn:
        if substr_upper in item["canonical"].upper():
            return item["canonical"]
    return None

def get_dyn_all(substr_upper):
    return [item["canonical"] for item in dyn if substr_upper in item["canonical"].upper()]

# Collect all pairs with actual canonical values from files
pairs = []

def add(cdl_key, dyn_key, reason):
    if cdl_key not in cdl_set:
        print(f"CDL NOT FOUND: {repr(cdl_key)}")
        return
    if dyn_key not in dyn_set:
        print(f"DYN NOT FOUND: {repr(dyn_key)}")
        return
    pairs.append({"cdlCanonical": cdl_key, "dynCanonical": dyn_key, "reason": reason})

# 1
add(get_cdl("BILIRUBINE INDIRECTE"), get_dyn("BILIRUBINE INDIRECTE"),
    "Same test: indirect/unconjugated bilirubin, CDL uses short name, DYN includes both terms")

# 2
add(get_cdl("TELOPEPTIDE"), get_dyn("LOPEPTIDE-C"),
    "Same test: C-telopeptide bone resorption marker, different name order and accents")

# 3
add(get_cdl("CALCIUM URINE 24"), get_dyn("CALCIUM URINES DE 24"),
    "Same test: 24-hour urine calcium")

# 4
add(get_cdl("CALPROTECTINE"), get_dyn("CALPROTECTINE"),
    "Same test: fecal calprotectin, CDL name is abbreviated")

# 5
add(get_cdl("KAPPA LAMBDA LIBRE"), get_dyn("LIBRES"),
    "Same test: free kappa and lambda light chains combined panel")

# 6
add(get_cdl("CHLORURE URINE 24"), get_dyn("CHLORURES - URINES DE 24"),
    "Same test: 24-hour urine chloride")

# 7
add(get_cdl("CORTISOL AM PM"), get_dyn("MATIN ET AP"),
    "Same test: morning and afternoon cortisol measurement")

# 8
add(get_cdl("CORTISOL URINE 24"), get_dyn("CORTISOL LIBRE"),
    "Same test: 24-hour urinary free cortisol")

# 9
add(get_cdl("CYSTATIN C"), get_dyn("CYSTATINE C"),
    "Same test: cystatin C renal function marker, English vs French spelling")

# 10
add(get_cdl("DHEAS"), get_dyn("DHEAS"),
    "Same test: DHEA-sulfate, CDL canonical is abbreviated")

# 11
add(get_cdl("DIGOXIN"), get_dyn("DIGOXINE"),
    "Same drug level test: digoxin, English vs French name")

# 12
add(get_cdl("ELECTROLYTES URINE 24"), get_dyn("LECTROLYTES - URINES DE 24"),
    "Same test: 24-hour urine electrolytes panel")

# 13
add(get_cdl("EPSTEIN BARR VCA IGG"), get_dyn("EPSTEIN-BARR DE TYPE IgG"),
    "Same test: Epstein-Barr virus IgG antibody (VCA)")

# 14
add(get_cdl("EPSTEIN BARR VCA IGM"), get_dyn("EPSTEIN-BARR DE TYPE IgM"),
    "Same test: Epstein-Barr virus IgM antibody (VCA)")

# 15
add(get_cdl("GLUCOSE 6 PO4"), get_dyn("G6PD"),
    "Same test: glucose-6-phosphate dehydrogenase in whole blood")

# 16
add(get_cdl("GLUCOSE ALEATOIRE"), get_dyn("GLUCOSE AU HASARD"),
    "Same test: random glucose (aléatoire = au hasard)")

# 17
add(get_cdl("GLUCOSE TEST TOLERANCE 2"), get_dyn("HYPERGLYCEMIE") or get_dyn("HYPERGLYC"),
    "Same test: 2-hour oral glucose tolerance test (non-gestational)")

# 18 - Harmony
add(get_cdl("HARMONY"), get_dyn("HARMONY ("),
    "Same test: Harmony prenatal cell-free DNA screening")

# 19
add(get_cdl("HEPATITE A IGG"), get_dyn("TOTAUX ANTI"),
    "Same test: hepatitis A total IgG antibodies")

# 20
add(get_cdl("HEPATITE A IGM"), get_dyn("PATITE A DE TYPE IgM"),
    "Same test: hepatitis A IgM antibody for acute infection")

# 21
add(get_cdl("HEPATITE B ANTICORPS CORE TOTAL"), get_dyn("ANTI-HBc"),
    "Same test: total anti-HBc hepatitis B core antibody")

# 22
add(get_cdl("HEPATITE B ANTICORPS SURFACE"), get_dyn("ANTI-HBs"),
    "Same test: hepatitis B surface antibody (anti-HBs)")

# 23
add(get_cdl("HEPATITE B CHARGE VIRALE"), get_dyn("PATITE B - ADN"),
    "Same test: hepatitis B viral load / DNA quantification")

# 24
add(get_cdl("HEPATITE B E ANTICORPS"), get_dyn("ANTI-HBe"),
    "Same test: hepatitis B e antibody (anti-HBe)")

# 25
add(get_cdl("HEPATITE C CHARGE VIRALE"), get_dyn("QUANTITATIVE) - PCR"),
    "Same test: hepatitis C viral load by quantitative PCR")

# 26
add(get_cdl("HERPES SIMPLEX VIRUS 1 2 ADN"), get_dyn("HERP"),
    "Same test: herpes simplex virus 1 and 2 PCR detection from swab")

# 27
add(get_cdl("HOLTER 24"), get_dyn("HOLTER (24"),
    "Same test: 24-hour Holter continuous ECG monitoring")

# 28
add(get_cdl("HOLTER 48"), get_dyn("HOLTER (48"),
    "Same test: 48-hour Holter continuous ECG monitoring")

# 29
add(get_cdl("IGF 1"), get_dyn("IGF-1"),
    "Same test: insulin-like growth factor 1 (somatomedin C)")

# 30
add(get_cdl("IGG SOUS CLASSE"), get_dyn("SOUS-CLASSES"),
    "Same test: IgG subclass quantification")

# 31
add(get_cdl("LAMOTRIGINE"), get_dyn("LAMOTRIGINE"),
    "Same drug level test: lamotrigine (Lamictal)")

# 32
add(get_cdl("LP A"), get_dyn("LIPOPR"),
    "Same test: lipoprotein(a), abbreviated vs full name")

# 33
add(get_cdl("MICROALBUMINURIE ALEATOIRE"), get_dyn("RATIO ALBUMINE"),
    "Same test: spot urine microalbumin (random collection), reported as albumin/creatinine ratio")

# 34
add(get_cdl("MICROALBUMINURIE URINE 24"), get_dyn("MICROALBUMINE - URINES"),
    "Same test: 24-hour urine microalbumin")

# 35
add(get_cdl("MONOTEST (MONO)"), get_dyn("MONONUCL"),
    "Same test: mononucleosis screening test")

# 36
add(get_cdl("OREILLONS IGG"), get_dyn("IgG ANTI-VIRUS DES OREILLONS"),
    "Same test: mumps IgG antibody")

# 37
add(get_cdl("OREILLONS IGM"), get_dyn("IgM ANTI-VIRUS DES OREILLONS"),
    "Same test: mumps IgM antibody")

# 38
add(get_cdl("OXALATE URINE 24"), get_dyn("OXALATES"),
    "Same test: 24-hour urine oxalates")

# 39
add(get_cdl("OXYURES"), get_dyn("OXYURES"),
    "Same test: pinworm detection, DYN specifies adhesive tape method")

# 40
add(get_cdl("PHENYTOINE"), get_dyn("DILANTIN"),
    "Same drug level test: phenytoin (Dilantin), generic vs brand name first")

# 41
add(get_cdl("PHOSPHATE URINE 24"), get_dyn("PHOSPHORE - URINES"),
    "Same test: 24-hour urine phosphate/phosphorus")

# 42
add(get_cdl("PROTEINES URINE 24"), get_dyn("INES - URINES DE 24"),
    "Same test: 24-hour urine total protein")

# 43
add(get_cdl("RAGE ANTICORPS"), get_dyn("RABIQUES"),
    "Same test: rabies antibody titre")

# 44 - Recherche Danticorps
add(get_cdl("RECHERCHE D"), get_dyn("RECHERCHE D"),
    "Same test: antibody screen (indirect Coombs test)")

# 45
add(get_cdl("RETICULOCYTES"), get_dyn("TICULOCYTES"),
    "Same test: reticulocyte count")

# 46
add(get_cdl("ROUGEOLE IGG"), get_dyn("IgG ANTI-VIRUS DE LA ROUGEOLE"),
    "Same test: measles (rubeola) IgG antibody")

# 47
add(get_cdl("ROUGEOLE IGM"), get_dyn("IgM ANTI-VIRUS DE LA ROUGEOLE"),
    "Same test: measles (rubeola) IgM antibody")

# 48 - Rubella
add(get_cdl("RUBEOLE IGM"), get_dyn("RUBEOLE") or get_dyn("RUB\u00c9OLE"),
    "Same test: rubella IgM antibody")

# 49
add(get_cdl("SODIUM URINE 24"), get_dyn("SODIUM URINES DE 24"),
    "Same test: 24-hour urine sodium")

# 50
add(get_cdl("SYPHILIS EIA"), get_dyn("SYPHILIS CMIA"),
    "Same test: syphilis serological screening (EIA and CMIA are equivalent immunoassay methods)")

# 51
add(get_cdl("T3 TOTALE"), get_dyn("T3 TOTALE"),
    "Same test: total triiodothyronine (T3)")

# 52
add(get_cdl("TACROLIMUS FK506"), get_dyn("TACROLIMUS"),
    "Same drug level test: tacrolimus (FK506/Prograf)")

# 53
add(get_cdl("TOXOPLASMOSE IGG"), get_dyn("TOXOPLASMOSE ANTICORPS DE TYPE IgG"),
    "Same test: toxoplasma IgG antibody")

# 54
add(get_cdl("TOXOPLASMOSE IGM"), get_dyn("TOXOPLASMOSE ANTICORPS DE TYPE IgM"),
    "Same test: toxoplasma IgM antibody")

# 55
add(get_cdl("TRICHOMONAS PCR URINE"), get_dyn("TRICHOMONAS VAGINALIS URINE"),
    "Same test: Trichomonas vaginalis PCR/TAAN from urine")

# 56
add(get_cdl("TRICHOMONAS VAGINALIS PCR"), get_dyn_all("TRICHOMONAS VAGINALIS")[1] if len(get_dyn_all("TRICHOMONAS VAGINALIS")) > 1 else get_dyn("COUVILLON - D"),
    "Same test: Trichomonas vaginalis PCR from swab/vaginal specimen")

# 57
add(get_cdl("TSH ANTICORPS ANTI RECEPTEUR"), get_dyn("THYREOSTIMULINE") or get_dyn("THYROSTIMULINE"),
    "Same test: TSH receptor antibodies (TBII/TRAb)")

# 58
add(get_cdl("UREE URINE 24"), get_dyn("UREE - URINES"),
    "Same test: 24-hour urine urea")

# 59
add(get_cdl("VIH VIRUS IMMUNODEFICIENCE HUMAINE"), get_dyn("CHARGE VIRALE (VIH)"),
    "Same test: HIV viral load")

# 60
add(get_cdl("VARICELLE IGG"), get_dyn("IgG ANTI-VARICELLE"),
    "Same test: varicella-zoster virus IgG antibody")

# 61
add(get_cdl("VARICELLE IGM"), get_dyn("IgM ANTI-VARICELLE"),
    "Same test: varicella-zoster virus IgM antibody")

# 62
add(get_cdl("ANTI ENDOMYSIAUX"), get_dyn("ENDOMYSIUM"),
    "Same test: anti-endomysial antibody IgA for celiac disease")

# 63
add(get_cdl("ANTI GAD"), get_dyn("GLUTAMATE"),
    "Same test: anti-GAD (glutamate decarboxylase) autoantibody")

# 64
add(get_cdl("ANTI TPO"), get_dyn("MICROSOMES THYRO"),
    "Same test: anti-TPO = anti-thyroid microsomal antibodies")

# 65
add(get_cdl("CHLAMYDIA URINE"), get_dyn("CHLAMYDIA URINE"),
    "Same test: chlamydia urine TAAN/PCR screening")

# 66 - Chlamydia PCR (swab)
add(get_cdl("CHLAMYDIA PCR"), get_dyn_all("CHLAMYDIA")[1] if len(get_dyn_all("CHLAMYDIA")) > 1 else get_dyn("COUVILLON - D"),
    "Same test: chlamydia swab PCR/TAAN screening")

# 67
add(get_cdl("GONORRHEE PCR URINE"), get_dyn("GONORRHOEAE - ") and get_dyn_all("GONORRHOEAE")[0],
    "Same test: Neisseria gonorrhoeae urine PCR/TAAN")

# 68
add(get_cdl("GONORRHEE PCR"), [k for item in dyn for k in [item["canonical"]] if "GONORRHOEAE" in k.upper() and "URINE" not in k.upper()][0],
    "Same test: Neisseria gonorrhoeae swab PCR/TAAN")

# 69
add(get_cdl("SANG DANS SELLES IMMUNOLOGIQUE"), get_dyn("FIT"),
    "Same test: fecal immunochemical test (FIT) for occult blood")

# 70
add(get_cdl("HFE GENOTYPE"), get_dyn("HEMOCHROMATOSE"),
    "Same test: HFE gene mutations C282Y and H63D for hereditary hemochromatosis")

# 71
add(get_cdl("HLA CELIAC"), get_dyn("HLA DQ"),
    "Same test: HLA DQ2/DQ8 typing for celiac disease susceptibility")

# 72
add(get_cdl("IMMUNOGLOBULINE"), get_dyn("IMMUNOGLOBULINES (ANALYSE"),
    "Same test: quantitative immunoglobulins panel (IgG, IgA, IgM)")

# 73
add(get_cdl("PAP THINPREPTM"), get_dyn("ThinPrep (PAP"),
    "Same test: ThinPrep liquid-based Pap test")

# 74
add(get_cdl("PAP FROTTIS TRADITIONNEL"), get_dyn("SUR LAME"),
    "Same test: traditional Pap smear on slide")

# 75
add(get_cdl("TEST PAP THIN PREP HPV DNA"), get_dyn("VPH EN COMBO"),
    "Same test: ThinPrep Pap + HPV co-testing")

# 76
add(get_cdl("LYME MALADIE IGG OU IGM LYMG LYMM"), get_dyn("BORRELIA"),
    "Same test: Lyme disease Borrelia burgdorferi antibody screening (IgG/IgM)")

# 77
add(get_cdl("ESTRONE"), get_dyn("OESTRONE"),
    "Same test: estrone (E1) steroid hormone, English vs French/alternative spelling")

# 78
add(get_cdl("CUIVRE GLOBULES ROUGES"), get_dyn("CUIVRE SANG ENTIER"),
    "Same test: copper in red blood cells/whole blood, both measure cellular copper")

# 79
add(get_cdl("C PEPTIDE"), get_dyn("PEPTIDE C"),
    "Same test: C-peptide, clinically measured fasting")

# 80
add(get_cdl("CULTURE CERVICALE"), get_dyn("COL UT"),
    "Same test: cervical culture (col utérin = cervix)")

# 81
add(get_cdl("CULTURE CRACHAT"), get_dyn("EXPECTORATIONS"),
    "Same test: sputum culture (crachat = expectoration)")

# 82
add(get_cdl("CULTURE VAGINALE CULTURE TRADITIONNELLE"), get_dyn("CULTURE: VAGIN"),
    "Same test: traditional vaginal culture")

# 83
add(get_cdl("CULTURE URETHRALE"), get_dyn("CULTURE: UR"),
    "Same test: urethral culture")

# 84
add(get_cdl("CULTURE FONGIQUE PEAU CHEVEUX"), get_dyn("CHAMPIGNONS"),
    "Same test: fungal culture of skin/hair/nails")

# 85
add(get_cdl("MALADIE COELIAQUE"), get_dyn("COMPLET (IgA TOTALES"),
    "Same test: comprehensive celiac disease antibody panel")

# 86
add(get_cdl("PT PTT"), get_dyn("INR + PTT"),
    "Same test: prothrombin time (PT/INR) combined with activated partial thromboplastin time (PTT)")

# 87
add(get_cdl("GLUCOSE AC"), get_dyn("GLUCOSE A JEUN") or get_dyn("GLUCOSE J"),
    "Same test: fasting glucose (AC = avant les repas = fasting)")

# 88
add(get_cdl("GLUCOSE AC PC 1H"), get_dyn("1HR-50g"),
    "Same test: 1-hour 50g gestational glucose challenge test")

# 89
add(get_cdl("GLUCOSE AC PC 2H"), get_dyn("2HR-75g"),
    "Same test: 2-hour 75g gestational oral glucose tolerance test")

print(f"Total pairs: {len(pairs)}")
print()
print(json.dumps(pairs, ensure_ascii=False, indent=2))
