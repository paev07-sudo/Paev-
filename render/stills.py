"""Render stills of motion/krisalis.html with Playwright.

  python3 render/stills.py beats out/beats          # one frame per beat (+ offset), with HUD
  python3 render/stills.py times out/x 0 12.3 39.99  # arbitrary times
  python3 render/stills.py events out/events.json    # dump the UI sound events
"""
import json
import pathlib
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = (ROOT / 'motion/krisalis.html').as_uri()
CHROME = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'


def open_page(p):
    b = p.chromium.launch(executable_path=CHROME, args=['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'])
    page = b.new_page(viewport={'width': 1440, 'height': 1440}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(HTML)
    page.wait_for_function('window.READY === true', timeout=30000)
    if errors:
        raise SystemExit('page errors: ' + '\n'.join(errors))
    return b, page


def main():
    mode, out = sys.argv[1], pathlib.Path(sys.argv[2])
    with sync_playwright() as p:
        b, page = open_page(p)
        if mode == 'events':
            ev = page.evaluate('({events: window.EVENTS, dur: window.DUR, period: window.PERIOD})')
            out.write_text(json.dumps(ev, indent=1))
            print(len(ev['events']), 'events')
            return
        out.mkdir(parents=True, exist_ok=True)
        if mode == 'beats':
            off = float(sys.argv[3]) if len(sys.argv) > 3 else 0.3
            page.evaluate('window.HUD = true')
            period = page.evaluate('window.PERIOD')
            times = [(f'b{n:02d}', n * period + off) for n in range(80)]
        else:
            page.evaluate('window.HUD = true')
            times = [(f't{float(v):07.3f}', float(v)) for v in sys.argv[3:]]
        for name, t in times:
            page.evaluate(f'seek({t})')
            page.screenshot(path=str(out / f'{name}.png'))
        print('rendered', len(times), 'stills to', out)
        b.close()


if __name__ == '__main__':
    main()
