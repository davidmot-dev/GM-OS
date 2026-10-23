# Finir Nephilim Légende (2026-10-23), à la demande de David : « je propose que l'on s'attaque à finir
# Nephilim Legend ». Périmètre complet N1 à N9 ; cases de santé nommées ; lieu et conjonction réglés par
# le MJ au bandeau ; à partir de l'export du 22/10. Livre 0 Quintessence et errata V1.3.
#
#   N1 Conséquences au jet · N2 encaisser sur des cases nommées · N3 Chutes (forme du Khaïba, mise en
#   jeu, PS de Chute) · N4 pacte de Kabbale · N5 stase · N6 Sapience (Mnémos en tant que Vécu,
#   Sacrifice, expérience) · N7 Œuvre au blanc (second élément) et assemblage des constructs · N8 lieu
#   magique et conjonction · N9 métamorphe et Seuil RK.
#
# Les champs nouveaux vivent sur la fiche GM-OS ; la fiche HTML les recevra par une consigne au Studio.
# Aucun champ n'entre dans une section que le jet propose au menu (le Pentacle, les Vécus, les
# constructs) : le menu d'une composante propose tous les champs de ses sections (piège du 18/10).
#
# Usage : python -I -X utf8 outils/nephilim-vecus/finir_nephilim.py <pilote> <sortie>
# Le repasser ne double rien : chaque ajout remplace le précédent.
import json, sys, os, re, zipfile

entree, sortie = sys.argv[1:3]
with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

fiche = etat['gameDriver'] and etat['sheetTemplate']
sections = {s['id']: s for s in fiche['sections']}
for requis in ('sante', 'les_chutes', 'stase_et_sapience', 'identite', 'alchimie_formules', 'alchimie_constructs',
               'magie_sorts', 'kabbale_invocations', 'kabbale_arbre', 'les_vecus', 'arts_magie', 'arts_kabbale', 'arts_alchimie'):
    if requis not in sections:
        sys.exit(f'Section absente : {requis} — ce pilote n’est pas celui du 22/10 ?')

def poser(section, champ, apres=None):
    """Ajoute ou remplace un champ ; `apres` le range derrière un champ existant."""
    champs = [f for f in section['fields'] if f['id'] != champ['id']]
    i = next((k + 1 for k, f in enumerate(champs) if f['id'] == apres), len(champs))
    champs.insert(i, champ)
    section['fields'] = champs

def case(id, label):
    return {'id': id, 'label': label, 'type': 'checkbox', 'defaultValue': False}

ELEMENTS = ['Feu', 'Air', 'Eau', 'Terre', 'Lune']

# — N2 · Les cases de dommages nommées (p. 136) : 1, 2, 3, et les cases de 1 du Ka-Terre (5 et 10).
sante = sections['sante']
for piste, nom, bonus in (('physical', 'physique', True), ('magical', 'magique', False)):
    precedent = f'health_{piste}'
    for v in (1, 2, 3):
        poser(sante, case(f'health_{piste}_case_{v}', f'Santé {nom} — case de {v}'), precedent)
        precedent = f'health_{piste}_case_{v}'
    if bonus:
        for k, seuil in ((1, 5), (2, 10)):
            poser(sante, case(f'health_{piste}_case_bonus_{k}', f'Santé {nom} — case de 1 (Ka-Terre {seuil}+)'), precedent)
            precedent = f'health_{piste}_case_bonus_{k}'

# — N3 · Les Chutes : la forme du Khaïba, la mise en jeu de la séance, les PS de Chute (p. 150-152).
chutes = sections['les_chutes']
poser(chutes, {'id': 'falls_khaiba_form', 'label': 'Khaïba — forme', 'type': 'select', 'defaultValue': '',
               'options': ['Nanisme', 'Gigantisme', 'Forme éthérale', 'Forme élémentaire']}, 'falls_khaiba')
