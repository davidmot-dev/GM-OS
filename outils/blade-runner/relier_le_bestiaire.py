# Relie le bestiaire du pilote Blade Runner à sa fiche — pilote 2.1.0, 19/11/2026, Claude Code.
# Chantier § 263 du registre, tâche T8 (documentation/Planning/2026-11-19-combat-jets-des-adversaires-et-degats.md).
# David : « les lancer de dés des PNJ/Créatures, les calculs des dégâts, ce n'est pas toujours
# intuitif » ; décision D3 du 19/11 : « Oui, les deux » (corriger le bestiaire Blade Runner).
#
# Constat (capture du 19/11) : un « Agent du LAPD en uniforme » posé depuis l'onglet « Livre » entrait
# au combat avec une fiche VIDE (`{}`) : aucune colonne du bestiaire ne déclarait le champ qu'elle
# remplit, ses valeurs n'allaient que dans les notes. Aucun jet n'était donc possible pour lui.
#
# Ce que fait ce script, sans toucher aucun identifiant (pilote, fiche, créatures, colonnes gardées) :
#
# - chaque colonne d'attribut ou de compétence déclare son `champ` de la fiche (VIG → vigueur,
#   Armes à feu → armesAFeu…) ; Santé → sante ;
# - les niveaux s'écrivent dans la forme des options de la fiche : « B » devient « B (D10) », sans
#   quoi la liste de la fiche montrerait une valeur hors de ses propres options ;
# - les neuf créatures dont les attributs et les compétences n'étaient qu'un texte (« VIG D, AGI B,
#   INT C, EMP C », « Mobilité C, Discrétion C ») sont découpées en colonnes ; les deux colonnes de
#   texte, devenues vides, sont retirées ; deux colonnes s'ajoutent pour les compétences que ce texte
#   nommait sans colonne (Assistance médicale, Technologie) ;
# - « Santé maximale » (→ santeMax) reprend la Santé du livre : la jauge du pilote lit son maximum
#   dans santeMax ; une créature entre au combat en pleine santé ;
# - « Armes (catalogue) » nomme l'arme du catalogue du pilote **quand le livre la nomme exactement** —
#   cinq créatures sur treize. Rien n'est deviné : « Couteau » (de survie ? pliant ?) et « Matraque »
#   restent sans rattachement ; le fusil d'assaut Ender et le .357 subcompact ne sont pas au
#   catalogue. Les particularités du livre ne changent pas.
# - version 2.1.0.
#
# Les valeurs viennent de la fiche de corpus `bestiaire-et-adversaires.md` (marquée relu: false), déjà
# portées par le pilote 2.0.0 : ce script ne les change pas, il les range.
#
# Usage : python -I -X utf8 outils/blade-runner/relier_le_bestiaire.py <export 2.0.0> <sortie .gmos-driver>
import json, os, sys, unicodedata, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'blade-runner':
    sys.exit(f"Ce n'est pas le pilote Blade Runner : {pilote.get('name')!r}.")
if pilote.get('version') != '2.0.0':
    sys.exit(f"Ce script part du pilote 2.0.0, pas de la version {pilote.get('version')!r}.")

champs = {f['id']: f for s in etat['sheetTemplate']['sections'] for f in s['fields']}
bestiaire = pilote['bestiaire']
catalogue = {o['nom']: o for o in pilote['catalogue']['objets']}

def plier(texte):
    return ''.join(c for c in unicodedata.normalize('NFD', texte) if unicodedata.category(c) != 'Mn').lower().strip()

# Les niveaux, lus dans les options de la fiche : « B » → « B (D10) ».
NIVEAUX = {o.split()[0]: o for o in champs['vigueur']['options']}
if sorted(NIVEAUX) != ['A', 'B', 'C', 'D']:
    sys.exit(f"Options d'attribut inattendues : {champs['vigueur']['options']}.")

# Colonne → champ de la fiche. Les colonnes d'attribut et de compétence portent un niveau.
LIENS = {
    'vig': 'vigueur', 'agi': 'agilite', 'int': 'intelligence', 'emp': 'empathie',
    'armes-a-feu': 'armesAFeu', 'conduite': 'conduite', 'corps-a-corps': 'corpsACorps',
    'discretion': 'discretion', 'manipulation': 'manipulation', 'mobilite': 'mobilite',
    'observation': 'observation', 'psychologie': 'psychologie',
    'assistance-medicale': 'assistanceMedicale', 'technologie': 'technologie',
}
NOUVELLES = [
    {'id': 'assistance-medicale', 'libelle': 'Assistance médicale', 'nature': 'texte'},
    {'id': 'technologie', 'libelle': 'Technologie', 'nature': 'texte'},
    {'id': 'sante-max', 'libelle': 'Santé maximale', 'nature': 'nombre', 'champ': 'santeMax'},
    {'id': 'armes', 'libelle': 'Armes (catalogue)', 'nature': 'texte'},
]
ATTRIBUTS = {'VIG': 'vig', 'AGI': 'agi', 'INT': 'int', 'EMP': 'emp'}

