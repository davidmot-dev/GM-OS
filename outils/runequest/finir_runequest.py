# Finit le pilote RuneQuest (livre de base français Deadcrows, 7e éd., et son errata) — 2026-10-30,
# Claude Code, à la demande de David (« tout, dans l'ordre A-B-C-D », avec le test de caractéristique,
# la table de résistance, l'augmentation et la localisation des coups). Pages imprimées : PDF − 1.
#
# Part de l'export forgé du 30/10 (RQ_driver_gmos_1793346684184) et garde l'identifiant du pilote et
# de son modèle de fiche : la réimportation se fait avec « Remplacer ».
#
# - `jet` : un d100 sous UNE aptitude — compétence, Rune, Passion, Réputation ou caractéristique
#   (`jet.runequest`, p. 141-143). Le pilote forgé ne rendait que réussite ou échec ; le livre a cinq
#   niveaux lus sur les chances modifiées, 1-5 réussit et 96-00 échoue toujours. Une caractéristique
#   se teste ×5 (×5 à ×0,5, p. 141) ou sur la table de résistance (p. 145) ;
# - la fiche : les sept caractéristiques ; les attributs (p. 54-57) ; les sept modificateurs de
#   catégorie (p. 57-60) ; les six Runes élémentaires et les cinq paires de Pouvoir et de Forme
#   (p. 45-49) ; six Passions nommées et la Réputation ; les compétences du livre par catégorie, à
#   leur valeur de base (p. 61) ; quatre armes de mêlée, deux à distance, le bouclier et les armes
#   naturelles ; les sept localisations, points de vie et armure (p. 55, 146) ; la magie et
#   l'équipement. Le pilote forgé portait sept catégories à la place des compétences, trois « affinités »
#   à la place des Runes, une seule valeur de PV localisés, et deux identifiants en double ;
# - combat : rang d'action de DEX + rang d'action de TAI, du plus bas au plus haut (p. 57 ; le rang de
#   l'arme s'ajoute à table) ; santé en points de vie totaux, le maximum sur la fiche (p. 55) ; les
#   Passions, la Réputation, les « affinités » et l'encombrement ne sont plus des jauges de ressource ;
# - portées : les catégories de poursuite du livre, de Côte à côte à Hors de portée (p. 152-153), sans
#   modificateur : la portée d'une arme à distance dépend de l'arme (p. 211-213) ;
# - les coups localisés (2.1.0, demandés par David le même jour, « tu ne joues pas la localisation des
#   dégâts dans Combat-OS ? ») : chaque zone reçoit ses dégâts (`degats_<zone>`, propres à GM-OS, la
#   feuille n'a pas de case pour eux) ; `combat.coupsLocalises` déclare la zone, son armure et ses
#   points de vie pour Combat-OS (armure retirée, membre plafonné au double, effets p. 146-148) ;
# - version 2.1.0.
#
# Usage : python -I -X utf8 outils/runequest/finir_runequest.py <export forgé> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'runequest':
    sys.exit(f"Ce n'est pas le pilote RuneQuest : {pilote.get('name')!r}.")
if pilote.get('id') != 'custom-1793114851695' or etat['sheetTemplate'].get('id') != 'tpl-1793114851695':
    sys.exit("Identifiants inattendus : ce script finit l'export forgé du 30/10/2026.")


def texte(id, label):
    return {'id': id, 'label': label, 'type': 'text', 'defaultValue': ''}


def long(id, label):
    return {'id': id, 'label': label, 'type': 'textarea', 'defaultValue': ''}


def nombre(id, label, defaut=0, **plus):
    return {'id': id, 'label': label, 'type': 'number', 'defaultValue': defaut, **plus}


def nomme(id, label, defaut, combien=1):
    """Une compétence qui se précise — Monte (bison), Langue (tarshite) : le nom, puis le score."""
    champs = []
    for i in range(1, combien + 1):
        suffixe = f'_{i}' if combien > 1 else ''
        champs += [texte(f'{id}{suffixe}_nom', f'{label}{f" {i}" if combien > 1 else ""} — précision'),
                   nombre(f'{id}{suffixe}', label, defaut, libelleSur=f'{id}{suffixe}_nom')]
    return champs


