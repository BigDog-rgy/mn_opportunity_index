
import json, pathlib, re

CITIES_IN  = pathlib.Path("public/basic_cities.json")
UNIS_IN    = pathlib.Path("public/mn_uni_by_city.json")
CITIES_OUT = pathlib.Path("public/basic_cities_with_uni.json")

dagger_re = re.compile(r"(.*?)(††|†)?$")

def clean_name_and_flags(raw: str):
    """Return (clean_name, is_seat, is_capital)"""
    m = dagger_re.match(raw)
    name, marks = m.group(1).strip(), m.group(2) or ""
    return (
        name,
        "†"  in marks,   # is_county_seat
        "††" in marks    # is_state_capital
    )

# ── 1. load files ────────────────────────────────────────────
cities = json.loads(CITIES_IN.read_text(encoding="utf-8"))["cities"]
unis   = json.loads(UNIS_IN.read_text(encoding="utf-8"))

# ── 2. build lookup dict & add dagger flags ─────────────────
city_lookup = {}
for c in cities:
    clean, seat, cap = clean_name_and_flags(c["city"])
    c["city"]            = clean
    c["is_county_seat"]  = seat
    c["is_state_capital"]= cap
    city_lookup[clean.lower()] = c

# ── 3. merge universities into matching cities ──────────────
unmatched = []
for uni_city_raw, uni_list in unis.items():
    key = uni_city_raw.lower()
    if key in city_lookup:
        city_lookup[key]["universities"] = uni_list
    else:
        unmatched.append(uni_city_raw)

# ── 4. write out new JSON ───────────────────────────────────
CITIES_OUT.write_text(
    json.dumps({"cities": cities}, indent=2, ensure_ascii=False),
    encoding="utf-8"
)
print(f"✅  Wrote enriched file → {CITIES_OUT.resolve()}")

# ── 5. report any misses ────────────────────────────────────
if unmatched:
    print("\n⚠️  University cities with no match in basic_cities:")
    for name in unmatched:
        print("   ·", name)
else:
    print("\n🎉 All university cities matched a basic_cities record.")
