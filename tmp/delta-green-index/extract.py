from pathlib import Path
import pdfplumber, pypdfium2 as pdfium
from PIL import Image,ImageOps,ImageDraw
root=Path('docs/Reference/Delta Green'); dest=Path('tmp/delta-green-index')
for kind in ['TOC','Index']:
 p=root/f'dgmanuel_de_lagent_{kind}.pdf'
 with pdfplumber.open(p) as doc:
  for i,page in enumerate(doc.pages):
   print(kind,i+1,'size',page.width,page.height)
   (dest/f'{kind}-{i+1}-layout.txt').write_text(page.extract_text(layout=True),encoding='utf8')
   chars=[c for c in page.chars if c['text'].strip()][:8]
   print([(c['text'],round(c['x0'],1),round(c['top'],1)) for c in chars])
 pdf=pdfium.PdfDocument(p)
 for i in range(len(pdf)):
  image=pdf[i].render(scale=1.7).to_pil()
  image.save(dest/f'{kind}-{i+1}.png')
