"""Fiche V5 autonome, 17/11/2026. Aucun profil personnel de GM-OS n'est utilisé.

Lancer depuis le dépôt : python -I outils/vampire/construire-fiche.py
Puis npm run fiche:valider -- Vampire.
Les maxima restent manuels ; aucune règle de jeu n'est calculée par ce constructeur.
"""
from pathlib import Path
import base64, json, subprocess

ROOT=Path(__file__).resolve().parents[2]
TMP=ROOT/'tmp/vampire-studio-20261117'
MODEL='vampire-v5-fr'
subprocess.run(['node',str(ROOT/'outils/vampire/rendre-fiche.mjs')],cwd=ROOT,check=True)
pages=[]
for n,label in [(1,'Identité, traits et disciplines'),(2,'Convictions et histoire')]:
    geo=json.loads((TMP/f'fiche-{n}.json').read_text(encoding='utf8'))
    pages.append(dict(id=f'page-{n}',label=label,width=geo['width'],height=geo['height'],orientation='portrait',
                      backgroundData='data:image/png;base64,'+base64.b64encode((TMP/f'fiche-{n}.png').read_bytes()).decode(),fields=[]))

def field(page,key,label,kind,x,y,w,h,**extra):
    f=dict(key=key,label=label,type=kind,x=round(x,3),y=round(y,3),w=round(w,3),h=round(h,3),
           className='v-field v-'+kind,**extra)
    pages[page-1]['fields'].append(f)
    return f

def text(page,key,label,x,y,w,h=13):
    return field(page,key,label,'text',x,y,w,h)

def area(page,key,label,x,y,w,h):
    return field(page,key,label,'textarea',x,y,w,h)

def dots(page,key,label,glyph_x,baseline,count=5):
    # Les points sont des glyphes du PDF, pas un dessin reconstruit.
    for i in range(count):
        # La Puissance du sang sépare ses deux groupes de cinq par une espace.
        gap=3.95 if count==10 and i>=5 else 0
        f=field(page,key,f'{label} : {i+1}','hotspot',glyph_x+1+i*9.72+gap,baseline-7.35,7,7,value=i+1)
        f['className']+=' v-dot'

identity=[('name','Nom',0,0,25),('concept','Concept',1,0,39),('predator','Prédateur',2,0,44),
          ('chronicle','Chronique',0,1,44),('ambition','Ambition',1,1,42),('clan','Clan',2,1,25),
          ('sire','Sire',0,2,22),('desire','Désir',1,2,26),('generation','Génération',2,2,47)]
for key,label,col,row,offset in identity:
    left=60.8+col*164.15
    text(1,'identity.'+key,label,left+offset,94+row*22.68,160-offset,17)

attributes=[['strength','dexterity','stamina'],['charisma','manipulation','composure'],['intelligence','wits','resolve']]
attribute_labels=[['Force','Dextérité','Vigueur'],['Charisme','Manipulation','Sang-froid'],['Intelligence','Astuce','Résolution']]
for col in range(3):
    for row in range(3):
        dots(1,'attributes.'+attributes[col][row],attribute_labels[col][row],159.6+col*164.05,[207.6,227.5,247.1][row])

# Chaque case de dégâts est un CHOIX de trois valeurs texte, pas une jauge.
# Trois hotspots superposés se relaient par CSS : le seul bouton visible pose
# la valeur suivante. Le moteur existant importe ces hotspots et le même CSS.
damage_css=[]
for track,label,xs in [
    ('health','Santé',[184.5,195.4,206.3,217.2,228.1,243.5,254.4,265.3,276.2,287.1]),
    ('willpower','Volonté',[317.7,328.6,339.5,350.4,361.3,376.7,387.6,398.5,409.4,420.3])]:
    field(1,'tracks.'+track+'_capacity',label+' : capacité (à renseigner manuellement)','number',
          254 if track=='health' else 392,258,18,11,min=0,max=10)
    for i,x in enumerate(xs,1):
        token=f'v-{track}-{i}'
        for value,state,next_label in [('superficial','slash','marquer / superficiel'),('aggravated','cross','marquer X aggravé'),('intact','clear','effacer')]:
            f=field(1,f'damage.{track}.{i}',f'{label}, case {i} : {next_label}','hotspot',x,271.8,7.4,7.8,value=value)
            f['className']+=f' v-damage {token} v-{state}'
        scope=f'.sheet[data-template="{MODEL}"]'
        damage_css.append(f'''{scope}:has(.{token}.v-slash.active) .{token}.v-slash {{display:none;}}
{scope}:has(.{token}.v-slash.active) .{token}.v-cross {{display:block;}}
{scope}:has(.{token}.v-cross.active) .{token}.v-slash {{display:none;}}
{scope}:has(.{token}.v-cross.active) .{token}.v-clear {{display:block;}}''')

