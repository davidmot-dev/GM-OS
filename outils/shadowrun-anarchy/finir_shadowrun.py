# Finit le pilote Shadowrun : Anarchy 2.0 (livre de base sran2_01anarchyv2_web_v1) — 2026-10-31, Claude Code,
# à la demande de David (« finir le pilote »). Pages imprimées (PDF − 2).
#
# Part de l'export forgé du 31/10 (SR_Anarchy_driver_gmos_1793483272825) et garde l'identifiant du pilote et
# de son modèle de fiche : la réimportation se fait avec « Remplacer ».
#
# - `jet` : une réserve de d6 = Compétence + Attribut, +2 dés de spécialisation (p. 52, 64), réussis sur 5+
#   (`dice.successThreshold`), le seuil en succès, « normale » (3) par défaut (p. 64) ; `jet.shadowrun` : les
#   dés de risque, leurs succès doublés et leurs complications, la réduction du risque lue sur la ligne de
#   la compétence, l'avantage borné à un, le désavantage d'une blessure grave, l'Essence aux tests de magie,
#   la relance et l'avantage payés en points d'Anarchy (p. 60, 64-65, 68, 70-72, 77). Le pilote forgé
#   prenait compétence + attribut pour le SEUIL de chaque dé (9 sur un d6), ne lançait aucun dé et exigeait
#   trois réussites : tout échouait. Retirés : `seuil`, `critique`, `complication`, l'achat de dés contre
#   la réserve de planification, que le livre ne prévoit pas (elle paie des bonus, p. 78) ;
# - la fiche GM-OS reprend une à une les 121 clés de la fiche HTML `shadowrun-anarchy2-fr` : pseudo, cinq
#   mots-clés, quatre comportements et quatre répliques (p. 50-51), cinq attributs jusqu'à 6 (le troll,
#   p. 52), onze lignes de compétence (libellé, indice 0-8, attribut, réserve, RR 0-3), connaissances, onze
#   atouts, quatre armes ou sorts, cinq lignes d'équipement, deux armures, les seuils de blessure précalculés
#   (sans armure, armure principale, secondaire, mental — p. 68-69), le piratage, l'Anarchy, l'Essence et le
#   moniteur d'état. S'y ajoutent le métatype et le train de vie, les capacités du moniteur (un atout porte les
#   légères à 3 et les graves à 2, p. 68) et la position du moniteur, que seul GM-OS tient ;
# - santé : deux cases légères, une grave, une incapacitante ; la VD dépasse un seuil, une case se coche, et
#   une case pleine passe au degré supérieur (p. 68-69) — `combat.moniteurDEtat` (mécanique `shadowrun`) ;
# - Anarchy : 4 points pour un humain, 3 pour les autres métatypes, gagnés sans plafond (p. 77) ;
# - version 2.0.0.
#
# Usage : python -I -X utf8 outils/shadowrun-anarchy/finir_shadowrun.py <export forgé> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'shadowrun-anarchy':
    sys.exit(f"Ce n'est pas le pilote Shadowrun : Anarchy : {pilote.get('name')!r}.")


def texte(id, label):
    return {'id': id, 'label': label, 'type': 'text', 'defaultValue': ''}


def nombre(id, label, defaut=0, **plus):
    return {'id': id, 'label': label, 'type': 'number', 'defaultValue': defaut, **plus}


def choix(id, label, options, defaut):
    return {'id': id, 'label': label, 'type': 'select', 'options': options, 'defaultValue': defaut}


LIGNES_DE_COMPETENCE = 11
# Les identifiants des compétences restent ceux de la fiche forgée (`competence_1` …) : leurs indices déjà
# saisis survivent ; le libellé se lit sur la ligne (`libelleSur`).
competences = []
for n in range(1, LIGNES_DE_COMPETENCE + 1):
    competences += [
        texte(f'competence_{n}_nom', f'Compétence {n} — libellé'),
        {**nombre(f'competence_{n}', f'Compétence {n}', max=8), 'libelleSur': f'competence_{n}_nom'},
        nombre(f'competence_{n}_attribut', f'Compétence {n} — attribut', max=6),
        nombre(f'competence_{n}_reserve', f'Compétence {n} — réserve de dés', max=16),
        nombre(f'competence_{n}_rr', f'Compétence {n} — réduction du risque', max=3),
    ]

SEUILS = [('sans_armure', 'Sans armure'), ('principale', 'Armure principale'), ('secondaire', 'Armure secondaire'), ('mental', 'Mental')]
GRAVITES = [('legere', 'légère'), ('grave', 'grave'), ('incapacitante', 'incapacitante')]

