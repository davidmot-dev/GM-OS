# Finit le pilote Traveller (livre de règles français v2.2) — 2026-11-26, Claude Code, à la demande de
# David (skill finir-un-pilote, « Tout, dans l'ordre » ; report automatique des dégâts choisi le 26/11).
# Pages imprimées ; page du PDF = imprimée + 1 (docs/systems/traveller/livres.json).
#
# Part de l'export forgé du 26/11 (Traveller_driver_gmos_1795727415761) et garde l'identifiant du
# pilote et de son modèle de fiche : la réimportation se fait avec « Remplacer ».
#
# - `jet` : 2D + MD de la caractéristique + niveau de compétence contre le nombre cible, 8+ pour une
#   tâche Moyenne ; MD−3 sans la compétence, réduit par Polyvalent (`jet.traveller`, p. 9, 58-61, 69).
#   Le pilote forgé comparait chaque d6 à la valeur brute de la caractéristique et exigeait huit
#   réussites de deux dés (`difficulte` 8) : tout jet échouait. Retirés : `difficulte`, `critique` et
#   `complication`, des réglages de réserve sans objet ici ; la difficulté se règle au jet (p. 60) ;
# - la fiche GM-OS reprend une à une les clés de la fiche HTML `traveller-fr` (GM-OS Studio, 26/11),
#   lues dans son gabarit : 328 des 331 champs — le portrait (celui de GM-OS) et les deux copies de
#   la page 2 (nom, espèce, que la fiche recopie seule) restent à la fiche. Les 72 lignes de
#   compétence remplacent la zone de texte unique du pilote forgé : un niveau est un TEXTE, car une
#   case vide (non formé, MD−3) n'est pas un 0 (formé, p. 58), et un champ nombre de GM-OS affiche 0 ;
# - la santé : pas de points de vie ; les dégâts frappent l'END, puis la FOR ou la DEX au choix
#   (`excedent_degats`), puis la dernière ; FOR ou DEX à 0, inconscient ; les trois, tué (p. 74)
#   (`combat.physiqueTraveller`). La santé principale est leur total, `sante_physique`, et chacune a
#   son niveau sans blessure (`*_max`), où s'arrête un soin (p. 79). Le pilote forgé suivait la Force
#   comme santé principale et partait de l'Endurance ;
# - l'initiative : l'Effet d'un test de DEX, 2D + MD DEX − 8 (p. 71) — le forgé écrivait une phrase ;
# - les portées : les Zones de Portée des rencontres (p. 80) ; leurs MD dépendent de la portée de
#   l'arme (p. 74, 72), et se règlent au jet. Le forgé en avait deux « Portée Extrême » ;
# - le bestiaire : la colonne PDV remplit la santé principale d'une créature (p. 81) ;
# - le catalogue : trois valeurs écrites en phrase deviennent des nombres, la phrase passe en
#   description (Ablat, Reflec, puissance des ordinateurs) ;
# - version 2.0.0.
#
# 2.1.0 — 2026-11-27, TRV-A5 (David : « Oui, pilote 2.1.0 », « Dose + geste Exposition ») :
# - la PSI se dépense et revient d'un point par heure ; le MD des pouvoirs suit la PSI actuelle
#   (p. 224-225). Nouveau champ `psi_max` (« PSI sans dépense »), maximum de la jauge PSI, relevé par
#   l'alignement comme les maxima physiques (`physiqueTraveller.psi`) ;
# - les Rads sont une dose cumulée, sans maximum (p. 78) : `combat.radiationsTraveller` — la carte de
#   combat montre la dose, la conséquence cumulée et le prochain seuil, et offre « Exposition ».
#
# 2.2.0 — 2026-11-27, TRV-A6 (David : « Les cinq », « Oui, pilote 2.2.0 ») :
# - une arme Incapacitante ne frappe que l'END et ses dégâts guérissent entièrement après une heure
#   de repos (p. 76) : nouveau champ `degats_incapacitants` (« Dégâts incapacitants à guérir »), sans
#   case sur la fiche HTML, que la porte des dégâts additionne et que « Une heure de repos » rend
#   (`physiqueTraveller.incapacitants`). Les munitions s'écrivent « 26/30 » dans le champ existant.
#
# Usage : python -I -X utf8 outils/traveller/finir_traveller.py <export forgé> <sortie .gmos-driver> [correspondance.json]
import json, os, re, sys, unicodedata, zipfile

