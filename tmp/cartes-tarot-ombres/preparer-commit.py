import difflib
import subprocess
from pathlib import Path

path = 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md'
avant = subprocess.run(['git','show',f'HEAD:{path}'],check=True,capture_output=True).stdout.decode('utf-8')
actuel = Path(path).read_text(encoding='utf-8')
paragraphes = [p for p in actuel.split('\n\n') if p.startswith('**Format des futures campagnes d’essais — décision du 01/11/2026.**')]
assert len(paragraphes)==1 and paragraphes[0] not in avant
repere = '**Priorités transversales réévaluées le 01/11 (les quatre nouveaux pilotes).**'
assert avant.count(repere)==1
apres = avant.replace(repere,paragraphes[0]+'\n\n'+repere)
patch = ''.join(difflib.unified_diff(avant.splitlines(keepends=True),apres.splitlines(keepends=True),fromfile='a/'+path,tofile='b/'+path))
Path('tmp/cartes-tarot-ombres/synthese-plugin.patch').write_text(patch,encoding='utf-8',newline='\n')
Path('tmp/cartes-tarot-ombres/commit-plugin.txt').write_text('''feat(recette): generaliser les campagnes completes dans un seul fichier

À la demande de David, les futures campagnes d'essais suivent une intrigue
complète et intègrent les ateliers de recette dans la même campagne .gmos.
Synchronise le plugin privé 0.2.0, les références et la procédure locale.
Les anciens lots restent inchangés ; restauration locale documentée.

Vérifications : 12 tests Python, paquet de 13 fichiers reconstruit et vérifié.

Co-Authored-By: Codex <noreply@openai.com>
''',encoding='utf-8')
Path('tmp/cartes-tarot-ombres/commit-cartes.txt').write_text('''feat(cartes): extraire le Tarot des Ombres des Lames du Cardinal

À la demande de David, extrait 78 faces numérotées de 1 à 78 et un dos
commun back.jpg depuis le PDF fourni, en JPEG RGB à 300 dpi.
Inclut le ZIP, les aperçus, la recette, le manifeste et le script de reproduction.
Le PDF source et l'environnement temporaire restent hors du dépôt.

Vérifications : revue visuelle des 79 images, intégrité du ZIP et second
export identique à l'octet près pour chaque JPEG (SHA-256).

Co-Authored-By: Codex <noreply@openai.com>
''',encoding='utf-8')
print(patch)
