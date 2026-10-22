# Ajoute au pilote Symbaroum le modificateur du seuil et l'opposition explicite — 2026-10-22,
# Claude Code (S1 de l'audit de Codex, choix de David : « opposition explicite »).
#
# Le livre, p. 103 : d20 ≤ Attribut + modificateur, de +5 (très facile) à −5 (très complexe) ;
# contre un adversaire, le modificateur vaut 10 moins son Attribut. GM-OS l'applique au seuil
# (`jet.modificateurDuSeuil`) et montre le calcul : 12 + (10 − 13) = 9.
#
# Part de l'export actuel du pilote (déjà relié à la fiche HTML par relier_fiche_symbaroum.py) et ne
# touche qu'au jet. Refuse un pilote qui porterait encore `jet.difficulte` : ce champ compte des
# réussites, et faisait réussir chaque test (registre, § 145).
#
# Usage : python -I -X utf8 outils/symbaroum/ajouter_modificateur_du_seuil.py <export du pilote> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('name') != 'Symbaroum':
    sys.exit(f"Ce n'est pas le pilote Symbaroum : {pilote.get('name')!r}.")
jet = pilote.get('jet') or {}
if jet.get('sens') != 'sous-ou-egal' or len(jet.get('seuil') or []) != 1:
    sys.exit('Jet inattendu : un seul Attribut, jeté dessous, était attendu.')
if 'difficulte' in jet:
    sys.exit('Le pilote porte encore « jet.difficulte » : repartir de l’export corrigé du 21/10.')

jet['modificateurDuSeuil'] = {
    'min': -5, 'max': 5, 'defaut': 0,
    'opposition': {'reference': 10, 'label': 'Attribut adverse'},
}

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : modificateur du seuil −5 à +5, opposition 10 moins l'Attribut adverse → {sortie}")
