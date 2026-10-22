# Relie la fiche HTML Symbaroum (symbaroum-fr, livrée le 2026-10-20) à la fiche GM-OS du pilote
# « Symbaroum » créé par David dans la Forge — 2026-10-20, Claude Code.
#
# Même démarche que Crimes (outils/crime/relier_fiche_crimes.py) : aucun personnage n'existe encore,
# la fiche GM-OS est refaite sur la fiche HTML. Chaque clé de la fiche HTML est citée :
#   - reliée à un champ GM-OS qui existait déjà (il garde son identifiant : le jet, l'initiative,
#     les jauges et les ressources suivies les citent) ;
#   - ou reliée à un champ NOUVEAU, à l'identifiant français ;
#   - ou déclarée ABSENTE, avec sa raison.
# Les textes libres de la Forge que la fiche remplace par des cadres (talents, rituels, pouvoirs,
# traits, armes, armures, compagnons, bivouac) sont retirés ; l'archétype et le portrait, que la
# fiche n'imprime pas, sont gardés.
#
# Usage : python -I -X utf8 outils/symbaroum/relier_fiche_symbaroum.py <export du pilote> <sortie .gmos-driver>
# Écrit aussi docs/systems/symbaroum/fiche/correspondance.json.
import json, os, re, sys, zipfile

entree, sortie = sys.argv[1:3]
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.join(ICI, '..', '..')
FICHE = os.path.join(RACINE, 'docs', 'fiches', 'Symbaroum', 'symbaroum-fiche-personnage-interactive.html')
CORRESPONDANCE = os.path.join(RACINE, 'docs', 'systems', 'symbaroum', 'fiche', 'correspondance.json')

# — La fiche HTML : ses clés.
html = open(FICHE, encoding='utf-8').read()
bloc = re.search(r'<script\b[^>]*\bid=["\']character-sheet-template["\'][^>]*>(.*?)</script>', html, re.S)
gabarit = json.loads(bloc.group(1))['template']
cles = {}
for page in gabarit['pages']:
    for f in page['fields']:
        cles.setdefault(f['key'], {'type': f['type'], 'label': f.get('label') or f['key']})

# — Le pilote.
with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))
ancien = {f['id']: f for s in etat['sheetTemplate']['sections'] for f in s['fields']}

champs = []      # entrées de la table de correspondance
absents = {'portrait': 'Une image : elle reste sur la fiche, GM-OS a son propre portrait du personnage.'}

def garde(gid, cle=None, **retouche):
    """Un champ qui existait dans le pilote, éventuellement retouché."""
    if gid not in ancien:
        sys.exit(f'Champ GM-OS attendu absent du pilote : {gid} — l’export a changé.')
    champ = {**ancien[gid], **retouche}
    for k in [k for k, v in retouche.items() if v is None]:
        del champ[k]
    if cle:
        champs.append({'gmos': gid, 'fiche': cle})
    return champ

def nouveau(gid, cle, typ, label, valeurs=None, transforme=None, **extra):
    defaut = {'number': 0, 'gauge': 0, 'checkbox': False}.get(typ, '')
    champ = {'id': gid, 'label': label, 'type': typ, 'defaultValue': defaut, **extra}
    entree = {'gmos': gid, 'fiche': cle}
    if valeurs:
        champ['options'] = list(valeurs.values())
        entree['valeurs'] = valeurs
    if transforme:
        entree['transforme'] = transforme
    champs.append(entree)
    return champ

RANGS = {'novice': 'Novice', 'adept': 'Adepte', 'master': 'Maître'}

