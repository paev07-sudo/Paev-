"""One-page storyboard of the 10 key images (5 x 2), with the scene number, name and time span.

Usage: python3 ict/tools/storyboard.py      (reads out/images/scene*.png, writes out/images/storyboard.png)
"""
import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
NAMES = ['Hook', 'The problem', 'Liquidity', 'Step 1: sweep', 'Step 2: shift', 'Step 3: gap', 'Entry',
         'Risk & target', 'Payoff', 'Outro']


def main():
    imgs = sorted((ROOT / 'out' / 'images').glob('scene*.png'))
    sc = json.loads((ROOT / 'data' / 'cues.json').read_text())['scenes']
    tw, th, pad, head = 360, 640, 18, 70
    sheet = Image.new('RGB', (5 * tw + 6 * pad, 2 * (th + head) + 3 * pad), (6, 8, 16))
    d = ImageDraw.Draw(sheet)
    font = ImageFont.truetype(str(ROOT / 'fonts' / 'Montserrat-Variable.ttf'), 22)
    font.set_variation_by_axes([800])
    small = ImageFont.truetype(str(ROOT / 'fonts' / 'Montserrat-Variable.ttf'), 18)
    small.set_variation_by_axes([600])
    for k, p in enumerate(imgs[:10]):
        x = pad + (k % 5) * (tw + pad)
        y = pad + (k // 5) * (th + head + pad)
        d.text((x, y + 6), f'{k + 1:02d}  {NAMES[k].upper()}', font=font, fill=(255, 195, 0))
        d.text((x, y + 38), f'{sc[k][0]:.2f}s - {sc[k][1]:.2f}s', font=small, fill=(0, 229, 255))
        sheet.paste(Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + head))
    out = ROOT / 'out' / 'images' / 'storyboard.png'
    sheet.save(out)
    print('wrote', out)


if __name__ == '__main__':
    main()