for cle, nom in (('khaiba', 'Khaïba'), ('shadow', 'Ombre'), ('narcosis', 'Narcose')):
    poser(chutes, {'id': f'falls_{cle}_misenjeu', 'label': f'{nom} — mise en jeu cette séance', 'type': 'number', 'defaultValue': 0, 'max': 1},
          f'falls_{cle}_notes')
poser(sections['stase_et_sapience'], {'id': 'resources_sapience_chute', 'label': 'PS de Chute (Effet Mnémos seulement)',
                                      'type': 'number', 'defaultValue': 0}, 'resources_sapience')

# — N9 · Les degrés de métamorphe visibles en permanence (p. 112) : les cases « permanente » des
#   métamorphoses, déjà sur les deux fiches (section Incarnations) — aucun champ nouveau.
sections['identite']['fields'] = [f for f in sections['identite']['fields'] if f['id'] != 'identity_metamorph_visible']
permanentes = [f['id'] for s in fiche['sections'] for f in s['fields'] if re.fullmatch(r'metamorphoses_\d+_permanent', f['id'])]
if not permanentes: sys.exit('Aucune case « Métamorphose permanente » sur la fiche.')

# — N7 · Le second élément des formules (Œuvre au blanc, p. 220) ; l'assemblage des constructs (errata p. 217).
formules = sections['alchimie_formules']
for f in list(formules['fields']):
    m = re.fullmatch(r'alchemy_formulas_(\d+)_element', f['id'])
    if m:
        poser(formules, {'id': f'alchemy_formulas_{m.group(1)}_element2', 'label': f'Formule {int(m.group(1)) + 1} — second Ka-élément (Œuvre au blanc)',
                         'type': 'select', 'defaultValue': '', 'options': ELEMENTS}, f['id'])
CONSTRUCTS = {'retort': 'Cornue', 'aludel': 'Aludel', 'athanor': 'Athanor', 'crucible': 'Forge ou Creuset', 'alembic': 'Alambic'}
assemblage = {'id': 'alchimie_assemblage', 'label': 'Alchimie — assemblage des constructs', 'fields': [
    {'id': f'alchemy_constructs_{c}_assembly', 'label': f'{nom} — assemblé avec', 'type': 'select', 'defaultValue': '',
     'options': ['Œuvre au noir', 'Œuvre au blanc', 'Œuvre au rouge']} for c, nom in CONSTRUCTS.items()]}
ordre = [s for s in fiche['sections'] if s['id'] != 'alchimie_assemblage']
i = next(k + 1 for k, s in enumerate(ordre) if s['id'] == 'alchimie_constructs')
ordre.insert(i, assemblage)
fiche['sections'] = ordre
sections = {s['id']: s for s in fiche['sections']}

# — Le degré de chaque sort porte son nom, comme celui des formules.
noms = {f['id'] for f in sections['magie_sorts']['fields']}
for f in sections['magie_sorts']['fields']:
    m = re.fullmatch(r'magic_spells_(\d+)_degree', f['id'])
    if m and f'magic_spells_{m.group(1)}_name' in noms:
        f['libelleSur'] = f'magic_spells_{m.group(1)}_name'

driver = etat['gameDriver']
jet = driver['jet']

# — Le sort de Magie au jet (p. 183) : son degré se retire, comme celui d'une formule.
ajustement = [c for c in jet['cible']['ajustement'] if c['id'] != 'sort']
ajustement.append({'id': 'sort', 'label': 'Sort (Magie)', 'sectionId': 'magie_sorts', 'facultative': True,
                   'soustraire': True, 'motif': '^magic_spells_[0-9]+_degree$'})
jet['cible']['ajustement'] = ajustement

# — La consommation de l'Œuvre au blanc : le second élément aussi (p. 220).
jet['consommation']['elementSecondSur'] = {'remplacer': '_degree$', 'par': '_element2'}

