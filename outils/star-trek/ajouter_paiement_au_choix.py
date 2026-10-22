# Laisse payer les dés achetés de Star Trek en Impulsion, en Menace ou en mélangeant les deux —
# 2026-10-22, Claude Code, décision de David (« pour Star Trek on va faire le paiement au choix »).
#
# Même réglage que Dune (lot D2, outils/dune/ajouter_paiement_au_choix.py) : la réserve d'Impulsion
# déclare `paiementAuChoix`, et le panneau de jet propose « dont en Menace ». Le corpus disait
# « Impulsion ou Menace » pour l'aide d'un équipier, et « si la réserve est vide » pour l'achat de
# dés ; David a tranché pour le choix.
#
# Usage : python -I -X utf8 outils/star-trek/ajouter_paiement_au_choix.py <export du pilote> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'star-trek':
    sys.exit(f"Ce n'est pas le pilote Star Trek : {pilote.get('name')!r} ({pilote.get('corpusId')!r}).")
impulsion = next((r for r in pilote.get('ressourcesDeTable', []) if r['id'] == 'impulsion'), None)
if not impulsion or impulsion.get('reportSurEpuisement') != 'menace':
    sys.exit("La réserve d'Impulsion devait reporter son manque sur la Menace.")
impulsion['paiementAuChoix'] = True

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : Impulsion payable en Menace par choix → {sortie}")
