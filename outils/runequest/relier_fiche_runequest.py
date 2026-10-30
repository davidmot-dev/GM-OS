# Relie la fiche GM-OS de RuneQuest au gabarit HTML runequest-fr — 2026-10-30, Claude Code, à la
# demande de David (« la fiche et le thème ont été créé »), fiche livrée par l'atelier le même jour
# (documentation/Planning/2026-10-30-fiche-runequest-studio.md).
#
# Écrit docs/systems/runequest/fiche/correspondance.json. Chacune des 735 clés de la fiche est citée :
# en champ quand GM-OS la porte (identifiants du pilote 2.0.0, inchangés), en absent motivé sinon —
# famille, ascendance, compagnon, propriétés et récoltes restent sur la fiche, comme les coches
# d'expérience. Les lignes de magie, de matériel et de notes deviennent un texte (« lignes »).
#
# Usage : python -I -X utf8 outils/runequest/relier_fiche_runequest.py <pilote .gmos-driver>
import json, os, re, sys, zipfile

FICHE = 'docs/fiches/RuneQuest/runequest-fiche-personnage-interactive.html'
SORTIE = 'docs/systems/runequest/fiche/correspondance.json'

source = open(FICHE, encoding='utf-8').read()
gabarit = json.loads(re.search(r'<script\b[^>]*\bid=["\']character-sheet-template["\'][^>]*>([\s\S]*?)</script>', source).group(1))['template']
assert gabarit['id'] == 'runequest-fr'
cles = []
for page in gabarit['pages']:
    for zone in page['fields']:
        if zone.get('key') and zone['key'] not in cles:
            cles.append(zone['key'])

with zipfile.ZipFile(sys.argv[1]) as z:
    etat = json.loads(z.read('state.json'))
ids_gmos = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}

champs, absents, citees = [], [], set()


def champ(gmos, fiche, **plus):
    assert gmos in ids_gmos, f'champ GM-OS inconnu : {gmos}'
    for cle in fiche if isinstance(fiche, list) else [fiche]:
        assert cle in cles, f'clé de fiche inconnue : {cle}'
        assert cle not in citees, f'clé citée deux fois : {cle}'
        citees.add(cle)
    champs.append({'gmos': gmos, 'fiche': fiche, **plus})


def lignes(gmos, prefixe):
    champ(gmos, sorted([c for c in cles if re.fullmatch(re.escape(prefixe) + r'\.\d+', c)], key=lambda c: int(c.rsplit('.', 1)[1])),
          transforme='lignes')


IDENTITE = {'name': 'nom', 'player': 'joueur', 'origin': 'patrie', 'tribe': 'tribu', 'clan': 'clan_tribu',
            'occupation': 'occupation', 'living_standard': 'niveau_de_vie', 'gender': 'genre', 'birth_year': 'annee_naissance',
            'age': 'age', 'campaign': 'campagne', 'ransom': 'rancon', 'reputation': 'reputation', 'base_income': 'revenu_de_base'}
for cle, gmos in IDENTITE.items():
    champ(gmos, f'identity.{cle}')
for cle, gmos in {'strength': 'for', 'constitution': 'con', 'size': 'tai', 'dexterity': 'dex', 'intelligence': 'int',
                  'power': 'pou', 'charisma': 'cha'}.items():
    champ(gmos, f'attributes.{cle}')
for cle, gmos in {'combat.damage_bonus': 'bonus_degats', 'combat.size_rank': 'ra_tai', 'combat.dexterity_rank': 'ra_dex',
                  'health.healing': 'vitesse_guerison', 'combat.notes': 'notes_combat', 'health.current': 'points_de_vie',
                  'magic.current': 'points_de_magie', 'shield.parry': 'bouclier', 'shield.hp': 'bouclier_pv',
                  'shield.damage': 'bouclier_degats', 'combat.spirit.damage': 'degats_spirituels',
                  'combat.spirit.notes': 'notes_combat_spirituel', 'magic.spirit.charisma_limit': 'limite_magie_spirituelle',
                  'magic.sorcery.free_int': 'int_libre', 'magic.notes': 'notes_magie', 'cults.associated': 'culte_associe',
                  'equipment.encumbrance.maximum': 'enc_max', 'equipment.encumbrance.current': 'enc_porte'}.items():
    champ(gmos, cle)
for cle, zone in {'head': 'tete', 'right_arm': 'bras_droit', 'left_arm': 'bras_gauche', 'chest': 'poitrine',
                  'abdomen': 'abdomen', 'right_leg': 'jambe_droite', 'left_leg': 'jambe_gauche'}.items():
    champ(f'pv_{zone}', f'locations.{cle}.hp')
    champ(f'pa_{zone}', f'locations.{cle}.armor')
for cle, rune in {'fire': 'feu_ciel', 'darkness': 'tenebres', 'water': 'eau', 'earth': 'terre', 'air': 'air', 'moon': 'lune',
                  'man': 'homme', 'beast': 'bete', 'fertility': 'fertilite', 'harmony': 'harmonie', 'truth': 'verite',
                  'stasis': 'stase', 'death': 'mort', 'disorder': 'desordre', 'illusion': 'illusion', 'movement': 'mouvement'}.items():
    champ(f'rune_{rune}', f'runes.{cle}.level')
