"""The seven scenes, painted procedurally. Each scene builds its static layers once and
returns a float RGB image (RH x RW) for any local time t via frame(t)."""
import math
import numpy as np
from PIL import Image, ImageDraw
from gfx import (RW, RH, C, grid, resize_f, blur, fbm, smooth, poly_mask, lines_mask, ellipse, fill, poly_mask_bbox,
                 over, glow, gauss, capsule, ellipse_poly, jitter, subdivide, paste_rgba, add_glow)


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


class Scene:
    fog_col = C(0.55, 0.56, 0.57)
    fog_density = 0.15          # screen-space drifting haze over the whole frame
    fog_low = 0.0               # extra haze towards the bottom (>0) or top (<0)
    fog_band = None             # (y_center_frac, width_frac, extra) a horizontal fog bank
    fog_speed = (14.0, -3.0)
    push = 0.07                 # slow push-in over the scene
    shake = 1.0
    sat = 0.72
    warmth = 0.0

    def frame(self, t):
        return self.A


# --------------------------------------------------------------------------------------
# helpers shared by several scenes

def wood_planks(seed, x_edges, base, var=0.25, grain_cells=(70, 2.5), vertical=True):
    """Plank wall/door texture. Returns (img, plank_index_per_px, dist_to_edge)."""
    X, Y = grid()
    rng = np.random.default_rng(seed)
    coord = X if vertical else Y
    idx = np.clip(np.searchsorted(np.asarray(x_edges), coord) - 1, 0, len(x_edges) - 2)
    cols = np.array([base * rng.uniform(1 - var, 1 + var) for _ in range(len(x_edges))], np.float32)
    gx, gy = grain_cells if vertical else grain_cells[::-1]
    g1 = fbm(RH, RW, gx, gy, 5, seed + 1)
    g2 = fbm(RH, RW, 6, 6, 4, seed + 2)
    img = cols[idx] * (0.62 + 0.55 * g1[..., None]) * (0.8 + 0.4 * g2[..., None])
    e = np.asarray(x_edges)
    lo = e[idx]
    hi = e[np.minimum(idx + 1, len(e) - 1)]
    dist = np.minimum(coord - lo, hi - coord)
    img *= (0.45 + 0.55 * smooth(0, 9, dist))[..., None]
    return img.astype(np.float32), idx, dist


def plank_edges(rng, start, stop, wmin, wmax):
    e = [start]
    while e[-1] < stop:
        e.append(e[-1] + rng.uniform(wmin, wmax))
    return e


# --------------------------------------------------------------------------------------
class Hut(Scene):
    """1. Waking up on a straw mattress; cold light through cracks in the plank wall."""
    fog_col = C(0.42, 0.47, 0.55)
    fog_density = 0.05
    push = 0.08
    shake = 1.4
    sat = 0.6

    def __init__(self):
        X, Y = grid()
        rng = np.random.default_rng(11)
        edges = plank_edges(rng, -30, RW + 30, 0.10 * RW, 0.15 * RW)
        wall, idx, dist = wood_planks(12, edges, C(0.30, 0.21, 0.14), 0.22)

        # cracks of daylight between some planks
        cold = C(0.80, 0.88, 1.0)
        crack = np.zeros((RH, RW), np.float32)
        self.beams = []
        gaps = [2, 4, 5, 7]
        n1 = fbm(RH, 64, 1, 18, 4, 13)
        for k, gi in enumerate(gaps):
            if gi >= len(edges) - 1:
                continue
            x0 = edges[gi]
            colw = resize_f(n1[:, (k * 13) % 64:(k * 13) % 64 + 1], 1, RH)[:, 0]
            half = 0.6 + 4.2 * colw ** 2
            ya, yb = rng.uniform(0.02, 0.2) * RH, rng.uniform(0.45, 0.62) * RH
            yy = Y[:, 0]
            seg = smooth(ya, ya + 60, yy) * (1 - smooth(yb - 60, yb, yy))
            m = np.clip(half[:, None] - np.abs(X - x0) + 0.5, 0, 1) * seg[:, None]
            crack = np.maximum(crack, m)
            self.beams.append((x0, ya, yb))
        # wall lit by the cracks
        lightmap = 0.16 + 1.5 * blur(crack, 60) * 9 + 0.8 * blur(crack, 200) * 9
        lightmap += 0.10 * smooth(0.0, 0.5, X / RW)            # a little more light from the right
        img = wall * lightmap[..., None]
        # roof beam and dark rafters at the top
        beam_y0, beam_y1 = 0.075 * RH, 0.125 * RH
        beam = (smooth(beam_y0 - 2, beam_y0 + 2, Y) * (1 - smooth(beam_y1 - 2, beam_y1 + 2, Y)))
        bg = fbm(RH, RW, 2, 60, 4, 14)
        over(img, (C(0.10, 0.07, 0.05) * (0.6 + 0.6 * bg[..., None])), beam)
        img *= (0.25 + 0.75 * smooth(0, beam_y0, Y))[..., None]
        img *= (1 - 0.5 * smooth(beam_y1, beam_y1 + 80, Y) * (1 - smooth(beam_y1 + 80, beam_y1 + 200, Y)))[..., None]
        img += crack[..., None] * cold * 1.6
        img += blur(crack, 6)[..., None] * cold * 1.2
        img += blur(crack, 30)[..., None] * cold * 0.9

        # straw mattress in the foreground, out of focus
        top = 0.64 * RH + 0.025 * RH * np.sin(X[0] / RW * 5.0 + 1.0) + 30 * (fbm(1, RW, 12, 1, 3, 15)[0] - 0.5)
        mat = smooth(-6, 6, Y - top[None, :])
        straw = Image.new('RGB', (RW, RH), (0, 0, 0))
        d = ImageDraw.Draw(straw)
        for _ in range(9000):
            x = rng.uniform(-50, RW + 50)
            yb = np.interp(x, np.arange(RW), top)
            y = rng.uniform(yb - 50, RH)
            L = rng.uniform(30, 140)
            a = rng.normal(0, 0.45) + (math.pi if rng.random() < 0.5 else 0)
            v = rng.uniform(0.25, 1.0)
            col = (int(150 * v), int(118 * v), int(60 * v))
            d.line([(x, y), (x + L * math.cos(a), y + L * math.sin(a))], fill=col,
                   width=int(rng.uniform(2, 6)))
        straw = blur(np.asarray(straw, np.float32) / 255, 2.2)
        strawm = blur(np.clip(straw.sum(-1) * 4, 0, 1), 2.0)
        light_m = 0.18 + 0.55 * blur(crack, 300)[..., None] * 40
        mat_img = (C(0.10, 0.075, 0.04) + straw * 0.9) * light_m
        mat_img *= (0.55 + 0.45 * smooth(RH, 0.7 * RH, Y))[..., None]
        m_all = np.maximum(mat, strawm * smooth(-50, 0, Y - top[None, :]))
        over(img, mat_img, m_all)
        # dark wool blanket corner, very close to the lens
        bl = poly_mask([[(-50, 0.83 * RH), (0.30 * RW, 0.86 * RH), (0.55 * RW, 0.93 * RH),
                         (0.72 * RW, RH + 50), (-50, RH + 50)]])
        bl = blur(bl, 14)
        wool = fbm(RH, RW, 40, 40, 4, 16)
        over(img, C(0.11, 0.10, 0.09) * (0.6 + 0.6 * wool[..., None]), bl)
        # shafts of light in the air (in front of everything)
        shafts = np.zeros((RH, RW), np.float32)
        dx, dy = -0.55, 0.83
        haze = fbm(RH, RW, 4, 4, 4, 17)
        for x0, ya, yb in self.beams:
            s = (X - x0) / dx
            ok = s > 0
            yg = Y - dy * s
            soft = 25 + 0.25 * np.abs(s)
            band = smooth(ya, ya + soft, yg) * (1 - smooth(yb - soft, yb, yg))
            shafts += np.where(ok, band * np.exp(-np.abs(s) / (0.75 * RW)), 0)
        img += (shafts * (0.4 + 0.9 * haze))[..., None] * cold * 0.11
        self.shafts = shafts
        self.A = img.astype(np.float32)

        # breath: a soft noisy puff sprite
        n = 360
        ys, xs = np.mgrid[0:n, 0:n].astype(np.float32) / n - 0.5
        puff_noise = fbm(n, n, 4, 4, 5, 18)
        a = np.exp(-(xs ** 2 + ys ** 2) / 0.045) * (0.3 + 1.0 * puff_noise)
        self.puff = np.dstack([np.full((n, n, 3), 0.80, np.float32), np.clip(a, 0, 1)])
        self.motes = np.random.default_rng(19).random((260, 3)).astype(np.float32)

    def frame(self, t):
        img = self.A.copy()
        # breath: exhale every ~2.4 s, rising and spreading from the bottom of the frame
        for k in range(3):
            ph = (t - 0.35 - 2.4 * k)
            if 0 <= ph < 2.2:
                p = ph / 2.2
                sc = 1.4 + 2.6 * p
                alpha = 0.55 * math.sin(math.pi * min(1, p * 1.6)) * (1 - p) ** 0.5
                cx = 0.52 * RW + 40 * p
                cy = 0.96 * RH - 0.24 * RH * p
                paste_rgba(img, self.puff, cx - 180 * sc, cy - 180 * sc, sc, alpha)
        # dust motes drifting through the light shafts
        for mx, my, ms in self.motes:
            x = (mx * RW + 9 * t * (0.5 + ms)) % RW
            y = (my * 0.7 * RH + 14 * t * (ms - 0.3)) % (0.7 * RH)
            xi, yi = int(x), int(y)
            s = self.shafts[yi, xi]
            if s > 0.05:
                r = 1 + int(ms * 2)
                img[yi - r:yi + r, xi - r:xi + r] += C(0.9, 0.95, 1.0) * 0.35 * s * (0.5 + ms)
        return img


