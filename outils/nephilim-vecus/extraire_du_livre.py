# Extrait les époques d'incarnation et leurs Vécus passés DU LIVRE, pas du carnet (2026-10-18).
# Le carnet avait donné vingt époques, dont quatre qui n'existent pas ; le livre en a trente et une
# (Quintessence, p. 61 à 98). Les titres sont dans le texte du PDF ; les cinq descriptions de Vécus
# sont en cinq colonnes (Feu, Air, Eau, Lune, Terre), qu'on sépare par leur abscisse (pypdf) ; les
# noms se lisent en mise en page (pdftotext -layout), où ils restent séparés par des blancs.
# Usage : python -I -X utf8 outils/nephilim-vecus/extraire_du_livre.py <quintessence.pdf>
# Écrit `outils/nephilim-vecus/livre/epoques.json`, que `ecrire_vecus.py` met en forme.
import json, os, re, subprocess, sys
from pypdf import PdfReader

PDF = sys.argv[1]
ICI = os.path.dirname(os.path.abspath(__file__))
KA = ['Feu', 'Air', 'Eau', 'Lune', 'Terre']          # l'ordre des colonnes du livre
DECALAGE = 1                                           # page du PDF = page du livre + 1
# Les ères, par la première page (du livre) de leur chapitre — table des matières, p. 318.
ERES = [(61, 'Le Sentier d’or'), (63, 'Les Guerres élémentaires'), (69, 'Les Compacts secrets'),
        (75, 'L’Hermétisme'), (81, 'Les guerres secrètes'), (87, 'Les nouveaux mondes'), (93, 'Le grand réveil')]
# Ce que la mise en page ne rend pas lisible, relu sur le PDF.
NOMS_CORRIGES = {
    'Les arthuriades': ['Reine picte', 'Chevalier mystique', 'Moine évangéliste', 'Chevalier errant', 'Marchand romain'],
}
# Les erreurs du livre lui-même, signalées plutôt que recopiées ou devinées.
ERRATA = {
    ('Le sanctuaire des Tuatha de Danann', 'Druide'):
        'Le livre (p. 70) imprime ici, par erreur, la description du Chasseur des premiers mégalithes '
        '(p. 68). Le Druide n’a pas de description propre : au meneur et au joueur de la raconter.',
}
# Une coquille du titre (« La chûte du Temple ») : GM-OS compare les noms sans accents, l'ancien reste reconnu.
TITRES_REDRESSES = {'La chûte du Temple': 'La chute du Temple'}
TITRES_CORRIGES = {
    # La première époque imprime son titre, son lieu et sa date en bas de page, après les apports.
    62: ('La Chute de l’Atlantide', 'Jadis', 'L’Atlantide'),
}

def recoller(lignes):
    """Des lignes du PDF à un paragraphe : césures recollées, espaces parasites (« V ous ») retirés."""
    texte = ''
    for l in lignes:
        l = l.replace('\xa0', ' ').strip()
        if not l:
            continue
        if texte.endswith('-') and l[:1].islower():
            texte = texte[:-1] + l
        else:
            texte = (texte + ' ' + l) if texte else l
    texte = re.sub(r'\b([VTLY]) (?=[a-zàâéèêîôûç’])', r'\1', texte)   # « V ous », « T roie »
    texte = re.sub(r'([dlL]’) (?=\w)', r'\1', texte)                   # « d’ Achille »
    texte = re.sub(r' ([,.])', r'\1', texte)
    return re.sub(r'\s+', ' ', texte).strip()

def ere_de(page):
    return [nom for debut, nom in ERES if debut <= page][-1]

lecteur = PdfReader(PDF)
mise_en_page = {}
for i in range(61, 100):
    sortie = subprocess.run(['pdftotext', '-f', str(i + 1), '-l', str(i + 1), '-layout', '-enc', 'UTF-8', PDF, '-'],
                            capture_output=True).stdout.decode('utf-8')
    mise_en_page[i] = sortie.splitlines()

