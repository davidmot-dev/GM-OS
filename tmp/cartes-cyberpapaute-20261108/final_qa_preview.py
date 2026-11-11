import json
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).parent
out=root.parents[1]/'output/cartes/torg/cyberpapaute'
cards=[c for c in json.loads((out/'manifest.json').read_text(encoding='utf-8'))['cards'] if c['rotate_cw'] and c.get('output')]
assert len(cards)==17
for offset in range(0,len(cards),4):
    batch=cards[offset:offset+4]
    sheet=Image.new('RGB',(1510,((len(batch)+1)//2)*1075),'#e6e6e6')
    draw=ImageDraw.Draw(sheet)
    for i,c in enumerate(batch):
        x,y=(i%2)*755,(i//2)*1075
        with Image.open(out/c['output']) as im:
            assert im.size==(745,1040)
            sheet.paste(im,(x+5,y+30))
        draw.text((x+5,y+8),c['output'],fill='black')
    sheet.save(root/f'final-rotated-{offset//4+1:02d}.png')