# --------------------------------------------------------------------------------------
class Breakfast(Scene):
    """2. Rough wool sleeves being pulled on; cold grey porridge in a clay bowl."""
    fog_col = C(0.35, 0.30, 0.25)
    fog_density = 0.05
    push = 0.06
    shake = 1.6
    sat = 0.7
    warmth = 0.05

    def __init__(self):
        X, Y = grid()
        rng = np.random.default_rng(21)
        self.candle = (0.17 * RW, 0.405 * RH)
        cx, cy = self.candle
        # back wall
        e = plank_edges(rng, -30, RW + 30, 0.12 * RW, 0.18 * RW)
        wall, _, _ = wood_planks(22, e, C(0.22, 0.16, 0.11), 0.2)
        img = wall.copy()
        # table top in perspective: planks converge to a vanishing point high above
        vx, vy = 0.55 * RW, -0.55 * RH
        tab_y = 0.36 * RH
        bottoms = np.linspace(-0.6 * RW, 1.6 * RW, 9)
        # plank index from the angle to the vanishing point
        ang = (X - vx) / np.maximum(Y - vy, 1)
        bang = (bottoms - vx) / (RH - vy)
        pid = np.clip(np.searchsorted(bang, ang) - 1, 0, len(bottoms) - 2)
        tcols = np.array([C(0.36, 0.25, 0.16) * rng.uniform(0.8, 1.15) for _ in bottoms], np.float32)
        # grain along the plank direction: sample noise in (angle, depth) space
        gn = fbm(512, 512, 90, 3, 5, 23)
        u = ((ang - bang[0]) / (bang[-1] - bang[0]) * 511).clip(0, 511).astype(np.int32)
        v = ((Y - tab_y) / (RH - tab_y) * 511).clip(0, 511).astype(np.int32)
        tex = gn[v, u]
        top = tcols[pid] * (0.6 + 0.6 * tex[..., None])
        # seams between planks
        lo, hi = bang[pid], bang[np.minimum(pid + 1, len(bang) - 1)]
        dseam = np.minimum(ang - lo, hi - ang) * (Y - vy)
        top *= (0.35 + 0.65 * smooth(0, 7, dseam))[..., None]
        scratches = fbm(RH, RW, 30, 30, 4, 24)
        top *= (0.85 + 0.25 * scratches[..., None])
        tm = smooth(tab_y - 2, tab_y + 2, Y)
        over(img, top, tm)
        # far edge of the table
        edge = smooth(tab_y - 2, tab_y + 2, Y) * (1 - smooth(tab_y + 22, tab_y + 26, Y))
        over(img, C(0.42, 0.30, 0.19), edge * 0.6)

        # bowl
        bx, by, rx, ry, depth = 0.54 * RW, 0.665 * RH, 0.30 * RW, 0.105 * RW, 0.12 * RW
        body = np.maximum(ellipse(X, Y, bx, by, rx, ry),
                          ellipse(X, Y, bx, by, rx * 0.93, ry + depth) * smooth(by - 2, by + 2, Y))
        # contact shadow
        sh = blur(ellipse(X, Y, bx + 30, by + depth * 0.8, rx * 1.05, ry * 0.9), 28)
        img *= (1 - 0.75 * sh)[..., None]
        clay = fbm(RH, RW, 25, 25, 5, 25)
        shade = 0.55 + 0.5 * np.clip(1 - (X - (bx - rx)) / (2 * rx), 0, 1)     # lit from the candle side
        shade *= 0.75 + 0.35 * (1 - smooth(by, by + ry + depth, Y))
        clay_col = C(0.50, 0.29, 0.17) * (0.7 + 0.45 * clay[..., None]) * shade[..., None]
        over(img, clay_col, body)
        rim = np.clip(ellipse(X, Y, bx, by, rx, ry, 1.5) - ellipse(X, Y, bx, by, rx * 0.95, ry * 0.93, 1.5), 0, 1)
        over(img, C(0.62, 0.40, 0.26) * (0.8 + 0.3 * clay[..., None]), rim * 0.9)
        inner = ellipse(X, Y, bx, by + 6, rx * 0.93, ry * 0.88)
        lumps = fbm(RH, RW, 40, 60, 5, 26)
        lumps2 = fbm(RH, RW, 10, 14, 4, 27)
        lumps = blur(lumps, 3)
        por = C(0.50, 0.48, 0.43) * (0.70 + 0.18 * lumps[..., None] + 0.22 * lumps2[..., None])
        # inner rim shadow (far side of the bowl casts onto the porridge)
        ish = smooth(by - ry * 0.9, by + ry * 0.1, Y)
        por *= (0.45 + 0.55 * ish)[..., None]
        over(img, por, inner)
        spec = np.clip((lumps - 0.88) * 5, 0, 1) * inner * ish
        img += (blur(spec, 2.5) * 0.10)[..., None] * C(0.9, 0.85, 0.8)
        # wooden spoon resting in the bowl
        spoon = poly_mask([capsule(bx + 0.06 * RW, by - 0.01 * RH, bx + 0.42 * RW, by + 0.12 * RH, 10, 17)])
        over(img, C(0.40, 0.28, 0.17) * (0.8 + 0.3 * clay[..., None]), spoon)
        bowl_sp = ellipse(X, Y, bx + 0.05 * RW, by - 0.005 * RH, 48, 28)
        over(img, C(0.33, 0.22, 0.13), bowl_sp * inner)

        # crust of dark bread
        bread = ellipse(X, Y, 0.86 * RW, 0.455 * RH, 0.12 * RW, 0.045 * RW)
        bread = np.maximum(bread, ellipse(X, Y, 0.86 * RW, 0.445 * RH, 0.105 * RW, 0.06 * RW) * smooth(0.445 * RH + 2, 0.445 * RH - 2, Y))
        bn = fbm(RH, RW, 50, 50, 4, 28)
        img *= (1 - 0.6 * blur(ellipse(X, Y, 0.88 * RW, 0.475 * RH, 0.13 * RW, 0.035 * RW), 16))[..., None]
        over(img, C(0.25, 0.15, 0.08) * (0.6 + 0.6 * bn[..., None]), bread)

        # candle: tallow stub on a dish
        dish = ellipse(X, Y, cx, cy + 0.12 * RW, 0.10 * RW, 0.03 * RW)
        img *= (1 - 0.6 * blur(ellipse(X, Y, cx + 10, cy + 0.135 * RW, 0.11 * RW, 0.03 * RW), 12))[..., None]
        over(img, C(0.28, 0.20, 0.13), dish)
        stick = poly_mask([[(cx - 34, cy + 6), (cx + 34, cy + 6), (cx + 36, cy + 0.12 * RW), (cx - 36, cy + 0.12 * RW)]])
        stick = np.maximum(stick, ellipse(X, Y, cx, cy + 6, 34, 9))
        tn = fbm(RH, RW, 12, 40, 3, 33)
        tallow = C(0.50, 0.44, 0.32) * ((0.35 + 0.65 * smooth(cx + 40, cx - 30, X)) * (0.8 + 0.3 * tn) * (0.6 + 0.4 * smooth(cy + 0.12 * RW, cy, Y)))[..., None]
        over(img, tallow, stick)
        self.A0 = img

        # candle light: an albedo-relative light map (applied with flicker)
        lightL = 1.4 * glow(X, Y, cx, cy, 0.22 * RW) + 0.25 * glow(X, Y, cx, cy, 0.6 * RW)
        # the bowl occludes part of the table to the right and below it
        occ = blur(np.clip(body * smooth(cx, bx, X) * smooth(by - ry, by, Y), 0, 1), 30)
        lightL *= (1 - 0.5 * occ)
        self.lit = (img * lightL[..., None] * C(1.0, 0.72, 0.42)).astype(np.float32)
        self.amb = (img * 0.20 * C(0.65, 0.72, 0.85)).astype(np.float32)
        # flame sprite region coordinates
        self.flame_xy = (cx, cy - 32)

        # sleeves + hands pulling a rough wool tunic down over the frame bottom
        self.cloth = self._cloth()

    def _cloth(self):
        sw, sh = RW, int(0.55 * RH)
        ys, xs = np.mgrid[0:sh, 0:sw].astype(np.float32)
        rng = np.random.default_rng(29)
        top = lambda x: 0.30 * sh + 0.07 * sh * math.sin(x / sw * 6.0) + 0.03 * sh * math.sin(x / sw * 17)
        hem = [(x, top(x)) for x in np.linspace(-20, sw + 20, 60)] + [(sw + 20, sh + 20), (-20, sh + 20)]
        m = poly_mask([hem], sw, sh)
        knit = fbm(sh, sw, 160, 90, 3, 30)
        weave = 0.5 + 0.5 * np.sin(xs * 0.55 + 4 * knit) * np.sin(ys * 0.42)
        folds = fbm(sh, sw, 7, 3, 3, 31)
        col = C(0.36, 0.31, 0.24) * (0.55 + 0.25 * knit[..., None] + 0.15 * weave[..., None]) * (0.5 + 0.7 * folds[..., None])
        col *= (0.75 + 0.35 * smooth(sh, 0.3 * sh, ys))[..., None]
        # hands gripping the hem (dark, back-lit)
        hand_polys = []
        skin = []
        for hx, side in [(0.27 * sw, -1), (0.73 * sw, 1)]:
            hy = top(hx)
            # back of the hand below the hem, fingers curled over it
            hand_polys.append(ellipse_poly(hx + side * 10, hy + 95, 120, 95, n=40))
            hand_polys.append(capsule(hx + side * 40, hy + 260, hx + side * 10, hy + 110, 105, 110))
            for k in range(4):
                fx = hx + (k - 1.5) * 52 * (-side)
                L = [95, 112, 108, 88][k]
                hand_polys.append(capsule(fx, hy + 70, fx - side * 6, hy + 70 - L, 23, 19))
            hand_polys.append(capsule(hx + side * 125, hy + 150, hx + side * 105, hy + 30, 30, 24))
        hm = poly_mask(hand_polys, sw, sh)
        hn = fbm(sh, sw, 30, 30, 3, 32)
        skin_col = C(0.34, 0.23, 0.17) * (0.75 + 0.3 * hn[..., None])
        # knuckle shading: fingers darker at top
        rim = np.clip(hm - np.roll(hm, 9, axis=0), 0, 1)
        skin_col = skin_col * (0.55 + 0.45 * smooth(sh * 0.6, sh * 0.25, ys))[..., None]
        over(col, skin_col, hm)
        col += blur(rim, 2)[..., None] * C(0.9, 0.55, 0.3) * 0.9
        a = np.maximum(m, hm)
        rgba = np.dstack([blur(col, 3.5), blur(a, 3.5)])
        return rgba

    def frame(self, t):
        f = (1 + 0.10 * math.sin(t * 11.3) + 0.07 * math.sin(t * 23.1 + 1) + 0.05 * math.sin(t * 37.7 + 2))
        img = self.amb + self.lit * f
        cx, cy = self.flame_xy
        sway = 3 * math.sin(t * 7.1) + 2 * math.sin(t * 13.3)
        add_glow(img, cx + sway, cy, 22, C(1.0, 0.55, 0.2), 0.9 * f, 'gauss')
        add_glow(img, cx + sway * 0.6, cy + 6, 9, C(1.0, 0.92, 0.75), 1.6 * f, 'gauss')
        add_glow(img, cx + sway * 0.3, cy, 150, C(1.0, 0.55, 0.25), 0.10 * f)
        # the hem is pulled down into frame as the sleeves come on
        p = ease((t - 0.1) / 1.7)
        y = RH - self.cloth.shape[0] * (0.95 - 0.35 * p)
        ox = 12 * math.sin(t * 2.3)
        cl = self.cloth.copy()
        cl[..., :3] *= (0.32 + 0.12 * f)
        paste_rgba(img, cl, ox, y)
        return img


