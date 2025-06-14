# scripts/scrape_businesses.py
import json, random, re, time, pathlib, requests
from typing import Dict, List
from urllib.parse import urlencode
from bs4 import BeautifulSoup

# ── paths ───────────────────────────────────────────────────────────────────
ROOT        = pathlib.Path(__file__).resolve().parent
PUBLIC_DIR  = ROOT / ".." / "public"
CITIES_FILE = PUBLIC_DIR / "basic_cities_with_uni.json"
OUT_FILE    = PUBLIC_DIR / "city_businesses.json"

# ── CareerOneStop constants ─────────────────────────────────────────────────
COS_BASE = "https://www.careeronestop.org/Toolkit/Jobs/find-businesses-results.aspx"
BANDS    = [("E", "500+"), ("D", "100-499"), ("C", "10-99")]

UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/125.0",
]

S = requests.Session()

# ── helpers ────────────────────────────────────────────────────────────────
def canon(text: str) -> str:
    """saint paul → st paul  (lower, collapse spaces)"""
    text = text.lower().replace("saint", "st").replace(".", " ")
    return re.sub(r"\s+", " ", text).strip()

def soup_get(url: str) -> BeautifulSoup:
    r = S.get(url, headers={"User-Agent": random.choice(UAS)}, timeout=25)
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")

def build_url(loc: str, band: str, page: int) -> str:
    q = {
        "location": loc,
        "curPage":  page,
        "pagesize": 25,
        "sortcolumns": "GEOCODE",
        "sortdirections": "ASC",
        "empsizefilter": band,
        "lang": "en",
    }
    return f"{COS_BASE}?{urlencode(q, safe=',')}"

def scrape_band(city_key: str, loc: str, code: str) -> List[Dict]:
    """Return all rows in one band whose city text contains `city_key`."""
    rows, page = [], 1
    while True:
        tbody = soup_get(build_url(loc, code, page)).find("tbody")
        if not tbody:
            break

        added = 0
        for tr in tbody.find_all("tr"):
            tds = tr.find_all("td", recursive=False)
            if len(tds) < 3:
                continue

            # ----- col-0 : name + city -----
            outer = tds[0].find("div")
            if not outer:
                continue
            divs = outer.find_all("div", recursive=False)
            if len(divs) < 3:
                continue

            name = re.sub(r'[“”"]', "", divs[0].find("a").get_text(strip=True))
            city_raw = re.sub(r"\s+", " ", divs[2].get_text(strip=True))

            if city_key not in canon(city_raw):
                continue

            # ----- col-1 : description -----
            desc_div = tds[1].find("div")
            desc = re.sub(r'[“”"]', "", desc_div.get_text(strip=True)) if desc_div else ""

            # ----- col-2 : industry --------
            ind_div = tds[2].find("div")
            industry = re.sub(r'[“”"]', "", ind_div.get_text(strip=True)) if ind_div else ""

            rows.append(
                {
                    "name": name,
                    "description": desc,
                    "industry": industry,
                    "raw_city": city_raw,
                }
            )
            added += 1

        if added < 25:
            break
        page += 1
        time.sleep(0.7)
    return rows

def scrape_city(city: str) -> Dict[str, List[Dict]]:
    """
    Query bands E, D, (optionally C) for `city`.
    Returns {} if zero businesses.
    """
    loc      = f"{city.replace('Saint', 'St.')}, MN"
    city_key = canon(city)

    out, total_ed = {}, 0
    for code, label in BANDS:
        if code == "C" and total_ed >= 25:
            break
        band_rows = scrape_band(city_key, loc, code)
        if band_rows:
            out[label] = band_rows
            if code in ("E", "D"):
                total_ed += len(band_rows)
    return out

# ── main ──────────────────────────────────────────────────────────────────
def main():
    PUBLIC_DIR.mkdir(exist_ok=True, parents=True)

    city_list = json.loads(CITIES_FILE.read_text(encoding="utf-8"))["cities"]
    print(f"🚀 Scraping {len(city_list)} MN cities for businesses …")

    merged, no_results = {}, []

    for idx, entry in enumerate(city_list, 1):
        city = entry["city"]
        print(f"[{idx}/{len(city_list)}] {city}")
        try:
            bands = scrape_city(city)
        except Exception as e:
            print("   ⚠️ error:", e)
            no_results.append(city)
            continue

        if bands:
            total = sum(len(v) for v in bands.values())
            print(f"   ✓ {total} businesses")
            merged[city] = bands
        else:
            print("   — no businesses")
            no_results.append(city)

        time.sleep(random.uniform(2.0, 4.0))  # polite between cities

    OUT_FILE.write_text(
        json.dumps({"cities": merged, "no_results": no_results}, indent=2),
        encoding="utf-8"
    )
    print(f"\n✅  Finished! {len(merged)} cities scraped, "
          f"{len(no_results)} with no results → {OUT_FILE}")

if __name__ == "__main__":
    main()