import json, pathlib, requests
from bs4 import BeautifulSoup

INFILE  = pathlib.Path("public/basic_cities.json")
OUTFILE = pathlib.Path("public/city_images.json")

def get_infobox_image(wiki_url):
    try:
        resp = requests.get(wiki_url, timeout=12, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(resp.text, "html.parser")
        infobox = soup.find("table", class_="infobox")
        if not infobox:
            return None
        img = infobox.find("img")
        if not img:
            return None
        src = img.get("src")
        if src.startswith("//"):
            src = "https:" + src
        elif src.startswith("/"):
            src = "https://en.wikipedia.org" + src
        return src
    except Exception as e:
        print(f"Error fetching {wiki_url}: {e}")
        return None

def main():
    data = json.loads(INFILE.read_text(encoding="utf-8"))
    cities = data["cities"]
    results = []
    missing = []

    for idx, city in enumerate(cities, 1):
        name = city["city"].strip().replace(" †", "")
        wiki = city.get("wikipedia_url")
        print(f"[{idx}/{len(cities)}] {name}: ", end="", flush=True)
        if not wiki:
            print("No Wikipedia URL!")
            image_url = None
        else:
            image_url = get_infobox_image(wiki)
            print(image_url if image_url else "❌ No image")
        if not image_url:
            missing.append(name)
        results.append({"city": name, "image_url": image_url})

    # Write out the JSON
    OUTFILE.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")

    # Print the report
    print("\n--- SUMMARY REPORT ---")
    print(f"Total cities:      {len(cities)}")
    print(f"Missing images:    {len(missing)}")
    if missing:
        print("Cities missing images:")
        for n in missing:
            print("  -", n)

    print(f"\n✅ Finished! Results written to {OUTFILE}")

if __name__ == "__main__":
    main()
