"""Purity test: the same instants rendered in time order and in random order, each in a
fresh page, must be pixel-identical (no state may survive from one seek() to the next).
Usage: python3 render/purity.py [n]
"""
import io, random, sys
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, 'render')
from stills import open_page

n = int(sys.argv[1]) if len(sys.argv) > 1 else 60
rng = random.Random(3)
times = sorted(rng.uniform(0, 40) for _ in range(n))
shuffled = times[:]; rng.shuffle(shuffled)
def run(order):
    out = {}
    with sync_playwright() as p:
        b, page = open_page(p)
        for t in order:
            page.evaluate(f'seek({t!r})')
            out[t] = np.asarray(Image.open(io.BytesIO(page.screenshot())).convert('RGB')).astype(np.int16)
        b.close()
    return out
a, b = run(times), run(shuffled)
bad = [(round(t, 3), int(np.abs(a[t] - b[t]).max())) for t in times if np.abs(a[t] - b[t]).max() > 0]
print(f'{n} instants, order-dependent frames: {len(bad)}', bad[:10])
