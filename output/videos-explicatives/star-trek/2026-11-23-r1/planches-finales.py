"""Assemble uniquement des captures du MP4 final pour la relecture."""
import json,os,subprocess
from pathlib import Path
r=Path(__file__).resolve().parent;m=r/'montage-r1'
rapport=json.loads((m/'rapport-technique.json').read_text(encoding='utf8'))
assert len(list((m/'controle').glob('*.jpg')))==rapport['cartes']
d=m/'planches';d.mkdir()
subprocess.run([os.environ['GMOS_FFMPEG'],'-nostdin','-v','error','-framerate','1','-i',str(m/'controle/%03d.jpg'),'-vf','crop=iw:ih-668:0:668,tile=2x3:nb_frames=6','-fps_mode','vfr','-q:v','2',str(d/'%02d.jpg')],check=True)
print(json.dumps({'planches':len(list(d.glob('*.jpg'))),'cartes':rapport['cartes']}))