# --------------------------------------------------------------------------------------
# perspective street

F = 1.05 * RW
HC = 1.65


class Street:
    def __init__(self, seed, night=False, yh=0.47, zf=22.0, xoff=0.0, church=True, houses_z=(3.5, 75)):
        X, Y = grid()
        self.rng = rng = np.random.default_rng(seed)
        self.night, self.yh, self.zf, self.cx = night, yh * RH, zf, 0.5 * RW + xoff
        if night:
            self.fog = C(0.10, 0.12, 0.16)
            top, hor = C(0.02, 0.025, 0.04), C(0.085, 0.10, 0.13)
            self.amb = 0.42
        else:
            self.fog = C(0.66, 0.66, 0.63)
            top, hor = C(0.55, 0.57, 0.58), C(0.70, 0.69, 0.65)
            self.amb = 1.0
        yh = self.yh
        v = np.clip(Y / yh, 0, 1)[..., None]
        img = top * (1 - v) + hor * v
        if not night:
            img += (0.10 * gauss(X, Y, 0.66 * RW, 0.30 * RH, 0.25 * RW))[..., None] * C(1.0, 0.95, 0.85)
        else:
            img += (0.06 * glow(X, Y, 0.75 * RW, 0.12 * RH, 0.12 * RW))[..., None] * C(0.6, 0.7, 0.9)
        self.tex_daub = fbm(RH, RW, 40, 40, 5, seed + 1)
        self.tex_thatch = fbm(RH, RW, 140, 10, 4, seed + 2)
        self.tex_wood = fbm(RH, RW, 90, 6, 4, seed + 3)
        # ---- ground
        g = Y > yh + 1
        Z = np.where(g, F * HC / np.maximum(Y - yh, 1e-3), 1e4)
        Xw = (X - self.cx) * Z / F
        N = 2048
        mud1 = fbm(N, N, 48, 48, 6, seed + 4)
        mud2 = fbm(N, N, 8, 8, 5, seed + 5)
        Zc = np.minimum(Z, 1e3)
        ui = ((Xw + 64) * 150).astype(np.int64) % N
        vi = (Zc * 150).astype(np.int64) % N
        t1 = mud1[vi, ui]
        t2 = mud2[((Zc * 22).astype(np.int64)) % N, (((Xw + 64) * 22).astype(np.int64)) % N]
        road = smooth(3.6, 3.0, np.abs(Xw))
        rc = 0.8 + 0.1 * np.sin(Zc * 0.6) + 0.05 * (t2 - 0.5)
        rut = np.exp(-((np.abs(Xw) - rc) / 0.2) ** 2) * road
        near = fbm(RH, RW, 60, 60, 4, seed + 6)
        t1 = t1 * (0.75 + 0.5 * near)
        mud = C(0.25, 0.19, 0.13) * (0.55 + 0.6 * t1)[..., None]
        verge = C(0.20, 0.20, 0.12) * (0.5 + 0.6 * t1)[..., None]
        grd = mud * road[..., None] + verge * (1 - road[..., None])
        grd *= (1 - 0.45 * rut)[..., None]
        sky_ref = hor * 0.85
        wet = np.clip((t2 - 0.66) * 7, 0, 1) * road * (0.6 + 0.4 * t1) + 0.45 * rut * np.clip((t1 - 0.45) * 3, 0, 1)
        wet = np.clip(wet, 0, 1)
        ripple = 0.8 + 0.25 * t1
        grd = grd * (1 - wet[..., None]) + (sky_ref * ripple[..., None]) * wet[..., None]
        light = (0.55 if not night else self.amb)
        grd *= light
        ff = (1 - np.exp(-Z / zf))[..., None]
        grd = grd * (1 - ff) + self.fog * ff
        img = np.where(g[..., None], grd, img).astype(np.float32)
        self.wet = (wet * g).astype(np.float32)
        self.img = img
        if church:
            self.church(5.5 + xoff * 0.01, 85)
        self.trees()
        self.houses(*houses_z)

    def P(self, x, y, z):
        return (self.cx + F * x / z, self.yh + F * (HC - y) / z)

    def fogf(self, z):
        return float(1 - math.exp(-z / self.zf))

    def quad(self, pts3):
        return [self.P(*p) for p in pts3]

    def church(self, x, z):
        ff = min(0.86, self.fogf(z))
        col = C(0.40, 0.40, 0.39) * (0.25 if self.night else 1.0)
        rng = self.rng
        w, h = 5.0, 19.0
        tower = [(x, 0, z), (x + w, 0, z), (x + w, h, z), (x, h, z)]
        polys = [self.quad(tower)]
        for k in range(5):
            if k % 2 == 0:
                xa = x + k * w / 5
                polys.append(self.quad([(xa, h - 0.1, z), (xa + w / 5, h - 0.1, z), (xa + w / 5, h + 1.0, z), (xa, h + 1.0, z)]))
        # nave
        polys.append(self.quad([(x + w, 0, z + 2), (x + w + 14, 0, z + 2), (x + w + 14, 8, z + 2), (x + w, 8, z + 2)]))
        polys.append(self.quad([(x + w - 0.2, 8, z + 2), (x + w + 14.2, 8, z + 2), (x + w + 7, 13, z + 2)]))
        fill(self.img, polys, col, self.tex_daub, 0.15, self.fog, ff)
        # belfry openings
        o = []
        for k in range(2):
            xa = x + 1.0 + k * 1.9
            o.append(self.quad([(xa, h - 4.0, z - 0.01), (xa + 1.0, h - 4.0, z - 0.01), (xa + 1.0, h - 1.6, z - 0.01), (xa + 0.5, h - 1.2, z - 0.01), (xa, h - 1.6, z - 0.01)]))
        fill(self.img, o, C(0.05, 0.05, 0.06), None, 0, self.fog, ff * 0.95)
        self.church_xy = self.P(x + w / 2, h - 2.6, z)

    def trees(self):
        rng = self.rng
        segs_by_z = {}
        for side in (-1, 1):
            for _ in range(5):
                z = rng.uniform(30, 70)
                x = side * rng.uniform(13, 26)
                segs = []

                def branch(x0, y0, ang, L, wd, d):
                    x1, y1 = x0 + L * math.sin(ang), y0 + L * math.cos(ang)
                    a, b = self.P(x0, y0, z), self.P(x1, y1, z)
                    segs.append((a[0], a[1], b[0], b[1], max(1, wd * F / z)))
                    if d > 0:
                        for _ in range(2 + (d > 2)):
                            branch(x1, y1, ang + rng.uniform(-0.7, 0.7), L * rng.uniform(0.55, 0.8), wd * 0.6, d - 1)
                branch(x, 0, rng.uniform(-0.1, 0.1), rng.uniform(4, 6), 0.45, 5)
                m = lines_mask(segs)
                ff = min(0.92, self.fogf(z))
                over(self.img, (C(0.12, 0.11, 0.10) * (0.3 if self.night else 1)) * (1 - ff) + self.fog * ff, m)

    def houses(self, z0, z1):
        rng = self.rng
        hs = []
        for s in (-1, 1):
            z = z0 + rng.uniform(0, 3)
            while z < z1:
                L = rng.uniform(5, 8.5)
                hs.append(dict(s=s, z=z, L=L, x=s * rng.uniform(3.9, 4.8), wh=rng.uniform(2.3, 2.9),
                               rh=rng.uniform(2.6, 3.6), D=rng.uniform(5, 6.5), tone=rng.uniform(0.8, 1.15)))
                z += L + rng.uniform(1.0, 4.0)
        hs.sort(key=lambda h: -h['z'])
        night = self.night
        k = 0.30 if night else 1.0
        daub, timber, thatch, dark = C(0.56, 0.50, 0.40), C(0.16, 0.11, 0.08), C(0.38, 0.31, 0.20), C(0.04, 0.035, 0.03)
        for h in hs:
            s, z, L, x, wh, rh, D, tn = h['s'], h['z'], h['L'], h['x'], h['wh'], h['rh'], h['D'], h['tone']
            ffs = self.fogf(z + L / 2)
            fff = self.fogf(z)
            side_l = (0.72 if s < 0 else 0.58) * k * tn
            front_l = 0.85 * k * tn
            # street-facing wall
            fill(self.img, [self.quad([(x, 0, z), (x, wh, z), (x, wh, z + L), (x, 0, z + L)])], daub * side_l, self.tex_daub, 0.3, self.fog, ffs)
            tim = []
            for za in (z, z + L * 0.5, z + L - 0.2):
                tim.append(self.quad([(x, 0, za), (x, wh, za), (x, wh, za + 0.22), (x, 0, za + 0.22)]))
            for ya in (0.25, wh * 0.55, wh - 0.2):
                tim.append(self.quad([(x, ya, z), (x, ya + 0.2, z), (x, ya + 0.2, z + L), (x, ya, z + L)]))
            zb = z + L * 0.5
            tim.append(self.quad([(x, 0.3, zb), (x, wh * 0.55, zb - 1.3), (x, wh * 0.55 + 0.18, zb - 1.3), (x, 0.48, zb)]))
            fill(self.img, tim, timber * side_l, self.tex_wood, 0.3, self.fog, ffs)
            zd = z + L * 0.22
            fill(self.img, [self.quad([(x, 0, zd), (x, 1.85, zd), (x, 1.85, zd + 0.95), (x, 0, zd + 0.95)])], dark, None, 0, self.fog, ffs)
            zw = z + L * 0.72
            fill(self.img, [self.quad([(x, 1.15, zw), (x, 1.7, zw), (x, 1.7, zw + 0.75), (x, 1.15, zw + 0.75)])], dark, None, 0, self.fog, ffs)
            # roof slope towards the street
            ov = 0.6
            fill(self.img, [self.quad([(x - s * ov, wh - 0.35, z - ov), (x + s * D / 2, wh + rh, z - ov * 0.5),
                                       (x + s * D / 2, wh + rh, z + L + ov), (x - s * ov, wh - 0.35, z + L + ov)])],
                 thatch * (0.62 * k * tn), self.tex_thatch, 0.45, self.fog, ffs)
            # front (camera-facing) wall
            fill(self.img, [self.quad([(x, 0, z), (x + s * D, 0, z), (x + s * D, wh, z), (x, wh, z)])], daub * front_l, self.tex_daub, 0.3, self.fog, fff)
            tim = [self.quad([(x + s * a, 0, z), (x + s * (a + 0.22), 0, z), (x + s * (a + 0.22), wh, z), (x + s * a, wh, z)]) for a in (0, D / 2, D - 0.22)]
            tim.append(self.quad([(x, wh * 0.55, z), (x + s * D, wh * 0.55, z), (x + s * D, wh * 0.55 + 0.2, z), (x, wh * 0.55 + 0.2, z)]))
            fill(self.img, tim, timber * front_l, self.tex_wood, 0.3, self.fog, fff)
            # gable end: thick thatch hip
            g = [(x - s * ov, wh - 0.4, z - ov), (x + s * D / 2, wh + rh + 0.15, z - ov * 0.5), (x + s * (D + ov), wh - 0.4, z - ov)]
            g2 = [(x - s * ov, wh - 0.4, z - ov), (x + s * D / 2, wh + rh + 0.15, z - ov * 0.5), (x + s * (D + ov), wh - 0.4, z - ov),
                  (x + s * (D + ov), wh - 0.75, z - ov), (x + s * D / 2, wh + rh - 0.2, z - ov * 0.5), (x - s * ov, wh - 0.75, z - ov)]
            fill(self.img, [self.quad(g)], thatch * (0.75 * k * tn), self.tex_thatch, 0.45, self.fog, fff)
            fill(self.img, [self.quad(g2)], thatch * (0.38 * k * tn), self.tex_thatch, 0.4, self.fog, fff)
        self.house_list = hs


