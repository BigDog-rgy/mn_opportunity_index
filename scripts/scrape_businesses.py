# scripts/scrape_city_businesses_all.py
import json, random, re, time, pathlib, requests
from typing import Dict, List
from urllib.parse import urlencode
from bs4 import BeautifulSoup

# ── I/O paths ────────────────────────────────────────────────────────────────
BASE_DIR   = pathlib.Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / ".." / "public"
CITIES_FILE = PUBLIC_DIR / "basic_cities_with_uni.json"
OUT_FILE    = PUBLIC_DIR / "city_businesses.json"

# ── CareerOneStop constants ──────────────────────────────────────────────────
COS_BASE   = "https://www.careeronestop.org/Toolkit/Jobs/find-businesses-results.aspx"
BANDS      = [("E", "500+"), ("D", "100-499"), ("C", "10-99")]  # scrape C conditionally
UA_ROTATE  = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/125.0",
]

SESSION = requests.Session()

# ── helpers ──────────────────────────────────────────────────────────────────
def soup_get(url: str) -> BeautifulSoup:
    r = SESSION.get(
        url,
        headers={"User-Agent": random.choice(UA_ROTATE)},
        timeout=25,
    )
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")

def build_url(location: str, band_code: str, page: int) -> str:
    return f"{COS_BASE}?{urlencode({'location': location, 'curPage': page, 'pagesize': 25, 'sortcolumns': 'GEOCODE', 'sortdirections': 'ASC', 'empsizefilter': band_code, 'lang': 'en'}, safe=',')}"

def scrape_band(city_key: str, location: str, band_code: str) -> List[Dict]:
    """Scrape **every** page for a band; keep only rows matching city_key."""
    results, page = [], 1
    while True:
        soup = soup_get(build_url(location, band_code, page))
        tbody = soup.find("tbody")
        if not tbody:
            break

        added = 0
        for tr in tbody.find_all("tr"):
            td = tr.find("td")
            outer = td.find("div") if td else None
            divs = outer.find_all("div", recursive=False) if outer else []
            if len(divs) < 3:
                continue

            a_name = divs[0].find("a")
            if not a_name:
                continue
            name = re.sub(r'[“”"]', '', a_name.get_text(strip=True)).strip()

            third_text = re.sub(r'\s+', ' ', divs[2].get_text(strip=True)).strip()
            if city_key not in third_text.lower():
                continue

            results.append({"name": name, "third_div": third_text})
            added += 1

        if added < 25:  # page had < pagesize hits → last page
            break
        page += 1
        time.sleep(0.7)  # be polite
    return results

def scrape_city(city_name: str) -> Dict[str, List[Dict]]:
    """Scrape the required bands for one city. Returns {} if none found."""
    location = f"{city_name}, MN"
    city_key = city_name.lower()

    bands_output = {}
    # scrape E and D first
    total_ed = 0
    for code, label in BANDS:
        if code == "C" and total_ed >= 25:
            break
        rows = scrape_band(city_key, location, code)
        if rows:
            bands_output[label] = rows
            if code in ("E", "D"):
                total_ed += len(rows)
    return bands_output

# ── main ─────────────────────────────────────────────────────────────────────
def main():
    PUBLIC_DIR.mkdir(exist_ok=True, parents=True)

    city_list = json.loads(CITIES_FILE.read_text(encoding="utf-8"))["cities"]
    print(f"🚀 Scraping {len(city_list)} MN cities for businesses …")

    results = {}
    no_results = []

    for idx, entry in enumerate(city_list, 1):
        city = entry["city"]
        print(f"\n[{idx}/{len(city_list)}] 👉  {city} …")
        try:
            bands = scrape_city(city)
        except Exception as exc:
            print(f"   ⚠️  ERROR scraping {city}: {exc}")
            no_results.append(city)
            continue

        if not bands:
            print(f"   — No businesses found for {city}")
            no_results.append(city)
        else:
            total_rows = sum(len(v) for v in bands.values())
            print(f"   ✓ {total_rows} businesses")
            results[city] = bands

        # throttle between cities
        time.sleep(random.uniform(2.0, 4.0))

    # write output
    OUT_FILE.write_text(
        json.dumps({"cities": results, "no_results": no_results}, indent=2),
        encoding="utf-8"
    )
    print(f"\n✅  Finished! {len(results)} cities scraped, "
          f"{len(no_results)} with no results → {OUT_FILE.resolve()}")

if __name__ == "__main__":
    main()
