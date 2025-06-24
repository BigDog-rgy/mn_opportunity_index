import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://en.wikipedia.org"

def get_county_rows():
    url = "https://en.wikipedia.org/wiki/List_of_counties_in_Minnesota"
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table", class_="wikitable")
    tbody = table.find("tbody")
    for tr in tbody.find_all("tr")[1:]:  # Skip header row
        th = tr.find("th")
        if th and th.a:
            county_name = th.a.text.replace(" County", "").strip()
            link = BASE_URL + th.a["href"]
            yield county_name, link

def extract_county_website(county_url):
    resp = requests.get(county_url)
    soup = BeautifulSoup(resp.text, "html.parser")
    infobox = soup.find("table", class_="infobox")
    if not infobox:
        return None
    for tr in infobox.find_all("tr"):
        th = tr.find("th")
        if th and th.text.strip().lower() == "website":
            td = tr.find("td")
            if not td:
                return None
            # Find <a> inside <span> inside <td>
            span = td.find("span")
            if not span:
                return None
            a = span.find("a", href=True)
            if a:
                return a["href"]
            return None
    return None

def main():
    results = {}
    for county_name, wiki_url in get_county_rows():
        print(f"{county_name}: {wiki_url} ... ", end="")
        try:
            website = extract_county_website(wiki_url)
            print(website or "No website found.")
            results[county_name] = website or ""
        except Exception as e:
            print(f"ERROR: {e}")
            results[county_name] = ""
        time.sleep(0.5)  # Polite scraping
    with open("counties.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("All done! Output: counties.json")

if __name__ == "__main__":
    main()
