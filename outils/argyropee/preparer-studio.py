"""Préparation GM-OS Studio, références de David du 08/11/2026. Aucun PDF recopié."""
from pathlib import Path
import base64, json, re, io
import pypdfium2 as pdfium

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'docs/Reference/Argyropée'
SYS=ROOT/'docs/systems/argyropee'
OUT=ROOT/'output/gmos-studio/argyropee'
OUT.mkdir(parents=True,exist_ok=True)

def write(path,text):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(text,encoding='utf-8')

def lines(glob):
    doc=pdfium.PdfDocument(str(next(SRC.glob(glob))))
    return [[x.strip().replace('\xad','-') for x in doc[i].get_textpage().get_text_range().splitlines() if x.strip()] for i in range(len(doc))]

toc=[]
for page in lines('*_TOC.pdf'):
    i=0
    while i<len(page):
        line=page[i];i+=1
        if line.startswith('David Mot') or line=='TABLE DES MATIÈRES':continue
        if line=='L’ÉQUIPEMENT ET LES':line+=' '+page[i];i+=1
        line=re.sub(r'\.{2,}\s*',' — ',line)
        toc.append(line)
write(SYS/'index/livre-de-base-2-table-des-matieres-flat.md','# Table des matières — Argyropée : Règles & Bestiaire\n\n'+'\n'.join('- '+x for x in toc)+'\n')

index=[]
for page in lines('*_index.pdf'):
    for line in page:
        if line=='INDEX' or line.startswith(('David Mot','Imprimé à','sur du papier','* voir')) or line=='2023':continue
        match=re.match(r'^(.*?)[ ]?(\d+(?:[-,]\d+)*)$',line)
        if match:line=match[1].rstrip()+' — '+match[2]
        index.append(line.replace('*',r'\*'))
write(SYS/'index/livre-de-base-2-index-flat.md','# Index — Argyropée : Règles & Bestiaire\n\n'+'\n'.join('- '+x for x in index)+'\n\n\\* voir « Univers & Secrets »\n')

identity='STYLE: traditional black ink book illustration, expressive pen strokes, dense crosshatching, bold black masses, crisp white paper, hand-drawn irregular contours, fine engraved details, restrained monochrome palette, directional shadows, lively slightly theatrical drawing, early modern European print sensibility\nAVOID: photorealism, 3D rendering, smooth digital painting, neon colors, manga, readable text, glossy surfaces\n'
write(OUT/'identite-visuelle.txt',identity)

