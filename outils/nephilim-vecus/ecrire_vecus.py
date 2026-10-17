# Écrit la liste des Vécus de Nephilim dans le corpus du jeu, depuis les réponses brutes du carnet.
# Usage (racine du dépôt) : python -I -X utf8 outils/nephilim-vecus/ecrire_vecus.py
import json, glob, os, re, unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, '..', '..', 'docs', 'systems', 'nephilim', 'vecus')
KA = ['Feu', 'Air', 'Eau', 'Terre', 'Lune']
SOURCE = 'Nephilim5 — Livre 0 — Quintessence, chapitre « Les époques d’incarnation »'

def slug(texte):
    t = unicodedata.normalize('NFKD', texte).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def propre(texte):
    # Les renvois du carnet « [2] », « [2, 3] » ne veulent rien dire hors de lui.
    return re.sub(r'\s*\[\d+(?:\s*[,–-]\s*\d+)*\]', '', str(texte or '')).replace(' ', ' ').strip()

def lire(reponse):
    m = re.search(r'\{[\s\S]*\}', reponse)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None

os.makedirs(SORTIE, exist_ok=True)
index, manquantes = [], []
for chemin in sorted(glob.glob(os.path.join(ICI, 'bruts', '*.json'))):
    brut = json.load(open(chemin, encoding='utf-8'))
    donnees = lire(brut['reponse'])
    vecus = (donnees or {}).get('vecus') or []
    nom_fichier = f"{brut['ordre']:02d}-{slug(brut['epoque'])}.md"
    if len(vecus) != 5 or sorted(v.get('ka') for v in vecus) != sorted(KA):
        manquantes.append({'ere': brut['ere'], 'epoque': brut['epoque'], 'page': brut['page']})
        continue
    dates = propre(donnees.get('dates_et_lieux'))
    lignes = [
        f"# Les Vécus de l’époque « {brut['epoque']} »",
        '',
        f"Ère : **{brut['ere']}**. Page {brut['page']} du *{SOURCE}*.",
    ]
    if dates:
        lignes += ['', f'Dates et lieux : {dates}.'.replace('..', '.')]
    lignes += ['', 'Un Vécu passé par Ka-élément. Le nom et le degré se portent sur la fiche du personnage ;',
               'ce qui suit décrit le Vécu, pour choisir et raconter.']
    for v in sorted(vecus, key=lambda x: KA.index(x['ka'])):
        page = v.get('page') or brut['page']
        lignes += ['', f"## {propre(v['nom'])} — Ka-{v['ka']}", '', f"{propre(v['description'])} *(p. {page})*"]
        index.append({'nom': propre(v['nom']), 'fichier': nom_fichier,
                      'details': {'Ka-élément': v['ka'], 'Ère': brut['ere'], 'Époque': brut['epoque'], 'Page': page}})
    lignes += ['', '---', '',
               'Extrait du carnet NotebookLM « Nephilim » le 2026-10-17, **non relu contre le livre**.']
    texte = '\n'.join(lignes) + '\n'
    open(os.path.join(SORTIE, nom_fichier), 'w', encoding='utf-8').write(texte)
    print(f'{nom_fichier} : {len(texte)} car.')

# Un **référentiel** au sens de GM-OS (`SheetField.referentiel`) : des entrées nommées, le fichier
# Markdown qui les décrit (une section « ## <nom> — … » chacune), et des détails à afficher.
json.dump({
    'referentiel': 'Vécus passés',
    'source': SOURCE + ', p. 61 à 99',
    'extrait': '2026-10-17, carnet NotebookLM « Nephilim », non relu contre le livre',
    'entrees': index,
    'epoquesManquantes': manquantes,
}, open(os.path.join(SORTIE, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Vécus :', len(index), '| époques manquantes :', [m['epoque'] for m in manquantes])


# ---- Les époques d'incarnation (2026-10-17) -----------------------------------------------------
# Un second référentiel : les 20 époques, pour les champs « Incarnation » de la fiche. Le résumé vient
# du catalogue du carnet (`catalogue-des-epoques.json`) ; les dates et les Vécus, des réponses brutes.
catalogue = {e['epoque']: e for e in json.load(open(os.path.join(ICI, 'catalogue-des-epoques.json'), encoding='utf-8'))}
bruts = sorted((json.load(open(c, encoding='utf-8')) for c in glob.glob(os.path.join(ICI, 'bruts', '*.json'))), key=lambda b: b['ordre'])
lignes, entrees = ['# Les époques d’incarnation', '',
                   f'Les vingt époques des sept ères, d’après le *{SOURCE}*, p. 61 à 99. Une section par époque.'], []
for b in bruts:
    donnees = lire(b['reponse']) or {}
    vecus = donnees.get('vecus') or []
    complete = len(vecus) == 5 and sorted(v.get('ka') for v in vecus) == sorted(KA)
    dates = propre(donnees.get('dates_et_lieux')) if complete else ''
    resume = catalogue.get(b['epoque'], {}).get('resume', '')
    lignes += ['', f"## {b['epoque']} — {b['ere']}", '']
    if resume:
        lignes += [resume]
    if dates:
        lignes += ['', f'Dates et lieux : {dates}.'.replace('..', '.')]
    if complete:
        noms = ', '.join(f"{propre(v['nom'])} (Ka-{v['ka']})" for v in sorted(vecus, key=lambda x: KA.index(x['ka'])))
        lignes += ['', f'Vécus : {noms}.']
    else:
        lignes += ['', 'Vécus : non transcrits — la page manque aux sources du carnet.']
    lignes += ['', f"*(p. {b['page']})*"]
    details = {'Ère': b['ere'], 'Page': b['page']}
    if dates:
        details['Dates et lieux'] = dates
    entrees.append({'nom': b['epoque'], 'fichier': 'epoques.md', 'details': details})
lignes += ['', '---', '', 'Extrait du carnet NotebookLM « Nephilim » le 2026-10-17, **non relu contre le livre**.']
open(os.path.join(SORTIE, 'epoques.md'), 'w', encoding='utf-8').write('\n'.join(lignes) + '\n')
json.dump({'referentiel': 'Époques d’incarnation', 'source': SOURCE + ', p. 61 à 99',
           'extrait': '2026-10-17, carnet NotebookLM « Nephilim », non relu contre le livre', 'entrees': entrees},
          open(os.path.join(SORTIE, 'epoques.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Époques :', len(entrees))
