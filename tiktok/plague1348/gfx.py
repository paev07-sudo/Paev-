"""Procedural painting toolkit (numpy + PIL). Everything here is drawn from scratch:
noise, masks, glows, perspective. No external images are used anywhere."""
import math
import numpy as np
from PIL import Image, ImageDraw

W, H, FPS = 1080, 1920, 30
SS = 1.2                      # stills are painted 20% larger than output, for the push-ins
RW, RH = int(W * SS), int(H * SS)

_grid = None


def grid():
    global _grid
    if _grid is None:
        ys, xs = np.mgrid[0:RH, 0:RW].astype(np.float32)
        _grid = (xs, ys)
    return _grid


def C(*rgb):
    return np.array(rgb, np.float32)


def resize_f(a, w, h, resample=Image.BICUBIC):
    if a.ndim == 2:
        return np.asarray(Image.fromarray(np.ascontiguousarray(a, np.float32), 'F')
                          .resize((int(w), int(h)), resample), dtype=np.float32)
    return np.stack([resize_f(a[..., c], w, h, resample) for c in range(a.shape[2])], -1)


def _box(a, r, axis):
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float32)
    n = a.shape[axis]
    return (np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
            - np.take(c, np.arange(0, n), axis=axis)) / (2 * r + 1)


def blur(a, sigma):
    """Approximate gaussian blur (3 box passes), downsampled for big radii."""
    if sigma < 0.6:
        return a
    h, w = a.shape[:2]
    if sigma > 8:
        f = sigma / 4.0
        sw, sh = max(4, int(w / f)), max(4, int(h / f))
        return resize_f(blur(resize_f(a, sw, sh, Image.BILINEAR), 4.0), w, h, Image.BILINEAR)
    r = max(1, int(round((math.sqrt(4 * sigma * sigma + 1) - 1) / 2)))
    out = a.astype(np.float32)
    for _ in range(3):
        out = _box(out, r, 0)
        out = _box(out, r, 1)
    return out


