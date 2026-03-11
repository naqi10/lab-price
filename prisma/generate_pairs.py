import json

with open("D:/lab-price/prisma/cdl_only.json", encoding="utf-8") as f:
    cdl = json.load(f)
with open("D:/lab-price/prisma/dyn_only.json", encoding="utf-8") as f:
    dyn = json.load(f)

cdl_by_canonical = {item["canonical"]: item for item in cdl}
dyn_by_canonical = {item["canonical"]: item for item in dyn}

cdl_c = cdl_by_canonical
dyn_c = dyn_by_canonical

# Helper to find canonical by partial match
def cdl_find(substr):
    matches = [k for k in cdl_c if substr.lower() in k.lower()]
    return matches

def dyn_find(substr):
    matches = [k for k in dyn_c if substr.lower() in k.lower()]
    return matches

pairs = []

def add(cdl_key, dyn_key, reason):
    if cdl_key not in cdl_c:
        print(f"WARNING: CDL key not found: {repr(cdl_key)}")
        return
    if dyn_key not in dyn_c:
        print(f"WARNING: DYN key not found: {repr(dyn_key)}")
        return
    pairs.append({"cdlCanonical": cdl_key, "dynCanonical": dyn_key, "reason": reason})

# Find exact CDL canonical for 'Recherche Danticorps'
recherche_cdl = cdl_find("Recherche")[0]
recherche_dyn = dyn_find("RECHERCHE")[0]

# Find Harmony CDL
harmony_cdl = cdl_find("Harmony")[0]
harmony_dyn = [k for k in dyn_c if "HARMONY" in k and "22q" not in k][0]

print("Recherche CDL:", repr(recherche_cdl))
print("Recherche DYN:", repr(recherche_dyn))
print("Harmony CDL:", repr(harmony_cdl))
print("Harmony DYN:", repr(harmony_dyn))

add("Bilirubine Indirecte", dyn_find("BILIRUBINE INDIRECTE")[0],
    "Same test: indirect/unconjugated bilirubin, CDL short name, DYN includes both terms")

add("C Telopeptides", dyn_find("LOPEPTIDE")[0],
    "Same test: C-telopeptide bone resorption marker, different name order and accents")

add("Calcium Urine 24 Heures (Urine 24h)", dyn_find("CALCIUM URINES")[0],
    "Same test: 24-hour urine calcium")

add("Calprotectine", dyn_find("CALPROTECTINE")[0],
    "Same test: fecal calprotectin, CDL name is abbreviated")

add("Chaines Legeres Kappa Lambda Libre", dyn_find("INES L")[0],
    "Same test: free kappa and lambda light chains combined panel")

add("Chlorure Urine 24 Heures (Urine 24h)", dyn_find("CHLORURES - URINES DE 24")[0],
    "Same test: 24-hour urine chloride")

add("Cortisol AM PM", dyn_find("MATIN ET AP")[0],
    "Same test: morning and afternoon cortisol measurement")

add("Cortisol Urine 24 Heures (Urine 24h)", dyn_find("CORTISOL LIBRE")[0],
    "Same test: 24-hour urinary free cortisol")

add("Cystatin C", dyn_find("CYSTATINE")[0],
    "Same test: cystatin C renal function marker, English vs French spelling")

add("Dheas", dyn_find("DHEAS")[0],
    "Same test: DHEA-sulfate, CDL canonical is abbreviated")

add("Digoxin", dyn_find("DIGOXINE")[0],
    "Same drug level test: digoxin, English vs French name")

add("Electrolytes Urine 24 Heures (Urine 24h)", dyn_find("LECTROLYTES - URINES DE 24")[0],
    "Same test: 24-hour urine electrolytes panel")

add("Epstein Barr VCA IGG", dyn_find("EPSTEIN-BARR DE TYPE IgG")[0],
    "Same test: Epstein-Barr virus IgG antibody")

add("Epstein Barr VCA IGM", dyn_find("EPSTEIN-BARR DE TYPE IgM")[0],
    "Same test: Epstein-Barr virus IgM antibody")

add("Glucose 6 PO4 DH Quantitatif Sang Entier (Sang Entier)", dyn_find("G6PD")[0],
    "Same test: glucose-6-phosphate dehydrogenase in whole blood")

