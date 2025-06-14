"""
scrape_mn_universities.py
---------------------------------
Builds a city-level catalogue of MN universities and enrollment.

Output → public/mn_uni_by_city.json  (UTF-8)
"""

import json, re, pathlib, requests, pandas as pd
from io import StringIO
from bs4 import BeautifulSoup

URL = "https://en.wikipedia.org/wiki/List_of_colleges_and_universities_in_Minnesota"
OUT = pathlib.Path("public/mn_uni_by_city.json")

# ──────────────────────────────────────────────────────────────
# 1. Fetch page & read the main table
# ──────────────────────────────────────────────────────────────
html = requests.get(URL, timeout=30).text
# Wrap in StringIO to avoid the future-warning
tables = pd.read_html(StringIO(html), match="Institution")
df = tables[0]         # first wikitable is the master list

# ──────────────────────────────────────────────────────────────
# 2. Identify the enrollment column dynamically
# ──────────────────────────────────────────────────────────────
enroll_col = next(
    (c for c in df.columns if str(c).strip().lower().startswith("enroll")),
    None
)
if not enroll_col:
    raise RuntimeError("Cannot find an 'Enrollment' column – Wiki layout changed.")

# Keep only what we need
df = df[["Institution", "Location(s)", enroll_col]].dropna(subset=["Institution"])
df = df.rename(columns={enroll_col: "Enrollment"})

# ──────────────────────────────────────────────────────────────
# 3. Clean enrollment → int (strip commas / footnotes)
# ──────────────────────────────────────────────────────────────
def clean_enr(val):
    if isinstance(val, str):
        val = re.sub(r"\[.*?]", "", val)    # footnotes
        val = val.replace(",", "").strip()
    try:
        return int(val)
    except (ValueError, TypeError):
        return None

df["Enrollment"] = df["Enrollment"].apply(clean_enr)

# ──────────────────────────────────────────────────────────────
# 4. Explode by city (rows can list multiple campuses)
# ──────────────────────────────────────────────────────────────
rows = []
for _, r in df.iterrows():
    uni  = r["Institution"].strip()
    enr  = r["Enrollment"]
    for loc in str(r["Location(s)"]).split(";"):
        city = loc.split(",")[0].strip()
        if city:
            rows.append({"city": city, "name": uni, "enrollment": enr})

city_df   = pd.DataFrame(rows)

# ──────────────────────────────────────────────────────────────
# 5. Aggregate → { city : [ {name,enrollment}, … ] }
# ──────────────────────────────────────────────────────────────
city_dict = {
    city: [
        {"name": rec["name"], "enrollment": rec["enrollment"]}
        for _, rec in grp.iterrows()
    ]
    for city, grp in city_df.groupby("city")
}

# ──────────────────────────────────────────────────────────────
# 6. Save JSON for front-end tests
# ──────────────────────────────────────────────────────────────
OUT.write_text(json.dumps(city_dict, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"✅  Saved {len(city_dict)} cities → {OUT.relative_to(pathlib.Path.cwd())}")
