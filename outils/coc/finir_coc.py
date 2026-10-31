# Finit le pilote Chroniques Oubliées Contemporain (livre de règles de la 2e édition) — 2026-10-31,
# Claude Code, à la demande de David (« tout, dans l'ordre » ; une seule échelle d'évolution dont
# le modèle se choisit ; l'option du 3d6 réglable). Pages imprimées (PDF − 3).
#
# Part de l'export forgé du 31/10 (COC_driver_gmos_1793367242142) et garde l'identifiant du pilote
# et de son modèle de fiche : la réimportation se fait avec « Remplacer ».
#
# - `jet` : d20 + UNE caractéristique ou une attaque + modificateurs, contre la difficulté (5 à 25)
#   ou la DEF de la cible (p. 56-58, 87) — `jet.coc` (`src/modules/dice/systemes/coc.ts`) : 20
#   naturel réussite critique, 1 naturel échec critique, plages élargies, dé bonus et dé malus,
#   conditions, aides, états préjudiciables, prendre son temps (p. 58-65) ; le malus de l'état de
#   santé sur les actions physiques (p. 71) ; l'échelle du héros après le test, le blues avant
#   (p. 81-84) ; `des: '3d6'` pour l'option du 3d6 (p. 60). Le pilote forgé additionnait Agilité et
#   Intelligence pour le SEUIL de chaque dé, exigeait dix réussites d'un d20 (tout échouait),
#   comptait un 1 double et un 20 pour une complication. Retirés : `difficulte`, `critique`,
#   `complication` ;
# - la fiche GM-OS reprend une à une les 151 clés de la fiche HTML `coc2-fr` : identité, sept
#   caractéristiques et leurs notes, valeurs de combat, trois avantages ou désavantages, deux lignes
#   d'équipement, trois armes, la protection, les séquelles, l'échelle de santé, l'échelle
#   d'évolution, six voies de cinq rangs (p. 25-28). S'y ajoutent les rubriques de « Donner corps à
#   votre personnage » que la feuille n'imprime pas (genre, taille, poids, statut social,
#   personnalité, convictions, ambitions, entourage, histoire, p. 15-18 — celles du pilote forgé),
#   le modèle de l'échelle d'évolution et l'expérience (p. 28) ;
# - santé : vingt cases noircies par les DM, états à 5, 10, 15, 20 (`combat.casesDeSante`, p. 71-72) ;
#   RD de la protection, mort instantanée au-delà de 20 + CON, coup de grâce sur un mourant
#   (`combat.encaissement`, p. 73, 88) ; le malus de l'état aussi à l'initiative ;
# - une seule échelle d'évolution, Héros ou Blues au choix de la fiche (p. 80-84) : les jauges
#   « échelle du héros » et « échelle du blues » du pilote forgé disparaissent ;
# - initiative : 10 + INT + PER, sans dé (p. 85) ;
# - portées : les cinq du livre ; le bonus ou malus dépend de la portée de l'arme (p. 87, 96) ;
# - version 2.0.0.
#
# Usage : python -I -X utf8 outils/coc/finir_coc.py <export forgé> <sortie .gmos-driver> [--3d6]
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]
troisD6 = '--3d6' in sys.argv[3:]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'coc':
    sys.exit(f"Ce n'est pas le pilote COC : {pilote.get('name')!r}.")


def texte(id, label):
    return {'id': id, 'label': label, 'type': 'text', 'defaultValue': ''}


def long(id, label):
    return {'id': id, 'label': label, 'type': 'textarea', 'defaultValue': ''}


def nombre(id, label, defaut=0, **plus):
    return {'id': id, 'label': label, 'type': 'number', 'defaultValue': defaut, **plus}


def case(id, label):
    return {'id': id, 'label': label, 'type': 'checkbox', 'defaultValue': False}


# Les sept caractéristiques, dans l'ordre de la feuille (p. 25-26) ; l'identifiant est celui de la
# fiche forgée, pour garder les valeurs déjà saisies. De −2 à +5 à la création (p. 26).
CARACTERISTIQUES = [
    ('agilite', 'Agilité (AGI)'), ('constitution', 'Constitution (CON)'), ('force', 'Force (FOR)'),
    ('perception', 'Perception (PER)'), ('charisme', 'Charisme (CHA)'), ('intelligence', 'Intelligence (INT)'),
    ('volonte', 'Volonté (VOL)'),
]

