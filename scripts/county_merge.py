import json

with open("public/cities_with_businesses_merged.json", encoding="utf-8") as f:
    data = json.load(f)

with open("counties.json", encoding="utf-8") as f:
    county_websites = json.load(f)

missing_cities = []

# Access the cities array
cities = data.get("cities", [])
print(f"Processing {len(cities)} cities")

# Update each city with county website
for city in cities:
    county_name = city.get("county")
    if county_name:
        county_name = county_name.strip()
        county_site = county_websites.get(county_name, "")
        if county_site:
            city["county_website"] = county_site
        else:
            city["county_website"] = ""
            missing_cities.append(f"{city.get('city')} (county: {county_name})")
    else:
        city["county_website"] = ""
        missing_cities.append(f"{city.get('city')} (no county field)")

# Write updated data back
with open("cities_with_businesses_countyweb.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Cities missing county website:")
for c in missing_cities:
    print("  -", c)
print(f"\nTotal missing: {len(missing_cities)} out of {len(cities)}")
print(f"Successfully processed and saved {len(cities)} cities")