sections = [
    {'id': 'identite', 'label': 'Identité', 'fields': [
        nouveau('joueur', 'identity.player', 'text', 'Joueur'),
        garde('nom', 'identity.name'),
        # « select » sans options dans l'export ; la fiche imprime une ligne libre.
        garde('race', 'identity.race', type='text', max=None),
        # La fiche n'imprime pas l'archétype : il reste dans GM-OS, avec les trois du livre.
        garde('archetype', type='select', options=['Guerrier', 'Mystique', 'Roublard'], max=None),
        garde('carriere', 'identity.career'),
        garde('citation', 'identity.quote', label='Phrase type'),
        nouveau('age', 'profile.age', 'number', 'Âge'),
        nouveau('taille', 'profile.height', 'text', 'Taille'),
        nouveau('poids', 'profile.weight', 'text', 'Poids'),
        nouveau('historique', 'profile.history', 'textarea', 'Historique'),
        garde('objectif_personnel', 'profile.goals', label='Objectifs'),
        garde('portrait'),
    ]},
    {'id': 'attributs_primaires', 'label': 'Attributs primaires', 'fields': [
        garde('agilite', 'attributes.quick'),
        garde('astuce', 'attributes.cunning'),
        garde('discretion', 'attributes.discreet'),
        garde('force', 'attributes.strong'),
        garde('persuasion', 'attributes.persuasive'),
        garde('precision', 'attributes.accurate'),
        garde('vigilance', 'attributes.vigilant'),
        garde('volonte', 'attributes.resolute'),
    ]},
    {'id': 'attributs_secondaires', 'label': 'Attributs secondaires', 'fields': [
        garde('endurance', 'health.maximum', label='Endurance maximale'),
        nouveau('endurance_actuelle', 'health.current', 'number', 'Endurance'),
        garde('resistance_douleur', 'health.pain_threshold'),
        # La fiche imprime une Défense sous chacune des deux protections ; la première est celle
        # de l'armure portée.
        garde('defense', 'armors.0.defense'),
        nouveau('defense_2', 'armors.1.defense', 'number', 'Défense — protection 2'),
        garde('seuil_corruption', 'corruption.threshold'),
    ]},
    {'id': 'ombre', 'label': 'Ombre', 'fields': [
        garde('aura_spirituelle', 'identity.shadow', label='Ombre'),
        garde('corruption_temporaire', 'corruption.current'),
        garde('corruption_permanente', 'corruption.permanent'),
    ]},
    {'id': 'talents_pouvoirs', 'label': 'Talents et pouvoirs', 'fields': [
        champ for n in range(12) for champ in (
            nouveau(f'talent_{n + 1}', f'talents.{n}.name', 'text', f'Talent ou pouvoir {n + 1}'),
            nouveau(f'talent_{n + 1}_type', f'talents.{n}.type', 'text', f'Talent ou pouvoir {n + 1} — type'),
            nouveau(f'talent_{n + 1}_niveau', f'talents.{n}.rank', 'select', f'Talent ou pouvoir {n + 1} — niveau',
                    valeurs=RANGS, libelleSur=f'talent_{n + 1}'),
            nouveau(f'talent_{n + 1}_effet', f'talents.{n}.effect', 'textarea', f'Talent ou pouvoir {n + 1} — effet'),
        )
    ]},
    {'id': 'armes', 'label': 'Armes', 'fields': [
        champ for n in range(4) for champ in (
            nouveau(f'arme_{n + 1}', f'weapons.{n}.name', 'text', f'Arme {n + 1}'),
            nouveau(f'arme_{n + 1}_degats', f'weapons.{n}.damage', 'text', f'Arme {n + 1} — dégâts'),
            nouveau(f'arme_{n + 1}_qualites', f'weapons.{n}.qualities', 'text', f'Arme {n + 1} — qualités'),
            nouveau(f'arme_{n + 1}_attribut', f'weapons.{n}.attribute', 'text', f'Arme {n + 1} — attribut'),
        )
    ]},
    {'id': 'protections', 'label': 'Protections', 'fields': [
        champ for n in range(2) for champ in (
            nouveau(f'armure_{n + 1}', f'armors.{n}.name', 'text', f'Armure {n + 1}'),
            nouveau(f'armure_{n + 1}_protection', f'armors.{n}.protection', 'text', f'Armure {n + 1} — protection'),
            nouveau(f'armure_{n + 1}_qualites', f'armors.{n}.qualities', 'textarea', f'Armure {n + 1} — qualités'),
        )
    ]},
    {'id': 'equipement_ressources', 'label': 'Équipement et ressources', 'fields': [
        # Les vingt et une lignes imprimées, tenues en un seul texte : une ligne par objet.
        nouveau('equipement', [f'equipment.{n}.name' for n in range(21)], 'textarea', 'Équipement',
                transforme='lignes'),
        # La fiche écrit l'argent en clair (« 12 thalers, 3 shillings ») ; « argent » reste le nombre de
        # thalers que GM-OS suit comme ressource.
        nouveau('bourse', 'possessions.money', 'textarea', 'Argent — tel que noté sur la fiche'),
        garde('argent', label='Argent (thalers)'),
        nouveau('autres_biens', 'possessions.other', 'textarea', 'Autres biens'),
        garde('experience', 'experience.total'),
        nouveau('experience_non_depensee', 'experience.unspent', 'number', 'Expérience non dépensée'),
    ]},
    {'id': 'artefacts', 'label': 'Artéfacts et trésors mystiques', 'fields': [
        champ for n in range(4) for champ in (
            nouveau(f'artefact_{n + 1}', f'artifacts.{n}.name', 'text', f'Artéfact {n + 1}'),
            nouveau(f'artefact_{n + 1}_pouvoirs', f'artifacts.{n}.powers', 'textarea', f'Artéfact {n + 1} — pouvoirs'),
            nouveau(f'artefact_{n + 1}_corruption', f'artifacts.{n}.corruption', 'text', f'Artéfact {n + 1} — corruption'),
        )
    ]},
    {'id': 'personnalite_histoire', 'label': 'Compagnons et groupe', 'fields': [
        *[champ for n in range(5) for champ in (
            nouveau(f'compagnon_{n + 1}', f'companions.{n}.name', 'text', f'Compagnon {n + 1}'),
            nouveau(f'compagnon_{n + 1}_race', f'companions.{n}.race', 'text', f'Compagnon {n + 1} — race'),
            nouveau(f'compagnon_{n + 1}_carriere', f'companions.{n}.career', 'text', f'Compagnon {n + 1} — carrière'),
            nouveau(f'compagnon_{n + 1}_joueur', f'companions.{n}.player', 'text', f'Compagnon {n + 1} — joueur'),
        )],
        nouveau('nom_groupe', 'group.name', 'text', 'Nom du groupe'),
        garde('objectif_groupe', 'group.goals', label='Objectifs du groupe'),
    ]},
]
# L'apparence va à la Description du personnage, qui ne vit pas dans sheetData (comme Alien et Blade Runner).
champs.append({'gmos': 'description', 'fiche': 'profile.appearance', 'destination': 'personnage'})

