# Achève le pilote de Crimes — 2026-10-23, Claude Code, lots C0.1 à C8 de l'audit (« Je voudrais finir
# complètement Crime aujourd'hui », David).
#
# C0.1 (p. 389-390, 412) : les circonstances du seuil lisent l'angoisse du tireur.
# C0.3 (p. 324-325) : les spécialisations hermétiques — sans elles, l'action ne se tente pas.
# C4 (p. 409-418) : la psychologie (angoisse, névrose, psychose, test psychotique, Innocence) et ses seuils
#   sous le bandeau du meneur : le seuil de névrose au choix du meneur, moitié (p. 409) ou zéro (p. 418) ;
#   la psychose à 6 et à 10 ; l'angoisse à 3 et au-delà.
# C6 (p. 390) : les munitions de l'arme à feu, sur la fiche (règle optionnelle).
# C7 (p. 428-431) : les contacts — influence et appels du scénario à côté de la loyauté de base, rendus
#   à « Nouveau scénario » — et la fortune, niveau et jauge.
# C8 (p. 324-334, 404-405) : les trois choix de Jung, l'âge, les points de développement.
#
# Les champs ajoutés ne vivent que dans GM-OS : la fiche HTML n'a pas de zone imprimée pour eux.
# Part du pilote c5-c6 (outils/crime/ajouter_enquete_et_armes.py).
# Usage : python -I -X utf8 outils/crime/completer_le_pilote.py <pilote c5-c6> <sortie .gmos-driver>
import json, os, sys, zipfile

entree, sortie = sys.argv[1:3]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

pilote = etat['gameDriver']
if pilote.get('corpusId') != 'crime':
    sys.exit(f"Ce n'est pas le pilote de Crimes : {pilote.get('name')!r} ({pilote.get('corpusId')!r}).")
garde = (pilote.get('jet') or {}).get('garde')
if not garde or garde.get('armes') != 'crimes' or 'enquete' not in pilote:
    sys.exit("Le pilote n'a pas encore ses styles et ses armes : passer d'abord outils/crime/ajouter_enquete_et_armes.py.")

sections = etat['sheetTemplate']['sections']
par_id = {s['id']: s for s in sections}
ids = {f['id'] for s in sections for f in s['fields']}


def exige(*champs):
    for c in champs:
        if c not in ids:
            sys.exit(f"Le champ « {c} » manque à la fiche.")


def ajouter_apres(section, apres, champ):
    """Pose `champ` derrière `apres` dans la section, une seule fois même si le script repasse."""
    fields = par_id[section]['fields']
    fields[:] = [f for f in fields if f['id'] != champ['id']]
    i = next(k for k, f in enumerate(fields) if f['id'] == apres) + 1
    fields.insert(i, champ)
    ids.add(champ['id'])


HERMETIQUES = [
    'specialties_abstract_mathematics', 'specialties_abstract_cryptography', 'specialties_abstract_astronomy',
    'specialties_life_medicine', 'specialties_life_pharmacy', 'specialties_life_psychiatry',
    'specialties_humanities_anthropology', 'specialties_humanities_theology',
    'specialties_occultism_magnetism', 'specialties_occultism_spiritism', 'specialties_occultism_divination',
    'specialties_occultism_languages', 'specialties_practical_photography', 'specialties_tracking_trapping',
    'specialties_larceny_mimicry',
]
exige('angoisse', 'nevrose', 'seuil_nevrose', 'psychose', 'base_psychose', 'mental', 'inclinaison_psychotique',
      'innocence', 'seuil_innocence', 'fortune', 'fortune_piste', 'sexe_age', 'equipement', 'tempérament',
      'psychology_emotivity', 'psychology_activity', 'psychology_reactivity', 'physique', 'social', *HERMETIQUES)

# C0.2, C0.3, C4
garde['circonstances'] = {'angoisse': 'angoisse'}
garde['hermetiques'] = HERMETIQUES
garde['psychologie'] = {
    'angoisse': 'angoisse', 'nevrose': 'nevrose', 'seuilNevrose': 'seuil_nevrose', 'psychose': 'psychose',
    'mental': 'mental', 'inclinaison': 'inclinaison_psychotique',
    'innocence': {'score': 'innocence', 'seuil': 'seuil_innocence'},
}

# C6 : les munitions, et C8 : les points de développement, dans l'identité.
ajouter_apres('identite', 'equipement', {'id': 'munitions', 'label': "Munitions de l'arme à feu", 'type': 'number', 'defaultValue': 0})
ajouter_apres('identite', 'fortune_piste', {'id': 'points_de_developpement', 'label': 'Points de développement', 'type': 'number', 'defaultValue': 0})
garde['munitions'] = 'munitions'

