"""Voiceover: Kokoro-82M (am_puck) through kokoro-onnx, with per-word timestamps.

Each line is synthesized on its own, placed on the 50 s timeline with the gaps below, and
its words get absolute start/end times from the model's predicted phoneme durations (the
graph is patched by ict/tools/patch_kokoro.py to return them). The scene cuts, the caption
groups and every word-synced visual cue are derived from those times and written to
ict/data/timeline.json.

Usage: python3 ict/audio/tts.py <models dir>   (needs kokoro-fp32-timed.onnx and voices-male.npz)
"""
import json
import pathlib
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import resample_poly

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR_TTS, SR = 24000, 48000
DURATION = 50.0
VOICE = 'am_puck'
LAST_WORD_END = 49.35      # the speed is fitted so the last word ends here
SPEED_RANGE = (1.0, 1.15)

# text, silence before the line (from the previous line's audible end, s). The pauses before the
# three "Step" lines are the punchy ones; the one before "Target hit" lets the rally reach the target.
LINES = [
    ("Ninety percent of traders lose money. Here's the setup the other ten percent use.", 0.12),
    ("Smart money can't buy millions without sellers. So where do they find them?", 0.36),
    ("Equal lows. Retail traders hide their stop losses right below them. That's sell-side liquidity.", 0.36),
    ("Step one: the sweep. Price dives under the lows, triggers every stop, and snaps right back.", 0.58),
    ("Step two: the shift. Strong bullish candles break the last swing high. The trend just flipped.", 0.52),
    ("Step three: the gap. Candle one's high and candle three's low don't overlap. That empty space is your Fair Value Gap.", 0.52),
    ("Now be patient. Let price come back into the gap. That's your entry.", 0.40),
    ("Stop loss below the sweep. Target the equal highs above, where the next liquidity sits.", 0.40),
    ("Target hit. Clean, simple, repeatable.", 1.30),
    ("Sweep. Shift. Gap. Save this, and follow for part two.", 0.42),
]
# Words said with a little more weight (+2.5 dB): line index, word index.
EMPHASIS = {(3, 3), (4, 3), (5, 3), (5, 20), (6, 12), (7, 5), (8, 0), (9, 0), (9, 1), (9, 2)}

# Caption display: spoken words merged or rewritten for the screen.
DISPLAY = {(0, 0, 2): '90%', (0, 11, 13): '10%', (3, 1, 2): '1:', (4, 1, 2): '2:', (5, 1, 2): '3:', (9, 9, 10): '2.'}
# Hand-picked caption breaks (line -> word indices that end a group) where the automatic split reads badly.
BREAKS = {7: {8, 10}}
KEY_TERMS = ['smart money', 'equal lows', 'stop losses', 'sell-side liquidity', 'sweep', 'shift', 'gap',
             'fair value gap', 'entry', 'stop loss', 'target', 'equal highs', 'liquidity', 'swing high']
# Emoji accents on key moments only: (line, word index the group must contain) -> emoji.
EMOJI = {(0, 5): '💸', (3, 3): '⚡', (4, 3): '📈', (5, 20): '🟨', (6, 2): '⏳', (8, 1): '✅', (9, 2): '🔁'}


def words_of(text):
    return text.split()


def word_times(tim, n_words):
    """Group phoneme timings into words: a word is a run of phonemes between spaces."""
    groups, cur = [], []
    for t in tim:
        if t.phoneme == ' ':
            if cur:
                groups.append(cur)
                cur = []
        elif t.phoneme not in '.,!?:;—…"()“”':
            cur.append(t)
    if cur:
        groups.append(cur)
    if len(groups) != n_words:
        raise SystemExit(f'phoneme groups ({len(groups)}) do not match words ({n_words})')
    return [(g[0].start, g[-1].end) for g in groups]


def voice_chain(x):
    """High-pass, a touch of presence, gentle compression. Mono float at SR."""
    from scipy.signal import butter, sosfilt
    x = sosfilt(butter(2, 85, 'highpass', fs=SR, output='sos'), x)
    pres = sosfilt(butter(2, [2500, 6000], 'bandpass', fs=SR, output='sos'), x)
    x = x + 0.28 * pres
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same')) + 1e-9
    thr = 0.12
    gain = np.where(env > thr, (thr / env) ** (1 - 1 / 2.5), 1.0)
    gain = np.convolve(gain, np.ones(240) / 240, 'same')
    return x * gain