armes = []
for i in range(1, 4):
    armes += [long(f'arme{i}', f'Arme {i}'), nombre(f'arme{i}_attaque', f'Arme {i} — bonus après 1d20', libelleSur=f'arme{i}'),
              texte(f'arme{i}_dm', f'Arme {i} — DM'),
              nombre(f'arme{i}_bc', f'Arme {i} — bonus critique'), texte(f'arme{i}_notes', f'Arme {i} — notes et portée')]
voies = []
for i in range(1, 7):
    voies.append({'id': f'voie_{i}', 'label': f'Voie {i}', 'fields': [texte(f'voie{i}', f'Voie {i} — nom')] + [
        champ for r in range(1, 6) for champ in (
            case(f'voie{i}_rang{r}', f'Voie {i}, rang {r} — acquis'),
            texte(f'voie{i}_rang{r}_nom', f'Voie {i}, rang {r} — capacité'),
            long(f'voie{i}_rang{r}_description', f'Voie {i}, rang {r} — description'),
        )]})

etat['sheetTemplate']['sections'] = [
    {'id': 'identite', 'label': 'Identité', 'fields': [
        texte('nom', 'Nom'), texte('joueur', 'Joueur'), nombre('age', 'Âge', 0), texte('origines', 'Origine'),
        texte('metier', 'Profil (métier ou occupation)'),
        long('description', 'Description'),
    ]},
    {'id': 'donner_corps', 'label': 'Donner corps au personnage', 'fields': [
        {'id': 'genre', 'label': 'Genre', 'type': 'text', 'defaultValue': ''},
        texte('taille', 'Taille'), texte('poids', 'Poids'), texte('statut_social', 'Statut social'),
        long('profil_psychologique', 'Personnalité'), long('convictions', 'Convictions et valeurs'),
        long('ambitions', 'Ambitions'), long('entourage', 'Entourage'), long('histoire', 'Histoire personnelle'),
    ]},
    {'id': 'caracteristiques', 'label': 'Caractéristiques', 'fields': [nombre(c, label, 0, max=5) for c, label in CARACTERISTIQUES]},
    {'id': 'notes_des_caracteristiques', 'label': 'Notes des caractéristiques',
     'fields': [long(f'note_{c}', f'{label} — notes') for c, label in CARACTERISTIQUES]},
    {'id': 'attaques', 'label': 'Attaques', 'fields': [
        nombre('attaque_au_contact', 'Attaque au contact (ATC = FOR)'), nombre('attaque_a_distance', 'Attaque à distance (ATD = AGI)'),
    ]},
    {'id': 'caracteristiques_secondaires', 'label': 'Combat', 'fields': [
        nombre('initiative', 'Initiative (10 + INT + PER)'), nombre('defense', 'Défense (10 + AGI + PER)'),
        nombre('bonus_dommages_au_contact', 'Bonus de dommages au contact (FOR)'),
        nombre('capacite_de_guerison', 'Capacité de guérison (CON + 3 DM par semaine)'),
    ]},
    {'id': 'traits_distinctifs', 'label': 'Avantages et désavantages', 'fields': [
        champ for i in range(1, 4) for champ in (long(f'trait{i}', f'Avantage ou désavantage {i}'), nombre(f'trait{i}_valeur', f'Avantage ou désavantage {i} — valeur'))
    ]},
    # L'arme et son bonus dans la même section : le menu du jet la propose sous son nom (« Couteau (2) »).
    {'id': 'armes', 'label': 'Armes', 'fields': armes},
    {'id': 'equipement_et_armes', 'label': 'Équipement et protection', 'fields': [
        texte('biens', 'Équipement — première ligne'), texte('equipement2', 'Équipement — seconde ligne'),
        long('protections', 'Protection'), nombre('protection_rd', 'Protection — RD'),
        nombre('protection_malus', 'Protection — malus en Init., AGI et ATC'),
    ]},
    {'id': 'echelles', 'label': 'Échelles', 'fields': [
        nombre('echelle_de_sante', 'Échelle de santé — échelons noircis', 0, max=20),
        {'id': 'modele_evolution', 'label': "Modèle de l'échelle d'évolution", 'type': 'select', 'defaultValue': 'Héros',
         'options': ['Héros', 'Blues', "Échelle de l'univers"]},
        nombre('echelle_evolution', "Échelle d'évolution — échelon", 0, max=20),
        long('sequelles', 'Séquelles'), nombre('experience', "Points d'expérience"),
    ]},
    *voies,
]

