"""Continuity checks.
  - loop: seek(0) vs seek(DUR), cursor position/velocity at the seam
  - glitch scan: renders every frame at 60 fps (downsampled) and flags frame-to-frame jumps
Usage: python3 render/scan.py out/scan.json
"""
import io, json, sys
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, 'render')
from stills import open_page

with sync_playwright() as p:
    b, page = open_page(p)
    dur = page.evaluate('window.DUR')
    def shot(t):
        page.evaluate(f'seek({t})')
        return np.asarray(Image.open(io.BytesIO(page.screenshot())).convert('RGB')).astype(np.int16)
    a, z = shot(0), shot(dur)
    print('loop seam: max px diff seek(0) vs seek(DUR) =', int(np.abs(a - z).max()))
    c = page.evaluate(f'''(() => {{ const e = 1e-3; const p0 = cursorAt(0), pm = cursorAt({dur} - e), pp = cursorAt(e);
        return {{p0, v_end: [(p0[0]-pm[0])/e, (p0[1]-pm[1])/e], v_start: [(pp[0]-p0[0])/e, (pp[1]-p0[1])/e], end: cursorAt({dur} - 1e-9)}}; }})()''')
    print('cursor at 0', c['p0'], 'at DUR-', c['end'], 'velocity end', c['v_end'], 'start', c['v_start'])
    diffs = []
    prev = None
    n = int(round(dur * 60))
    for k in range(n + 1):
        page.evaluate(f'seek({k / 60})')
        im = Image.open(io.BytesIO(page.screenshot(type='jpeg', quality=90))).convert('L').resize((360, 360), Image.BILINEAR)
        cur = np.asarray(im).astype(np.float32)
        if prev is not None:
            diffs.append(float(np.abs(cur - prev).mean()))
        prev = cur
    b.close()
d = np.array(diffs)
flag = []
for k in range(len(d)):
    nb = np.concatenate([d[max(0, k - 4):k], d[k + 1:k + 5]])
    if d[k] > 2.5 * (np.median(nb) + 0.05) and d[k] > 0.6:
        flag.append((k, round(k / 60, 3), round(d[k], 2), round(float(np.median(nb)), 2)))
json.dump({'diffs': diffs, 'flags': flag}, open(sys.argv[1], 'w'))
print('frames', len(d), 'mean diff', round(d.mean(), 3), 'max', round(d.max(), 2), 'at', round(int(d.argmax()) / 60, 3))
print('flags (frame, t, diff, neighbour median):')
for f in flag: print('  ', f)
