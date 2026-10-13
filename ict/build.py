"""Assemble ict/ict.html: src/ict.src.html + src/js/*.js (in name order) + Montserrat + timeline/cue data.

The result is one self-contained file; seek(t) draws the frame at time t (seconds).
Usage: python3 ict/build.py
"""
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent


def main():
    src = (ROOT / 'src' / 'ict.src.html').read_text()
    js = '\n'.join(f'// ---- {p.name}\n' + p.read_text() for p in sorted((ROOT / 'src' / 'js').glob('*.js')))
    font = base64.b64encode((ROOT / 'fonts' / 'Montserrat-Variable.ttf').read_bytes()).decode()
    data = {'timeline': json.loads((ROOT / 'data' / 'timeline.json').read_text()),
            'cues': json.loads((ROOT / 'data' / 'cues.json').read_text())}
    html = src.replace('/*FONT*/', font).replace('/*DATA*/', json.dumps(data)).replace('/*JS*/', js)
    (ROOT / 'ict.html').write_text(html)
    print('wrote', ROOT / 'ict.html', f'({len(html) // 1024} KB)')


if __name__ == '__main__':
    main()