entree, sortie = sys.argv[1:3]
sortie_correspondance = sys.argv[3] if len(sys.argv) > 3 else None
FICHE_HTML = 'docs/fiches/Traveller/traveller-fiche-personnage-interactive.html'

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'traveller':
    sys.exit(f"Ce n'est pas le pilote Traveller : {pilote.get('name')!r}.")

html = open(FICHE_HTML, encoding='utf-8').read()
gabarit = json.loads(re.search(r'<script\b[^>]*\bid=["\']character-sheet-template["\'][^>]*>([\s\S]*?)</script>', html, re.I).group(1))['template']
assert gabarit['id'] == 'traveller-fr', gabarit['id']
CLES = {f['key']: f for p in gabarit['pages'] for f in p['fields']}

correspondance = []


def champ(id, label, type, fiche=None, defaut='', **plus):
    if fiche:
        assert fiche in CLES, f'clé absente de la fiche HTML : {fiche}'
        correspondance.append({'gmos': id, 'fiche': fiche})
    return {'id': id, 'label': label, 'type': type, 'defaultValue': defaut, **plus}


texte = lambda id, label, fiche=None, **p: champ(id, label, 'text', fiche, '', **p)
long = lambda id, label, fiche=None, **p: champ(id, label, 'textarea', fiche, '', **p)
nombre = lambda id, label, fiche=None, defaut=0, **p: champ(id, label, 'number', fiche, defaut, **p)


def slug(texte):
    s = unicodedata.normalize('NFD', texte.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '_', s).strip('_')


# ─── Caractéristiques (p. 9) ─────────────────────────────────────────────────
CARACS = [('force', 'Force (FOR)', 'FOR', 'strength'), ('dexterite', 'Dextérité (DEX)', 'DEX', 'dexterity'),
          ('endurance', 'Endurance (END)', 'END', 'endurance'), ('intellect', 'Intellect (INT)', 'INT', 'intellect'),
          ('education', 'Éducation (ÉDU)', 'ÉDU', 'education'), ('statut_social', 'Statut social (SOC)', 'SOC', 'social'),
          ('psi', 'Psionique (PSI)', 'PSI', 'psionics')]
OPTIONNELLES = [('moral', 'Moral', 'morale'), ('chance', 'Chance', 'luck'), ('sante_mentale', 'Santé mentale', 'sanity'),
                ('charisme', 'Charisme', 'charisma'), ('autre_caracteristique', 'Autre caractéristique', 'other')]
PHYSIQUES = ['endurance', 'force', 'dexterite']

caracteristiques = [nombre(id, label, f'attributes.{cle}.value', 0 if id == 'psi' else 7) for id, label, _, cle in CARACS]
mds = [nombre(f'{id}_md', f'MD {abr}', f'attributes.{cle}.modifier', -3 if id == 'psi' else 0) for id, _, abr, cle in CARACS]
optionnelles = [nombre(id, label, f'attributes.{cle}.value', **({'libelleSur': 'autre_caracteristique_nom', 'libelleEnPrecision': True} if cle == 'other' else {}))
                for id, label, cle in OPTIONNELLES]
optionnelles_md = [nombre(f'{id}_md', f'MD {label}', f'attributes.{cle}.modifier') for id, label, cle in OPTIONNELLES]
# Le nom vit dans la section de la valeur qu'il nomme : le menu du jet le lit là (`libelleSur`).
optionnelles.append(texte('autre_caracteristique_nom', 'Nom de l’autre caractéristique', 'attributes.other.label'))

