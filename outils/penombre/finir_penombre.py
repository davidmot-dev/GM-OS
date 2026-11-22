# Finit le pilote Pénombre (livre de base Æther Labs) — 2026-11-22, Claude Code, à la demande de
# David (« oui je joue à Pénombre, fais tout dans l'ordre »). Pages imprimées = pages du PDF.
#
# Part de l'export forgé du 22/11 (Penombre_driver_gmos_1795351740456) et garde l'identifiant du
# pilote et de son modèle de fiche : la réimportation se fait avec « Remplacer ».
#
# - `jet` : le dé de l'harmonique retenue (D4 à D12) ou le D20 merveilleux, plus autant de D6 que
#   le niveau d'un atout ; un succès par tranche de 4 sur chaque dé (`jet.penombre`, p. 28-31).
#   Le pilote forgé écrivait « 1d harmonique + 1-3d atout », que le moteur ne lit pas : dés vides,
#   total NaN. Retirés : `difficulte` (de 1 à 20, réglée par la carte de Pénombre), `critique`,
#   `complication` (des réglages d20 sans objet ici) et les quatre `suitesDesCritiques`, mal
#   déclenchées (« Merveille : 5 succès » venait d'une fiche fausse du corpus) ;
# - les jetons : la conscience a trois états (p. 24-25) — `conscience` compte les jetons qui ne
#   sont pas perdus, `jetons_actifs` ceux qu'on peut encore dépenser, `conscience_max` la valeur ;
#   la réserve collégiale est une ressource de table de 10 jetons, que personne ne perd (p. 24) :
#   son identifiant `réserve_collégiale` perd ses accents, et le jet ne débitait pas la bonne ;
# - la fiche GM-OS reprend une à une les 69 clés de la fiche HTML `penombre-standard-fr` :
#   9 atouts (niveau 1 à 3), 2 maîtrises (1 à 5), 4 pouvoirs, 4 complications (1 à 3 cases), la
#   partition (clé et 4 notes), le timbre, la peste, le potentiel ; retirés les doublons forgés
#   (`partition_notes_fill`, `potentiel_reserve`, `reserve_jetons`) et « Séquelles », absent du livre ;
#   les harmoniques ne sont plus préremplies D4 à D12 : le joueur les répartit (p. 54) ;
# - portées : les trois espaces du livre (p. 27) ; leur +2 et +5 ne valent que pour la magie (p. 30) ;
# - version 2.0.0.
#
# Usage : python -I -X utf8 outils/penombre/finir_penombre.py <export forgé> <sortie .gmos-driver> [correspondance.json]
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]
sortie_correspondance = sys.argv[3] if len(sys.argv) > 3 else None

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'penombre':
    sys.exit(f"Ce n'est pas le pilote Pénombre : {pilote.get('name')!r}.")

# La correspondance se construit avec la fiche : chaque champ GM-OS dit sa clé HTML.
correspondance = []


def champ(id, label, type, fiche=None, defaut='', **plus):
    if fiche:
        correspondance.append({'gmos': id, 'fiche': fiche, **({'valeurs': plus.pop('valeurs')} if 'valeurs' in plus else {})})
    plus.pop('valeurs', None)
    return {'id': id, 'label': label, 'type': type, 'defaultValue': defaut, **plus}


texte = lambda id, label, fiche=None, **p: champ(id, label, 'text', fiche, '', **p)
long = lambda id, label, fiche=None, **p: champ(id, label, 'textarea', fiche, '', **p)
nombre = lambda id, label, fiche=None, defaut=0, **p: champ(id, label, 'number', fiche, defaut, **p)
case = lambda id, label, fiche=None, **p: champ(id, label, 'checkbox', fiche, False, **p)

DES = ['D4', 'D6', 'D8', 'D10', 'D12']
HARMONIQUES = [('ame', 'Âme', 'soul'), ('esprit', 'Esprit', 'mind'), ('etincelle', 'Étincelle', 'spark'),
               ('nature', 'Nature', 'nature'), ('nuit', 'Nuit', 'night')]

atouts = []
for i in range(1, 10):
    atouts += [texte(f'atout{i}', f'Atout {i}', f'assets.{i - 1}.description'),
               nombre(f'atout{i}_niveau', f'Niveau de l’atout {i}', f'assets.{i - 1}.rank', max=3, libelleSur=f'atout{i}')]
