"""Build small, georeferenced Japan outlines from Natural Earth's public-domain data.

Usage: python3 scripts/build-geographic-map.py /path/to/ne_10m_admin_1_states_provinces.geojson
Source revision: 117488dc884bad03366ff727eca013e434615127
https://www.naturalearthdata.com/about/terms-of-use/
"""
import json
import math
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
old = json.loads((root / "src/lib/japan-map.js").read_text().split("= ", 1)[1].strip().rstrip(";"))


def simplify(points, tolerance=0.002):
    if len(points) < 4:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = math.hypot(dx, dy)
    distances = [abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / length if length else math.dist(a, p) for p in points]
    index = max(range(len(points)), key=distances.__getitem__)
    if distances[index] <= tolerance:
        return [a, b]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


features = json.loads(pathlib.Path(sys.argv[1]).read_text())["features"]
result = []
for feature in features:
    props = feature["properties"]
    if props["admin"] != "Japan":
        continue
    number = int(props["iso_3166_2"].split("-")[1])
    original = old[number - 1]
    geometry = feature["geometry"]
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    rings = []
    for polygon in polygons:
        for ring in polygon:
            points = simplify(ring)
            if len(points) >= 4:
                rings.append([[round((lon - 122) * 18, 3), round((46 - lat) * 22, 3)] for lon, lat in points])
    result.append({"id": original["id"], "name": original["name"], "rings": rings})
result.sort(key=lambda pref: next(i for i, entry in enumerate(old) if entry["id"] == pref["id"]))
(root / "src/lib/geographic-map.js").write_text("// Natural Earth Admin 1, public domain. See MAP-LICENSE.md and scripts/build-geographic-map.py.\nexport const GEOGRAPHIC_MAP = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n")
