# Lots B et C de Nephilim (2026-10-18) : la Stase et l'Effet Mnémos au jet, le Ka dominant sur la fiche.
#
# Lot C — le Ka dominant n'existait sur aucune des deux fiches. On l'ajoute à la fiche GM-OS seulement
# (la fiche HTML l'ignore jusqu'à une prochaine livraison du Studio) : un choix « Ka dominant » dans le
# Pentacle, son degré calculé sur les cinq Ka, et la Stase plafonnée dessus (`maxSur`).
#
# Lot B — deux réserves du personnage qui ajoutent des DEGRÉS à la cible (effet `degres`), débitées au
# lancer, quel que soit le résultat :
#   - la Stase : +1 degré de Ka par degré de stase, « dans le but exclusif » du lancer d'un sort
#     (Quintessence p. 183) — d'où `si` : les cercles de Magie seulement ;
#   - l'Effet Mnémos de bonus : 1 Point de Sapience pour +2 degrés, une fois par test de Vécu (p. 119).
# L'Effet Mnémos « en tant que Vécu » et le Sacrifice (5 PS) restent à la main (choix de David).
#
# Usage : python -I -X utf8 outils/nephilim-vecus/stase_et_ka_dominant.py <pilote> <sortie>
import json, sys, os, zipfile

entree, sortie = sys.argv[1:3]
ELEMENTS = [('Feu', 'ka_fire'), ('Air', 'ka_air'), ('Eau', 'ka_water'), ('Lune', 'ka_moon'), ('Terre', 'ka_earth')]

def formule_du_degre():
    """« ka_dominant == "Feu" ? ka_fire : (… : 0) » — expr-eval compare le texte du choix."""
    f = '0'
    for nom, champ in reversed(ELEMENTS):
        f = f'(ka_dominant == "{nom}" ? {champ} : {f})'
    return f[1:-1]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

sections = {s['id']: s for s in etat['sheetTemplate']['sections']}
for requis in ('le_pentacle', 'stase_et_sapience', 'arts_magie', 'les_vecus'):
    if requis not in sections:
        sys.exit(f'Section absente : {requis} — passer d’abord sections_des_arts.py ?')

# — Lot C : le Ka dominant et son degré, dans une section à lui, juste après le Pentacle : le menu
#   « Approche (Ka) » propose TOUS les champs du Pentacle, un choix de texte n'y a pas sa place.
liste = etat['sheetTemplate']['sections']
if 'ka_dominant' not in sections:
    section = {'id': 'ka_dominant', 'label': 'Ka dominant', 'fields': [
        {'id': 'ka_dominant', 'label': 'Ka dominant', 'type': 'select',
         'options': [nom for nom, _ in ELEMENTS], 'defaultValue': ''},
        {'id': 'ka_dominant_degre', 'label': 'Degré du Ka dominant', 'type': 'formula',
         'formula': formule_du_degre(), 'defaultValue': 0},
    ]}
    liste.insert([s['id'] for s in liste].index('le_pentacle') + 1, section)
    sections['ka_dominant'] = section
pentacle = sections['ka_dominant']['fields']
stase = next(f for f in sections['stase_et_sapience']['fields'] if f['id'] == 'stasis_degree')
stase['maxSur'] = 'ka_dominant_degre'

# — Lot B : la Stase et l'Effet Mnémos, au jet.
etat['gameDriver']['jet']['reservesDuPersonnage'] = [
    {'id': 'stase', 'label': 'Stase (sort de Magie)', 'effet': 'degres', 'parPoint': 1, 'epuisement': 'piste',
     'stocks': [{'champ': 'stasis_degree', 'label': 'Stase'}], 'si': {'sections': ['arts_magie']}},
    {'id': 'mnemos', 'label': 'Effet Mnémos (1 PS : +2 degrés)', 'effet': 'degres', 'parPoint': 2, 'maxParJet': 1,
     'epuisement': 'piste', 'stocks': [{'champ': 'resources_sapience', 'label': 'Points de Sapience'}],
     'si': {'sections': ['les_vecus']}},
]

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Sections :', ' → '.join(x['id'] for x in liste[:4]), '…')
print('Stase plafonnée sur :', stase['maxSur'])
print('Réserves :', ' · '.join(r['label'] for r in etat['gameDriver']['jet']['reservesDuPersonnage']))
