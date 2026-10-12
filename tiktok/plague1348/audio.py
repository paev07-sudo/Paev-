"""Original soundtrack, synthesised with numpy: dark medieval drone + slow drums building tension,
wind, distant bell, footsteps in mud, breath, cloth, hooves, a cough, knocks and a door creak.
Mixed under the voiceover (with ducking). -> build/soundtrack.wav (48 kHz stereo)"""
import json
import math
import os
import wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, 'build')
SR = 48000
TOTAL = 30.0
N = int(SR * TOTAL)
rng = np.random.default_rng(1348)
T = np.arange(N) / SR

tl = json.load(open(f'{B}/timeline.json'))
SEGS, BLACK = tl['segs'], tl['black']
S = [s['start'] for s in SEGS]


def spec_filter(x, fn):
    """Filter by multiplying the spectrum with fn(freqs)."""
    n = len(x)
    X = np.fft.rfft(x, n)
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(X * fn(f), n).astype(np.float32)


def bp(x, lo, hi, q=1.0):
    return spec_filter(x, lambda f: 1 / (1 + ((f / hi) ** (4 * q))) * (1 - 1 / (1 + (f / lo) ** (4 * q))))


def lp(x, fc, order=2):
    return spec_filter(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) / d)).astype(np.float32)


def place(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[:N - i] * gain
    l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    buf[0, i:i + len(sig)] += sig * l * 1.414
    buf[1, i:i + len(sig)] += sig * r * 1.414


def reverb(x, secs=2.6, damp=3000, seed=0):
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    t = np.arange(n) / SR
    out = []
    for ch in range(2):
        ir = r.standard_normal(n).astype(np.float32) * np.exp(-t * 6.9 / secs)
        ir = lp(ir, damp)
        ir[:int(0.012 * SR)] = 0
        m = len(x[ch]) + n
        nf = 1 << (m - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x[ch], nf) * np.fft.rfft(ir, nf), nf)[:len(x[ch])]
        out.append(y / np.sqrt(np.sum(ir ** 2)) * 0.25)
    return np.array(out, np.float32)


def seg_mask(i0, i1, fade=0.05):
    """1 inside [start of segment i0, end of segment i1), with short fades."""
    a, b = SEGS[i0]['start'], SEGS[i1]['end']
    return (np.clip((T - a) / fade + 1, 0, 1) * np.clip((b - T) / fade, 0, 1)).astype(np.float32)


# ------------------------------------------------------------------------------- music
music = np.zeros((2, N), np.float32)
cut = BLACK[0]
tension = np.clip((T - 7.0) / (cut - 7.0), 0, 1) ** 1.6       # builds until the cut to black
tension = np.where(T >= BLACK[1], 0.25, tension)

# drone: D minor fifths, detuned saws, lowpass opening with tension
def saw(f, detune, phase0=0.0):
    ph = np.cumsum(np.full(N, f * (1 + detune), np.float64)) / SR + phase0
    return (2 * (ph % 1.0) - 1).astype(np.float32)

drone = np.zeros(N, np.float32)
for f, g in [(36.71, 0.9), (73.42, 0.7), (110.0, 0.45), (146.83, 0.25)]:
    for d in (-0.004, 0.0, 0.0045):
        drone += g * saw(f, d, rng.random())
dark, bright = lp(drone, 260, 3), lp(drone, 900, 2)
drone = dark * (1 - tension) + bright * tension
drone *= 0.06 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * T) ** 2)
drone *= np.clip(T / 1.5, 0, 1)
for ch, ph in ((0, 0.0), (1, 0.6)):
    music[ch] += drone * (0.9 + 0.1 * np.sin(2 * np.pi * 0.07 * T + ph))

# bowed modal melody (D dorian), slow, from the village scene on
def bowed(f, dur, vib=5.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 0.006 * np.sin(2 * np.pi * vib * t) * np.clip(t / 0.6, 0, 1))
    ph = np.cumsum(fr) / SR
    x = sum((1 / k) * np.sin(2 * np.pi * k * ph + k) for k in range(1, 9)).astype(np.float32)
    e = np.clip(t / 0.5, 0, 1) * np.clip((dur - t) / 0.7, 0, 1)
    return lp(x * e.astype(np.float32), 1400)

D3, E3, F3, G3, A3, C3, A2, Bb2 = 146.83, 164.81, 174.61, 196.0, 220.0, 130.81, 110.0, 116.54
mel = [(S[2] + 0.3, D3, 1.8), (S[2] + 2.2, F3, 1.4), (S[2] + 3.6, E3, 1.6), (S[3] + 0.2, D3, 1.9), (S[3] + 2.2, C3, 1.8),
       (S[4] + 0.1, D3, 1.3), (S[4] + 1.5, F3, 1.0), (S[4] + 2.6, E3, 1.6), (S[5] + 0.1, Bb2, 2.0), (S[5] + 2.1, A2, 1.9)]