skills=[
 [('firearms','Armes à feu'),('craft','Artisanat'),('athletics','Athlétisme'),('brawl','Bagarre'),('drive','Conduite'),('stealth','Furtivité'),('larceny','Larcin'),('melee','Mêlée'),('survival','Survie')],
 [('animal_ken','Animaux'),('leadership','Commandement'),('insight','Empathie'),('etiquette','Étiquette'),('streetwise','Expérience de la rue'),('intimidation','Intimidation'),('persuasion','Persuasion'),('performance','Représentation'),('subterfuge','Subterfuge')],
 [('academics','Érudition'),('finance','Finances'),('investigation','Investigation'),('medicine','Médecine'),('occult','Occultisme'),('politics','Politique'),('science','Sciences'),('technology','Technologie'),('awareness','Vigilance')]]
source_items=json.loads((TMP/'fiche-1.json').read_text(encoding='utf8'))['items']
for col,column in enumerate(skills):
    for row,(key,label) in enumerate(column):
        item=next(i for i in source_items if i['text']==label)
        dot_x=[170.6,337.6,504.5][col]
        baseline=[323.8,324.4,324.4][col]+20.69*row
        dots(1,'skills.'+key,label,dot_x,baseline)
        x=item['x']+item['w']+3
        f=text(1,'specialties.'+key,label+' : spécialités',x,baseline-7.8,dot_x-x-4,10.5)
        f['className']+=' v-specialty'

for i in range(6):
    col=i%3; top=516.5 if i<3 else 618.5; left=60.8+col*164.15
    text(1,f'disciplines.{i}.name',f'Discipline {i+1} : nom',left+3,top+1,105,14)
    dots(1,f'disciplines.{i}.level',f'Discipline {i+1} : niveau',[172.6,337.7,501.3][col],528.9 if i<3 else 631)
    for row in range(5):
        text(1,f'disciplines.{i}.powers.{row}',f'Discipline {i+1} : pouvoir {row+1}',left+3,top+18.1+row*17.02,158,15)
text(1,'blood.resonance','Résonance',104.5,731.7,120,13)
for n in range(5):
    f=field(1,'tracks.hunger',f'Soif : {n+1}','hotspot',291.5+n*10.95,734.7,7.5,7.5,value=n+1);f['className']+=' v-box'
for n in range(10):
    f=field(1,'tracks.humanity',f'Humanité : {n+1}','hotspot',439.7+n*10.95+(4.2 if n>=5 else 0),734.7,7.5,7.5,value=n+1);f['className']+=' v-box'

for key,label,x in [('tenets','Principes de la chronique',59.8),('touchstones_convictions','Attaches et Convictions',225.6),('clan_bane','Fléau de clan',391.2)]:
    area(2,'beliefs.'+key,label,x+3,96.4,159,130)
for row in range(11):
    top=253.1+row*22.68
    text(2,f'advantages.{row}.name',f'Avantage ou handicap {row+1}',63,top+3,182,17)
    dots(2,f'advantages.{row}.level',f'Avantage ou handicap {row+1}',248.1,268.3+row*22.68)
