#!/usr/bin/env python3
"""
Merge MN city demo data with business listings
------------------------------------------------
INPUT 1: cities_with_demo.json      (list-style)
INPUT 2: city_businesses_2.json     (dict-style, 500+ & 100-499 only)
OUTPUT : cities_with_businesses.json

Each city gains a new key:
  "businesses": [
      {
        "name": "Target Corp HQ",
        "employee_category": "500+",
        "industry": "General Merchandise Stores",
        "description": "Corporate Headquarters"
      },
      ...
  ]
"""
import json
from pathlib import Path

DEMO_FILE  = Path("public/cities_with_demo.json")
BIZ_FILE   = Path("public/city_businesses_2.json")
OUT_FILE   = Path("public/cities_with_businesses.json")

# ---------- load ----------
demo_data = json.loads(DEMO_FILE.read_text())
biz_data  = json.loads(BIZ_FILE.read_text()).get("cities", {})

# Build a quick, case-insensitive lookup for the business dict
biz_lookup = {city.lower(): buckets for city, buckets in biz_data.items()}

for city_rec in demo_data["cities"]:
    name = city_rec["city"].lower()
    buckets = biz_lookup.get(name, {})

    merged = []
    for size in ("500+", "100-499"):
        for biz in buckets.get(size, []):
            merged.append({
                "name": biz["name"],
                "employee_category": size,
                "industry": biz["industry"],
                "description": biz["description"],
            })

    if merged:
        city_rec["businesses"] = merged   # attach to the city record

# ---------- save ----------
OUT_FILE.write_text(json.dumps(demo_data, indent=2))
print(f"✅  Wrote {OUT_FILE} with business data merged.")
