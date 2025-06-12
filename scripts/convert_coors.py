# scripts/convert_coords.py
import json, pathlib, re

dms_regex = re.compile(
    r'''
    (?P<deg>\d+)[°\s]*
    (?P<min>\d+)?[′'\s]*
    (?P<sec>\d+)?[″"\s]*
    (?P<hem>[NSEW])
    ''',
    re.VERBOSE
)

def dms_to_decimal(dms):
    m = dms_regex.search(dms.replace("\u202F", " "))   # replace narrow-no-break space
    if not m:
        raise ValueError(f"Cannot parse DMS: {dms}")
    deg  = int(m.group("deg"))
    minu = int(m.group("min") or 0)
    sec  = int(m.group("sec") or 0)
    dec  = deg + minu/60 + sec/3600
    return dec if m.group("hem") in "NE" else -dec

with open("public/basic_cities.json", encoding="utf-8") as f:
    data = json.load(f)

slim = []
bad  = []

for c in data["cities"]:
    try:
        lat = round(dms_to_decimal(c["latitude"]), 6)
        lon = round(dms_to_decimal(c["longitude"]), 6)
        slim.append({
            "n":  c["city"].replace(" †", "").replace(" ††", ""),
            "lat": lat,
            "lon": lon,
            "pop": c["population_2020"] or 0
        })
    except Exception as e:
        bad.append({ "city": c["city"], "err": str(e) })

pathlib.Path("public/mn_cities_dec.json").write_text(
    json.dumps(slim, separators=(",",":"), ensure_ascii=False),
    encoding="utf-8"
)

print(f"✅  {len(slim)} cities written to public/mn_cities_dec.json")
if bad:
    print(f"⚠️  {len(bad)} coords failed — see scripts/bad_coords.json")
    pathlib.Path("scripts/bad_coords.json").write_text(json.dumps(bad, indent=2, ensure_ascii=False))
