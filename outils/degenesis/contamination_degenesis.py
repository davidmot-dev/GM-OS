# Pilote Degenesis 2.3.0 — DEG-A5 et DEG-A6, 2026-11-04, Claude Code, à la demande de David
# (« on va finir DEG-A5 et DEG-A6 »). Livre de base français Katharsys, pages imprimées (PDF − 1).
#
# Part du pilote 2.2.0 (`maxima_et_jets_lies_degenesis.py`, validé le 04/11) et garde l'identifiant
# du pilote et de son modèle de fiche : la réimportation se fait avec « Remplacer ». La fiche ne
# change pas (131 champs) : les points permanents, l'EX du jour et la stimulation en cours se
# gardent sous la clé cachée de la fiche.
#
# - `jet.degenesis.contamination` (DEG-A5) : la carte « Sporulation et Brûlure » et les bonus au jet —
#   la jauge des Sporulations subies, l'Égo et son maximum ; PHY + Résistance pour l'exposition et
#   le Bion (p. 186-187, 190) ; les six attributs, dans l'ordre du d6 de la Discordia (p. 190) ;
#   PHY pour la Gloire, PSY + Foi / Volonté pour la Gloire et le test du Germe (p. 186, 190) ;
#   CHA + Négociation / Expression pour l'Unité, INS + Perception / Empathie pour la Muse (p. 190) ;
#   les six Potentiels de la fiche (nom et niveau), choisis explicitement au jet.
# - DEG-A6 n'a besoin d'aucune clé : l'adversaire sans fiche se prépare avec les champs des maxima
#   (`jet.degenesis.maxima`) et passe par `combat.pistesDeSante`.
# - version 2.3.0.
#
# Usage : python -I -X utf8 outils/degenesis/contamination_degenesis.py <pilote 2.2.0> <sortie .gmos-driver>
import json, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    contenus = {n: z.read(n) for n in z.namelist()}
etat = json.loads(contenus['state.json'])
pilote = etat['gameDriver']
if pilote.get('corpusId') != 'degenesis':
    sys.exit(f"Ce n'est pas le pilote Degenesis : {pilote.get('name')!r}.")
if 'maxima' not in pilote['jet'].get('degenesis', {}):
    sys.exit(f"Il faut le pilote 2.2.0 (maxima_et_jets_lies_degenesis.py), pas {pilote.get('version')!r}.")

deg = pilote['jet']['degenesis']
deg['contamination'] = {
    'sporulations': 'sporulations_jauge',
    'ego': 'ego_jauge',
    'egoMax': 'ego_max',
    'resistance': ['physique', 'resistance'],
    'attributs': ['physique', 'agilite', 'charisme', 'intellect', 'psyche', 'instinct'],
    'physique': 'physique',
    'mental': [['psyche', 'foi'], ['psyche', 'volonte']],
    'social': [['charisme', 'negociation'], ['charisme', 'expression']],
    'sens': [['instinct', 'perception'], ['instinct', 'empathie']],
    'potentiels': [{'nom': f'potentiel{i}_nom', 'niveau': f'potentiel{i}'} for i in range(1, 7)],
}
pilote['version'] = '2.3.0'

# Chaque champ nommé doit exister dans la fiche : la Forge le refuserait sinon.
champs = {f['id'] for s in etat['sheetTemplate']['sections'] for f in s['fields']}
c = deg['contamination']
lus = [c['sporulations'], c['ego'], c['egoMax'], c['physique'], *c['resistance'], *c['attributs']] \
    + [x for paires in (c['mental'], c['social'], c['sens']) for p in paires for x in p] \
    + [x for p in c['potentiels'] for x in p.values()]
absents = sorted({x for x in lus if x not in champs})
if absents:
    sys.exit(f'Champs absents de la fiche : {absents}')
if not any(s['fieldId'] == c['sporulations'] and s.get('max') for s in pilote['combat']['statsToTrack']):
    sys.exit('La jauge des Sporulations n’a pas de maximum dans combat.statsToTrack.')

contenus['state.json'] = json.dumps(etat, ensure_ascii=False, indent=2).encode('utf-8')
if 'manifest.json' in contenus:
    manifeste = json.loads(contenus['manifest.json'])
    if isinstance(manifeste, dict) and 'version' in manifeste:
        manifeste['version'] = '2.3.0'
    contenus['manifest.json'] = json.dumps(manifeste, ensure_ascii=False, indent=2).encode('utf-8')
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    for nom, octets in contenus.items():
        z.writestr(nom, octets)
print(f"Pilote {pilote['name']} 2.3.0 : contamination (Sporulation, Brûlure, six Potentiels), {len(champs)} champs → {sortie}")
