"""Sound effects + final soundtrack: voice on top, music ducked low under it, SFX on the cues.

Every effect is synthesized here and placed so that its loudest moment lands on its cue from
ict/data/cues.json (the cut, the wick hitting the line, the structure break, the target hit...).
The music stems are ducked by the voice envelope (sidechain), then the sum is normalized to
-14 LUFS / -1 dBTP with ffmpeg's two-pass loudnorm.

Usage: python3 ict/audio/mix.py        (writes ict/out/audio/sfx.wav and ict/out/audio/soundtrack.wav)
"""
import json
import pathlib
import subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'out' / 'audio'
SR = 48000
C = json.loads((ROOT / 'data' / 'cues.json').read_text())
DUR = C['end']
N = int(DUR * SR)
rng = np.random.default_rng(2024)

MUSIC_GAIN_DB = {'drums': -15.0, 'bass': -14.0, 'keys': -15.0}
DUCK_DB = {'drums': -6.0, 'bass': -7.0, 'keys': -8.0}
SFX_GAIN = 0.6


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)


def sweep_bp(x, f0, f1, f2=None, q=0.5):
    """Band-pass whose centre moves f0 -> f1 (-> f2), block by block."""
    out = np.zeros_like(x)
    n, blk = len(x), 512
    for i in range(0, n, blk):
        u = i / n
        if f2 is None:
            fc = f0 * (f1 / f0) ** u
        else:
            fc = f0 * (f1 / f0) ** (2 * u) if u < 0.5 else f1 * (f2 / f1) ** (2 * u - 1)
        seg = x[max(0, i - 384):i + blk]
        y = bp(seg, fc * (1 - q / 2), min(fc * (1 + q), 20000))
        out[i:i + blk] = y[-len(x[i:i + blk]):]
    return out


def tone(f, d, tau, att=0.002, f_end=None):
    t = tt(d)
    ff = f if f_end is None else f * (f_end / f) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(np.ones_like(t) * ff) / SR) * np.exp(-t / tau) * np.clip(t / att, 0, 1)


def pan2(x, pan):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.vstack([x * l, x * r]) * np.sqrt(2)


def ir(rt60=1.6, d=2.2):
    t = tt(d)
    dec = np.exp(-6.9 * t / rt60)
    a = np.vstack([lp(rng.standard_normal(len(t)), 5000) * dec, lp(rng.standard_normal(len(t)), 5000) * dec])
    return a / np.sqrt((a ** 2).sum(axis=1, keepdims=True))


IR = ir()


class Track:
    def __init__(self):
        self.x = np.zeros((2, N))
        self.send = np.zeros((2, N))

    def put(self, t_peak, sig, gain_db, pan=0.0, rev=0.0, peak_at=None):
        """Place `sig` so that its peak (or `peak_at` seconds into it) lands on t_peak."""
        st = sig if sig.ndim == 2 else pan2(sig, pan)
        if peak_at is None:
            env = np.abs(st).max(axis=0)
            peak_at = np.argmax(env) / SR
        s = int(round((t_peak - peak_at) * SR))
        g = 10 ** (gain_db / 20) / (np.abs(st).max() + 1e-9)
        a, b = max(s, 0), min(s + st.shape[1], N)
        if b <= a:
            return
        self.x[:, a:b] += g * st[:, a - s:b - s]
        if rev:
            self.send[:, a:b] += rev * g * st[:, a - s:b - s]

    def render(self):
        wet = np.vstack([fftconvolve(self.send[0], IR[0])[:N], fftconvolve(self.send[1], IR[1])[:N]])
        return self.x + 0.5 * wet


# ------------------------------------------------------------------ effects
def boom(d=1.8):
    t = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 50 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.6)
    crack = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.05)
    return np.tanh(1.8 * (sub + 0.6 * crack))


def impact(d=1.6, bright=1.0):
    t = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.45)
    body = bp(rng.standard_normal(len(t)), 120, 1800) * np.exp(-t / 0.09)
    crack = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.025) * bright
    return np.tanh(1.6 * (sub + 0.7 * body + 0.5 * crack))


