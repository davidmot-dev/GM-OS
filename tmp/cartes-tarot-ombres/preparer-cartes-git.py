import hashlib
import json
import zipfile
from pathlib import Path

out=Path('output/cartes/les-lames-du-cardinal/tarot-des-ombres')
script=out/'reproduction/cards.py'
script.write_bytes(script.read_bytes().rstrip(b'\r\n')+b'\n')
rapportPath=out/'controle-qualite.json'
rapport=json.loads(rapportPath.read_text(encoding='utf-8'))
rapport['scriptPublication']['script_rejoue_sha256']=rapport['scriptPublication']['script_sha256']
rapport['scriptPublication']['script_sha256']=hashlib.sha256(script.read_bytes()).hexdigest()
rapport['scriptPublication']['normalisationLivraison']='Suppression de la ligne vide supplémentaire en fin du script pour git diff --check ; aucune instruction modifiée.'
rapportPath.write_text(json.dumps(rapport,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
archive=out.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for p in sorted(out.rglob('*')):
        if p.is_file():
            info=zipfile.ZipInfo(p.relative_to(out).as_posix(),date_time=(2026,11,2,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,p.read_bytes())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None and len(z.namelist())==88
    manifest=json.loads(z.read('manifest.json'))
    for c in manifest['cards']:
        if c['output']:
            assert hashlib.sha256(z.read(c['output'])).hexdigest()==c['sha256']
note=Path('documentation/Planning/2026-11-02-etat-et-reprise-codex-tarot-des-ombres.md')
contenu=note.read_text(encoding='utf-8').replace('39 149 700',f'{archive.stat().st_size:,}'.replace(',',' ')).replace('052a59b461cba122d6f892d712c81bb5292b9ecd566e34378c864feafc3ae795',hashlib.sha256(archive.read_bytes()).hexdigest())
note.write_text(contenu,encoding='utf-8')
print(json.dumps({'octets':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'cartesVerifiees':79}))