maitrises = []
for i in range(1, 3):
    maitrises += [texte(f'magie{i}', f'Maîtrise magique {i}', f'magic.{i - 1}.name'),
                  texte(f'magie{i}_harmonique', f'Harmonique de la maîtrise {i}', f'magic.{i - 1}.harmonic'),
                  texte(f'magie{i}_prerequis', f'Prérequis de la maîtrise {i}', f'magic.{i - 1}.prerequisite'),
                  nombre(f'magie{i}_niveau', f'Niveau de la maîtrise {i}', f'magic.{i - 1}.level', max=5, libelleSur=f'magie{i}')]
pouvoirs = []
for i in range(1, 5):
    pouvoirs += [texte(f'pouvoir{i}', f'Pouvoir {i}', f'powers.{i - 1}.description'),
                 texte(f'pouvoir{i}_type', f'Type du pouvoir {i}', f'powers.{i - 1}.type'),
                 case(f'pouvoir{i}_utilise', f'Pouvoir {i} utilisé depuis le repos', f'powers.{i - 1}.used')]
complications = []
for i in range(1, 5):
    complications += [texte(f'complication{i}', f'Complication {i}', f'complications.{i - 1}.description'),
                      nombre(f'complication{i}_cases', f'Cases barrées de la complication {i}', f'complications.{i - 1}.severity',
                             max=3, libelleSur=f'complication{i}')]

etat['sheetTemplate']['sections'] = [
    {'id': 'personnage', 'label': 'Personnage', 'fields': [
        texte('nom', 'Nom', 'identity.name'), texte('peuple', 'Peuple', 'identity.people'),
        texte('cle', 'Clé', 'identity.key'), texte('gamme', 'Gamme', 'identity.scale'), texte('ton', 'Ton', 'identity.tone'),
    ]},
    {'id': 'harmoniques', 'label': 'Harmoniques', 'fields': [
        champ(id, label, 'select', f'harmonics.{cle}', '', options=DES) for id, label, cle in HARMONIQUES
    ]},
    {'id': 'atouts', 'label': 'Atouts', 'fields': atouts},
    {'id': 'maitrises', 'label': 'Maîtrises magiques', 'fields': maitrises},
    {'id': 'pouvoirs', 'label': 'Pouvoirs', 'fields': pouvoirs},
    {'id': 'conscience', 'label': 'Conscience', 'fields': [
        nombre('conscience_max', 'Conscience', 'consciousness.max', 7),
        nombre('conscience', 'Jetons conscience restants (non perdus)', 'consciousness.current', 7, maxSur='conscience_max'),
        nombre('jetons_actifs', 'Jetons conscience actifs', None, 7, maxSur='conscience'),
    ] + complications},
    {'id': 'timbre_partition', 'label': 'Timbre et partition', 'fields': [
        champ('timbre', 'Timbre', 'select', 'timbre.state', 'Harmonieux', options=['Harmonieux', 'Faux', 'Dissonant'],
              valeurs={'harmonious': 'Harmonieux', 'false': 'Faux', 'dissonant': 'Dissonant'}),
        case('partition_cle', 'Partition : clé', 'partition.key'),
    ] + [case(f'partition_note{i}', f'Partition : note {i}', f'partition.notes.{i - 1}.marked') for i in range(1, 5)] + [
        texte('peste', 'Peste', 'plague.name'), long('peste_description', 'Symptômes de la peste', 'plague.description'),
    ]},
    {'id': 'potentiel', 'label': 'Potentiel', 'fields': [
        nombre('potentiel_atouts', 'Potentiel : atouts', 'potential.assets'),
        nombre('potentiel_magie', 'Potentiel : maîtrises magiques', 'potential.magic'),
        nombre('potentiel_pouvoirs', 'Potentiel : pouvoirs', 'potential.powers'),
    ]},
]

jet = pilote['jet']
for retire in ('difficulte', 'critique', 'complication', 'suitesDesCritiques', 'modificateurDuSeuil'):
    jet.pop(retire, None)
