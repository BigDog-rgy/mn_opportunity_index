import json, pathlib

CITIES_FILE = pathlib.Path("public/cities_with_businesses_2.json")
BIZ_FILE    = pathlib.Path("public/city_businesses_2.json")
OUT_FILE    = pathlib.Path("public/cities_with_businesses_merged.json")  # Or overwrite the original

# Load both files
cities = json.loads(CITIES_FILE.read_text(encoding="utf-8"))["cities"]
biz_data = json.loads(BIZ_FILE.read_text(encoding="utf-8"))["cities"]

def find_biz_website(biz_list, name, industry, desc, cat):
    """Find matching company in scraped businesses by name, category, optionally industry/desc."""
    companies = []
    # Pick the right bucket ("500+", "100-499") for the city
    if cat in biz_list:
        companies = biz_list[cat]
    # Sometimes categories can be a string instead of a list
    if not isinstance(companies, list): return None

    # Try to match on name (case-insensitive, loose), fallback to industry
    for b in companies:
        if b["name"].lower().strip() == name.lower().strip():
            return b.get("website")
    # If not matched, try matching on name substrings
    for b in companies:
        if name.lower().strip() in b["name"].lower().strip():
            return b.get("website")
    # Fallback: try matching on industry and desc
    for b in companies:
        if (b.get("industry","").lower() == industry.lower()) and (b.get("description","").lower() == desc.lower()):
            return b.get("website")
    return None

updated = []
unmatched = 0

for city in cities:
    cname = city["city"]
    businesses = city.get("businesses", [])
    biz_lookup = biz_data.get(cname, {})

    for b in businesses:
        cat = b.get("employee_category")
        name = b.get("name", "")
        industry = b.get("industry", "")
        desc = b.get("description", "")
        website = find_biz_website(biz_lookup, name, industry, desc, cat)
        if website:
            b["website"] = website
        else:
            unmatched += 1  # Count if not found

    updated.append(city)

OUT_FILE.write_text(json.dumps({"cities": updated}, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"✅  Merged company websites for all cities.")
print(f"🔎  {unmatched} businesses had no website found.")

# Optionally print examples:
for city in updated:
    for b in city.get("businesses", []):
        if "website" in b:
            print(f"{city['city']}: {b['name']} — {b['website']}")
