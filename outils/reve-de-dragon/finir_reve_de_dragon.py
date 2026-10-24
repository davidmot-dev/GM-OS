# Finit le pilote Rêve de Dragon (édition 2.3.1) — 2026-10-24, Claude Code, à la demande de David
# (« on va finir rêve de dragons », livres de règles 2.3 sous la main). Pages imprimées.
#
# Part de l'export du 22/10 (le pilote relié au Livret du voyageur, déjà réimporté) et ne change que
# l'ordre d'action : le livre ne trie pas les combattants par Agilité. Le round a sept phases ; tirs,
# lancers et mêlée s'y départagent par « facteur de l'arme + 1d6 » (Livre des Voyageurs, p. 120–121, 138).
# `combat.initiative.mode: 'phases'` ouvre le panneau des phases de Combat-OS ; la formule disparaît.
#
# Le reste — Haut-Rêve, famine, potions, entraînement, apprentissage — vit dans GM-OS et lit les champs
# que la fiche porte déjà. Aucun identifiant de champ ne change : le livret et les personnages restent valables.
#
# Usage : python -I -X utf8 outils/reve-de-dragon/finir_reve_de_dragon.py <export du 22/10> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'reves de dragons':
    sys.exit(f"Ce n'est pas le pilote Rêve de Dragon : {pilote.get('name')!r}.")
sections = etat['sheetTemplate']['sections']
champs = {f['id'] for s in sections for f in s['fields']}
manquants = [c for c in ['melee', 'tir', 'lancer', 'reve_pts', 'reve_seuil', 'onrios', 'hypnos', 'narcos', 'thanatos',
                         'magic_repression', 'magic_dragonEffects', 'spells_0_name', 'reservedSpells_0_name', 'route_food', 'route_water', 'sust']
             if c not in champs]
if manquants:
    sys.exit(f'Champs du livret attendus absents : {", ".join(manquants)}. Réimporter d’abord le pilote relié.')

combat = pilote['combat']
combat['initiative'] = {'mode': 'phases'}
combat['initiativeFormula'] = ''
pilote['version'] = '2.0.0'

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} 2.0.0 : round en sept phases, initiative par arme → {sortie}")
