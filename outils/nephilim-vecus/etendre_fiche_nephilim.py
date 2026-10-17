# Étend la fiche GM-OS du pilote Nephilim aux pages 3 à 7 de la fiche HTML (2026-10-17).
# Le reste du pilote ne bouge pas, sauf l'identité visuelle collée en un bloc STYLE/AVOID, remise en deux champs.
# Usage : python -I -X utf8 etendre_fiche_nephilim.py <dépôt> <export> <sortie>
import json, re, sys, os, zipfile, collections

depot, entree, sortie = sys.argv[1:4]
html = open(os.path.join(depot, 'docs/fiches/Nephilim/nephilim-legende-interactive.html'), encoding='utf-8').read()
gabarit = json.loads(re.search(r'<script[^>]*type="application/json"[^>]*>([\s\S]*?)</script>', html).group(1))['template']
correspondance = json.load(open(os.path.join(depot, 'docs/systems/nephilim/fiche/correspondance.json'), encoding='utf-8'))
absents = {a['fiche'] for a in correspondance['absents']}
gm = lambda k: k.replace('.', '_')

cles = collections.OrderedDict()
for p in gabarit['pages']:
    for c in p.get('fields', []):
        k = c['key']
        if k in cles:
            cles[k]['cases'] += 1
        else:
            cles[k] = {'type': c['type'], 'label': c.get('label') or k, 'cases': 1, 'options': c.get('options')}

with zipfile.ZipFile(entree) as z:
    manifeste = json.loads(z.read('manifest.json'))
    etat = json.loads(z.read('state.json'))
pilote, fiche = etat['gameDriver'], etat['sheetTemplate']

# Les champs déjà présents gardent leur définition (libellés, maxima, libelleSur) : on n'ajoute que les manquants.
existants = {f['id']: f for s in fiche['sections'] for f in s['fields']}

NOUVELLES_SECTIONS = [
    ('magie_sorts', 'Magie — sortilèges', ['magic.']),
    ('kabbale_arbre', 'Kabbale — Arbre et ordonnances', ['kabbalah.sephiroth.', 'kabbalah.ordinances', 'kabbalah.world']),
    ('kabbale_invocations', 'Kabbale — invocations', ['kabbalah.invocations.']),
    ('alchimie_constructs', 'Alchimie — constructs et Materiae Primae', ['alchemy.constructs.', 'alchemy.materia.', 'alchemy.path', 'alchemy.works.']),
    ('alchimie_formules', 'Alchimie — formules', ['alchemy.formulas.']),
]
def section_de(k):
    for sid, _, prefixes in NOUVELLES_SECTIONS:
        if any(k == p or k.startswith(p) for p in prefixes):
            return sid
    return None

def champ_gmos(k, info):
    t = info['type']
    base = {'id': gm(k), 'label': info['label']}
    if t == 'hotspot':
        return {**base, 'type': 'gauge' if info['cases'] >= 10 else 'number', 'defaultValue': 0, 'max': info['cases']}
    if t == 'number':
        return {**base, 'type': 'number', 'defaultValue': 0}
    if t == 'checkbox':
        return {**base, 'type': 'checkbox', 'defaultValue': False}
    if t in ('text', 'textarea'):
        return {**base, 'type': t, 'defaultValue': ''}
    if t == 'select':
        options = [o for o in (info['options'] or []) if o != '']
        return {**base, 'type': 'select', 'defaultValue': '', 'options': options}
    raise SystemExit(f'type inattendu {t} pour {k}')

ajouts = collections.OrderedDict((sid, []) for sid, _, _ in NOUVELLES_SECTIONS)
orphelines = []
for k, info in cles.items():
    if k in absents or gm(k) in existants:
        continue
    sid = section_de(k)
    if sid is None:
        orphelines.append(k)
        continue
    ajouts[sid].append(champ_gmos(k, info))
if orphelines:
    raise SystemExit(f'clés sans section : {orphelines}')
for sid, lab, _ in NOUVELLES_SECTIONS:
    if ajouts[sid]:
        fiche['sections'].append({'id': sid, 'label': lab, 'fields': ajouts[sid]})

# L'identité visuelle : un bloc « STYLE: … AVOID: … » collé dans le style se range en deux champs.
iv = pilote.get('identiteVisuelle')
if iv and re.search(r'^\s*STYLE\s*:', iv.get('style', ''), re.I):
    m = re.match(r'^\s*STYLE\s*:\s*(.*?)(?:\s*\n\s*AVOID\s*:\s*(.*))?\s*$', iv['style'], re.S | re.I)
    iv['style'] = m.group(1).strip()
    if m.group(2) and not (iv.get('aEviter') or '').strip():
        iv['aEviter'] = m.group(2).strip()

etat['gameDriver'], etat['sheetTemplate'] = pilote, fiche
os.makedirs(os.path.dirname(sortie), exist_ok=True)
with zipfile.ZipFile(sortie, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('manifest.json', json.dumps(manifeste, ensure_ascii=False, indent=2))
    z.writestr('state.json', json.dumps(etat, ensure_ascii=False, indent=2))
json.dump(etat, open(os.path.join(os.path.dirname(sortie), 'nephilim_state.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

total = sum(len(s['fields']) for s in fiche['sections'])
print('ajoutés :', {sid: len(v) for sid, v in ajouts.items()}, '| champs de la fiche :', total)
print('identité :', {k: (v if k != 'references' else f'{len(v)} image(s)') for k, v in (iv or {}).items()})
