import hashlib
import json
import sys
from pathlib import Path
from pypdf import PdfReader

source = Path(sys.argv[1])
reader = PdfReader(source)
pages = []
for numero, page in enumerate(reader.pages, 1):
    largeur, hauteur = float(page.mediabox.width), float(page.mediabox.height)
    regions = []
    for valeurs, op in page.get_contents().operations:
        if op != b're' or len(valeurs) != 4:
            continue
        x, y, w, h = map(float, valeurs)
        if not (169 < w < 171 and 319 < h < 322):
            continue
        if any(max(abs(a-b) for a,b in zip((x,y,w,h), r)) < 0.02 for r in regions):
            continue
        regions.append((x,y,w,h))
    regions.sort(key=lambda r: (-round(r[1], 1), r[0]))
    assert len(regions) == 6, (numero, regions)
    pages.append({'page':numero,'role':'dos' if numero==1 else 'faces',
                  'regions':[{'points_pdf':[x,y,w,h], 'bbox':[x/largeur,(hauteur-y-h)/hauteur,(x+w)/largeur,(hauteur-y)/hauteur]} for x,y,w,h in regions]})
out = Path('tmp/cartes-tarot-ombres/geometrie-preparee.json')
out.write_text(json.dumps({'source':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
                          'ordre':'pages puis ligne du haut de gauche à droite, puis ligne du bas de gauche à droite',
                          'faces':78,'dos':1,'repetitions_dos':5,'depart_non_renseigne':True,'pages':pages},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Géométrie préparée : {len(pages)} pages, 84 régions, dont 78 faces et 6 exemplaires du dos. Aucun export numéroté.')
