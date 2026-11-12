"""Reproduction autonome des deux pages fournies, en coordonnées PDF natives.

12/11/2026 : demande de David, atelier fiche de GM-OS Studio.
Le fond PDF fait foi ; aucune donnée personnelle ni bibliothèque de GM-OS n'est ouverte.
"""
from pathlib import Path
import base64
import io
import json
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/Reference/Delta Green/dgmanuel_de_lagent_PJ.pdf'
TARGET = ROOT / 'docs/fiches/Delta Green/delta-green-fiche-agent-interactive.html'
MODEL = 'delta-green-agent-fr'
pages = []
pdf = pdfium.PdfDocument(SOURCE)
for i in range(len(pdf)):
    im = pdf[i].render(scale=2).to_pil().convert('RGB')
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=92, optimize=True)
    pages.append(dict(id=f'page-{i+1}', label=['Agent', 'Équipement et dossier'][i],
                      width=595.276, height=841.89, orientation='portrait',
                      backgroundData='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode(), fields=[]))


def field(page, key, label, kind, x, y, w, h, **extra):
    f = dict(key=key, label=label, type=kind, x=x, y=y, w=w, h=h,
             className='dg-field dg-'+kind, **extra)
    pages[page-1]['fields'].append(f)
    return f


def text(page, key, label, x, y, w, h, **extra):
    return field(page, key, label, 'text', x, y, w, h, **extra)


def number(page, key, label, x, y, w, h, **extra):
    return field(page, key, label, 'number', x, y, w, h, **extra)


def area(page, key, label, x, y, w, h):
    return field(page, key, label, 'textarea', x, y, w, h)


def check(page, key, label, x, y, size=7):
    return field(page, key, label, 'checkbox', x, y, size, size)


text(1,'identity.name','Nom, prénom, initiales',85,88,267,20)
text(1,'identity.profession','Profession et rang',358,88,210,20)
text(1,'identity.employer','Employeur',85,123,267,20)
text(1,'identity.nationality','Nationalité',358,123,210,20)
for value,x in [('F',87.1),('M',110.1),('Autre',135.3)]:
    field(1,'identity.gender','Genre : '+value,'hotspot',x,165.3,7,7,value=value)
text(1,'identity.gender_other','Genre, précision',146,162,36,9)
text(1,'identity.age_birth','Âge et date de naissance',194,158,134,18)
area(1,'identity.education','Études et carrière',334,158,234,18)
attributes=[('strength','Force'),('constitution','Constitution'),('dexterity','Dextérité'),
            ('intelligence','Intelligence'),('power','Pouvoir'),('charisma','Charisme')]
for i,(key,label) in enumerate(attributes):
    y=198.4+i*18
    number(1,'attributes.'+key,label,172.3,y,31,14,min=0)
    number(1,'attributes.'+key+'_x5',label+' ×5',206.3,y,31,14,
           readonly=True,derive=dict(source='attributes.'+key,operation='round-divide',divisor=.2))
    text(1,'traits.'+key,'Trait distinctif : '+label,240.3,y,81.5,14)
for i in range(5):
    y=198.4+i*18
    check(1,f'bonds.{i}.damaged',f'Attache {i+1} endommagée',351.4,y+5,7)
    text(1,f'bonds.{i}.name',f'Attache {i+1}',361,y,174,14)
    number(1,f'bonds.{i}.score',f'Score Attache {i+1}',539,y,30,14,min=0)
number(1,'health.hp_max','Points de vie maximum',221,320,60,9,min=0)
number(1,'health.hp','Points de vie actuels',284,321,38,14,min=0)
number(1,'health.willpower_max','Volonté maximum',221,338,60,9,min=0,
       readonly=True,derive=dict(source='attributes.power',operation='copy'))
number(1,'health.willpower','Volonté actuelle',284,339,38,14,min=0)
number(1,'health.sanity_max','Santé mentale maximum',221,356,60,9,min=0,max=99)
number(1,'health.sanity','Santé mentale actuelle',284,357,38,14,min=0,max=99)
number(1,'health.breaking_point','Seuil de rupture actuel',284,375,38,14,min=0,max=99)
area(1,'profile.description','Description physique',85,405,237,31)
area(1,'psychology.motivations_disorders','Motivations et troubles psychiques',349,326,220,72)
# Les trois cases imprimées de chaque piste partagent une seule valeur numérique.
for key,label,xs in [('violence','Violence',[383,394.1,405.2]),('helplessness','Impuissance',[498.3,509.4,520.5])]:
    for n,x in enumerate(xs,1):
        field(1,'adaptation.'+key,label+' : perte '+str(n),'hotspot',x,424.1,7,7,value=n)

skills_left=[('anthropology','Anthropologie',0,0),('archeology','Archéologie',0,1),
('firearms','Armes à feu',20,2),('melee','Armes de mêlée',30,3),('heavy_weapons','Armes lourdes',0,4),
('art','Art',0,5),('artillery','Artillerie',0,7),('craft','Artisanat',0,8),('athletics','Athlétisme',30,10),
('bureaucracy','Bureaucratie',10,11),('surgery','Chirurgie',0,12),('unarmed','Combat à mains nues',40,13),
('accounting','Comptabilité',10,14),('drive','Conduite',20,15),('forensics','Criminalistique',0,16),
('criminology','Criminologie',10,17)]
skills_middle=[('disguise','Déguisement',10,0),('stealth','Discrétion',10,1),('law','Droit',0,2),
('heavy_machinery','Engins lourds',10,3),('ride','Équitation',10,4),('dodge','Esquive',30,5),
('demolitions','Explosifs',0,6),('history','Histoire',10,7),('computer_science','Informatique',0,8),
('medicine','Médecine',0,9),('swim','Natation',20,10),('occult','Occultisme',10,11),
('navigate','Orientation',10,12),('persuade','Persuasion',20,13),('pharmacy','Pharmacologie',0,14),
('pilot','Pilotage',0,15),('first_aid','Premiers secours',10,17)]
skills_right=[('psychotherapy','Psychothérapie',10,0),('search','Recherche',20,1),('sigint','ROEM',0,2),
('humint','ROHUM',10,3),('science','Science',0,4),('military_science','Sciences militaires',0,6),
('survival','Survie',10,8),('alertness','Vigilance',20,9),('unnatural','Inconcevable',0,10)]
for col,skills in enumerate([skills_left,skills_middle,skills_right]):
    cx=[88,251,414.4][col]; nx=[212,375,538][col]; lx=[102,265,428][col]
    for key,label,base,row in skills:
        y=440.94+row*18.263
        number(1,'skills.'+key,label+' %',nx,y+2,31,14,min=0,defaultValue=base)
        if key!='unnatural':check(1,'experience.'+key,label+' : test manqué',cx,y+6,7)
        if key in ['art','craft','pilot','science','military_science']:
            text(1,'specialties.'+key,label+' : spécialité',lx,y+18.8,nx-lx-3,14)
for i in range(6):
    y=660.1+i*18.263
    check(1,f'experience.custom_{i}',f'Compétence libre {i+1} : test manqué',414.4,y+6)
    text(1,f'skills.custom_{i}.name',f'Compétence libre {i+1} : nom',428,y+2,106,14)
    number(1,f'skills.custom_{i}.level',f'Compétence libre {i+1} : %',538,y+2,31,14,min=0)

area(2,'health.wounds_diseases','Blessures et maladies',66,57,483,73)
check(2,'health.first_aid_received','Premiers secours reçus depuis la dernière blessure',427,136.4,7)
area(2,'equipment.armor_gear','Armure et matériel',66,171,483,111)
columns=[('name','Arme',76,154),('skill','Compétence %',157,217),('range','Portée de base',220,267),
('damage','Dégâts',270,324),('armor_piercing','Perforant',327,380),('lethality','Létalité',383,437),
('kill_radius','Rayon de mortalité',440,494),('ammo','Munitions',497,550)]
for row in range(7):
    y=323.2+row*19.08
    for key,label,left,right in columns:
        text(2,f'weapons.{row}.{key}',f'Arme {chr(97+row)} : {label}',left,y,right-left,15)
area(2,'profile.personal_notes','Détails personnels et notes',66,471,229,216)
area(2,'profile.home_family','Développements qui affectent le foyer et la famille',300,471,250,101)
for i in range(6):
    y=591+i*16.935
    text(2,f'training.{i}.name',f'Entraînement spécial {i+1}',300,y,123,13.5)
    text(2,f'training.{i}.skill',f'Caractéristique ou compétence utilisée {i+1}',427,y,123,13.5)
area(2,'identity.handler','Officier responsable',45,721,250,42)
text(2,'identity.signature','Signature de l’Agent',300,724,250,35)

custom_css = f'''.sheet[data-template="{MODEL}"] .dg-field {{font: 8px Arial, sans-serif; color:#171b17; background:transparent; border:0; box-sizing:border-box; padding:1px 2px;}}
.sheet[data-template="{MODEL}"] .dg-number {{text-align:center; font:9px "Courier New",monospace;}}
.sheet[data-template="{MODEL}"] .dg-textarea {{resize:none; line-height:1.35;}}
.sheet[data-template="{MODEL}"] .dg-checkbox {{accent-color:#254d3c; padding:0;}}
.sheet[data-template="{MODEL}"] .dg-hotspot {{padding:0; border-radius:0;}}
.sheet[data-template="{MODEL}"] .dg-hotspot.active {{background:rgba(38,75,52,.35); outline:1px solid #254d3c;}}
.sheet[data-template="{MODEL}"] .dg-field:focus {{outline:1px solid #285646; background:rgba(255,255,255,.7);}}'''
manifest=dict(format='character-sheet-studio-html',formatVersion=1,
              template=dict(id=MODEL,name='Delta Green — fiche d’Agent (français)',system='Delta Green',
                            accent='#285646',schemaVersion=2,customCss=custom_css,pages=pages))
all_fields=[f for p in pages for f in p['fields']]
keys={f['key'] for f in all_fields}
for p in pages:
    for f in p['fields']:
        assert f['x']>=0 and f['y']>=0 and f['w']>0 and f['h']>0
        assert f['x']+f['w']<=p['width'] and f['y']+f['h']<=p['height'],f
TARGET.parent.mkdir(parents=True,exist_ok=True)
shell=(ROOT/'outils/delta-green/fiche-autonome.html').read_text(encoding='utf8')
TARGET.write_text(shell.replace('/*CUSTOM_CSS*/',custom_css).replace('<!--MANIFEST-->',
 '<script type="application/json" id="character-sheet-template">'+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'</script>'),encoding='utf8')
print(f'{TARGET}: {len(pages)} pages, {len(all_fields)} zones, {len(keys)} clés, {TARGET.stat().st_size} octets')
audit=ROOT/'tmp/delta-green-studio/champs.json'
audit.write_text(json.dumps([dict(page=p['id'],**f) for p in pages for f in p['fields']],ensure_ascii=False,indent=2),encoding='utf8')
