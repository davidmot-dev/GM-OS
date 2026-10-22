# Raccorde l'Endurance de Symbaroum à la santé du combat, et remet la Corruption temporaire à zéro
# en fin de scène — 2026-10-22, Claude Code (S2-raccord et S4-fin de scène de l'audit de Codex).
#
# - S2 : `combat.statsToTrack` ne désignait aucune jauge principale. L'Endurance actuelle devient la
#   santé courante (`isMainHP`), plafonnée par l'Endurance maximale : un coup porté au combat s'écrit
#   sur la fiche, une fiche blessée se lit au combat. Un personnage neuf naît à son Endurance maximale.
# - S4 : « la Corruption temporaire disparaît à la fin de la scène » ; la permanente reste. Le geste
#   « Fin de scène » du bandeau la remet à zéro, après un aperçu Héros par Héros.
#
# Part de l'export corrigé du 22/10 (modificateur du seuil) et ne touche qu'au combat et aux gestes.
#
# Usage : python -I -X utf8 outils/symbaroum/raccorder_endurance_et_fin_de_scene.py <export du pilote> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('name') != 'Symbaroum':
    sys.exit(f"Ce n'est pas le pilote Symbaroum : {pilote.get('name')!r}.")
champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
for attendu in ('endurance', 'endurance_actuelle', 'corruption_temporaire'):
    if attendu not in champs:
        sys.exit(f'Champ attendu absent de la fiche : {attendu}.')
combat = pilote['combat']
if combat.get('santeDeDepart') != 'endurance':
    sys.exit('La santé de départ devait lire « endurance » (correctif du 21/10).')

suivis = [s for s in combat.get('statsToTrack', []) if s['fieldId'] != 'endurance_actuelle']
combat['statsToTrack'] = [
    {'fieldId': 'endurance_actuelle', 'label': 'Endurance', 'isMainHP': True, 'isResource': False, 'max': 'endurance'},
    *suivis,
]
pilote.setdefault('gestesDesHeros', {})['finDeScene'] = [
    {'champ': 'corruption_temporaire', 'label': 'Corruption temporaire', 'delta': 'vide'},
]

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : Endurance actuelle = santé principale (max Endurance) ; "
      f"fin de scène : Corruption temporaire à zéro → {sortie}")
