# Écrit les époques d'incarnation et les Vécus passés de Nephilim dans le corpus du jeu, depuis le
# LIVRE (`livre/epoques.json`, produit par `extraire_du_livre.py`) — 2026-10-18.
# Le 17/10, ces fichiers venaient du carnet NotebookLM : vingt époques dont quatre inventées, des
# titres approchés, trois descriptions fausses. Les réponses du carnet restent dans `bruts/`, pour
# mémoire ; elles ne servent plus.
# Usage (racine du dépôt) : python -I -X utf8 outils/nephilim-vecus/ecrire_vecus.py
import json, glob, os, re, unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, '..', '..', 'docs', 'systems', 'nephilim', 'vecus')
SOURCE = 'Nephilim5 — Livre 0 — Quintessence, chapitre « Les époques d’incarnation »'
EXTRAIT = '2026-10-18, texte du PDF du livre (pypdf et pdftotext), titres et Ka relus sur la mise en page'

def slug(texte):
    t = unicodedata.normalize('NFKD', texte.replace('’', ' ').replace("'", ' ')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def premieres_phrases(texte, plafond=360):
    """Le début de l'introduction, coupé à une fin de phrase : de quoi reconnaître l'époque."""
    phrases, total = [], 0
    for p in re.split(r'(?<=[.!?…])\s+', texte):
        if phrases and total + len(p) > plafond:
            break
        phrases.append(p)
        total += len(p) + 1
    return ' '.join(phrases)

def dates_et_lieux(e):
    return ', '.join(x for x in (e['date'], e['lieux']) if x)

epoques = json.load(open(os.path.join(ICI, 'livre', 'epoques.json'), encoding='utf-8'))
assert len(epoques) == 31 and all(len(e['vecus']) == 5 for e in epoques), 'Le livre a 31 époques de cinq Vécus.'

# Les fichiers d'hier portent d'autres titres : on les retire avant d'écrire, pour ne rien laisser de faux.
for ancien in glob.glob(os.path.join(SORTIE, '[0-9][0-9]-*.md')):
    os.remove(ancien)

index = []
for ordre, e in enumerate(epoques):
    nom_fichier = f"{ordre:02d}-{slug(e['epoque'])}.md"
    lignes = [
        f"# Les Vécus de l’époque « {e['epoque']} »",
        '',
        f"Ère : **{e['ere']}**. Page {e['page']} du *{SOURCE}*.",
        '',
        f"Dates et lieux : {dates_et_lieux(e)}.",
        '',
        'Un Vécu passé par Ka-élément. Le nom et le degré se portent sur la fiche du personnage ;',
        'ce qui suit décrit le Vécu, pour choisir et raconter.',
    ]
    for v in e['vecus']:
        renvoi = f"p. {e['page']}" + (f", corrigé par l’errata {v['errata']}" if v.get('errata') else '')
        texte_du_vecu = f"{v['description']} *({renvoi})*"
        lignes += ['', f"## {v['nom']} — Ka-{v['ka']}", '', texte_du_vecu]
        # La description aussi dans l'index : la tablette lit les .json du corpus, jamais les .md (18/10).
        index.append({'nom': v['nom'], 'fichier': nom_fichier,
                      'details': {'Ka-élément': v['ka'], 'Ère': e['ere'], 'Époque': e['epoque'], 'Page': e['page']},
                      'description': texte_du_vecu})
    lignes += ['', '---', '', f'Extrait du livre le {EXTRAIT}.']
    texte = '\n'.join(lignes) + '\n'
    open(os.path.join(SORTIE, nom_fichier), 'w', encoding='utf-8').write(texte)
    print(f'{nom_fichier} : {len(texte)} car.')

# Un **référentiel** au sens de GM-OS (`SheetField.referentiel`) : des entrées nommées, le fichier
# Markdown qui les décrit (une section « ## <nom> — … » chacune), et des détails à afficher.
json.dump({'referentiel': 'Vécus passés', 'source': SOURCE + ', p. 62 à 98', 'extrait': EXTRAIT, 'entrees': index},
          open(os.path.join(SORTIE, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Vécus :', len(index))

# ---- Les époques d'incarnation : un second référentiel, pour les champs « Incarnation » de la fiche.
lignes = ['# Les époques d’incarnation', '',
          f'Les trente et une époques des sept ères, d’après le *{SOURCE}*, p. 62 à 98. Une section par',
          'époque : son début, ce que l’incarnation apporte au Nephilim, et ses cinq Vécus passés.']
entrees = []
for e in epoques:
    noms = ', '.join(f"{v['nom']} (Ka-{v['ka']})" for v in e['vecus'])
    corps = [premieres_phrases(e['introduction']), '',
             f"Dates et lieux : {dates_et_lieux(e)}." + (f" Coût : {e['cout']} PI." if e['cout'] is not None else '')]
    corps += [''] + [f'- {a}' for a in e['apports']]
    corps += ['', f'Vécus : {noms}.', '', f"*(p. {e['page']})*"]
    lignes += ['', f"## {e['epoque']} — {e['ere']}", ''] + corps
    details = {'Ère': e['ere'], 'Page': e['page'], 'Dates et lieux': dates_et_lieux(e)}
    if e['cout'] is not None:
        details['Coût'] = f"{e['cout']} PI"
    entrees.append({'nom': e['epoque'], 'fichier': 'epoques.md', 'details': details, 'description': '\n'.join(corps).strip()})
lignes += ['', '---', '', f'Extrait du livre le {EXTRAIT}.']
open(os.path.join(SORTIE, 'epoques.md'), 'w', encoding='utf-8').write('\n'.join(lignes) + '\n')
json.dump({'referentiel': 'Époques d’incarnation', 'source': SOURCE + ', p. 62 à 98', 'extrait': EXTRAIT, 'entrees': entrees},
          open(os.path.join(SORTIE, 'epoques.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Époques :', len(entrees))
