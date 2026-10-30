# Finit le pilote Degenesis (livre de base français Katharsys) — 2026-10-30, Claude Code, à la
# demande de David (« tout, dans l'ordre » : jet, pilote, fiche, corpus). Pages imprimées (PDF − 1).
#
# Part de l'export forgé du 30/10 (Degenesis_driver_gmos_1793367219023) et garde l'identifiant du pilote
# et de son modèle de fiche : la réimportation se fait avec « Remplacer ».
#
# - `jet` : une réserve de d6 = attribut + compétence (p. 18), réussis sur 4+ (`dice.successThreshold`),
#   difficulté en succès requis, « délicate » (2) par défaut (p. 18) ; `jet.degenesis` : déclencheurs,
#   échec critique, surplus au-delà de 12 dés en succès d'office, −1D par Traumatisme, Égo dépensé
#   (p. 18-19, 100, 105). Le pilote forgé prenait attribut + compétence pour le SEUIL de chaque dé, ne
#   lançait aucun dé et exigeait quatre réussites. Retirés : `seuil`, `critique` ;
# - la fiche GM-OS reprend une à une les 129 clés de la fiche HTML `degenesis-fr` : l'humain et son
#   origine, six attributs et leurs 36 compétences (p. 10-17), six historiques, six Potentiels et leur
#   niveau, trois armes, deux armures, six lignes d'équipement et trois totaux, Dinars / LC, expérience,
#   les quatre pistes. S'y ajoutent le maximum d'Égo — (INT+Concentration)×2 ou (INS+Pulsions)×2 selon
#   la compétence choisie (p. 94), qu'aucune formule ne sait choisir — et la santé restante ;
# - santé : Blessures superficielles jusqu'à (PHY+Résistance)×2, puis Traumatismes jusqu'à PHY+PSY ; la
#   santé principale est ce qui reste sur les deux pistes (`combat.pistesDeSante`, p. 94, 107) ; une
#   attaque mentale va à l'Égo (p. 107) ; Sporulations jusqu'à (PSY+Foi/Volonté)×2 (p. 94) — Foi et
#   Volonté s'excluent, la somme des deux est donc celle que le personnage a choisie (p. 16) ;
# - initiative : un jet de PSY+Réactivité dont le score est le nombre de succès, une action de plus par
#   paire de déclencheurs (`combat.initiativeEnReserve`, p. 100-101) — le champ « reactivite » manquait ;
# - portées : quatre bandes du livre, relatives à l'arme (normale, longue −4D, extrême −8D, p. 103) ;
# - version 2.0.0.
#
# Usage : python -I -X utf8 outils/degenesis/finir_degenesis.py <export forgé> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'degenesis':
    sys.exit(f"Ce n'est pas le pilote Degenesis : {pilote.get('name')!r}.")


def texte(id, label):
    return {'id': id, 'label': label, 'type': 'text', 'defaultValue': ''}


def long(id, label):
    return {'id': id, 'label': label, 'type': 'textarea', 'defaultValue': ''}


def nombre(id, label, defaut=0, **plus):
    return {'id': id, 'label': label, 'type': 'number', 'defaultValue': defaut, **plus}


# Les attributs et leurs six compétences, dans l'ordre du livre (p. 11-17) ; l'identifiant de
# l'attribut est celui de la fiche forgée, pour garder les valeurs déjà saisies.
ATTRIBUTS = [
    ('physique', 'Physique', 'phy', [('athletisme', 'Athlétisme'), ('corps_a_corps', 'Corps à corps'), ('force', 'Force'),
                                     ('lutte', 'Lutte'), ('resistance', 'Résistance'), ('vigueur', 'Vigueur')]),
    ('agilite', 'Agilité', 'agi', [('armes_a_projectiles', 'Armes à projectiles'), ('artisanat', 'Artisanat'),
                                   ('dexterite', 'Dextérité'), ('furtivite', 'Furtivité'), ('mobilite', 'Mobilité'),
                                   ('navigation', 'Navigation')]),
    ('charisme', 'Charisme', 'cha', [('art', 'Art'), ('commandement', 'Commandement'), ('consideration', 'Considération'),
                                     ('expression', 'Expression'), ('negociation', 'Négociation'), ('seduction', 'Séduction')]),
    ('intellect', 'Intellect', 'int', [('concentration', 'Concentration'), ('connaissance_des_artefacts', 'Connaissance des artefacts'),
                                       ('legendes', 'Légendes'), ('medecine', 'Médecine'), ('science', 'Science'),
                                       ('technologie', 'Technologie')]),
    ('psyche', 'Psyché', 'psy', [('domination', 'Domination'), ('foi', 'Foi'), ('reactivite', 'Réactivité'),
                                 ('ruse', 'Ruse'), ('tromperie', 'Tromperie'), ('volonte', 'Volonté')]),
    ('instinct', 'Instinct', 'ins', [('dressage', 'Dressage'), ('empathie', 'Empathie'), ('orientation', 'Orientation'),
                                     ('perception', 'Perception'), ('pulsions', 'Pulsions'), ('survie', 'Survie')]),
]