add("Glucose Aleatoire", dyn_find("AU HASARD")[0],
    "Same test: random glucose, aléatoire = au hasard")

add("Glucose Test Tolerance 2 Heures", dyn_find("HYPERGLYCEMIE")[0] if dyn_find("HYPERGLYCEMIE") else dyn_find("HYPERGLYC")[0],
    "Same test: 2-hour oral glucose tolerance test non-gestational")

add(harmony_cdl, harmony_dyn,
    "Same test: Harmony prenatal cell-free DNA screening")

add("Hepatite A IGG", dyn_find("TOTAUX ANTI")[0],
    "Same test: hepatitis A total IgG antibodies")

add("Hepatite A IGM", dyn_find("PATITE A DE TYPE IgM")[0],
    "Same test: hepatitis A IgM antibody for acute infection")

add("Hepatite B Anticorps Core Total", dyn_find("ANTI-HBc")[0],
    "Same test: total anti-HBc hepatitis B core antibody")

add("Hepatite B Anticorps Surface", dyn_find("ANTI-HBs")[0],
    "Same test: hepatitis B surface antibody anti-HBs")

add("Hepatite B Charge Virale", dyn_find("PATITE B - ADN")[0],
    "Same test: hepatitis B viral load / DNA quantification")

add("Hepatite B E Anticorps", dyn_find("ANTI-HBe")[0],
    "Same test: hepatitis B e antibody anti-HBe")

add("Hepatite C Charge Virale", dyn_find("QUANTITATIVE) - PCR")[0],
    "Same test: hepatitis C viral load by quantitative PCR")

add("Herpes Simplex Virus 1 2 ADN PCR", dyn_find("HERP")[0],
    "Same test: herpes simplex virus 1 and 2 PCR detection from swab")

add("Holter 24 Heures", dyn_find("HOLTER (24")[0],
    "Same test: 24-hour Holter continuous ECG monitoring")

add("Holter 48 Heures", dyn_find("HOLTER (48")[0],
    "Same test: 48-hour Holter continuous ECG monitoring")

add("IGF 1", dyn_find("IGF-1")[0],
    "Same test: insulin-like growth factor 1 somatomedin C")

add("IGG Sous Classe", dyn_find("SOUS-CLASSES")[0],
    "Same test: IgG subclass quantification")

add("Lamotrigine", dyn_find("LAMOTRIGINE")[0],
    "Same drug level test: lamotrigine (Lamictal)")

add("LP A", dyn_find("LIPOPROTEINE")[0] if dyn_find("LIPOPROTEINE") else dyn_find("LIPOPROT")[0],
    "Same test: lipoprotein(a), abbreviated vs full name")

add("Microalbuminurie Aleatoire", dyn_find("RATIO ALBUMINE")[0],
    "Same test: spot urine microalbumin (random collection)")

add("Microalbuminurie Urine 24 Heures (Urine 24h)", dyn_find("MICROALBUMINE - URINES")[0],
    "Same test: 24-hour urine microalbumin")

add("Monotest (MONO)", dyn_find("MONONUCL")[0],
    "Same test: mononucleosis screening test")

add("Oreillons IGG", dyn_find("IgG ANTI-VIRUS DES OREILLONS")[0],
    "Same test: mumps IgG antibody")

add("Oreillons IGM", dyn_find("IgM ANTI-VIRUS DES OREILLONS")[0],
    "Same test: mumps IgM antibody")

add("Oxalate Urine 24 Heures (Urine 24h)", dyn_find("OXALATES")[0],
    "Same test: 24-hour urine oxalates")

add("Oxyures", dyn_find("OXYURES")[0],
    "Same test: pinworm detection, DYN specifies adhesive tape method")

add("Phenytoine", dyn_find("DILANTIN")[0],
    "Same drug level test: phenytoin (Dilantin), generic vs brand name first")

add("Phosphate Urine 24 Heures (Urine 24h)", dyn_find("PHOSPHORE - URINES")[0],
    "Same test: 24-hour urine phosphate/phosphorus")

add("Proteines Urine 24 Heures (Urine 24h)", dyn_find("INES - URINES DE 24")[0],
    "Same test: 24-hour urine total protein")

