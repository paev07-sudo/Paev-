"""Compositor: camera moves, fog, grade, grain, captions, cuts -> build/video.mp4 (silent).
python3 render.py            full render
python3 render.py 1.0 9.5    write graded stills at those times to build/still_<t>.png"""
import os
import sys
if 'MALLOC_MMAP_THRESHOLD_' not in os.environ:      # numpy allocs are 8x faster with these
    os.environ.update(MALLOC_MMAP_THRESHOLD_='2147483647', MALLOC_TRIM_THRESHOLD_='4294967295')
    os.execv(sys.executable, [sys.executable] + sys.argv)
import json
import math
import subprocess
import time
import multiprocessing as mp
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from gfx import W, H, FPS, RW, RH, SS, fbm, blur
import scenes

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, 'build')
TOTAL = 30.0
BLACK = 0.3

CAPTIONS = ["POV: you wake up in 1348", "breakfast = survival", "no water. no doctors.", "then HE arrived…",
            "the doors started getting marked", "would you open the door?", "comment: survive or not? 👇"]
CLASSES = [scenes.Hut, scenes.Breakfast, scenes.Village, scenes.Rumours, scenes.Marked, scenes.Doctor, scenes.Crack]


def timeline():
    d = json.load(open(f'{B}/vo.json'))['durations']
    segs, t = [], 0.0
    for i in range(6):
        lead = 0.25 if i == 0 else 0.2
        tail = 0.9 if i == 5 else 0.25
        vo = t + lead
        end = vo + d[i] + tail
        segs.append(dict(i=i, start=t, end=end, vo=vo, vo_end=vo + d[i]))
        t = end
    black = (t, t + BLACK)
    s7 = t + BLACK
    segs.append(dict(i=6, start=s7, end=TOTAL, vo=s7 + 1.0, vo_end=s7 + 1.0 + d[6]))
    return segs, black


SEGS, BLACK_SPAN = timeline()


# ---------------------------------------------------------------------------------- captions
FONT = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
EMOJI = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
_fonts = {}


def font(sz):
    if sz not in _fonts:
        _fonts[sz] = ImageFont.truetype(FONT, sz)
    return _fonts[sz]


_emoji = None


def emoji_img(ch, h):
    global _emoji
    if _emoji is None:
        _emoji = ImageFont.truetype(EMOJI, 109)
    im = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10, 10), ch, font=_emoji, embedded_color=True)
    im = im.crop(im.getbbox())
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)


def layout(text, sz=76, maxw=880):
    words = text.split(' ')
    f = font(sz)
    space = f.getlength(' ') + 0.22 * sz
    lines, cur, cw = [], [], 0
    for w in words:
        ww = f.getlength(w) if not is_emoji(w) else sz * 1.05
        if cur and cw + space + ww > maxw:
            lines.append(cur)
            cur, cw = [], 0
        cur.append((w, ww))
        cw += (space if len(cur) > 1 else 0) + ww
    lines.append(cur)
    out = []
    lh = sz * 1.18
    y0 = -lh * (len(lines) - 1) / 2
    for li, ln in enumerate(lines):
        tw = sum(w for _, w in ln) + space * (len(ln) - 1)
        x = -tw / 2
        for w, ww in ln:
            out.append((w, x + ww / 2, y0 + li * lh))
            x += ww + space
    return out


def is_emoji(w):
    return any(ord(c) > 0x2FFF for c in w)


def word_times(seg, n, words):
    t0, t1 = seg['vo'], seg['vo_end'] - 0.15
    wts = [len(w) + 2 for w in words]
    tot = sum(wts)
    ts, acc = [], 0
    for w in wts:
        ts.append(t0 + (t1 - t0) * acc / tot)
        acc += w
    return ts


CAP_Y = 1330


