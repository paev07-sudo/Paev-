"""Beat-grid analysis with numpy.

Computes a spectral-flux onset envelope, estimates the tempo by autocorrelation,
finds the beat phase by comb scoring, picks the downbeat from chord-change energy,
then measures the exact peak of every beat in the low band.

Usage: python3 audio/analyze.py out/music.wav out/grid.json
"""
import json
import sys
import numpy as np
from scipy.io import wavfile

path, out = sys.argv[1], sys.argv[2]
sr, x = wavfile.read(path)
x = x.astype(np.float64) / 32768.0
mono = x.mean(axis=1) if x.ndim == 2 else x
dur = len(mono) / sr

# --- STFT onset envelope (spectral flux on log magnitude)
HOP, NFFT = 240, 2048                          # 5 ms hop
win = np.hanning(NFFT)
pad = np.concatenate([mono[-NFFT:], mono, mono[:NFFT]])   # the track loops: pad circularly
frames = 1 + (len(pad) - NFFT) // HOP
idx = np.arange(NFFT)[None, :] + HOP * np.arange(frames)[:, None]
spec = np.abs(np.fft.rfft(pad[idx] * win, axis=1))
freqs = np.fft.rfftfreq(NFFT, 1 / sr)
logm = np.log1p(100 * spec)
flux = np.maximum(0, np.diff(logm, axis=0))
fps = sr / HOP
t_frames = (np.arange(1, frames) * HOP + NFFT / 2) / sr - NFFT / sr   # centre time, circular pad removed


def band(lo, hi):
    return flux[:, (freqs >= lo) & (freqs < hi)].sum(axis=1)


# The kick band (20-70 Hz) carries the pulse; the full band is dominated by the
# sidechain pump and the off-beat bass, which would lock the grid onto the off-beats.
env = band(20, 70)
env = (env - env.mean()) / (env.std() + 1e-9)

# --- tempo by autocorrelation (60..180 BPM): fastest lag within 90 % of the best one
ac = np.correlate(env, env, mode='full')[len(env) - 1:]
lags = np.arange(len(ac)) / fps
ok = (lags >= 60 / 180) & (lags <= 60 / 60)
cand = np.where(ok, ac, -np.inf)
loc = [k for k in range(1, len(ac) - 1) if ok[k] and ac[k] >= ac[k - 1] and ac[k] >= ac[k + 1]]
best = max(ac[k] for k in loc)
i = min(k for k in loc if ac[k] >= 0.9 * best)
# parabolic refinement
a, b, c = ac[i - 1], ac[i], ac[i + 1]
di = 0.5 * (a - c) / (a - 2 * b + c)
period = (i + di) / fps
# refine with the bar-level lag (4 beats) for precision
j0 = int(round(4 * period * fps))
seg = ac[j0 - 5:j0 + 6]
k = np.argmax(seg); j = j0 - 5 + k
a, b, c = ac[j - 1], ac[j], ac[j + 1]
period = ((j + 0.5 * (a - c) / (a - 2 * b + c)) / fps) / 4
bpm = 60 / period

# --- beat phase by comb scoring (interpolated)
def comb(offset, e):
    ts = offset + period * np.arange(int(dur / period))
    return np.interp(ts, t_frames, e).sum()

phases = np.linspace(0, period, 400, endpoint=False)
scores = np.array([comb(p, env) for p in phases])
phase = phases[np.argmax(scores)]

# --- downbeat: the harmony changes once per bar, so the downbeat is the beat with the
# largest harmonic novelty (distance between the mean spectrum just after and just before it)
hb = (freqs >= 100) & (freqs < 2000)
H = logm[1:, hb]


def novelty(tb):
    n0 = np.searchsorted(t_frames, tb % dur)
    w = int(0.9 * period * fps)
    idx_a = np.arange(n0, n0 + w) % len(H)
    idx_b = np.arange(n0 - w, n0) % len(H)
    a, b = H[idx_a].mean(0), H[idx_b].mean(0)
    return 1 - (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12)


def bar_comb(offset):
    return sum(novelty(offset + 4 * period * m) for m in range(int(dur / (4 * period))))


bar_scores = [bar_comb(phase + q * period) for q in range(4)]
q = int(np.argmax(bar_scores))
first_downbeat = (phase + q * period) % (4 * period)

# --- measured attack of every beat: high-band (>2 kHz) envelope, 1 ms; the attack is where it
# first reaches 40 % of its local maximum, within +-40 ms of the coarse estimate
from scipy.signal import butter, sosfiltfilt
hf = sosfiltfilt(butter(4, 2000, 'high', fs=sr, output='sos'), np.concatenate([mono, mono, mono]))[len(mono):2 * len(mono)]
env_hf = np.convolve(np.abs(hf), np.ones(48) / 48, mode='same')
beats = []
n_beats = int(round(dur / period))
for n in range(n_beats):
    tb = (first_downbeat + n * period) % dur
    s0, s1 = int((tb - 0.04) * sr), int((tb + 0.04) * sr)
    ii = np.arange(s0, s1) % len(mono)
    w = env_hf[ii]
    k = int(np.argmax(w >= 0.4 * w.max()))
    beats.append(round(ii[k] / sr, 5))

offs = [((bt - n * period + dur / 2) % dur) - dur / 2 for n, bt in enumerate(beats)]
t0 = float(np.median(offs)) % (4 * period)
peak_offset = t0 - first_downbeat
res = {
    'file': path, 'duration': dur, 'bpm': round(bpm, 3), 'period': period,
    'first_downbeat_onset': first_downbeat, 'peak_offset': peak_offset,
    't0': t0,                                         # video t = 0 lands on the first downbeat attack
    'bar_scores': [float(v) for v in bar_scores], 'beats': sorted(beats),
}
json.dump(res, open(out, 'w'), indent=1)
print(f"BPM {bpm:.3f}  period {period:.5f}s  coarse downbeat {first_downbeat:.4f}s  "
      f"measured first-downbeat attack t0 = {t0 * 1000:.1f} ms  beats {len(beats)}")
jit = np.array(beats[1:]) - np.array(beats[:-1])
jit = jit[jit > 0]
print(f"beat spacing: mean {jit.mean():.5f}s  min {jit.min():.5f}  max {jit.max():.5f}  bar scores {np.round(bar_scores, 4)}")