# — Contrôles : chaque clé citée une fois, chaque identifiant unique, les retraits voulus seulement.
cites = [c for e in champs for c in (e['fiche'] if isinstance(e['fiche'], list) else [e['fiche']])] + list(absents)
doublons = {c for c in cites if cites.count(c) > 1}
oublies = [c for c in cles if c not in cites]
inconnues = [c for c in cites if c not in cles]
if doublons or oublies or inconnues:
    sys.exit(f'Correspondance incomplète — doublons {sorted(doublons)}, oubliées {oublies}, inconnues {inconnues}')
ids = [f['id'] for s in sections for f in s['fields']]
if len(ids) != len(set(ids)):
    sys.exit(f'Identifiants en double : {sorted({i for i in ids if ids.count(i) > 1})}')
RETIRES = {'traits_raciaux', 'talents', 'rituels', 'pouvoirs_mystiques', 'armes', 'armures', 'materiel_bivouac', 'compagnons'}
retires = set(ancien) - set(ids)
if retires != RETIRES:
    sys.exit(f'Retraits inattendus : {sorted(retires ^ RETIRES)}')
# Ce que le pilote cite ailleurs que dans la fiche doit toujours exister.
pilote = etat['gameDriver']
cites_par_le_pilote = {s['id'] for s in pilote['jet']['seuil']} \
    | {s['fieldId'] for s in pilote['combat']['statsToTrack']} \
    | {g['fieldId'] for g in pilote['ui_config']['gauges']}
manquants = cites_par_le_pilote - set(ids)
if manquants:
    sys.exit(f'Champs cités par le pilote et absents de la fiche : {sorted(manquants)}')

