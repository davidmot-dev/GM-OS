# Ajoute au pilote Symbaroum l'Avantage tactique (S3) et la Corruption au seuil (S4) — 2026-10-22,
# Claude Code (audit de Codex, 2026-10-20-symbaroum-propositions.md ; registre général, § 155).
#
# - S3 : « l'Avantage donne +2 à l'Attribut et +1D4 de dégâts » (p. 166), sans second d20. Une case du
#   panneau de jet, à côté du modificateur et de l'opposition (`jet.modificateurDuSeuil.avantage`).
# - S4 : la Corruption totale (temporaire + permanente) surveillée par deux seuils (`franchissements`) :
#   au Seuil de Corruption (Volonté ÷ 2, arrondi au-dessus), un Stigmate et 1D4 de Corruption
#   permanente lancé à « Noter » (p. 179–180) ; à la Volonté, l'Abomination (p. 180). Une fois par
#   passage ; la fin de scène, qui vide la temporaire, réarme le premier.
#
# Part de l'export corrigé du 22/10 (Endurance et fin de scène) et ne touche qu'au jet et aux seuils.
#
# Usage : python -I -X utf8 outils/symbaroum/ajouter_avantage_et_corruption.py <export du pilote> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('name') != 'Symbaroum':
    sys.exit(f"Ce n'est pas le pilote Symbaroum : {pilote.get('name')!r}.")
champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
for attendu in ('volonte', 'corruption_temporaire', 'corruption_permanente'):
    if attendu not in champs:
        sys.exit(f'Champ attendu absent de la fiche : {attendu}.')
modificateur = pilote.get('jet', {}).get('modificateurDuSeuil')
if not modificateur:
    sys.exit('Le modificateur du seuil (S1, export du 22/10) devait déjà être là.')

modificateur['avantage'] = {'label': 'Avantage tactique', 'seuil': 2, 'degats': '1d4'}

CORRUPTION = {'champ': 'corruption_temporaire', 'ajouter': ['corruption_permanente'], 'label': 'Corruption totale'}
pilote['franchissements'] = [
    {
        'id': 'stigmate', **CORRUPTION, 'aPartirDe': {'champ': 'volonte', 'fois': 0.5},
        'rappel': 'Seuil de Corruption : choisir un Stigmate ; la Corruption permanente gagne 1D4 (p. 179–180)',
        'mouvements': [],
        'jet': {'faces': 4, 'champ': 'corruption_permanente', 'label': 'Corruption permanente'},
    },
    {
        'id': 'abomination', **CORRUPTION, 'aPartirDe': {'champ': 'volonte'},
        'rappel': "Corruption totale à la Volonté : le personnage devient une Abomination (p. 180) — "
                  "il passe au meneur, sauf accord du groupe pour la jouer (p. 184)",
        'mouvements': [],
    },
]

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : Avantage tactique (+2, +1D4 dégâts) ; Stigmate et Abomination → {sortie}")
