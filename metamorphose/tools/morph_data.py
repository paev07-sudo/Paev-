"""Morph data: old letters of Kunzle and Rigolet → letters of Krisalis, through a pebble.

    K (Kunzle)  → K        R (Rigolet) → R        i (Rigolet) → I        Z (Kunzle) → S
    o (Rigolet) → a        L (Kunzle)  → L        l (Rigolet) → I        E (Kunzle) → S
    check (Kunzle, blue) → upper dot of « : »     triangle (Rigolet, raspberry) → lower dot

A direct letter-to-letter morph crosses itself (Z→S, E→S, o→a), so each letter goes
through a convex pebble (a unit super-ellipse): old letter → pebble → new letter. Every contour
is resampled to N points by arc length with the same orientation, and the start index of each
stage is chosen to minimise the travel of every point (no twisting). The marks morph directly
(check → dot, triangle → dot).
Points stay in each glyph's own coordinates (source: logo image px, target: Krisalis units);
the page maps both to the world at run time and interpolates.
Writes metamorphose/data/morph.json.  Usage: python3 metamorphose/tools/morph_data.py
"""
import json
import pathlib
import re
import numpy as np
from svgpathtools import parse_path
from shapely.geometry import Point, Polygon
from shapely.ops import nearest_points

ROOT = pathlib.Path(__file__).resolve().parents[2]
N = 420

PAIRS = [('kunzle', 'K', 'k'), ('rigolet', 'R', 'r'), ('rigolet', 'i_stem', 'i-1'), ('kunzle', 'Z', 's-1'),
         ('rigolet', 'o', 'a'), ('kunzle', 'L', 'l'), ('rigolet', 'l', 'i-2'), ('kunzle', 'E', 's-2'),
         ('kunzle', 'check', 'dot-up'), ('rigolet', 'triangle', 'dot-lo')]


def resample(P, n=N):
    P = np.asarray(P, float)
    if np.allclose(P[0], P[-1]):
        P = P[:-1]
    Q = np.vstack([P, P[:1]])
    seg = np.hypot(*np.diff(Q, axis=0).T)
    if seg.sum() < 1e-2:
        return np.tile(P.mean(0), (n, 1))
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.linspace(0, s[-1], n, endpoint=False)
    return np.vstack([np.interp(t, s, Q[:, 0]), np.interp(t, s, Q[:, 1])]).T


def signed_area(P):
    return 0.5 * np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])


def normalise(P, ref):
    (x0, y0), (x1, y1) = ref.min(0), ref.max(0)
    return (P - [(x0 + x1) / 2, (y0 + y1) / 2]) / max(y1 - y0, 1e-9)


def align(src, dst, src_ref, dst_ref):
    if abs(signed_area(src)) < 1e-6:          # degenerate source (a growing hole): any start works
        return dst
    if np.sign(signed_area(src)) != np.sign(signed_area(dst)):
        dst = dst[::-1]
    a, b = normalise(src, src_ref), normalise(dst, dst_ref)
    best = min(range(len(b)), key=lambda k: np.sum((a - np.roll(b, -k, axis=0)) ** 2))
    return np.roll(dst, -best, axis=0)


def krisalis_contours():
    svg = (ROOT / 'brand/krisalis-logo.svg').read_text()
    out = {}
    for pid, d in re.findall(r'<path id="([^"]+)" d="([^"]+)"', svg):
        path = parse_path(d)
        subs = path.continuous_subpaths()
        cs = []
        for sp in subs:
            pts = [sp.point(u) for u in np.linspace(0, 1, 1500, endpoint=False)]
            cs.append(np.array([[p.real, p.imag] for p in pts]))
        out[pid] = cs
    for k, (cx, cy, r) in enumerate(re.findall(r'<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', svg)):
        cx, cy, r = float(cx), float(cy), float(r)
        a = np.linspace(0, 2 * np.pi, 1500, endpoint=False)
        out['dot-up' if k == 0 else 'dot-lo'] = [np.vstack([cx + r * np.cos(a), cy + r * np.sin(a)]).T]
    return out


def unit_blob(n=N, e=4.0):
    t = np.linspace(0, 2 * np.pi, 6000, endpoint=False)
    c, s_ = np.cos(t), np.sin(t)
    P = np.vstack([np.sign(c) * np.abs(c) ** (2 / e), np.sign(s_) * np.abs(s_) ** (2 / e)]).T * 0.5
    return resample(P, n)


def shift_to(a_norm, b_norm):
    return min(range(len(b_norm)), key=lambda k: np.sum((a_norm - np.roll(b_norm, -k, axis=0)) ** 2))


def main():
    logos = json.loads((ROOT / 'metamorphose/data/logos.json').read_text())
    kr = krisalis_contours()
    letters, marks = [], []
    blob = unit_blob()
    for logo, sid, did in PAIRS:
        part = next(p for p in logos[logo]['parts'] if p['id'] == sid)
        sc = sorted([np.array(c['pts'], float) for c in part['contours']], key=lambda P: -abs(signed_area(P)))
        dc = sorted(kr[did], key=lambda P: -abs(signed_area(P)))
        if did.startswith('dot'):
            s2, d2 = resample(sc[0]), resample(dc[0])
            d2 = align(s2, d2, sc[0], dc[0])
            marks.append({'logo': logo, 'src': sid, 'dst': did, 'srcPts': np.round(s2, 2).tolist(), 'dstPts': np.round(d2, 3).tolist()})
            print(f'{logo:8s} {sid:9s} → {did:7s} (direct)')
            continue
        S = resample(sc[0])
        B = blob.copy()
        if np.sign(signed_area(B)) != np.sign(signed_area(S)):
            B = B[::-1]
        B = np.roll(B, -shift_to(normalise(S, S), B / 1.0), axis=0)     # pebble aligned to the old letter
        D = resample(dc[0])
        if np.sign(signed_area(D)) != np.sign(signed_area(B)):
            D = D[::-1]
        D = np.roll(D, -shift_to(B, normalise(D, D)), axis=0)           # new letter aligned to the pebble
        entry = {'logo': logo, 'src': sid, 'dst': did, 'srcOuter': np.round(S, 2).tolist(),
                 'blob': np.round(B, 4).tolist(), 'dstOuter': np.round(D, 3).tolist(),
                 'srcHole': None, 'dstHole': None}
        if len(sc) > 1:
            entry['srcHole'] = np.round(resample(sc[1]), 2).tolist()
        if len(dc) > 1:
            entry['dstHole'] = np.round(resample(dc[1]), 3).tolist()
        letters.append(entry)
        print(f'{logo:8s} {sid:9s} → {did:7s} holes src {len(sc) - 1} dst {len(dc) - 1}')
    (ROOT / 'metamorphose/data/morph.json').write_text(json.dumps({'letters': letters, 'marks': marks}))


if __name__ == '__main__':
    main()