# — L'Effet Mnémos de bonus payé par les PS d'une Chute mise en jeu (p. 152).
reserves = [r for r in jet.get('reservesDuPersonnage', []) if r.get('id') != 'mnemos-chute']
reserves.append({'id': 'mnemos-chute', 'label': 'Effet Mnémos, PS de Chute (1 : +2 degrés)', 'effet': 'degres', 'parPoint': 2,
                 'maxParJet': 1, 'epuisement': 'piste', 'stocks': [{'champ': 'resources_sapience_chute', 'label': 'PS de Chute'}],
                 'si': {'sections': ['les_vecus']}})
jet['reservesDuPersonnage'] = reserves

def piste(prefixe, bonus):
    cases = [{'champ': f'health_{prefixe}_case_{v}', 'valeur': v} for v in (1, 2, 3)]
    if bonus:
        cases += [{'champ': f'health_{prefixe}_case_bonus_1', 'valeur': 1, 'kaTerre': 5},
                  {'champ': f'health_{prefixe}_case_bonus_2', 'valeur': 1, 'kaTerre': 10}]
    return {'cases': cases, 'compte': f'health_{prefixe}', 'consequences': [
        {'champ': f'consequences_{prefixe}_minor_active', 'label': 'Mineure', 'absorbe': 2},
        {'champ': f'consequences_{prefixe}_serious_active', 'label': 'Sérieuse', 'absorbe': 4},
        {'champ': f'consequences_{prefixe}_severe_active', 'label': 'Grave', 'absorbe': 6}]}

jet['nephilim'] = {
    'composantes': {'vecu': 'vecu', 'approche': 'approche', 'formule': 'formule', 'sort': 'sort'},
    'arts': {'magie': ['arts_magie'], 'kabbale': ['arts_kabbale'], 'alchimie': ['arts_alchimie']},
    'vecusPasses': ['les_vecus'], 'vecuContemporain': 'simulacrum_experience_degree',
    'kaDominant': {'choix': 'ka_dominant', 'degre': 'ka_dominant_degre'}, 'kaTerre': 'ka_earth',
    'pentacle': {'Feu': 'ka_fire', 'Air': 'ka_air', 'Eau': 'ka_water', 'Terre': 'ka_earth', 'Lune': 'ka_moon'},
    'sapience': 'resources_sapience', 'stase': 'stasis_degree',
    'chutes': {'khaiba': 'falls_khaiba', 'ombre': 'falls_shadow', 'narcose': 'falls_narcosis', 'forme': 'falls_khaiba_form',
               'misesEnJeu': {'khaiba': 'falls_khaiba_misenjeu', 'ombre': 'falls_shadow_misenjeu', 'narcose': 'falls_narcosis_misenjeu'},
               'sapienceDeChute': 'resources_sapience_chute'},
    'metamorphe': {'degre': 'identity_metamorph_degree', 'permanentes': permanentes},
    'table': {'lieu': 'lieuMagique', 'conjonction': 'conjonction', 'intensite': 'intensiteDeLaConjonction',
              'seuilRK': 'seuilRK', 'traque': 'jaugeDeTraque'},
    # Les cases de bonus du Ka-Terre sur la piste physique seulement : la fiche n'en prévoit que là (3 cases magiques).
    'sante': {'physique': piste('physical', True), 'magique': piste('magical', False)},
    'pacte': {'motif': '^kabbalah_invocations_[0-9]+_degree$', 'ordonnances': 'kabbalah_ordinances_degree'},
    'alchimie': {'oeuvres': {'occult_alchemy_black': 1, 'occult_alchemy_white': 2, 'occult_alchemy_red': 3},
                 'assemblage': {f'alchemy_constructs_{c}': f'alchemy_constructs_{c}_assembly' for c in CONSTRUCTS},
                 'secondElement': {'remplacer': '_degree$', 'par': '_element2'}},
    'experience': {'sections': ['les_vecus', 'arts_magie', 'arts_kabbale', 'arts_alchimie'],
                   'champs': ['identity_metamorph_degree', 'quest_arcana_degree', 'quest_fraternity_degree'],
                   'ka': ['ka_fire', 'ka_air', 'ka_water', 'ka_earth', 'ka_moon'],
                   'unPoint': [f'alchemy_materia_{e}_max' for e in ('fire', 'air', 'water', 'earth', 'moon')]},
}