armes = []
for i in range(1, 4):
    armes += [
        long(f'arme{i}', f'Arme {i}'), long(f'arme{i}_maniabilite', f'Arme {i} — maniabilité (±D)'),
        texte(f'arme{i}_portee', f'Arme {i} — portée (normale / longue)'), texte(f'arme{i}_degats', f'Arme {i} — dégâts'),
        texte(f'arme{i}_chargeur', f'Arme {i} — chargeur'), nombre(f'arme{i}_encombrement', f'Arme {i} — encombrement'),
        texte(f'arme{i}_tech', f'Arme {i} — niveau Tech'), nombre(f'arme{i}_emplacements', f'Arme {i} — emplacements'),
        long(f'arme{i}_proprietes', f'Arme {i} — propriétés'),
    ]
armures = []
for i in range(1, 3):
    armures += [
        long(f'armure{i}', f'Armure {i}'), nombre(f'armure{i}_valeur', f'Armure {i} — valeur d’armure'),
        nombre(f'armure{i}_encombrement', f'Armure {i} — encombrement'), texte(f'armure{i}_tech', f'Armure {i} — niveau Tech'),
        nombre(f'armure{i}_emplacements', f'Armure {i} — emplacements'), long(f'armure{i}_proprietes', f'Armure {i} — propriétés'),
    ]
equipement = []
for i in range(1, 7):
    equipement += [long(f'equipement{i}', f'Équipement {i}'), nombre(f'equipement{i}_encombrement', f'Équipement {i} — encombrement')]
equipement += [nombre(f'encombrement_total{i}', f'Encombrement total — ligne {i}') for i in range(1, 4)]
potentiels = []
for i in range(1, 7):
    potentiels += [texte(f'potentiel{i}_nom', f'Potentiel {i}'),
                   nombre(f'potentiel{i}', f'Niveau du Potentiel {i}', max=3, libelleSur=f'potentiel{i}_nom')]

etat['sheetTemplate']['sections'] = [
    {'id': 'l_humain', 'label': "L'humain", 'fields': [
        texte('nom', 'Nom'), texte('genre', 'Sexe'), texte('age', 'Âge'), texte('taille', 'Taille'), texte('poids', 'Poids'),
    ]},
    {'id': 'origine', 'label': 'Origine', 'fields': [
        texte('culture', 'Culture'), texte('concept', 'Concept'), texte('culte', 'Culte'), texte('rang', 'Rang'),
    ]},
    {'id': 'attributs', 'label': 'Attributs', 'fields': [nombre(a, label, 1, max=6) for a, label, _, _ in ATTRIBUTS]},
    *[{'id': f'competences_{abr}', 'label': f'Compétences — {label}', 'fields': [nombre(c, nom, max=6) for c, nom in comp]}
      for _, label, abr, comp in ATTRIBUTS],
    {'id': 'historiques', 'label': 'Historiques', 'fields': [
        nombre('alliés', 'Alliés', max=6), nombre('autorite', 'Autorité', max=6), nombre('reseau', 'Réseau', max=6),
        nombre('renommee', 'Renommée', max=6), nombre('ressources', 'Ressources', max=6), nombre('secrets', 'Secrets', max=6),
    ]},
    {'id': 'potentiels', 'label': 'Potentiels', 'fields': potentiels},
    {'id': 'ego_et_sante', 'label': 'Égo et santé', 'fields': [
        nombre('ego_jauge', "Points d'Égo", max=24, maxSur='ego_max'),
        nombre('ego_max', "Égo maximal — (INT+Concentration)×2 ou (INS+Pulsions)×2", max=24),
        nombre('sporulations_jauge', 'Sporulations subies', max=24),
        nombre('blessures_superficielles', 'Blessures superficielles subies', max=24),
        nombre('traumatismes', 'Traumatismes subis', max=12),
        nombre('sante', 'Santé restante (les deux pistes)', 0),
    ]},
    {'id': 'armes', 'label': 'Armes', 'fields': armes},
    {'id': 'armures', 'label': 'Armures', 'fields': armures},
    {'id': 'equipement', 'label': 'Le bazar', 'fields': equipement + [
        texte('dinars_lc', 'Dinars / LC'), nombre('experience', 'Expérience'),
    ]},
]

