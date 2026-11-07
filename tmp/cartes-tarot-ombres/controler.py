import hashlib
import json
from collections import Counter
from pathlib import Path
from PIL import Image, ImageDraw, JpegImagePlugin

sortie = Path('output/cartes/les-lames-du-cardinal/tarot-des-ombres')
temp = Path('tmp/cartes-tarot-ombres')
manifest = json.loads((sortie / 'manifest.json').read_text(encoding='utf-8'))
assert manifest['dpi'] == 300 and manifest['jpeg_quality'] == 95 and manifest['jpeg_subsampling'] == 0
assert manifest['start_indices'] == {'tarot-des-ombres':1} and manifest['numbering_confirmed']
assert manifest['decks']['tarot-des-ombres'] == {'faces':78,'start_index':1,'end_index':78,'back':'tarot-des-ombres/back.jpg'}
exportees = [c for c in manifest['cards'] if c['output']]
assert len(exportees) == 79
assert len([c for c in manifest['cards'] if c['role']=='duplicate-back']) == 5
assert {c['page'] for c in manifest['cards']} == set(range(1,15))
assert {p.name for p in (sortie / 'tarot-des-ombres').glob('*.jpg')} == {'back.jpg'} | {f'{n}.jpg' for n in range(1,79)}
dimensions = Counter()
for carte in exportees:
    chemin = sortie / carte['output']
    assert hashlib.sha256(chemin.read_bytes()).hexdigest() == carte['sha256']
    assert chemin.read_bytes().startswith(b'\xff\xd8\xff')
    with Image.open(chemin) as im:
        assert im.format == 'JPEG' and im.mode == 'RGB' and JpegImagePlugin.get_sampling(im) == 0
        assert list(im.size) == carte['size_pixels']
        assert im.width >= 700 and im.height >= 1300
        dimensions[f'{im.width}x{im.height}'] += 1
        im.verify()
planches = temp / 'revue-grand-format'
planches.mkdir(exist_ok=True)
for page in range(2,15):
    cartes = [c for c in exportees if c['page']==page]
    assert len(cartes)==6
    largeur = max(c['size_pixels'][0] for c in cartes) + 24
    hauteur = max(c['size_pixels'][1] for c in cartes) + 36
    planche = Image.new('RGB', (3*largeur,2*hauteur), '#d6d6d6')
    draw = ImageDraw.Draw(planche)
    for n, carte in enumerate(cartes):
        x,y=(n%3)*largeur,(n//3)*hauteur
        draw.text((x+10,y+6),f"Page {page} - {Path(carte['output']).name}",fill='black')
        with Image.open(sortie / carte['output']) as im:
            planche.paste(im,(x+12,y+28))
    planche.save(planches / f'page-{page:02d}.jpg',quality=92,subsampling=0)
rapport = {'faces':78,'dos':1,'plage':[1,78],'pagesSource':14,'regions':84,'repetitionsDosDocumentees':5,
           'JPEG_verifies':79,'dpi':300,'qualiteJPEG':95,'sousEchantillonnage':'4:4:4',
           'dimensionsPixels':dict(dimensions),'controleVisuelTermine':False,
           'sourcePDFNonIncluse':True,'scriptPublication':json.loads((temp / 'extracteur.json').read_text(encoding='utf-8'))}
(temp / 'controles.json').write_text(json.dumps(rapport,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(rapport,ensure_ascii=False))