pilote['dice'] = {'defaultDice': '3d6' if troisD6 else '1d20', 'logic': 'sum', 'engine': 'standard'}

jet = pilote['jet']
for retire in ('difficulte', 'critique', 'complication', 'modificateurDuSeuil'):
    jet.pop(retire, None)
# Une caractéristique, l'ATC ou l'ATD, ou le bonus d'une arme nommée (« bonus après 1D20 + » de la feuille) ;
# le motif écarte les DM, le bonus critique et les notes des armes.
attaques = ['attaque_au_contact', 'attaque_a_distance'] + [f'arme{i}_attaque' for i in range(1, 4)]
jet['seuil'] = [{'id': 'caracteristique', 'label': 'Caractéristique ou attaque', 'sectionId': 'caracteristiques',
                 'sectionsSupplementaires': ['attaques', 'armes'],
                 'motif': '^(' + '|'.join([c for c, _ in CARACTERISTIQUES] + attaques) + ')$'}]
jet['reserve'] = {'base': 1, 'max': 1, 'faces': 6 if troisD6 else 20}
jet['sens'] = 'superieur-ou-egal'
jet['coc'] = {
    'des': '3d6' if troisD6 else 'd20',
    'sante': 'echelle_de_sante',
    'physiques': ['agilite', 'constitution', 'force'] + attaques,
    'attaques': attaques,
    'evolution': {'champ': 'echelle_evolution', 'modele': 'modele_evolution'},
    'volonte': 'volonte',
}

pilote['tactical']['uniteDeDistance'] = 'mètres'
# Les portées du livre (p. 96) ; une portée de moins que celle de l'arme vaut +2, deux +5, une de
# plus −2, deux −5 (p. 87-88) : le modificateur dépend de l'arme, il se règle au jet.
pilote['tactical']['ranges'] = {
    'contact': {'label': 'Au contact', 'maxUnits': 0, 'modifier': 0},
    'courte': {'label': 'Courte (1 à 50 m)', 'maxUnits': 50, 'modifier': 0},
    'moyenne': {'label': 'Moyenne (51 à 100 m)', 'maxUnits': 100, 'modifier': 0},
    'longue': {'label': 'Longue (101 à 200 m)', 'maxUnits': 200, 'modifier': 0},
    'extreme': {'label': 'Très longue (201 à 400 m)', 'maxUnits': 400, 'modifier': 0},
}

combat = pilote['combat']
combat['initiativeFormula'] = '10 + intelligence + perception'
combat['initiativeSort'] = 'desc'
combat['defaultHealthType'] = 'boxes'
combat['casesDeSante'] = {
    'libelle': 'Échelle de santé', 'nombre': 20, 'champ': 'echelle_de_sante',
    'seuils': [
        {'aPartirDe': 5, 'label': 'Contusionné', 'etat': 'scratched'},
        {'aPartirDe': 10, 'label': 'Affaibli', 'etat': 'wounded'},
        {'aPartirDe': 15, 'label': 'Blessé', 'etat': 'wounded'},
        {'aPartirDe': 20, 'label': 'Mourant', 'etat': 'critical'},
    ],
}
combat['encaissement'] = {'mecanique': 'coc', 'sante': 'echelle_de_sante', 'rd': 'protection_rd', 'constitution': 'constitution'}
combat['damageTypes'] = ['coup ou projectile', 'sans protection (chute, feu, poison)']
combat['statsToTrack'] = [
    {'fieldId': 'echelle_evolution', 'label': "Échelle d'évolution", 'isMainHP': False, 'isResource': True, 'max': '20'},
]
# L'échelle de santé se dessine en cases (`casesDeSante`) : une jauge de plus la redoublait, sans maximum (NOC fait de même).
pilote['ui_config']['gauges'] = [
    {'fieldId': 'echelle_evolution', 'label': "Échelle d'évolution", 'color': '#eab308', 'style': 'segmented'},
]
pilote['version'] = '2.0.0'

champs = [f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']]
assert len(champs) == len(set(champs)), 'identifiant de champ en double'
lus = ['echelle_de_sante', 'echelle_evolution', 'modele_evolution', 'volonte', 'constitution', 'protection_rd',
       'intelligence', 'perception'] + jet['coc']['physiques'] + [g['fieldId'] for g in pilote['ui_config']['gauges']]
manquants = [c for c in lus if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} 2.0.0 : {'3d6' if troisD6 else 'd20'} + caractéristique, {len(champs)} champs, échelle de santé en 20 cases → {sortie}")