def hooded(st, img, x, z, facing, col, h=1.65, wscale=1.0, lean=0.0):
    """A cloaked, hooded villager with no visible face (just a dark hood opening)."""
    ff = st.fogf(z)
    k = F / z
    bx, by = st.P(x, 0, z)

    def p(px, py):
        return (bx + (px + lean * py) * k * wscale, by - py * k * h / 1.65)
    cloak = [p(-0.19, 1.42), p(-0.27, 1.15), p(-0.31, 0.5), p(-0.34, 0.03), p(-0.1, 0.0), p(0.12, 0.02), p(0.33, 0.04),
             p(0.30, 0.5), p(0.27, 1.15), p(0.19, 1.42), p(0.05, 1.47), p(-0.05, 1.47)]
    hx = {'front': 0, 'back': 0, 'left': -0.03, 'right': 0.03}[facing]
    hood = [p(hx + 0.15 * math.cos(a), 1.52 + 0.17 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 30)]
    peak = [p(hx - 0.07, 1.64), p(hx + 0.07, 1.64), p(hx - 0.02 * (1 if facing == 'left' else -1), 1.76)]
    c = col * (0.25 if st.night else 1.0)
    fill(img, [cloak, hood, peak], c, st.tex_daub, 0.15, st.fog, ff * 0.9)
    # rim light from the bright fog behind
    if not st.night:
        rim = [p(-0.19, 1.42), p(-0.27, 1.15), p(-0.255, 1.15), p(-0.175, 1.40)]
        fill(img, [rim], st.fog * 0.95, None, 0, st.fog, ff, 0.5)
    if facing in ('left', 'right'):
        d = -1 if facing == 'left' else 1
        arm = capsule(*p(d * 0.12, 1.32), *p(d * 0.17, 1.47), 0.06 * k * wscale, 0.04 * k * wscale)
        fill(img, [arm], c * 0.85, None, 0, st.fog, ff * 0.9)
    if facing != 'back':
        ox = {'front': 0, 'left': -0.06, 'right': 0.06}[facing]
        face = [p(hx + ox + 0.06 * math.cos(a), 1.49 + 0.095 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 24)]
        fill(img, [face], c * 0.45, None, 0, st.fog, ff * 0.9, 0.6)
    # body shading: darker towards the hem
    sh = [p(-0.34, 0.03), p(0.33, 0.04), p(0.30, 0.6), p(-0.31, 0.6)]
    fill(img, [sh], c * 0.6, None, 0, st.fog, ff * 0.9, 0.35)


def rgba_canvas(wm, hm, k):
    """sprite canvas wm x hm metres, k px/m. Returns (rgb, alpha, P) with P(x,y) metres->px
    (x from centre, y up from the bottom)."""
    w, h = int(wm * k), int(hm * k)
    rgb = np.zeros((h, w, 3), np.float32)
    a = np.zeros((h, w), np.float32)

    def P(x, y):
        return (w / 2 + x * k, h - y * k)
    return rgb, a, P


