import hashlib
import json
import shutil
import zipfile
from pathlib import Path

import fitz
from PIL import Image, JpegImagePlugin

root = Path(__file__).parent
out = root.parents[1]/'output/cartes/torg/terre-vivante'
replay = root/'rejeu'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((out/'manifest.json').read_text(encoding='utf-8'))
recipe=json.loads((out/'recipe.json').read_text(encoding='utf-8'))
source=root/'Paquet Bonus Terre Vivante (v1).pdf'
assert sha(source)==recipe['sources'][0]['sha256']
expected={'action':(120,40,(1040,745)), 'cosm-terre-vivante':(10,10,(745,1040)), 'destin':(71,5,(745,1040))}
assert len(recipe['cards'])==110
assert {c['page'] for c in recipe['cards']}==set(range(1,111))
assert {c['page'] for c in manifest['cards']}==set(range(1,111))
checks=[]
for deck,(start,count,size) in expected.items():
    assert {p.name for p in (out/deck).iterdir()}=={'back.jpg'}|{f'{i}.jpg' for i in range(start,start+count)}
    assert manifest['decks'][deck]['faces']==count
    assert manifest['decks'][deck]['start_index']==start
    assert manifest['decks'][deck]['end_index']==start+count-1
    rows=[c for c in manifest['cards'] if c['deck']==deck and c.get('output')]
    assert len(rows)==count+1
    for c in rows:
        p=out/c['output']
        assert p.read_bytes().startswith(b'\xff\xd8\xff')
        assert sha(p)==c['sha256']==sha(replay/c['output'])
        assert c['rotate_cw']==0 and c['orientation_verified'] is True
        with Image.open(p) as im:
            assert im.format=='JPEG' and im.mode=='RGB' and im.size==size
            assert list(im.size)==c['size_pixels']
            assert JpegImagePlugin.get_sampling(im)==0
            im.load()
        checks.append({'file':c['output'],'sha256':sha(p),'replay_identical':True})
assert len(checks)==58
pdf=fitz.open(source)
pixels=lambda page: hashlib.sha256(pdf[page-1].get_pixmap(dpi=300,colorspace=fitz.csRGB,alpha=False).samples).hexdigest()
references={deck:pixels(page) for deck,page in [('action',2),('cosm-terre-vivante',82),('destin',102)]}
duplicates=[c for c in recipe['cards'] if c['role']=='duplicate-back']
assert len(duplicates)==52
for c in duplicates:
    assert pixels(c['page'])==references[c['deck']]
pdf.close()
for name in ('recipe.json','manifest.json'):
    assert (out/name).read_bytes()==(replay/name).read_bytes()
report={'status':'passed','date':'2026-11-08','source_sha256':sha(source),'source_pages':110,'covered_pages':110,
    'faces':55,'distinct_backs':3,'jpeg_cards':58,'replay_identical_jpeg_count':58,
    'duplicate_backs_identical_at_300dpi':52,'decks':manifest['decks'],
    'format':'JPEG RGB; quality 95; 4:4:4; PDF rendered at 300 dpi',
    'visual_checks':'All four source contact sheets, both final preview sheets, one full-resolution face and each back inspected. Main text and logos upright. Complete card borders retained. No rotations or crops required.',
    'limitations':['Raster illustrations and back textures retain their original source resolution; 300 dpi rendering adds no missing raster detail.'],
    'runtime':{'pymupdf':manifest['pymupdf_version'],'pillow':manifest['pillow_version']},
    'extractor':json.loads((root/'extractor.json').read_text(encoding='utf-8')),'files':checks}
(out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
reproduction=out/'reproduction'
reproduction.mkdir(exist_ok=False)
shutil.copyfile(root/'cards-windows.py',reproduction/'cards.py')
(out/'README.txt').write_text('Terre Vivante — extraction vérifiée le 08/11/2026\n\n'
    'Action : 120.jpg à 159.jpg et back.jpg (paysage).\n'
    'Cosm Terre Vivante : 10.jpg à 19.jpg et back.jpg (portrait).\n'
    'Destin : 71.jpg à 75.jpg et back.jpg (portrait).\n\n'
    'Les noms suivent les départs demandés ; les numéros imprimés restent inchangés.\n'
    '58 JPEG identiques lors de deux extractions indépendantes.\n'
    'Les 110 pages sont couvertes ; 52 répétitions de dos regroupées, aucune face supprimée.\n'
    'Les détails raster restent limités par la résolution du PDF source.\n\n'
    'Rejeu avec Python, PyMuPDF 2.0 et Pillow 12.1.1 :\n'
    'python reproduction/cards.py extract recipe.json --source s0 "CHEMIN_DU_PDF_SOURCE.pdf" --out "terre-vivante-rejoue"\n'
    'Le dossier de sortie et le ZIP voisin doivent être inexistants.\n',encoding='utf-8')
all_files=sorted(p for p in out.rglob('*') if p.is_file())
(out/'SHA256SUMS.txt').write_text(''.join(f'{sha(p)}  {p.relative_to(out).as_posix()}\n' for p in all_files),encoding='utf-8')
all_files=sorted(p for p in out.rglob('*') if p.is_file())
archive=out.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for p in all_files:
        info=zipfile.ZipInfo(p.relative_to(out).as_posix(),date_time=(2026,1,1,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,p.read_bytes())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist())=={p.relative_to(out).as_posix() for p in all_files}
    assert not any(n.lower().endswith(('.pdf','.png','.tmp')) for n in z.namelist())
    assert len([n for n in z.namelist() if n.endswith('.jpg') and '/' in n])==58
    for p in all_files:
        assert hashlib.sha256(z.read(p.relative_to(out).as_posix())).hexdigest()==sha(p)
print(json.dumps({'status':'passed','archive':str(archive),'bytes':archive.stat().st_size,
    'archive_sha256':sha(archive),'jpeg_cards':58,'replay_identical':58,'archive_files':len(all_files)}))