theme='''/* Argyropée — papier, encre et argent ; contrat GM-OS v1.7. */
:root[data-theme="argyropee"] {
  color-scheme: light;
  --rpg-bg: #e7e5df;
  --rpg-surface: #f8f7f2;
  --rpg-surface-2: #eeece6;
  --rpg-text: #20201e;
  --rpg-muted: #5d5b55;
  --rpg-accent: #25251f;
  --rpg-accent-contrast: #ffffff;
  --rpg-border: #7c7a73;
  --rpg-border-soft: rgba(68, 65, 58, 0.22);
  --rpg-success: #30633e;
  --rpg-danger: #9c3034;
  --rpg-warning: #80570c;
  --rpg-info: #305c80;
  --rpg-font-display: Georgia, "Times New Roman", serif;
  --rpg-font-body: Georgia, "Times New Roman", serif;
  --rpg-font-mono: "Courier New", monospace;
  --rpg-title-tracking: 0.025em;
  --rpg-kicker-tracking: 0.08em;
  --rpg-title-transform: none;
  --rpg-radius-sm: 0px;
  --rpg-radius-md: 1px;
  --rpg-radius-lg: 1px;
  --rpg-border-width: 1px;
  --rpg-border-style: solid;
  --rpg-elevation-1: 0 1px 1px rgba(25, 24, 20, 0.12);
  --rpg-elevation-2: 0 3px 9px rgba(25, 24, 20, 0.18);
  --rpg-elevation-3: 0 8px 24px rgba(25, 24, 20, 0.24);
  --rpg-glow: none;
  --rpg-glow-strength: 0;
  --rpg-glass-bg: rgba(248, 247, 242, 0.95);
  --rpg-glass-border: rgba(68, 65, 58, 0.4);
  --rpg-glass-blur: 0px;
  --rpg-frame-bg: #242522;
  --rpg-frame-text: #f4f3ed;
  --rpg-frame-accent: #c9cdd4;
  --rpg-texture-bg: url('matieres/papier.svg');
  --rpg-texture-panel: url('matieres/papier.svg');
  --rpg-texture-opacity: 0.025;
}
'''
write(SYS/'theme/theme.css',theme)
write(SYS/'theme/.ragignore','**\n')
write(SYS/'theme/intention.md','''# Intention

Papier gris ivoire, encre sombre et argent mat, inspirés des pages intérieures et des quatre dessins à la plume. Les panneaux presque droits, filets, volutes et motifs hachurés prolongent le livre ; le cadre sombre rappelle ses cartouches noirs. Le relief reste léger, sans halo ni effet de verre.

## Limites signalées

- **PARTIELLEMENT RÉALISABLE** : Georgia et Times New Roman sont des approximations système des caractères imprimés ; aucune identification exacte des polices n’est affirmée.
- **PARTIELLEMENT RÉALISABLE** : le grain discret et les volutes vectorielles évoquent le papier et l’encre sans reproduire les illustrations originales.
- **NON EXPRIMABLE** : lettrines, soulignements calligraphiques et composition des pages ne se transmettent pas à la disposition des modules GM-OS.

Les trois ornements sont fournis ; les icônes privilégient une silhouette simple et un trait de plume lisible à 16 px. La couverture bleue est distinguée des références intérieures noires et blanches, retenues pour cette proposition.
''')
def svg(box,content):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{content}</svg>\n'
orn={
'coin':svg('0 0 80 80','<path d="M3 28V3h25M7 22V7h15M11 19c0-8 13-9 13-3 0 5-8 5-8 0M3 3l8 8"/><path d="M7 5q0 12 11 8Q15 4 7 5" fill="currentColor" stroke="none"/>'),
'separateur':svg('0 0 240 16','<path d="M3 8h96m42 0h96M106 8q4-8 10 0t10 0 10 0"/><path d="m120 2 5 6-5 6-5-6z" fill="currentColor" stroke="none"/>'),
'fond':svg('0 0 80 80','<path d="M40 8C15 8 8 30 18 48s25 28 40 12 15-35-3-42S22 25 28 42s25 8 18-4M15 54l8-2m-4 8 8-3m-2 9 8-6M53 18l6-5m-1 10 7-5M35 20l-4-6M23 28l-7-3"/><path d="M38 56q-20 4-16-16 16-2 16 16" fill="currentColor" stroke="none"/>')}
for name,content in orn.items():write(SYS/f'theme/ornements/{name}.svg',content)
write(SYS/'theme/ornements.json',json.dumps({k:f'ornements/{k}.svg' for k in orn},indent=2)+'\n')
write(SYS/'theme/matieres/papier.svg',svg('0 0 100 100','<path d="m4 15 9-2m20 15 7 1m24-18 9 2M18 65l7-2m39 19 12-2M84 47l8 1M40 95l9-1M10 39h3m36 17h4m27 11h3"/>'))
icons={
'journal':'<path d="M5 4h14v16H5zM8 8h8M8 12h7M8 16h5"/>',
'forge':'<path d="M3 8h18l-5 5H9l-4-3H3zM9 13v5H6v2h13v-2h-4v-5"/>',
'combat':'<path d="m5 3 13 13-2 2L3 5V3zM13 17l4-4M17 17l4 4M21 3 8 16l-2-2L19 3zM5 17l3 3M3 21l3-3"/>',
'des':'<path d="m12 2 9 6v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M12 2v11"/>',
'carte':'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',
'sante':'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
'butin':'<path d="M7 3h10l-2 5c9 9 7 14-3 13S1 16 9 8zM8 8h8M10 13h4M10 16h4"/>',
'indice':'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M8 8l4 4M8 12l4-4"/>',
'lieu':'<path d="M3 10 12 3l9 7M5 9v12h14V9M10 21v-7h4v7"/>',
'horloge':'<circle cx="12" cy="12" r="9"/><path d="M12 5v7l4 3M12 3v1M3 12h1M20 12h1M12 20v1"/>',
'musique':'<path d="M9 17V5l11-2v12M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
'pj':'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3c0-7 16-7 16 0v3M8 14l4 6 4-6"/>',
'oracle':'<path d="M2 12Q12 0 22 12 12 24 2 12z"/><circle cx="12" cy="12" r="4"/><path d="M12 8v8"/>',
'lumiere':'<path d="M9 4h6l2 13H7zM8 17v4h8v-4M12 4V2M4 5l2 2M20 5l-2 2M11 12l1-4 1 4"/>',
'scene':'<path d="M3 3h18v17H3zM3 4l7 7-7 5M21 4l-7 7 7 5M10 11v9M14 11v9"/>'}
for name,content in icons.items():write(SYS/f'theme/icones/{name}.svg',svg('0 0 24 24',content))
write(SYS/'theme/icones.json',json.dumps({k:f'icones/{k}.svg' for k in icons},indent=2)+'\n')

# Coordonnées relevées visuellement sur les rendus PDF à l’échelle 1,5.
pages=[[],[]]
def f(page,key,label,kind,x,y,w,h,**extra):
    field=dict(key=key,label=label,type=kind,x=round(x/1.5,3),y=round(y/1.5,3),w=round(w/1.5,3),h=round(h/1.5,3),className=f'arg-field arg-{kind}')
    field.update(extra);pages[page-1].append(field)