def competences(*liste):
    return [nombre(id, label, defaut) for id, label, defaut in liste]


def precise(id, label, defaut):
    """Une compétence qu'on peut préciser sans qu'elle disparaisse du menu : Musique (flûte)."""
    return [texte(f'{id}_nom', f'{label} — précision'), nombre(id, label, defaut)]


# Les valeurs de base des compétences (p. 61). Esquive vaut DEX×2 et Saut DEX×3 : 20 et 30 à DEX 10.
agilite = competences(
    ('canotage', 'Canotage', 5), ('conduite_de_char', 'Conduite de char', 5), ('escalade', 'Escalade', 40),
    ('esquive', 'Esquive', 20), ('nage', 'Nage', 15), ('saut', 'Saut', 30),
) + nomme('monte', 'Monte', 5)
communication = competences(
    ('art', 'Art', 5), ('baratin', 'Baratin', 5), ('chant', 'Chant', 10), ('charme', 'Charme', 15),
    ('comedie', 'Comédie', 5), ('danse', 'Danse', 10), ('deguisement', 'Déguisement', 5),
    ('eloquence', 'Éloquence', 10), ('intimidation', 'Intimidation', 15), ('intrigue', 'Intrigue', 5),
    ('marchandage', 'Marchandage', 5), ('langue_natale', 'Langue natale', 50),
) + nomme('langue_etrangere', 'Langue étrangère', 0, 2)
connaissances = competences(
    ('agriculture', 'Agriculture', 10), ('alchimie', 'Alchimie', 0), ('bataille', 'Bataille', 10),
    ('bureaucratie', 'Bureaucratie', 0), ('connaissance_animaux', 'Connaissance des animaux', 5),
    ('connaissance_cieux', 'Connaissance des cieux', 5), ('connaissance_mineraux', 'Connaissance des minéraux', 5),
    ('connaissance_plantes', 'Connaissance des plantes', 5), ('connaissance_races_ainees', 'Connaissance des Races aînées', 5),
    ('connaissance_region', 'Connaissance de la région (locale)', 30), ('coutumes', 'Coutumes (locales)', 25),
    ('elevage', 'Élevage', 5), ('evaluation', 'Évaluation', 10), ('intendance', 'Intendance', 10), ('jeu', 'Jeu', 15),
    ('mort_paisible', 'Mort paisible', 10), ('navigation', 'Navigation', 0), ('premiers_soins', 'Premiers soins', 10),
    ('recherche_bibliotheque', 'Recherche en bibliothèque', 0), ('survie', 'Survie', 15),
    ('traitement_maladies', 'Traitement des maladies', 5), ('traitement_poison', 'Traitement du poison', 5),
) + nomme('connaissance_culte', 'Connaissance du culte', 5) + nomme('connaissance_culte_2', 'Connaissance du culte', 5) \
  + nomme('connaissance_region_autre', 'Connaissance de la région (autre)', 0) \
  + nomme('connaissance_region_autre_2', 'Connaissance de la région (autre)', 0) + nomme('coutumes_autres', 'Coutumes', 0) \
  + competences(('lecture_ecriture', 'Lecture/Écriture', 0)) + nomme('lecture_ecriture_2', 'Lecture/Écriture (autre)', 0)
magie = competences(
    ('appreter_le_corps', 'Apprêter le corps', 10), ('combat_spirituel', 'Combat spirituel', 20),
    ('comprehension_troupeaux', 'Compréhension des troupeaux', 0), ('connaissance_esprits', 'Connaissance des esprits', 0),
    ('danse_spirituelle', 'Danse spirituelle', 0), ('detection_assassin', "Détection d'assassin", 0),
    ('detection_chaos', 'Détection du Chaos', 0), ('meditation', 'Méditation', 0), ('voyage_spirituel', 'Voyage spirituel', 10),
) + nomme('veneration', 'Vénération', 5) + nomme('veneration_2', 'Vénération', 5)
manipulation = competences(
    ('dissimulation', 'Dissimulation', 5), ('escamotage', 'Escamotage', 5), ('invention', 'Invention', 5),
) + precise('musique', 'Musique', 5) + nomme('artisanat', 'Artisanat', 10, 2)
perception = competences(
    ('ecoute', 'Écoute', 25), ('empathie', 'Empathie (propre espèce)', 20), ('observation', 'Observation', 25),
    ('pistage', 'Pistage', 5), ('recherche', 'Recherche', 25),
) + nomme('empathie', 'Empathie (autre espèce)', 0, 2)
discretion = competences(('camouflage', 'Camouflage', 10), ('deplacement_silencieux', 'Déplacement silencieux', 10))

