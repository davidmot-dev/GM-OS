# Finit le pilote Barbarians of Lemuria (livre français Mythic) — 2026-10-27, Claude Code, à la
# demande de David (« tout, dans l'ordre » : corpus, jet, pilote, fiche). Pages imprimées.
#
# Part de l'export forgé du 27/10 (BOL_driver_gmos_1793097830049) et garde l'identifiant du pilote et
# de son modèle de fiche : la réimportation se fait avec « Remplacer ».
#
# - `jet` : 2d6 + attribut + carrière OU aptitude de combat, contre 9 (`jet.barbarians`, p. 10, 56, 62).
#   Le pilote forgé comparait chaque dé à « attribut + carrière + aptitude » et n'exigeait aucune
#   réussite : tout jet réussissait. Retirés : `difficulte`, `modificateurDuSeuil`, `critique`,
#   `complication` (aucun n'a de sens sur une somme) ;
# - la fiche GM-OS reprend une à une les 45 clés de la fiche HTML `barbarian-of-lemuria-fr`, sauf le
#   portrait : attributs et aptitudes de -1 à 5 (p. 12, 165), cinq carrières nommées (rang 0 à 5,
#   de nouvelles au rang 0 en cours de jeu, p. 24, 165), quatre armes, six lignes d'équipement, la
#   Vitalité courante et son maximum (elle descend sous zéro, p. 65), l'expérience, les notes ;
# - portées : les sept facteurs du livre (p. 62) ; réaction : Esprit + Initiative, du plus haut au plus
#   bas (p. 60) ; les Points de création ne sont plus une jauge de combat (p. 139) ;
# - version 2.0.0.
#
# Usage : python -I -X utf8 outils/barbarian/finir_barbarian.py <export forgé> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'barbarian':
    sys.exit(f"Ce n'est pas le pilote Barbarians of Lemuria : {pilote.get('name')!r}.")


def texte(id, label):
    return {'id': id, 'label': label, 'type': 'text', 'defaultValue': ''}


def long(id, label):
    return {'id': id, 'label': label, 'type': 'textarea', 'defaultValue': ''}


def nombre(id, label, defaut=0, **plus):
    return {'id': id, 'label': label, 'type': 'number', 'defaultValue': defaut, **plus}


carrieres = []
for i in range(1, 6):
    carrieres += [texte(f'carriere{i}_nom', f'Carrière {i}'),
                  nombre(f'carriere{i}', f'Rang de la carrière {i}', max=5, libelleSur=f'carriere{i}_nom')]
armes = []
for i in range(1, 5):
    armes += [texte(f'arme{i}', f'Arme {i}'), texte(f'arme{i}_degats', f'Dégâts de l’arme {i}')]

etat['sheetTemplate']['sections'] = [
    {'id': 'origine_concept', 'label': 'Origine et concept', 'fields': [
        texte('nom', 'Nom'), texte('terre_natale', 'Origine'), texte('identite', 'Concept'),
        texte('langues', 'Langues'), long('description', 'Description'),
    ]},
    {'id': 'attributs', 'label': 'Attributs', 'fields': [
        nombre('vigueur', 'Vigueur', max=5), nombre('agilite', 'Agilité', max=5),
        nombre('esprit', 'Esprit', max=5), nombre('aura', 'Aura', max=5),
    ]},
    {'id': 'aptitudes_combat', 'label': 'Aptitudes de combat', 'fields': [
        nombre('initiative', 'Initiative', max=5), nombre('melee', 'Mêlée', max=5),
        nombre('tir', 'Tir', max=5), nombre('defense', 'Défense', max=5),
    ]},
    {'id': 'carrieres', 'label': 'Carrières', 'fields': carrieres},
    {'id': 'traits', 'label': 'Avantages et désavantages', 'fields': [
        long('avantages', 'Avantages'), long('desavantages', 'Désavantages'),
    ]},
    {'id': 'jauges', 'label': 'Vitalité et réserves', 'fields': [
        nombre('vitalite', 'Vitalité', 10, maxSur='vitalite_max'), nombre('vitalite_max', 'Vitalité maximale', 10),
        nombre('points_heroisme', "Points d'héroïsme", 5), nombre('points_pouvoir', 'Points de pouvoir'),
        nombre('points_foi', 'Points de foi'), nombre('points_creation', 'Points de création'),
        nombre('experience', "Points d'expérience"),
    ]},
    {'id': 'equipement', 'label': "L'équipement des héros", 'fields': armes + [
        texte(f'equipement{i}', f'Armure et équipement {i}') for i in range(1, 7)
    ]},
    {'id': 'notes', 'label': "Notes d'aventures", 'fields': [long('notes', "Notes d'aventures")]},
]

jet = pilote['jet']
for retire in ('difficulte', 'modificateurDuSeuil', 'critique', 'complication'):
    jet.pop(retire, None)
jet['seuil'] = [
    {'id': 'attribut', 'label': 'Attribut', 'sectionId': 'attributs'},
    {'id': 'action', 'label': 'Carrière ou aptitude de combat', 'sectionId': 'carrieres',
     'sectionsSupplementaires': ['aptitudes_combat'], 'facultative': True},
]
jet['reserve'] = {'base': 2, 'max': 2, 'faces': 6}
jet['sens'] = 'superieur-ou-egal'
jet['barbarians'] = {'heroisme': 'points_heroisme', 'cible': 9}

pilote['tactical']['ranges'] = {
    'contact': {'label': 'Bout portant', 'maxUnits': 1, 'modifier': 1},
    'courte': {'label': 'Courte', 'maxUnits': 2, 'modifier': 0},
    'moyenne': {'label': 'Moyenne', 'maxUnits': 3, 'modifier': -1},
    'longue': {'label': 'Longue', 'maxUnits': 4, 'modifier': -2},
    'tres_longue': {'label': 'Très longue', 'maxUnits': 5, 'modifier': -4},
    'extreme': {'label': 'Extrême', 'maxUnits': 6, 'modifier': -6},
    'maximale': {'label': 'Maximale', 'maxUnits': 7, 'modifier': -8},
}

combat = pilote['combat']
combat['initiativeFormula'] = 'esprit + initiative'
combat['initiativeSort'] = 'desc'
combat['santeDeDepart'] = 'vitalite_max'
combat['statsToTrack'] = [
    {'fieldId': 'vitalite', 'label': 'Vitalité', 'isMainHP': True, 'isResource': True, 'max': 'vitalite_max'},
    {'fieldId': 'points_heroisme', 'label': "Points d'héroïsme", 'isMainHP': False, 'isResource': True},
    {'fieldId': 'points_pouvoir', 'label': 'Points de pouvoir', 'isMainHP': False, 'isResource': True},
    {'fieldId': 'points_foi', 'label': 'Points de foi', 'isMainHP': False, 'isResource': True},
]
pilote['ui_config']['gauges'] = [g for g in pilote['ui_config']['gauges'] if g['fieldId'] != 'points_creation']
pilote['version'] = '2.0.0'

champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
lus = ['points_heroisme', 'vitalite', 'vitalite_max'] + [g['fieldId'] for g in pilote['ui_config']['gauges']]
manquants = [c for c in lus if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} 2.0.0 : jet contre 9, {len(champs)} champs, sept portées → {sortie}")
