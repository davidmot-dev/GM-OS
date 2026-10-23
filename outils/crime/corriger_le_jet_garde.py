# Donne au pilote de Crimes son vrai jet : Potentiel GARDE Compétence — 2026-10-22, Claude Code,
# chantier C1 de l'audit des Crimes (« oui on va sur crime C0, C1 », David).
#
# Le pilote exporté lançait une réserve sans composante (zéro dé), comptait des réussites contre
# une « difficulté 9 » et additionnait la compétence en seuil. Le livre (p. 385, 409-411) dit
# autre chose : autant de d10 que le Potentiel, on en garde autant que la Compétence (un seul sans
# elle), chaque dé gardé réussit à 9, 8 si le personnage est compétent, 7 avec une spécialisation
# appropriée, et tous les 1 sont gardés. Le moteur est `src/modules/dice/systemes/potentielGarde.ts`.
#
# Usage : python -I -X utf8 outils/crime/corriger_le_jet_garde.py <export du pilote> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'crime':
    sys.exit(f"Ce n'est pas le pilote de Crimes : {pilote.get('name')!r} ({pilote.get('corpusId')!r}).")

# Les cases de spécialisation de la fiche, par compétence : le début de leur identifiant.
PREFIXES = {
    'combat': 'specialties_combat_', 'sport': 'specialties_sport_', 'cirque': 'specialties_circus_',
    'traque': 'specialties_tracking_', 'larcin': 'specialties_larceny_',
    'sciences_abstraites': 'specialties_abstract_', 'sciences_du_vivant': 'specialties_life_',
    'sciences_de_l_homme': 'specialties_humanities_', 'occultisme': 'specialties_occultism_',
    'pratique': 'specialties_practical_', 'intrigues': 'specialties_intrigue_', 'societe': 'specialties_society_',
}
sections = {s['id']: {f['id'] for f in s['fields']} for s in etat['sheetTemplate']['sections']}
for sid in ('potentiels', 'competences', 'specialisations'):
    if sid not in sections:
        sys.exit(f"La fiche n'a pas de section « {sid} ».")
champs = set().union(*sections.values())
for competence, prefixe in PREFIXES.items():
    if competence not in sections['competences']:
        sys.exit(f"La compétence « {competence} » manque à la fiche.")
    if not any(c.startswith(prefixe) for c in champs):
        sys.exit(f"Aucune case ne commence par « {prefixe} ».")

ancien = pilote.get('jet') or {}
pilote['jet'] = {
    'reserve': {
        'base': 0, 'max': 10, 'faces': 10,
        'composantes': [{'id': 'potentiel', 'label': 'Potentiel', 'sectionId': 'potentiels'}],
    },
    'sens': 'superieur-ou-egal',
    'garde': {
        'competence': {'id': 'competence', 'label': 'Compétence', 'sectionId': 'competences'},
        'seuil': 9, 'competent': 1, 'specialise': 2,
        'specialisations': {'parCompetence': PREFIXES},
    },
}
# Ce qui n'appartient pas au jet lui-même (remarques, réglages ajoutés depuis) se garde.
for cle, valeur in ancien.items():
    if cle not in ('seuil', 'reserve', 'sens', 'critique', 'complication', 'difficulte', 'garde'):
        pilote['jet'][cle] = valeur

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : Potentiel GARDE Compétence (seuil 9/8/7, 12 compétences spécialisables) → {sortie}")