# Les armes que le livre nomme exactement, et le nom de l'objet au catalogue.
ARMES = {
    'agent-du-lapd-en-uniforme': ['Matraque de policier'],   # « Matraque de policier, tenue de maintien de l'ordre »
    'arnaqueur-des-rues': ['Couteau pliant'],
    'sympathisant-des-replicants': ['Couteau pliant'],
    'blade-runner': ['Blaster PK-D 5223'],
    'loubard': ['Coups-de-poing'],                            # « Couteau ou coup-de-poing » : le couteau reste à choisir
}
for noms in ARMES.values():
    for nom in noms:
        if catalogue.get(nom, {}).get('famille') != 'arme':
            sys.exit(f"« {nom} » n'est pas une arme du catalogue.")

# 1. Les colonnes : nouvelles colonnes, puis liens.
ids = {c['id'] for c in bestiaire['colonnes']}
for c in NOUVELLES:
    if c['id'] in ids:
        sys.exit(f"La colonne « {c['id']} » existe déjà : ce pilote a-t-il déjà été relié ?")
bestiaire['colonnes'].extend(NOUVELLES)
libelles = {plier(c['libelle']): c['id'] for c in bestiaire['colonnes']}
for c in bestiaire['colonnes']:
    if c['id'] in LIENS:
        c['champ'] = LIENS[c['id']]
    elif c['id'] == 'sante':
        c['champ'] = 'sante'

# 2. Les créatures : textes découpés, niveaux dans la forme de la fiche, Santé maximale, armes.
for cr in bestiaire['creatures']:
    v = cr['valeurs']
    texte = v.pop('attributs', None)
    if texte:
        for morceau in texte.split(','):
            sigle, niveau = morceau.split()
            v[ATTRIBUTS[sigle]] = niveau
    texte = v.pop('competences', None)
    if texte:
        for morceau in texte.split(','):
            nom, niveau = morceau.strip().rsplit(' ', 1)
            colonne = libelles.get(plier(nom))
            if colonne not in LIENS:
                sys.exit(f"{cr['nom']} : compétence « {nom} » sans colonne reliée.")
            v[colonne] = niveau
    for cle in list(v):
        if cle in LIENS:
            niveau = str(v[cle]).strip()
            if niveau[:1] not in NIVEAUX or (len(niveau) > 1 and niveau not in NIVEAUX.values()):
                sys.exit(f"{cr['nom']} : niveau « {niveau} » illisible dans « {cle} ».")
            v[cle] = NIVEAUX[niveau[:1]]
    if not isinstance(v.get('sante'), int):
        sys.exit(f"{cr['nom']} : Santé absente ou non entière ({v.get('sante')!r}).")
    v['sante-max'] = v['sante']
    if cr['id'] in ARMES:
        v['armes'] = ' ; '.join(ARMES[cr['id']])
inconnues = set(ARMES) - {cr['id'] for cr in bestiaire['creatures']}
if inconnues:
    sys.exit(f"Créatures attendues absentes : {', '.join(sorted(inconnues))}.")

# 3. Les colonnes de texte devenues vides s'en vont.
for vide in ('attributs', 'competences'):
    if any(vide in cr['valeurs'] for cr in bestiaire['creatures']):
        sys.exit(f"La colonne « {vide} » porte encore des valeurs.")
bestiaire['colonnes'] = [c for c in bestiaire['colonnes'] if c['id'] not in ('attributs', 'competences')]

# 4. Chaque lien vise un champ de la fiche ; chaque niveau est une option de son champ.
for c in bestiaire['colonnes']:
    if 'champ' in c and c['champ'] not in champs:
        sys.exit(f"La colonne « {c['libelle']} » vise « {c['champ']} », absent de la fiche.")
for cr in bestiaire['creatures']:
    for cle, val in cr['valeurs'].items():
        if cle in LIENS and val not in champs[LIENS[cle]].get('options', [val]):
            sys.exit(f"{cr['nom']} : « {val} » n'est pas une option de « {LIENS[cle]} ».")

pilote['version'] = '2.1.0'

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

relies = sum(1 for c in bestiaire['colonnes'] if 'champ' in c)
print(f"Pilote {pilote['name']} 2.1.0 : {relies} colonnes reliées à la fiche, "
      f"{len(bestiaire['creatures'])} créatures rangées, {len(ARMES)} armes rattachées au catalogue → {sortie}")
