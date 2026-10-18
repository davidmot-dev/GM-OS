# Lot D de Nephilim (2026-10-18) : l'Alchimie au jet, sans code — choix de David (option A).
#
# Une transmutation se teste ainsi : Ka-élément du construct + Art de l'Œuvre − degré de la formule
# (Quintessence p. 220). Le Ka vient donc du CONSTRUCT, pas du Pentacle :
#   - « Alchimie — constructs et Materiae Primae » est découpée en deux sections, les clés intactes :
#     les vingt-cinq Ka des constructs, et les dix champs des jauges de MP ;
#   - le menu « Approche (Ka) » propose aussi les Ka des constructs, en sous-groupe.
# Les jauges de MP « reviennent à leur maximum entre chaque mois, ou entre chaque session de jeu »
# (p. 219) : le geste « Début de séance » remplit chaque jauge à son maximum, lu sur la fiche.
# Les MP consommées se retirent à la main ; la maladresse a sa carte (`suites_des_critiques.py`).
#
# Usage : python -I -X utf8 outils/nephilim-vecus/alchimie_au_jet.py <pilote> <sortie>
import json, sys, os, zipfile

entree, sortie = sys.argv[1:3]
SOURCE, CONSTRUCTS, MATERIAE = 'alchimie_constructs', 'alchimie_constructs', 'alchimie_materiae'
ELEMENTS = [('fire', 'Feu'), ('air', 'Air'), ('water', 'Eau'), ('earth', 'Terre'), ('moon', 'Lune')]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

liste = etat['sheetTemplate']['sections']
ids = [s['id'] for s in liste]
if SOURCE not in ids:
    sys.exit(f'Section absente : {SOURCE}')

# — Les deux sections : les Ka des constructs (menu Approche), les jauges de MP (hors du menu).
if MATERIAE not in ids:
    origine = liste[ids.index(SOURCE)]
    ka = [f for f in origine['fields'] if f['id'].startswith('alchemy_constructs_')]
    mp = [f for f in origine['fields'] if f['id'].startswith('alchemy_materia_')]
    reste = [f['id'] for f in origine['fields'] if f not in ka and f not in mp]
    if reste or len(ka) != 25 or len(mp) != 10:
        sys.exit(f'La section a changé — {len(ka)} Ka, {len(mp)} MP, non rangés : {reste}')
    origine['label'] = 'Alchimie — constructs'
    origine['fields'] = ka
    liste.insert(ids.index(SOURCE) + 1, {'id': MATERIAE, 'label': 'Alchimie — Materiae Primae', 'fields': mp})

# — Le Ka du construct au jet : une section supplémentaire de l'approche.
approche = next(c for c in etat['gameDriver']['jet']['cible']['ajustement'] if c['id'] == 'approche')
approche['label'] = 'Approche (Ka) ou construct'
approche['sectionsSupplementaires'] = [CONSTRUCTS]

# — Début de séance : chaque jauge de MP revient à son maximum.
gestes = etat['gameDriver'].setdefault('gestesDesHeros', {})
gestes['debutDeSeance'] = [
    {'champ': f'alchemy_materia_{cle}', 'label': f'Materiae Primae {nom}', 'delta': 'plein',
     'max': {'champ': f'alchemy_materia_{cle}_max'}}
    for cle, nom in ELEMENTS
]

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Sections :', ' · '.join(f"{s['id']} ({len(s['fields'])})" for s in liste if s['id'].startswith('alchimie')))
print('Approche :', json.dumps(approche, ensure_ascii=False))
print('Début de séance :', ', '.join(m['champ'] for m in gestes['debutDeSeance']))