def draw_caption(frame_rgb, seg, t):
    text = CAPTIONS[seg['i']]
    lay = layout(text)
    words = [w for w, _, _ in lay]
    ts = word_times(seg, len(words), words)
    active = max([k for k, tk in enumerate(ts) if t >= tk] or [0])
    pop_in = min(1.0, (t - seg['start']) / 0.14)
    base_sc = 0.82 + 0.18 * (1 - (1 - pop_in) ** 3)
    im = Image.new('RGBA', (W, 520), (0, 0, 0, 0))
    sh = Image.new('RGBA', (W, 520), (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(im), ImageDraw.Draw(sh)
    cy = 260
    for k, (w, x, y) in enumerate(lay):
        act = (k == active)
        pk = 0.0
        if act:
            pk = max(0.0, 1 - (t - ts[k]) / 0.18)
        sc = base_sc * (1.0 + (0.06 if act else 0.0) + 0.07 * pk)
        sz = int(76 * sc)
        px, py = W / 2 + x * base_sc, cy + y * base_sc
        if is_emoji(w):
            e = emoji_img(w, int(sz * 1.05))
            im.alpha_composite(e, (int(px - e.width / 2), int(py - e.height / 2)))
            continue
        col = (255, 214, 64, 255) if act else (255, 255, 255, 255)
        d.text((px, py), w, font=font(sz), fill=col, anchor='mm', stroke_width=max(5, int(sz * 0.09)), stroke_fill=(0, 0, 0, 255))
        ds.text((px + 3, py + 6), w, font=font(sz), fill=(0, 0, 0, 170), anchor='mm', stroke_width=max(5, int(sz * 0.09)), stroke_fill=(0, 0, 0, 170))
    sh = sh.filter(ImageFilter.GaussianBlur(9))
    sh.alpha_composite(im)
    frame_rgb.paste(sh, (0, CAP_Y - cy), sh)


# ---------------------------------------------------------------------------------- frame
_state = {}


def setup():
    if _state:
        return
    _state['scenes'] = [None] * 7
    _state['fogA'] = fbm(1400, 900, 3, 5, 6, 901)
    _state['fogB'] = fbm(1400, 900, 8, 12, 5, 902)
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xs - W / 2) / (W * 0.62)) ** 2 + ((ys - H / 2) / (H * 0.62)) ** 2)
    _state['vig'] = (1 - 0.62 * np.clip(r, 0, 1.4) ** 2.4).clip(0.15, 1)[..., None].astype(np.float32)
    _state['yy'] = (ys / H)
    _state['xs'], _state['ys'] = xs, ys


def get_scene(i):
    sc = _state['scenes'][i]
    if sc is None:
        sc = _state['scenes'][i] = CLASSES[i]()
    return sc


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def sample_fog(arr, ox, oy, s=0.62):
    im = Image.fromarray(arr, 'F')
    return np.asarray(im.transform((W, H), Image.AFFINE, (s, 0, ox, 0, s, oy), Image.BILINEAR), np.float32)


