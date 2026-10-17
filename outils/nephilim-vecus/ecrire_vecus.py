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
        index.append({'nom': propre(v['nom']), 'ka': v['ka'], 'ere': brut['ere'], 'epoque': brut['epoque'],
                      'page': page, 'fichier': nom_fichier})
    lignes += ['', '---', '',
               'Extrait du carnet NotebookLM « Nephilim » le 2026-10-17, **non relu contre le livre**.']
    texte = '\n'.join(lignes) + '\n'
    open(os.path.join(SORTIE, nom_fichier), 'w', encoding='utf-8').write(texte)
    print(f'{nom_fichier} : {len(texte)} car.')

json.dump({
    'source': SOURCE + ', p. 61 à 99',
    'extrait': '2026-10-17, carnet NotebookLM « Nephilim », non relu contre le livre',
    'vecus': index,
    'epoquesManquantes': manquantes,
}, open(os.path.join(SORTIE, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Vécus :', len(index), '| époques manquantes :', [m['epoque'] for m in manquantes])