# ─── Compétences (p. 58, 64-69) : les lignes de la fiche, dans son ordre ────
competences, lignes = [], []
par_domaine = {}
for n in range(72):
    niveau = CLES[f'skills.{n}.level']
    domaine = niveau['label'].split(' — ')[0]
    if f'skills.{n}.name' in CLES:  # Compétence libre k : son nom se saisit.
        id = slug(domaine)
        competences += [texte(id, domaine, f'skills.{n}.level', libelleSur=f'{id}_nom'), texte(f'{id}_nom', f'{domaine} — nom', f'skills.{n}.name')]
        lignes.append({'niveau': id, 'domaine': domaine})
        continue
    k = par_domaine[domaine] = par_domaine.get(domaine, 0) + 1
    specialite = f'skills.{n}.specialty' in CLES
    multiple = sum(1 for m in range(72) if CLES[f'skills.{m}.level']['label'].split(' — ')[0] == domaine) > 1
    id = f'{slug(domaine)}_{k}' if multiple else slug(domaine)
    label = domaine if k == 1 else f'{domaine} (spécialité {k})'
    if specialite:
        competences += [texte(id, label, f'skills.{n}.level', libelleSur=f'{id}_specialite', libelleEnPrecision=True),
                        texte(f'{id}_specialite', f'{domaine} — spécialité{"" if k == 1 else f" {k}"}', f'skills.{n}.specialty')]
        lignes.append({'niveau': id, 'domaine': domaine, 'specialite': f'{id}_specialite'})
    else:
        competences.append(texte(id, label, f'skills.{n}.level'))
        lignes.append({'niveau': id, 'domaine': domaine})
assert 'polyvalent' in {c['niveau'] for c in lignes}