etat['sheetTemplate']['sections'] = [
    {'id': 'identite', 'label': 'Identité', 'fields': [
        texte('pseudo', 'Pseudo'),
        choix('metatype', 'Métatype', ['Humain', 'Elfe', 'Nain', 'Ork', 'Troll'], 'Humain'),
        texte('train_de_vie', 'Train de vie'),
        *[texte(f'mot_cle_{n}', f'Mot-clé {n}') for n in range(1, 6)],
    ]},
    {'id': 'incarnation', 'label': 'Comportements et répliques', 'fields': [
        *[texte(f'comportement_{n}', f'Comportement {n}') for n in range(1, 5)],
        *[texte(f'replique_{n}', f'Réplique {n}') for n in range(1, 5)],
    ]},
    {'id': 'attributs', 'label': 'Attributs', 'fields': [
        nombre('force', 'Force', 1, max=6), nombre('agilite', 'Agilité', 1, max=6), nombre('volonte', 'Volonté', 1, max=6),
        nombre('logique', 'Logique', 1, max=6), nombre('charisme', 'Charisme', 1, max=6),
    ]},
    {'id': 'competences', 'label': 'Compétences', 'fields': competences},
    {'id': 'connaissances', 'label': 'Connaissances', 'fields': [texte('connaissances_liste', 'Connaissances')]},
    {'id': 'atouts', 'label': 'Atouts', 'fields': [texte(f'atout_{n}', f'Atout {n}') for n in range(1, 12)]},
    {'id': 'armes_et_sorts', 'label': 'Armes et sorts', 'fields': [
        f for n in range(1, 5) for f in (texte(f'arme_{n}', f'Arme ou sort {n}'), texte(f'arme_{n}_type', f'Arme ou sort {n} — type'))
    ]},
    {'id': 'equipement', 'label': 'Équipement et nuyens', 'fields': [texte(f'equipement_{n}', f'Équipement — ligne {n}') for n in range(1, 6)]},
    {'id': 'armures', 'label': 'Armures et seuils de blessure', 'fields': [
        texte('armure_principale', 'Armure principale'), texte('armure_secondaire', 'Armure secondaire'),
        *[nombre(f'seuil_{s}_{g}', f'Seuil {nom.lower()} — {gl}', max=30) for s, nom in SEUILS for g, gl in GRAVITES],
    ]},
    {'id': 'piratage', 'label': 'Piratage', 'fields': [
        nombre('piratage_des_de_risque', 'Nombre minimum de dés de risque en piratage', max=16),
        nombre('piratage_hausse_du_seuil', 'Augmentation du seuil en piratage', max=8),
    ]},
    {'id': 'jauges', 'label': 'Anarchy, Essence et moniteur d’état', 'fields': [
        nombre('anarchy', "Points d'Anarchy", 4, max=99),
        nombre('essence', 'Essence', 6, max=6),
        nombre('blessures_legeres', 'Blessures légères', max=3, maxSur='blessures_legeres_max'),
        nombre('blessures_graves', 'Blessures graves', max=2, maxSur='blessures_graves_max'),
        nombre('blessures_incapacitantes', 'Blessure incapacitante', max=1),
        nombre('blessures_legeres_max', 'Cases de blessures légères (3 par un atout)', 2, max=3),
        nombre('blessures_graves_max', 'Cases de blessures graves (2 par un atout)', 1, max=2),
        nombre('moniteur', "Moniteur d'état (position, tenue par GM-OS)", 0, max=6),
    ]},
]

pilote['dice'] = {'defaultDice': '6d6', 'logic': 'count-success', 'engine': 'pool', 'successThreshold': 5}

jet = pilote['jet']
for retire in ('seuil', 'critique', 'complication', 'modificateurDuSeuil'):
    jet.pop(retire, None)
