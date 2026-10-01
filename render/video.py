"""Final render: 4 sub-frames per frame captured with Playwright, blended with ffmpeg tmix
(motion blur), 60 fps, 1440x1440, muxed with the soundtrack.

Each output frame k is the average of seek(k/60 + (j - 1.5)/480) for j = 0..3 (180° shutter,
centred on the frame time; times wrap around the loop, so frame 0 is blurred exactly like
the frame that would follow the last one). The 240 sub-frames per second are fed to ffmpeg,
which blends each group of 4 with tmix and keeps one frame in 4.

Usage: python3 render/video.py out/krisalis.mp4 [workers] [first last]   (frames are 0..2399)
"""
import base64
import os
import pathlib
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor

import imageio_ffmpeg

ROOT = pathlib.Path(__file__).resolve().parent.parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS, SUB = 60, 4
SHUTTER = 0.5          # fraction of the frame interval covered by the sub-frames (180°)
SEG = ROOT / os.environ.get('KR_SEG', 'out/segments')


def render_segment(args):
    a, b, idx = args
    sys.path.insert(0, str(ROOT / 'render'))
    from playwright.sync_api import sync_playwright
    from stills import open_page
    out = SEG / f'seg{idx:02d}.mkv'
    vf = (f"tmix=frames={SUB}:weights='{' '.join(['1'] * SUB)}',"
          f"select='eq(mod(n\\,{SUB})\\,{SUB - 1})',setpts=N/({FPS}*TB)")
    ff = subprocess.Popen([FF, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS * SUB), '-c:v', 'png', '-i', '-',
                           '-vf', vf, '-r', str(FPS), '-c:v', 'libx264rgb', '-preset', 'ultrafast', '-crf', '0', str(out)],
                          stdin=subprocess.PIPE)
    with sync_playwright() as p:
        br, page = open_page(p)
        cdp = page.context.new_cdp_session(page)
        for k in range(a, b):
            for j in range(SUB):
                t = k / FPS + (j - (SUB - 1) / 2) * SHUTTER / (FPS * SUB)
                page.evaluate(f'seek({t!r})')
                shot = cdp.send('Page.captureScreenshot', {'format': 'png', 'optimizeForSpeed': True})
                ff.stdin.write(base64.b64decode(shot['data']))
        br.close()
    ff.stdin.close()
    if ff.wait() != 0:
        raise RuntimeError(f'ffmpeg failed on segment {idx}')
    return str(out)


def main():
    dst = pathlib.Path(sys.argv[1])
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else 4
    first, last = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (0, 2400)
    SEG.mkdir(parents=True, exist_ok=True)
    for f in SEG.glob('seg*.mkv'):
        f.unlink()
    n = last - first
    cuts = [first + round(i * n / workers) for i in range(workers + 1)]
    jobs = [(cuts[i], cuts[i + 1], i) for i in range(workers)]
    t0 = time.time()
    with ProcessPoolExecutor(workers) as ex:
        segs = list(ex.map(render_segment, jobs))
    print(f'rendered {n} frames x {SUB} sub-frames in {time.time() - t0:.0f}s')
    lst = SEG / 'list.txt'
    lst.write_text(''.join(f"file '{s}'\n" for s in segs))
    audio = ROOT / os.environ.get('KR_AUDIO', 'out/soundtrack.wav')
    cmd = [FF, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst)]
    if first == 0 and last == 2400:
        cmd += ['-i', str(audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k']
    cmd += ['-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-profile:v', 'high',
            '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
            '-r', str(FPS), '-movflags', '+faststart', str(dst)]
    subprocess.run(cmd, check=True)
    print('wrote', dst)


if __name__ == '__main__':
    main()
