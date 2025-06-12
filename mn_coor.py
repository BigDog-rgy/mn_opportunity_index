
import json, pathlib, sys
src = json.load(open("public/gz_2010_us_040_00_20m.json"))

mn_only = {
    "type": "FeatureCollection",
    "features": [
        f for f in src["features"]
        if f["properties"].get("STATE") == "27"      # or f["properties"]["NAME"]=="Minnesota"
    ]
}

out = pathlib.Path("public/mn_border.geojson")
out.write_text(json.dumps(mn_only))
print("Wrote", out, "with", len(mn_only["features"]), "feature(s)")
