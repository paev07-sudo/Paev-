"""Exact geometric redraw of the Kunzle wordmark (the source is a small JPEG, so tracing wobbles).

Every coordinate below was measured at sub-pixel precision on brand/sources/kunzle-logo.jpg
(50 % coverage crossings, see the measurements in the git history). Cap line y = 72, baseline
y = 316; stems 56 px, horizontal bars 47 px. The "un" ligature is built as a union of stems,
an elliptical bowl and a super-elliptical arch (shapely). The small tagline keeps the potrace trace.
Updates brand/kunzle-logo.svg and metamorphose/data/logos.json.
Usage: python3 brand/tools/kunzle_geometry.py   (after vectorize.py)
"""
import json
import pathlib
import numpy as np
from shapely.geometry import Polygon, box
from shapely.ops import unary_union

ROOT = pathlib.Path(__file__).resolve().parents[2]
T, B = 72.0, 316.0


def line_x(x0, y0, slope):          # x as a function of y through (x0, y0), slope = dx/dy
    return lambda y: x0 + slope * (y - y0)


# K ---------------------------------------------------------------------------
armL = line_x(123.9, 80, -0.714); armR = line_x(192.9, 80, -0.72)
legL = line_x(149.0, 310, 0.877); legR = line_x(224.9, 310, 0.889)
y_arm_stem = 80 + (123.9 - 57.4) / 0.714                      # arm left edge meets the stem
y_leg_stem = 310 - (149.0 - 57.4) / 0.877                     # leg left edge meets the stem
yj = (250.5 + 50.7) / 1.609                                   # arm right edge ∩ leg right edge
y_clip = 310 + (224.0 - 224.9) / 0.889                        # leg clipped at x = 224 (next to the U)
K = [(4.0, T), (57.4, T), (57.4, y_arm_stem), (armL(T), T), (armR(T), T), (armR(yj), yj),
     (224.0, y_clip), (224.0, B), (legL(B), B), (57.4, y_leg_stem), (57.4, B), (4.0, B)]

# Z ---------------------------------------------------------------------------
dR = line_x(798.9, 130, -0.707); dL = line_x(732.0, 130, -0.727)
Z = [(625.7, T), (810.4, T), (810.4, 130 - (810.4 - 798.9) / 0.707), (dR(269.4), 269.4), (817.8, 269.4),
     (817.8, B), (625.4, B), (625.4, 130 + (732.0 - 625.4) / 0.727), (dL(118.8), 118.8), (625.7, 118.8)]

# L, E ------------------------------------------------------------------------
L = [(845.9, T), (902.1, T), (902.1, 269.4), (990.4, 269.4), (990.4, B), (845.9, B)]
E = [(1018.8, T), (1191.6, T), (1191.6, 118.8), (1075.5, 118.8), (1075.5, 168.1), (1183.1, 168.1),
     (1183.1, 214.4), (1075.5, 214.4), (1075.5, 269.4), (1191.5, 269.4), (1191.5, B), (1018.8, B)]

# check (blue accent) -----------------------------------------------------------
CHECK = [(304.6, 25.1), (332.0, 50.95), (383.2, 2.4), (383.2, 48.5), (330.6, 96.3), (304.6, 69.8)]


# un ligature -------------------------------------------------------------------
def superellipse(cx, cy, rx, ry, n, a0, a1, k=180):
    t = np.linspace(a0, a1, k)
    c, s = np.cos(t), np.sin(t)
    return [(cx + rx * np.sign(ci) * abs(ci) ** (2 / n), cy + ry * np.sign(si) * abs(si) ** (2 / n)) for ci, si in zip(c, s)]


def half_annulus(cx, cy, ro, n_out, ri, n_in, lower):
    a0, a1 = (0, np.pi) if lower else (np.pi, 2 * np.pi)       # y grows downwards
    outer = superellipse(cx, cy, ro[0], ro[1], n_out, a0, a1)
    inner = superellipse(cx + ri[2], cy, ri[0], ri[1], n_in, a1, a0)
    return Polygon(outer + inner).buffer(0)


un = unary_union([
    box(224.7, T, 280.6, 229.0),                                               # left stem of u (overlaps the bowl)
    half_annulus(332.2, 227.4, (107.5, 99.0), 2.0, (50.95, 50.95, -0.6), 2.0, lower=True),
    box(382.5, T, 439.8, B),                                                   # shared stem
    half_annulus(490.25, 164.8, (107.75, 102.8), 2.45, (51.1, 51.0, 0.65), 4.5, lower=False),
    box(542.0, 163.0, 598.0, B),                                               # right stem of n (overlaps the arch)
]).simplify(0.05)


def ring_d(coords):
    return 'M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in coords[:-1]) + 'Z'


def densify(P, step=3.0):
    out = []
    for k in range(len(P)):
        a, b = np.array(P[k]), np.array(P[(k + 1) % len(P)])
        n = max(1, int(np.hypot(*(b - a)) / step))
        for u in np.arange(n) / n:
            q = a + (b - a) * u
            out.append([round(float(q[0]), 2), round(float(q[1]), 2)])
    return out


def main():
    data = json.loads((ROOT / 'metamorphose/data/logos.json').read_text())
    parts = {p['id']: p for p in data['kunzle']['parts']}
    for pid, P in [('K', K), ('Z', Z), ('L', L), ('E', E), ('check', CHECK)]:
        parts[pid]['d'] = ring_d(P + [P[0]])
        parts[pid]['contours'] = [{'pts': densify(P), 'hole': False}]
    ext = list(un.exterior.coords)
    parts['UN']['d'] = ring_d(ext)
    parts['UN']['contours'] = [{'pts': densify(ext[:-1]), 'hole': False}]
    (ROOT / 'metamorphose/data/logos.json').write_text(json.dumps(data))
    k = data['kunzle']
    X0, Y0, X1, Y1 = k['bbox']
    pad = 8
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X0 - pad} {Y0 - pad} {X1 - X0 + 2 * pad} {Y1 - Y0 + 2 * pad}">',
           '  <title>Kunzle</title>']
    for p in k['parts']:
        svg.append(f'  <path id="{p["id"]}" fill="{p["color"]}" fill-rule="evenodd" d="{p["d"]}"/>')
    svg.append('</svg>')
    (ROOT / 'brand/kunzle-logo.svg').write_text('\n'.join(svg) + '\n')
    print('kunzle: geometric K, UN, Z, L, E, check written')


if __name__ == '__main__':
    main()
