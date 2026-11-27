from pathlib import Path
from collections import Counter
import base64
import io
import json
import re
import sys
from PIL import Image
from pypdf import PdfReader, PdfWriter
import pdfplumber
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'tmp/traveller-studio'
WORK.mkdir(parents=True, exist_ok=True)
OUT = ROOT / 'docs/fiches/Traveller'
DELIVERY = ROOT / 'output/gmos-studio/traveller'
PAGES = [[], []]

# Deux pages utiles du PDF fourni ; sa couverture n'est pas une page de fiche.
reader = PdfReader(ROOT / 'docs/Reference/Traveller/livre_de_regles_de_traveller_v2_2_fiche.pdf')
writer = PdfWriter()
for page in reader.pages[1:]:
    writer.add_page(page.rotate(90))
pdf_bytes = io.BytesIO()
writer.write(pdf_bytes)
with pdfplumber.open(io.BytesIO(pdf_bytes.getvalue())) as doc:
    for i, page in enumerate(doc.pages, 1):
        (WORK / f'fiche-paysage-{i}-words.json').write_text(json.dumps(page.extract_words(), ensure_ascii=False), encoding='utf-8')
document = pdfium.PdfDocument(pdf_bytes.getvalue())
for i in range(len(document)):
    page = document[i]
    bitmap = page.render(scale=2)
    bitmap.to_pil().save(WORK / f'fiche-paysage-{i+1}.png')
    bitmap.close()
    page.close()
document.close()
# Portrait géométrique exclusivement réservé aux essais, pas livré comme illustration.
from PIL import ImageDraw
portrait = Image.new('RGB', (200, 260), '#293f50')
drawing = ImageDraw.Draw(portrait)
drawing.ellipse((65, 35, 135, 115), fill='#b9b3a7')
drawing.polygon([(40, 240), (55, 130), (145, 130), (160, 240)], fill='#b76b33')
portrait.save(WORK / 'portrait-test.png')


def field(page, key, label, x, y, w, h, kind='text', **extra):
    item = dict(key=key, label=label, type=kind, x=x, y=y, w=w, h=h, **extra)
    assert x >= 0 and y >= 0 and x+w <= 807.874 and y+h <= 609.449, item
    PAGES[page-1].append(item)


def table(page, prefix, label, columns, y, height, rows):
    for row in range(rows):
        for name, caption, x, width, kind in columns:
            field(page, f'{prefix}.{row}.{name}', f'{label} {row+1} — {caption}', x, y+row*height/rows, width, height/rows-1.5, kind, className='table-cell')


attributes = [('strength','Force'),('dexterity','Dextérité'),('endurance','Endurance'),('intellect','Intellect'),('education','Éducation'),('social','Statut social'),('morale','Moral'),('luck','Chance'),('sanity','Santé mentale'),('charisma','Charisme'),('psionics','Psionique'),('other','Autre')]
for i,(key,label) in enumerate(attributes):
    cy = 44.5 + i*43.7 if i<6 else 328.5+(i-6)*44
    field(1,f'attributes.{key}.value',label,43,cy-9,20,18,'number',className='attribute-value')
    field(1,f'attributes.{key}.modifier',f'{label} — MD',77,cy-1,16,14,'number',className='modifier')
field(1,'attributes.other.label','Nom de l’autre caractéristique',34,562,61,15,className='replace-label',placeholder='AUTRE')

for key,label,x,y,w,h,kind in [
    ('name','Nom',135,47,175,13,'text'),('age','Âge',338,47,56,13,'number'),
    ('gender','Genre',348,61,46,13,'text'),('species','Espèce',144,69,165,13,'text'),
    ('homeworld','Monde natal',316,87,78,14,'text'),('traits','Traits',144,84,165,29,'textarea'),
    ('rads','Rads',342,102,52,12,'number')]:
    field(1,'identity.'+key,label,x,y,w,h,kind)
