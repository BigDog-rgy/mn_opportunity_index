# scripts/scrape_mn_demo_full.py
import json, random, time, re, pathlib, requests, string
from urllib.parse import urljoin
from bs4 import BeautifulSoup

BASE         = "https://www.minnesota-demographics.com"
OUT          = pathlib.Path("public/mn_demo_full.json")
LETTERS      = list(string.ascii_uppercase)        # A-Z
SLEEP_RANGE  = (2.0, 5.0)                          # polite delay

UA_ROTATE = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/125.0",
]

session = requests.Session()

# ───────────────────────── helpers ────────────────────────────
def soup_get(url: str) -> BeautifulSoup:
    r = session.get(
        url,
        headers={
            "User-Agent": random.choice(UA_ROTATE),
            "Accept-Language": "en-US,en;q=0.8",
            "Referer": BASE,
        },
        timeout=25,
    )
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")

def clean_num(txt: str):
    val = re.sub(r"[^\d.]", "", txt)
    try:
        return float(val) if "." in val else int(val)
    except ValueError:
        return None

def scrape_city(city_url: str) -> dict:
    soup  = soup_get(city_url)
    title = soup.find("h1").get_text(strip=True)
    city  = title.split(",")[0]

    # median age & income
    median_age = median_income = None
    tbodies = soup.find_all("tbody")
    if len(tbodies) >= 2 and tbodies[1].find_all("tr"):
        tds = tbodies[1].find_all("tr")[0].find_all("td")
        if len(tds) >= 4:
            median_age    = clean_num(tds[2].get_text())
            median_income = int(clean_num(tds[3].get_text()) or 0)

    # race paragraph
    race_para = None
    head = soup.find(lambda t: t and t.name in ("h2", "h3")
                     and "race" in t.get_text(strip=True).lower())
    if head:
        for sib in head.next_siblings:
            if getattr(sib, "name", None) == "p":
                race_para = sib.get_text(" ", strip=True)
                break

    return {
        "city": city,
        "median_age": median_age,
        "median_income": median_income,
        "race_ethnicity": race_para,
    }

# ───────────────────────── main loop ──────────────────────────
def main():
    print("🚀 Starting full MN demographics scrape …")
    results, seen = [], set()

    for letter in LETTERS:
        page_url = f"{BASE}/counties-cities-that-begin-with-{letter}"
        try:
            soup = soup_get(page_url)
        except requests.HTTPError as e:
            print(f"⚠️  Skip letter {letter}: {e}")
            continue

        h2 = soup.find("h2", string=re.compile(r"cities in minnesota", re.I))
        anchor_ul = h2.find_next("ul") if h2 else None
        if not anchor_ul:
            print(f"— Letter {letter}: no cities found, skipping.")
            continue

        print(f"\n=== Letter {letter} ({page_url}) ===")
        for a in anchor_ul.select("a[href]"):
            city_url = urljoin(BASE, a["href"])
            city_key = a.get_text(strip=True).lower()
            if city_key in seen:
                continue
            seen.add(city_key)

            print("•", city_key.title())
            try:
                results.append(scrape_city(city_url))
            except Exception as exc:
                print(f"  ⚠️  Failed {city_key}: {exc}")
                continue

            time.sleep(random.uniform(*SLEEP_RANGE))

    # always write whatever we collected, even if empty
    OUT.parent.mkdir(exist_ok=True, parents=True)
    OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\n✅  Done! {len(results)} cities saved → {OUT.resolve()}")

if __name__ == "__main__":
    main()