champ('passion_honneur', 'passions.honor.level')
for i in range(7):
    champ(f'passion{i + 1}_nom', f'passions.{i}.name')
    champ(f'passion{i + 1}_sujet', f'passions.{i}.subject')
    champ(f'passion{i + 1}', f'passions.{i}.level')
for i in range(4):
    for cle, suffixe in {'name': '_nom', 'chance': '', 'damage': '_degats', 'encumbrance': '_enc',
                         'durability': '_durabilite', 'strike_rank': '_ra'}.items():
        champ(f'arme{i + 1}{suffixe}', f'weapons.melee.{i}.{cle}')
for i in range(3):
    for cle, suffixe in {'name': '_nom', 'chance': '', 'damage': '_degats', 'encumbrance': '_enc',
                         'durability': '_durabilite', 'range': '_portee', 'rate': '_cadence'}.items():
        champ(f'tir{i + 1}{suffixe}', f'weapons.ranged.{i}.{cle}')
for i, suffixe in ((0, ''), (1, '_2')):
    champ(f'culte{suffixe}', f'cults.{i}.name')
    champ(f'culte{suffixe}_rang', f'cults.{i}.rank')
    champ(f'pr_max{suffixe}', f'cults.{i}.rune_points.maximum')
    champ(f'points_de_rune{suffixe}', f'cults.{i}.rune_points.current')
for cle, mod in {'agility': 'agilite', 'communication': 'communication', 'knowledge': 'connaissances', 'magic': 'magie',
                 'manipulation': 'manipulation', 'perception': 'perception', 'stealth': 'discretion', 'melee': 'armes_melee',
                 'ranged': 'armes_distance', 'shields': 'boucliers', 'natural': 'armes_naturelles'}.items():
    champ(f'mod_{mod}', f'modifiers.{cle}')
for cle, piece in {'wheels': 'roues', 'lunars': 'lunars', 'clacks': 'clacks', 'bolgs': 'bolgs', 'property': 'biens'}.items():
    champ(f'richesse_{piece}', f'wealth.{cle}')
lignes('sorts_spirituels', 'magic.spirit')
lignes('sorts_runiques', 'magic.rune')
lignes('sorcellerie', 'magic.sorcery')
lignes('esprits_lies', 'magic.extra')
lignes('notes', 'notes')
lignes('possessions', 'equipment')

