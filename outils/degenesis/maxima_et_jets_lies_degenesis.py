# Pilote Degenesis 2.2.0 — DEG-A3 et DEG-A4, 2026-11-04, Claude Code, à la demande de David
# (« on commence DEG-A3 et DEG-A4 »). Livre de base français Katharsys, pages imprimées (PDF − 1).
#
# Part du pilote 2.1.0 (`combat_degenesis.py`, réimporté et validé le 04/11) et garde l'identifiant
# du pilote et de son modèle de fiche : la réimportation se fait avec « Remplacer ». La fiche ne
# change pas (131 champs) : la branche déclarée se garde sous une clé cachée de la fiche.
#
# - `jet.degenesis.maxima` (DEG-A3) : la carte « Maxima » de la fiche —
#   Égo maximal = (INT + Concentration) × 2 ou (INS + Pulsions) × 2, écrit dans `ego_max` ;
#   Sporulations maximales = (PSY + Foi) × 2 ou (PSY + Volonté) × 2 (p. 26, 94) ;
#   Blessures superficielles = (PHY + Résistance) × 2 ; Traumatismes = PHY + PSY (p. 94).
#   Les trois derniers restent des formules de `combat.statsToTrack`, que la carte explique.
# - `jet.degenesis.reserves` (DEG-A4) : les compétences de chaque attribut, pour composer la
#   réserve d'un adversaire en confrontation (p. 19-20).
# - Aide, combinaison et action complexe (p. 20-21) n'ont besoin d'aucun champ.
# - version 2.2.0.
#
# Usage : python -I -X utf8 outils/degenesis/maxima_et_jets_lies_degenesis.py <pilote 2.1.0> <sortie .gmos-driver>
import json, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    contenus = {n: z.read(n) for n in z.namelist()}
etat = json.loads(contenus['state.json'])
pilote = etat['gameDriver']
if pilote.get('corpusId') != 'degenesis':
    sys.exit(f"Ce n'est pas le pilote Degenesis : {pilote.get('name')!r}.")
if 'combat' not in pilote['jet'].get('degenesis', {}):
    sys.exit(f"Il faut le pilote 2.1.0 (combat_degenesis.py), pas {pilote.get('version')!r}.")

deg = pilote['jet']['degenesis']
deg['maxima'] = {
    'ego': {
        'champ': 'ego_max', 'jauge': 'ego_jauge',
        'branches': [
            {'cle': 'concentration', 'libelle': 'Concentration', 'attribut': 'intellect', 'competence': 'concentration'},
            {'cle': 'pulsions', 'libelle': 'Pulsions', 'attribut': 'instinct', 'competence': 'pulsions'},
        ],
    },
    'sporulations': {
        'jauge': 'sporulations_jauge',
        'branches': [
            {'cle': 'foi', 'libelle': 'Foi', 'attribut': 'psyche', 'competence': 'foi'},
            {'cle': 'volonte', 'libelle': 'Volonté', 'attribut': 'psyche', 'competence': 'volonte'},
        ],
    },
    'blessures': {'jauge': 'blessures_superficielles', 'champs': ['physique', 'resistance']},
    'traumatismes': {'jauge': 'traumatismes', 'champs': ['physique', 'psyche']},
    'abreviations': {'physique': 'PHY', 'agilite': 'AGI', 'charisme': 'CHA', 'intellect': 'INT',
                     'psyche': 'PSY', 'instinct': 'INS', 'resistance': 'Résistance'},
}

sections = {s['id']: [f['id'] for f in s['fields']] for s in etat['sheetTemplate']['sections']}
deg['reserves'] = [
    {'attribut': attribut, 'competences': sections[f'competences_{abr}']}
    for attribut, abr in (('physique', 'phy'), ('agilite', 'agi'), ('charisme', 'cha'),
                          ('intellect', 'int'), ('psyche', 'psy'), ('instinct', 'ins'))
]
pilote['version'] = '2.2.0'

# Chaque champ nommé doit exister dans la fiche : la Forge le refuserait sinon.
champs = {f for ids in sections.values() for f in ids}
m = deg['maxima']
lus = [m['ego']['champ'], m['ego']['jauge'], m['sporulations']['jauge'], m['blessures']['jauge'], m['traumatismes']['jauge']] \
    + [x for b in m['ego']['branches'] + m['sporulations']['branches'] for x in (b['attribut'], b['competence'])] \
    + m['blessures']['champs'] + m['traumatismes']['champs'] \
    + [x for r in deg['reserves'] for x in [r['attribut'], *r['competences']]]
absents = sorted({x for x in lus if x not in champs})
if absents:
    sys.exit(f'Champs absents de la fiche : {absents}')
jauges = {s['fieldId'] for s in pilote['combat']['statsToTrack']}
if not {m['sporulations']['jauge'], m['blessures']['jauge'], m['traumatismes']['jauge']} <= jauges:
    sys.exit('Une jauge des maxima manque à combat.statsToTrack.')

contenus['state.json'] = json.dumps(etat, ensure_ascii=False, indent=2).encode('utf-8')
if 'manifest.json' in contenus:
    manifeste = json.loads(contenus['manifest.json'])
    if isinstance(manifeste, dict) and 'version' in manifeste:
        manifeste['version'] = '2.2.0'
    contenus['manifest.json'] = json.dumps(manifeste, ensure_ascii=False, indent=2).encode('utf-8')
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    for nom, octets in contenus.items():
        z.writestr(nom, octets)
print(f"Pilote {pilote['name']} 2.2.0 : maxima (deux branches d'Égo, deux de Sporulation), "
      f"{len(deg['reserves'])} attributs pour la confrontation, {len(champs)} champs → {sortie}")