# — N8 · Le lieu magique et la conjonction, réglés par le MJ au bandeau (p. 160 ; errata p. 160).
table = [r for r in driver.get('ressourcesDeTable', []) if r['id'] not in ('lieuMagique', 'conjonction', 'intensiteDeLaConjonction')]
table += [
    {'id': 'lieuMagique', 'label': 'Lieu magique', 'proprietaire': 'meneur', 'depart': 0, 'min': 0, 'max': 6,
     'libelles': ['Aucun lieu magique', 'Plexus de Feu', 'Plexus d’Air', 'Plexus d’Eau', 'Plexus de Terre', 'Plexus de Lune', 'Nexus'],
     'visibleAuxJoueurs': True, 'manipulableParLesJoueurs': False,
     'description': 'Plexus : +1 au Ka du Plexus, −1 aux Ka opposés (Sciences occultes et approches), un degré de stase par jour. Nexus : +3 aux Ka-éléments, un degré de stase par jour (p. 160 ; errata).'},
    {'id': 'conjonction', 'label': 'Conjonction', 'proprietaire': 'meneur', 'depart': 0, 'min': 0, 'max': 5,
     'libelles': ['Aucune conjonction', 'Conjonction de Feu', 'Conjonction d’Air', 'Conjonction d’Eau', 'Conjonction de Terre', 'Conjonction de Lune'],
     'visibleAuxJoueurs': True, 'manipulableParLesJoueurs': False,
     'description': 'Le MJ décide des conjonctions (p. 159) : une conjonction donne +1 aux tests de son Ka ; une Grande conjonction +2 à +5, et autant de malus aux Ka opposés (p. 160).'},
    {'id': 'intensiteDeLaConjonction', 'label': 'Intensité', 'proprietaire': 'meneur', 'depart': 1, 'min': 1, 'max': 5,
     'libelles': ['Conjonction (+1)', 'Grande conjonction (±2)', 'Grande conjonction (±3)', 'Grande conjonction (±4)', 'Grande conjonction (±5)'],
     'visibleAuxJoueurs': True, 'manipulableParLesJoueurs': False,
     'description': 'Attendre une conjonction d’Air de +5 devrait être une quête millénaire (p. 160).'},
]
driver['ressourcesDeTable'] = table

# — Début de séance : les mises en jeu et les PS de Chute s'effacent (p. 152).
gestes = driver.setdefault('gestesDesHeros', {})
debut = [m for m in gestes.get('debutDeSeance', []) if not m['champ'].endswith('_misenjeu') and m['champ'] != 'resources_sapience_chute']
debut += [{'champ': f'falls_{c}_misenjeu', 'label': f'{n} — mise en jeu', 'delta': 'vide'} for c, n in (('khaiba', 'Khaïba'), ('shadow', 'Ombre'), ('narcosis', 'Narcose'))]
debut.append({'champ': 'resources_sapience_chute', 'label': 'PS de Chute', 'delta': 'vide'})
gestes['debutDeSeance'] = debut

# — Le rappel de la Kabbale renvoie désormais à la carte du pacte.
for s in jet.get('suitesDesCritiques', []):
    if s.get('label') == 'Maladresse de Kabbale':
        s['rappel'] = '+1 degré de Khaïba ; le premier est de forme élémentaire (errata V1.3, p. 198). Une invocation réussie propose ensuite de nouer le pacte.'

driver['version'] = '2.0.0'
os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('Sections :', len(fiche['sections']), '; champs :', sum(len(s['fields']) for s in fiche['sections']))
print('Composantes :', ', '.join(c['id'] for c in jet['cible']['ajustement']), '; réserves :', ', '.join(r['id'] for r in driver['ressourcesDeTable']))