jet['reserve'] = {'base': 0, 'max': 16, 'sansPlafond': True, 'faces': 6, 'composantes': [
    {'id': 'competence', 'label': 'Compétence', 'sectionId': 'competences', 'motif': r'^competence_\d+$', 'facultative': True},
    {'id': 'attribut', 'label': 'Attribut', 'sectionId': 'attributs'},
]}
jet['sens'] = 'superieur-ou-egal'
# Un test opposé remplace le seuil par les succès de l'adversaire : zéro possible (p. 64) ; le livre gradue
# de 2 à 8 et plus.
jet['difficulte'] = {'min': 0, 'max': 12, 'defaut': 3}
jet['shadowrun'] = {
    'anarchy': 'anarchy', 'essence': 'essence',
    'blessures': {'legeres': 'blessures_legeres', 'graves': 'blessures_graves', 'incapacitantes': 'blessures_incapacitantes'},
    'rrDesCompetences': {f'competence_{n}': f'competence_{n}_rr' for n in range(1, LIGNES_DE_COMPETENCE + 1)},
    'risqueAlternatif': False,
}

pilote['tactical'] = {**pilote.get('tactical', {}), 'uniteDeDistance': 'portée', 'ranges': {
    'contact': {'label': 'Contact (jusqu’à 2 m)', 'maxUnits': 1, 'modifier': 0},
    'courte': {'label': 'Portée courte (3 à 15 m)', 'maxUnits': 2, 'modifier': 0},
    'moyenne': {'label': 'Portée moyenne (16 à 60 m)', 'maxUnits': 3, 'modifier': 0},
    'longue': {'label': 'Portée longue (plus de 60 m)', 'maxUnits': 4, 'modifier': 0},
}}

combat = pilote['combat']
combat['defaultHealthType'] = 'boxes'
combat['casesDeSante'] = {
    'libelle': "Moniteur d'état", 'nombre': 4, 'champ': 'moniteur',
    'seuils': [
        {'aPartirDe': 1, 'label': 'Légère', 'etat': 'scratched'},
        {'aPartirDe': 3, 'label': 'Grave', 'etat': 'wounded'},
        {'aPartirDe': 4, 'label': 'Incapacitante', 'etat': 'critical'},
    ],
}
combat['damageTypes'] = ['physique', 'sans armure', 'armure secondaire', 'mental']
combat['moniteurDEtat'] = {
    'mecanique': 'shadowrun', 'sante': 'moniteur',
    'legeres': 'blessures_legeres', 'graves': 'blessures_graves', 'incapacitantes': 'blessures_incapacitantes',
    'capacites': {'legeres': 'blessures_legeres_max', 'graves': 'blessures_graves_max'},
    'seuils': {s: {g: f'seuil_{s}_{g}' for g, _ in GRAVITES} for s, _ in SEUILS},
    'force': 'force', 'volonte': 'volonte',
}
combat['statsToTrack'] = [
    {'fieldId': 'anarchy', 'label': "Points d'Anarchy", 'isMainHP': False, 'isResource': True},
    {'fieldId': 'essence', 'label': 'Essence', 'isMainHP': False, 'isResource': True, 'max': '6'},
    {'fieldId': 'blessures_legeres', 'label': 'Blessures légères', 'isMainHP': False, 'isResource': True, 'max': 'blessures_legeres_max'},
    {'fieldId': 'blessures_graves', 'label': 'Blessures graves', 'isMainHP': False, 'isResource': True, 'max': 'blessures_graves_max'},
    {'fieldId': 'blessures_incapacitantes', 'label': 'Blessure incapacitante', 'isMainHP': False, 'isResource': True, 'max': '1'},
]
pilote['ui_config']['gauges'] = [
    {'fieldId': 'anarchy', 'label': "Points d'Anarchy", 'color': '#d946ef', 'style': 'segmented'},
    {'fieldId': 'essence', 'label': 'Essence', 'color': '#22d3ee', 'style': 'bar'},
    {'fieldId': 'blessures_legeres', 'label': 'Blessures légères', 'color': '#f59e0b', 'style': 'segmented'},
    {'fieldId': 'blessures_graves', 'label': 'Blessures graves', 'color': '#ef4444', 'style': 'segmented'},
]
pilote['version'] = '2.0.0'

champs = [f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']]
assert len(champs) == len(set(champs)), 'identifiant de champ en double'
lus = ['anarchy', 'essence', 'force', 'volonte', 'moniteur', *jet['shadowrun']['blessures'].values(),
       *jet['shadowrun']['rrDesCompetences'].values(), *combat['moniteurDEtat']['capacites'].values(),
       *[c for g in combat['moniteurDEtat']['seuils'].values() for c in g.values()]] \
    + [s['fieldId'] for s in combat['statsToTrack']] + [g['fieldId'] for g in pilote['ui_config']['gauges']]
manquants = [c for c in lus if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} 2.0.0 : réserve de d6 à 5+, dés de risque, {len(champs)} champs, moniteur d'état → {sortie}")