add("Rage Anticorps", dyn_find("RABIQUES")[0],
    "Same test: rabies antibody titre")

add(recherche_cdl, recherche_dyn,
    "Same test: antibody screen (indirect Coombs test)")

add("Reticulocytes", dyn_find("TICULOCYTES")[0],
    "Same test: reticulocyte count")

add("Rougeole IGG", dyn_find("IgG ANTI-VIRUS DE LA ROUGEOLE")[0],
    "Same test: measles (rubeola) IgG antibody")

add("Rougeole IGM", dyn_find("IgM ANTI-VIRUS DE LA ROUGEOLE")[0],
    "Same test: measles (rubeola) IgM antibody")

add("Rubeole IGM", dyn_find("RUBEOLE")[0] if dyn_find("RUBEOLE") else dyn_find("RUB")[0],
    "Same test: rubella IgM antibody")

add("Sodium Urine 24 Heures (Urine 24h)", dyn_find("SODIUM URINES DE 24")[0],
    "Same test: 24-hour urine sodium")

add("Syphilis EIA", dyn_find("SYPHILIS CMIA")[0],
    "Same test: syphilis serological screening, EIA and CMIA are equivalent immunoassay methods")

add("T3 Totale", dyn_find("T3 TOTALE")[0],
    "Same test: total triiodothyronine (T3)")

add("Tacrolimus Fk506 Prograf", dyn_find("TACROLIMUS")[0],
    "Same drug level test: tacrolimus (FK506/Prograf)")

add("Toxoplasmose IGG", dyn_find("TOXOPLASMOSE ANTICORPS DE TYPE IgG")[0],
    "Same test: toxoplasma IgG antibody")

add("Toxoplasmose IGM", dyn_find("TOXOPLASMOSE ANTICORPS DE TYPE IgM")[0],
    "Same test: toxoplasma IgM antibody")

add("Trichomonas PCR Urine (Urine)", dyn_find("TRICHOMONAS VAGINALIS URINE")[0],
    "Same test: Trichomonas vaginalis PCR/TAAN from urine")

add("Trichomonas Vaginalis PCR (Vaginal)", dyn_find("TRICHOMONAS VAGINALIS")[1],
    "Same test: Trichomonas vaginalis PCR from swab/vaginal specimen")

add("TSH Anticorps Anti Recepteur", dyn_find("THYREOSTIMULINE")[0] if dyn_find("THYREOSTIMULINE") else dyn_find("THYROSTIMULINE")[0],
    "Same test: TSH receptor antibodies (TBII/TRAb)")

add("Uree Urine 24 Heures BUN (Urine 24h)", dyn_find("UREE - URINES")[0] if dyn_find("UREE - URINES") else dyn_find("UR")[0],
    "Same test: 24-hour urine urea")

add("VIH Virus Immunodeficience Humaine Charge Virale", dyn_find("CHARGE VIRALE (VIH)")[0],
    "Same test: HIV viral load")

add("Varicelle IGG", dyn_find("IgG ANTI-VARICELLE")[0],
    "Same test: varicella-zoster virus IgG antibody")

add("Varicelle IGM", dyn_find("IgM ANTI-VARICELLE")[0],
    "Same test: varicella-zoster virus IgM antibody")

add("Anti Endomysiaux Anticorps IGA", dyn_find("ENDOMYSIUM")[0],
    "Same test: anti-endomysial antibody IgA for celiac disease")

add("Anti GAD Auto Anticorps", dyn_find("GLUTAMATE")[0],
    "Same test: anti-GAD (glutamate decarboxylase) autoantibody")

add("Anti TPO", dyn_find("MICROSOMES THYRO")[0],
    "Same test: anti-TPO = anti-thyroid microsomal antibodies")

add("Chlamydia Urine (Urine)", dyn_find("CHLAMYDIA URINE")[0],
    "Same test: chlamydia urine TAAN/PCR screening")

add("Chlamydia PCR", dyn_find("CHLAMYDIA")[1],
    "Same test: chlamydia swab PCR/TAAN screening")