etat['sheetTemplate']['sections'] = sections
# La santé de départ lisait la Force ; le livre dit « Endurance = Force, minimum 10 », et la fiche
# porte l'Endurance maximale, que le joueur calcule.
pilote['combat']['santeDeDepart'] = 'endurance'
# Le jet citait les huit attributs en huit composantes, qui s'additionnent (avertissement du contrôle
# de la Forge). Le livre : 1d20 sous UN attribut. Une seule composante, la section offre le choix.
pilote['jet']['seuil'] = [{'id': 'attribut', 'label': 'Attribut', 'sectionId': 'attributs_primaires'}]
# La Forge avait mis le modificateur du livre (−5 à +5) dans `difficulte` — qui, dans GM-OS, est un
# NOMBRE DE RÉUSSITES à obtenir (Dune). À 0, chaque jet réussissait, un 20 compris (2026-10-21).
# Sans `difficulte`, il en faut une : 1d20 sous l'attribut.
pilote['jet'].pop('difficulte', None)
# Le modificateur va au seuil, et l'opposition se saisit (2026-10-22, ajouter_modificateur_du_seuil.py).
pilote['jet']['modificateurDuSeuil'] = {
    'min': -5, 'max': 5, 'defaut': 0,
    'opposition': {'reference': 10, 'label': 'Attribut adverse'},
}
# L'Endurance actuelle est la santé courante, et la fin de scène vide la Corruption temporaire
# (2026-10-22, raccorder_endurance_et_fin_de_scene.py).
pilote['combat']['statsToTrack'] = [
    {'fieldId': 'endurance_actuelle', 'label': 'Endurance', 'isMainHP': True, 'isResource': False, 'max': 'endurance'},
    *[s for s in pilote['combat']['statsToTrack'] if s['fieldId'] != 'endurance_actuelle'],
]
pilote.setdefault('gestesDesHeros', {})['finDeScene'] = [
    {'champ': 'corruption_temporaire', 'label': 'Corruption temporaire', 'delta': 'vide'},
]
# L'Avantage tactique et les seuils de la Corruption (S3, S4 ; 2026-10-22, ajouter_avantage_et_corruption.py).
pilote['jet']['modificateurDuSeuil']['avantage'] = {'label': 'Avantage tactique', 'seuil': 2, 'degats': '1d4'}
_corruption = {'champ': 'corruption_temporaire', 'ajouter': ['corruption_permanente'], 'label': 'Corruption totale'}
pilote['franchissements'] = [
    {'id': 'stigmate', **_corruption, 'aPartirDe': {'champ': 'volonte', 'fois': 0.5},
     'rappel': 'Seuil de Corruption : choisir un Stigmate ; la Corruption permanente gagne 1D4 (p. 179–180)',
     'mouvements': [], 'jet': {'faces': 4, 'champ': 'corruption_permanente', 'label': 'Corruption permanente'}},
    {'id': 'abomination', **_corruption, 'aPartirDe': {'champ': 'volonte'},
     'rappel': "Corruption totale à la Volonté : le personnage devient une Abomination (p. 180) — "
               "il passe au meneur, sauf accord du groupe pour la jouer (p. 184)",
     'mouvements': []},
]

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'symbaroum_state.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

# — La correspondance.
table = {
    'version': 1,
    'gabaritDeLaFiche': gabarit['id'],
    'commentaire': ('Correspondance entre la fiche GM-OS de Symbaroum et le gabarit symbaroum-fr (fiche de '
                    'personnage livrée le 2026-10-20). Écrite par outils/symbaroum/relier_fiche_symbaroum.py : les '
                    'champs du pilote gardent leur identifiant, les cadres de la fiche (talents, armes, protections, '
                    'artéfacts, compagnons) prennent un identifiant français.'),
    'champs': champs,
    'absents': [{'fiche': k, 'pourquoi': p} for k, p in absents.items()],
}
os.makedirs(os.path.dirname(CORRESPONDANCE), exist_ok=True)
open(CORRESPONDANCE, 'w', encoding='utf-8').write(json.dumps(table, ensure_ascii=False, indent=2) + '\n')

print(f"Fiche HTML : {len(cles)} clés — {len(cites) - len(absents)} reliées, {len(absents)} absente(s) motivée(s).")
print(f"Fiche GM-OS : {len(sections)} sections, {len(ids)} champs ; retirés : {', '.join(sorted(retires))}.")