def whoosh(d=0.7, f0=300, f1=3500, f2=700, rise=0.65):
    t = tt(d)
    x = sweep_bp(rng.standard_normal(len(t)), f0, f1, f2, q=0.9)
    u = t / d
    env = np.where(u < rise, (u / rise) ** 2.2, np.exp(-(u - rise) / 0.12))
    st = np.vstack([x * env, np.roll(x, 37) * env])
    # pan sweep left -> right through the peak
    p = np.clip((u - rise) * 3, -1, 1)
    st[0] *= np.sqrt(np.clip(0.5 - p / 2, 0, 1)) * np.sqrt(2)
    st[1] *= np.sqrt(np.clip(0.5 + p / 2, 0, 1)) * np.sqrt(2)
    return st, rise * d


def swish(d=0.32, up=True):
    t = tt(d)
    x = sweep_bp(rng.standard_normal(len(t)), 1200 if up else 6000, 6000 if up else 1200, q=0.8)
    u = t / d
    return x * np.sin(np.pi * u) ** 2


def shimmer(d=1.2, base=1396.9):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * base * r * t + rng.random() * 6) for r in (1, 1.5, 2, 3, 4.02))
    x *= (1 + 0.4 * np.sin(2 * np.pi * 9 * t)) / 5
    air = hp(rng.standard_normal(len(t)), 7000) * 0.35
    env = np.clip(t / 0.015, 0, 1) * np.exp(-t / 0.35)
    return (x + air) * env


def flash(d=1.0):
    t = tt(d)
    pre = hp(rng.standard_normal(len(t)), 4000) * np.clip(t / 0.18, 0, 1) ** 3 * (t < 0.18)
    post = shimmer(d - 0.18, 2093.0)
    return np.concatenate([pre[:int(0.18 * SR)], post]), 0.18


def clunk(pitch=1.0):
    t = tt(0.5)
    thump = np.sin(2 * np.pi * 85 * pitch * t) * np.exp(-t / 0.06)
    ring = sum(np.sin(2 * np.pi * f * pitch * t) * np.exp(-t / tau) for f, tau in ((452, .22), (1130, .12), (1873, .08), (2650, .05)))
    click = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004)
    return np.tanh(1.5 * (thump + 0.25 * ring + 0.6 * click))


def ratchet(d):
    t = tt(d)
    x = np.zeros(len(t))
    k = 0
    p = 0.0
    while p < d - 0.02:
        i = int(p * SR)
        c = bp(rng.standard_normal(int(0.012 * SR)), 2500 + 40 * k, 7000) * np.exp(-np.arange(int(0.012 * SR)) / SR / 0.002)
        x[i:i + len(c)] += c[:len(x) - i]
        k += 1
        p += 0.075 * (0.97 ** k)
    return x


def rumble(d=2.4):
    t = tt(d)
    brown = np.cumsum(rng.standard_normal(len(t)))
    brown = hp(brown - np.convolve(brown, np.ones(4800) / 4800, 'same'), 25)
    x = lp(brown, 140)
    env = np.clip(t / 0.5, 0, 1) * np.exp(-np.maximum(t - 0.6, 0) / 0.7)
    return x * env


def hiss(d=1.6):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 3000) * np.clip(t / 0.04, 0, 1) * np.exp(-t / 0.45)


def pop(f=520):
    return tone(f, 0.12, 0.035, f_end=f * 2.2) + 0.25 * bp(rng.standard_normal(int(0.12 * SR)), 2000, 7000) * np.exp(-tt(0.12) / 0.006)


def blip(f=1760, d=0.18):
    return tone(f, d, 0.05) + 0.5 * tone(f * 2, d, 0.03)


def crackle(d=0.35):
    t = tt(d)
    x = np.zeros(len(t))
    for _ in range(26):
        i = int(rng.random() ** 1.6 * (len(t) - 200))
        a = rng.uniform(0.3, 1.0)
        n = int(rng.uniform(0.0008, 0.003) * SR)
        x[i:i + n] += a * hp(rng.standard_normal(n), 3000)
    burst = bp(rng.standard_normal(len(t)), 900, 5000) * np.exp(-t / 0.04)
    return x * np.exp(-t / 0.15) + 0.6 * burst