for key,label,x,y,w in [('ship_monthly','Charges mensuelles du vaisseau',693,27,88),('pension','Pension',456,47,128),('cash','Cash disponible',670,47,116),('debt','Dette',455,63,128),('basic_expenses','Dépenses de base',670,63,116)]:
    field(1,'finances.'+key,label,x,y,w,12,'number')

table(1,'careers','Carrière',[
    ('name','Carrière',109,133,'text'),('terms','Périodes',248,54,'number'),('rank','Rang',309,86,'text')],156,95,5)
table(1,'armor','Armure',[
    ('type','Type',413,107,'text'),('rad','RAD',526,32,'text'),('protection','Protection',564,58,'text'),('weight','kg',629,32,'number'),('options','Options',668,123,'text')],114,76,4)
table(1,'weapons','Arme',[
    ('name','Arme',413,107,'text'),('tech_level','NT',526,26,'number'),('range','Portée',559,52,'text'),('damage','Dégâts',618,62,'text'),('weight','kg',686,31,'number'),('ammunition','Munitions',724,67,'text')],230,114,6)
table(1,'augmentations','Augmentation',[
    ('type','Type',413,178,'text'),('tech_level','NT',598,27,'number'),('improvement','Amélioration',631,160,'text')],382,61,4)
for side,x in [('left',413),('right',600)]:
    table(1,f'equipment.{side}','Équipement',[
        ('type','Type',x,140,'text'),('weight','Masse',x+145,44,'number')],480,89,8)
field(1,'equipment.total_weight','Masse totale portée',677,573,112,14,'number')
field(1,'training.skill','Formation dans la compétence',214,280,88,12)
field(1,'training.weeks','Semaines de formation',353,280,42,12,'number')
field(1,'training.completed','Période de formation complète',264,294,41,11)

words=json.loads((WORK/'fiche-paysage-1-words.json').read_text(encoding='utf-8'))
skill_inventory=[]
for col,(left,right) in enumerate([(109.5,199),(206.6,296),(303.7,394)]):
    for row in range(24):
        top=315.2+row*11
        ww=sorted([w for w in words if left-0.3<=w['x0']<right and abs(w['top']-top)<0.5],key=lambda w:w['x0'])
        text=' '.join(w['text'] for w in ww)
        label=re.sub(r'\s*\(\s*\)\s*','',text).strip()
        key=f'skills.{col*24+row}'
        if not label:
            label=f'Compétence libre {row-18}'
            field(1,key+'.name',label+' — nom',left,top-1,70,10,className='skill-specialty')
        field(1,key+'.level',label+' — niveau',right-8.5,top-1,8.3,10,'number',className='skill-level')
        parens=[w for w in ww if w['text'] in ['(',')']]
        if len(parens)==2:
            field(1,key+'.specialty',label+' — spécialité',parens[0]['x1']+0.6,top-1,parens[1]['x0']-parens[0]['x1']-1.2,10,className='skill-specialty')
        elif text and label in ['Aéronef','Armes lourdes','Art','Artilleur','Combat Arme']:
            end=max(w['x1'] for w in ww)
            field(1,key+'.specialty',label+' — spécialité',end+2,top-1,right-11-end-2,10,className='skill-specialty')
        skill_inventory.append(dict(key=key,label=label,colonne=col+1,ligne=row+1))

field(2,'background.context','Notes de contexte',18,41,378,91,'textarea')
for prefix,label,y,h,rows in [('allies','Allié',174,65,4),('contacts','Contact',280,65,4),('rivals','Rival',386,65,4),('enemies','Ennemi',492,63,4)]:
    table(2,'relationships.'+prefix,label,[('name','Nom',18,138,'text'),('notes','Notes',163,232,'text')],y,h,rows)
