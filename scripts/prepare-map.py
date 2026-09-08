"""Convert the ISC-licensed us-atlas Albers topology into bundled SVG paths.

Source: https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json
Usage: python3 scripts/prepare-map.py /path/to/states-albers-10m.json
"""
import json
import pathlib
import sys

topology = json.loads(pathlib.Path(sys.argv[1]).read_text())
scale = topology['transform']['scale']
translate = topology['transform']['translate']
arcs = []
for arc in topology['arcs']:
    x = y = 0
    points = []
    for dx, dy in arc:
        x += dx
        y += dy
        points.append((round(x * scale[0] + translate[0], 1), round(y * scale[1] + translate[1], 1)))
    arcs.append(points)

states = []
for geometry in topology['objects']['states']['geometries']:
    if geometry['properties']['name'] in ('District of Columbia', 'Puerto Rico'):
        continue
    polygons = geometry['arcs'] if geometry['type'] == 'MultiPolygon' else [geometry['arcs']]
    rings = []
    all_points = []
    for polygon in polygons:
        for ring in polygon:
            points = []
            for index in ring:
                segment = arcs[index] if index >= 0 else list(reversed(arcs[~index]))
                points.extend(segment if not points else segment[1:])
            rings.append('M' + 'L'.join(f'{x},{y}' for x, y in points) + 'Z')
            all_points.extend(points)
    xs, ys = zip(*all_points)
    states.append({'name': geometry['properties']['name'], 'path': ''.join(rings), 'bounds': [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]})

target = pathlib.Path(__file__).resolve().parents[1] / 'data' / 'map-paths.json'
target.write_text(json.dumps(states, separators=(',', ':')) + '\n')
print(f'Prepared {len(states)} state shapes ({target.stat().st_size:,} bytes)')
