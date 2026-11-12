from pathlib import Path
from PIL import Image,ImageDraw
import pypdfium2 as pdfium, pdfplumber
refdir=Path('docs/Reference/Delta Green'); out=Path('tmp/delta-green-studio')
imgs=[]
for p in sorted(refdir.glob('*.png')):
 im=Image.open(p).convert('RGB');print(p.name,im.size)
 im.thumbnail((640,500)); tile=Image.new('RGB',(660,540),'#d0d0d0');tile.paste(im,((660-im.width)//2,25));ImageDraw.Draw(tile).text((10,520),p.name,fill='black');imgs.append(tile)
sheet=Image.new('RGB',(1320,1080),'white')
for i,im in enumerate(imgs):sheet.paste(im,((i%2)*660,(i//2)*540))
sheet.save(out/'references.jpg')
pdf=pdfium.PdfDocument(refdir/'dgmanuel_de_lagent_PJ.pdf')
with pdfplumber.open(refdir/'dgmanuel_de_lagent_PJ.pdf') as doc:
 print('PJ pages',len(doc.pages))
 for i,p in enumerate(doc.pages):
  print('PAGE',i+1,p.width,p.height)
  (out/f'fiche-{i+1}.txt').write_text(p.extract_text(layout=True),encoding='utf8')
  pdf[i].render(scale=1.8).to_pil().save(out/f'fiche-{i+1}.png')
