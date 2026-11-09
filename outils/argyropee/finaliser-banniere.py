"""Recadrage et compression ; agrandissement autorisé par David le 08/11/2026."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,shutil

root=Path(__file__).resolve().parents[2]
out=root/'output/gmos-studio/argyropee'
source=Path(r'C:\Users\david\.codex\generated_images\01a1bcea-aefe-7211-8b6f-64fe10b74303\exec-e80a74d3-4a8a-4327-8577-7562d9b04758.png')
shutil.copyfile(source,out/'banniere-generation-brute.png')
im=Image.open(source).convert('RGB')
w,h=im.size
crop_h=w//4;top=(h-crop_h)//2
final=im.crop((0,top,w,top+crop_h)).resize((2400,600),Image.Resampling.LANCZOS)
dest=root/'docs/systems/argyropee/Argyropée Band.jpg'
final.save(dest,quality=92,optimize=True,subsampling=0)
assert dest.stat().st_size<=500_000
font_path=r'C:\Windows\Fonts\arial.ttf'
font=ImageFont.truetype(font_path,18)
preview=Image.new('RGB',(1220,380),'#eeece6');draw=ImageDraw.Draw(preview)
draw.text((16,10),'SIMULATION D’EN-TÊTE — pas une capture GM-OS',font=font,fill='#25251f')
for y,width in [(60,1188),(172,768)]:
    size=(width,54);ratio=max(size[0]/2400,size[1]/600)
    r=final.resize((round(2400*ratio),round(600*ratio)),Image.Resampling.LANCZOS)
    x=(r.width-width)//2;yy=(r.height-54)//2
    band=r.crop((x,yy,x+width,yy+54)).convert('RGBA')
    veil=Image.new('RGBA',band.size,(0,0,0,60));band=Image.alpha_composite(band,veil)
    bdraw=ImageDraw.Draw(band);bdraw.text((15,16),'ARGYROPÉE',font=font,fill='white')
    bdraw.text((width-230,16),'Séance    Dés    Options',font=font,fill='white')
    preview.paste(band.convert('RGB'),(16,y))
    draw.text((16,y+60),f'{width} × 54 px — cover centré',font=font,fill='#25251f')
draw.text((16,300),'Source 2172 × 724 ; agrandissement accepté de 10,5 % ; sortie 2400 × 600.',font=font,fill='#25251f')
preview.save(out/'controles/banniere-entetes.png')
report=dict(sourcePixels=[w,h],recadrage=[0,top,w,top+crop_h],sortiePixels=list(final.size),poidsOctets=dest.stat().st_size,agrandissement=2400/w,accordDavid='2026-11-08 : Oui, livrer en 2400 × 600',outil='image_gen natif ; recadrage, rééchantillonnage et compression Pillow',apercu='Simulation hors GM-OS : 1188 × 54 et 768 × 54, cover centré')
(out/'controles/banniere.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=True))
