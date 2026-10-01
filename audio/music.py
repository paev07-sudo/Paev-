"""Original 120 BPM loop for the Krisalis motion piece (40 s = 20 bars of 4/4).

Everything is synthesised with numpy/scipy, so the track is royalty-free by construction.
The song is rendered twice back to back and the second pass is kept, so reverb/delay
tails wrap around and the file loops seamlessly.

Usage: python3 audio/music.py out/music.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
BPM = 120
BEAT = 60 / BPM
BARS = 20
LOOP = BARS * 4 * BEAT                     # 40 s
N = int(round(LOOP * SR))
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


class Bus:
    """Stereo bus rendered over two loops (2N samples)."""
    def __init__(self):
        self.x = np.zeros((2, 2 * N))

    def add(self, t, sig, gain=1.0, pan=0.0):
        """Add mono or stereo `sig` starting at time t (s), wrapping inside the 2-loop buffer."""
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig * l * np.sqrt(2), sig * r * np.sqrt(2)])
        for rep in (0, 1):
            s = int(round((t + rep * LOOP) * SR))
            e = min(s + sig.shape[1], 2 * N)
            if s < 2 * N:
                self.x[:, s:e] += gain * sig[:, :e - s]


def env_exp(n, tau, attack=0.002):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1) if attack > 0 else 1.0
    return a * np.exp(-t / tau)


# ---------------------------------------------------------------- instruments
def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 44 + 88 * np.exp(-t / 0.028)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.26) * np.clip(t / 0.0015, 0, 1)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.25
    return np.tanh(1.6 * (body + click)) / np.tanh(1.6)


def clap():
    n = int(0.35 * SR); t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 3200)
    e = np.zeros(n)
    for d in (0.0, 0.011, 0.022):
        e += np.where(t >= d, np.exp(-(t - d) / 0.006), 0)
    e += np.where(t >= 0.03, 0.55 * np.exp(-(t - 0.03) / 0.11), 0)
    return noise * e / 3


def hat(open_=False):
    n = int((0.30 if open_ else 0.06) * SR); t = np.arange(n) / SR
    noise = lp(hp(rng.standard_normal(n), 7000, 3), 13000)
    noise /= noise.std() + 1e-9
    return noise * np.exp(-t / (0.09 if open_ else 0.018)) * 0.25


def ep(notes, dur):
    """FM electric piano chord, stereo with slight detune."""
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros((2, n))
    for i, m in enumerate(notes):
        f = midi(m)
        for ch, det in ((0, 0.9993), (1, 1.0007)):
            ff = f * det
            idx = 1.8 * np.exp(-t / 0.35) + 0.25
            car = np.sin(2 * np.pi * ff * t + idx * np.sin(2 * np.pi * ff * t))
            tine = 0.18 * np.sin(2 * np.pi * ff * 7.02 * t) * np.exp(-t / 0.05)
            amp = np.clip(t / 0.003, 0, 1) * (0.65 * np.exp(-t / 1.4) + 0.35 * np.exp(-t / 0.3))
            out[ch] += (car + tine) * amp / len(notes)
    rel = np.clip((dur - t) / 0.08, 0, 1)
    return out * rel


def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = midi(m)
    saw = 2 * ((f * t) % 1.0) - 1
    body = 0.8 * np.sin(2 * np.pi * f * t) + 0.35 * lp(saw, 900)
    amp = np.clip(t / 0.004, 0, 1) * np.clip((dur - t) / 0.03, 0, 1) * (0.7 + 0.3 * np.exp(-t / 0.12))
    return np.tanh(1.4 * body * amp)


def pluck(m, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = midi(m)
    y = np.zeros(n)
    for k in range(1, 9):
        y += np.sin(2 * np.pi * k * f * t) * np.exp(-t * (6 + 5 * k)) / k
    return y * np.clip(t / 0.002, 0, 1) * 0.5


def pad(notes, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        f = midi(m)
        for ch in (0, 1):
            for det in (-0.12, 0.0, 0.12):
                ff = f * 2 ** ((det + (0.03 if ch else -0.03)) / 12)
                ph = rng.uniform(0, 1)
                out[ch] += 2 * ((ff * t + ph) % 1.0) - 1
    out = np.vstack([lp(out[0], 1400), lp(out[1], 1400)]) / (len(notes) * 3)
    amp = np.clip(t / 0.35, 0, 1) * np.clip((dur - t) / 0.4, 0, 1)
    return out * amp


# ---------------------------------------------------------------- song
# One chord per bar, 4-bar cycle: Am9 - Fmaj9 - Cmaj9 - G6/9
CHORDS = [
    (45, [60, 64, 67, 71]),   # Am9   (A | C E G B)
    (41, [57, 60, 64, 67]),   # Fmaj9 (F | A C E G)
    (48, [64, 67, 71, 74]),   # Cmaj9 (C | E G B D)
    (43, [59, 62, 64, 69]),   # G6/9  (G | B D E A)
]
ARP = [0, 2, 1, 3, 2, 1, 3, 2]   # chord-tone order for the 16th arpeggio

drums, music, arp_bus = Bus(), Bus(), Bus()
K, CL = kick(), clap()
HC, HO = hat(False), hat(True)

for bar in range(BARS):
    t0 = bar * 4 * BEAT
    root, chord = CHORDS[bar % 4]
    full = 2 <= bar <= 17                        # bars 3..18 carry the arpeggio
    for b in range(4):
        tb = t0 + b * BEAT
        drums.add(tb, K, 0.62)
        if b in (1, 3):
            drums.add(tb, CL, 0.50, pan=0.05)
        drums.add(tb + BEAT / 2, HO if (b == 3 and bar % 2 == 1) else HC, 0.30, pan=0.25)
        for s in (1, 3):
            drums.add(tb + s * BEAT / 4, HC, 0.12, pan=-0.3)
        # off-beat house bass + a pickup on the last 16th
        music.add(tb + BEAT / 2, bass(root, BEAT * 0.45), 0.34)
        if b == 3:
            music.add(tb + 3 * BEAT / 4, bass(root + 7, BEAT * 0.2), 0.22)
    # EP: long chord on 1, stabs on 2& and 4
    music.add(t0, ep(chord, 4 * BEAT), 0.75)
    music.add(t0 + 1.5 * BEAT, ep([n + 12 for n in chord[1:]], 0.4), 0.30, pan=0.2)
    music.add(t0 + 3.0 * BEAT, ep([n + 12 for n in chord[:3]], 0.4), 0.26, pan=-0.2)
    music.add(t0, pad([n - 12 for n in chord] + [root + 12], 4 * BEAT + 0.3), 0.42)
    if full:
        for s in range(16):
            note = chord[ARP[s % 8]] + 12 + (12 if s % 8 == 7 else 0)
            arp_bus.add(t0 + s * BEAT / 4, pluck(note, 0.45), 0.34 if s % 4 else 0.42,
                        pan=(-0.35 if s % 2 else 0.35))

# sidechain pump (periodic over the loop)
tt = np.arange(2 * N) / SR
phase = (tt % BEAT)
duck = 1 - 0.55 * np.exp(-phase / 0.11) * np.clip(phase / 0.004, 0, 1)
music.x *= duck
arp_bus.x *= 1 - 0.3 * np.exp(-phase / 0.09)

# dotted-eighth ping-pong delay on the arp
d = int(round(0.75 * BEAT * SR))
dl = np.zeros_like(arp_bus.x)
src = arp_bus.x.copy()
for k in range(1, 6):
    sh = np.roll(src[k % 2], d * k) * (0.38 ** k)
    dl[(k + 1) % 2] += lp(sh, 4200)
arp_bus.x += dl

# reverb: synthetic stereo IR (exponential decay, darkened), circular via 2-loop render
irn = int(1.8 * SR); ti = np.arange(irn) / SR
ir = np.vstack([lp(rng.standard_normal(irn), 5000), lp(rng.standard_normal(irn), 5000)]) * np.exp(-ti / 0.45)
ir[:, :int(0.012 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
send = music.x * 0.22 + arp_bus.x * 0.35 + drums.x * 0.04
wet = np.vstack([fftconvolve(send[c], ir[c])[:2 * N] for c in (0, 1)]) * 0.35

mix = drums.x + music.x + arp_bus.x + wet
mix = hp(mix, 28)
mix = np.tanh(1.1 * mix) / 1.1
seg = mix[:, N:2 * N]                            # second pass: tails already wrapped in
seg = seg / np.max(np.abs(seg)) * 10 ** (-1.0 / 20)
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'music.wav', SR, (seg.T * 32767).astype(np.int16))
print('wrote', seg.shape[1] / SR, 's')
