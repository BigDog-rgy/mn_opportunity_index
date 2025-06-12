# bake_mask.py  (run once)
import json, pathlib, shapely.geometry as sg, shapely.ops as so

us = json.load(open("public/gz_2010_us_040_00_20m.json"))
mn  = next(f for f in us["features"] if f["properties"]["STATE"]=="27")

world = sg.Polygon([(-180,-90),(180,-90),(180,90),(-180,90)])
mn_shape = sg.shape(mn["geometry"])
mask = world.difference(mn_shape)

out = {
    "type":"FeatureCollection",
    "features":[sg.mapping(mask)]
}
pathlib.Path("public/mn_mask.geojson").write_text(json.dumps(out))
print("mask baked ✔")
