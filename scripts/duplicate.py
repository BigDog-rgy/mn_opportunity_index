#!/usr/bin/env python3
import json
from collections import Counter
from pathlib import Path

FILE = Path("public/cities_with_businesses.json")

data = json.loads(FILE.read_text())
names = [c["city"].strip().lower() for c in data["cities"]]

dupes = {name: count for name, count in Counter(names).items() if count > 1}

if dupes:
    print("🚨 Duplicate cities found:")
    for name, count in dupes.items():
        print(f"  • {name.title()}  (appears {count} times)")
else:
    print("✅ No duplicates detected.")
