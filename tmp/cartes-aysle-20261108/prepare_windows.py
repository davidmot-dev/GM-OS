import hashlib
import json
from pathlib import Path

root = Path(__file__).parent
original = Path(r'C:\Users\david\.codex\plugins\cache\created-by-me-remote\card-extractor\1.1.0\skills\extract-cards\scripts\cards.py')
adapted = root.parent / 'cartes-tarot-ombres/cards-windows.py'
before = original.read_text(encoding='utf-8')
after = adapted.read_text(encoding='utf-8')
head, tail = before.split('        stage.rename(out)')
assert after.startswith(head) and after.endswith(tail)
assert 'shutil.copytree(stage, out)' in after
assert 'sha(file) != sha(out / file.relative_to(stage))' in after
(root / 'cards-windows.py').write_bytes(adapted.read_bytes())
metadata = {'original_sha256': hashlib.sha256(original.read_bytes()).hexdigest(),
    'adapted_sha256':hashlib.sha256(adapted.read_bytes()).hexdigest(),
    'adaptation':'Only stage.rename(out) replaced by copytree with SHA-256 equality checks. Render, geometry, rotation, numbering and JPEG encoding unchanged.'}
(root / 'extractor.json').write_text(json.dumps(metadata, indent=2)+'\n', encoding='utf-8')
print(json.dumps(metadata))