def sprite_fill(rgb, a, polys, col, tex=None, amt=0.3):
    """Fill polygons on a sprite canvas; returns the full-size coverage mask."""
    m = np.zeros(a.shape, np.float32)
    r = poly_mask_bbox(polys, rgb.shape[1], rgb.shape[0], ss=2)
    if r is None:
        return m
    mm, x0, y0 = r
    h, w = mm.shape
    m[y0:y0 + h, x0:x0 + w] = mm
    reg = rgb[y0:y0 + h, x0:x0 + w]
    c = np.broadcast_to(np.asarray(col, np.float32), reg.shape).copy()
    if tex is not None:
        c *= (1 - amt + 2 * amt * tex[y0:y0 + h, x0:x0 + w])[..., None]
    m3 = mm[..., None]
    reg *= (1 - m3)
    reg += c * m3
    np.maximum(a[y0:y0 + h, x0:x0 + w], mm, out=a[y0:y0 + h, x0:x0 + w])
    return m


def cart_sprite(k=260):
    """Horse and cart coming head-on, a hooded driver, a lantern on a pole."""
    rgb, a, P = rgba_canvas(3.0, 3.0, k)
    tex = fbm(rgb.shape[0], rgb.shape[1], 30, 30, 4, 77)
    cart = C(0.16, 0.12, 0.09)
    sprite_fill(rgb, a, [[P(-0.95, 0.85), P(0.95, 0.85), P(0.9, 1.5), P(-0.9, 1.5)]], cart, tex)
    sprite_fill(rgb, a, [ellipse_poly(*P(-0.98, 0.62), 0.07 * k, 0.62 * k), ellipse_poly(*P(0.98, 0.62), 0.07 * k, 0.62 * k)], C(0.10, 0.08, 0.06), tex)
    sprite_fill(rgb, a, [ellipse_poly(*P(x, 1.55), 0.32 * k, 0.22 * k) for x in (-0.55, 0.0, 0.5)], C(0.30, 0.26, 0.19), tex, 0.4)
    # driver
    sprite_fill(rgb, a, [[P(0.12, 1.5), P(0.62, 1.5), P(0.56, 2.15), P(0.47, 2.25), P(0.27, 2.25), P(0.18, 2.15)],
                         ellipse_poly(*P(0.37, 2.36), 0.15 * k, 0.17 * k)], C(0.20, 0.17, 0.14), tex)
    # horse, head-on
    horse = C(0.13, 0.10, 0.08)
    polys = [capsule(*P(-0.17, 0.05), *P(-0.15, 0.95), 0.045 * k, 0.07 * k), capsule(*P(0.17, 0.05), *P(0.15, 0.95), 0.045 * k, 0.07 * k),
             capsule(*P(-0.22, 0.1), *P(-0.2, 0.9), 0.04 * k, 0.06 * k), capsule(*P(0.22, 0.1), *P(0.2, 0.9), 0.04 * k, 0.06 * k),
             ellipse_poly(*P(0, 1.18), 0.33 * k, 0.36 * k), capsule(*P(0, 1.3), *P(0, 1.78), 0.19 * k, 0.14 * k),
             capsule(*P(0, 1.98), *P(0, 1.48), 0.13 * k, 0.085 * k),
             [P(-0.13, 1.98), P(-0.06, 2.0), P(-0.12, 2.18)], [P(0.13, 1.98), P(0.06, 2.0), P(0.12, 2.18)]]
    sprite_fill(rgb, a, polys, horse, tex)
    sprite_fill(rgb, a, [capsule(*P(-0.21, 1.52), *P(0.21, 1.52), 0.06 * k, 0.06 * k)], C(0.07, 0.05, 0.04), tex)
    # lantern pole
    sprite_fill(rgb, a, [capsule(*P(-0.75, 1.45), *P(-0.82, 2.55), 0.025 * k, 0.02 * k), capsule(*P(-0.82, 2.55), *P(-1.0, 2.5), 0.02 * k, 0.02 * k)], C(0.08, 0.06, 0.05))
    sprite_fill(rgb, a, [[P(-1.07, 2.42), P(-0.93, 2.42), P(-0.94, 2.2), P(-1.06, 2.2)]], C(0.95, 0.6, 0.25))
    lantern = P(-1.0, 2.31)
    return np.dstack([rgb, a]), lantern


def doctor_sprite(k=600, seed=91):
    """The plague doctor: wide-brimmed hat, beaked leather mask with glass eyes, long waxed coat,
    cape, cane in one hand and a lantern in the other. Returns (rgba, lantern_px, eye_px)."""
    rgb, a, P = rgba_canvas(1.5, 2.2, k)
    h, w = a.shape
    tex = fbm(h, w, 12, 30, 5, seed)
    tex2 = fbm(h, w, 50, 50, 4, seed + 1)
    coat = C(0.075, 0.07, 0.068)
    # cane (behind)
    sprite_fill(rgb, a, [capsule(*P(-0.33, 1.08), *P(-0.47, 0.0), 0.016 * k, 0.014 * k)], C(0.12, 0.08, 0.05))
    # long coat
    hem = [P(0.46, 0.03), P(0.30, 0.0), P(0.12, 0.03), P(-0.05, 0.0), P(-0.25, 0.03), P(-0.45, 0.02)]
    sprite_fill(rgb, a, [[P(-0.20, 1.47), P(-0.27, 1.05), P(-0.36, 0.5)] + hem[::-1][::-1][::-1] + [P(0.36, 0.5), P(0.27, 1.05), P(0.20, 1.47)]],
                coat, tex, 0.25)
    # coat front opening / folds
    for xx, ww in [(0.02, 0.012), (-0.16, 0.008), (0.19, 0.008)]:
        sprite_fill(rgb, a, [capsule(*P(xx, 1.2), *P(xx * 1.6, 0.04), ww * k, ww * k * 1.6)], C(0.045, 0.043, 0.043))
    # arms: left (viewer's right) holds the lantern out; right (viewer's left) holds the cane
    sprite_fill(rgb, a, [capsule(*P(0.19, 1.40), *P(0.36, 1.02), 0.085 * k, 0.07 * k)], coat * 1.05, tex, 0.25)
    sprite_fill(rgb, a, [capsule(*P(-0.19, 1.40), *P(-0.31, 1.06), 0.085 * k, 0.07 * k)], coat * 1.05, tex, 0.25)
    sprite_fill(rgb, a, [ellipse_poly(*P(0.37, 0.98), 0.055 * k, 0.05 * k), ellipse_poly(*P(-0.32, 1.04), 0.05 * k, 0.05 * k)], C(0.05, 0.045, 0.04))
    # cape over the shoulders
    sprite_fill(rgb, a, [[P(-0.13, 1.52), P(-0.30, 1.42), P(-0.38, 1.18), P(-0.2, 1.12), P(0.0, 1.10), P(0.2, 1.12), P(0.38, 1.18), P(0.30, 1.42), P(0.13, 1.52)]],
                C(0.06, 0.055, 0.055), tex2, 0.2)
    # hood / head
    sprite_fill(rgb, a, [ellipse_poly(*P(0.0, 1.62), 0.125 * k, 0.15 * k)], C(0.10, 0.085, 0.075), tex2, 0.3)
    # beak: curved leather cone pointing down and towards the viewer's left
    beak = []
    for i in range(21):
        t = i / 20
        bx = -0.03 - 0.17 * t - 0.03 * math.sin(t * math.pi)
        by = 1.60 - 0.30 * t
        wd = 0.065 * (1 - t) ** 0.9 + 0.004
        beak.append((bx, by, wd))
    up = [P(bx - wd * 0.45, by + wd) for bx, by, wd in beak]
    lo = [P(bx + wd * 0.45, by - wd) for bx, by, wd in beak[::-1]]
    mb = sprite_fill(rgb, a, [up + lo], C(0.24, 0.18, 0.13), tex2, 0.35)
    # stitched seams/straps on the beak
    sprite_fill(rgb, a, [capsule(*P(-0.05, 1.55), *P(-0.19, 1.32), 0.004 * k, 0.003 * k)], C(0.10, 0.07, 0.05))
    sprite_fill(rgb, a, [capsule(*P(-0.10, 1.66), *P(0.11, 1.66), 0.012 * k, 0.012 * k)], C(0.06, 0.05, 0.04))
    # glass eyes
    eyes = [P(-0.05, 1.655), P(0.06, 1.65)]
    for ex, ey in eyes:
        sprite_fill(rgb, a, [ellipse_poly(ex, ey, 0.033 * k, 0.031 * k)], C(0.16, 0.12, 0.06))
        sprite_fill(rgb, a, [ellipse_poly(ex, ey, 0.024 * k, 0.023 * k)], C(0.02, 0.025, 0.03))
    # hat: brim and crown
    sprite_fill(rgb, a, [ellipse_poly(*P(0.0, 1.765), 0.36 * k, 0.055 * k)], C(0.05, 0.048, 0.048), tex2, 0.2)
    sprite_fill(rgb, a, [[P(-0.13, 1.77), P(-0.12, 1.99), P(0.12, 1.99), P(0.13, 1.77)], ellipse_poly(*P(0, 1.99), 0.12 * k, 0.025 * k)],
                C(0.055, 0.05, 0.05), tex2, 0.2)
    sprite_fill(rgb, a, [[P(-0.13, 1.78), P(-0.13, 1.82), P(0.13, 1.82), P(0.13, 1.78)]], C(0.03, 0.03, 0.03))
    # lantern hanging from the left hand
    lx, ly = 0.40, 0.80
    sprite_fill(rgb, a, [capsule(*P(0.37, 0.97), *P(lx, ly + 0.12), 0.006 * k, 0.006 * k)], C(0.05, 0.04, 0.03))
    sprite_fill(rgb, a, [[P(lx - 0.07, ly + 0.12), P(lx + 0.07, ly + 0.12), P(lx + 0.06, ly - 0.11), P(lx - 0.06, ly - 0.11)],
                         [P(lx - 0.045, ly + 0.17), P(lx + 0.045, ly + 0.17), P(lx + 0.07, ly + 0.12), P(lx - 0.07, ly + 0.12)]], C(0.08, 0.06, 0.04))
    sprite_fill(rgb, a, [[P(lx - 0.05, ly + 0.09), P(lx + 0.05, ly + 0.09), P(lx + 0.045, ly - 0.08), P(lx - 0.045, ly - 0.08)]], C(1.0, 0.70, 0.32))
    sprite_fill(rgb, a, [capsule(*P(lx, ly + 0.09), *P(lx, ly - 0.08), 0.005 * k, 0.005 * k)], C(0.10, 0.07, 0.04))
    lan = P(lx, ly)
    # warm light from the lantern (low, to the right) on everything it can see
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    lit = glow(xs, ys, lan[0], lan[1], 0.45 * k)
    edge = np.clip(a - np.roll(np.roll(a, -int(0.012 * k), 1), int(0.006 * k), 0), 0, 1)
    rimw = blur(edge, 0.004 * k) * lit
    rgb += rimw[..., None] * C(1.0, 0.62, 0.30) * 0.9
    rgb *= (1 + 1.6 * lit)[..., None] * np.array([1.0, 0.85, 0.7], np.float32)
    # beak catches light along its underside
    rgb += (mb * smooth(1.25 * k, 1.75 * k, ys) * 0 + mb * lit * 0.25)[..., None] * C(1.0, 0.6, 0.3)
    # cold fog rim on the far (left/top) side
    edge2 = np.clip(a - np.roll(np.roll(a, int(0.01 * k), 1), int(0.01 * k), 0), 0, 1)
    rgb += blur(edge2, 0.006 * k)[..., None] * C(0.35, 0.42, 0.55) * 0.25
    # eye glints
    for ex, ey in eyes:
        sprite_fill(rgb, a, [ellipse_poly(ex + 0.008 * k, ey + 0.008 * k, 0.0075 * k, 0.0075 * k)], C(1.0, 0.82, 0.55))
    return np.dstack([rgb, a]), lan, eyes


