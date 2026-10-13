"""Text deliverables from the timeline: voiceover script, SRT subtitles, TikTok caption.

The SRT uses the same 2-4 word groups and timings as the burned-in captions (word times come
from the TTS model's phoneme durations), in natural case instead of the on-screen capitals.

Usage: python3 ict/tools/text_deliverables.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'out'

CAPTION = """The ICT setup every beginner should learn first 📈 Sweep → Shift → Gap. Save it for your next session.
#ict #smartmoney #smc #forex #daytrading
"""


def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def main():
    tl = json.loads((ROOT / 'data' / 'timeline.json').read_text())
    words = {round(w['s'], 3): w['w'] for ln in tl['lines'] for w in ln['words']}
    # voiceover: one block, exactly what was synthesized
    vo = ' '.join(ln['text'] for ln in tl['lines'])
    (OUT / 'voiceover.txt').write_text(vo + '\n')
    # subtitles
    blocks = []
    for i, c in enumerate(tl['captions'], start=1):
        toks = []
        for w in c['words']:
            orig = words.get(round(w['s'], 3))
            toks.append(orig if orig and orig.upper() == w['t'] else w['t'] if w['t'][0].isdigit() else w['t'].capitalize())
        if toks and toks[0][0].isalpha() and toks[0][0].islower() and (i == 1 or tl['captions'][i - 2]['words'][-1]['t'][-1] in '.?!'):
            toks[0] = toks[0][0].upper() + toks[0][1:]
        text = ' '.join(toks) + (f" {c['emoji']}" if c['emoji'] else '')
        blocks.append(f"{i}\n{ts(c['s'])} --> {ts(c['e'])}\n{text}\n")
    (OUT / 'subtitles.srt').write_text('\n'.join(blocks))
    (OUT / 'caption.txt').write_text(CAPTION)
    print(f'wrote voiceover.txt ({len(vo.split())} words), subtitles.srt ({len(blocks)} cues), caption.txt')


if __name__ == '__main__':
    main()
