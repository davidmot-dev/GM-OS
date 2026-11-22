from pathlib import Path
import base64
import hashlib
import json
import re
from PIL import Image, ImageOps, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
out = root / 'output/studio/penombre/2026-11-22'
theme = root / 'docs/systems/penombre/theme'
source = out / 'banniere-generee.png'
im = Image.open(source).convert('RGB')
assert im.size == (2172, 724)
h = im.width // 4
top = (im.height - h) // 2
crop = im.crop((0, top, im.width, top + h))
# Accord explicite de David le 22/11/2026 : 10,5 % d'agrandissement, sans
# prétendre qu'un rééchantillonnage ajoute des détails à l'illustration.
banner = crop.resize((2400, 600), Image.Resampling.LANCZOS)
destination = root / 'docs/systems/penombre/Penombre Band.jpg'
banner.save(destination, quality=92, optimize=True, progressive=True)
assert destination.stat().st_size <= 500000
assert Image.open(destination).size == (2400, 600)

def font(size, serif=False):
    return ImageFont.truetype('C:/Windows/Fonts/'+('georgia.ttf' if serif else 'segoeui.ttf'),size)

preview = Image.new('RGB',(1220,500),'#e9e1cf')
draw=ImageDraw.Draw(preview)
draw.text((16,8),'Bannière complète et simulations d’en-tête — pas une capture de GM-OS',font=font(16),fill='#263733')
preview.paste(banner.resize((1188,297),Image.Resampling.LANCZOS),(16,38))
for width,y in [(1188,365),(390,435)]:
    header=ImageOps.fit(banner,(width,54),Image.Resampling.LANCZOS,centering=(.5,.5)).convert('RGBA')
    header=Image.alpha_composite(header,Image.new('RGBA',header.size,(10,20,18,65)))
    d=ImageDraw.Draw(header)
    d.text((13,13),'PÉNOMBRE',font=font(22 if width>500 else 18,True),fill='#eee4cd')
    for x,s in ([(width-240,'Trame'),(width-163,'Fiches'),(width-85,'Cartes')] if width>500 else [(width-99,'PJ'),(width-52,'MJ')]):
        d.rounded_rectangle((x,11,x+(66 if width>500 else 38),42),radius=2,fill='#253736',outline='#b6a17a')
        d.text((x+9,18),s,font=font(12),fill='#eee4cd')
    preview.paste(header.convert('RGB'),(16,y))
preview.save(out/'apercu-banniere.png')

css=(theme/'theme.css').read_text(encoding='utf-8')
# La maquette locale utilise le repli Georgia, sans appeler Google Fonts.
css=re.sub(r'@import[^;]+;','',css)
for name in ['velin.svg']:
    data='data:image/svg+xml;base64,'+base64.b64encode((theme/'matieres'/name).read_bytes()).decode()
    css=css.replace('matieres/'+name,data)

def image_data(p):
    return 'data:image/svg+xml;base64,'+base64.b64encode(p.read_bytes()).decode()