def riser(d):
    t = tt(d)
    u = t / d
    x = sweep_bp(rng.standard_normal(len(t)), 300, 8000, q=0.7)
    tone_f = 220 * 2 ** (3 * u)
    sw = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(tone_f * 1.5) / SR)
    return (x + 0.25 * sw) * u ** 2.5


def ding():
    t = tt(2.2)
    f = 1568.0
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / tau)
            for r, a, tau in ((1, 1, 0.9), (2.0, 0.45, 0.5), (2.76, 0.35, 0.35), (5.4, 0.15, 0.15)))
    x += 0.5 * np.sin(2 * np.pi * f / 2 * t) * np.exp(-t / 0.6)
    return x * np.clip(t / 0.001, 0, 1)


def sparkle(d=1.2):
    t = tt(d)
    x = np.zeros(len(t))
    for _ in range(18):
        f = rng.choice([2093, 2349, 2637, 3136, 3520, 4186])
        s = tone(f, 0.15, 0.04) * rng.uniform(0.3, 1)
        i = int(rng.random() * (len(t) - len(s)))
        x[i:i + len(s)] += s
    return x * np.exp(-t / 0.6)


def key_click():
    d = 0.05
    t = tt(d)
    x = bp(rng.standard_normal(len(t)), 1800, 6500) * np.exp(-t / 0.004)
    x += 0.5 * np.sin(2 * np.pi * rng.uniform(140, 210) * t) * np.exp(-t / 0.012)
    return x


