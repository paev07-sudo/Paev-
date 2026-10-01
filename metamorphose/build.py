"""Assemble metamorphose/metamorphose.html (single self-contained file).

Inlines the Geist font, the measured beat period, the vectorised Kunzle and Rigolet logos,
the Krisalis wordmark and the morph data.  Usage: python3 metamorphose/build.py
"""
import base64
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'metamorphose/src/metamorphose.src.html').read_text()
font = base64.b64encode((ROOT / 'motion/fonts/Geist-Variable.woff2').read_bytes()).decode()
grid = json.loads((ROOT / 'out/metamorphose/grid.json').read_text())
logos = json.loads((ROOT / 'metamorphose/data/logos.json').read_text())
morph = json.loads((ROOT / 'metamorphose/data/morph.json').read_text())

slim = {}
for name, lg in logos.items():
    slim[name] = {'bbox': lg['bbox'], 'colors': lg['colors'],
                  'parts': [{k: p[k] for k in ('id', 'cls', 'color', 'bbox', 'd')} for p in lg['parts']]}
svg = (ROOT / 'brand/krisalis-logo.svg').read_text()
slim['krisalis'] = {
    'vb': [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()[2:]],
    'glyphs': [{'id': i, 'd': d} for i, d in re.findall(r'<path id="([^"]+)" d="([^"]+)"', svg)],
    'colon': [[float(a), float(b), float(c)] for a, b, c in re.findall(r'<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', svg)],
}
slim['morph'] = morph

frames = round(grid['period'] * 80 * 60)          # 80 beats on a whole number of 60 fps frames
period = frames / (80 * 60)
out = (src.replace('__FONT_B64__', font)
          .replace('__PERIOD__', repr(period))
          .replace('__DATA__', json.dumps(slim, separators=(',', ':'))))
dst = ROOT / 'metamorphose/metamorphose.html'
dst.write_text(out)
print(f'wrote {dst.relative_to(ROOT)} ({len(out) / 1024:.0f} KB), measured period {grid["period"]:.6f}s -> {period:.6f}s')
