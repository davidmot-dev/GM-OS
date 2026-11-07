from PIL import Image, ImageDraw, ImageOps
from pathlib import Path
out = Path('tmp/cartes-tarot-ombres')
sheet = Image.new('RGB', (1080, 1560), '#dddddd')
draw = ImageDraw.Draw(sheet)
for n in range(1, 15):
    with Image.open(out / 'preinspection' / f'page-{n}.png') as im:
        thumb = ImageOps.contain(im.convert('RGB'), (260, 355))
        x, y = ((n-1) % 4) * 270, ((n-1) // 4) * 390
        draw.text((x+8, y+5), f'Page {n}', fill='black')
        sheet.paste(thumb, (x+(270-thumb.width)//2, y+25))
sheet.save(out / 'contact-preinspection.jpg', quality=92)
