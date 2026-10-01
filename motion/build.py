"""Assemble motion/krisalis.html (single self-contained file) from the source template.

Inlines the Geist font, the measured beat period and the logo glyphs.
Usage: python3 motion/build.py
"""
import base64
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'motion/src/krisalis.src.html').read_text()
font = base64.b64encode((ROOT / 'motion/fonts/Geist-Variable.woff2').read_bytes()).decode()
grid = json.loads((ROOT / 'out/grid.json').read_text())

svg = (ROOT / 'brand/krisalis-logo.svg').read_text()
vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()[2:]]
glyphs = [{'id': m.group(1), 'd': m.group(2)} for m in re.finditer(r'<path id="([^"]+)" d="([^"]+)"', svg)]
colon = [[float(a), float(b), float(c)] for a, b, c in
         re.findall(r'<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', svg)]
logo = {'vb': vb, 'glyphs': glyphs, 'colon': colon}

# Snap the measured period so that the 80 beats span a whole number of 60 fps frames:
# the loop then closes exactly on a frame (measured 0.5000004 s -> 0.5 s, 2400 frames).
frames = round(grid['period'] * 80 * 60)
period = frames / (80 * 60)
out = (src.replace('__FONT_B64__', font)
          .replace('__PERIOD__', repr(period))
          .replace('__LOGO__', json.dumps(logo)))
dst = ROOT / 'motion/krisalis.html'
dst.write_text(out)
print(f'wrote {dst.relative_to(ROOT)}  ({len(out) / 1024:.0f} KB, measured period {grid["period"]:.7f}s -> {period:.7f}s, {frames} frames)')