def t(page,key,label,x,y,w,h=20):f(page,key,label,'text',x,y,w,h)
def n(page,key,label,x,y,w,h=24):f(page,key,label,'number',x,y,w,h)
def a(page,key,label,x,y,w,h):f(page,key,label,'textarea',x,y,w,h)
t(1,'identity.name','Nom',107,115,292)
t(1,'identity.gender','Sexe',473,115,143)
t(1,'identity.height','Taille',696,115,135)
t(1,'identity.citizenship','Citoyenneté',160,144,239)
n(1,'identity.age','Âge',473,144,143,20)
t(1,'identity.weight','Poids',696,144,135)
for i,y in enumerate([174,202]):
    t(1,f'temperaments.{i}.mood',f'Tempérament {i+1} — humeur',310,y,241)
    t(1,f'temperaments.{i}.domain',f'Tempérament {i+1} — domaine',639,y,125)
for key,label,x,w in [('tracks.panache','Panache',58,150),('tracks.panache_bonus','Bonus permanent de Panache',239,96),('combat.initiative_bonus','Bonus d’initiative',399,94),('tracks.health_max','Points de santé maximum',559,93),('tracks.health','Points de santé actuels',686,146)]:n(1,key,label,x,274,w,24)
for i,y in enumerate([373,416,458,501,543]):
    t(1,f'careers.{i}.name',f'Métier {i+1}',113,y,250)
    for key,label,x in [('rank','Rang',382),('bonus','Bonus',520),('salary','Salaire',655)]:
        f(1,f'careers.{i}.{key}',f'Métier {i+1} — {label}','text' if key=='rank' else 'number',x,y,118,17)
skills=[
 [('agility','Agilité'),('alchemy','Alchimie'),('art','Art'),('artificery','Artificerie'),('craft','Artisanat'),('fast_talk','Bagout'),('charisma','Charisme'),('ranged_combat','Combat à distance'),('close_combat','Combat rapproché'),('trade','Commerce'),('driving','Conduite')],
 [('deduction','Déduction'),('detection','Détection'),('animal_empathy','Empathie animale'),('moral_endurance','Endurance morale'),('physical_endurance','Endurance physique'),('climbing','Escalade'),('forgery','Faux et usage de faux'),('search','Fouille'),('stealth','Furtivité'),('herbalism','Herboristerie'),('medicine','Médecine')],
 [('trapping','Piégeage'),('seamanship','Pratique nautique'),('brawling','Rixe'),('natural_sciences','Sciences naturelles'),('religious_sciences','Sciences religieuses'),('social_sciences','Sciences sociales'),('technical_sciences','Sciences techniques'),('magic_sense','Sens magique'),('locksmithing','Serrurerie'),('urbanism','Urbanisme'),('other','Compétence libre')]]
for col,group in enumerate(skills):
    for row,(key,label) in enumerate(group):
        for j in range(7):
            f(1,f'skills.{key}.level',f'{label} — niveau {j+1}','hotspot',[178,455,732][col]+j*16.95-6.4,639+row*19.85-6.4,12.8,12.8,value=j+1)
t(1,'skills.other.name','Nom de la compétence libre',613,827,97,17)
for i in range(5):
    y=905+i*22.5
    for key,label,x,w in [('name','Nom',42,162),('range','Portée',248,35),('damage','Dégâts',329,51),('ammo','Munitions',441,63)]:t(1,f'weapons.{i}.{key}',f'Arme {i+1} — {label}',x,y,w,14)
for i in range(3):
    y=905+i*22.5
    for key,label,x,w in [('name','Nom',524,151),('protection','Protection',735,30),('penalty','Malus',810,39)]:t(1,f'armour.{i}.{key}',f'Protection {i+1} — {label}',x,y,w,14)
for col,x in enumerate([47,323,596]):
    for row in range(5):t(1,f'magic.{col*5+row}.name',f'Magie {col*5+row+1}',x,1077+row*28.5,248,18)
a(2,'profile.description','Description physique',59,72,765,75)
for key,label,y in [('family','Famille',240),('loves','Amours',294),('friends','Amis',348),('enemies','Ennemis',403),('work','Travail',457)]:a(2,f'relations.{key}',label,59,y,590,21)
# Le dessin d’œil n’est ni une piste ni une zone de portrait : il reste intact.
for key,label,y in [('residences','Résidence(s)',563),('movables','Biens mobiliers',660),('animal','Compagnon animal',758)]:a(2,f'possessions.{key}',label,60,y,766,52)
a(2,'equipment.worn','Équipement porté',59,858,347,299)
a(2,'equipment.bag','Équipement dans le sac',487,858,344,299)
for key,label,x,w in [('light','Charge légère',137,101),('heavy','Charge lourde',319,113),('lift','Charge soulevable',527,98),('push','Charge tirable ou poussable',788,49)]:n(2,f'load.{key}',label,x,1186,w,20)

