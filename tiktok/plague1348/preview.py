"""Quick look: python3 preview.py SceneClass t1 t2 ... -> build/prev_<Scene>.png (side by side)"""
import sys, time, numpy as np
from PIL import Image
import scenes
cls = getattr(scenes, sys.argv[1]); ts = [float(x) for x in sys.argv[2:]] or [0.0]
t0 = time.time(); sc = cls(); print('build', round(time.time() - t0, 1), 's')
ims = []
for t in ts:
    t0 = time.time(); a = sc.frame(t); dt = time.time() - t0
    a = np.clip(a, 0, 1) ** (1 / 1.0)
    ims.append(Image.fromarray((a * 255).astype(np.uint8)).resize((432, 768), Image.LANCZOS))
    print('frame', t, round(dt, 3), 's')
out = Image.new('RGB', (440 * len(ims), 768))
for i, im in enumerate(ims): out.paste(im, (440 * i, 0))
out.save(f'build/prev_{sys.argv[1]}.png')
