"""GM-OS Studio : vider le texte du PJ fourni, préserver le fond PDF et sa Table des Bonus.

Source identifiée : 274_jour_unpretires.pdf, page PDF 84, Vikas Karunanithi (Ord).
Les libellés et la table sont dans le fond imprimé ; les données du personnage
constituent la couche de texte. Aucune retouche de l'image de fond n'est effectuée.
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
BOOKS = json.loads((ROOT / 'docs/systems/torg/livres.json').read_text(encoding='utf-8'))
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(BOOKS[0]['chemin']).parent / '274_jour_unpretires.pdf'
OUT = ROOT / 'output/fiches/torg'
OUT.mkdir(parents=True, exist_ok=True)
PDFTOPPM = Path('C:/Users/david/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
reader = PdfReader(SOURCE)
page = reader.pages[83]
original_text = page.extract_text()
assert 'Vikas Karunanithi (Ord)' in original_text
# Aucun libellé ou nombre de la Table des Bonus ne doit appartenir à la couche retirée.
assert 'Table des Bonus' not in original_text and 'Compétences de combat' not in original_text
writer = PdfWriter()
writer.add_page(page)
# Conserver les octets des commandes graphiques : remove_text() réécrit leurs
# nombres, ce qui peut déplacer l'anticrénelage du fond de quelques pixels.
# Sur cette page identifiée, seuls les blocs BT...ET portent le personnage.
raw = page.get_contents().get_data()
pattern = rb'(?<![A-Za-z])BT(?=\s).*?(?<![A-Za-z])ET(?=\s|$)'
clean, removed = re.subn(pattern, b'', raw, flags=re.S)
assert removed > 0
stream = DecodedStreamObject()
stream.set_data(clean)
writer.pages[0].replace_contents(stream)
destination = OUT / 'torg-eternity-fiche-pj-vierge.pdf'
with destination.open('wb') as target:
    writer.write(target)
blank = PdfReader(destination)
assert not blank.pages[0].extract_text().strip(), 'Une donnée préremplie subsiste.'
subprocess.run([str(PDFTOPPM), '-f', '84', '-l', '84', '-r', '144', '-singlefile', '-png', str(SOURCE), str(ROOT / 'scratch/torg-fiche/page-source')], check=True)
subprocess.run([str(PDFTOPPM), '-r', '144', '-singlefile', '-png', str(destination), str(OUT / 'torg-eternity-fiche-pj-vierge')], check=True)
original = Image.open(ROOT / 'scratch/torg-fiche/page-source.png').convert('RGB')
vierge = Image.open(OUT / 'torg-eternity-fiche-pj-vierge.png').convert('RGB')
assert original.size == vierge.size == (1224, 1584)
# Toute la bande du bas est identique pixel pour pixel, titre, grille et valeurs compris.
bonus = (0, 1388, 1224, 1584)
region = original.crop(bonus)
assert ImageChops.difference(region, vierge.crop(bonus)).getbbox() is None, 'La Table des Bonus a changé.'
assert ImageChops.difference(original, vierge).getbbox() is not None, 'Les données n’ont pas été retirées.'
report = {'source': SOURCE.name, 'pagePDF': 84, 'formatPoints': [612, 792], 'renduPixels': list(vierge.size),
          'methode': 'Suppression des blocs texte BT/ET du PDF, commandes graphiques inchangées', 'blocsTexteRetires': removed,
          'textePersonnageRestant': 0, 'tableDesBonus': {'bandePixels': list(bonus), 'pixelsModifies': 0,
          'sha256Pixels': hashlib.sha256(region.tobytes()).hexdigest()}, 'pdf': destination.name}
(OUT / 'controle-du-fond.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=True))