def build_sfx():
    tr = Track()
    sc = C['scenes']
    # S1: hook boom, typing
    tr.put(0.03, boom(), -3, rev=0.3)
    tr.put(0.02, hp(rng.standard_normal(int(0.4 * SR)), 2000) * np.exp(-tt(0.4) / 0.08), -18)
    t = 0.35
    while t < sc[0][1] - 0.3:
        burst = rng.integers(3, 7)
        for _ in range(burst):
            tr.put(t, key_click(), rng.uniform(-30, -24), pan=rng.uniform(-0.3, 0.3))
            t += rng.uniform(0.06, 0.13)
        t += rng.uniform(0.2, 0.45)
    # cuts: whoosh into every scene, light swishes on the shot changes inside scenes
    for i, (s, e) in enumerate(sc[1:], start=2):
        w, pk = whoosh(0.75 if i in (2, 7, 10) else 0.55)
        tr.put(s, w, -11 if i in (2, 7, 10) else -14, peak_at=pk, rev=0.15)
    for k in ('s1_cut', 's2_cut', 's3_cut1', 's3_cut1b', 's3_cut2', 's6_cut1', 's6_cut1b', 's6_cut2', 's7_cut', 's8_cut', 's8_cut2', 's10_cut'):
        tr.put(C[k], swish(0.3), -24, pan=rng.uniform(-0.4, 0.4))
    # light flash on the three steps
    for i in (3, 4, 5):
        f, pk = flash()
        tr.put(sc[i][0], f, -16, peak_at=pk, rev=0.4)
    tr.put(sc[1][0] + 0.02, impact(1.2, 0.5), -12, rev=0.2)            # zoom-through lands in the vault
    # S2 vault
    for i, tb in enumerate(C['vault_bolts']):
        tr.put(tb, clunk(1.0 + 0.04 * i), -12, pan=-0.3 + 0.2 * i, rev=0.35)
    a, b = C['vault_spin']
    tr.put(a, ratchet(b - a), -22, peak_at=0.0, pan=0.1)
    tr.put(C['vault_unlock'], clunk(0.7), -8, rev=0.5)
    tr.put(C['vault_unlock'] + 0.25, rumble(), -14, peak_at=0.6)
    tr.put(C['vault_unlock'] + 0.15, hiss(), -19, peak_at=0.04, pan=0.2)
    tr.put(C['s2_cut'] + 0.2, shimmer(1.6, 1046.5), -18, peak_at=0.02, rev=0.5)
    # S3 liquidity: line drawing, stop icons popping, label
    a, b = C['ssl_draw']
    tr.put(a, swish(b - a + 0.1, up=True), -20, peak_at=(b - a) / 2)
    for i, tp in enumerate(C['stops_pop']):
        tr.put(tp, pop(480 + 30 * i), -20, pan=-0.5 + i / 6)
    tr.put(C['ssl_label'], blip(1318.5), -20)
    # S4 sweep: impact on the line, crackles on every stop, label, snap back
    tr.put(C['sweep_cross'], impact(), -3, rev=0.35)
    for i, te in enumerate(C['stops_explode']):
        tr.put(te, crackle(), -13, pan=-0.6 + 0.2 * i, rev=0.2)
    tr.put(C['sweep_label'], blip(1760), -18)
    tr.put(C['sweep_snap'][0] + 0.12, swish(0.35, up=True), -14)
    # S5 shift: riser into the break, impact + flash on it
    a, b = C['riser']
    tr.put(b, riser(b - a), -13, peak_at=b - a - 0.01)
    a, b = C['mss_line']
    tr.put(a + 0.15, swish(0.4), -21)
    tr.put(C['mss_break'], impact(1.4, 1.2), -5, rev=0.35)
    f, pk = flash()
    tr.put(C['mss_break'], f, -14, peak_at=pk, rev=0.3)
    # S6 gap: numbers, levels, box
    for k, f in (('num1', 1046.5), ('num2', 1318.5), ('num3', 1568.0)):
        tr.put(C[k], blip(f), -19)
    tr.put(C['high1'], blip(2093, 0.25), -24, pan=-0.2)
    tr.put(C['low3'], blip(2093, 0.25), -24, pan=0.2)
    tr.put(C['fvg_box'] + 0.1, shimmer(1.6, 1396.9), -15, peak_at=0.05, rev=0.5)
    tr.put(C['fvg_label'], blip(1760), -20)
    # S7 entry
    tr.put(C['hourglass'], shimmer(0.9, 1760), -22, peak_at=0.03, rev=0.4)
    a, b = C['c15']
    tr.put(a, swish(b - a, up=False), -19, peak_at=(b - a) / 2)
    tr.put(C['fvg_contact'], impact(1.0, 0.3), -13, rev=0.3)
    tr.put(C['fvg_contact'] + 0.02, shimmer(1.2, 1396.9), -17, peak_at=0.02, rev=0.4)
    tr.put(C['entry'], blip(1568), -17)
    tr.put(C['entry'] + 0.09, blip(2093), -19)
    # S8 risk & target
    tr.put(C['sl_line'] + 0.1, swish(0.35), -16, pan=-0.3)
    tr.put(C['sl_line'] + 0.12, tone(196, 0.4, 0.15), -20)
    tr.put(C['tp_line'] + 0.1, swish(0.35), -16, pan=0.3)
    tr.put(C['tp_line'] + 0.12, tone(784, 0.4, 0.15), -21)
    for i in range(4):
        tr.put(C['bsl_icons'] + 0.08 * i, pop(700 + 50 * i), -22, pan=-0.3 + 0.2 * i)
    # S9 payoff: rally whoosh, ding + sparkle on the target
    a, b = C['rally']
    tr.put(b, riser(b - a), -14, peak_at=b - a - 0.01)
    tr.put(C['tp_hit'], ding(), -6, rev=0.5)
    tr.put(C['tp_hit'], impact(1.2, 0.6), -9)
    tr.put(C['tp_hit'] + 0.25, sparkle(), -16, peak_at=0.3, rev=0.4)
    for i, tr_ in enumerate(C['recap']):
        tr.put(tr_, blip(1318.5 * 2 ** (i * 4 / 12)), -24)
    # S10 outro: one hit per icon, rising
    for i, ti in enumerate(C['icons']):
        tr.put(ti, impact(0.8, 0.4), -13)
        tr.put(ti, blip(1046.5 * 2 ** (i * 5 / 12), 0.3), -17, rev=0.4)
    return tr.render()


