# Place la section « Incarnations » juste avant « Les Vécus » dans la fiche GM-OS de Nephilim (2026-10-18).
# Un Vécu vient d'une époque incarnée : on lit l'époque avant le Vécu. Ne touche à rien d'autre du pilote.
# Usage : python -I -X utf8 outils/nephilim-vecus/ranger_incarnations.py <export> <sortie>
import json, sys, os, zipfile

entree, sortie = sys.argv[1:3]
AVANT, DEVANT = 'incarnations', 'les_vecus'

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

sections = etat['sheetTemplate']['sections']
ids = [s['id'] for s in sections]
if AVANT not in ids or DEVANT not in ids:
    sys.exit(f'Section absente : {AVANT if AVANT not in ids else DEVANT}')
if ids.index(AVANT) + 1 == ids.index(DEVANT):
    print('Déjà rangée : rien à faire.')
else:
    section = sections.pop(ids.index(AVANT))
    sections.insert([s['id'] for s in sections].index(DEVANT), section)

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(' → '.join(s['id'] for s in sections[:5]), '…')
