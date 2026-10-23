# Donne au pilote de Crimes ses atteintes et son dépassement — 2026-10-22, Claude Code, chantiers C2 et
# C3 de l'audit (« Ok commence et si possible fais aussi c3 », David).
#
# C2 (livre p. 395-396) : chaque Potentiel porte trois compteurs — fatigue, épuisement, blessures — et
# le jet lance le Potentiel ACTUEL, la valeur de départ moins les marques. « Fin de scène » efface les
# fatigues ; « Bonne nuit » retire une croix d'épuisement par Potentiel, et finit la scène.
# C3 (p. 385, 407) : le dépassement, annoncé avant le jet, garde des réussites en plus contre une
# fatigue chacune ; un seul par scène, compté dans `depassement_de_la_scene`.
#
# Part du pilote du jet gardé (outils/crime/corriger_le_jet_garde.py) et réécrit aussi
# docs/systems/crime/fiche/correspondance.json : les neuf compteurs de la fiche HTML (`harm.*`,
# outils/crime/construire-fiche.mjs) y sont reliés aux champs GM-OS.
#
# Usage : python -I -X utf8 outils/crime/ajouter_les_atteintes.py <pilote du jet gardé> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]
ICI = os.path.dirname(os.path.abspath(__file__))
CORRESPONDANCE = os.path.join(ICI, '..', '..', 'docs', 'systems', 'crime', 'fiche', 'correspondance.json')

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'crime':
    sys.exit(f"Ce n'est pas le pilote de Crimes : {pilote.get('name')!r} ({pilote.get('corpusId')!r}).")
jet = pilote.get('jet') or {}
if 'garde' not in jet:
    sys.exit("Le pilote n'a pas encore son jet gardé : passer d'abord outils/crime/corriger_le_jet_garde.py.")

POTENTIELS = [('physique', 'Physique', 'physical'), ('mental', 'Mental', 'mental'), ('social', 'Social', 'social')]
MARQUES = [('fatigue', 'fatigue', 'fatigue'), ('epuisement', 'épuisement', 'exhaustion'), ('blessures', 'blessures', 'wounds')]
DEPASSEMENT = 'depassement_de_la_scene'

sections = etat['sheetTemplate']['sections']
ids = {f['id'] for s in sections for f in s['fields']}
for p, _, _ in POTENTIELS:
    if p not in ids:
        sys.exit(f"Le Potentiel « {p} » manque à la fiche.")

# — La fiche GM-OS : une section, après les Potentiels.
champs = [
    {'id': f'{m}_{p}', 'label': f'{lp} — {lm}', 'type': 'number', 'defaultValue': 0}
    for p, lp, _ in POTENTIELS for m, lm, _ in MARQUES
] + [{'id': DEPASSEMENT, 'label': 'Dépassement de la scène', 'type': 'number', 'defaultValue': 0, 'max': 1}]
sections[:] = [s for s in sections if s['id'] != 'atteintes']
place = next(i for i, s in enumerate(sections) if s['id'] == 'potentiels') + 1
sections.insert(place, {'id': 'atteintes', 'label': 'Atteintes', 'fields': champs})

# — Le jet : le Potentiel actuel, et le dépassement.
jet['garde']['atteintes'] = {
    'parPotentiel': {p: {m: f'{m}_{p}' for m, _, _ in MARQUES} for p, _, _ in POTENTIELS},
    'incapacite': 'physique',
}
jet['garde']['depassement'] = {'champ': DEPASSEMENT}

# — Les gestes du bandeau.
fatigues = [{'champ': f'fatigue_{p}', 'label': f'{lp} — fatigue', 'delta': 'vide'} for p, lp, _ in POTENTIELS]
depassement = {'champ': DEPASSEMENT, 'label': 'Dépassement de la scène', 'delta': 'vide'}
gestes = pilote.setdefault('gestesDesHeros', {})
gestes['finDeScene'] = fatigues + [depassement]
gestes['bonneNuit'] = [
    {'champ': f'epuisement_{p}', 'label': f'{lp} — épuisement', 'delta': -1} for p, lp, _ in POTENTIELS
] + fatigues + [depassement]

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

# — La correspondance avec la fiche HTML.
table = json.load(open(CORRESPONDANCE, encoding='utf-8'))
nouveaux = {f'{m}_{p}': f'harm.{cle}.{cm}' for p, _, cle in POTENTIELS for m, _, cm in MARQUES}
table['champs'] = [c for c in table['champs'] if c['gmos'] not in nouveaux]
apres = next(i for i, c in enumerate(table['champs']) if c['gmos'] == 'social') + 1
table['champs'][apres:apres] = [{'gmos': g, 'fiche': f} for g, f in nouveaux.items()]
if 'atteintes' not in table['commentaire']:
    table['commentaire'] += (' Les atteintes des Potentiels (harm.*) ont été ajoutées le 2026-10-22 par '
                             'outils/crime/ajouter_les_atteintes.py.')
open(CORRESPONDANCE, 'w', encoding='utf-8').write(json.dumps(table, ensure_ascii=False, indent=2) + '\n')

print(f"Pilote {pilote['name']} : {len(champs)} champs d'atteintes, Bonne nuit et Fin de scène, dépassement → {sortie}")
print(f"Correspondance : {len(nouveaux)} compteurs de la fiche reliés.")
