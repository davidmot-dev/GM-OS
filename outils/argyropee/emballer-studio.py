"""Archive des seuls livrables d’atelier ; aucun livre ni pilote existant embarqué."""
from pathlib import Path
import hashlib,json,zipfile

root=Path(__file__).resolve().parents[2]
out=root/'output/gmos-studio/argyropee'
system=root/'docs/systems/argyropee'
sheet=root/'docs/fiches/Argyropée/argyropee-fiche-interactive.html'
report=json.loads((out/'controles/verification.json').read_text(encoding='utf-8'))
assert report['capturesExaminees'] is True
assert report['htmlSHA256']==hashlib.sha256(sheet.read_bytes()).hexdigest()
sources=[]
for f in sorted((root/'docs/Reference/Argyropée').iterdir()):
    if f.is_file():sources.append(dict(fichier=f.name,octets=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
(out/'sources.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files=[sheet,system/'Argyropée Band.jpg',*sorted((system/'theme').rglob('*')),*sorted((system/'index').glob('*.md')),
       *[out/n for n in ['LIRE-MOI.md','identite-visuelle.txt','prompt-banniere.txt','cles-du-modele.json','sources.json']],
       *sorted((out/'controles').glob('*'))]
files=[f for f in files if f.is_file()]
manifest=[dict(fichier=f.relative_to(root).as_posix(),octets=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()) for f in files]
(out/'fichiers-livres.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
files.append(out/'fichiers-livres.json')
with zipfile.ZipFile(out/'Argyropee-theme.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in sorted((system/'theme').rglob('*')):
        if f.is_file():z.write(f,'theme/'+f.relative_to(system/'theme').as_posix())
with zipfile.ZipFile(out/'Argyropee-GM-OS-Studio.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in files:z.write(f,f.relative_to(root).as_posix())
    z.write(out/'LIRE-MOI.md','LIRE-MOI.md')
for name in ['Argyropee-theme.zip','Argyropee-GM-OS-Studio.zip']:
    file=out/name
    with zipfile.ZipFile(file) as z:assert z.testzip() is None;count=len(z.namelist())
    print(json.dumps(dict(fichier=name,octets=file.stat().st_size,entrees=count,sha256=hashlib.sha256(file.read_bytes()).hexdigest())))