def render_frame(n):
    setup()
    t = n / FPS
    if BLACK_SPAN[0] <= t < BLACK_SPAN[1]:
        return np.zeros((H, W, 3), np.uint8).tobytes()
    seg = [s for s in SEGS if s['start'] <= t < s['end'] + 1e-6][-1] if t < TOTAL else SEGS[-1]
    sc = get_scene(seg['i'])
    tl = t - seg['start']
    dur = seg['end'] - seg['start']
    img = sc.frame(tl)
    # ---- camera: push-in, handheld shake, punch-zoom on the last word of the line
    tw = seg['vo_end'] - 0.38
    punch = 0.045 * ease((t - tw) / 0.16)
    z = 1.04 + sc.push * (tl / dur) ** 0.9 + punch
    ph = seg['i'] * 1.7
    a = sc.shake
    dx = a * (3.0 * math.sin(2 * math.pi * 0.43 * t + ph) + 1.7 * math.sin(2 * math.pi * 1.13 * t + 2 * ph) + 0.6 * math.sin(2 * math.pi * 3.1 * t))
    dy = a * (2.4 * math.sin(2 * math.pi * 0.37 * t + 1 + ph) + 1.4 * math.sin(2 * math.pi * 0.97 * t + 3) + 0.5 * math.sin(2 * math.pi * 2.7 * t + ph))
    th = math.radians(a * (0.18 * math.sin(2 * math.pi * 0.29 * t + ph) + 0.06 * math.sin(2 * math.pi * 0.83 * t)))
    if seg['i'] == 2:                       # walking out of the door: footstep bob
        dy += 7 * abs(math.sin(math.pi * tl * 1.8)) - 3.5
    s = SS / z
    A_, Bb = s * math.cos(th), -s * math.sin(th)
    D_, E_ = s * math.sin(th), s * math.cos(th)
    c = RW / 2 + dx * SS - (A_ * W / 2 + Bb * H / 2)
    f = RH / 2 + dy * SS - (D_ * W / 2 + E_ * H / 2)
    src = Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8))
    out = np.asarray(src.transform((W, H), Image.AFFINE, (A_, Bb, c, D_, E_, f), Image.BICUBIC), np.float32) / 255
    # ---- drifting fog
    vx, vy = sc.fog_speed
    fa = sample_fog(_state['fogA'], 60 + vx * t * 0.6, 80 + vy * t * 0.6)
    fb = sample_fog(_state['fogB'], 120 - vx * t * 1.1, 60 + vy * t * 0.4 + 6 * math.sin(t * 0.3))
    fog = 0.25 + 0.75 * fa * 0.65 + 0.75 * fb * 0.35
    prof = 1.0 + sc.fog_low * _state['yy']
    if sc.fog_band:
        yc, wd, ex = sc.fog_band
        prof = prof + ex / sc.fog_density * np.exp(-((_state['yy'] - yc) / wd) ** 2) * 0.5
    alpha = np.clip(sc.fog_density * prof * fog * 1.6, 0, 0.8)[..., None]
    out = out * (1 - alpha) + sc.fog_col * alpha
    # ---- grade: muted earthy colour, split-tone, gentle S-curve, lifted blacks
    lum = out @ np.array([0.299, 0.587, 0.114], np.float32)
    out = lum[..., None] + (out - lum[..., None]) * sc.sat
    out *= np.array([1.0 + sc.warmth, 1.0, 1.0 - sc.warmth], np.float32)
    sh = np.clip(1 - lum * 2.2, 0, 1)[..., None]
    out += sh * np.array([-0.006, 0.002, 0.012], np.float32)
    hl = np.clip(lum * 1.6 - 0.6, 0, 1)[..., None]
    out += hl * np.array([0.02, 0.006, -0.02], np.float32)
    out = np.clip(out, 0, 1.2)
    out = out ** 0.94
    out = 0.70 * out + 0.30 * out * out * (3 - 2 * np.clip(out, 0, 1))
    out = 0.016 + out * 0.975
    out *= _state['vig']
    out *= 1 + 0.012 * math.sin(t * 21.0) + 0.008 * math.sin(t * 47.0)
    # ---- eyelids opening at the start (scene 1)
    if seg['i'] == 0:
        o = (0.25 * ease(tl / 0.30) - 0.17 * ease((tl - 0.38) / 0.18) + 0.92 * ease((tl - 0.62) / 0.75))
        xs, ys = _state['xs'], _state['ys']
        half = o * H * 0.62 * np.sqrt(np.clip(1 - ((xs - W / 2) / (W * 1.05)) ** 2, 0, 1))
        lid = np.clip((half - np.abs(ys - H / 2)) / (60 + 200 * (1 - o)), 0, 1)
        out *= lid[..., None]
    # ---- grain
    g = np.random.default_rng(n + 7).standard_normal((H // 2, W // 2), dtype=np.float32)
    g = np.repeat(np.repeat(g, 2, 0), 2, 1) * 0.6 + np.random.default_rng(n + 9001).standard_normal((H, W), dtype=np.float32) * 0.4
    out += (g * (0.022 + 0.02 * (1 - np.clip(lum, 0, 1))))[..., None]
    frame = Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))
    if t >= seg['start'] + 0.02:
        draw_caption(frame, seg, t)
    return frame.tobytes()


def main():
    setup()
    if len(sys.argv) > 1:
        for a in sys.argv[1:]:
            t = float(a)
            n = int(round(t * FPS))
            im = Image.frombytes('RGB', (W, H), render_frame(n))
            im.save(f'{B}/still_{a}.png')
            print('still', a)
        return
    print('segments:')
    for s in SEGS:
        print(f"  {s['i'] + 1}: {s['start']:.2f}-{s['end']:.2f}  vo {s['vo']:.2f}-{s['vo_end']:.2f}  {CAPTIONS[s['i']]}")
    print('black', BLACK_SPAN)
    json.dump(dict(segs=SEGS, black=BLACK_SPAN), open(f'{B}/timeline.json', 'w'), indent=1)
    t0 = time.time()
    for i in range(7):
        get_scene(i)
    print('scenes built', round(time.time() - t0, 1), 's')
    nfr = int(TOTAL * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
                           '-profile:v', 'high', '-movflags', '+faststart', f'{B}/video.mp4'], stdin=subprocess.PIPE)
    with mp.get_context('fork').Pool(4) as pool:
        for k, buf in enumerate(pool.imap(render_frame, range(nfr), chunksize=3)):
            ff.stdin.write(buf)
            if k % 60 == 0:
                print(f'frame {k}/{nfr}  {time.time() - t0:.0f}s', flush=True)
    ff.stdin.close()
    ff.wait()
    print('done', round(time.time() - t0, 1), 's')


if __name__ == '__main__':
    main()
