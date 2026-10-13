"""Render ict/ict.html with Playwright: stills, contact sheets and video.

  python3 ict/render/frames.py stills OUT_DIR T [T ...] [--clean] [--sub N]
  python3 ict/render/frames.py sheet OUT.png T0 T1 STEP [--clean] [--cols 6]
  python3 ict/render/frames.py video OUT.mp4 [--from A --to B] [--clean] [--sub 4] [--workers 4] [--audio WAV]

Each frame is seek(t) with t = (k + 0.5) / 30 for frame k, so frame k shows the middle of its
interval. Video segments render in parallel processes as lossless intermediates, then they
are concatenated and encoded to H.264 (yuv420p, BT.709) with the soundtrack.
"""
import argparse
import base64
import io
import pathlib
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = (ROOT / 'ict.html').as_uri()
CHROME = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'
FPS = 30


def open_page(p):
    b = p.chromium.launch(executable_path=CHROME, args=['--force-color-profile=srgb', '--font-render-hinting=none',
                                                         '--disable-lcd-text', '--disable-gpu'])
    page = b.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(HTML)
    page.wait_for_function('window.READY === true', timeout=60000)
    if errors:
        raise SystemExit('page errors: ' + '\n'.join(errors))
    return b, page, errors


def shot(page, cdp, t, ui, sub):
    page.evaluate(f'seek({t!r}, {{ui: {"true" if ui else "false"}, sub: {sub}}})')
    r = cdp.send('Page.captureScreenshot', {'format': 'png', 'optimizeForSpeed': True,
                                            'clip': {'x': 0, 'y': 0, 'width': 1080, 'height': 1920, 'scale': 1}})
    return base64.b64decode(r['data'])


def cmd_stills(a):
    from playwright.sync_api import sync_playwright
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b, page, errors = open_page(p)
        cdp = page.context.new_cdp_session(page)
        for t in a.times:
            t0 = time.time()
            png = shot(page, cdp, float(t), not a.clean, a.sub)
            name = a.names.pop(0) if a.names else f't{float(t):07.3f}.png'
            (out / name).write_bytes(png)
            print(f'{name}  {time.time() - t0:.2f}s')
        if errors:
            print('page errors:', errors)
        b.close()


def cmd_sheet(a):
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageDraw
    times = []
    t = a.t0
    while t <= a.t1 + 1e-9:
        times.append(round(t, 3))
        t += a.step
    cols = a.cols
    tw, th = 270, 480
    rows = (len(times) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * (th + 26)), (12, 12, 16))
    d = ImageDraw.Draw(sheet)
    with sync_playwright() as p:
        b, page, errors = open_page(p)
        cdp = page.context.new_cdp_session(page)
        for k, t in enumerate(times):
            im = Image.open(io.BytesIO(shot(page, cdp, t, not a.clean, a.sub))).convert('RGB').resize((tw, th), Image.LANCZOS)
            x, y = (k % cols) * tw, (k // cols) * (th + 26)
            sheet.paste(im, (x, y + 26))
            d.text((x + 6, y + 6), f'{t:.2f}s', fill=(255, 220, 120))
        b.close()
    sheet.save(a.out)
    print('wrote', a.out, len(times), 'frames')


def render_segment(job):
    k0, k1, idx, seg_dir, ui, sub = job
    from playwright.sync_api import sync_playwright
    out = pathlib.Path(seg_dir) / f'seg{idx:02d}.mkv'
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'png',
                           '-i', '-', '-c:v', 'libx264rgb', '-preset', 'ultrafast', '-crf', '0', str(out)], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b, page, errors = open_page(p)
        cdp = page.context.new_cdp_session(page)
        for k in range(k0, k1):
            ff.stdin.write(shot(page, cdp, (k + 0.5) / FPS, ui, sub))
        b.close()
    ff.stdin.close()
    if ff.wait() != 0:
        raise RuntimeError(f'ffmpeg failed on segment {idx}')
    return str(out)


def cmd_video(a):
    dst = pathlib.Path(a.out)
    seg_dir = ROOT / 'out' / 'segments' / dst.stem
    seg_dir.mkdir(parents=True, exist_ok=True)
    for f in seg_dir.glob('seg*.mkv'):
        f.unlink()
    k0, k1 = int(round(a.start * FPS)), int(round(a.end * FPS))
    n = k1 - k0
    w = max(1, min(a.workers, n))
    cuts = [k0 + round(i * n / w) for i in range(w + 1)]
    jobs = [(cuts[i], cuts[i + 1], i, str(seg_dir), not a.clean, a.sub) for i in range(w)]
    t0 = time.time()
    with ProcessPoolExecutor(w) as ex:
        segs = list(ex.map(render_segment, jobs))
    print(f'rendered {n} frames ({a.sub} sub-frames each) in {time.time() - t0:.0f}s')
    lst = seg_dir / 'list.txt'
    lst.write_text(''.join(f"file '{s}'\n" for s in segs))
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst)]
    if a.audio:
        cmd += ['-ss', f'{a.start:.6f}', '-t', f'{n / FPS:.6f}', '-i', a.audio, '-map', '0:v', '-map', '1:a',
                '-c:a', 'aac', '-b:a', '256k', '-ar', '48000']
    cmd += ['-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
            '-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-profile:v', 'high', '-level', '4.2',
            '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
            '-r', str(FPS), '-movflags', '+faststart', str(dst)]
    subprocess.run(cmd, check=True)
    print('wrote', dst)


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest='cmd', required=True)
    s = sp.add_parser('stills'); s.add_argument('out'); s.add_argument('times', nargs='+')
    s.add_argument('--clean', action='store_true'); s.add_argument('--sub', type=int, default=1)
    s.add_argument('--names', nargs='*', default=[])
    s = sp.add_parser('sheet'); s.add_argument('out'); s.add_argument('t0', type=float); s.add_argument('t1', type=float)
    s.add_argument('step', type=float); s.add_argument('--clean', action='store_true'); s.add_argument('--cols', type=int, default=6)
    s.add_argument('--sub', type=int, default=1)
    s = sp.add_parser('video'); s.add_argument('out'); s.add_argument('--from', dest='start', type=float, default=0.0)
    s.add_argument('--to', dest='end', type=float, default=50.0); s.add_argument('--clean', action='store_true')
    s.add_argument('--sub', type=int, default=4); s.add_argument('--workers', type=int, default=4)
    s.add_argument('--audio'); s.add_argument('--crf', type=int, default=16)
    a = ap.parse_args()
    if a.cmd == 'stills':
        a.names = list(a.names)
        cmd_stills(a)
    elif a.cmd == 'sheet':
        cmd_sheet(a)
    else:
        cmd_video(a)


if __name__ == '__main__':
    sys.exit(main())
