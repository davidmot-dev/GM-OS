import hashlib
import json
from pathlib import Path

source = Path('C:/Users/david/.codex/plugins/cache/created-by-me-remote/card-extractor/1.1.0/skills/extract-cards/scripts/cards.py')
texte = source.read_text(encoding='utf-8')
ancienne = '        stage.rename(out)'
assert texte.count(ancienne) == 1
nouvelle = '''        # Publication par copie vérifiée : le déplacement de dossier est refusé ici.
        if stage.resolve().parent != out.parent.resolve() or not stage.name.startswith('.cards-'):
            raise ValueError('Dossier temporaire hors du parent de sortie autorisé.')
        shutil.copytree(stage, out)
        for file in stage.rglob('*'):
            if file.is_file() and sha(file) != sha(out / file.relative_to(stage)):
                raise ValueError('Copie de publication différente du rendu temporaire.')
        shutil.rmtree(stage, ignore_errors=True)'''
destination = Path('tmp/cartes-tarot-ombres/cards-windows.py')
destination.write_text(texte.replace(ancienne, nouvelle), encoding='utf-8')
Path('tmp/cartes-tarot-ombres/extracteur.json').write_text(json.dumps({
    'plugin':'Extracteur de cartes 1.1.0',
    'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'script_sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),
    'adaptation':'Publication par copie vérifiée au lieu du déplacement atomique du dossier ; rendu, découpe, numérotation et compression du script original conservés.',
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Copie locale préparée avec publication par copie vérifiée ; plugin installé non modifié.')
