"""Vectorise the Kunzle and Rigolet logos part by part (potrace on 4x-upsampled coverage).

For each colour class (ink / accent) the anti-aliased coverage is estimated by projecting
each pixel on the white→colour line, upsampled ×4, thresholded at 50 % and traced with potrace.
Every connected component is traced on its own, so each letter becomes a named part.

Writes brand/kunzle-logo.svg, brand/rigolet-logo.svg and metamorphose/data/logos.json.
Usage: python3 brand/tools/vectorize.py
"""
import json
import pathlib
import numpy as np
import cv2
import potrace
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
UP = 4

LOGOS = {
    'rigolet': {
        'src': 'brand/sources/rigolet-logo.webp',
        'colors': {'ink': '#575C68', 'accent': '#C55265'},
        'soft': 0.4,
        # left-to-right component names
        'ink': ['R', 'i_dot', 'i_stem', 'g', 'o', 'l', 'e', 't', 'S', 'A'],
        'accent': ['triangle'] + [f'tag{i}' for i in range(10)] + ['tag_tri'] + [f'tag{i}' for i in range(10, 20)],
    },
    'kunzle': {
        'src': 'brand/sources/kunzle-logo.jpg',
        'colors': {'ink': '#3C454C', 'accent': '#0298D8'},
        'soft': 1.6,     # small JPEG: smooth the compression noise before tracing
        'ink': None,     # named below from geometry
        'accent': ['check'],
    },
}


def hex2rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)


def coverage(im, col, cls):
    sat = im.max(2) - im.min(2)
    a = ((255 - im) @ (255 - col)) / ((255 - col) @ (255 - col))
    a = np.clip(a, 0, 1)
    return a * ((sat > 25) if cls == 'accent' else (sat < 60))


def trace_component(alpha, mask, x0, y0, x1, y1, soft):
    pad = 4
    xa, ya = max(0, x0 - pad), max(0, y0 - pad)
    xb, yb = min(alpha.shape[1], x1 + pad), min(alpha.shape[0], y1 + pad)
    a = alpha[ya:yb, xa:xb] * cv2.dilate(mask[ya:yb, xa:xb], np.ones((5, 5), np.uint8))
    big = cv2.resize(a.astype(np.float32), None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), UP * soft)
    bm = potrace.Bitmap(~(big > 0.5))          # potracer traces the False pixels
    plist = bm.trace(turdsize=40, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0,
                     opticurve=True, opttolerance=0.4)
    T = lambda p: ((p.x) / UP + xa, (p.y) / UP + ya)
    d, contours = [], []
    for curve in plist:
        sp = T(curve.start_point)
        s = f'M{sp[0]:.2f} {sp[1]:.2f}'
        pts = [sp]
        cur = sp
        for seg in curve.segments:
            if seg.is_corner:
                c, e = T(seg.c), T(seg.end_point)
                s += f'L{c[0]:.2f} {c[1]:.2f}L{e[0]:.2f} {e[1]:.2f}'
                pts += [c, e]
            else:
                c1, c2, e = T(seg.c1), T(seg.c2), T(seg.end_point)
                s += f'C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {e[0]:.2f} {e[1]:.2f}'
                for u in np.linspace(0, 1, 24)[1:]:
                    q = ((1 - u) ** 3 * np.array(cur) + 3 * u * (1 - u) ** 2 * np.array(c1)
                         + 3 * u * u * (1 - u) * np.array(c2) + u ** 3 * np.array(e))
                    pts.append(tuple(q))
            cur = pts[-1]
        d.append(s + 'Z')
        P = np.array(pts)
        area = 0.5 * np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])
        contours.append({'pts': [[round(x, 2), round(y, 2)] for x, y in pts], 'area': float(area)})
    # outer contour = largest |area|; holes have the opposite sign
    if contours:
        sgn = np.sign(max(contours, key=lambda c: abs(c['area']))['area'])
        for c in contours:
            c['hole'] = bool(np.sign(c['area']) != sgn)
    return ''.join(d), contours


def main():
    out = {}
    for name, cfg in LOGOS.items():
        im = np.asarray(Image.open(ROOT / cfg['src']).convert('RGB')).astype(float)
        parts = []
        for cls in ('ink', 'accent'):
            col = hex2rgb(cfg['colors'][cls])
            alpha = coverage(im, col, cls)
            m = (alpha > 0.5).astype(np.uint8)
            n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
            comps = sorted([i for i in range(1, n) if st[i][4] > 60], key=lambda i: (st[i][0], st[i][1]))
            names = cfg[cls]
            if name == 'kunzle' and cls == 'ink':
                big = [i for i in comps if st[i][3] > 150]
                small = [i for i in comps if st[i][3] <= 150]
                names_big = ['K', 'UN', 'Z', 'L', 'E']
                order = big + small
                names = names_big + [f'tag{k}' for k in range(len(small))]
                comps = order
            for k, i in enumerate(comps):
                x, y, w, h, a = st[i]
                compmask = (lab == i).astype(np.uint8)
                d, contours = trace_component(alpha, compmask, x, y, x + w, y + h, cfg['soft'])
                parts.append({'id': names[k] if k < len(names) else f'{cls}{k}', 'cls': cls,
                              'color': cfg['colors'][cls], 'bbox': [int(x), int(y), int(x + w), int(y + h)],
                              'd': d, 'contours': contours})
        X0 = min(p['bbox'][0] for p in parts); Y0 = min(p['bbox'][1] for p in parts)
        X1 = max(p['bbox'][2] for p in parts); Y1 = max(p['bbox'][3] for p in parts)
        out[name] = {'bbox': [X0, Y0, X1, Y1], 'colors': cfg['colors'], 'parts': parts}
        pad = 8
        svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X0 - pad} {Y0 - pad} {X1 - X0 + 2 * pad} {Y1 - Y0 + 2 * pad}">',
               f'  <title>{name.capitalize()}</title>']
        for p in parts:
            svg.append(f'  <path id="{p["id"]}" fill="{p["color"]}" fill-rule="evenodd" d="{p["d"]}"/>')
        svg.append('</svg>')
        (ROOT / f'brand/{name}-logo.svg').write_text('\n'.join(svg) + '\n')
        print(name, len(parts), 'parts', [p['id'] for p in parts][:12], 'bbox', out[name]['bbox'])
    (ROOT / 'metamorphose/data').mkdir(parents=True, exist_ok=True)
    (ROOT / 'metamorphose/data/logos.json').write_text(json.dumps(out))


if __name__ == '__main__':
    main()
