"""Original dark cinematic trap beat, 140 BPM, F minor, synthesized with numpy/scipy.

Royalty-free by construction: every sound is generated here. The bar grid comes from
ict/data/cues.json, so bar 0 (the drop) lands exactly on the Scene 4 cut (the sweep).

Form (bars relative to the drop, 1 bar = 1.714 s):
  -9..-6  intro A    pad, bell motif, sub drone, ticking hats          (hook + vault)
  -5..-2  intro B    + filtered kick/clap/808, 8th hats                 (liquidity)
  -1      pre-drop   snare roll, riser, reverse cymbal, half-beat of silence
   0..10  drop 1     full beat: kick, 808, half-time clap, hat rolls    (sweep, shift, gap)
  11..12  breakdown  pad + bell + clock ticks, snare roll back in       (be patient)
  13..18  drop 2     full beat, riser into the target hit (bar 16 beat 4)
  19      outro      kick + 808 only, final hit on bar 20

Writes three stems (drums, bass, keys) at 48 kHz stereo so the mix can duck them separately.

Usage: python3 ict/audio/music.py
"""
import json
import pathlib

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
CUES = json.loads((ROOT / 'data' / 'cues.json').read_text())
G = CUES['grid']
BEAT, BAR, DROP = G['beat'], G['bar'], G['drop']
STEP = BEAT / 4
DUR = CUES['end'] + 1.0
N = int(DUR * SR)
rng = np.random.default_rng(140)


def T(bar, step=0.0):
    return DROP + bar * BAR + step * STEP


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def tt(d):
    return np.arange(int(d * SR)) / SR


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, t, sig, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig * l * np.sqrt(2), sig * r * np.sqrt(2)])
        s = int(round(t * SR))
        if s < 0:
            sig, s = sig[:, -s:], 0
        e = min(s + sig.shape[1], N)
        if e > s:
            self.x[:, s:e] += gain * sig[:, :e - s]


# ------------------------------------------------------------------ instruments
def kick(punch=1.0):
    t = tt(0.32)
    f = 52 + 120 * np.exp(-t / 0.022)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * np.clip(t / 0.001, 0, 1)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.003) * 0.35 * punch
    return np.tanh(2.0 * (body + click)) / np.tanh(2.0)


def b808(note, dur, glide_to=None, drive=2.4):
    t = tt(dur + 0.08)
    f0 = midi(note)
    f = f0 * (1 + 0.5 * np.exp(-t / 0.010))
    if glide_to is not None:
        g = np.clip((t - (dur - 0.16)) / 0.12, 0, 1)
        f = f * (midi(glide_to) / f0) ** (g * g * (3 - 2 * g))
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.clip(t / 0.003, 0, 1) * np.exp(-t / 1.1) * np.clip((dur + 0.08 - t) / 0.06, 0, 1)
    x = np.sin(ph) * env
    x = np.tanh(drive * x) / np.tanh(drive)          # harmonics so phones can hear it
    return lp(x, 1400)


def clap():
    t = tt(0.42)
    noise = bp(rng.standard_normal(len(t)), 1000, 4200)
    e = np.zeros(len(t))
    for d in (0.0, 0.009, 0.019, 0.028):
        e += np.where(t >= d, np.exp(-np.maximum(t - d, 0) / 0.005), 0)
    e += np.where(t >= 0.03, 0.6 * np.exp(-np.maximum(t - 0.03, 0) / 0.13), 0)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.5
    snap = hp(rng.standard_normal(len(t)), 5000) * np.exp(-t / 0.02) * 0.4
    return np.tanh(1.4 * (noise * e / 3 + body + snap))


def snare_hit(vel=1.0):
    t = tt(0.16)
    n = bp(rng.standard_normal(len(t)), 1800, 7000) * np.exp(-t / 0.035)
    b = np.sin(2 * np.pi * 210 * t) * np.exp(-t / 0.03)
    return vel * (0.8 * n + 0.5 * b)


_hat_cache = {}


