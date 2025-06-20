import json
import time
import requests
from bs4 import BeautifulSoup
from pathlib import Path

CITIES_FILE = Path("public/cities_with_businesses_merged.json")
OUT_FILE = Path("public/city_news.json")
FROM_DATE = "2025-01-01"

def scrape_fox9_news(city_query, from_date=FROM_DATE):
    url = f"https://www.fox9.com/search?q={city_query.replace(' ', '%20')}&sort=relevance&page=1&from={from_date}"
    r = requests.get(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    })
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    articles = soup.find_all("article")[:3]
    results = []
    for art in articles:
        divs = art.find_all("div", recursive=False)
        if len(divs) < 2:
            continue
        h3 = divs[1].find("h3")
        desc = divs[1].find("p")
        if not h3 or not h3.a:
            continue
        title = h3.a.get_text(strip=True)
        link = h3.a.get("href", "")
        description = desc.get_text(strip=True) if desc else ""
        results.append({
            "title": title,
            "link": link,
            "description": description
        })
    return results

def main():
    data = json.loads(CITIES_FILE.read_text(encoding="utf-8"))
    city_list = data["cities"]
    news_by_city = {}
    no_news_count = 0

    for idx, city in enumerate(city_list):
        city_name = city["city"]
        # Query like: "red wing mn"
        q = f"{city_name} mn"
        print(f"[{idx+1}/{len(city_list)}] {q}...")
        try:
            stories = scrape_fox9_news(q)
        except Exception as e:
            print(f"   ⚠️ Error scraping: {e}")
            stories = []
        if stories:
            news_by_city[city_name] = stories
            print(f"   ✓ {len(stories)} stories")
        else:
            no_news_count += 1
            news_by_city[city_name] = []
            print("   — No news found")
        time.sleep(1.0)  # Be kind; could go even faster if you want to YOLO

    OUT_FILE.write_text(json.dumps(news_by_city, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n📰 Finished! {no_news_count} cities had no news → {OUT_FILE.relative_to(Path.cwd())}")

if __name__ == "__main__":
    main()
