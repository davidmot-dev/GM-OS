import hashlib
import json
from pathlib import Path

root=Path(__file__).parent
previous=root.parent/'cartes-terre-vivante-20261108'
s=json.loads((root/'inspection/inventory.json').read_text(encoding='utf-8'))['sources'][0]
assert len(s['pages'])==110
cards=[]
for page in range(1,111):
    deck,first_back=('action',2) if page<=80 else (('cosm-cyberpapaute',82) if page<=100 else ('destin',102))
    role='face' if page%2 else ('back' if page==first_back else 'duplicate-back')
    rotation=0 if page<=80 else (90 if page%2 else 270)
    evidence=('Carte Action paysage : titre principal et logo à l’endroit sans rotation.' if page<=80 else
        ('Face portrait : titre et texte principaux à l’endroit après rotation horaire de 90 degrés.' if page%2 else
        'Dos portrait : logo et mot COSM/DESTIN à l’endroit après rotation horaire de 270 degrés.'))
    evidence+=' Carte complète, bordure noire préservée.'
    if role=='duplicate-back':
        assert s['pages'][page-1]['pixel_sha256']==s['pages'][first_back-1]['pixel_sha256']
        evidence+=f' Dos comparé visuellement et pixels identiques au dos de référence page {first_back} à 144 dpi.'
    cards.append(dict(source='s0',page=page,deck=deck,role=role,bbox=[0,0,1,1],rotate_cw=rotation,orientation_verified=True,evidence=evidence))
recipe=dict(schema_version=2,dpi=300,start_indices={'action':160,'destin':76,'cosm-cyberpapaute':10},numbering_confirmed=True,
    numbering_choice={'user':'David','date':'2026-11-08','answer':'les actions démarre à 160, les destins à 76, cosm à 10'},
    sources=[{k:s[k] for k in ('id','filename','sha256')}],cards=cards,
    order='Source order, increasing page number; one full card per page. Repeated faces retained.',
    geometry_evidence='All 110 source pages inspected in all four contact sheets. All 15 rotated faces and both rotated back families inspected upright in dedicated orientation sheets. Entire page retained.',
    provenance='New recipe established from the Cyberpapauté PDF after fresh inspection.')
(root/'recipe.json').write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
original=Path(r'C:\Users\david\.codex\plugins\cache\created-by-me-remote\card-extractor\1.1.0\skills\extract-cards\scripts\cards.py')
adapted=previous/'cards-windows.py'
before=original.read_text(encoding='utf-8')
after=adapted.read_text(encoding='utf-8')
head,tail=before.split('        stage.rename(out)')
assert after.startswith(head) and after.endswith(tail)
assert 'shutil.copytree(stage, out)' in after and 'sha(file) != sha(out / file.relative_to(stage))' in after
(root/'cards-windows.py').write_bytes(adapted.read_bytes())
metadata={'original_sha256':hashlib.sha256(original.read_bytes()).hexdigest(),'adapted_sha256':hashlib.sha256(adapted.read_bytes()).hexdigest(),
    'adaptation':'Only stage.rename(out) replaced by copytree with SHA-256 equality checks. Rendering unchanged.'}
(root/'extractor.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')

# Reuse the previous integrity checker with explicit parameters for this source.
verify=(previous/'verify_and_package.py').read_text(encoding='utf-8')
replacements={
    "output/cartes/torg/terre-vivante":"output/cartes/torg/cyberpapaute",
    'Paquet Bonus Terre Vivante (v1).pdf':'Paquet Bonus De La Cyberpapaut+_ (v0).pdf',
    "'action':(120,40,(1040,745))":"'action':(160,40,(1040,745))",
    "'destin':(71,5,(745,1040))":"'destin':(76,5,(745,1040))",
    'cosm-terre-vivante':'cosm-cyberpapaute',
    "assert c['rotate_cw']==0 and c['orientation_verified'] is True":"assert c['rotate_cw']==(0 if c['page']<=80 else (90 if c['page']%2 else 270)) and c['orientation_verified'] is True",
    'All four source contact sheets, both final preview sheets, one full-resolution face and each back inspected. Main text and logos upright. Complete card borders retained. No rotations or crops required.':'All four source contact sheets, both orientation sheets, both final preview sheets, one full-resolution face and each back inspected. Action upright without rotation; Cosm and Destin faces rotated 90 CW and backs 270 CW. Complete card borders retained.',
    'Terre Vivante — extraction':'Cyberpapauté — extraction',
    'Action : 120.jpg à 159.jpg':'Action : 160.jpg à 199.jpg',
    'Cosm Terre Vivante':'Cosm Cyberpapauté',
    'Destin : 71.jpg à 75.jpg':'Destin : 76.jpg à 80.jpg',
    'terre-vivante-rejoue':'cyberpapaute-rejoue',
}
for old,new in replacements.items():
    assert old in verify,old
    verify=verify.replace(old,new)
(root/'verify_and_package.py').write_text(verify,encoding='utf-8')
print(json.dumps({'pages':110,'source_sha256':s['sha256'],'start_indices':recipe['start_indices']}))