field(2,'identity.title','Titre',441,49,199,13)
field(2,'summary.name','Nom (repris de la première page)',438,71,203,14,readonly=True,derive={'source':'identity.name','operation':'copy'})
field(2,'summary.species','Espèce (reprise de la première page)',448,125,193,14,readonly=True,derive={'source':'identity.species','operation':'copy'})
field(2,'identity.portrait','Portrait',652,60,138,137,'portrait',fit='contain')
field(2,'identity.face','Traits de visage',653,220,137,29,'textarea')
for key,label,x,y in [('strength','FOR',462,186),('dexterity','DEX',485,200),('endurance','END',508.5,186),('intellect','INT',532,200),('education','EDU',555,186),('social','SOC',578,200)]:
    field(2,'profile.'+key,'Profil universel — '+label,x,y,16,14,className='attribute-value')
table(2,'injuries','Blessure',[
    ('type','Type',414,94,'text'),('location','Localisation',515,82,'text'),('recovery','Temps de récupération',605,92,'text'),('notes','Notes',705,85,'text')],274,30,2)
field(2,'background.history','Passé',416,334,373,246,'textarea')

pages=[]
for i,fields in enumerate(PAGES,1):
    im=Image.open(WORK/f'fiche-paysage-{i}.png').convert('RGB')
    buf=io.BytesIO();im.save(buf,'WEBP',quality=94)
    background='data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
    pages.append(dict(id=f'page-{i}',label=['Voyageur — caractéristiques et équipement','Contexte, relations et passé'][i-1],width=807.874,height=609.449,orientation='landscape',backgroundData=background,fields=fields))
keys=[f['key'] for page in pages for f in page['fields']]
assert len(keys)==len(set(keys))
assert len([f for page in pages for f in page['fields'] if f['key'].startswith('skills.') and f['key'].endswith('.level')])==72
custom_css='.sheet[data-template="traveller-fr"] .field{font-family:Arial,sans-serif;color:#101528;font-size:9px;} .sheet[data-template="traveller-fr"] .skill-level{font-size:7px;text-align:center;padding:0;} .sheet[data-template="traveller-fr"] .skill-specialty{font-size:6.5px;padding:0;} .sheet[data-template="traveller-fr"] .attribute-value{font-size:12px;text-align:center;} .sheet[data-template="traveller-fr"] .modifier{text-align:center;} .sheet[data-template="traveller-fr"] .table-cell{font-size:8px;} .sheet[data-template="traveller-fr"] .replace-label:placeholder-shown{color:transparent;} .sheet[data-template="traveller-fr"] .replace-label:not(:placeholder-shown){background:#e9e9e9;}'
manifest=dict(format='character-sheet-studio-html',formatVersion=1,template=dict(id='traveller-fr',name='Traveller — fiche de personnage française',system='Traveller',accent='#080b26',schemaVersion=2,customCss=custom_css,pages=pages))
template=Path(__file__).with_name('fiche-autonome.html').read_text(encoding='utf-8')
custom_css += ' .sheet[data-template="traveller-fr"] .replace-label::placeholder{color:transparent;}'
manifest['template']['customCss']=custom_css
html=template.replace('@@MANIFEST@@',json.dumps(manifest,ensure_ascii=False,separators=(',',':')).replace('</',r'<\/')).replace('@@CUSTOM_CSS@@',custom_css)
OUT.mkdir(parents=True,exist_ok=True);DELIVERY.mkdir(parents=True,exist_ok=True)
target=OUT/'traveller-fiche-personnage-interactive.html'
if target.exists() and '--regenerer' not in sys.argv:
    assert target.read_text(encoding='utf-8')==html, 'Fichier existant différent : ne pas écraser.'
else: target.write_text(html,encoding='utf-8')
(DELIVERY/'cles-du-modele.json').write_text(json.dumps(dict(id='traveller-fr',nombreChamps=len(keys),cles=keys,competences=skill_inventory),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(fichier=target.relative_to(ROOT).as_posix(),pages=len(pages),champs=len(keys),types=dict(Counter(f['type'] for page in pages for f in page['fields']))),ensure_ascii=True))
