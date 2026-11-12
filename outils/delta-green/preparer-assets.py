"""Assets de GM-OS Studio — Delta Green, 12/11/2026."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageDraw, ImageOps

ROOT=Path(__file__).resolve().parents[2]
THEME=ROOT/'docs/systems/delta-green/theme'
ICONS={
 'tableau-de-bord':'<path d="M3 6h7l2 3h9v12H3zM3 6V3h7l2 3h9v3M7 13h10M7 17h6"/>',
 'journal':'<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5M2 7h4M2 12h4M2 17h4"/>',
 'combat':'<path d="m5 3 14 18M19 3 5 21M2 16l6 4m8 0 6-4"/>',
 'des':'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 8h.1M16 8h.1M12 12h.1M8 16h.1M16 16h.1" stroke-width="3"/>',
 'pj':'<path d="M3 4h18v16H3zM7 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM5 17c0-5 8-5 8 0M15 8h3M15 12h3M15 16h3"/>',
 'pnj':'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 4c3 0 4 2 4 5"/>',
 'carte':'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16M6 11l3-3 6 7 3-3"/>',
 'indice':'<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6M7 10h6M10 7v6"/>',
 'sante':'<path d="M4 7h16v14H4zM9 7V3h6v4M9 14h6M12 11v6"/>',
 'horloge':'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M8 2h8M12 2v3"/>',
 'lieu':'<path d="M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Z"/><circle cx="12" cy="9" r="3"/>',
 'scene':'<path d="M3 7h18v14H3zM3 7l2-5h16l-2 5M8 2 6 7M14 2l-2 5M17 7l2-5M7 12h10M7 16h7"/>',
 'oracle':'<path d="M12 3c5 0 9 9 9 9s-4 9-9 9-9-9-9-9 4-9 9-9Z"/><circle cx="12" cy="12" r="3"/>',
 'nexus':'<path d="M3 6h7l2 3h9v12H3zM3 6V3h7l2 3h9v3M8 14h8M8 17h5"/>',
 'voix':'<path d="M7 7h10v14H7zM10 7V3M10 11h4M10 15h4M10 18h4M16 2c4 0 6 2 6 6"/>',
}
(THEME/'icones').mkdir(parents=True,exist_ok=True)
for key,drawing in ICONS.items():
 (THEME/'icones'/f'{key}.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+drawing+'</svg>\n',encoding='utf8')
(THEME/'icones.json').write_text(json.dumps({k:f'icones/{k}.svg' for k in ICONS},ensure_ascii=False,indent=2)+'\n',encoding='utf8')

# L'agrandissement léger a été accepté par David dans la conversation le 12/11.
if len(sys.argv)!=2:
 raise SystemExit('Usage : python -I outils/delta-green/preparer-assets.py <image-native-generee.png>')
raw=Image.open(sys.argv[1]).convert('RGB')
banner=ImageOps.fit(raw,(2400,600),method=Image.Resampling.LANCZOS,centering=(.5,.5))
target=ROOT/'docs/systems/delta-green/Delta Green Band.jpg'
banner.save(target,'JPEG',quality=92,optimize=True)
assert target.stat().st_size<=500000
assert Image.open(target).size==(2400,600)
print('Bannière',target.stat().st_size,'octets',banner.size,'source',raw.size)
# Planche de contrôle : bannière entière puis aperçu cover aux deux largeurs.
canvas=Image.new('RGB',(1200,450),'#182920')
canvas.paste(banner.resize((1200,300)),(0,0))
draw=ImageDraw.Draw(canvas)
for width,y in [(1188,322),(600,391)]:
 crop=ImageOps.fit(banner,(width,54),centering=(.5,.5))
 canvas.paste(crop,(6,y))
 draw.text((20,y+18),'DELTA GREEN',fill='#f2f1e5')
 draw.text((width-130,y+18),'SESSION  |  ...',fill='#f2f1e5')
canvas.save(ROOT/'tmp/delta-green-studio/banniere-controle.jpg')
style=(ROOT/'docs/systems/delta-green/identite-visuelle.txt').read_text(encoding='utf8').splitlines()
assert len(style)==2 and style[0].startswith('STYLE: ') and style[1].startswith('AVOID: ')
assert len(style[0].split()[1:])<=60 and len(style[1].split()[1:])<=15
print('Identité',len(style[0].split()[1:]),'mots STYLE ;',len(style[1].split()[1:]),'mots AVOID')
