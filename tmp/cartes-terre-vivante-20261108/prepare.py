import hashlib
import json
from pathlib import Path

root = Path(__file__).parent
previous = root.parent/'cartes-aysle-20261108'
s = json.loads((root/'inspection/inventory.json').read_text(encoding='utf-8'))['sources'][0]
assert len(s['pages']) == 110
cards = []
for page in range(1,111):
    deck, first_back, fmt = ('action',2,'paysage') if page <= 80 else (('cosm-terre-vivante',82,'portrait') if page <= 100 else ('destin',102,'portrait'))
    role = 'face' if page % 2 else ('back' if page == first_back else 'duplicate-back')
    evidence = f'Inspection visuelle : texte principal et logo à l’endroit sans rotation ; format {fmt}. Carte entière, bordure noire conservée.'
    if role == 'duplicate-back':
        assert s['pages'][page-1]['pixel_sha256'] == s['pages'][first_back-1]['pixel_sha256']
        evidence += f' Dos comparé visuellement et pixels identiques au dos de référence page {first_back} à 144 dpi.'
    cards.append(dict(source='s0',page=page,deck=deck,role=role,bbox=[0,0,1,1],rotate_cw=0,orientation_verified=True,evidence=evidence))
recipe = dict(schema_version=2,dpi=300,start_indices={'action':120,'destin':71,'cosm-terre-vivante':10},numbering_confirmed=True,
    numbering_choice={'user':'David','date':'2026-11-08','answer':'les actions démarre à 120, les destins à 71, cosm à 10'},
    sources=[{k:s[k] for k in ('id','filename','sha256')}],cards=cards,
    order='Source order and increasing page number; one full card per page. Repeated faces retained.',
    geometry_evidence='All 110 source pages visually inspected in all four contact sheets. Pages are finished cards; full page retained. All text upright.',
    provenance='New recipe established from the Paquet Bonus Terre Vivante source after fresh inspection.')
(root/'recipe.json').write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Use the inspected Windows publication adaptation, with unchanged rendering.
original = Path(r'C:\Users\david\.codex\plugins\cache\created-by-me-remote\card-extractor\1.1.0\skills\extract-cards\scripts\cards.py')
adapted = previous/'cards-windows.py'
before=original.read_text(encoding='utf-8')
after=adapted.read_text(encoding='utf-8')
head,tail=before.split('        stage.rename(out)')
assert after.startswith(head) and after.endswith(tail)
assert 'shutil.copytree(stage, out)' in after and 'sha(file) != sha(out / file.relative_to(stage))' in after
(root/'cards-windows.py').write_bytes(adapted.read_bytes())
metadata={'original_sha256':hashlib.sha256(original.read_bytes()).hexdigest(),
    'adapted_sha256':hashlib.sha256(adapted.read_bytes()).hexdigest(),
    'adaptation':'Only stage.rename(out) replaced by copytree with SHA-256 equality checks. Rendering unchanged.'}
(root/'extractor.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'source_sha256':s['sha256'],'pages':110,'start_indices':recipe['start_indices']}))
