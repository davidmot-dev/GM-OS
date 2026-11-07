import json
from pathlib import Path

root = Path('tmp/cartes-tarot-ombres')
geometrie = json.loads((root / 'geometrie-preparee.json').read_text(encoding='utf-8'))
inventaire = json.loads((root / 'inspection/inventory.json').read_text(encoding='utf-8'))
assert inventaire['sources'][0]['sha256'] == geometrie['sha256']
assert len(inventaire['sources'][0]['pages']) == 14
cartes = []
for page in geometrie['pages']:
    for position, region in enumerate(page['regions'], 1):
        role = 'face' if page['page'] > 1 else 'back' if position == 1 else 'duplicate-back'
        cartes.append({'source':'s0','page':page['page'],'deck':'tarot-des-ombres','role':role,
                       'bbox':region['bbox'],'rotate_cw':0,'orientation_verified':True,
                       'evidence':('Dos commun bleu et or de la page 1, six exemplaires visuellement identiques ; conserver le cadre bleu-gris.'
                                   if page['page']==1 else
                                   'Face complète : illustration, chiffres et titre conservés ; haut du graphisme à l’endroit. Les inscriptions tête-bêche des mineures sont intentionnelles.'),
                       'source_position':position,'crop_evidence':'Limite du placement PDF, clip 170,079 × 320,315 points ; marges blanches extérieures de la planche exclues.'})
recette = {'schema_version':2,'dpi':300,'start_indices':{'tarot-des-ombres':1},'numbering_confirmed':True,
           'numbering_choice':{'user':'David','answer':'1','date':'2026-11-02'},
           'sources':[{'id':'s0','filename':geometrie['source'],'sha256':geometrie['sha256']}],
           'order':'Pages du PDF, puis de gauche à droite sur la ligne supérieure, puis sur la ligne inférieure ; pas de tri sur les valeurs imprimées.',
           'excluded_areas':'Marges blanches du papier A4 hors des six placements de cartes ; aucune carte ni face répétée supprimée.',
           'cards':cartes}
assert len(cartes) == 84 and sum(c['role']=='face' for c in cartes)==78
(root / 'recipe.json').write_text(json.dumps(recette,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Recette préparée : 78 faces depuis 1, un dos canonique et cinq répétitions documentées.')
