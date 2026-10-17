# Relie les noms des Vécus passés de la fiche GM-OS de Nephilim à la liste des Vécus (2026-10-17).
# Ne touche à rien d'autre du pilote.
# Usage : python -I -X utf8 outils/nephilim-vecus/relier_vecus.py <export> <sortie>
import json, re, sys, os, zipfile

entree, sortie = sys.argv[1:3]
REFERENTIEL = 'vecus/index.json'

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

relies = []
for section in etat['sheetTemplate']['sections']:
    for champ in section['fields']:
        if re.fullmatch(r'pastlives_\d+_name', champ['id']):
            champ['referentiel'] = REFERENTIEL
            relies.append(champ['id'])

os.makedirs(os.path.dirname(sortie), exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie), 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{len(relies)} champs reliés :', relies[0], '…', relies[-1])