icons=json.loads((theme/'icones.json').read_text())
icon_html=''.join('<figure>'+ (theme/file).read_text() +f'<figcaption>{name}</figcaption></figure>' for name,file in icons.items())
orn=json.loads((theme/'ornements.json').read_text())
corner=(theme/orn['coin']).read_text().replace('<svg ','<svg class="coin" ',1)
sep=(theme/orn['separateur']).read_text().replace('<svg ','<svg class="sep" ',1)
fond=(theme/orn['fond']).read_text().replace('<svg ','<svg class="fond" ',1)
banner_url=destination.as_uri()
html=f'''<!doctype html><html lang="fr" data-theme="penombre"><meta charset="utf-8"><title>Contrôle du thème Pénombre</title><style>{css}
*{{box-sizing:border-box}}body{{margin:0;background:var(--rpg-bg);color:var(--rpg-text);font:16px Georgia,serif}}.label{{padding:12px 20px;background:#fff;color:#253736;font:13px Arial,sans-serif}}header{{height:74px;background:linear-gradient(#11252255,#11252255),url("{banner_url}") center/cover;color:var(--rpg-frame-text);padding:17px 28px;font:30px Georgia,serif}}.layout{{display:grid;grid-template-columns:190px 1fr;min-height:780px}}aside{{background:var(--rpg-frame-bg);color:var(--rpg-frame-text);padding:24px 20px;line-height:2.5}}aside b{{display:block;color:var(--rpg-frame-accent)}}main{{padding:28px;position:relative}}main:before{{content:"";position:absolute;inset:0;background:var(--rpg-texture-bg);opacity:var(--rpg-texture-opacity);pointer-events:none}}h1{{font:32px Georgia,serif;margin:0 0 7px}}.muted{{color:var(--rpg-muted)}}.panels{{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:25px}}section{{position:relative;background:var(--rpg-surface);border:1px solid var(--rpg-border);border-radius:var(--rpg-radius-lg);box-shadow:var(--rpg-elevation-1);padding:24px;min-height:180px}}h2{{font-size:24px;margin:0 0 15px}}button{{border:1px solid var(--rpg-accent);background:var(--rpg-accent);color:var(--rpg-accent-contrast);padding:9px 17px;border-radius:var(--rpg-radius-md);font:16px Georgia,serif}}input{{background:var(--rpg-surface-2);border:1px solid var(--rpg-border);color:var(--rpg-text);padding:9px;max-width:100%;font:15px Georgia,serif}}.coin{{position:absolute;left:3px;top:3px;width:28px;height:28px;color:var(--rpg-accent)}}.sep{{display:block;width:240px;height:16px;color:var(--rpg-accent);margin:15px auto}}.fond{{position:absolute;width:100px;height:100px;right:30px;bottom:15px;color:var(--rpg-accent);opacity:.15;pointer-events:none}}.states{{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}}.states span{{padding:5px 10px;border:1px solid currentColor}}.icons{{display:flex;flex-wrap:wrap;gap:12px;position:relative}}figure{{margin:0;text-align:center;width:75px}}figure svg{{width:24px;height:24px}}figcaption{{font:11px Arial,sans-serif;margin-top:5px}}.tiny svg{{width:16px;height:16px}}footer{{padding:15px 0;color:var(--rpg-muted);font-size:13px}}
</style><div class="label">MAQUETTE DE CONTRÔLE — aucun écran GM-OS exécuté ; police de repli Georgia, hors ligne.</div><header>Pénombre</header><div class="layout"><aside><b>Le cahier gris</b>Session<br>Trame<br>Atlas<br>Personnages<br>Journal<br>Musique</aside><main><h1>Sous les branches du Souffre-jour</h1><div class="muted">Vélin, encre et matières mates — palette issue des références fournies.</div><div class="panels"><section>{corner}<h2>La prochaine rencontre</h2><p>Une carte, une note, un visage : le texte reste lisible sur le fond et les panneaux.</p><button>Préparer la scène</button></section><section>{corner}{fond}<h2>Le cahier de l’agent</h2><label>Nom<br><input value="Éminence grise" readonly></label><p class="muted">Une légende secondaire, sans halo.</p></section></div>{sep}<div class="states"><span style="color:var(--rpg-success)">Réussite</span><span style="color:var(--rpg-danger)">Danger</span><span style="color:var(--rpg-warning)">Alerte</span><span style="color:var(--rpg-info)">Information</span></div><h2>Quinze icônes originales — 24 px puis 16 px</h2><div class="icons">{icon_html}</div><hr><div class="icons tiny">{icon_html}</div><footer>Le thème ne modifie ni les règles, ni la mise en page des modules, ni la fiche PDF.</footer></main></div></html>'''
(out/'apercu-theme.html').write_text(html,encoding='utf-8')
(out/'verification-banniere.json').write_text(json.dumps({
    'date':'2026-11-22','sourceDimensions':list(im.size),'recadrage':[0,top,im.width,top+h],
    'dimensions':[2400,600],'octets':destination.stat().st_size,'ratio':4,
    'agrandissement':2400/2172,'accordDavid':'22/11/2026 : Oui, livrer en 2400 × 600 px',
    'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),
    'simulationEntete':[[1188,54],[390,54]],'captureGMOS':False,
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'banner':str(destination),'dimensions':[2400,600],'octets':destination.stat().st_size}))