def audible(a, sr):
    """First and last sample above -38 dB of the peak, on a 10 ms RMS envelope (seconds)."""
    env = np.sqrt(np.convolve(a ** 2, np.ones(sr // 100) / (sr // 100), 'same'))
    on = np.where(env > np.abs(a).max() * 10 ** (-38 / 20))[0]
    return on[0] / sr, on[-1] / sr


def synth(k, speed):
    out = []
    for text, gap in LINES:
        a, sr, tim = k.create_timed(text, voice=VOICE, speed=speed, sentence_pause=0.14, clause_pause=0.06)
        assert sr == SR_TTS
        out.append((a, word_times(tim, len(words_of(text))), audible(a, sr)))
    return out


def layout(parts):
    """Start time of each line so that its audible start follows the previous audible end + gap."""
    cursor, starts = 0.0, []
    for (text, gap), (a, wt, (on, off)) in zip(LINES, parts):
        cursor += gap
        starts.append(cursor - on)
        cursor = starts[-1] + off
    return starts, cursor


def main():
    models = pathlib.Path(sys.argv[1])
    k = Kokoro(str(models / 'kokoro-fp32-timed.onnx'), str(models / 'voices-male.npz'))
    # Fit the speed: audible durations scale about as 1/speed; refine until the last word fits.
    parts = synth(k, 1.0)
    _, end = layout(parts)
    speech = sum(off - on for _, _, (on, off) in parts)
    pauses = end - speech
    speed = min(max(round(speech / (LAST_WORD_END - pauses), 3), SPEED_RANGE[0]), SPEED_RANGE[1])
    while True:
        parts = synth(k, speed)
        starts, end = layout(parts)
        print(f'speed {speed:.3f}: last word ends at {end:.2f}s')
        if end <= LAST_WORD_END + 0.02 or speed >= SPEED_RANGE[1]:
            break
        speed = round(speed + 0.005, 3)
    if end > DURATION - 0.3:
        raise SystemExit(f'voiceover ends at {end:.2f}s, too late for a {DURATION}s video')

    track = np.zeros(int(DURATION * SR))
    emph = np.zeros_like(track)
    lines = []
    total_words = 0
    for li, ((text, gap), (a, wt, (on, off)), t) in enumerate(zip(LINES, parts, starts)):
        ws = words_of(text)
        total_words += len(ws)
        a = resample_poly(a, 2, 1)
        i0 = int(round(t * SR))
        track[i0:i0 + len(a)] += a[:len(track) - i0]
        words = []
        for wi, (w, (s, e)) in enumerate(zip(ws, wt)):
            e = min(e, off)                         # the last phoneme's span runs into the fade-out
            words.append({'w': w, 's': round(t + s, 3), 'e': round(t + e, 3)})
            if (li, wi) in EMPHASIS:
                emph[int((t + s) * SR):int((t + e) * SR)] = 1
        lines.append({'text': text, 's': round(t + on, 3), 'e': round(t + off, 3), 'words': words})
        print(f'line {li + 1:2d}  {t + on:6.2f} -> {t + off:6.2f}  ({off - on:4.2f}s)')
    print(f'{total_words} words, {60 * total_words / (end - lines[0]["s"]):.0f} wpm over the voiced span')

    ramp = np.ones(int(0.025 * SR)) / int(0.025 * SR)
    track *= 10 ** (2.5 * np.convolve(emph, ramp, 'same') / 20)
    track = voice_chain(track)
    track *= 0.89 / np.abs(track).max()
    out = ROOT / 'out' / 'audio'
    out.mkdir(parents=True, exist_ok=True)
    sf.write(out / 'vo.wav', track.astype(np.float32), SR, subtype='FLOAT')

    timeline = build_timeline(lines)
    timeline['speed'] = speed
    (ROOT / 'data' / 'timeline.json').write_text(json.dumps(timeline, indent=1, ensure_ascii=False))
    print('wrote', out / 'vo.wav', 'and data/timeline.json')


def norm(w):
    return re.sub(r"[^a-z'\-]", '', w.lower())


FUNCTION_WORDS = {'the', 'a', 'an', 'of', 'and', 'to', 'your', 'their', 'for', 'into', 'under', 'below', 'is',
                  'that', "that's", "here's", 'let', 'be', 'do', 'where', 'every', 'come', 'right', 'just', 'next', 'last',
                  'empty', 'strong', 'bullish', 'other', 'retail'}   # key terms are kept whole by key_flags


def key_flags(words):
    """Mark the words that belong to a key term (they are drawn in cyan)."""
    n = [norm(w['w']) for w in words]
    flags = [False] * len(n)
    for term in KEY_TERMS:
        tw = term.split(' ')
        for i in range(len(n) - len(tw) + 1):
            if n[i:i + len(tw)] == tw:
                for j in range(i, i + len(tw)):
                    flags[j] = True
    return flags


def split_sentence(toks, keys):
    """Best split of one sentence into groups of 2-4 tokens (1 only if the sentence is one token)."""
    n = len(toks)
    if n <= 4:
        return [toks]
    best = {0: (0.0, [])}
    for end in range(1, n + 1):
        for size in (2, 3, 4):
            a = end - size
            if a < 0 or a not in best:
                continue
            g = toks[a:end]
            cost = best[a][0] + 1 + {2: 0.3, 3: 0.0, 4: 0.25}[size]
            last = norm(g[-1]['raw'].split(' ')[-1])
            if end < n:
                if g[-1]['raw'].endswith(','):
                    cost -= 0.8
                if last in FUNCTION_WORDS and not g[-1]['raw'].endswith(','):
                    cost += 3
                if last.endswith("'s") and last not in FUNCTION_WORDS:   # possessive: keep it with its noun
                    cost += 2
                # never split inside a key term
                if keys[g[-1]['idx'][-1]] and keys[toks[end]['idx'][0]] and toks[end]['idx'][0] == g[-1]['idx'][-1] + 1:
                    cost += 3
            if end not in best or cost < best[end][0]:
                best[end] = (cost, best[a][1] + [g])
    return best[n][1]


def build_timeline(lines):
    # Scene cuts: each scene starts just before its line, the first at 0 and the last ends at 50.
    lead = [0, 0.16, 0.16, 0.12, 0.12, 0.12, 0.16, 0.16, 1.30, 0.16]
    starts = [0.0] + [round(lines[i]['s'] - lead[i], 3) for i in range(1, 10)]
    scenes = [{'s': starts[i], 'e': starts[i + 1] if i < 9 else DURATION} for i in range(10)]

    caps = []
    for li, ln in enumerate(lines):
        ws = ln['words']
        keys = key_flags(ws)
        toks, wi = [], 0
        while wi < len(ws):
            span = next(((a, b) for (l, a, b) in DISPLAY if l == li and a == wi), None)
            a, b = span if span else (wi, wi + 1)
            text = DISPLAY[(li, a, b)] if span else ws[a]['w']
            raw = ' '.join(w['w'] for w in ws[a:b])
            toks.append({'t': text, 'raw': raw, 's': ws[a]['s'], 'e': ws[b - 1]['e'], 'idx': list(range(a, b)),
                         'key': any(keys[a:b]), 'end': raw[-1] in '.?!'})
            wi = b
        sentences, cur = [], []
        for tk in toks:
            cur.append(tk)
            if tk['end']:
                sentences.append(cur)
                cur = []
        if cur:
            sentences.append(cur)
        # one-word sentences in a row ("Sweep. Shift. Gap.") share a group
        merged = []
        for s in sentences:
            if merged and len(s) == 1 and len(merged[-1]) < 3 and all(len(x['raw'].split()) == 1 for x in merged[-1]) \
                    and len(merged[-1]) == sum(1 for x in merged[-1] if x['end']):
                merged[-1] = merged[-1] + s
            else:
                merged.append(s)
        if li in BREAKS:
            merged = [[]]
            for tk in toks:
                merged[-1].append(tk)
                if tk['end'] or tk['idx'][-1] in BREAKS[li]:
                    merged.append([])
            merged = [m for m in merged if m]
        for s in merged:
            for g in split_sentence(s, keys):
                emoji = next((e for (l, w), e in EMOJI.items() if l == li and any(w in tk['idx'] for tk in g)), '')
                caps.append({'s': round(g[0]['s'] - 0.06, 3), 'line': li, 'emoji': emoji,
                             'words': [{'t': tk['t'].upper(), 's': tk['s'], 'e': tk['e'], 'key': tk['key']} for tk in g]})
    for i, c in enumerate(caps):
        last = c['words'][-1]['e']
        nxt = caps[i + 1]['s'] if i + 1 < len(caps) else DURATION
        c['e'] = round(min(nxt, last + 0.45), 3)
    return {'duration': DURATION, 'voice': VOICE, 'scenes': scenes, 'lines': lines, 'captions': caps}


if __name__ == '__main__':
    main()
