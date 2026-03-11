import json

with open("D:/lab-price/prisma/cdl_only.json", encoding="utf-8") as f:
    cdl = json.load(f)
with open("D:/lab-price/prisma/dyn_only.json", encoding="utf-8") as f:
    dyn = json.load(f)

cdl_canonicals = {item["canonical"] for item in cdl}
dyn_canonicals = {item["canonical"] for item in dyn}

# Check specific entries
checks = [
    ("Bilirubine Indirecte", "CDL"),
    ("C Telopeptides", "CDL"),
    ("Harmony\u00ae", "CDL"),
    ("Recherche D\u00e9anticorps", "CDL"),
    ("Harmony", "CDL"),
    ("PT PTT", "CDL"),
    ("Glucose AC", "CDL"),
    ("Glucose AC PC 1H", "CDL"),
    ("Glucose AC PC 2H", "CDL"),
    ("BILIRUBINE INDIRECTE/NON CONJUGU\u00c9E", "DYN"),
    ("T\u00c9LOPEPTIDE-C", "DYN"),
]

for name, src in checks:
    pool = cdl_canonicals if src == "CDL" else dyn_canonicals
    print(src, repr(name), "->", name in pool)

print()
# Print all DYN canonicals that contain key words
for c in sorted(dyn_canonicals):
    if "BILIRUBINE" in c.upper() or "TELOP" in c.upper() or "HARMONY" in c.upper():
        print("DYN:", repr(c))

print()
for c in sorted(cdl_canonicals):
    if "BILIRU" in c.upper() or "TELOP" in c.upper() or "HARMONY" in c.upper() or "RECHERCHE" in c.upper():
        print("CDL:", repr(c))
