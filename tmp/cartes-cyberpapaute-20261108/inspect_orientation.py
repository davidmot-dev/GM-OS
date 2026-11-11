from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).parent/'inspection'
pages=list(range(81,111,2))+[82,102]
for offset in range(0,len(pages),12):
    batch=pages[offset:offset+12]
    sheet=Image.new('RGB',(1480,((len(batch)+3)//4)*530),'#e6e6e6')
    draw=ImageDraw.Draw(sheet)
    for i,page in enumerate(batch):
        rotation=90 if page%2 else 270
        with Image.open(root/f's0-p{page:04d}.png') as src:
            im=src.transpose(Image.Transpose.ROTATE_270 if rotation==90 else Image.Transpose.ROTATE_90)
            x,y=(i%4)*370,(i//4)*530
            sheet.paste(im,(x+6,y+25))
            draw.text((x+6,y+6),f'Page {page} / {rotation} CW',fill='black')
    sheet.save(root/f'orientation-{offset//12+1:02d}.png')
