"""UI sounds + final soundtrack.

Synthesises the UI sounds with numpy, measures the peak of each one, and places
every sound so that its measured peak lands exactly on its event time. The music
is rotated so that its first measured downbeat peak sits at video t = 0, and the
whole mix wraps around the 40 s loop.

Usage: python3 audio/mix.py out/music.wav out/grid.json out/events.json out/soundtrack.wav [--no-wrap]
(--no-wrap: the piece does not loop, sounds are cut at the end instead of wrapping to the start)
"""
import json
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(11)


def tt(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


def hp(x, f):
    return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)


def tone(f, d, tau, att=0.0015, sweep=None):
    t = tt(d)
    ff = f if sweep is None else f * (sweep / f) ** (t / d)
    ph = 2 * np.pi * np.cumsum(np.ones_like(t) * ff) / SR
    return np.sin(ph) * np.exp(-t / tau) * np.clip(t / att, 0, 1)


def noise(d, tau, lo, hi):
    t = tt(d)
    return bp(rng.standard_normal(len(t)), lo, hi) * np.exp(-t / tau)


def pad(*xs):
    n = max(len(x) for x in xs)
    return sum(np.pad(x, (0, n - len(x))) for x in xs)


def delayed(x, d):
    return np.concatenate([np.zeros(int(d * SR)), x])


SFX = {
    'click':  lambda: pad(0.55 * noise(.03, .003, 1500, 7000), 0.5 * tone(2300, .05, .012), 0.35 * tone(190, .06, .018)),
    'tab':    lambda: pad(0.45 * noise(.025, .0025, 2000, 8000), 0.45 * tone(2900, .04, .009)),
    'tick':   lambda: pad(0.5 * tone(3300, .06, .014), 0.25 * noise(.02, .002, 3000, 9000)),
    'low':    lambda: pad(0.6 * tone(620, .12, .04), 0.3 * noise(.02, .003, 800, 4000)),
    'press':  lambda: pad(0.6 * tone(140, .1, .03), 0.35 * noise(.03, .004, 900, 5000)),
    'pop':    lambda: pad(0.7 * tone(380, .12, .045, sweep=880), 0.2 * noise(.02, .002, 1500, 6000)),
    'success': lambda: pad(0.6 * tone(1318.5, .5, .16, att=.003), 0.15 * delayed(tone(1975.5, .5, .2, att=.003), .07)),
    'toggle': lambda: pad(0.5 * noise(.02, .002, 1500, 7000), 0.4 * tone(1700, .04, .01), 0.45 * delayed(tone(2500, .04, .01), .028)),
    'key':    lambda: pad(0.5 * noise(.03, .004, 1200, 6000), 0.3 * tone(260, .04, .012)),
    'enter':  lambda: pad(0.6 * noise(.04, .005, 900, 5000), 0.5 * tone(170, .07, .02)),
    'grab':   lambda: pad(0.45 * noise(.03, .003, 1000, 5000), 0.4 * tone(420, .05, .014)),
    'drop':   lambda: pad(0.7 * tone(130, .14, .04), 0.35 * noise(.04, .006, 600, 3000)),
    'snap':   lambda: pad(0.6 * tone(1300, .07, .025, sweep=320), 0.25 * noise(.02, .002, 2000, 8000)),
    'fill':   lambda: pad(0.4 * tone(1650, .05, .012)),
    'hover':  lambda: pad(0.25 * tone(2600, .03, .006)),
    'letter': lambda: pad(0.3 * tone(4200, .03, .005), 0.15 * noise(.01, .001, 4000, 10000)),
    'whoosh': lambda: whoosh(.45, 300, 4000),
    'swish':  lambda: whoosh(.25, 1500, 9000),
    'slam':   lambda: pad(0.8 * tone(90, .3, .09, sweep=48), 0.45 * noise(.06, .012, 300, 4000), 0.3 * noise(.02, .002, 2000, 9000)),
    'fall':   lambda: whoosh(.6, 3500, 250),
    'shimmer': lambda: pad(*[0.18 * delayed(tone(f, .5, .18, att=.004), d) for f, d in ((1568, 0), (2093, .03), (2637, .06), (3136, .09))]),
    'blub':   lambda: pad(0.6 * tone(240, .14, .05, sweep=520), 0.12 * noise(.02, .003, 600, 3000)),
    'burst':  lambda: pad(whoosh(.5, 6000, 300), 0.5 * noise(.08, .02, 200, 6000)),
}


def whoosh(d, f0, f1):
    """Filtered-noise sweep with a soft attack; peak near the middle."""
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); blk = 512
    for i in range(0, len(t), blk):
        u = i / len(t); fc = f0 * (f1 / f0) ** u
        seg = bp(n[max(0, i - 2048):i + blk], max(60, fc * .6), min(fc * 1.6, 20000))
        out[i:i + blk] = seg[-len(n[i:i + blk]):]
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return out * env
LEVEL = {'click': .55, 'tab': .5, 'tick': .45, 'low': .55, 'press': .5, 'pop': .6, 'success': .45, 'toggle': .55,
         'key': .38, 'enter': .6, 'grab': .45, 'drop': .6, 'snap': .5, 'fill': .35, 'hover': .3, 'letter': .3,
         'whoosh': .42, 'swish': .3, 'slam': .7, 'fall': .4, 'shimmer': .35, 'blub': .5, 'burst': .55}
PAN = {'tab': .1, 'key': -.08, 'letter': .15}


def peak_index(x):
    env = np.convolve(np.abs(x), np.ones(24) / 24, mode='same')     # 0.5 ms
    return int(np.argmax(env))


WRAP = '--no-wrap' not in sys.argv


def main():
    music_p, grid_p, ev_p, out_p = sys.argv[1:5]
    sr, m = wavfile.read(music_p)
    assert sr == SR
    m = m.astype(np.float64) / 32768
    grid = json.load(open(grid_p))
    ev = json.load(open(ev_p))
    dur = ev['dur']
    n = len(m)                                     # the music is exactly one loop
    assert abs(n - dur * SR) < 2, (n, dur * SR)
    # video t = 0 on the first downbeat peak
    m = np.roll(m, -int(round(grid['t0'] * SR)), axis=0)

    ui = np.zeros((n, 2))
    peaks = {}
    for e in ev['events']:
        x = SFX[e['type']]()
        x = x / (np.max(np.abs(x)) + 1e-9) * LEVEL[e['type']] * e.get('gain', 1)
        pk = peak_index(x)
        peaks[e['type']] = pk / SR
        start = int(round(e['t'] * SR)) - pk
        pan = PAN.get(e['type'], 0)
        l, r = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2), np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        idx = start + np.arange(len(x))
        if WRAP:
            idx = idx % n                                # wrap around the loop
        else:
            keep = (idx >= 0) & (idx < n); idx, x = idx[keep], x[keep]
        ui[idx, 0] += x * l
        ui[idx, 1] += x * r
    ui = hp(ui.T, 120).T
    mix = 0.82 * m + 0.62 * ui
    mix = np.tanh(1.2 * mix) / np.tanh(1.2)
    mix = mix / np.max(np.abs(mix)) * 10 ** (-1 / 20)
    wavfile.write(out_p, SR, (mix * 32767).astype(np.int16))
    print('events', len(ev['events']), '| measured peak offsets (ms):',
          ', '.join(f'{k} {v * 1000:.1f}' for k, v in sorted(peaks.items())))
    rms = np.sqrt((mix ** 2).mean())
    print(f'mix rms {20 * np.log10(rms):.1f} dBFS, seam jump {np.abs(mix[0] - mix[-1]).max():.4f}')


if __name__ == '__main__':
    main()
