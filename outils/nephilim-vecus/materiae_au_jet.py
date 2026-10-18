# Lot D, option B de Nephilim (2026-10-18) : la transmutation consomme ses Materiae Primae seule.
#
# Choix de David : « seules, au lancer ». Quintessence p. 220 : Ka du construct + Œuvre − degré de la
# formule ; les MP de l'élément de la formule, autant que son degré, consommées sur une réussite, un
# échec ou une maladresse, conservées sur un critique ; une maladresse fait perdre 1 au Ka du construct.
#   - une composante « Formule (Alchimie) », SOUSTRAITE, qui ne propose que les degrés des formules
#     (`motif`), chacun sous le nom de sa formule (`libelleSur`) ;
#   - `jet.consommation` : l'élément se lit sur la même ligne (`_degree` → `_element`) ;
#   - une suite « Construct abîmé » : −1 au Ka du construct retenu à l'approche.
# L'Œuvre au blanc (deux éléments) reste à la main : la fiche ne porte qu'un élément par formule.
#
# Usage : python -I -X utf8 outils/nephilim-vecus/materiae_au_jet.py <pilote> <sortie>
# À passer après `alchimie_au_jet.py` et `suites_des_critiques.py` (le repasser ne double rien).
import json, sys, os, re, zipfile

entree, sortie = sys.argv[1:3]
ELEMENTS = {'Feu': 'alchemy_materia_fire', 'Air': 'alchemy_materia_air', 'Eau': 'alchemy_materia_water',
            'Terre': 'alchemy_materia_earth', 'Lune': 'alchemy_materia_moon'}
# Sans antislash : un motif qui traverse le shell ou le JSON n'y perd rien.
MOTIF = '^alchemy_formulas_[0-9]+_degree$'

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

sections = {s['id']: s for s in etat['sheetTemplate']['sections']}
for requis in ('alchimie_formules', 'alchimie_constructs', 'arts_alchimie'):
    if requis not in sections:
        sys.exit(f'Section absente : {requis} — passer d’abord alchimie_au_jet.py ?')

# — Le degré de chaque formule porte son nom.
champs = {f['id'] for f in sections['alchimie_formules']['fields']}
nommes = 0
for f in sections['alchimie_formules']['fields']:
    m = re.fullmatch(r'alchemy_formulas_(\d+)_degree', f['id'])
    if m and f'alchemy_formulas_{m.group(1)}_name' in champs:
        f['libelleSur'] = f'alchemy_formulas_{m.group(1)}_name'
        nommes += 1

# — La composante « Formule », retirée de la cible.
jet = etat['gameDriver']['jet']
ajustement = [c for c in jet['cible']['ajustement'] if c['id'] != 'formule']
ajustement.append({'id': 'formule', 'label': 'Formule (Alchimie)', 'sectionId': 'alchimie_formules',
                   'facultative': True, 'soustraire': True, 'motif': MOTIF})
jet['cible']['ajustement'] = ajustement

# — Les Materiae Primae consommées au lancer.
jet['consommation'] = {
    'label': 'Materiae Primae', 'composante': 'formule',
    'elementSur': {'remplacer': '_degree$', 'par': '_element'},
    'champs': ELEMENTS, 'conserveeSur': ['critique'],
}

# — Le construct abîmé par une maladresse : −1 au Ka retenu à l'approche, s'il vient d'un construct.
suites = [s for s in jet.get('suitesDesCritiques', []) if s.get('label') != 'Construct abîmé']
suites.append({'quand': 'maladresse', 'label': 'Construct abîmé', 'sections': ['arts_alchimie'],
               'rappel': 'Le Ka-élément du construct baisse d’un degré (Quintessence p. 220).',
               'ajouter': {'composante': 'approche', 'dansLesSections': ['alchimie_constructs'], 'pas': -1}})
jet['suitesDesCritiques'] = suites

# — La suite d'Alchimie ne dit plus de noter les MP ni le construct à la main : GM-OS s'en charge.
for s in suites:
    if s.get('label') == 'Maladresse d’Alchimie':
        s['rappel'] = ('+1 degré de Khaïba, de forme éthérale si c’est le premier. Rien n’est produit ; '
                       'plus d’essai de cette formule du scénario (errata V1.3, p. 220).')

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{nommes} formules nommées ; composantes :', ', '.join(c['id'] for c in ajustement))
print('Suites :', ' · '.join(s['label'] for s in suites))
