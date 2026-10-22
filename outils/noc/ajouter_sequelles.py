# Propose la Séquelle de NOC quand une jauge de péril atteint 8 — 2026-10-22, Claude Code (point 1
# de la synthèse des pilotes ; registre général, § 150).
#
# Le livre : « si une jauge atteint le seuil de huit points, le joueur note le gain d'une séquelle »
# (docs/systems/noc/rules/etats-et-conditions.md). Le moment de calme s'arrêtait déjà aux séquelles
# (`plancher: sequelles_*`) ; rien ne les faisait naître. Le pilote déclare désormais quatre
# `franchissements` : à 8, le bandeau propose « Noter » (séquelles +1), une fois par passage.
#
# Part de l'export actuel du pilote NOC et ne touche qu'à `franchissements`.
#
# Usage : python -I -X utf8 outils/noc/ajouter_sequelles.py <export du pilote> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'noc':
    sys.exit(f"Ce n'est pas le pilote NOC : {pilote.get('name')!r}.")
champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}

JAUGES = [
    ('blessures', 'Blessures', 'Blessure lourde : −1 à tous les Talents, un point devient une séquelle'),
    ('trauma', 'Trauma', 'Traumatisé : −1 à tous les Talents, un point devient une séquelle'),
    ('traque', 'Traque', 'Recherché : trait Criminel, un point devient une séquelle'),
    ('noirceur', 'Noirceur', 'Possédé : second trait de Noirceur, un point devient une séquelle'),
]
franchissements = []
for champ, label, rappel in JAUGES:
    sequelles = f'sequelles_{champ}'
    if champ not in champs or sequelles not in champs:
        sys.exit(f'Champs attendus absents de la fiche : {champ}, {sequelles}.')
    franchissements.append({
        'id': f'sequelle-{champ}', 'champ': champ, 'label': label, 'aPartirDe': 8, 'rappel': rappel,
        'mouvements': [{'champ': sequelles, 'label': f'Séquelles ({label})', 'delta': 1, 'max': 10}],
    })
pilote['franchissements'] = franchissements

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : séquelle proposée à 8 sur {', '.join(j[1] for j in JAUGES)} → {sortie}")