autres = []
for i in range(1, 4):
    autres += nomme(f'autre_competence_{i}', 'Autre compétence', 0)

# Les armes en main : le nom, le score (lancé), puis ce qui se lit à table sans se lancer — dégâts,
# rang d'action, ENC, durabilité, portée et cadence —, comme la feuille du livre les imprime.
armes = []
for prefixe, label, combien in (('arme', 'Arme de mêlée', 4), ('tir', 'Arme à distance', 3), ('bouclier', 'Bouclier', 1)):
    for i in range(1, combien + 1):
        id = f'{prefixe}{i}' if combien > 1 else prefixe
        nom = f'{label} {i}' if combien > 1 else label
        armes += [texte(f'{id}_nom', f'{nom} — nom'), nombre(id, nom, libelleSur=f'{id}_nom'),
                  texte(f'{id}_degats', f'{nom} — dégâts'), nombre(f'{id}_ra', f"{nom} — rang d'action")]
        if prefixe == 'bouclier':
            armes.append(nombre('bouclier_pv', 'Bouclier — points de vie'))
            continue
        armes += [nombre(f'{id}_enc', f'{nom} — ENC'), nombre(f'{id}_durabilite', f'{nom} — durabilité')]
        if prefixe == 'tir':
            armes += [texte(f'{id}_portee', f'{nom} — portée'), texte(f'{id}_cadence', f'{nom} — cadence')]

# Les compétences d'armes, à leur valeur de base (p. 61), comme la feuille du livre les liste.
competences_armes = competences(
    ('dague', 'Dague', 15), ('epee_courte', 'Épée courte', 10), ('epee_large', 'Épée large', 10),
    ('hache_1m', 'Hache à 1 main', 10), ('hache_2m', 'Hache à 2 mains', 5), ('kopis', 'Kopis', 10),
    ('lance_1m', 'Lance à 1 main', 5), ('lance_2m', 'Lance à 2 mains', 15), ('masse_1m', 'Masse à 1 main', 15),
    ('rapiere', 'Rapière', 5), ('sarisse', 'Sarisse', 15),
)
for i in range(1, 4):
    competences_armes += nomme(f'autre_melee_{i}', 'Autre arme de mêlée', 0)
competences_armes += competences(
    ('arc_composite', 'Arc composite', 5), ('arc_court', 'Arc court', 5), ('dague_lancer', 'Dague de lancer', 5),
    ('fronde', 'Fronde', 5), ('hache_lancer', 'Hache de lancer', 10), ('javelot', 'Javelot', 10), ('perche_lasso', 'Perche-lasso', 5),
)
for i in range(1, 3):
    competences_armes += nomme(f'autre_distance_{i}', 'Autre arme à distance', 0)
competences_armes += competences(('petit_bouclier', 'Petit bouclier', 15), ('bouclier_moyen', 'Bouclier moyen', 15),
                                 ('grand_bouclier', 'Grand bouclier', 15))
competences_armes += nomme('autre_bouclier', 'Autre bouclier', 0)
competences_armes += competences(('poing', 'Poing', 25), ('agripper', 'Agripper', 25), ('coup_de_pied', 'Coup de pied', 15))
for i in range(1, 3):
    competences_armes += nomme(f'arme_naturelle_{i}', 'Arme naturelle', 0)

