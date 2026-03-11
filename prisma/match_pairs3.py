import json

with open("D:/lab-price/prisma/cdl_only.json", encoding="utf-8") as f:
    cdl = json.load(f)
with open("D:/lab-price/prisma/dyn_only.json", encoding="utf-8") as f:
    dyn = json.load(f)

cdl_canonicals = {item["canonical"] for item in cdl}
dyn_canonicals = {item["canonical"] for item in dyn}

# Find the exact CDL canonical for Recherche and Harmony
for c in sorted(cdl_canonicals):
    if "RECHERCHE" in c.upper() or "HARMONY" in c.upper() or "HEPATITE A" in c.upper() or "HEPATITE B" in c.upper():
        print("CDL:", repr(c))

print()
for c in sorted(dyn_canonicals):
    if "RECHERCHE" in c.upper() or "HARMONY" in c.upper() or "HEPATITE" in c.upper() or "ANTI-HB" in c.upper() or "ANTI-HBC" in c.upper():
        print("DYN:", repr(c))