def fbm(h, w, cx, cy, octaves=5, seed=0, gain=0.5):
    """Value-noise fBm in [0,1]. cx, cy = number of cells across at the base octave."""
    rng = np.random.default_rng(seed)
    tot = np.zeros((h, w), np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        gx, gy = max(2, int(cx * 2 ** o)), max(2, int(cy * 2 ** o))
        if o > 0 and (gx > w or gy > h):
            break
        g = rng.random((gy, gx)).astype(np.float32)
        tot += amp * resize_f(g, w, h, Image.BICUBIC)
        norm += amp
        amp *= gain
    tot /= norm
    lo, hi = np.percentile(tot, 1), np.percentile(tot, 99)
    return np.clip((tot - lo) / (hi - lo + 1e-6), 0, 1)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def poly_mask(polys, w=None, h=None, ss=3):
    w = w or RW
    h = h or RH
    im = Image.new('L', (w * ss, h * ss), 0)
    d = ImageDraw.Draw(im)
    for p in polys:
        if len(p) >= 3:
            d.polygon([(x * ss, y * ss) for x, y in p], fill=255)
    return np.asarray(im.resize((w, h), Image.BOX), np.float32) / 255


def lines_mask(segs, w=None, h=None, ss=2):
    """segs: list of (x0, y0, x1, y1, width)"""
    w = w or RW
    h = h or RH
    im = Image.new('L', (w * ss, h * ss), 0)
    d = ImageDraw.Draw(im)
    for x0, y0, x1, y1, wd in segs:
        d.line([(x0 * ss, y0 * ss), (x1 * ss, y1 * ss)], fill=255, width=max(1, int(wd * ss)))
    return np.asarray(im.resize((w, h), Image.BOX), np.float32) / 255


def ellipse(X, Y, cx, cy, rx, ry, soft=1.2):
    d = np.sqrt(((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2)
    return np.clip((1 - d) * min(rx, ry) / soft + 0.5, 0, 1)


def over(img, col, m):
    m3 = m[..., None]
    img *= (1 - m3)
    img += m3 * col


def glow(X, Y, cx, cy, r):
    return 1.0 / (1.0 + ((X - cx) ** 2 + (Y - cy) ** 2) / (r * r))


def gauss(X, Y, cx, cy, r):
    return np.exp(-((X - cx) ** 2 + (Y - cy) ** 2) / (r * r))


def capsule(x0, y0, x1, y1, r0, r1, n=10):
    """Tapered limb polygon from (x0,y0) radius r0 to (x1,y1) radius r1, round ends."""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy) + 1e-6
    nx, ny = -dy / L, dx / L
    a = math.atan2(dy, dx)
    pts = [(x0 + nx * r0, y0 + ny * r0), (x1 + nx * r1, y1 + ny * r1)]
    for i in range(n + 1):
        t = a + math.pi / 2 - math.pi * i / n
        pts.append((x1 + math.cos(t) * r1, y1 + math.sin(t) * r1))
    pts.append((x0 - nx * r0, y0 - ny * r0))
    for i in range(n + 1):
        t = a - math.pi / 2 - math.pi * i / n
        pts.append((x0 + math.cos(t) * r0, y0 + math.sin(t) * r0))
    return pts


def ellipse_poly(cx, cy, rx, ry, a0=0, a1=2 * math.pi, n=48):
    return [(cx + rx * math.cos(a0 + (a1 - a0) * i / n), cy + ry * math.sin(a0 + (a1 - a0) * i / n))
            for i in range(n + 1)]


def jitter(pts, amp, rng):
    return [(x + rng.uniform(-amp, amp), y + rng.uniform(-amp, amp)) for x, y in pts]


def subdivide(pts, n=6):
    out = []
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        for k in range(n):
            out.append((x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n))
    return out


def paste_rgba(dst, spr, x, y, scale=1.0, alpha=1.0, tint=None, tint_amt=0.0):
    """Composite a float RGBA sprite (h,w,4, premultiplied=False) into dst at top-left (x,y)
    after scaling. Sub-pixel position is handled with an affine resample."""
    h, w = spr.shape[:2]
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    ix, iy = int(math.floor(x)), int(math.floor(y))
    fx, fy = x - ix, y - iy
    chans = []
    for c in range(4):
        im = Image.fromarray(np.ascontiguousarray(spr[..., c]), 'F')
        im = im.transform((nw + 2, nh + 2), Image.AFFINE,
                          (1 / scale, 0, -fx / scale, 0, 1 / scale, -fy / scale), Image.BILINEAR)
        chans.append(np.asarray(im, np.float32))
    s = np.stack(chans, -1)
    x0, y0 = max(ix, 0), max(iy, 0)
    x1, y1 = min(ix + nw + 2, dst.shape[1]), min(iy + nh + 2, dst.shape[0])
    if x1 <= x0 or y1 <= y0:
        return
    s = s[y0 - iy:y1 - iy, x0 - ix:x1 - ix]
    rgb = s[..., :3]
    if tint is not None and tint_amt > 0:
        rgb = rgb * (1 - tint_amt) + tint * tint_amt
    a = np.clip(s[..., 3:4], 0, 1) * alpha
    reg = dst[y0:y1, x0:x1]
    reg *= (1 - a)
    reg += rgb * a


def add_glow(dst, cx, cy, r, col, gain, kind='inv', box=6.0):
    """Additive light glow limited to a bounding box of box*r around the source."""
    h, w = dst.shape[:2]
    x0, x1 = int(max(0, cx - box * r)), int(min(w, cx + box * r))
    y0, y1 = int(max(0, cy - box * r)), int(min(h, cy + box * r))
    if x1 <= x0 or y1 <= y0:
        return
    ys, xs = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    g = glow(xs, ys, cx, cy, r) if kind == 'inv' else gauss(xs, ys, cx, cy, r)
    dst[y0:y1, x0:x1] += g[..., None] * (col * gain)


def poly_mask_bbox(polys, w=None, h=None, ss=3, pad=4):
    """Like poly_mask but only rasterises the bounding box. Returns (mask, x0, y0) or None."""
    w = w or RW
    h = h or RH
    xs = [x for p in polys for x, _ in p]
    ys = [y for p in polys for _, y in p]
    if not xs:
        return None
    x0, x1 = max(0, int(min(xs)) - pad), min(w, int(max(xs)) + pad + 1)
    y0, y1 = max(0, int(min(ys)) - pad), min(h, int(max(ys)) + pad + 1)
    if x1 <= x0 or y1 <= y0:
        return None
    im = Image.new('L', ((x1 - x0) * ss, (y1 - y0) * ss), 0)
    d = ImageDraw.Draw(im)
    for p in polys:
        if len(p) >= 3:
            d.polygon([((x - x0) * ss, (y - y0) * ss) for x, y in p], fill=255)
    m = np.asarray(im.resize((x1 - x0, y1 - y0), Image.BOX), np.float32) / 255
    return m, x0, y0


def fill(img, polys, col, tex=None, tex_amt=0.5, fog_col=None, fogf=0.0, alpha=1.0):
    """Fill polygons with a (textured, fogged) colour. tex is a full-frame [0,1] array."""
    r = poly_mask_bbox(polys, img.shape[1], img.shape[0])
    if r is None:
        return
    m, x0, y0 = r
    h, w = m.shape
    reg = img[y0:y0 + h, x0:x0 + w]
    c = np.broadcast_to(np.asarray(col, np.float32), (h, w, 3)).copy()
    if tex is not None:
        c *= (1 - tex_amt + 2 * tex_amt * tex[y0:y0 + h, x0:x0 + w])[..., None]
    if fog_col is not None and fogf > 0:
        c = c * (1 - fogf) + fog_col * fogf
    m3 = (m * alpha)[..., None]
    reg *= (1 - m3)
    reg += c * m3
