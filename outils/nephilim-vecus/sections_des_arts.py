# Les Arts occultes au menu du jet de Nephilim (2026-10-18).
# Un sort de Magie ou une invocation de Kabbale se lance comme un Vécu : (Art + Ka de l'élément) × 10,
# le degré du sort retiré au curseur des circonstances. On découpe donc « Sciences occultes » en trois
# sections d'Arts, que la composante « Vécu » propose en sous-groupes (`sectionsSupplementaires`), et
# une section des voies, en texte, qui n'entre pas dans le menu. Les clés ne changent pas : la
# correspondance avec la fiche HTML est intacte.
# Usage : python -I -X utf8 outils/nephilim-vecus/sections_des_arts.py <export> <sortie>
import json, sys, os, zipfile

entree, sortie = sys.argv[1:3]
SOURCE = 'sciences_occultes'

# Les voies gardent l'identifiant de la section d'origine : ce sont elles qui restent « Sciences occultes ».
DECOUPE = [
    (SOURCE, 'Sciences occultes — voies', ['occult_magic_path', 'occult_kabbalah_world', 'occult_alchemy_path']),
    ('arts_magie', 'Magie — cercles', ['occult_magic_first', 'occult_magic_second', 'occult_magic_third', 'occult_magic_third_name']),
    # L'ordre de la fiche d'origine, qui suit la fiche HTML.
    ('arts_kabbale', 'Kabbale — Sephiroth', [
        'occult_kabbalah_third_center', 'occult_kabbalah_third_left', 'occult_kabbalah_third_right',
        'occult_kabbalah_geburah', 'occult_kabbalah_chesed', 'occult_kabbalah_tiphereth',
        'occult_kabbalah_hod', 'occult_kabbalah_netzach', 'occult_kabbalah_yesod', 'occult_kabbalah_malkuth',
        'occult_kabbalah_third_center_name', 'occult_kabbalah_third_left_name', 'occult_kabbalah_third_right_name',
    ]),
    ('arts_alchimie', 'Alchimie — Œuvres', ['occult_alchemy_black', 'occult_alchemy_white', 'occult_alchemy_red', 'occult_alchemy_red_name']),
]
# Le degré prend son nom sur le champ qui le nomme : le menu affiche « Nom (degré) » et cache le nom seul.
NOMS = {
    'occult_magic_third': 'occult_magic_third_name',
    'occult_kabbalah_third_left': 'occult_kabbalah_third_left_name',
    'occult_kabbalah_third_center': 'occult_kabbalah_third_center_name',
    'occult_kabbalah_third_right': 'occult_kabbalah_third_right_name',
    'occult_alchemy_red': 'occult_alchemy_red_name',
}
ARTS = [s for s, _, _ in DECOUPE if s != SOURCE]

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))

sections = etat['sheetTemplate']['sections']
ids = [s['id'] for s in sections]
if any(a in ids for a in ARTS):
    sys.exit('Déjà découpée : rien à faire.')
if SOURCE not in ids:
    sys.exit(f'Section absente : {SOURCE}')

origine = sections[ids.index(SOURCE)]
champs = {f['id']: f for f in origine['fields']}
attendus = [c for _, _, liste in DECOUPE for c in liste]
manquants = [c for c in attendus if c not in champs]
orphelins = [c for c in champs if c not in attendus]
if manquants or orphelins:
    sys.exit(f'La section a changé — manquants : {manquants} ; non rangés : {orphelins}')

for degre, nom in NOMS.items():
    champs[degre]['libelleSur'] = nom

nouvelles = [{**{k: v for k, v in origine.items() if k != 'fields'}, 'id': sid, 'label': label,
              'fields': [champs[c] for c in liste]} for sid, label, liste in DECOUPE]
i = ids.index(SOURCE)
sections[i:i + 1] = nouvelles

vecu = etat['gameDriver']['jet']['cible']['caracteristique']
vecu['label'] = 'Vécu ou Art occulte'
vecu['sectionsSupplementaires'] = ARTS

os.makedirs(os.path.dirname(sortie) or '.', exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie) or '.', 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(' · '.join(f"{s['id']} ({len(s['fields'])})" for s in nouvelles))
print('Composante :', json.dumps(vecu, ensure_ascii=False))
