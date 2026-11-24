"""Extrait le résultat des 38 gestes directement du MP4 livré, en pleine résolution."""
import json, os, subprocess
from pathlib import Path
r = Path(__file__).resolve().parent
m = r/'montage-r1'
prises = json.loads((r/'prises-r2/prises.json').read_text(encoding='utf-8'))
rapport = json.loads((m/'rapport-technique.json').read_text(encoding='utf-8'))
d = m/'gestes-finaux'
d.mkdir()
cur = 0
preuves = []
for i, (s, segment) in enumerate(zip(prises['sequences'], rapport['segments'])):
    assert s['id'] == segment['id']
    apres = s['affichagesApres'][0]
    t = (cur+(apres['debutMs']+apres['finMs'])/2-s['debutMs'])/1000
    f = d/f'{i+1:02}-{s["id"]}.jpg'
    subprocess.run([os.environ['GMOS_FFMPEG'], '-nostdin', '-v', 'error', '-ss', str(t), '-i', str(m/'video.mp4'), '-frames:v', '1', str(f)], check=True)
    preuves.append({'sequence': s['id'], 'secondes': t, 'image': str(f)})
    cur += segment['dureeMs']
(d/'releve.json').write_text(json.dumps(preuves, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'preuves': len(preuves), 'source': str(m/'video.mp4')}))
