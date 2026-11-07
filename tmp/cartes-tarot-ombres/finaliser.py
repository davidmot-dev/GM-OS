import hashlib
import json
import shutil
import zipfile
from pathlib import Path

temp = Path('tmp/cartes-tarot-ombres')
out = Path('output/cartes/les-lames-du-cardinal/tarot-des-ombres')
rejeu = temp / 'rejeu'
manifest = json.loads((out / 'manifest.json').read_text(encoding='utf-8'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
cartes = [c for c in manifest['cards'] if c['output']]
assert len(cartes) == 79
for carte in cartes:
    assert sha(out / carte['output']) == sha(rejeu / carte['output']) == carte['sha256']
assert (out / 'recipe.json').read_bytes() == (rejeu / 'recipe.json').read_bytes()
rapport = json.loads((temp / 'controles.json').read_text(encoding='utf-8'))
rapport.update({
    'date': '2026-11-02',
    'controleVisuelTermine': True,
    'controleVisuel': {
        'pagesSource': 14,
        'apercusFinaux': 3,
        'facesRevuesEnGrandSurPlanchesDeSix': 78,
        'dosRevuEnGrand': True,
        'cadresTextesEtOrientation': 'Conformes ; aucun morceau de carte voisine observé.',
        'numerosInversesAuPiedDesMineures': 'Présents dans la source et conservés volontairement.'
    },
    'rejeu': {'JPEG_identiques_SHA256': 79, 'recetteIdentique': True},
    'versions': {'PyMuPDF': manifest['pymupdf_version'], 'Pillow': manifest['pillow_version']},
    'sourceSHA256': manifest['sources'][0]['sha256'],
    'agrandissementArtificiel': False
})
(out / 'controle-qualite.json').write_text(json.dumps(rapport, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
repro = out / 'reproduction'
repro.mkdir(exist_ok=True)
shutil.copyfile(temp / 'cards-windows.py', repro / 'cards.py')
assert sha(repro / 'cards.py') == rapport['scriptPublication']['script_sha256']
(repro / 'requirements.txt').write_text('PyMuPDF==2.0\nPillow==12.1.1\n', encoding='utf-8')
(out / 'README.md').write_text('''# Tarot des Ombres — Les Lames du Cardinal

Extraction réalisée le 2 novembre 2026 avec le plugin Extracteur de cartes 1.1.0.

- `tarot-des-ombres/1.jpg` à `78.jpg` : les 78 faces, sans trou, dans l'ordre du PDF.
- `tarot-des-ombres/back.jpg` : le dos commun de la première page.
- `preview-01.jpg` à `preview-03.jpg` : aperçus des 79 images livrées.
- `recipe.json` : régions, rôles, orientations et départ à 1 choisi par David.
- `manifest.json` : correspondance page/région/fichier, dimensions et SHA-256.
- `controle-qualite.json` : contrôles automatiques, revue visuelle et rejeu.
- `reproduction/` : script utilisé et versions des dépendances.

Les 14 pages comportent six cartes chacune. Les six dos identiques de la page 1
sont représentés par un seul `back.jpg` ; les cinq répétitions sont documentées.
Les pages 2 à 14 fournissent 78 faces. L'ordre est : pages croissantes, ligne du
haut de gauche à droite, puis ligne du bas de gauche à droite. Les noms de fichiers
ne remplacent pas les valeurs imprimées : `1.jpg` porte ainsi la lame imprimée 0.

Les cartes sont entières, bordures, textes et illustrations compris. Les marges
blanches extérieures des planches sont exclues. Les chiffres inversés au pied des
cartes mineures appartiennent au graphisme original et sont conservés.

Rendu PDF à 300 dpi, JPEG RGB, qualité 95, sous-échantillonnage 4:4:4. Dimensions :
709 × 1334 ou 709 × 1335 pixels, selon l'arrondi de rasterisation. Aucun
agrandissement artificiel ni retouche des illustrations. Le PDF source est préservé
et n'est pas inclus dans cette archive.

## Reproduire l'extraction

Dans un environnement Python disposant des versions de `reproduction/requirements.txt`,
exécuter depuis ce dossier (remplacer le chemin du PDF et choisir une sortie inexistante) :

```powershell
python reproduction/cards.py extract recipe.json --source s0 "CHEMIN_DU_PDF_ORIGINAL.pdf" --out "cartes-rejouees"
```

Le script contrôle l'empreinte SHA-256 du PDF avant le rendu. Les versions utilisées
sont PyMuPDF 2.0 et Pillow 12.1.1. Un second export a reproduit les 79 JPEG à
l'octet près, vérification SHA-256 effectuée.

Sur ce poste Windows, le déplacement atomique du dossier temporaire était refusé.
La copie locale du script publiée ici remplace uniquement cette étape par une
copie dont chaque fichier est vérifié par SHA-256 ; le rendu, les découpes, la
numérotation et la compression sont ceux du script du plugin. Les empreintes des
deux scripts figurent dans `controle-qualite.json`. Le plugin installé est inchangé.
''', encoding='utf-8')

archive = out.with_suffix('.zip')
fichiers = sorted(p for p in out.rglob('*') if p.is_file())
assert all(p.suffix.lower() in {'.jpg','.json','.md','.py','.txt'} for p in fichiers)
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for p in fichiers:
        info = zipfile.ZipInfo(p.relative_to(out).as_posix(), date_time=(2026,11,2,0,0,0))
        info.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(info, p.read_bytes())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist()) == {p.relative_to(out).as_posix() for p in fichiers}
    for carte in cartes:
        assert hashlib.sha256(z.read(carte['output'])).hexdigest() == carte['sha256']
    assert len([n for n in z.namelist() if n.startswith('tarot-des-ombres/') and n.endswith('.jpg')]) == 79
resultat = {'archive':str(archive),'octets':archive.stat().st_size,'sha256':sha(archive),'fichiers':len(fichiers),'faces':78,'dos':1,'rejeuJPEGidentiques':79,'integriteZIP':'OK'}
(temp / 'livraison.json').write_text(json.dumps(resultat,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(resultat,ensure_ascii=False))
