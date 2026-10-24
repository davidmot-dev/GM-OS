# Finit le pilote Star Trek Adventures (deuxième édition) — 2026-10-23, Claude Code, à la demande de
# David (« on va faire toute les améliorations de Star Trek », livre de base français). Pages imprimées.
#
# Part de l'export « paiement au choix » du 22/10 (déjà réimporté) et n'ajoute que ce que le moteur lit :
#   - jet.starTrek : les champs que le panneau de jet et ses cartes lisent (Stress, Forme, Protection,
#     Détermination, Réputation, attributs et fonctions) ;
#   - la Réputation au choix de la fonction, face à qui ne connaît que votre nom (p. 169) ;
#   - combat.initiative : les camps alternent, garder l'initiative coûte 2 Impulsion, deux tours
#     d'affilée au plus (p. 277) ; le Stress suivi au combat, plafonné par la Forme ;
#   - la Menace de départ : 2 par personnage joueur à « Nouveau scénario », l'Impulsion à 0 (p. 259, 264) ;
#   - la Détermination remise à 1 à « Début de séance » (p. 168, 262) ;
#   - le module « Bataille spatiale et tâches étendues » à côté de LCARS.
# Aucun identifiant de champ ne change : la fiche HTML et les personnages existants restent valables.
#
# Usage : python -I -X utf8 outils/star-trek/finir_star_trek.py <export du 22/10> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'star-trek':
    sys.exit(f"Ce n'est pas le pilote Star Trek : {pilote.get('name')!r}.")
sections = etat['sheetTemplate']['sections']
champs = {f['id'] for s in sections for f in s['fields']}
section_de = {f['id']: s['id'] for s in sections for f in s['fields']}

ATTRIBUTS = ['maitrise', 'forme', 'presence', 'audace', 'intuition', 'raison']
FONCTIONS = ['commandement', 'navigation', 'ingenierie', 'securite', 'medecine', 'science']
manquants = [c for c in ATTRIBUTS + FONCTIONS + ['stress', 'stress_max', 'determination', 'reputation', 'resistance'] if c not in champs]
if manquants:
    sys.exit(f'Champs attendus absents de la fiche : {", ".join(manquants)}.')
reserves = {r['id']: r for r in pilote.get('ressourcesDeTable', [])}
if not reserves.get('impulsion', {}).get('paiementAuChoix'):
    sys.exit("Le paiement au choix (export du 22/10) devait déjà être là.")

jet = pilote['jet']
fonction = next(c for c in jet['seuil'] if c['id'] == 'fonction')
fonction['sectionsSupplementaires'] = [section_de['reputation']]
fonction['motif'] = '^(' + '|'.join(FONCTIONS + ['reputation']) + ')$'

jet['starTrek'] = {
    'attributs': ATTRIBUTS, 'fonctions': FONCTIONS, 'forme': 'forme',
    'stress': {'courant': 'stress', 'maximum': 'stress_max'},
    'protection': 'resistance', 'determination': 'determination', 'reputation': 'reputation',
}

combat = pilote['combat']
combat['initiative'] = {'mode': 'alternance', 'coutDeRetention': {'montant': 2, 'ressource': 'impulsion'}, 'activationsConsecutivesMax': 2}
if not any(s['fieldId'] == 'stress' for s in combat['statsToTrack']):
    combat['statsToTrack'].insert(0, {'fieldId': 'stress', 'label': 'Stress', 'isMainHP': False, 'isResource': True, 'max': 'forme'})

reserves['menace'].update({'remiseAuDepartParScenario': True, 'departParPersonnage': 2})
reserves['impulsion'].update({'remiseAuDepartParScenario': True})

gestes = pilote.setdefault('gestesDesHeros', {})
gestes['debutDeSeance'] = [{'champ': 'determination', 'label': 'Détermination', 'delta': 'vide', 'min': 1}]

modules = pilote.setdefault('modulesDuJeu', [])
if not any(m['id'] == 'star-trek-operations' for m in modules):
    modules.append({'id': 'star-trek-operations'})

pilote['version'] = '2.0.0'

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} 2.0.0 : Stress et blessures, Réputation, alternance, Menace par personnage, "
      f"Détermination à 1, module {', '.join(m['id'] for m in modules)} → {sortie}")