def envelope(x, att=0.01, rel=0.25):
    """Voice level for the sidechain: 20 ms RMS, then an attack/release follower at 1 kHz."""
    win, hop = int(0.02 * SR), SR // 1000
    rms = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, 'same'))[::hop]
    ka, kr = np.exp(-hop / (att * SR)), np.exp(-hop / (rel * SR))
    out, v = np.zeros_like(rms), 0.0
    for i, target in enumerate(rms):
        v = target + (v - target) * (ka if target > v else kr)
        out[i] = v
    return np.repeat(out, hop)[:len(x)]


def limit(x, ceiling_db=-1.3, look=0.003, rel=0.06):
    """Lookahead peak limiter: gain = running min of ceiling/|x|, smoothed so it never overshoots."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    c = 10 ** (ceiling_db / 20)
    pk = np.abs(x).max(axis=0)
    g = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    la, lr = int(look * SR), int(rel * SR)
    g = minimum_filter1d(g, 2 * la + 1)
    g = uniform_filter1d(g, la)                       # attack ramp inside the lookahead window
    g = minimum_filter1d(g, 2 * lr + 1)
    g = uniform_filter1d(g, 2 * lr + 1)               # slow release
    return x * g, 20 * np.log10(g.min())


def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af',
                        'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    return json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])


def loudnorm(src, dst, target=-14.0, tp=-1.0):
    ff = ['ffmpeg', '-hide_banner', '-nostats', '-y', '-i', str(src)]
    r = subprocess.run(ff + ['-af', f'loudnorm=I={target}:TP={tp}:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    js = r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1]
    m = json.loads(js)
    af = (f"loudnorm=I={target}:TP={tp}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(ff + ['-af', af, '-ar', str(SR), '-c:a', 'pcm_s24le', str(dst)], check=True, capture_output=True)
    return m


def main():
    vo, sr = sf.read(OUT / 'vo.wav')
    assert sr == SR
    vo = np.vstack([vo, vo])[:, :N]
    env = envelope(vo[0])
    env_n = np.clip(env / (np.percentile(env[env > 1e-3], 90) + 1e-9), 0, 1)
    music = np.zeros((2, N))
    for stem in ('drums', 'bass', 'keys'):
        x, _ = sf.read(OUT / f'music_{stem}.wav')
        x = x.T[:, :N]
        duck = 10 ** ((MUSIC_GAIN_DB[stem] + DUCK_DB[stem] * env_n) / 20)
        music += x * duck
    sfx = build_sfx()
    sf.write(OUT / 'sfx.wav', (sfx / max(1, np.abs(sfx).max())).T.astype(np.float32), SR, subtype='FLOAT')
    mixed = vo + music + SFX_GAIN * sfx
    tmp = OUT / 'premaster.wav'
    sf.write(tmp, mixed.T.astype(np.float32), SR, subtype='FLOAT')
    m0 = measure(tmp)
    mixed *= 10 ** ((-14.0 - float(m0['input_i'])) / 20)
    mixed, gr = limit(mixed)
    sf.write(tmp, mixed.T.astype(np.float32), SR, subtype='FLOAT')
    m = loudnorm(tmp, OUT / 'soundtrack.wav')
    tmp.unlink()
    print(f"premix {m0['input_i']} LUFS; limiter max reduction {gr:.1f} dB; before final pass {m['input_i']} LUFS, "
          f"TP {m['input_tp']} -> -14 LUFS / -1 dBTP (linear)")
    for name, sig in (('voice', vo), ('music (ducked)', music), ('sfx', SFX_GAIN * sfx)):
        r = np.sqrt((sig ** 2).mean())
        print(f'{name:15s} rms {20 * np.log10(r + 1e-12):6.1f} dBFS (pre-master)')
    out = measure(OUT / 'soundtrack.wav')
    print(f"final: {out['input_i']} LUFS, TP {out['input_tp']} dBTP, LRA {out['input_lra']}")
    print('wrote', OUT / 'soundtrack.wav')


if __name__ == '__main__':
    main()