# ─── Le reste de la fiche ────────────────────────────────────────────────────
rangs = lambda nb, f: [x for i in range(nb) for x in f(i)]
sections = [
    {'id': 'personnage', 'label': 'Personnage', 'fields': [
        texte('nom', 'Nom', 'identity.name'), texte('titre', 'Titre', 'identity.title'), texte('age', 'Âge', 'identity.age'),
        texte('genre', 'Genre', 'identity.gender'), texte('espece', 'Espèce', 'identity.species'),
        texte('monde_natal', 'Monde natal', 'identity.homeworld'), long('traits', 'Traits', 'identity.traits'),
        long('traits_visage', 'Traits de visage', 'identity.face'),
    ]},
    {'id': 'caracteristiques', 'label': 'Caractéristiques', 'fields': caracteristiques},
    {'id': 'caracteristiques_md', 'label': 'Modificateurs de dés (MD)', 'fields': mds},
    {'id': 'physique', 'label': 'Blessures et radiations', 'fields': [
        nombre('sante_physique', 'Physique (END + FOR + DEX)', None, 21),
        nombre('endurance_max', 'END sans blessure', None, 7), nombre('force_max', 'FOR sans blessure', None, 7),
        nombre('dexterite_max', 'DEX sans blessure', None, 7), nombre('psi_max', 'PSI sans dépense', None, 0),
        nombre('degats_incapacitants', 'Dégâts incapacitants à guérir', None, 0),
        champ('excedent_degats', 'Excédent des dégâts, l’END à 0', 'select', None, 'Force', options=['Force', 'Dextérité']),
        nombre('rads', 'Rads', 'identity.rads'),
    ]},
    {'id': 'competences', 'label': 'Compétences', 'fields': competences},
    {'id': 'caracteristiques_optionnelles', 'label': 'Caractéristiques optionnelles', 'fields': optionnelles},
    {'id': 'caracteristiques_optionnelles_md', 'label': 'MD des caractéristiques optionnelles', 'fields': optionnelles_md},
    {'id': 'profil_universel', 'label': 'Profil universel', 'fields': [
        texte(f'profil_{id}', f'Profil universel — {abr}', f'profile.{cle}') for id, _, abr, cle in CARACS if id != 'psi'
    ]},
    {'id': 'carrieres', 'label': 'Carrières', 'fields': rangs(5, lambda i: [
        texte(f'carriere_{i + 1}', f'Carrière {i + 1}', f'careers.{i}.name'),
        texte(f'carriere_{i + 1}_periodes', f'Carrière {i + 1} — périodes', f'careers.{i}.terms'),
        texte(f'carriere_{i + 1}_rang', f'Carrière {i + 1} — rang', f'careers.{i}.rank')])},
    {'id': 'finances', 'label': 'Finances', 'fields': [
        nombre('charges_vaisseau', 'Charges mensuelles du vaisseau', 'finances.ship_monthly'),
        nombre('pension', 'Pension', 'finances.pension'), nombre('cash', 'Cash disponible (Cr)', 'finances.cash'),
        nombre('dette', 'Dette', 'finances.debt'), nombre('depenses_base', 'Dépenses de base', 'finances.basic_expenses'),
    ]},
    {'id': 'periode_etude', 'label': 'Période d’étude', 'fields': [
        texte('formation_competence', 'Formation dans la compétence', 'training.skill'),
        texte('formation_semaines', 'Semaines de formation', 'training.weeks'),
        texte('formation_complete', 'Période de formation complète', 'training.completed'),
    ]},
    {'id': 'armes', 'label': 'Armes', 'fields': rangs(6, lambda i: [
        texte(f'arme_{i + 1}', f'Arme {i + 1}', f'weapons.{i}.name'), texte(f'arme_{i + 1}_nt', f'Arme {i + 1} — NT', f'weapons.{i}.tech_level'),
        texte(f'arme_{i + 1}_portee', f'Arme {i + 1} — portée', f'weapons.{i}.range'), texte(f'arme_{i + 1}_degats', f'Arme {i + 1} — dégâts', f'weapons.{i}.damage'),
        texte(f'arme_{i + 1}_masse', f'Arme {i + 1} — kg', f'weapons.{i}.weight'), texte(f'arme_{i + 1}_munitions', f'Arme {i + 1} — munitions', f'weapons.{i}.ammunition')])},
    {'id': 'armures', 'label': 'Armure', 'fields': rangs(4, lambda i: [
        texte(f'armure_{i + 1}', f'Armure {i + 1}', f'armor.{i}.type'), texte(f'armure_{i + 1}_rad', f'Armure {i + 1} — RAD', f'armor.{i}.rad'),
        texte(f'armure_{i + 1}_protection', f'Armure {i + 1} — protection', f'armor.{i}.protection'),
        texte(f'armure_{i + 1}_masse', f'Armure {i + 1} — kg', f'armor.{i}.weight'), texte(f'armure_{i + 1}_options', f'Armure {i + 1} — options', f'armor.{i}.options')])},
    {'id': 'augmentations', 'label': 'Augmentations', 'fields': rangs(4, lambda i: [
        texte(f'augmentation_{i + 1}', f'Augmentation {i + 1}', f'augmentations.{i}.type'),
        texte(f'augmentation_{i + 1}_nt', f'Augmentation {i + 1} — NT', f'augmentations.{i}.tech_level'),
        texte(f'augmentation_{i + 1}_amelioration', f'Augmentation {i + 1} — amélioration', f'augmentations.{i}.improvement')])},
    {'id': 'equipement', 'label': 'Équipement', 'fields': rangs(16, lambda i: [
        texte(f'equipement_{i + 1}', f'Équipement {i + 1}', f'equipment.{"left" if i < 8 else "right"}.{i % 8}.type'),
        texte(f'equipement_{i + 1}_masse', f'Équipement {i + 1} — masse', f'equipment.{"left" if i < 8 else "right"}.{i % 8}.weight')])
        + [texte('masse_totale', 'Masse totale portée', 'equipment.total_weight')]},
    {'id': 'relations', 'label': 'Connaissances', 'fields': [x for genre, id, nom in [('allies', 'allie', 'Allié'), ('contacts', 'contact', 'Contact'),
                                                                                    ('rivals', 'rival', 'Rival'), ('enemies', 'ennemi', 'Ennemi')]
                                                             for i in range(4) for x in [
                                                                 texte(f'{id}_{i + 1}', f'{nom} {i + 1}', f'relationships.{genre}.{i}.name'),
                                                                 texte(f'{id}_{i + 1}_notes', f'{nom} {i + 1} — notes', f'relationships.{genre}.{i}.notes')]]},
    {'id': 'blessures', 'label': 'Blessures à long terme', 'fields': rangs(2, lambda i: [
        texte(f'blessure_{i + 1}', f'Blessure {i + 1} — type', f'injuries.{i}.type'),
        texte(f'blessure_{i + 1}_localisation', f'Blessure {i + 1} — localisation', f'injuries.{i}.location'),
        texte(f'blessure_{i + 1}_recuperation', f'Blessure {i + 1} — récupération', f'injuries.{i}.recovery'),
        texte(f'blessure_{i + 1}_notes', f'Blessure {i + 1} — notes', f'injuries.{i}.notes')])},
    {'id': 'passe', 'label': 'Passé et contexte', 'fields': [
        long('passe', 'Passé', 'background.history'), long('contexte', 'Notes de contexte', 'background.context'),
    ]},
]
etat['sheetTemplate']['sections'] = sections

# ─── Le jet (p. 58-61) ───────────────────────────────────────────────────────
jet = pilote['jet']
for retire in ('difficulte', 'critique', 'complication', 'suitesDesCritiques', 'modificateurDuSeuil'):
    jet.pop(retire, None)