LOCALISATIONS = [('jambe_droite', 'Jambe droite', 4), ('jambe_gauche', 'Jambe gauche', 4), ('abdomen', 'Abdomen', 4),
                 ('poitrine', 'Poitrine', 5), ('bras_droit', 'Bras droit', 3), ('bras_gauche', 'Bras gauche', 3), ('tete', 'Tête', 4)]
localisations = []
for cle, label, pv in LOCALISATIONS:  # Les PV d'un aventurier de 12 PV (p. 55).
    localisations += [nombre(f'pv_{cle}', f'{label} — points de vie', pv), nombre(f'pa_{cle}', f'{label} — armure'),
                      nombre(f'degats_{cle}', f'{label} — dégâts reçus', 0)]

CARACTERISTIQUES = [('for', 'Force (FOR)'), ('con', 'Constitution (CON)'), ('tai', 'Taille (TAI)'), ('dex', 'Dextérité (DEX)'),
                    ('int', 'Intelligence (INT)'), ('pou', 'Pouvoir (POU)'), ('cha', 'Charisme (CHA)')]

# L'Honneur a sa ligne sur la feuille ; les sept autres Passions ont leur nature et leur sujet.
passions = [nombre('passion_honneur', 'Honneur', 0)]
for i in range(1, 8):
    passions += [texte(f'passion{i}_nom', f'Passion {i} — nature'), texte(f'passion{i}_sujet', f'Passion {i} — sujet'),
                 nombre(f'passion{i}', f'Passion {i}', 60, libelleSur=f'passion{i}_nom')]
passions.append(nombre('reputation', 'Réputation', 0))

SECTIONS_DE_COMPETENCES = [
    ('competences_agilite', 'Compétences — Agilité', agilite),
    ('competences_communication', 'Compétences — Communication', communication),
    ('competences_connaissances', 'Compétences — Connaissances', connaissances),
    ('competences_magie', 'Compétences — Magie', magie),
    ('competences_manipulation', 'Compétences — Manipulation', manipulation),
    ('competences_perception', 'Compétences — Perception', perception),
    ('competences_discretion', 'Compétences — Discrétion', discretion),
    ('competences_autres', 'Autres compétences', autres),
    ('competences_armes', "Compétences d'armes", competences_armes),
    ('armes', 'Armes et boucliers', armes),
]

