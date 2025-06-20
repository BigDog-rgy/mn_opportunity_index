import json
from pathlib import Path

CITIES_FILE = Path("public/cities_with_businesses.json")
UNIS_FILE = Path("public/unis_cleaned.json")
OUTFILE = Path("public/cities_with_businesses_2.json")

# Load data
with CITIES_FILE.open(encoding="utf-8") as f:
    cities = json.load(f)
with UNIS_FILE.open(encoding="utf-8") as f:
    unis = json.load(f)

missing_website_count = 0

for city in cities["cities"]:
    city_name = city["city"]
    # Build lookup: {name_lower: {website, tuition}}
    city_uni_lookup = {}
    if city_name in unis:
        for u in unis[city_name]:
            city_uni_lookup[u["name"].strip().lower()] = {
                "website": u.get("website"),
                "tuition": u.get("tuition"),
            }

    # Now update each university in this city
    if "universities" in city:
        for uni in city["universities"]:
            name_key = uni["name"].strip().lower()
            if name_key in city_uni_lookup:
                uni["website"] = city_uni_lookup[name_key]["website"]
                uni["tuition"] = city_uni_lookup[name_key]["tuition"]
            else:
                uni["website"] = None
                uni["tuition"] = None
            if not uni["website"]:
                missing_website_count += 1

# Save new merged file
OUTFILE.write_text(json.dumps(cities, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"✅ Updated and saved as {OUTFILE}")
print(f"❗️Total universities in the official city list missing website: {missing_website_count}")