pilote['dice'] = {'defaultDice': '6d6', 'logic': 'count-success', 'engine': 'pool', 'successThreshold': 4}

jet = pilote['jet']
for retire in ('seuil', 'critique', 'complication', 'modificateurDuSeuil'):
    jet.pop(retire, None)
abreges = [abr for _, _, abr, _ in ATTRIBUTS]
jet['reserve'] = {'base': 0, 'max': 12, 'faces': 6, 'composantes': [
    {'id': 'attribut', 'label': 'Attribut', 'sectionId': 'attributs'},
    {'id': 'competence', 'label': 'Compétence', 'sectionId': f'competences_{abreges[0]}',
     'sectionsSupplementaires': [f'competences_{a}' for a in abreges[1:]]},
]}
jet['sens'] = 'superieur-ou-egal'
# Une confrontation fait de la difficulté les succès de l'adversaire : zéro possible, et jusqu'aux
# douze dés de la réserve (p. 19) ; le livre gradue de 1 à 10 (p. 18).
jet['difficulte'] = {'min': 0, 'max': 12, 'defaut': 2}
jet['degenesis'] = {'traumatismes': 'traumatismes', 'ego': 'ego_jauge'}

pilote['tactical']['uniteDeDistance'] = "bande de portée de l'arme"
pilote['tactical']['ranges'] = {
    'contact': {'label': 'Corps à corps (allonge de l’arme)', 'maxUnits': 1, 'modifier': 0},
    'courte': {'label': 'Portée normale', 'maxUnits': 2, 'modifier': 0},
    'moyenne': {'label': 'Portée longue', 'maxUnits': 3, 'modifier': -4},
    'longue': {'label': 'Portée extrême', 'maxUnits': 4, 'modifier': -8},
}

combat = pilote['combat']
combat.pop('combat', None)
combat['initiativeFormula'] = 'psyche + reactivite'
combat['initiativeSort'] = 'desc'
combat['initiativeEnReserve'] = {'mecanique': 'degenesis'}
combat['defaultHealthType'] = 'hp'
combat['santeDeDepart'] = '(physique + resistance) * 2 + physique + psyche'
combat['damageTypes'] = ['physique', 'mental']
combat['statsToTrack'] = [
    {'fieldId': 'sante', 'label': 'Santé', 'isMainHP': True, 'isResource': True, 'max': '(physique + resistance) * 2 + physique + psyche'},
    {'fieldId': 'blessures_superficielles', 'label': 'Blessures superficielles', 'isMainHP': False, 'isResource': True, 'max': '(physique + resistance) * 2'},
    {'fieldId': 'traumatismes', 'label': 'Traumatismes', 'isMainHP': False, 'isResource': True, 'max': 'physique + psyche'},
    {'fieldId': 'ego_jauge', 'label': 'Égo', 'isMainHP': False, 'isResource': True, 'max': 'ego_max'},
    {'fieldId': 'sporulations_jauge', 'label': 'Sporulations', 'isMainHP': False, 'isResource': True, 'max': '(psyche + foi + volonte) * 2'},
]
combat['pistesDeSante'] = {'mecanique': 'degenesis', 'blessures': 'blessures_superficielles', 'traumatismes': 'traumatismes', 'ego': 'ego_jauge'}
pilote['ui_config']['gauges'] = [
    {'fieldId': 'ego_jauge', 'label': 'Égo', 'color': '#3b82f6', 'style': 'bar'},
    {'fieldId': 'sporulations_jauge', 'label': 'Sporulations', 'color': '#10b981', 'style': 'bar'},
    {'fieldId': 'blessures_superficielles', 'label': 'Blessures superficielles', 'color': '#f59e0b', 'style': 'bar'},
    {'fieldId': 'traumatismes', 'label': 'Traumatismes', 'color': '#ef4444', 'style': 'bar'},
]
pilote['version'] = '2.0.0'

champs = [f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']]
assert len(champs) == len(set(champs)), 'identifiant de champ en double'
lus = ['traumatismes', 'ego_jauge', 'ego_max', 'reactivite', 'psyche', 'physique', 'resistance', 'foi', 'volonte'] \
    + [s['fieldId'] for s in combat['statsToTrack']] + [g['fieldId'] for g in pilote['ui_config']['gauges']]
manquants = [c for c in lus if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} 2.0.0 : réserve de d6 à 4+, {len(champs)} champs, deux pistes de santé → {sortie}")