for t0, f, d in mel:
    s = bowed(f, d)
    place(music, s, t0, 0.035, -0.3)
    place(music, bowed(f * 1.5, d) * 0.5, t0 + 0.05, 0.02, 0.3)

# slow frame drum: sparse at first, heartbeat-like as it builds
def drum(f0=58, dec=0.55, n_s=0.9):
    n = int(n_s * SR)
    t = np.arange(n) / SR
    f = f0 + 45 * np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    x += 0.35 * lp(rng.standard_normal(n).astype(np.float32), 900) * np.exp(-t / 0.03)
    return x.astype(np.float32)

hits = []
t = S[1] + 0.05
while t < cut - 0.1:
    k = (t - S[1]) / (cut - S[1])
    period = 2.0 - 1.2 * k
    hits.append((t, 0.25 + 0.4 * k))
    if k > 0.45:
        hits.append((t + 0.24, 0.15 + 0.25 * k))           # lub-dub
    t += period
for t0, g in hits:
    place(music, drum(), t0, g * 0.8)
# hits that land on the hard cuts
for t0, g in [(S[3], 0.9), (S[6], 1.0)]:
    place(music, drum(46, 0.9, 1.6), t0, g)
    place(music, lp(rng.standard_normal(int(1.2 * SR)).astype(np.float32), 200) * env_ad(int(1.2 * SR), 0.005, 0.4), t0, 0.5)

# riser into the cut to black
n = int((cut - S[5]) * SR)
tt = np.arange(n) / SR
rise = bp(rng.standard_normal(n).astype(np.float32), 300, 3000) * (tt / tt[-1]) ** 2.2 * 0.10
rise += 0.05 * np.sin(2 * np.pi * np.cumsum(220 + 300 * (tt / tt[-1]) ** 2) / SR).astype(np.float32) * (tt / tt[-1]) ** 2
place(music, rise.astype(np.float32), S[5])
# hard stop at the black, then only a low drone under the last scene
music *= np.where((T >= cut) & (T < BLACK[1]), 0.0, 1.0).astype(np.float32)
low = lp(sum(saw(f, d) for f in (36.71, 55.0) for d in (-0.003, 0.003)), 160, 3) * 0.08
music[:, T >= BLACK[1]] = 0
music += low * (T >= BLACK[1]) * np.clip((T - BLACK[1]) / 1.0, 0, 1)
music = music + reverb(music, 3.0, 2500, 1) * 0.8

# ------------------------------------------------------------------------------- sfx
sfx = np.zeros((2, N), np.float32)
# wind: indoors muffled, outdoors open
wn = rng.standard_normal((2, N)).astype(np.float32)
lfo = 0.55 + 0.45 * np.sin(2 * np.pi * 0.13 * T + 1) * np.sin(2 * np.pi * 0.051 * T)
wind_out = np.array([bp(wn[c], 180, 1400) for c in range(2)]) * lfo
wind_in = np.array([lp(wn[c], 300, 3) for c in range(2)]) * lfo
outdoor = np.maximum.reduce([seg_mask(2, 2), seg_mask(3, 3), seg_mask(4, 4), seg_mask(5, 5)])
indoor = 1 - outdoor
indoor[(T >= BLACK[0]) & (T < BLACK[1])] = 0
sfx += wind_out * outdoor * 0.05 + wind_in * indoor * 0.06

