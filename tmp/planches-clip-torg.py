import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('output/clips/torg')
controle = json.loads((root / 'controle-video.json').read_text(encoding='utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 17)
series = {
    'film': [(f['image'], f"{f['image']} - {f['secondes']:.2f} s") for f in controle['imagesExtraites']],
    'scenes': [(f.name, f.name) for f in sorted(root.glob('[0-9][0-9]-*.jpg'))],
}
for genre, fichiers in series.items():
    for debut in range(0, len(fichiers), 12):
        groupe = fichiers[debut:debut + 12]
        lignes = (len(groupe) + 2) // 3
        planche = Image.new('RGB', (1440, lignes * 326), '#14242e')
        dessin = ImageDraw.Draw(planche)
        for i, (nom, label) in enumerate(groupe):
            image = Image.open(root / nom).convert('RGB')
            image.thumbnail((480, 300))
            x, y = (i % 3) * 480, (i // 3) * 326
            planche.paste(image, (x, y))
            dessin.text((x + 8, y + 302), label, fill='white', font=font)
        planche.save(root / f'planche-{genre}-{debut // 12 + 1:02}.jpg', quality=91)
