from pathlib import Path
import hashlib
import json
import pypdfium2 as pdfium

root = Path(__file__).resolve().parents[2]
source = root / 'docs/Reference/Pénombre/Feuille de personnage standard WEB.pdf'
out = root / 'output/studio/penombre/2026-11-22'
out.mkdir(parents=True, exist_ok=True)
doc = pdfium.PdfDocument(source)
assert len(doc) == 1
page = doc[0]
width, height = page.get_size()
image = page.render(scale=2).to_pil().convert('RGB')
image.save(out / 'fiche-source.png')
(out / 'geometrie-source.json').write_text(json.dumps({
    'width': width, 'height': height, 'pixels': list(image.size),
    'moteur': 'PDFium',
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'imageSha256': hashlib.sha256((out / 'fiche-source.png').read_bytes()).hexdigest(),
}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'width': width, 'height': height, 'pixels': list(image.size)}))