add("Gonorrhee PCR Urine (Urine)", dyn_find("GONORRHOEAE - DEPISTAGE PAR TAAN URINE")[0] if dyn_find("GONORRHOEAE - DEPISTAGE PAR TAAN URINE") else dyn_find("GONORRHOEAE")[0],
    "Same test: Neisseria gonorrhoeae urine PCR/TAAN")

add("Gonorrhee PCR", [k for k in dyn_c if "GONORRHOEAE" in k.upper() and "URINE" not in k.upper()][0],
    "Same test: Neisseria gonorrhoeae swab PCR/TAAN")

add("Sang Dans Selles Immunologique Quantitatif (Selles)", dyn_find("FIT")[0],
    "Same test: fecal immunochemical test (FIT) for occult blood")

add("HFE Genotype", dyn_find("HEMOCHROMATOSE")[0] if dyn_find("HEMOCHROMATOSE") else dyn_find("HEMOCROMATOSE")[0],
    "Same test: HFE gene mutations C282Y and H63D for hereditary hemochromatosis")

add("HLA Celiac", dyn_find("HLA DQ")[0],
    "Same test: HLA DQ2/DQ8 typing for celiac disease susceptibility")

add("Immunoglobuline", dyn_find("IMMUNOGLOBULINES (ANALYSE")[0],
    "Same test: quantitative immunoglobulins panel (IgG, IgA, IgM)")

add("PAP Thinpreptm Test", dyn_find("ThinPrep (PAP")[0],
    "Same test: ThinPrep liquid-based Pap test")

add("PAP Frottis Traditionnel", dyn_find("SUR LAME")[0],
    "Same test: traditional Pap smear on slide")

add("Test PAP Thin Prep HPV DNA", dyn_find("VPH EN COMBO")[0],
    "Same test: ThinPrep Pap + HPV co-testing")

add("Lyme Maladie IGG OU IGM Lymg Lymm", dyn_find("BORRELIA")[0],
    "Same test: Lyme disease Borrelia burgdorferi antibody screening (IgG/IgM)")

add("Estrone", dyn_find("OESTRONE")[0],
    "Same test: estrone (E1) steroid hormone, English vs French/alternative spelling")

add("Cuivre Globules Rouges (Globules Rouges)", dyn_find("CUIVRE SANG ENTIER")[0],
    "Same test: copper in red blood cells/whole blood, both measure cellular copper")

add("C Peptide", dyn_find("PEPTIDE C")[0],
    "Same test: C-peptide, clinically measured fasting")

add("Culture Cervicale (Cervical)", dyn_find("COL UT")[0],
    "Same test: cervical culture (col utérin = cervix)")

add("Culture Crachat (Crachat)", dyn_find("EXPECTORATIONS")[0],
    "Same test: sputum culture (crachat = expectoration)")

add("Culture Vaginale Culture Traditionnelle (Vaginal)", dyn_find("CULTURE: VAGIN")[0],
    "Same test: traditional vaginal culture")

add("Culture Urethrale", dyn_find("CULTURE: UR")[0],
    "Same test: urethral culture")

add("Culture Fongique Peau Cheveux Ongles (Cheveux)", dyn_find("CHAMPIGNONS")[0],
    "Same test: fungal culture of skin/hair/nails")

add("Maladie Coeliaque", dyn_find("COMPLET (IgA TOTALES")[0],
    "Same test: comprehensive celiac disease antibody panel")

add("PT PTT", dyn_find("INR + PTT")[0],
    "Same test: prothrombin time (PT/INR) combined with PTT")

add("Glucose AC", dyn_find("JEUN")[0] if len(dyn_find("JEUN")) == 1 else [k for k in dyn_c if "GLUCOSE" in k.upper() and "JEUN" in k.upper()][0],
    "Same test: fasting glucose (AC = avant les repas = fasting)")

add("Glucose AC PC 1H", dyn_find("1HR-50g")[0],
    "Same test: 1-hour 50g gestational glucose challenge test")

add("Glucose AC PC 2H", dyn_find("2HR-75g")[0],
    "Same test: 2-hour 75g gestational oral glucose tolerance test")

print(f"\nTotal pairs: {len(pairs)}")
print()
print(json.dumps(pairs, ensure_ascii=False, indent=2))