def chicken_sprite(k, col, peck, seed):
    rgb, a, P = rgba_canvas(0.7, 0.6, k)
    tex = fbm(rgb.shape[0], rgb.shape[1], 20, 20, 3, seed)
    sprite_fill(rgb, a, [capsule(*P(-0.04, 0.0), *P(-0.03, 0.14), 0.008 * k, 0.008 * k),
                         capsule(*P(0.04, 0.0), *P(0.03, 0.14), 0.008 * k, 0.008 * k)], C(0.45, 0.35, 0.15))
    sprite_fill(rgb, a, [ellipse_poly(*P(0, 0.24), 0.16 * k, 0.11 * k),
                         [P(-0.12, 0.27), P(-0.26, 0.45), P(-0.20, 0.25), P(-0.10, 0.17)]], col, tex, 0.4)
    hx, hy = (0.17, 0.12) if peck else (0.15, 0.40)
    sprite_fill(rgb, a, [capsule(*P(0.08, 0.27), *P(hx, hy), 0.06 * k, 0.045 * k)], col * 1.05, tex, 0.4)
    sprite_fill(rgb, a, [[P(hx + 0.04, hy + 0.01), P(hx + 0.08, hy - 0.01 if not peck else hy - 0.04), P(hx + 0.035, hy - 0.015)]], C(0.6, 0.45, 0.15))
    sprite_fill(rgb, a, [ellipse_poly(*P(hx - 0.005, hy + 0.05 if not peck else hy + 0.0), 0.025 * k, 0.02 * k)], C(0.55, 0.08, 0.05))
    return np.dstack([rgb, a])


class Village(Scene):
    """3. Stepping out into the muddy street: thatched houses, fog, chickens, church tower."""
    fog_col = C(0.70, 0.70, 0.67)
    fog_density = 0.09
    fog_band = (0.47, 0.14, 0.12)
    push = 0.11
    shake = 2.6
    sat = 0.68

    def __init__(self):
        st = Street(31, night=False, yh=0.46, zf=20)
        self.st = st
        self.A = st.img
        self.chickens = []
        for (x, z, col, ph) in [(-1.2, 5.0, C(0.45, 0.28, 0.14), 0.0), (0.9, 6.5, C(0.62, 0.58, 0.50), 0.7),
                                (-0.4, 8.5, C(0.30, 0.20, 0.12), 1.3), (1.9, 4.3, C(0.40, 0.24, 0.12), 2.1)]:
            k = F / z
            sp = [chicken_sprite(k, col, False, 50), chicken_sprite(k, col, True, 50)]
            ff = st.fogf(z)
            for s in sp:
                s[..., :3] = s[..., :3] * 0.6 * (1 - ff) + st.fog * ff
            bx, by = st.P(x, 0, z)
            self.chickens.append((sp, bx - sp[0].shape[1] / 2, by - sp[0].shape[0], ph, 1 if x > 0 else -1))
        # dark door frame we are stepping out of
        X, Y = grid()
        self.jamb = np.dstack([np.zeros((RH, 260, 3), np.float32) + C(0.05, 0.035, 0.025), np.ones((RH, 260), np.float32)])
        self.jamb[..., :3] *= (0.6 + 0.6 * fbm(RH, 260, 3, 60, 4, 35))[..., None]
        self.jamb = np.dstack([blur(self.jamb[..., :3], 10), blur(self.jamb[..., 3], 10)])

    def frame(self, t):
        img = self.A.copy()
        for sp, x, y, ph, d in self.chickens:
            peck = (math.sin(t * 2.4 + ph * 3) > 0.55)
            spr = sp[1] if peck else sp[0]
            if d < 0:
                spr = spr[:, ::-1]
            paste_rgba(img, spr, x + 6 * math.sin(t * 0.7 + ph), y)
        # door jambs slide out of frame as we step through the doorway
        p = ease(t / 1.4)
        paste_rgba(img, self.jamb, -60 - 340 * p, 0)
        paste_rgba(img, self.jamb[:, ::-1], RW - 200 + 340 * p, 0)
        return img


class Rumours(Scene):
    """4. Villagers whisper in the fog; a merchant's cart comes up the road."""
    fog_col = C(0.66, 0.66, 0.64)
    fog_density = 0.10
    fog_band = (0.45, 0.14, 0.14)
    push = 0.07
    shake = 1.6
    sat = 0.62

    def __init__(self):
        st = Street(41, night=False, yh=0.44, zf=17, church=False, houses_z=(7, 70))
        self.st = st
        img = st.img
        people = [(-1.55, 5.3, 'right', C(0.20, 0.16, 0.12), 1.0, 0.06), (-0.80, 5.7, 'left', C(0.15, 0.16, 0.13), 1.05, -0.07),
                  (-1.20, 6.6, 'front', C(0.24, 0.15, 0.11), 0.95, 0.02), (-2.1, 6.2, 'right', C(0.17, 0.15, 0.13), 1.0, 0.03),
                  (1.55, 4.7, 'left', C(0.14, 0.13, 0.12), 1.1, -0.06), (2.25, 5.0, 'right', C(0.22, 0.19, 0.14), 1.0, 0.05),
                  (1.85, 6.0, 'front', C(0.19, 0.17, 0.15), 0.95, 0.0),
                  (1.2, 2.5, 'back', C(0.09, 0.08, 0.07), 1.15, 0.02)]
        people.sort(key=lambda p: -p[1])
        for x, z, f, c, wsc, lean in people:
            hooded(st, img, x, z, f, c, 1.62, wsc, lean)
        self.A = img
        self.cart, self.lan = cart_sprite(300)

    def frame(self, t):
        img = self.A.copy()
        st = self.st
        z = 40 - 14 * (t / 4.0)
        x = 0.25
        k = 300
        sc = F / (z * k)
        bx, by = st.P(x, 0, z)
        h, w = self.cart.shape[:2]
        bob = 0.015 * abs(math.sin(t * 5.5)) * F / z
        ff = st.fogf(z) * 0.95
        cart = self.cart.copy()
        cart[..., :3] = cart[..., :3] * (1 - ff) + st.fog * ff
        paste_rgba(img, cart, bx - w / 2 * sc, by - h * sc - bob, sc)
        lx, ly = bx + (self.lan[0] - w / 2) * sc, by - (h - self.lan[1]) * sc - bob
        fl = 1 + 0.08 * math.sin(t * 13) + 0.05 * math.sin(t * 29)
        add_glow(img, lx, ly, 0.06 * F / z, C(1.0, 0.65, 0.3), 0.55 * fl * (1 - ff * 0.5))
        add_glow(img, lx, ly, 0.5 * F / z, C(1.0, 0.7, 0.4), 0.05 * fl)
        return img


