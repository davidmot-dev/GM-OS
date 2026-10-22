# Laisse payer les dés achetés en Impulsion, en Menace ou en mélangeant les deux — 2026-10-22, Claude Code
# (lot D2 de l'audit de Dune, 2026-10-19-dune-propositions.md ; registre général, § 151).
#
# Le livre (p. 149–152) autorise à payer tout ou partie de l'achat en Menace, même quand la réserve
# d'Impulsion est garnie. GM-OS ne reportait sur la Menace que le manque. La réserve d'Impulsion
# déclare désormais `paiementAuChoix` : le panneau de jet propose « dont en Menace ».
#
# Dune reste garé pour le reste (D0, D1, D3–D8) ; seul D2 est fait, à la demande de David du 22/10.
#
# Usage : python -I -X utf8 outils/dune/ajouter_paiement_au_choix.py <export du pilote> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'dune':
    sys.exit(f"Ce n'est pas le pilote Dune : {pilote.get('name')!r}.")
impulsion = next((r for r in pilote.get('ressourcesDeTable', []) if r['id'] == 'impulsion'), None)
if not impulsion or impulsion.get('reportSurEpuisement') != 'menace':
    sys.exit("La réserve d'Impulsion devait reporter son manque sur la Menace.")
impulsion['paiementAuChoix'] = True

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : Impulsion payable en Menace par choix → {sortie}")
