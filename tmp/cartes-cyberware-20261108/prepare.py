import hashlib
import json
from pathlib import Path

root=Path(__file__).parent
s=json.loads((root/'inspection/inventory.json').read_text(encoding='utf-8'))['sources'][0]
assert len(s['pages'])==110
assert s['identical_page_groups']==[list(range(2,111,2))]
cards=[]
for page in range(1,111):
    role='face' if page%2 else ('back' if page==2 else 'duplicate-back')
    evidence='Carte Cyberware portrait entière ; texte principal et logo à l’endroit sans rotation. Bordure noire conservée.'
    if role=='duplicate-back':
        assert s['pages'][page-1]['pixel_sha256']==s['pages'][1]['pixel_sha256']
        evidence+=' Dos comparé visuellement et pixels identiques au dos de référence page 2 à 144 dpi.'
    cards.append(dict(source='s0',page=page,deck='cyberware',role=role,bbox=[0,0,1,1],rotate_cw=0,orientation_verified=True,evidence=evidence))
recipe=dict(schema_version=2,dpi=300,start_indices={'cyberware':0},numbering_confirmed=True,
    numbering_choice={'user':'David','date':'2026-11-08','answer':'fais ce paquet comme à 0','interpretation':'Numérotation des faces Cyberware à partir de 0.'},
    sources=[{k:s[k] for k in ('id','filename','sha256')}],cards=cards,
    order='Source order and increasing page number; one full card per page. All repeated faces retained.',
    geometry_evidence='All 110 source pages inspected in all four contact sheets. First face and reference back opened separately. Finished card format; entire page retained; all cards upright.',
    provenance='New recipe established from the Cyberware Deck source after fresh inspection.')
(root/'recipe.json').write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
original=Path(r'C:\Users\david\.codex\plugins\cache\created-by-me-remote\card-extractor\1.1.0\skills\extract-cards\scripts\cards.py')
adapted=root.parent/'cartes-cyberpapaute-20261108/cards-windows.py'
head,tail=original.read_text(encoding='utf-8').split('        stage.rename(out)')
after=adapted.read_text(encoding='utf-8')
assert after.startswith(head) and after.endswith(tail)
assert 'shutil.copytree(stage, out)' in after and 'sha(file) != sha(out / file.relative_to(stage))' in after
(root/'cards-windows.py').write_bytes(adapted.read_bytes())
metadata={'original_sha256':hashlib.sha256(original.read_bytes()).hexdigest(),'adapted_sha256':hashlib.sha256(adapted.read_bytes()).hexdigest(),
    'adaptation':'Only stage.rename(out) replaced by copytree with SHA-256 equality checks. Rendering unchanged.'}
(root/'extractor.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':110,'faces':55,'source_sha256':s['sha256'],'start_indices':recipe['start_indices']}))
