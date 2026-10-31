"""Rendus et géométrie du seul PDF PJ fourni ; aucune installation ou connexion réseau."""
from pathlib import Path
import json
import os
import subprocess
import pdfplumber

source = Path('docs/Reference/Shadowrun Anarchy/sran2_01anarchyv2_PJ.pdf')
sortie = Path('output/fiches/shadowrun-anarchy/source')
sortie.mkdir(parents=True, exist_ok=True)
with pdfplumber.open(source) as pdf:
    if len(pdf.pages) != 1:
        raise ValueError('Cette recette vise la seule page de la fiche Anarchy 2.0 fournie.')
    page = pdf.pages[0]
    geometrie = [{'page': 1, 'width': page.width, 'height': page.height,
                  'lines': page.lines, 'curves': page.curves}]
(sortie / 'geometrie.json').write_text(json.dumps(geometrie, ensure_ascii=False, indent=2), encoding='utf8')
poppler = os.environ.get('GMOS_PDFTOPPM',
    'C:/Users/david/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
subprocess.run([poppler, '-r', '144', '-png', str(source), str(sortie / 'page')], check=True)
print('Source PJ : une page rendue à 144 dpi, géométrie native conservée.')