etat['sheetTemplate']['sections'] = [
    {'id': 'identite', 'label': 'Identité', 'fields': [
        texte('nom', 'Nom'), texte('joueur', 'Joueur'), texte('patrie', 'Patrie'), texte('tribu', 'Tribu'),
        texte('clan_tribu', 'Clan'), texte('occupation', 'Occupation'), texte('niveau_de_vie', 'Niveau de vie'),
        texte('genre', 'Genre'), texte('annee_naissance', 'Né·e en'), nombre('age', 'Âge', 21), texte('campagne', 'Campagne'),
        nombre('rancon', 'Rançon (lunars)'), nombre('revenu_de_base', 'Revenu de base (lunars)'),
        texte('langue_natale_nom', 'Langue natale — précision'),
    ]},
    {'id': 'cultes', 'label': 'Cultes', 'fields': [
        texte('culte', 'Culte'), texte('culte_rang', 'Culte — rang'), nombre('pr_max', 'Points de Rune maximum'),
        texte('culte_2', 'Culte 2'), texte('culte_2_rang', 'Culte 2 — rang'), nombre('pr_max_2', 'Culte 2 — points de Rune maximum'),
        texte('culte_associe', 'Sous-culte ou culte associé'),
    ]},
    {'id': 'caracteristiques', 'label': 'Caractéristiques', 'fields': [nombre(id, label, 10) for id, label in CARACTERISTIQUES]},
    {'id': 'attributs', 'label': 'Attributs', 'fields': [
        nombre('pv_max', 'Points de vie maximum', 12), nombre('pm_max', 'Points de magie maximum (POU)', 10),
        texte('bonus_degats', 'Bonus aux dégâts'),
        texte('degats_spirituels', 'Dégâts de combat spirituel'), nombre('vitesse_guerison', 'Vitesse de guérison', 2),
        nombre('enc_max', 'ENC maximum', 10), nombre('ra_dex', "Rang d'action de DEX", 3), nombre('ra_tai', "Rang d'action de TAI", 2),
        nombre('deplacement', 'Déplacement (DÉP de 3 m)', 8),
    ]},
    {'id': 'modificateurs', 'label': 'Modificateurs de catégorie', 'fields': [
        nombre(f'mod_{c}', label) for c, label in (
            ('agilite', 'Agilité'), ('communication', 'Communication'), ('connaissances', 'Connaissances'), ('magie', 'Magie'),
            ('manipulation', 'Manipulation'), ('perception', 'Perception'), ('discretion', 'Discrétion'),
            ('armes_melee', 'Armes de mêlée'), ('armes_distance', 'Armes à distance'), ('boucliers', 'Boucliers'),
            ('armes_naturelles', 'Armes naturelles'))
    ]},
    {'id': 'runes_elementaires', 'label': 'Runes élémentaires', 'fields': [
        nombre(f'rune_{c}', label, max=100) for c, label in (
            ('tenebres', 'Ténèbres'), ('eau', 'Eau'), ('terre', 'Terre'), ('feu_ciel', 'Feu/Ciel'), ('air', 'Air'), ('lune', 'Lune'))
    ]},
    # Chaque paire totalise 100 % ; 50/50 au départ, sauf les deux affinités choisies (75/25, p. 49).
    {'id': 'runes_pouvoir', 'label': 'Runes de Pouvoir et de Forme', 'fields': [
        nombre(f'rune_{c}', label, 50, max=100) for c, label in (
            ('fertilite', 'Fertilité'), ('mort', 'Mort'), ('harmonie', 'Harmonie'), ('desordre', 'Désordre'),
            ('stase', 'Stase'), ('mouvement', 'Mouvement'), ('verite', 'Vérité'), ('illusion', 'Illusion'),
            ('homme', 'Homme'), ('bete', 'Bête'))
    ]},
    {'id': 'passions_reputation', 'label': 'Passions et Réputation', 'fields': passions},
    *({'id': id, 'label': label, 'fields': champs} for id, label, champs in SECTIONS_DE_COMPETENCES),
    {'id': 'localisations', 'label': 'Localisations', 'fields': localisations},
    {'id': 'jauges', 'label': 'Points de vie, de magie et de Rune', 'fields': [
        nombre('points_de_vie', 'Points de vie', 12, maxSur='pv_max'), nombre('points_de_magie', 'Points de magie', 10, maxSur='pm_max'),
        nombre('points_de_rune', 'Points de Rune', 0, maxSur='pr_max'),
        nombre('points_de_rune_2', 'Points de Rune (culte 2)', 0, maxSur='pr_max_2'), nombre('enc_porte', 'ENC porté'),
    ]},
    {'id': 'magie_equipement', 'label': 'Magie et équipement', 'fields': [
        long('sorts_spirituels', 'Magie spirituelle'), long('sorts_runiques', 'Magie runique'), long('sorcellerie', 'Sorcellerie'),
        long('esprits_lies', 'Esprits liés et objets magiques'), nombre('limite_magie_spirituelle', 'Magie spirituelle — limite (CHA)'),
        nombre('int_libre', 'INT libre'), texte('notes_combat_spirituel', 'Notes de combat spirituel'), long('notes_magie', 'Notes de magie'),
        long('possessions', 'Possessions'), nombre('richesse_roues', 'Roues'), nombre('richesse_lunars', 'Lunars'),
        nombre('richesse_clacks', 'Clacks'), nombre('richesse_bolgs', 'Bolgs'), nombre('richesse_biens', 'Biens (lunars)'),
    ]},
    {'id': 'notes', 'label': 'Notes', 'fields': [long('notes', 'Notes'), long('notes_combat', 'Notes de combat')]},
]

caracteristiques = [id for id, _ in CARACTERISTIQUES]
jet = pilote['jet']
for retire in ('difficulte', 'modificateurDuSeuil', 'critique', 'complication', 'cible'):
    jet.pop(retire, None)
