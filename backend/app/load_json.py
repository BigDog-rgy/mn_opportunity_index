import json, sys, slugify
from app.db import engine
from app.models import City
from sqlmodel import Session

def normalize_json(raw):
    """Accept either a list or {'cities':[...]}"""
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and "cities" in raw:
        return raw["cities"]
    raise ValueError("Unsupported JSON shape")

if len(sys.argv) != 2:
    print("Usage: python -m app.load_json cities.json"); sys.exit(1)

with open(sys.argv[1]) as f:
    data = normalize_json(json.load(f))

with Session(engine) as s:
    for d in data:
        s.add(City(
            name=d["city"],
            slug=slugify.slugify(d["city"]),
            population=d.get("population_2020"),
            county=d["county"],
            county_website=d.get("county_website")
        ))
    s.commit()

print("Imported", len(data), "cities")