dots(2,'blood.potency','Puissance du sang',428.9,248.1,count=10)
for key,label,x,y,w in [('surge','Coup de sang',312,267,119),('mending','Dégâts régénérés',433,267,119),
                       ('power_bonus','Bonus aux pouvoirs',312,307,119),('rouse_reroll','Relance du test d’Exaltation',433,307,119),
                       ('feeding_penalty','Pénalité pour se nourrir',312,346,119),('bane_severity','Score de Fléau',433,346,119)]:
    area(2,'blood.'+key,label,x+3,y+2,w-6,20)
field(2,'experience.total','Expérience totale','number',400,385,151,15,min=0)
field(2,'experience.spent','Expérience dépensée','number',416,409,135,15,min=0)
for key,label,y,offset in [('true_age','Âge véritable',435,55),('apparent_age','Âge apparent',455,55),('birth_date','Date de naissance',475,70),('death_date','Date de décès',495,60)]:
    text(2,'profile.'+key,label,315+offset,y+3,235-offset,14)
area(2,'profile.appearance','Apparence',315,530,235,22)
area(2,'profile.distinguishing_marks','Signes distinctifs',315,570,235,22)
area(2,'profile.history','Historique',315,609,235,124)
area(2,'profile.notes','Notes',63,526,234,207)

scope=f'.sheet[data-template="{MODEL}"]'
css=f'''{scope} .v-field {{position:absolute;box-sizing:border-box;margin:0;min-width:0;min-height:0;border:0;border-radius:0;padding:1px 2px;background:transparent;color:#282128;font:8px Georgia,serif;}}
{scope} .v-textarea {{resize:none;line-height:1.35;}}
{scope} .v-number {{font:8px Arial,sans-serif;text-align:center;appearance:textfield;}}
{scope} .v-number::-webkit-inner-spin-button {{display:none;}}
{scope} .v-specialty {{font-size:6.5px;padding:0;}}
{scope} .v-field:focus-visible {{outline:1px solid #990f32;background-color:#ffffff99;z-index:15;}}
{scope} .v-hotspot {{padding:0;cursor:pointer;}}
{scope} .v-dot {{border-radius:50%;}}
{scope} .v-dot.active {{background:#282128;}}
{scope} .v-box.active {{background:#282128;}}
{scope} .v-hotspot.active::after {{content:none;background:transparent;box-shadow:none;}}
{scope} .v-damage {{border-radius:0;}}
{scope} .v-damage.v-cross, {scope} .v-damage.v-clear {{display:none;}}
{scope} .v-damage::after {{position:absolute;inset:-1px;display:flex;align-items:center;justify-content:center;color:#282128;background:transparent;box-shadow:none;font:12px/1 Arial,sans-serif;pointer-events:none;}}
{scope} .v-cross::after {{content:"/";}}
{scope} .v-clear::after {{content:"X";}}
{scope} .v-damage.active {{background:transparent;}}
'''+ '\n'.join(damage_css)

manifest=dict(format='character-sheet-studio-html',formatVersion=1,template=dict(id=MODEL,
              name='Vampire La Mascarade V5 — fiche française',system='Vampire La Mascarade V5',
              accent='#990f32',schemaVersion=2,customCss=css,pages=pages))
fields=[f for p in pages for f in p['fields']]
for p in pages:
    for f in p['fields']:
        assert f['x']>=0 and f['y']>=0 and f['w']>0 and f['h']>0, f
        assert f['x']+f['w']<=p['width'] and f['y']+f['h']<=p['height'], f
target=ROOT/'docs/fiches/Vampire/vampire-v5-fiche-personnage-interactive.html'
target.parent.mkdir(parents=True,exist_ok=True)
html=(ROOT/'outils/vampire/fiche-autonome.html').read_text(encoding='utf8')
html=html.replace('/*CUSTOM_CSS*/',css).replace('<!--MANIFEST-->',
 '<script type="application/json" id="character-sheet-template">'+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'</script>')
target.write_text(html,encoding='utf8')
(TMP/'champs.json').write_text(json.dumps([dict(page=p['id'],**f) for p in pages for f in p['fields']],ensure_ascii=False,indent=2),encoding='utf8')
print(f'{target}: {len(pages)} pages, {len(fields)} zones, {len(set(f["key"] for f in fields))} clés, {target.stat().st_size} octets')