def hat(tau=0.011, bright=1.0):
    key = (tau, bright)
    if key not in _hat_cache:
        t = tt(min(0.5, 8 * tau))
        metal = sum(np.sign(np.sin(2 * np.pi * f * 1.6 * t)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
        x = 0.6 * hp(rng.standard_normal(len(t)), 7000) + 0.4 * bp(metal, 7000, 11000)
        _hat_cache[key] = hp(x, 6500) * np.exp(-t / tau) * bright
    return _hat_cache[key]


def crash(d=2.6):
    t = tt(d)
    x = hp(rng.standard_normal(len(t)), 3500) + 0.3 * bp(rng.standard_normal(len(t)), 6000, 12000)
    return x * np.exp(-t / 0.9) * np.clip(t / 0.002, 0, 1)


def reverse_cymbal(d):
    t = tt(d)
    x = hp(rng.standard_normal(len(t)), 3000)
    return x * (t / d) ** 3


def riser(d, f_lo=250, f_hi=7000):
    t = tt(d)
    u = t / d
    noise = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    blk = 1024
    for i in range(0, len(t), blk):
        fc = f_lo * (f_hi / f_lo) ** u[i]
        seg = noise[max(0, i - 256):i + blk]
        y = bp(seg, fc * 0.7, min(fc * 1.4, 20000))
        out[i:i + blk] = y[-len(noise[i:i + blk]):]
    saw_f = 110 * 2 ** (2.5 * u)
    saw = 2 * ((np.cumsum(saw_f) / SR) % 1) - 1
    return (0.8 * out + 0.12 * lp(saw, 3000)) * u ** 2.2


def tick():
    t = tt(0.06)
    return (np.sin(2 * np.pi * 1850 * t) * 0.5 + bp(rng.standard_normal(len(t)), 2500, 6000) * 0.5) * np.exp(-t / 0.008)


def saw_voice(f, t, detune_cents):
    ff = f * 2 ** (detune_cents / 1200)
    ph = (ff * t + rng.random()) % 1
    return 2 * ph - 1


def pad_chord(notes, dur, bright=1.0):
    t = tt(dur + 0.8)
    env = np.clip(t / 0.35, 0, 1) * np.clip((dur + 0.8 - t) / 0.8, 0, 1)
    out = np.zeros((2, len(t)))
    for n in notes:
        f = midi(n)
        for ch in (0, 1):
            for dc in (-9, -3, 4, 10):
                out[ch] += saw_voice(f, t, dc + (2 if ch else -2))
    lfo = 1 + 0.15 * np.sin(2 * np.pi * 0.25 * t)
    for ch in (0, 1):
        out[ch] = lp(out[ch], 900 * bright, 2) * lfo
    return out * env / (len(notes) * 4)


def bell(note, dur=1.6):
    t = tt(dur)
    f = midi(note)
    idx = 2.2 * np.exp(-t / 0.12) + 0.3
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * 3.5 * f * t))
    x += 0.35 * np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t / 0.5)
    return x * np.exp(-t / 0.55) * np.clip(t / 0.002, 0, 1)


def sub_drone(note, dur):
    t = tt(dur)
    env = np.clip(t / 1.2, 0, 1) * np.clip((dur - t) / 1.0, 0, 1)
    return np.tanh(1.5 * np.sin(2 * np.pi * midi(note) * t)) * env


def reverb_ir(rt60=2.4, d=3.0):
    t = tt(d)
    ir = np.vstack([rng.standard_normal(len(t)), rng.standard_normal(len(t))])
    dec = np.exp(-6.9 * t / rt60)
    ir = np.vstack([lp(ir[0], 4500) * dec, lp(ir[1], 4500) * dec])
    pre = int(0.022 * SR)
    ir = np.pad(ir, ((0, 0), (pre, 0)))
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def reverb(x, ir, mix):
    wet = np.vstack([fftconvolve(x[0], ir[0])[:x.shape[1]], fftconvolve(x[1], ir[1])[:x.shape[1]]])
    return wet * mix


def pingpong(x, delay, fb=0.38, n=5):
    out = np.zeros_like(x)
    d = int(delay * SR)
    for k in range(1, n + 1):
        ch = k % 2
        g = fb ** k
        src = x[0] + x[1]
        out[ch, d * k:] += 0.5 * g * src[:x.shape[1] - d * k]
    return out


# ------------------------------------------------------------------ score
FM, DB, BBM, C = 'Fm', 'Db', 'Bbm', 'C'
VOICING = {FM: (56, 60, 65), DB: (56, 61, 65), BBM: (58, 61, 65), C: (55, 60, 64)}
ROOT808 = {FM: 29 + 12, DB: 37, BBM: 34, C: 36}      # F2, Db2, Bb1, C2
CHORDS = {}
for i, ch in enumerate([FM, DB, BBM, C, FM, DB, BBM, C, C]):
    CHORDS[-9 + i] = ch
for i, ch in enumerate([FM, DB, BBM, C, FM, DB, BBM, C, FM, DB, BBM]):
    CHORDS[i] = ch
