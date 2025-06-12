import json, pathlib
# 1) load the TIGER states file
src = json.load(open("public/gz_2010_us_040_00_20m.json"))
# 2) find Minnesota (STATE == "27")
mn = next(f for f in src["features"] if f["properties"]["STATE"] == "27")
# 3) wrap in a FeatureCollection
out = {"type": "FeatureCollection", "features": [mn]}
# 4) write to public/
pathlib.Path("public/mn_border.geojson").write_text(json.dumps(out))
print("✅  public/mn_border.geojson written")