# Les compétences : clé de la fiche → identifiant GM-OS. Une spécialité ou un nom va au champ « _nom ».
COMPETENCES = {
    'boating': 'canotage', 'drive': 'conduite_de_char', 'climb': 'escalade', 'dodge': 'esquive', 'ride': 'monte',
    'swim': 'nage', 'jump': 'saut', 'art': 'art', 'fast_talk': 'baratin', 'sing': 'chant', 'charm': 'charme',
    'act': 'comedie', 'dance': 'danse', 'disguise': 'deguisement', 'orate': 'eloquence', 'intimidate': 'intimidation',
    'intrigue': 'intrigue', 'bargain': 'marchandage', 'language.0': 'langue_etrangere_1', 'language.1': 'langue_etrangere_2',
    'native_language': 'langue_natale', 'farming': 'agriculture', 'alchemy': 'alchimie', 'battle': 'bataille',
    'bureaucracy': 'bureaucratie', 'animal_lore': 'connaissance_animaux', 'celestial_lore': 'connaissance_cieux',
    'cult_lore.0': 'connaissance_culte', 'cult_lore.1': 'connaissance_culte_2', 'mineral_lore': 'connaissance_mineraux',
    'plant_lore': 'connaissance_plantes', 'elder_race_lore': 'connaissance_races_ainees',
    'region_lore.0': 'connaissance_region_autre', 'region_lore.1': 'connaissance_region_autre_2',
    'homeland_lore': 'connaissance_region', 'customs': 'coutumes_autres', 'local_customs': 'coutumes', 'herding': 'elevage',
    'evaluate': 'evaluation', 'manage': 'intendance', 'game': 'jeu', 'read_write.0': 'lecture_ecriture',
    'read_write.1': 'lecture_ecriture_2', 'peaceful_cut': 'mort_paisible', 'navigation': 'navigation',
    'first_aid': 'premiers_soins', 'library_use': 'recherche_bibliotheque', 'treat_disease': 'traitement_maladies',
    'treat_poison': 'traitement_poison', 'survival': 'survie', 'prepare_body': 'appreter_le_corps',
    'herd_understanding': 'comprehension_troupeaux', 'spirit_combat': 'combat_spirituel', 'spirit_lore': 'connaissance_esprits',
    'spirit_dance': 'danse_spirituelle', 'sense_assassin': 'detection_assassin', 'sense_chaos': 'detection_chaos',
    'meditate': 'meditation', 'worship.0': 'veneration', 'worship.1': 'veneration_2', 'spirit_travel': 'voyage_spirituel',
    'craft.0': 'artisanat_1', 'craft.1': 'artisanat_2', 'conceal': 'dissimulation', 'sleight': 'escamotage',
    'devise': 'invention', 'instrument': 'musique', 'insight_species': 'empathie', 'insight.0': 'empathie_1',
    'insight.1': 'empathie_2', 'listen': 'ecoute', 'scan': 'observation', 'search': 'recherche', 'track': 'pistage',
    'hide': 'camouflage', 'move_quietly': 'deplacement_silencieux',
    'other.0': 'autre_competence_1', 'other.1': 'autre_competence_2', 'other.2': 'autre_competence_3',
    'melee.dagger': 'dague', 'melee.short_sword': 'epee_courte', 'melee.broadsword': 'epee_large',
    'melee.one_hand_axe': 'hache_1m', 'melee.two_hand_axe': 'hache_2m', 'melee.kopis': 'kopis',
    'melee.one_hand_spear': 'lance_1m', 'melee.two_hand_spear': 'lance_2m', 'melee.one_hand_mace': 'masse_1m',
    'melee.rapier': 'rapiere', 'melee.pike': 'sarisse', 'melee.other.0': 'autre_melee_1', 'melee.other.1': 'autre_melee_2',
    'melee.other.2': 'autre_melee_3', 'ranged.composite_bow': 'arc_composite', 'ranged.short_bow': 'arc_court',
    'ranged.throwing_dagger': 'dague_lancer', 'ranged.sling': 'fronde', 'ranged.throwing_axe': 'hache_lancer',
    'ranged.javelin': 'javelot', 'ranged.staff_lasso': 'perche_lasso', 'ranged.other.0': 'autre_distance_1',
    'ranged.other.1': 'autre_distance_2', 'shields.small': 'petit_bouclier', 'shields.medium': 'bouclier_moyen',
    'shields.large': 'grand_bouclier', 'shields.other': 'autre_bouclier', 'natural.kick': 'coup_de_pied',
    'natural.fist': 'poing', 'natural.grapple': 'agripper', 'natural.other.0': 'arme_naturelle_1',
    'natural.other.1': 'arme_naturelle_2',
}
for cle, gmos in COMPETENCES.items():
    champ(gmos, f'skills.{cle}.level')
    for nom in ('specialty', 'name'):
        if f'skills.{cle}.{nom}' in cles:
            champ(f'{gmos}_nom', f'skills.{cle}.{nom}')

# Ce qui reste sur la fiche, et pourquoi.
POURQUOI = [
    (r'.*\.experience$', "Une coche d'expérience : elle se coche et se lit sur la fiche ; GM-OS ne tient pas les tests d'expérience."),
    (r'^family\.', 'La famille : elle se tient sur la fiche ; aucune règle de GM-OS ne la lit.'),
    (r'^history\.', "L'ascendance et ses événements : le passé familial vit sur la fiche."),
    (r'^companion\.', "Le compagnon (monture, allié) : une seconde feuille sur la fiche ; GM-OS le suit comme un PNJ s'il combat."),
    (r'^property\.', 'Les propriétés : elles se décrivent sur la fiche, entre les aventures.'),
    (r'^(harvest|income)\.', 'Récoltes et revenus annuels : la vie entre les aventures, tenue sur la fiche.'),
    (r'^conditions\.', "Les états Mort et Inconscient : la fiche les coche ; GM-OS dit l'état d'après les points de vie."),
    (r'^combat\.spirit\.skill$', 'Répète la compétence Combat spirituel (skills.spirit_combat.level), que GM-OS lance.'),
]
for cle in cles:
    if cle in citees:
        continue
    raison = next((r for motif, r in POURQUOI if re.match(motif, cle)), None)
    if cle == 'income.base':
        raison = 'Répète le revenu de base de l\'identité (identity.base_income), que GM-OS garde.'
    assert raison, f'clé de la fiche sans décision : {cle}'
    absents.append({'fiche': cle, 'pourquoi': raison})
    citees.add(cle)

assert citees == set(cles)
os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
with open(SORTIE, 'w', encoding='utf-8', newline='\n') as f:
    json.dump({
        'version': 1,
        'gabaritDeLaFiche': 'runequest-fr',
        'commentaire': "Correspondance entre la fiche GM-OS de RuneQuest (pilote 2.0.0) et le gabarit runequest-fr "
                       "(fiche livrée le 2026-10-30). Écrite par outils/runequest/relier_fiche_runequest.py : les champs du "
                       "pilote gardent leur identifiant ; famille, ascendance, compagnon, propriétés, récoltes et coches "
                       "d'expérience restent sur la fiche.",
        'champs': champs,
        'absents': absents,
    }, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'{len(cles)} clés : {sum(len(c["fiche"]) if isinstance(c["fiche"], list) else 1 for c in champs)} reliées par '
      f'{len(champs)} champs, {len(absents)} absentes → {SORTIE}')