jet['seuil'] = [
    {'id': 'harmonique', 'label': 'Harmonique', 'sectionId': 'harmoniques'},
    {'id': 'atout', 'label': 'Atout', 'sectionId': 'atouts', 'facultative': True},
]
jet['reserve'] = {'base': 1, 'max': 1, 'faces': 20}
jet['sens'] = 'superieur-ou-egal'
jet['penombre'] = {
    'harmoniques': {id: id for id, _, _ in HARMONIQUES},
    'composanteHarmonique': 'harmonique',
    'composanteAtout': 'atout',
    'atouts': [{'niveau': f'atout{i}_niveau', 'libelle': f'atout{i}'} for i in range(1, 10)],
    'cle': 'cle',
    'conscience': {'restants': 'conscience', 'actifs': 'jetons_actifs', 'max': 'conscience_max'},
    'timbre': 'timbre',
    'partition': {'cle': 'partition_cle', 'notes': [f'partition_note{i}' for i in range(1, 5)]},
    'reserveCollegiale': 'reserve_collegiale',
    'peste': 'peste',
}
pilote['dice'] = {'defaultDice': '1d8', 'logic': 'count-success', 'engine': 'pool'}

pilote['ressourcesDeTable'] = [{
    'id': 'reserve_collegiale', 'label': 'Réserve collégiale', 'proprietaire': 'joueurs',
    'depart': 10, 'min': 0, 'max': 10, 'visibleAuxJoueurs': True, 'manipulableParLesJoueurs': True,
}]

pilote['tactical']['ranges'] = {
    'proche': {'label': 'Proche (à portée de main ; magie +0)', 'maxUnits': 1, 'modifier': 0},
    'lointain': {'label': 'Lointain (vue, voix, ouïe, odorat ; magie +2)', 'maxUnits': 2, 'modifier': 0},
    'hors_champ': {'label': 'Hors champ (au-delà des sens ; magie +5)', 'maxUnits': 3, 'modifier': 0},
}

combat = pilote['combat']
combat['santeDeDepart'] = 'conscience_max'
combat['statsToTrack'] = [
    {'fieldId': 'conscience', 'label': 'Jetons conscience', 'isMainHP': True, 'isResource': True, 'max': 'conscience_max'},
    {'fieldId': 'jetons_actifs', 'label': 'Jetons actifs', 'isMainHP': False, 'isResource': True, 'max': 'conscience'},
]
pilote['ui_config']['gauges'] = [
    {'fieldId': 'conscience', 'label': 'Jetons conscience', 'color': '#ef4444', 'style': 'segmented'},
    {'fieldId': 'jetons_actifs', 'label': 'Jetons actifs', 'color': '#10b981', 'style': 'segmented'},
]
pilote['version'] = '2.0.0'

champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
p = jet['penombre']
lus = (list(p['harmoniques'].values()) + [a['niveau'] for a in p['atouts']] + [a['libelle'] for a in p['atouts']]
       + list(p['conscience'].values()) + [p['cle'], p['timbre'], p['peste'], p['partition']['cle']] + p['partition']['notes']
       + [g['fieldId'] for g in pilote['ui_config']['gauges']] + [s['fieldId'] for s in combat['statsToTrack']])
manquants = [c for c in lus if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

if sortie_correspondance:
    os.makedirs(os.path.dirname(sortie_correspondance) or '.', exist_ok=True)
    with open(sortie_correspondance, 'w', encoding='utf-8', newline='\n') as f:
        json.dump({
            'version': 1,
            'gabaritDeLaFiche': 'penombre-standard-fr',
            'commentaire': ("Correspondance entre la fiche GM-OS de Pénombre (pilote 2.0.0, outils/penombre/finir_penombre.py) "
                            "et le gabarit penombre-standard-fr livré le 2026-11-22. Les champs du pilote reprennent un à un "
                            "les clés de la fiche ; seul le timbre traduit ses valeurs. Les jetons actifs n'ont pas de case "
                            "sur la fiche imprimée : ils restent dans GM-OS."),
            'champs': correspondance,
        }, f, ensure_ascii=False, indent=2)
        f.write('\n')

print(f"Pilote {pilote['name']} 2.0.0 : {len(champs)} champs, {len(correspondance)} clés de la fiche → {sortie}")