jet['seuil'] = [
    {'id': 'caracteristique', 'label': 'Caractéristique', 'sectionId': 'caracteristiques', 'sectionsSupplementaires': ['caracteristiques_optionnelles']},
    {'id': 'competence', 'label': 'Compétence', 'sectionId': 'competences', 'facultative': True},
]
jet['reserve'] = {'base': 2, 'max': 3, 'faces': 6}
jet['sens'] = 'superieur-ou-egal'
jet['traveller'] = {
    'caracteristiques': [id for id, *_ in CARACS] + [id for id, *_ in OPTIONNELLES],
    'md': {id: f'{id}_md' for id, *_ in CARACS},
    'competences': lignes,
    'polyvalent': 'polyvalent',
    'cible': 8,
}
pilote['dice'] = {'defaultDice': '2d6', 'logic': 'sum', 'engine': 'standard'}

# ─── Combat et santé (p. 71, 74, 79-81) ─────────────────────────────────────
combat = pilote['combat']
combat['initiativeFormula'] = '2d6 + dexterite_md - 8'
combat['initiativeSort'] = 'desc'
combat['defaultHealthType'] = 'hp'
combat['santeDeDepart'] = 'endurance_max + force_max + dexterite_max'
combat['statsToTrack'] = [
    {'fieldId': 'sante_physique', 'label': 'Physique (END + FOR + DEX)', 'isMainHP': True, 'isResource': False, 'max': 'endurance_max + force_max + dexterite_max'},
    {'fieldId': 'endurance', 'label': 'Endurance', 'isMainHP': False, 'isResource': False, 'max': 'endurance_max'},
    {'fieldId': 'force', 'label': 'Force', 'isMainHP': False, 'isResource': False, 'max': 'force_max'},
    {'fieldId': 'dexterite', 'label': 'Dextérité', 'isMainHP': False, 'isResource': False, 'max': 'dexterite_max'},
    {'fieldId': 'psi', 'label': 'Psionique', 'isMainHP': False, 'isResource': True, 'max': 'psi_max'},
    {'fieldId': 'rads', 'label': 'Rads', 'isMainHP': False, 'isResource': True},
]
combat['physiqueTraveller'] = {
    'mecanique': 'traveller', 'endurance': 'endurance', 'force': 'force', 'dexterite': 'dexterite',
    'excedent': 'excedent_degats', 'md': {id: f'{id}_md' for id in PHYSIQUES},
    'maximum': {id: f'{id}_max' for id in PHYSIQUES},
    'psi': {'champ': 'psi', 'maximum': 'psi_max'},
    'incapacitants': 'degats_incapacitants',
}
combat['radiationsTraveller'] = {'champ': 'rads', 'endurance': 'endurance', 'maximum': 'endurance_max'}
pilote['ui_config']['gauges'] = [
    {'fieldId': 'sante_physique', 'label': 'Physique', 'color': '#ef4444', 'style': 'bar'},
    {'fieldId': 'endurance', 'label': 'END', 'color': '#f97316', 'style': 'bar'},
    {'fieldId': 'force', 'label': 'FOR', 'color': '#eab308', 'style': 'bar'},
    {'fieldId': 'dexterite', 'label': 'DEX', 'color': '#22c55e', 'style': 'bar'},
    {'fieldId': 'psi', 'label': 'PSI', 'color': '#a855f7', 'style': 'bar'},
    {'fieldId': 'rads', 'label': 'Rads', 'color': '#84cc16', 'style': 'bar'},
]

pilote['tactical']['uniteDeDistance'] = 'mètres'
pilote['tactical']['ranges'] = {
    'proche': {'label': 'Proche (jusqu’à 5 m)', 'maxUnits': 5, 'modifier': 0},
    'courte': {'label': 'Courte (5 à 10 m)', 'maxUnits': 10, 'modifier': 0},
    'moyenne': {'label': 'Moyenne (11 à 50 m)', 'maxUnits': 50, 'modifier': 0},
    'longue': {'label': 'Longue (51 à 250 m)', 'maxUnits': 250, 'modifier': 0},
    'tres_longue': {'label': 'Très longue (251 à 500 m)', 'maxUnits': 500, 'modifier': 0},
    'lointaine': {'label': 'Lointaine (501 m à 5 km)', 'maxUnits': 5000, 'modifier': 0},
    'tres_lointaine': {'label': 'Très lointaine (plus de 5 km)', 'maxUnits': 50000, 'modifier': 0},
}