jet['seuil'] = [{
    'id': 'aptitude', 'label': 'Aptitude', 'sectionId': 'competences_agilite',
    'sectionsSupplementaires': [id for id, _, _ in SECTIONS_DE_COMPETENCES[1:]]
        + ['runes_elementaires', 'runes_pouvoir', 'passions_reputation', 'caracteristiques'],
    # Ce qui nomme ou décrit une arme ou une compétence se lit, ne se lance pas.
    'motif': '^(?!.*_(nom|sujet|degats|ra|enc|durabilite|portee|cadence|pv)$)',
}]
jet['reserve'] = {'base': 1, 'max': 1, 'faces': 100}
jet['sens'] = 'sous-ou-egal'
jet['runequest'] = {
    'caracteristiques': caracteristiques,
    'localisations': {cle.replace('_', '-'): f'pv_{cle}' for cle, _, _ in LOCALISATIONS},
}

pilote['tactical']['ranges'] = {
    'contact': {'label': 'Côte à côte', 'maxUnits': 2, 'modifier': 0},
    'courte': {'label': 'Deux longueurs', 'maxUnits': 50, 'modifier': 0},
    'moyenne': {'label': 'Proche (50 à 100 m)', 'maxUnits': 100, 'modifier': 0},
    'longue': {'label': 'En vue (100 à 500 m)', 'maxUnits': 500, 'modifier': 0},
    'extreme': {'label': 'Hors de portée (plus de 500 m)', 'maxUnits': 1000, 'modifier': 0},
}

combat = pilote['combat']
combat['initiativeFormula'] = 'ra_dex + ra_tai'
combat['initiativeSort'] = 'asc'
combat['defaultHealthType'] = 'hp'
combat['santeDeDepart'] = 'pv_max'
combat['damageTypes'] = ['empalement', 'lacération', 'écrasement']
# Les coups localisés de Combat-OS (p. 146-148) : la zone, son armure, ses dégâts reçus.
combat['coupsLocalises'] = {
    'mecanique': 'runequest',
    'zones': {cle.replace('_', '-'): {'pv': f'pv_{cle}', 'armure': f'pa_{cle}', 'degats': f'degats_{cle}'} for cle, _, _ in LOCALISATIONS},
}
combat['statsToTrack'] = [
    {'fieldId': 'points_de_vie', 'label': 'Points de vie', 'isMainHP': True, 'isResource': True, 'max': 'pv_max'},
    {'fieldId': 'points_de_magie', 'label': 'Points de magie (PM)', 'isMainHP': False, 'isResource': True, 'max': 'pm_max'},
    {'fieldId': 'points_de_rune', 'label': 'Points de Rune (PR)', 'isMainHP': False, 'isResource': True, 'max': 'pr_max'},
    {'fieldId': 'points_de_rune_2', 'label': 'Points de Rune (culte 2)', 'isMainHP': False, 'isResource': True, 'max': 'pr_max_2'},
]
pilote['ui_config']['gauges'] = [
    {'fieldId': 'points_de_vie', 'label': 'Points de vie', 'color': '#ef4444', 'style': 'bar'},
    {'fieldId': 'points_de_magie', 'label': 'Points de magie (PM)', 'color': '#3b82f6', 'style': 'bar'},
    {'fieldId': 'points_de_rune', 'label': 'Points de Rune (PR)', 'color': '#a855f7', 'style': 'bar'},
]
pilote['version'] = '2.1.0'

ids = [f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']]
doublons = sorted({i for i in ids if ids.count(i) > 1})
if doublons:
    sys.exit(f'Identifiants en double : {", ".join(doublons)}.')
champs = set(ids)
lus = caracteristiques + list(jet['runequest']['localisations'].values()) + ['pv_max', 'pm_max', 'pr_max', 'ra_dex', 'ra_tai']     + [c for z in combat['coupsLocalises']['zones'].values() for c in z.values()] \
    + [g['fieldId'] for g in pilote['ui_config']['gauges']]
manquants = [c for c in lus if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} {pilote['version']} : d100 sous l'aptitude, cinq niveaux, {len(champs)} champs → {sortie}")
