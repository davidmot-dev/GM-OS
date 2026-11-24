"""Détecte chaque mire séparément ; la validation visuelle reste une étape distincte."""
import json, os, subprocess, sys
from pathlib import Path

racine = Path(__file__).resolve().parent
prise = racine / sys.argv[1]
p = json.loads((prise / 'prises-a-caler.json').read_text(encoding='utf-8'))
assert p['modeRapide'] is False
sources = sorted({s['source'] for s in p['sequences']})
assert len(sources) == 1, sources
ff = os.environ['GMOS_FFMPEG']
sortie = prise / 'calage'
sortie.mkdir(exist_ok=True)

def run(args):
    return subprocess.run([ff, '-nostdin', '-v', 'error', *map(str, args)], check=True, capture_output=True).stdout

releves = []
offsets = {}
for numero, source in enumerate(sources):
    pixels = run(['-i', source, '-t', '90', '-vf', 'crop=8:8:100:100,scale=1:1,fps=25', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
    cible = (35, 56, 63)
    groupes, debut = [], None
    for i in range(len(pixels) // 3):
        bon = all(abs(pixels[i*3+j] - cible[j]) <= 10 for j in range(3))
        if bon and debut is None:
            debut = i
        if debut is not None and (not bon or i == len(pixels)//3 - 1):
            if i - debut >= 40:
                groupes.append((debut, i))
            debut = None
    assert len(groupes) == 1, (source, groupes)
    offset = groupes[0][0] * 40
    offsets[source] = offset
    run(['-ss', (offset+700)/1000, '-i', source, '-frames:v', '1', sortie / f'mire-{numero}.jpg'])
    releves.append({'source': source, 'mireImages': groupes, 'decalageMs': offset, 'resolutionMs': 40, 'toleranceRGB': 10, 'zonePx': '8x8@100,100'})

preuves = []
for i, s in enumerate(p['sequences']):
    s['decalageMs'] = offsets[s['source']]
    temps = (s['decalageMs'] + s['finActionMs'] + 1100) / 1000
    dest = sortie / f'{i+1:02}-{s["id"]}.jpg'
    run(['-ss', temps, '-i', s['source'], '-frames:v', '1', dest])
    preuves.append({'sequence': s['id'], 'source': s['source'], 'secondes': temps, 'image': str(dest), 'observation': s['observation']})

p['decalageMs'] = None
p['note'] = 'Une mire détectée à 25 images/s. Contrôle visuel requis pour chaque source avant calageVerifie.'
(prise / 'prises-candidat.json').write_text(json.dumps(p, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
(sortie / 'releve.json').write_text(json.dumps({'sources': releves, 'preuves': preuves, 'controleVisuelExecute': False}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'decalages': releves, 'preuves': len(preuves)}, ensure_ascii=False))