# C7 : les contacts — l'influence du PNJ et les appels du scénario à côté de la loyauté de base.
contacts = []
for i in range(8):
    exige(f'contacts_{i}_name', f'contacts_{i}_rating')
    par_id['contacts']['fields'] = [f for f in par_id['contacts']['fields'] if f['id'] not in (f'contacts_{i}_influence', f'contacts_{i}_appels')]
    ajouter_apres('contacts', f'contacts_{i}_rating', {'id': f'contacts_{i}_appels', 'label': f'Contact {i + 1} — appels du scénario',
                                                      'type': 'number', 'defaultValue': 0, 'libelleSur': f'contacts_{i}_name'})
    ajouter_apres('contacts', f'contacts_{i}_rating', {'id': f'contacts_{i}_influence', 'label': f'Contact {i + 1} — influence',
                                                      'type': 'number', 'defaultValue': 0, 'max': 4, 'libelleSur': f'contacts_{i}_name'})
    contacts.append({'nom': f'contacts_{i}_name', 'loyaute': f'contacts_{i}_rating',
                     'appels': f'contacts_{i}_appels', 'influence': f'contacts_{i}_influence'})
garde['contacts'] = contacts
garde['fortune'] = {'niveau': 'fortune', 'jauge': 'fortune_piste', 'seuil': 10}

# C8
garde['creation'] = {
    'potentiels': ['physique', 'mental', 'social'],
    'temperament': {'emotivite': 'psychology_emotivity', 'activite': 'psychology_activity',
                    'reactivite': 'psychology_reactivity', 'nom': 'tempérament', 'basePsychose': 'base_psychose'},
    'age': 'sexe_age',
    'developpement': 'points_de_developpement',
}

# « Le niveau de base est restauré dès la fin du scénario » (p. 430) : à « Nouveau scénario », les appels s'effacent.
gestes = pilote.setdefault('gestesDesHeros', {})
gestes['nouveauScenario'] = [{'champ': c['appels'], 'label': f'Contact {i + 1} — appels', 'delta': 'vide'} for i, c in enumerate(contacts)]

# C4 : les seuils, proposés sous le bandeau du meneur, jamais écrits seuls.
pilote['franchissements'] = [
    {
        'id': 'crimes-seuil-de-nevrose', 'champ': 'nevrose', 'label': 'Seuil de névrose',
        'aPartirDe': {'champ': 'seuil_nevrose'},
        'rappel': "Décompensation névrotique : +1 Psychose et un état de folie jusqu'à la fin de la scène, "
                  "selon l'inclinaison psychotique. La Névrose redescend : à la moitié (p. 409, 411) ou à zéro (p. 418), au choix du meneur.",
        'mouvements': [],
        'variantes': [
            {'id': 'moitie', 'label': 'Névrose à la moitié (p. 409)', 'mouvements': [
                {'champ': 'psychose', 'label': 'Psychose', 'delta': 1, 'max': 10},
                {'champ': 'nevrose', 'label': 'Névrose', 'delta': 'moitie'},
            ]},
            {'id': 'zero', 'label': 'Névrose à zéro (p. 418)', 'mouvements': [
                {'champ': 'psychose', 'label': 'Psychose', 'delta': 1, 'max': 10},
                {'champ': 'nevrose', 'label': 'Névrose', 'delta': 'vide'},
            ]},
        ],
    },
    {
        'id': 'crimes-psychose-6', 'champ': 'psychose', 'label': 'Psychose 6', 'aPartirDe': 6,
        'rappel': "Dès 6, les états de folie deviennent intermittents : les mêmes effets reviennent à chaque seuil de névrose, plus aigus et plus durables (p. 410).",
        'mouvements': [],
    },
    {
        'id': 'crimes-psychose-10', 'champ': 'psychose', 'label': 'Déchéance', 'aPartirDe': 10,
        'rappel': "Psychose 10 : « il doit subir une déchéance » (p. 410) — le livre laisse au meneur de la dire ; elle se note dans « Déchéances ».",
        'mouvements': [],
    },
    {
        'id': 'crimes-angoisse-3', 'champ': 'angoisse', 'label': 'Angoissé', 'aPartirDe': 3,
        'rappel': "Angoisse 3 : le meneur peut exiger un jet même pour une action a priori facile (p. 383) ; pour viser, le seuil de 9 s'impose (p. 412).",
        'mouvements': [],
    },
    {
        'id': 'crimes-angoisse-4', 'champ': 'angoisse', 'label': 'Angoisse au-delà de 3', 'aPartirDe': 4,
        'rappel': "Plus de 3 en angoisse : le tir est pénalisé de 1 à 2 (p. 389) et recharger peut coûter un assaut de plus (p. 390).",
        'mouvements': [],
    },
]

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))

print(f"Pilote {pilote['name']} : circonstances, {len(HERMETIQUES)} spécialisations hermétiques, psychologie et "
      f"{len(pilote['franchissements'])} seuils, munitions, {len(contacts)} contacts, fortune, création → {sortie}")
