import hashlib
import json
import shutil
import zipfile
from pathlib import Path

from PIL import Image, JpegImagePlugin
from instructions import render

root=Path(__file__).parent
out=root.parents[1]/'output/cartes/torg/menaces-aysle'
replay=root/'rejeu'
source=root/'Cartes Menaces (v1).pdf'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((out/'manifest.json').read_text(encoding='utf-8'))
recipe=json.loads((out/'recipe.json').read_text(encoding='utf-8'))
assert sha(source)==recipe['sources'][0]['sha256']
assert len(recipe['cards'])==62
assert {c['page'] for c in recipe['cards']}==set(range(1,63))
assert len(manifest['cards'])==60 and len(manifest['decks'])==30
assert {c['page'] for c in manifest['ignored']}=={1,2}
assert {c['page'] for c in manifest['cards']}==set(range(3,63))
assert set(manifest['decks'])==set(recipe['start_indices'])
checks=[]
def check_jpeg(path):
    assert path.read_bytes().startswith(b'\xff\xd8\xff')
    with Image.open(path) as im:
        assert im.format=='JPEG' and im.mode=='RGB' and im.size==(721,1323)
        assert JpegImagePlugin.get_sampling(im)==0
        im.load()
for deck in recipe['start_indices']:
    assert recipe['start_indices'][deck]==0
    assert {p.name for p in (out/deck).iterdir()}=={'0.jpg','back.jpg'}
    stats=manifest['decks'][deck]
    assert stats['faces']==1 and stats['start_index']==stats['end_index']==0
    rows=[c for c in manifest['cards'] if c['deck']==deck]
    assert [c['role'] for c in rows]==['face','back']
    assert rows[1]['page']==rows[0]['page']+1
    for c in rows:
        path=out/c['output']
        check_jpeg(path)
        assert c['rotate_cw']==0 and c['orientation_verified'] is True
        assert c['size_pixels']==[721,1323]
        assert sha(path)==c['sha256']==sha(replay/c['output'])
        checks.append({'file':c['output'],'page':c['page'],'sha256':sha(path),'replay_identical':True})
assert len(checks)==60
for name in ('recipe.json','manifest.json'):
    assert (out/name).read_bytes()==(replay/name).read_bytes()
supplements=render(out/'recipe.json',source,out)
supplement_replay=render(replay/'recipe.json',source,replay)
assert supplements==supplement_replay and len(supplements)==2
for row in supplements:
    check_jpeg(out/row['output'])
    assert sha(out/row['output'])==sha(replay/row['output'])==row['sha256']
report={'status':'passed','date':'2026-11-08','source_sha256':sha(source),
    'source_pages':62,'covered_pages':62,'threat_pairs':30,'illustrated_fronts':30,'distinct_stat_backs':30,
    'card_jpegs':60,'instruction_jpegs':2,'replay_identical_card_jpegs':60,'replay_identical_instruction_jpegs':2,
    'decks':manifest['decks'],'labels':recipe['deck_labels'],
    'format':'JPEG RGB; quality 95; 4:4:4; PDF rendered at 300 dpi',
    'visual_checks':'Both source sheets and both final preview sheets inspected; all 30 final stat backs inspected at full resolution in eight sheets; first illustrated front and the Charybde pair opened separately. All text upright; complete card borders retained.',
    'source_notes':['Pages 13–14 form the Charybde pair, but the original verso prints CHARYB. Both original spellings preserved.',
        'Some original numeric labels overlap adjacent text. Original PDF rendering preserved without retouching.',
        'Pages 1–2 are instructions, exported separately rather than treated as threats.'],
    'runtime':{'pymupdf':manifest['pymupdf_version'],'pillow':manifest['pillow_version']},
    'extractor':json.loads((root/'extractor.json').read_text(encoding='utf-8')),
    'cards':checks,'instructions':supplements}
(out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
reproduction=out/'reproduction'
reproduction.mkdir(exist_ok=False)
shutil.copyfile(root/'cards-windows.py',reproduction/'cards.py')
shutil.copyfile(root/'instructions.py',reproduction/'instructions.py')
(out/'README.txt').write_text('Menaces d’Aysle — extraction vérifiée le 08/11/2026\n\n'
    '30 menaces, chacune dans son dossier : 0.jpg pour le recto illustré destiné aux joueurs, back.jpg pour le verso de statistiques du meneur.\n'
    '60 JPEG de cartes et 2 JPEG d’instructions (instructions/recto.jpg et instructions/verso.jpg).\n'
    'Les préfixes 01 à 30 des dossiers préservent l’ordre du PDF. Chaque numérotation commence à 0 selon le choix de David.\n'
    '62 empreintes SHA-256 identiques après deux extractions. Aucun verso distinct regroupé ou supprimé.\n'
    'Les coquilles et chevauchements du PDF source sont conservés. Charybde est nommé CHARYB sur son verso original.\n\n'
    'Rejeu avec Python, PyMuPDF 2.0 et Pillow 12.1.1 :\n'
    'python reproduction/cards.py extract recipe.json --source s0 "CHEMIN_DU_PDF_SOURCE.pdf" --out "menaces-rejouees"\n'
    'python reproduction/instructions.py recipe.json --source "CHEMIN_DU_PDF_SOURCE.pdf" --out "menaces-rejouees"\n'
    'La première commande recrée les cartes et le ZIP voisin ; la seconde ajoute les instructions au dossier.\n'
    'Le dossier de sortie et le ZIP voisin doivent être inexistants avant la première commande.\n',encoding='utf-8')
files=sorted(p for p in out.rglob('*') if p.is_file())
(out/'SHA256SUMS.txt').write_text(''.join(f'{sha(p)}  {p.relative_to(out).as_posix()}\n' for p in files),encoding='utf-8')
files=sorted(p for p in out.rglob('*') if p.is_file())
archive=out.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for p in files:
        info=zipfile.ZipInfo(p.relative_to(out).as_posix(),date_time=(2026,1,1,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,p.read_bytes())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist())=={p.relative_to(out).as_posix() for p in files}
    assert not any(n.lower().endswith(('.pdf','.png','.tmp')) for n in z.namelist())
    assert len([n for n in z.namelist() if n.endswith('/0.jpg')])==30
    assert len([n for n in z.namelist() if n.endswith('/back.jpg')])==30
    assert len([n for n in z.namelist() if n.startswith('instructions/') and n.endswith('.jpg')])==2
    for p in files:
        assert hashlib.sha256(z.read(p.relative_to(out).as_posix())).hexdigest()==sha(p)
print(json.dumps({'status':'passed','archive':str(archive),'bytes':archive.stat().st_size,
    'archive_sha256':sha(archive),'threat_pairs':30,'card_jpegs':60,'instruction_jpegs':2,'replay_identical':62,'archive_files':len(files)}))
