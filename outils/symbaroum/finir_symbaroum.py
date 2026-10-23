# Finit le pilote Symbaroum — 2026-10-23, Claude Code, à la demande de David (« je voudrais qu'on
# finisse Symbaroum »). Lots S2 (dérivées, agonie), S4 (Stigmates, coûts), S5 (attaque, Défense,
# dégâts), S6 (départage de l'initiative), S7 (création, progression), S8 (règles optionnelles) et
# S9 (monnaie, voyages) de l'audit de Codex (documentation/Planning/2026-10-20-symbaroum-propositions.md).
#
# Part de l'export S3-S4 du 22/10 (déjà réimporté) et n'ajoute que ce que le moteur lit :
#   - jet.symbaroum : les champs de la fiche que les cartes du panneau de jet lisent et écrivent ;
#   - la Défense dans le choix de l'Attribut (section secondaire, filtrée par un motif) ;
#   - plus de « critique: 1 » ni de « complication: 20 » : le d20 de Symbaroum n'en a pas de base,
#     les attaques parfaites sont une option de la table (p. 184) ;
#   - combat.departages : la Vigilance départage deux Agilités égales, puis un d20 (p. 161) ;
#   - l'Expérience à dépenser suivie à côté du total.
# Aucun identifiant de champ ne change : la fiche HTML et les personnages existants restent valables.
#
# Usage : python -I -X utf8 outils/symbaroum/finir_symbaroum.py <export S3-S4> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('name') != 'Symbaroum':
    sys.exit(f"Ce n'est pas le pilote Symbaroum : {pilote.get('name')!r}.")
sections = etat['sheetTemplate']['sections']
champs = {f['id'] for s in sections for f in s['fields']}
section_de = {f['id']: s['id'] for s in sections for f in s['fields']}
jet = pilote.get('jet', {})
if not jet.get('modificateurDuSeuil', {}).get('avantage') or not pilote.get('franchissements'):
    sys.exit("L'Avantage tactique et la Corruption au seuil (S3-S4, export du 22/10) devaient déjà être là.")

ATTRIBUTS = ['agilite', 'astuce', 'discretion', 'force', 'persuasion', 'precision', 'vigilance', 'volonte']
attendus = ATTRIBUTS + ['endurance', 'endurance_actuelle', 'resistance_douleur', 'defense', 'seuil_corruption',
                        'corruption_temporaire', 'corruption_permanente', 'experience', 'experience_non_depensee',
                        'argent', 'bourse']
manquants = [c for c in attendus if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')

# — La Défense se jette depuis les valeurs secondaires (p. 164), pas l'Endurance ni le Seuil de Corruption.
attribut = jet['seuil'][0]
attribut['sectionsSupplementaires'] = [section_de['defense']]
attribut['motif'] = '^(' + '|'.join(ATTRIBUTS + ['defense']) + ')$'

# — Pas de critique de base au d20 : les attaques parfaites sont une option (S8, p. 184).
jet.pop('critique', None)
jet.pop('complication', None)

def present(*ids):
    return all(i in champs for i in ids)

jet['symbaroum'] = {
    'attributs': ATTRIBUTS,
    'force': 'force', 'volonte': 'volonte', 'agilite': 'agilite',
    'endurance': {'courante': 'endurance_actuelle', 'maximum': 'endurance'},
    'douleur': 'resistance_douleur', 'defense': 'defense', 'seuilDeCorruption': 'seuil_corruption',
    'corruption': {'temporaire': 'corruption_temporaire', 'permanente': 'corruption_permanente'},
    'armes': [{'nom': f'arme_{i}', 'degats': f'arme_{i}_degats', 'qualites': f'arme_{i}_qualites'}
              for i in range(1, 5) if present(f'arme_{i}', f'arme_{i}_degats', f'arme_{i}_qualites')],
    'armures': [{'nom': f'armure_{i}', 'protection': f'armure_{i}_protection', 'qualites': f'armure_{i}_qualites'}
                for i in range(1, 3) if present(f'armure_{i}', f'armure_{i}_protection', f'armure_{i}_qualites')],
    'experience': {'total': 'experience', 'disponible': 'experience_non_depensee'},
    'talents': [{'nom': f'talent_{i}', 'niveau': f'talent_{i}_niveau'}
                for i in range(1, 13) if present(f'talent_{i}', f'talent_{i}_niveau')],
    'argent': {'champ': 'argent', 'ecrit': 'bourse'},
    'options': ['mortSubite', 'degatsCritiques', 'attaquesParfaites', 'limiterLesCritiques',
                'relanceExperience', 'relanceCorruption'],
}

# — L'initiative : l'Agilité, puis la Vigilance, puis un d20 (S6, p. 161).
combat = pilote['combat']
combat['departages'] = ['vigilance']

# — L'Expérience à dépenser, à côté du total (S7, p. 166).
suivis = combat['statsToTrack']
if not any(s['fieldId'] == 'experience_non_depensee' for s in suivis):
    i = next((k for k, s in enumerate(suivis) if s['fieldId'] == 'experience'), len(suivis) - 1)
    suivis.insert(i + 1, {'fieldId': 'experience_non_depensee', 'label': 'Expérience à dépenser', 'isMainHP': False, 'isResource': True})

pilote['version'] = '2.0.0'
if isinstance(manifeste, dict) and 'version' in manifeste.get('driver', {}):
    manifeste['driver']['version'] = '2.0.0'

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

r = jet['symbaroum']
print(f"Pilote {pilote['name']} 2.0.0 : {len(r['armes'])} armes, {len(r['armures'])} armures, "
      f"{len(r['talents'])} talents, Défense jetable, départage par la Vigilance → {sortie}")