id='argyropee-fr'
prefix=f'.sheet[data-template="{id}"]'
css=f'''{prefix} .arg-field{{position:absolute;box-sizing:border-box;margin:0;min-width:0;min-height:0;border:0;border-radius:0;background:transparent;color:#151515;font:10px/1.2 Georgia,serif;padding:0 1px;resize:none;outline:0}}
{prefix} .arg-number{{text-align:center;appearance:textfield;font-variant-numeric:tabular-nums}}
{prefix} .arg-number::-webkit-inner-spin-button,{prefix} .arg-number::-webkit-outer-spin-button{{appearance:none;margin:0}}
{prefix} .arg-textarea{{font-size:10px;line-height:16px;overflow:auto}}
{prefix} .arg-field:focus{{outline:0.7px solid #606060;background:#ffffffb0}}
{prefix} .arg-hotspot{{padding:0;border-radius:50%;cursor:pointer;touch-action:manipulation}}
{prefix} .arg-hotspot.active::after{{content:"";position:absolute;inset:0.6px;border-radius:50%;background:#252525;pointer-events:none}}
@media print{{{prefix} .arg-hotspot.active::after{{background:#252525!important;print-color-adjust:exact}}}}
'''
# customCss doit rester intégralement préfixé ; la règle d’impression relève du HTML seul.
custom=css[:css.index('@media print')]
doc=pdfium.PdfDocument(str(next(SRC.glob('*Fiche PJ.pdf'))))
manifest_pages=[]
for i,page in enumerate(doc):
    im=page.render(scale=2).to_pil().convert('RGB');buf=io.BytesIO();im.save(buf,format='JPEG',quality=92)
    w,h=page.get_size()
    manifest_pages.append(dict(id=f'page-{i+1}',label=['Identité, métiers et compétences','Description, relations et possessions'][i],width=w,height=h,orientation='portrait',backgroundData='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode(),fields=pages[i]))
template=dict(id=id,name='Argyropée — fiche de personnage',system='Argyropée',accent='#444953',schemaVersion=2,customCss=custom,pages=manifest_pages)
manifest=dict(format='character-sheet-studio-html',formatVersion=1,template=template)
runtime=(ROOT/'outils/torg/fiche/runtime.js').read_text(encoding='utf-8').replace('Fiche Torg autonome','Fiche Argyropée autonome').replace('`torg-${nom}.json`','`argyropee-${nom}.json`')
style=(ROOT/'outils/torg/fiche/interface.css').read_text(encoding='utf-8').replace('torg-eternity-fr',id).replace('torg-','arg-').replace('612pt 792pt','595.28125pt 841.88977pt')
html='''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Argyropée — fiche de personnage</title><style>'''+style+css+'''</style></head><body>
<header class="toolbar"><strong>ARGYROPÉE</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche d’Argyropée</h2><p>Deux pages reproduisent le PDF fourni. « Zones » révèle les champs transparents. Les compétences sont des pistes numériques de 0 à 7 : cliquer un cercle remplit jusqu’au niveau choisi ; cliquer à nouveau le dernier cercle sélectionné remet à zéro. La dernière compétence accepte un nom libre.</p><p>Les formules imprimées de santé, d’initiative et de charge restent à renseigner manuellement, comme les métiers, armes et magies. Le dessin de l’œil « Châtiment vermeil » est conservé sans lui attribuer d’interaction absente du document.</p><p>Zoom de 20 % à 400 %, Ctrl+molette, Ctrl++, Ctrl+−, Ctrl+0. Sauvegarde locale, import et export JSON, réinitialisation avec confirmation. Imprimer produit les deux pages au format A4. Tout fonctionne hors ligne. Exportez le JSON pour conserver plusieurs personnages.</p><button id="close-help">Fermer</button></dialog>
<script type="application/json" id="character-sheet-template">'''+json.dumps(manifest,ensure_ascii=False)+'''</script><script>'''+runtime+'''</script></body></html>'''
write(ROOT/'docs/fiches/Argyropée/argyropee-fiche-interactive.html',html)
keys=sorted({f['key'] for page in pages for f in page})
write(OUT/'cles-du-modele.json',json.dumps(dict(templateId=id,pages=2,zones=sum(map(len,pages)),nombreDeCles=len(keys),clesAjoutees=keys,clesRetirees=[],versionPrecedente=False),ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(sommaire=len(toc),index=len(index),pages=2,zones=sum(map(len,pages)),cles=len(keys)),ensure_ascii=True))
