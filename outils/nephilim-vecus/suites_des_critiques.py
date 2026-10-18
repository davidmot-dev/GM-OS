# Les suites d'une maladresse ou d'un critique au jet de Nephilim (2026-10-18).
# Corpus (`docs/systems/nephilim/rules/degres-de-reussite-et-critiques.md`) : maladresse en Art occulte → +1 Khaïba,
# maladresse sur le Vécu contemporain → +1 Ombre, critique en Science occulte → +1 Point de Sapience.
# Le panneau de jet propose un bouton ; le meneur tranche. Suppose les sections d'Arts (`sections_des_arts.py`).
# Usage : python -I -X utf8 outils/nephilim-vecus/suites_des_critiques.py <pilote> <sortie>
import json, sys, os, zipfile

entree, sortie = sys.argv[1:3]
ARTS = ['arts_magie', 'arts_kabbale', 'arts_alchimie']
SUITES = [
    {'quand': 'maladresse', 'label': 'Maladresse de Magie', 'sections': ['arts_magie'],
     'rappel': '+1 degré de Khaïba ; le premier est de Nanisme ou de Gigantisme (Quintessence p. 183).',
     'ajouter': {'champ': 'falls_khaiba'}},
    {'quand': 'maladresse', 'label': 'Maladresse de Kabbale', 'sections': ['arts_kabbale'],
     'rappel': '+1 degré de Khaïba ; le premier est de forme élémentaire (errata V1.3, p. 198). Le pacte, lui, se noue en opposition : Art de la Sephirah + Ka contre le degré de l’invocation.',
     'ajouter': {'champ': 'falls_khaiba'}},
    {'quand': 'maladresse', 'label': 'Maladresse d’Alchimie', 'sections': ['arts_alchimie'],
     'rappel': '+1 degré de Khaïba, de forme éthérale si c’est le premier. Les Materiae Primae sont consommées, rien n’est produit, le Ka du construct perd 1 (à noter sur sa ligne), plus d’essai de cette formule du scénario (errata V1.3, p. 220).',
     'ajouter': {'champ': 'falls_khaiba'}},
    {'quand': 'maladresse', 'label': 'Maladresse du Vécu contemporain', 'champs': ['simulacrum_experience_degree'],
     'rappel': '+1 degré d’Ombre : le Simulacre reprend du terrain.',
     'ajouter': {'champ': 'falls_shadow'}},
    {'quand': 'critique', 'label': 'Critique en Science occulte', 'sections': ARTS,
     'rappel': '+1 Point de Sapience, qu’on peut dépenser aussitôt pour soigner un degré de Chute (errata V1.3, p. 198).',
     'ajouter': {'champ': 'resources_sapience'}},
]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

sections = {s['id']: {f['id'] for f in s['fields']} for s in etat['sheetTemplate']['sections']}
champs = set().union(*sections.values())
absents = [s for s in ARTS if s not in sections] + [c for c in ('falls_khaiba', 'falls_shadow', 'resources_sapience', 'simulacrum_experience_degree') if c not in champs]
if absents:
    sys.exit(f'Absents de la fiche : {absents} — passer d’abord sections_des_arts.py ?')

etat['gameDriver']['jet']['suitesDesCritiques'] = SUITES

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{len(SUITES)} suites posées :', ' · '.join(s['label'] for s in SUITES))