CHORDS[11], CHORDS[12] = DB, C
for i, ch in enumerate([FM, DB, BBM, C, FM, DB, C]):
    CHORDS[13 + i] = ch
CHORDS[20] = FM

# bell motif, (step, midi) per chord
MOTIF = {
    FM: [(0, 72), (3, 68), (6, 65), (8, 67), (10, 68), (14, 72)],
    DB: [(0, 73), (3, 72), (6, 68), (10, 65), (12, 63)],
    BBM: [(0, 73), (3, 70), (6, 65), (8, 68), (10, 70), (14, 73)],
    C: [(0, 72), (3, 70), (6, 67), (8, 64), (10, 67), (12, 70)],
}

KICKS = [[0, 7, 10], [0, 3, 10, 13], [0, 7, 10, 14], [0, 10, 11]]
DROP1 = range(0, 11)
DROP2 = range(13, 19)


def section(b):
    if b <= -6:
        return 'introA'
    if b <= -2:
        return 'introB'
    if b == -1:
        return 'pre'
    if b in DROP1 or b in DROP2:
        return 'drop'
    if b in (11, 12):
        return 'break'
    if b == 19:
        return 'outro'
    return 'end'


def main():
    drums, bass, keys = Bus(), Bus(), Bus()
    send = Bus()                                   # reverb send (keys + claps)
    echo = Bus()                                   # ping-pong delay send (bells only)
    # sub drone under the intro and the breakdown
    bass.add(T(-9), sub_drone(29, 8 * BAR), 0.18)
    bass.add(T(11), sub_drone(29, 2 * BAR), 0.14)

    for b in range(-9, 21):
        sec = section(b)
        ch = CHORDS.get(b, FM)
        if sec == 'end':
            # final hit: 808 + crash + chord swell
            bass.add(T(20), b808(ROOT808[FM], 1.6), 0.95)
            drums.add(T(20), kick(1.2), 0.9)
            drums.add(T(20), crash(), 0.32, pan=0.15)
            keys.add(T(20), pad_chord(VOICING[FM], 1.2, 1.4), 0.55)
            send.add(T(20), pad_chord(VOICING[FM], 1.2, 1.4), 0.4)
            continue

        # pad: every bar except the pre-drop gap at the end of bar -1
        bright = {'introA': 0.8, 'introB': 1.0, 'pre': 1.3, 'drop': 1.25, 'break': 0.7, 'outro': 1.0}[sec]
        pd = pad_chord(VOICING[ch], BAR - (STEP * 2 if sec == 'pre' else 0), bright)
        keys.add(T(b), pd, 0.42 if sec != 'drop' else 0.34)
        send.add(T(b), pd, 0.25)

        # bell motif: intro, drop (every bar), breakdown; quieter under the voice
        if sec in ('introA', 'introB', 'drop', 'break', 'outro'):
            for step, n in MOTIF[ch]:
                if sec == 'outro' and step > 8:
                    continue
                g = {'introA': 0.24, 'introB': 0.22, 'drop': 0.17, 'break': 0.24, 'outro': 0.16}[sec]
                bl = bell(n + (12 if sec == 'break' and step == 0 else 0))
                pan = -0.35 if (step // 3) % 2 else 0.35
                keys.add(T(b, step), bl, g, pan=pan)
                send.add(T(b, step), bl, g * 0.8, pan=pan)
                echo.add(T(b, step), bl, g, pan=pan)

        # hats
        if sec == 'introA' and b >= -8:
            for s in (0, 4, 8, 12):
                drums.add(T(b, s), hat(0.01, 0.6), 0.16, pan=0.2)
        if sec == 'introB':
            for s in range(0, 16, 2):
                drums.add(T(b, s), hat(0.01, 0.8), 0.15 + 0.06 * (s % 4 == 0), pan=0.2)
        if sec in ('drop', 'outro'):
            roll = (b % 2 == 1) and sec == 'drop'
            for s in range(0, 16, 2):
                if roll and s >= 12:
                    continue
                drums.add(T(b, s), hat(0.011, 1.0), 0.22 + 0.08 * (s % 4 == 0), pan=0.18)
            if roll:
                # 32nd-note roll with a pitch-like brightness ramp
                for k in range(8):
                    drums.add(T(b, 12 + k * 0.5), hat(0.008, 0.8 + 0.05 * k), 0.12 + 0.02 * k, pan=0.18 - 0.05 * k)
            if b % 4 == 2:
                drums.add(T(b, 14), hat(0.12, 0.9), 0.16, pan=-0.2)          # open hat
            if b == 16:                                                     # rally: 16ths up to the hit
                for s in range(1, 16, 2):
                    if s < 14:
                        drums.add(T(b, s), hat(0.009, 1.1), 0.14, pan=-0.15)
        if sec == 'break':
            for s in (0, 4, 8, 12):
                drums.add(T(b, s), tick(), 0.22, pan=0.3 if s % 8 else -0.3)
            if b == 12:
                for k in range(16):
                    if k >= 8:
                        drums.add(T(b, k), snare_hit(0.3 + 0.045 * (k - 8)), 0.55, pan=-0.05)

        # kick, 808, clap
        if sec == 'introB':
            pat = [0, 10]
            for s in pat:
                k = lp(kick(0.6), 900)
                drums.add(T(b, s), k, 0.5)
            nxt = pat[1:] + [16]
            for s, e in zip(pat, nxt):
                bass.add(T(b, s), lp(b808(ROOT808[ch], (e - s) * STEP), 220), 0.55)
            drums.add(T(b, 8), lp(clap(), 2500), 0.32)
            send.add(T(b, 8), lp(clap(), 2500), 0.25)
        if sec in ('drop', 'outro'):
            pat = KICKS[b % 4] if sec == 'drop' else [0, 10]
            if b == 16:
                pat = [0, 7, 10]
            for s in pat:
                drums.add(T(b, s), kick(), 0.85)
            nxt = pat[1:] + [16]
            for i, (s, e) in enumerate(zip(pat, nxt)):
                note = ROOT808[ch]
                glide = None
                if i == len(pat) - 1 and b % 4 == 3 and sec == 'drop':
                    note, glide = note + 12, note        # octave jump sliding down into the next bar
                bass.add(T(b, s), b808(note, (e - s) * STEP, glide), 0.9)
            if sec == 'drop' or b == 19:
                drums.add(T(b, 8), clap(), 0.62)
                send.add(T(b, 8), clap(), 0.3)
                if b % 4 == 3:
                    drums.add(T(b, 15), clap(), 0.25)

        if sec == 'pre':
            for k in range(14):                          # snare roll: 8ths -> 16ths -> 32nds
                pos = [0, 2, 4, 6, 8, 9, 10, 11, 12, 12.5, 13, 13.5, 14, 14.5][k]
                drums.add(T(b, pos), snare_hit(0.25 + 0.05 * k), 0.6)
            drums.add(T(b, 0), reverse_cymbal(BAR - STEP * 2), 0.28, pan=-0.1)

    # risers: into the drop, into the drop 2, into the target hit
    keys.add(T(-1) - 0.6, riser(BAR - STEP * 2 + 0.6), 0.22)
    keys.add(T(12, 8), riser(BAR / 2), 0.16)
    keys.add(T(16), riser(CUES['tp_hit'] - T(16)), 0.18)
    # crashes on the drops and on the target hit
    for t in (T(0), T(13), CUES['tp_hit']):
        drums.add(t, crash(), 0.30, pan=0.15)
        send.add(t, crash(), 0.1)

    ir = reverb_ir()
    keys.x += reverb(send.x, ir, 0.55)
    # bell echoes
    keys.x += pingpong(echo.x, BEAT * 0.75, 0.35)

    out = ROOT / 'out' / 'audio'
    out.mkdir(parents=True, exist_ok=True)
    stems = {'drums': drums.x, 'bass': bass.x, 'keys': keys.x}
    total = sum(stems.values())
    peak = np.abs(total).max()
    for name, x in stems.items():
        x = x[:, :int(CUES['end'] * SR)] / peak * 0.89
        # gentle fade on the last 0.25 s so the loop point is clean
        f = int(0.25 * SR)
        x[:, -f:] *= np.linspace(1, 0, f) ** 2
        sf.write(out / f'music_{name}.wav', x.T.astype(np.float32), SR, subtype='FLOAT')
    mix = total[:, :int(CUES['end'] * SR)] / peak * 0.89
    sf.write(out / 'music.wav', mix.T.astype(np.float32), SR, subtype='FLOAT')
    for name, (a, b) in {'intro A': (0, T(-5)), 'intro B': (T(-5), T(-1)), 'pre': (T(-1), T(0)),
                         'drop 1': (T(0), T(11)), 'break': (T(11), T(13)), 'drop 2': (T(13), T(19)),
                         'outro': (T(19), CUES['end'])}.items():
        seg = mix[:, int(a * SR):int(b * SR)]
        print(f'{name:8s} {a:6.2f}-{b:6.2f}  rms {20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9):6.1f} dBFS')
    print('wrote', out / 'music.wav')


if __name__ == '__main__':
    main()
