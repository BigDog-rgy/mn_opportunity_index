#!/usr/bin/env python3
import json
from pathlib import Path

SRC  = Path("public/city_businesses.json")     # original file
DEST = Path("public/city_businesses_2.json")   # new file w/out 10-99 companies

data = json.loads(SRC.read_text())

for city, buckets in list(data.get("cities", {}).items()):
    # drop the entire 10-99 bucket if present
    buckets.pop("10-99", None)

    # OPTIONAL: scrub cities that now have zero companies left
    if not any(buckets.values()):           # no 500+ or 100-499 either
        data["cities"].pop(city)

DEST.write_text(json.dumps(data, indent=2))
print(f"✅  Wrote {DEST} with all 10-99 firms removed.")