class Doctor(Scene):
    """6. Night. The plague doctor walks toward us down the street, lantern in hand."""
    fog_col = C(0.13, 0.15, 0.20)
    fog_density = 0.14
    fog_band = (0.50, 0.18, 0.12)
    push = 0.10
    shake = 1.4
    sat = 0.7

    def __init__(self):
        st = Street(61, night=True, yh=0.47, zf=13, church=True)
        self.st = st
        img = st.img
        # a couple of far lanterns on the houses
        for (x, y, z) in [(-3.9, 2.0, 18), (4.1, 2.1, 27), (-4.0, 2.0, 40)]:
            px, py = st.P(x, y, z)
            img += 0  # placeholder for clarity
            add_glow(img, px, py, 0.08 * F / z, C(1.0, 0.6, 0.28), 0.5 * (1 - st.fogf(z) * 0.6))
            add_glow(img, px, py, 0.9 * F / z, C(1.0, 0.6, 0.3), 0.05)
        self.A = img
        self.k = 560
        self.spr, self.lan, self.eyes = doctor_sprite(self.k)

    def z_at(self, t):
        return 12.5 - 9.8 * (1 - (1 - min(t / 4.4, 1)) ** 1.25)

    def frame(self, t):
        img = self.A.copy()
        st = self.st
        z = self.z_at(t)
        sc = F / (z * self.k)
        x = 0.25 - 0.1 * (t / 4.4)
        bx, by = st.P(x, 0, z)
        h, w = self.spr.shape[:2]
        step = t * 3.6
        bob = 0.025 * abs(math.sin(step * math.pi / 2)) * F / z
        sway = 0.02 * math.sin(step * math.pi / 2) * F / z
        ff = st.fogf(z) * 0.85
        spr = self.spr.copy()
        spr[..., :3] = spr[..., :3] * (1 - ff) + st.fog * ff
        # warm light pool on the wet ground around the lantern
        lx, ly = bx + sway + (self.lan[0] - w / 2) * sc, by - (h - self.lan[1]) * sc - bob
        fl = 1 + 0.07 * math.sin(t * 12.7) + 0.05 * math.sin(t * 31)
        gx, gy = st.P(x + 0.35, 0, z - 0.2)
        add_glow(img, gx, gy, 1.1 * F / z, C(1.0, 0.6, 0.3), 0.20 * fl * (1 - ff))
        paste_rgba(img, spr, bx + sway - w / 2 * sc, by - h * sc - bob, sc)
        add_glow(img, lx, ly, 0.05 * F / z, C(1.0, 0.75, 0.45), 0.9 * fl, 'gauss')
        add_glow(img, lx, ly, 0.16 * F / z, C(1.0, 0.6, 0.28), 0.45 * fl)
        add_glow(img, lx, ly, 0.9 * F / z, C(1.0, 0.6, 0.3), 0.06 * fl)
        # reflection streak of the lantern in the wet mud
        rx, ry = lx, by + (by - ly) * 0.35
        add_glow(img, rx, ry, 0.10 * F / z, C(1.0, 0.6, 0.28), 0.18 * fl)
        return img


class Marked(Scene):
    """5. Night. Boarded windows, red crosses painted on the doors, lanterns in the fog."""
    fog_col = C(0.09, 0.11, 0.15)
    fog_density = 0.13
    fog_band = (0.66, 0.2, 0.12)
    push = 0.08
    shake = 1.2
    sat = 0.85

    def __init__(self):
        X, Y = grid()
        rng = np.random.default_rng(51)
        yg = 0.70 * RH
        alb = np.zeros((RH, RW, 3), np.float32)
        v = np.clip(Y / yg, 0, 1)[..., None]
        alb[:] = C(0.03, 0.035, 0.05) * (1 - v) + C(0.10, 0.11, 0.14) * v
        daub_t = fbm(RH, RW, 40, 40, 5, 52)
        thatch_t = fbm(RH, RW, 160, 8, 4, 53)
        wood_t = fbm(RH, RW, 110, 5, 4, 54)
        daub, timber, thatch = C(0.62, 0.56, 0.46), C(0.20, 0.14, 0.10), C(0.42, 0.34, 0.22)
        houses = [(-0.18, 0.36, 0.33), (0.36, 0.70, 0.30), (0.70, 1.18, 0.345)]
        self.doors = []
        for i, (a0, a1, yt) in enumerate(houses):
            x0, x1, yt = a0 * RW, a1 * RW, yt * RH
            fill(alb, [[(x0, yt), (x1, yt), (x1, yg), (x0, yg)]], daub, daub_t, 0.15)
            tim = []
            for xx in (x0, (x0 + x1) / 2, x1 - 34):
                tim.append([(xx, yt), (xx + 34, yt), (xx + 34, yg), (xx, yg)])
            for yy in (yt, yt + 0.48 * (yg - yt), yg - 30):
                tim.append([(x0, yy), (x1, yy), (x1, yy + 30), (x0, yy + 30)])
            ym = yt + 0.48 * (yg - yt)
            tim.append([(x0 + 34, ym), (x0 + 60, ym), ((x0 + x1) / 2, yt + 30), ((x0 + x1) / 2 - 26, yt + 30)])
            fill(alb, tim, timber, wood_t, 0.35)
            # thatched roof
            roof = [(x0 - 50, yt + 25), (x1 + 50, yt + 25), (x1 - 40, yt - 0.17 * RH), (x0 + 40, yt - 0.17 * RH)]
            fill(alb, [roof], thatch * 0.75, thatch_t, 0.5)
            fill(alb, [[(x0 - 50, yt + 25), (x1 + 50, yt + 25), (x1 + 45, yt - 15), (x0 - 45, yt - 15)]], thatch * 0.45, thatch_t, 0.4)
            # door
            dw = 0.155 * RW
            dc = {0: x0 + 0.62 * (x1 - x0), 1: x0 + 0.30 * (x1 - x0), 2: x0 + 0.30 * (x1 - x0)}[i]
            d0, d1, dt = dc - dw / 2, dc + dw / 2, yg - 0.205 * RH
            fill(alb, [[(d0 - 22, dt - 22), (d1 + 22, dt - 22), (d1 + 22, yg), (d0 - 22, yg)]], timber * 0.8, wood_t, 0.3)
            e = plank_edges(rng, d0, d1, dw / 5, dw / 3.6)
            e[-1] = d1
            dm = poly_mask([[(d0, dt), (d1, dt), (d1, yg), (d0, yg)]])
            planks, _, _ = wood_planks(55 + i, e, C(0.30, 0.20, 0.13), 0.2)
            over(alb, planks, dm)
            for yy in (dt + 0.035 * RH, yg - 0.05 * RH):
                fill(alb, [[(d0, yy), (d1, yy), (d1, yy + 16), (d0, yy + 16)]], C(0.07, 0.07, 0.075))
            self.doors.append((d0, d1, dt, yg))
            # windows, boarded up
            wx = {0: x0 + 0.20 * (x1 - x0), 1: x0 + 0.70 * (x1 - x0), 2: x0 + 0.64 * (x1 - x0)}[i]
            ww, wy0, wy1 = 0.11 * RW, yt + 0.06 * RH, yt + 0.14 * RH
            fill(alb, [[(wx - ww / 2, wy0), (wx + ww / 2, wy0), (wx + ww / 2, wy1), (wx - ww / 2, wy1)]], C(0.01, 0.01, 0.012))
            boards = []
            for kk in range(3):
                yy = wy0 + (kk + 0.2) * (wy1 - wy0) / 3
                boards.append(jitter([(wx - ww / 2 - 18, yy + rng.uniform(-12, 12)), (wx + ww / 2 + 18, yy + rng.uniform(-12, 12)),
                                      (wx + ww / 2 + 18, yy + 30 + rng.uniform(-8, 8)), (wx - ww / 2 - 18, yy + 30 + rng.uniform(-8, 8))], 3, rng))
            boards.append([(wx - ww / 2 - 10, wy1 + 5), (wx - ww / 2 + 20, wy1 + 12), (wx + ww / 2 + 12, wy0 - 4), (wx + ww / 2 - 18, wy0 - 12)])
            fill(alb, boards, C(0.33, 0.25, 0.17), wood_t, 0.4)
            if i == 1:
                self.leak = (wx, (wy0 + wy1) / 2, ww)
        # red crosses, brushed on, with drips
        cross = np.zeros((RH, RW), np.float32)
        for d0, d1, dt, yb in self.doors:
            cx_, cy_ = (d0 + d1) / 2 + rng.uniform(-10, 10), dt + 0.38 * (yb - dt)
            L1, L2, wd = 0.14 * RH, 0.065 * RW, 30
            ang = rng.uniform(-0.06, 0.06)
            segs = [(cx_ - math.sin(ang) * L1 * 0.45, cy_ - L1 * 0.55, cx_ + math.sin(ang) * L1 * 0.5, cy_ + L1 * 0.5, wd),
                    (cx_ - L2, cy_ - 0.02 * RH + rng.uniform(-6, 6), cx_ + L2, cy_ - 0.02 * RH + rng.uniform(-6, 6), wd * 0.95)]
            for k2 in range(6):
                xx = cx_ - L2 + rng.uniform(0, 2 * L2)
                yy = cy_ - 0.02 * RH + 10
                segs.append((xx, yy, xx + rng.uniform(-2, 2), yy + rng.uniform(15, 70), rng.uniform(3, 7)))
            for k2 in range(2):
                xx = cx_ + rng.uniform(-8, 8)
                segs.append((xx, cy_ + L1 * 0.45, xx, cy_ + L1 * 0.45 + rng.uniform(30, 90), rng.uniform(4, 7)))
            cross = np.maximum(cross, lines_mask(segs))
        brush = fbm(RH, RW, 30, 120, 4, 56)
        cross = np.clip(cross * (0.55 + 0.7 * brush) - 0.08, 0, 1)
        over(alb, C(0.85, 0.07, 0.04) * (0.75 + 0.4 * brush[..., None]), cross)
        # muddy street in front
        gm = smooth(yg - 3, yg + 3, Y)
        mud = fbm(RH, RW, 30, 90, 5, 57)
        puddle = np.clip((fbm(RH, RW, 4, 10, 4, 58) - 0.6) * 5, 0, 1) * gm
        over(alb, C(0.20, 0.16, 0.12) * (0.5 + 0.6 * mud[..., None]), gm)
        self.puddle = puddle
        # lanterns
        self.lanterns = [(0.335 * RW, 0.425 * RH), (0.885 * RW, 0.485 * RH)]
        fill(alb, [[(0.31 * RW, 0.385 * RH), (0.36 * RW, 0.385 * RH), (0.36 * RW, 0.39 * RH), (0.31 * RW, 0.39 * RH)]], C(0.08, 0.07, 0.06))
        fill(alb, [[(0.882 * RW, 0.49 * RH), (0.89 * RW, 0.49 * RH), (0.893 * RW, yg + 30), (0.879 * RW, yg + 30)]], C(0.12, 0.09, 0.07), wood_t, 0.3)
        lightL = np.zeros((RH, RW), np.float32)
        for lx, ly in self.lanterns:
            lightL += 0.75 * glow(X, Y, lx, ly, 0.075 * RW) + 0.22 * glow(X, Y, lx, ly, 0.25 * RW)
        amb = C(0.13, 0.155, 0.22)
        self.base = (alb * amb).astype(np.float32)
        self.lit = (alb * lightL[..., None] * C(1.0, 0.62, 0.32)).astype(np.float32)
        # wet reflections of the lanterns in the puddles
        refl = np.zeros((RH, RW), np.float32)
        for lx, ly in self.lanterns:
            ry = yg + (yg - ly) * 0.9
            refl += np.exp(-((X - lx) / 30) ** 2) * np.exp(-((Y - ry) / 140) ** 2)
        self.refl = (refl * (0.3 + puddle))[..., None] * C(1.0, 0.6, 0.3) * 0.6
        self.lantern_body = []
        for lx, ly in self.lanterns:
            self.lantern_body.append([(lx - 26, ly - 38), (lx + 26, ly - 38), (lx + 22, ly + 36), (lx - 22, ly + 36)])
        lb = poly_mask(self.lantern_body)
        self.lb = lb[..., None]
        self.cage = lines_mask([(lx, ly - 38, lx, ly + 36, 5) for lx, ly in self.lanterns] +
                               [(lx - 26, ly - 38, lx + 26, ly - 38, 8) for lx, ly in self.lanterns] +
                               [(lx - 22, ly + 36, lx + 22, ly + 36, 8) for lx, ly in self.lanterns])[..., None]
        wx, wy, ww = self.leak
        self.leakg = (gauss(X, Y, wx, wy, ww * 0.5) * (1 - np.clip(poly_mask([]), 0, 1)))[..., None]

    def frame(self, t):
        fl = [1 + 0.09 * math.sin(t * 12.1 + i) + 0.06 * math.sin(t * 27.3 + 2 * i) + 0.04 * math.sin(t * 4.1 + i) for i in range(2)]
        f = (fl[0] + fl[1]) / 2
        img = self.base + self.lit * f + self.refl * f
        img = img * (1 - self.lb) + self.lb * C(1.0, 0.72, 0.38) * 1.3 * f
        img *= (1 - 0.9 * self.cage)
        for (lx, ly), ff in zip(self.lanterns, fl):
            add_glow(img, lx, ly, 70, C(1.0, 0.62, 0.3), 0.35 * ff)
            add_glow(img, lx, ly, 260, C(1.0, 0.6, 0.3), 0.06 * ff)
        img += self.leakg * C(1.0, 0.6, 0.25) * 0.05 * fl[0]
        return img