epoques = []
for i in range(61, 100):
    page = lecteur.pages[i]
    texte = page.extract_text() or ''
    if 'Vécus passés' not in texte:
        continue
    livre = i + 1 - DECALAGE

    # — Le titre, puis les lignes courtes qui le suivent : la date (« -1200 », « 1650 » « -1715 »,
    #   « XIIe ») et les lieux, dans un ordre qui varie. L'introduction commence à la première longue.
    tete = [l.strip() for l in texte.splitlines() if l.strip()]
    if livre in TITRES_CORRIGES:
        titre, date, lieux = TITRES_CORRIGES[livre]
    else:
        titre, dates, places = tete[0], [], []
        for l in tete[1:6]:
            if len(l) > 55:
                break
            (dates if re.fullmatch(r'-?\s?\d[\d ]*|X[IVX]*e', l) else places).append(l)
        date = re.sub(r'\s*-\s*', '-', ' '.join(dates)).replace(' ', ' ').strip()
        date = re.sub(r'(\d)-(\d)', r'\1 – \2', date)
        lieux = ' ; '.join(places)
    cout = re.search(r'\((\d) PI\)', texte)
    titre = re.sub(r'\s*\(\d PI\)', '', titre).strip()
    titre = TITRES_REDRESSES.get(titre, titre)

    # — L'introduction (jusqu'aux quêtes), et ce que l'incarnation apporte (jusqu'aux Vécus).
    lignes = texte.splitlines()
    q = next(n for n, l in enumerate(lignes) if l.strip().startswith('Les quêtes ésotériques'))
    v = next(n for n, l in enumerate(lignes) if l.strip().startswith('Vécus passés'))
    d = next((n for n, l in enumerate(lignes[:q]) if len(l.strip()) > 55), 0)
    introduction = recoller(lignes[d:q])
    apports = [recoller([l]) for l in lignes[q:v] if ' : ' in l]

    # — Les noms : la ligne sous « Feu Air Eau Lune Terre », et ses suites tant qu'elles sont courtes.
    L = mise_en_page[i]
    k = next(j for j, l in enumerate(L) if re.search(r'Feu\s+Air\s+.*Lune\s+Terre', l))
    j = k + 1
    while not L[j].strip():
        j += 1
    premiere = L[j]
    noms = [(m.start(), m.group(0).strip()) for m in re.finditer(r'\S+(?: \S+)*', premiere)]
    suite = L[j + 1] if j + 1 < len(L) else ''
    # Une suite de nom (« du soleil », « byzantin ») : un fragment court, sous le début d'un nom.
    for m in re.finditer(r'\S+(?: \S+)*', suite):
        if len(noms) == 5 and len(m.group(0)) <= 22 and m.group(0)[:1].islower():
            col = min(range(5), key=lambda c: abs(noms[c][0] - m.start()))
            noms[col] = (noms[col][0], noms[col][1] + ' ' + m.group(0).strip())
    # La colonne Eau descend parfois d'une ligne : « Eau » prend la place du nom, qui est dessous.
    for c, (pos, nom) in enumerate(noms):
        if nom != 'Eau':
            continue
        for l in L[j + 1:j + 5]:
            proche = [m for m in re.finditer(r'\S+(?: \S+)*', l) if abs(m.start() - pos) <= 12]
            if proche:
                noms[c] = (pos, proche[0].group(0).strip())
                break
    noms = [n for _, n in noms]
    if titre in NOMS_CORRIGES:
        noms = NOMS_CORRIGES[titre]

    # — Les descriptions : les fragments après la ligne des noms, groupés par colonne (abscisse).
    morceaux = []
    def visiter(t, cm, tm, police, taille):
        if t.strip():
            x = tm[4] * cm[0] + tm[5] * cm[2] + cm[4]
            morceaux.append((x, t))
    page.extract_text(visitor_text=visiter)
    debut = next(n for n, (_, t) in enumerate(morceaux) if re.search(r'Feu\s+Air\s+.*Lune\s+Terre', t))
    colonnes, x_courant = [], None
    tous_les_noms = re.sub(r'\s+', '', ''.join(noms))
    for x, t in morceaux[debut + 1:]:
        if re.fullmatch(r'\s*\(\d PI\)\s*', t):
            continue
        # La ligne des noms, quand elle vient en fragment à part : elle n'est pas une description.
        if not colonnes and re.sub(r'\s+', '', t) and re.sub(r'\s+', '', t) in tous_les_noms:
            continue
        if x_courant is None or abs(x - x_courant) > 20:
            colonnes.append([])
            x_courant = x
        colonnes[-1].append(t)
    # Après les cinq colonnes vient le reste de la page (titre, introduction) : on s'arrête à cinq.
    colonnes = colonnes[:5]
    descriptions = [recoller(''.join(c).splitlines()) for c in colonnes]

    epoques.append({
        'ere': ere_de(livre), 'epoque': titre, 'page': livre, 'date': date, 'lieux': lieux,
        'cout': int(cout.group(1)) if cout else None,
        'introduction': introduction, 'apports': apports,
        'vecus': [{'nom': n, 'ka': KA[c],
                   'description': ERRATA.get((titre, n)) or (descriptions[c] if c < len(descriptions) else ''),
                   **({'erratum': True} if (titre, n) in ERRATA else {})}
                  for c, n in enumerate(noms)],
        'controle': {'noms': len(noms), 'colonnes': len(colonnes)},
    })
    print(f"p. {livre:>3} {titre:42} {len(noms)} noms, {len(colonnes)} colonnes")

# — L'errata officiel (« Synthèse errata Quintessence », V1.3, « Eres et époques », p. 4).
par_page = {e['page']: e for e in epoques}
# P. 94, Aristocrate rentière : « Suppression de “Vous avez été au service d’An” ».
for v in par_page[94]['vecus']:
    if v['nom'] == 'Aristocrate rentière':
        v['description'] = v['description'].replace('Vous avez été au service d’An', '', 1).strip()
        v['errata'] = 'V1.3, p. 94'
# P. 97 et 98 : les Vécus de Feu et d'Air sont intervertis entre L'Éveil et Les Chroniques de
# l'Apocalypse — « Policière et Journaliste dans L'Éveil, Publicitaire et Prof dans Les Chroniques ».
eveil, chroniques = par_page[97]['vecus'], par_page[98]['vecus']
for c in (0, 1):
    eveil[c], chroniques[c] = chroniques[c], eveil[c]
    eveil[c]['errata'] = chroniques[c]['errata'] = 'V1.3, p. 97–98'
assert [v['nom'] for v in eveil[:2]] == ['Policière', 'Journaliste']
assert [v['nom'] for v in chroniques[:2]] == ['Publicitaire', 'Prof']

os.makedirs(os.path.join(ICI, 'livre'), exist_ok=True)
json.dump(epoques, open(os.path.join(ICI, 'livre', 'epoques.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(epoques), 'époques,', sum(len(e['vecus']) for e in epoques), 'Vécus')
