"""Contact sheets from out/beats/bNN.png: 4 sheets of 20 beats (5 bars each), 4 columns = 1 bar per row.

Usage: python3 render/contact.py out/beats out/sheets
"""
import pathlib
import sys
from PIL import Image, ImageDraw, ImageFont

src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
TH = 400
font = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 22)
for s in range(4):
    sheet = Image.new('RGB', (4 * TH + 5 * 8, 5 * TH + 6 * 8), '#888')
    d = ImageDraw.Draw(sheet)
    for k in range(20):
        n = s * 20 + k
        im = Image.open(src / f'b{n:02d}.png').convert('RGB').resize((TH, TH), Image.LANCZOS)
        x, y = 8 + (k % 4) * (TH + 8), 8 + (k // 4) * (TH + 8)
        sheet.paste(im, (x, y))
        d.rectangle((x, y, x + 92, y + 30), fill='#111')
        d.text((x + 8, y + 4), f'{n // 4 + 1}.{n % 4 + 1}', font=font, fill='#fff')
    sheet.save(dst / f'sheet{s + 1}.png')
print('ok')