# ─── Bestiaire et catalogue ─────────────────────────────────────────────────
for colonne in (pilote.get('bestiaire') or {}).get('colonnes', []):
    if colonne.get('id') == 'pdv':
        colonne['champ'] = 'sante_physique'


def en_nombre(objet, cle, motif, garder_la_phrase=True):
    valeur = objet['valeurs'].get(cle)
    if not isinstance(valeur, str):
        return
    m = re.search(motif, valeur)
    if not m:
        return
    objet['valeurs'][cle] = int(m.group(1))
    if garder_la_phrase:
        objet['description'] = '; '.join(x for x in [objet.get('description'), f'Protection {valeur}'] if x)


for objet in (pilote.get('catalogue') or {}).get('objets', []):
    en_nombre(objet, 'protection', r'^\+?(\d+)\s*\(')
    en_nombre(objet, 'processeur-bande-passante', r'^Ordinateur/(\d+)$', False)

pilote['version'] = '2.2.0'

# ─── Ce que le pilote lit doit exister ───────────────────────────────────────
champs = {f['id'] for s in sections for f in s['fields']}
t = jet['traveller']
lus = (t['caracteristiques'] + list(t['md'].values()) + [c['niveau'] for c in t['competences']]
       + [c['specialite'] for c in t['competences'] if 'specialite' in c] + [t['polyvalent']]
       + [g['fieldId'] for g in pilote['ui_config']['gauges']] + [s['fieldId'] for s in combat['statsToTrack']]
       + [combat['physiqueTraveller'][c] for c in ('endurance', 'force', 'dexterite', 'excedent', 'incapacitants')]
       + list(combat['physiqueTraveller']['md'].values()) + list(combat['physiqueTraveller']['maximum'].values())
       + list(combat['physiqueTraveller']['psi'].values()) + list(combat['radiationsTraveller'].values()))
manquants = sorted({c for c in lus if c not in champs})
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')
ids = [f['id'] for s in sections for f in s['fields']]
doubles = sorted({i for i in ids if ids.count(i) > 1})
if doubles:
    sys.exit(f'Identifiants en double : {", ".join(doubles)}.')
cles_reprises = {c['fiche'] for c in correspondance}
oubliees = sorted(set(CLES) - cles_reprises - {'identity.portrait', 'summary.name', 'summary.species'})
if oubliees:
    sys.exit(f'Clés de la fiche HTML sans champ GM-OS : {", ".join(oubliees)}.')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

if sortie_correspondance:
    os.makedirs(os.path.dirname(sortie_correspondance) or '.', exist_ok=True)
    with open(sortie_correspondance, 'w', encoding='utf-8', newline='\n') as f:
        json.dump({
            'version': 1,
            'gabaritDeLaFiche': 'traveller-fr',
            'commentaire': ("Correspondance entre la fiche GM-OS de Traveller (pilote 2.2.0, outils/traveller/finir_traveller.py) "
                            "et le gabarit traveller-fr livré par GM-OS Studio le 2026-11-26. Les champs du pilote reprennent un à un "
                            "328 des 331 clés de la fiche : le portrait reste celui de GM-OS, et la page 2 recopie seule le nom et "
                            "l'espèce. Le total physique, les niveaux sans blessure, la PSI sans dépense, les dégâts incapacitants à guérir et le choix de l'excédent des dégâts n'ont pas "
                            "de case sur la fiche imprimée : ils restent dans GM-OS."),
            'champs': correspondance,
            'absents': [
                {'fiche': 'identity.portrait', 'pourquoi': "Le portrait de GM-OS est celui du personnage ; la fiche garde le sien."},
                {'fiche': 'summary.name', 'pourquoi': "Copie du nom de la page 1, que la fiche fait seule (lecture seule)."},
                {'fiche': 'summary.species', 'pourquoi': "Copie de l'espèce de la page 1, que la fiche fait seule (lecture seule)."},
            ],
        }, f, ensure_ascii=False, indent=2)
        f.write('\n')

print(f"Pilote {pilote['name']} 2.2.0 : {len(champs)} champs, {len(correspondance)} clés de la fiche, "
      f"{len(lignes)} lignes de compétence → {sortie}")