class Crack(Scene):
    """7. Through a crack in the door: the masked figure, right outside."""
    fog_col = C(0.08, 0.09, 0.12)
    fog_density = 0.06
    push = 0.09
    shake = 1.0
    sat = 0.75

    def __init__(self):
        X, Y = grid()
        rng = np.random.default_rng(71)
        out = np.zeros((RH, RW, 3), np.float32)
        out[:] = C(0.07, 0.085, 0.11)
        out += (0.20 * glow(X, Y, 0.62 * RW, 0.85 * RH, 0.25 * RW))[..., None] * C(1.0, 0.6, 0.3)
        self.out = out
        self.k = 1350
        self.spr, self.lan, self.eyes = doctor_sprite(self.k, seed=92)
        # door: dark planks with a vertical crack
        e = [-40, 0.14 * RW, 0.39 * RW, 0.61 * RW, 0.86 * RW, RW + 40]
        door, _, _ = wood_planks(72, e, C(0.16, 0.11, 0.075), 0.15, (40, 2))
        self.door = door
        n = fbm(RH, 8, 1, 30, 5, 73)
        self.el = 0.395 * RW + 14 * (n[:, 1] - 0.5) * 2 + 7 * (fbm(RH, 8, 1, 120, 3, 74)[:, 2] - 0.5)
        self.er = 0.605 * RW + 14 * (n[:, 5] - 0.5) * 2 + 7 * (fbm(RH, 8, 1, 120, 3, 75)[:, 6] - 0.5)
        # splinters
        for _ in range(9):
            y = rng.uniform(0.1, 0.9) * RH
            i = int(y)
            ln = rng.integers(20, 70)
            sl = np.linspace(rng.uniform(5, 14), 0, ln)
            if rng.random() < 0.5:
                self.el[i:i + ln] += sl[:len(self.el[i:i + ln])]
            else:
                self.er[i:i + ln] -= sl[:len(self.er[i:i + ln])]
        self.X = X
        self.under = (glow(X, Y, 0.6 * RW, 1.0 * RH, 0.35 * RW)[..., None] * C(1.0, 0.6, 0.3)).astype(np.float32)

    def frame(self, t):
        X = self.X
        img = self.out.copy()
        # the figure leans a little closer, breathing
        sc = 1.0 + 0.04 * (t / 5.0) + 0.006 * math.sin(t * 1.7)
        h, w = self.spr.shape[:2]
        ex, ey = self.eyes[0]
        tx, ty = 0.495 * RW, 0.43 * RH
        fl = 1 + 0.08 * math.sin(t * 12.7) + 0.05 * math.sin(t * 29.3)
        img += (0.16 * fl) * self.under
        paste_rgba(img, self.spr, tx - ex * sc, ty - ey * sc, sc)
        img += (0.03 * fl) * self.under
        for i, (ex2, ey2) in enumerate(self.eyes):
            gx, gy = tx + (ex2 - ex) * sc + 0.008 * self.k * sc, ty + (ey2 - ey) * sc + 0.008 * self.k * sc
            add_glow(img, gx, gy, 10, C(1.0, 0.8, 0.5), 0.6 * fl, 'gauss')
        # the door opens a little at the end
        p = ease((t - 3.7) / 1.1)
        el = self.el - 0.11 * RW * p
        er = self.er
        inside = (X > el[:, None] + 0.5) & (X < er[:, None] - 0.5)
        m = np.clip(np.minimum(X - el[:, None], er[:, None] - X) + 0.5, 0, 1)
        lightL = 0.06 + 0.9 * np.exp(-np.minimum(np.abs(X - el[:, None]), np.abs(X - er[:, None])) / 30) * fl
        door = self.door * lightL[..., None] * C(1.0, 0.7, 0.45)
        if p > 0:
            # left door leaf slides left as it swings; shift its texture
            sh = int(0.11 * RW * p)
            left = X < el[:, None]
            door = np.where(left[..., None], np.roll(door, -sh, axis=1), door)
        res = img * m[..., None] + door * (1 - m[..., None])
        return res

    def Yrow(self):
        if not hasattr(self, '_Y'):
            self._Y = grid()[1]
        return self._Y
