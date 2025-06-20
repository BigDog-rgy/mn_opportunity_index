import json

with open("public/city_news.json", encoding="utf-8") as f:
    data = json.load(f)

for city, stories in data.items():
    for s in stories:
        l = s["link"]
        if l.startswith("/news/"):
            s["link"] = "https://www.fox9.com" + l
        elif l.startswith("news/"):
            s["link"] = "https://www.fox9.com/" + l
        elif l.startswith("/"):
            s["link"] = "https://www.fox9.com" + l

with open("public/city_news_fixed.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
