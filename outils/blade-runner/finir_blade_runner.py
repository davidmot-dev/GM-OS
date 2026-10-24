# Finit le pilote Blade Runner (livre de base français, Arkhane Asylum) — 2026-10-24, Claude Code,
# à la demande de David (« on va finir Blade Runner », BRN-01_LivreDeRegles.pdf). Pages imprimées.
#
# Part de l'export du 22/10 et ne change aucun identifiant de champ : les fiches et les personnages
# restent valables.
#
# - `jet.bladeRunner` : le suivi des blessures critiques (sauvegarde contre la mort, stabilisation,
#   soins, premiers secours, main secourable, objet fétiche, souvenir clé), p. 56, 71–76 ;
# - `jet.desEchelonnes.plafondDesD12: 0` : le livre ne plafonne pas les D12 (p. 54–57) ;
# - retire les deux tables de butin d'essai (« TEST », « Table 2 ») — décision de David du 24/10 ;
# - version 2.0.0.
#
# Usage : python -I -X utf8 outils/blade-runner/finir_blade_runner.py <export du 22/10> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'blade-runner':
    sys.exit(f"Ce n'est pas le pilote Blade Runner : {pilote.get('name')!r}.")
champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
suivi = {
    'endurance': ['vigueur', 'endurance'],
    'assistanceMedicale': ['intelligence', 'assistanceMedicale'],
    'manipulation': ['empathie', 'manipulation'],
    'sante': 'sante', 'santeMax': 'santeMax', 'sangFroid': 'sangFroid', 'sangFroidMax': 'sangFroidMax',
    'blessures': 'blessuresCritiques', 'souvenirCle': 'souvenirCle', 'objetFetiche': 'objetFetiche',
}
lus = [c for v in suivi.values() for c in (v if isinstance(v, list) else [v])]
manquants = [c for c in lus if c not in champs]
if manquants:
    sys.exit(f'Champs de la fiche attendus absents : {", ".join(manquants)}.')

jet = pilote['jet']
jet['bladeRunner'] = suivi
jet['desEchelonnes']['plafondDesD12'] = 0
jet['forcer']['relancerUneReussite'] = True
pilote['lootTables'] = [t for t in pilote.get('lootTables', []) if t.get('name') not in ('TEST', 'Table 2')]
pilote['version'] = '2.0.0'

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} 2.0.0 : suivi des blessures, trois D12 permis, tables d'essai retirées → {sortie}")
