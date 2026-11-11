import json
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).parent
out=root.parents[1]/'output/cartes/torg/menaces-cyberpapaute'
backs=[c for c in json.loads((out/'manifest.json').read_text(encoding='utf-8'))['cards'] if c['role']=='back']
with Image.open(out/backs[0]['output']) as im:
    w,h=im.size
for offset in range(0,len(backs),4):
    batch=backs[offset:offset+4]
    sheet=Image.new('RGB',((w+10)*2,((len(batch)+1)//2)*(h+34)),'#e6e6e6')
    draw=ImageDraw.Draw(sheet)
    for i,c in enumerate(batch):
        x,y=(i%2)*(w+10),(i//2)*(h+34)
        with Image.open(out/c['output']) as im:
            sheet.paste(im,(x+5,y+28))
        draw.text((x+5,y+8),c['output'],fill='black')
    sheet.save(root/f'qa-backs-{offset//4+1:02d}.png')
