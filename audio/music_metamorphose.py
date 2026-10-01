"""Original 40 s track for « Métamorphose » (120 BPM, 20 bars), synthesised with numpy/scipy.

Bars 1-8   origins: A minor groove (Am9 · Fmaj9 · Cmaj9 · G6/9)
Bars 9-10  build: snare roll 8ths → 16ths → 32nds, noise riser, filter opening, silence before the drop
Bar  11    drop on the éclosion: impact, bigger bass, major progression (C · G · Am · F)
Bar  19    final impact and held C major chord, tail to 40 s
Usage: python3 audio/music_metamorphose.py out/metamorphose/music.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR, BPM = 48000, 120
BEAT = 60 / BPM
DUR = 80 * BEAT
N = int(round(DUR * SR))
rng = np.random.default_rng(23)


def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def tt(d): return np.arange(int(d * SR)) / SR


class Bus:
    def __init__(self): self.x = np.zeros((2, N + 4 * SR))
    def add(self, t, sig, g=1.0, pan=0.0):
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2), np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
            sig = np.vstack([sig * l, sig * r])
        s = int(round(t * SR)); e = min(s + sig.shape[1], self.x.shape[1])
        if 0 <= s < self.x.shape[1]:
            self.x[:, s:e] += g * sig[:, :e - s]


# ------------------------------------------------------------------ instruments
def kick(punch=1.0):
    t = tt(.5); f = 44 + 90 * punch * np.exp(-t / .03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .28) * np.clip(t / .0015, 0, 1)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / .004) * .25
    return np.tanh(1.7 * (body + click)) / np.tanh(1.7)


def clap():
    t = tt(.35); n = bp(rng.standard_normal(len(t)), 900, 3200); e = np.zeros(len(t))
    for d in (0, .011, .022): e += np.where(t >= d, np.exp(-(t - d) / .006), 0)
    e += np.where(t >= .03, .55 * np.exp(-(t - .03) / .11), 0)
    return n * e / 3


def snare():
    t = tt(.25)
    n = bp(rng.standard_normal(len(t)), 1500, 7000) * np.exp(-t / .06)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / .04)
    return .7 * n + .5 * body


def hat(open_=False):
    t = tt(.3 if open_ else .06)
    n = lp(hp(rng.standard_normal(len(t)), 7000, 3), 13000); n /= n.std() + 1e-9
    return n * np.exp(-t / (.09 if open_ else .018)) * .25


def ep(notes, dur, bright=1.0):
    t = tt(dur); out = np.zeros((2, len(t)))
    for m in notes:
        for ch, det in ((0, .9993), (1, 1.0007)):
            f = midi(m) * det
            idx = (1.8 * bright) * np.exp(-t / .35) + .25
            car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
            tine = .18 * np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t / .05)
            amp = np.clip(t / .003, 0, 1) * (.65 * np.exp(-t / 1.4) + .35 * np.exp(-t / .3))
            out[ch] += (car + tine) * amp / len(notes)
    return out * np.clip((dur - t) / .08, 0, 1)


def bass(m, dur, drive=1.4):
    t = tt(dur); f = midi(m); saw = 2 * ((f * t) % 1) - 1
    body = .8 * np.sin(2 * np.pi * f * t) + .35 * lp(saw, 900)
    amp = np.clip(t / .004, 0, 1) * np.clip((dur - t) / .03, 0, 1) * (.7 + .3 * np.exp(-t / .12))
    return np.tanh(drive * body * amp)


def pluck(m, dur=.45):
    t = tt(dur); f = midi(m); y = np.zeros(len(t))
    for k in range(1, 9): y += np.sin(2 * np.pi * k * f * t) * np.exp(-t * (6 + 5 * k)) / k
    return y * np.clip(t / .002, 0, 1) * .5


def pad(notes, dur, cutoff=1400):
    t = tt(dur); out = np.zeros((2, len(t)))
    for m in notes:
        for ch in (0, 1):
            for det in (-.12, 0, .12):
                ff = midi(m) * 2 ** ((det + (.03 if ch else -.03)) / 12)
                out[ch] += 2 * ((ff * t + rng.uniform()) % 1) - 1
    out = np.vstack([lp(out[0], cutoff), lp(out[1], cutoff)]) / (len(notes) * 3)
    return out * np.clip(t / .35, 0, 1) * np.clip((dur - t) / .5, 0, 1)


def riser(dur):
    t = tt(dur); n = rng.standard_normal(len(t)); out = np.zeros(len(t))
    blk = 2048
    for i in range(0, len(t), blk):
        u = i / len(t); fc = 400 * (12000 / 400) ** (u ** 1.6)
        out[i:i + blk] = bp(n[max(0, i - 4096):i + blk], fc * .7, min(fc * 1.3, 20000))[-len(n[i:i + blk]):]
    tone = np.sin(2 * np.pi * np.cumsum(200 * 2 ** (3 * (t / dur) ** 1.5)) / SR) * .25
    return (out * .9 + tone) * (t / dur) ** 2


def impact():
    t = tt(2.5)
    boom = np.sin(2 * np.pi * np.cumsum(32 + 60 * np.exp(-t / .15)) / SR) * np.exp(-t / .9)
    crash = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / .7) * .35
    return np.tanh(1.5 * (boom + crash))


# ------------------------------------------------------------------ arrangement
A = [(45, [60, 64, 67, 71]), (41, [57, 60, 64, 67]), (48, [64, 67, 71, 74]), (43, [59, 62, 64, 69])]   # Am9 F C G
MAJ = [(48, [60, 64, 67, 74]), (43, [59, 62, 67, 69]), (45, [60, 64, 69, 71]), (41, [57, 60, 65, 69])] # C G Am F
BUILD = [(41, [57, 60, 64, 67]), (43, [59, 62, 65, 67])]                                                # F  G7
ARP = [0, 2, 1, 3, 2, 1, 3, 2]

dr, mu, ar, fx = Bus(), Bus(), Bus(), Bus()
K, KD, CL, SN, HC, HO = kick(), kick(1.25), clap(), snare(), hat(), hat(True)

for bar in range(20):
    t0 = bar * 4 * BEAT
    if bar < 8: root, ch = A[bar % 4]
    elif bar < 10: root, ch = BUILD[bar - 8]
    elif bar < 18: root, ch = MAJ[(bar - 10) % 4]
    else: root, ch = MAJ[0]
    drop = 10 <= bar < 18
    # drums
    if bar < 18 and bar not in (8, 9):
        for b in range(4):
            tb = t0 + b * BEAT
            dr.add(tb, KD if drop else K, .66 if drop else .6)
            if (bar >= 2 or b in (1, 3)) and b in (1, 3) and bar != 8: dr.add(tb, CL, .5)
            dr.add(tb + BEAT / 2, HO if (b == 3 and bar % 2) else HC, .3, pan=.25)
            for s in (1, 3): dr.add(tb + s * BEAT / 4, HC, .12 if not drop else .16, pan=-.3)
    if bar == 8:                                   # build 1: kick + snare 8ths
        for b in range(4): dr.add(t0 + b * BEAT, K, .6)
        for b in (1, 3): dr.add(t0 + b * BEAT, CL, .45)
        for k in range(8): dr.add(t0 + k * BEAT / 2, SN, .2 + .03 * k)
        for k in range(8): dr.add(t0 + k * BEAT / 2 + BEAT / 4, HC, .14)
    if bar == 9:                                   # build 2: 16ths then 32nds, silence on the last 8th
        for k in range(8): dr.add(t0 + k * BEAT / 4, SN, .45 + .03 * k)
        for k in range(12): dr.add(t0 + 2 * BEAT + k * BEAT / 8, SN, .65 + .025 * k)
    # bass
    if bar < 18:
        for b in range(4):
            tb = t0 + b * BEAT
            if bar == 9 and b >= 2: break
            if drop:
                mu.add(tb, bass(root - 12, BEAT * .4, 1.8), .26)
                mu.add(tb + BEAT / 2, bass(root, BEAT * .45, 1.8), .36)
            else:
                mu.add(tb + BEAT / 2, bass(root, BEAT * .45), .32)
    # chords
    if bar < 18:
        cut = 900 + (bar - 8) / 2 * 3000 if bar in (8, 9) else (2200 if drop else 1400)
        mu.add(t0, ep(ch, 4 * BEAT if bar != 9 else 2 * BEAT, 1.3 if drop else 1.0), .75)
        mu.add(t0, pad([n - 12 for n in ch] + [root + 12], 4 * BEAT + .3, cut), .42 if not drop else .5)
        if bar != 9:
            mu.add(t0 + 1.5 * BEAT, ep([n + 12 for n in ch[1:]], .4), .3, pan=.2)
            mu.add(t0 + 3.0 * BEAT, ep([n + 12 for n in ch[:3]], .4), .26, pan=-.2)
    if 2 <= bar < 18 and bar != 9:
        for s in range(16):
            note = ch[ARP[s % 8]] + 12 + (12 if s % 8 == 7 else 0)
            ar.add(t0 + s * BEAT / 4, pluck(note), (.34 if s % 4 else .42) * (1.15 if drop else 1), pan=(-.35 if s % 2 else .35))
    if bar == 18:                                  # final: impact + held C major
        fx.add(t0, impact(), .7)
        mu.add(t0, ep([60, 64, 67, 71, 74], 8 * BEAT, 1.2), .85)
        mu.add(t0, pad([48, 55, 60, 64, 67], 8 * BEAT, 1800), .55)
        mu.add(t0, bass(36, 4 * BEAT, 1.2), .3)

fx.add(8 * 4 * BEAT, riser(8 * BEAT - BEAT / 2), .75)      # bars 9-10
fx.add(10 * 4 * BEAT, impact(), .8)                        # the drop

tt_ = np.arange(dr.x.shape[1]) / SR
ph = tt_ % BEAT
pump = 1 - .55 * np.exp(-ph / .11) * np.clip(ph / .004, 0, 1)
quiet = ((tt_ >= 9 * 4 * BEAT) & (tt_ < 10 * 4 * BEAT)) | (tt_ >= 18 * 4 * BEAT)
mu.x *= np.where(quiet, 1, pump); ar.x *= np.where(quiet, 1, 1 - .3 * np.exp(-ph / .09))

d = int(round(.75 * BEAT * SR)); dl = np.zeros_like(ar.x); src = ar.x.copy()
for k in range(1, 6):
    dl[(k + 1) % 2, d * k:] += lp(src[k % 2, :-d * k] * (.38 ** k), 4200)
ar.x += dl

irn = int(2.2 * SR); ti = np.arange(irn) / SR
ir = np.vstack([lp(rng.standard_normal(irn), 5000), lp(rng.standard_normal(irn), 5000)]) * np.exp(-ti / .5)
ir[:, :int(.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(1, keepdims=True))
send = mu.x * .22 + ar.x * .35 + dr.x * .04 + fx.x * .25
wet = np.vstack([fftconvolve(send[c], ir[c])[:send.shape[1]] for c in (0, 1)]) * .35

mix = hp(dr.x + mu.x + ar.x + fx.x + wet, 28)
mix = np.tanh(1.1 * mix) / 1.1
mix = mix[:, :N]
fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2
mix *= fade
mix = mix / np.max(np.abs(mix)) * 10 ** (-1 / 20)
wavfile.write(sys.argv[1], SR, (mix.T * 32767).astype(np.int16))
print('wrote', N / SR, 's')
