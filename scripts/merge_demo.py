# merge_demo.py
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
UNI_FILE  = ROOT / "../public/basic_cities_with_uni.json"
DEMO_FILE = ROOT / "../public/mn_demo_full.json"           # <-- put your demographics here
OUT_FILE  = ROOT / "cities_with_demo.json"

# ---------- helpers ---------------------------------------------------------
def parse_race_block(txt: str) -> dict:
    """Extract {race: pct} pairs like 'White (91.0%)'."""
    pairs = re.findall(r"([A-Za-z ]+)\s*\((\d+(?:\.\d+)?)%", txt or "")
    return {race.strip(): float(pct) for race, pct in pairs}

def clean_demo_city(name: str) -> str:
    """Strip suffix & normalise for matching."""
    return (
        name.replace("Demographic Statistics", "")
            .strip()
            .lower()
    )

# ---------- load files ------------------------------------------------------
uni_data  = json.loads(UNI_FILE.read_text(encoding="utf-8"))["cities"]
demo_raw  = json.loads(DEMO_FILE.read_text(encoding="utf-8"))

demo_lookup = {
    clean_demo_city(d["city"]): {
        "median_age": d["median_age"],
        "median_income": d["median_income"],
        "race_breakdown": parse_race_block(d["race_ethnicity"])
    }
    for d in demo_raw
}

# ---------- merge -----------------------------------------------------------
merged, missing = [], []

for c in uni_data:
    key = c["city"].lower()
    if key in demo_lookup:
        merged.append({**c, **demo_lookup[key]})
    else:
        missing.append(c["city"])

# ---------- write output ----------------------------------------------------
OUT_FILE.write_text(
    json.dumps({"cities": merged, "no_demo_data": missing}, indent=2),
    encoding="utf-8"
)

print(f"✅  Wrote {len(merged)} merged cities; "
      f"{len(missing)} had no matching demo data → {OUT_FILE}")
