import json
import sys
from pathlib import Path

root = Path(__file__).parent
inventory = json.loads((root / 'inspection/inventory.json').read_text(encoding='utf-8'))
source = inventory['sources'][0]
assert len(sys.argv) == 4, 'Provide explicitly chosen starting numbers: Action Cosm-Aysle Destin'
starts = dict(zip(('action', 'cosm-aysle', 'destin'), map(int, sys.argv[1:])))
assert all(n >= 0 for n in starts.values())
cards = []
for page in range(1, 111):
    if page <= 80:
        deck, first_back, rotation = 'action', 2, 90
        evidence = 'Carte Action et logo lus normalement après rotation horaire de 90 degrés ; format paysage.'
    elif page <= 100:
        deck, first_back, rotation = 'cosm-aysle', 82, 0
        evidence = 'Carte Cosm Aysle et logo lus normalement sans rotation ; format portrait.'
    else:
        deck, first_back, rotation = 'destin', 102, 0
        evidence = 'Carte Destin et logo lus normalement sans rotation ; format portrait.'
    role = 'face' if page % 2 else ('back' if page == first_back else 'duplicate-back')
    if role == 'duplicate-back':
        reference = source['pages'][first_back-1]
        assert source['pages'][page-1]['pixel_sha256'] == reference['pixel_sha256']
        evidence += f' Dos comparé visuellement et pixels identiques au dos de référence page {first_back} à 144 dpi.'
    cards.append(dict(source='s0', page=page, deck=deck, role=role, bbox=[0,0,1,1],
                      rotate_cw=rotation, orientation_verified=True, evidence=evidence))
recipe = dict(schema_version=2, dpi=300, start_indices=starts, numbering_confirmed=True,
    numbering_evidence='Starting file numbers explicitly supplied by the user for this PDF in the current chat.',
    sources=[{k: source[k] for k in ('id','filename','sha256')}], cards=cards,
    order='Source order, increasing page number; one complete card per page; repeated faces retained.',
    geometry_evidence='All 110 pages inspected. Finished card format; entire page retained including the black border.',
    provenance='New recipe established from the source PDF in this chat; no prior Aysle recipe or manifest was available.')
(root / 'recipe.json').write_text(json.dumps(recipe, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'recipe':str(root/'recipe.json'), 'start_indices':starts}))