# church bell (inharmonic partials), distant
def bell(f0=262.0, dur=5.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for r, a, d in [(0.5, 0.6, 3.5), (1.0, 0.8, 2.6), (1.183, 0.5, 2.0), (1.506, 0.35, 1.6), (2.0, 0.45, 1.4),
                    (2.514, 0.25, 0.9), (2.662, 0.2, 0.8), (3.011, 0.15, 0.6), (4.166, 0.08, 0.4)]:
        x += a * np.sin(2 * np.pi * f0 * r * t + rng.random() * 6) * np.exp(-t / d)
    x *= np.clip(t / 0.004, 0, 1)
    return lp(x.astype(np.float32), 2200)
b = bell()
place(sfx, b, S[0] + 1.1, 0.025, 0.4)
place(sfx, b, S[2] + 0.4, 0.07, 0.35)
place(sfx, b, S[2] + 2.9, 0.05, 0.35)

# breath (scene 1, synced with the visible puffs)
for k in range(2):
    n = int(1.3 * SR)
    tt = np.arange(n) / SR
    e = np.clip(tt / 0.25, 0, 1) * np.exp(-np.clip(tt - 0.25, 0, None) / 0.35)
    place(sfx, bp(rng.standard_normal(n).astype(np.float32), 250, 1800) * e.astype(np.float32), S[0] + 0.35 + 2.4 * k, 0.10)

# cloth rustle (scene 2)
n = int(1.6 * SR)
tt = np.arange(n) / SR
cl = bp(rng.standard_normal(n).astype(np.float32), 1200, 7000) * (np.sin(np.pi * np.clip(tt / 1.5, 0, 1)) ** 2 * (0.6 + 0.4 * np.abs(np.sin(tt * 19)))).astype(np.float32)
place(sfx, cl, S[1] + 0.05, 0.08)

# footsteps in mud
def mudstep():
    n = int(0.35 * SR)
    a = bp(rng.standard_normal(n).astype(np.float32), 90, 700) * env_ad(n, 0.006, 0.07)
    s = rng.standard_normal(n).astype(np.float32)
    tt = np.arange(n) / SR
    suck = bp(s, 250, 1200) * (np.exp(-((tt - 0.09) / 0.03) ** 2)).astype(np.float32) * 0.5
    return a + suck
for k in range(8):
    place(sfx, mudstep(), S[2] + 0.28 + 0.555 * k, 0.32 * (1 - k / 10), (-0.15 if k % 2 else 0.15))
# the doctor's steps, getting closer
d6 = SEGS[5]['end'] - S[5]
k = 0
while 0.555 * k + 0.1 < d6:
    t0 = 0.555 * k + 0.1
    z = 12.5 - 9.8 * (1 - (1 - min(t0 / 4.4, 1)) ** 1.25)
    place(sfx, mudstep(), S[5] + t0, 0.9 / z, 0.05 * (1 if k % 2 else -1))
    k += 1

# hooves (scene 4), distant
for k in range(14):
    t0 = S[3] + 0.15 + 0.27 * k + (0.07 if k % 2 else 0)
    n = int(0.08 * SR)
    place(sfx, bp(rng.standard_normal(n).astype(np.float32), 700, 2600) * env_ad(n, 0.001, 0.012), t0, 0.03 + 0.003 * k, 0.1)
# a distant cough from the cart
for t0 in (S[3] + 2.75, S[3] + 3.05):
    n = int(0.22 * SR)
    c = bp(rng.standard_normal(n).astype(np.float32), 300, 2400) * env_ad(n, 0.01, 0.06)
    place(sfx, lp(c, 1500), t0, 0.11, 0.15)

# three heavy knocks on the door, then the creak as it opens
def knock():
    n = int(0.4 * SR)
    tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in [(105, 1.0, 0.10), (190, 0.6, 0.07), (340, 0.4, 0.05), (720, 0.2, 0.02)])
    x += 0.4 * lp(rng.standard_normal(n), 2500) * np.exp(-tt / 0.006)
    return x.astype(np.float32)
for k, t0 in enumerate((0.15, 0.55, 0.95)):
    place(sfx, knock(), S[6] + t0, 0.55, 0.0)

def creak(dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    t = 0.0
    while t < dur - 0.01:
        rate = 30 + 70 * (t / dur) + 25 * math.sin(t * 9)
        i = int(t * SR)
        x[i] += rng.uniform(0.6, 1.0)
        t += 1 / rate * rng.uniform(0.85, 1.15)
    res = spec_filter(x, lambda f: sum(g / (1 + ((f - fc) / bw) ** 2) for fc, g, bw in [(520, 1.0, 40), (980, 0.8, 50), (1650, 0.6, 70), (2600, 0.3, 90)]))
    e = np.clip(tt / 0.08, 0, 1) * np.clip((dur - tt) / 0.2, 0, 1)
    return (res * e / (np.abs(res).max() + 1e-6)).astype(np.float32)
place(sfx, creak(1.25), S[6] + 3.65, 0.22, -0.2)
sfx = sfx + reverb(sfx, 1.4, 4000, 2) * 0.5

# ------------------------------------------------------------------------------- voiceover + ducking
vo = np.zeros((2, N), np.float32)
active = np.zeros(N, np.float32)
for i, s in enumerate(SEGS):
    with wave.open(f'{B}/vo_{i}.wav') as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    x = x / (np.abs(x).max() + 1e-6) * 0.7
    place(vo, x, s['vo'], 1.0)
    i0 = int(s['vo'] * SR)
    active[i0:i0 + len(x)] = 1
duck = lp(active, 6, 1)
duck = 1 - 0.6 * np.clip(duck, 0, 1)
mix = vo + music * duck * 0.55 + sfx * (0.7 + 0.3 * duck)
mix[:, (T >= BLACK[0] + 0.02) & (T < BLACK[1])] *= 0.15
mix /= np.abs(mix).max() / 0.9
out = (np.clip(mix.T, -1, 1) * 32767).astype(np.int16)
with wave.open(f'{B}/soundtrack.wav', 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print('soundtrack written', out.shape)

if os.environ.get('STEMS'):
    def db(x, m):
        return round(10 * np.log10((x[:, m] ** 2).mean() + 1e-12), 1)
    a = active > 0
    print('during VO   vo', db(vo, a), ' music', db(music * duck * 0.55, a), ' sfx', db(sfx * (0.6 + 0.4 * duck), a))
    print('outside VO  music', db(music * duck * 0.55, ~a), ' sfx', db(sfx * (0.6 + 0.4 * duck), ~a))
