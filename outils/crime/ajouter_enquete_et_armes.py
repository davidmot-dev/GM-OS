# Donne au pilote de Crimes ses styles d'enquêteur et ses armes — 2026-10-22, Claude Code, chantiers C5
# et C6 de l'audit (« On peut faire c5 et c6 […] ? Si oui vas y », David).
#
# C5 (livre p. 436-440) : les cinq styles — Condé, Limier, Illuminé, Mentaliste, Fouineur — avec leur
# niveau (les ronds de la fiche) et leurs points d'enquête (le compteur à côté). Le dossier d'enquête
# du meneur, les seuils des indices et la révélation à un seul enquêteur les lisent.
# C6 (p. 344-395) : `jet.garde.armes = 'crimes'`, la table des armes transcrite dans le code
# (src/modules/dice/systemes/armesDeCrimes.ts). Les tranches tactiques génériques — « contact »
# jusqu'à 10 unités, « 10 mètres » jusqu'à 20 — sont remplacées par l'échelle des portées utiles du
# livre ; leur modificateur reste nul, la pénalité dépendant de l'arme (p. 389).
#
# Part du pilote des atteintes (outils/crime/ajouter_les_atteintes.py).
# Usage : python -I -X utf8 outils/crime/ajouter_enquete_et_armes.py <pilote c2-c3> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'crime':
    sys.exit(f"Ce n'est pas le pilote de Crimes : {pilote.get('name')!r} ({pilote.get('corpusId')!r}).")
garde = (pilote.get('jet') or {}).get('garde')
if not garde or 'atteintes' not in garde:
    sys.exit("Le pilote n'a pas encore ses atteintes : passer d'abord outils/crime/ajouter_les_atteintes.py.")

STYLES = [('conde', 'Condé'), ('limier', 'Limier'), ('illumine', 'Illuminé'), ('mentaliste', 'Mentaliste'), ('fouineur', 'Fouineur')]
champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
for s, _ in STYLES:
    for c in (s, f'compteur_{s}'):
        if c not in champs:
            sys.exit(f"Le champ « {c} » manque à la fiche.")

pilote['enquete'] = {'styles': [{'id': s, 'label': l, 'niveau': s, 'points': f'compteur_{s}'} for s, l in STYLES]}
garde['armes'] = 'crimes'

# L'échelle des portées utiles du livre (corpus « Distances et portées »), en mètres.
tactique = pilote.setdefault('tactical', {'useTacticalAI': False})
tactique['uniteDeDistance'] = 'mètres'
tactique['ranges'] = {
    'contact': {'label': 'au contact', 'maxUnits': 2, 'modifier': 0},
    'courte': {'label': 'très courte portée (armes de poing dissimulées, 10 m)', 'maxUnits': 10, 'modifier': 0},
    'moyenne': {'label': 'revolvers de poche (20 m)', 'maxUnits': 20, 'modifier': 0},
    'longue': {'label': 'revolvers et pistolets (50 m)', 'maxUnits': 50, 'modifier': 0},
    'extreme': {'label': 'fusils (jusqu’à 400 m)', 'maxUnits': 400, 'modifier': 0},
}

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : cinq styles d'enquêteur, armes du livre, portées en mètres → {sortie}")
