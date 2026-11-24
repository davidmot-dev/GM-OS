"""Planches de contrôle des résultats extraits du MP4 final."""
import json,os,subprocess,shutil
from pathlib import Path
r=Path(__file__).resolve().parent;m=r/'montage-r1'
j=json.loads((m/'gestes-finaux/releve.json').read_text(encoding='utf8'))
v=m/'vignettes-gestes';v.mkdir();p=m/'planches-gestes';p.mkdir()
for i,s in enumerate(j,1):shutil.copyfile(s['image'],v/f'{i:03}.jpg')
subprocess.run([os.environ['GMOS_FFMPEG'],'-nostdin','-v','error','-framerate','1','-start_number','1','-i',str(v/'%03d.jpg'),'-vf','scale=720:-2,tile=2x2:nb_frames=4','-fps_mode','vfr','-q:v','2',str(p/'%02d.jpg')],check=True)
print(json.dumps({'planchesGestes':len(list(p.glob('*.jpg'))),'resultats':len(j)}))
