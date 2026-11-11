import hashlib
import json
import re
import unicodedata
from pathlib import Path

root=Path(__file__).parent
s=json.loads((root/'inspection/inventory.json').read_text(encoding='utf-8'))['sources'][0]
assert len(s['pages'])==62 and s['identical_page_groups']==[]
titles=['GOSPOG DE LA 5E RÉCOLTE','GOSPOG DE LA 4E RÉCOLTE','GOSPOG DE LA 3E RÉCOLTE','GOSPOG DE LA 2DE RÉCOLTE',
    'MACHINE D’ABOMINATIONS','CHARYBDE','BARGHEST','GÉANT DU GIVRE','UTHORION (THORFIN)','GHILLIE',
    'ESPRIT-FOLLET','NIBIKRID','SQUELETTE','BANDIT','CHEVALIER','SORCIER','JEUNE DRAKE','DRAKE','ZOMBI','LICHE',
    'TAS DE FERRAILLE','GRAND DRAGON','VIKING BERSERKER','DRAUGR VIKING','PILLARD VIKING','SKJALDMÖ VIKING',
    'SCALDE VIKING','SEIGNEUR DE GUERRE VIKING','BARONNE SVECHA','TUEUR DE MAGES']
def normalize(text):
    return ' '.join(unicodedata.normalize('NFKC',text).split())
def slug(text):
    text=unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode('ascii').lower()
    return re.sub('[^a-z0-9]+','-',text).strip('-')
cards=[{'source':'s0','page':p,'role':'ignore','reason':'Page d’instructions, conservée séparément dans les suppléments de la recette.'} for p in (1,2)]
starts={}
labels={}
for i,title in enumerate(titles):
    deck=f'{i+1:02d}-{slug(title)}'
    starts[deck]=0
    labels[deck]=title
    for page,role in ((3+2*i,'face'),(4+2*i,'back')):
        source_title='CHARYB' if page==14 else title
        assert normalize(source_title) in normalize(s['pages'][page-1]['text']),(page,title)
        evidence=f'{title} : '+('recto illustré destiné aux joueurs' if role=='face' else 'verso de statistiques destiné au meneur, associé au recto précédent de même titre')
        evidence+=' ; texte principal à l’endroit sans rotation ; carte portrait entière avec bordure.'
        if page==14:
            evidence+=' Le PDF imprime CHARYB au verso et CHARYBDE au recto page 13 ; paire vérifiée par illustration, statistiques et ordre source, graphisme conservé sans correction.'
        cards.append(dict(source='s0',page=page,deck=deck,role=role,bbox=[0,0,1,1],rotate_cw=0,orientation_verified=True,evidence=evidence))
recipe=dict(schema_version=2,dpi=300,start_indices=starts,numbering_confirmed=True,
    numbering_choice={'user':'David','date':'2026-11-08','answer':'0','scope':'0 pour toutes les menaces, une face et un verso distinct par dossier.'},
    sources=[{k:s[k] for k in ('id','filename','sha256')}],cards=cards,deck_labels=labels,
    order='Increasing source page number; pages 1–2 retained as instructions, then 30 consecutive recto/verso pairs. No repeated back discarded.',
    geometry_evidence='All 62 source pages inspected in both contact sheets. Instructions, first recto and first verso opened separately. All cards upright, full page retained.',
    supplementary_exports=[{'source':'s0','page':1,'output':'instructions/recto.jpg','dpi':300}, {'source':'s0','page':2,'output':'instructions/verso.jpg','dpi':300}],
    provenance='New recipe established from Cartes Menaces Aysle after fresh inspection. Each menace has its own illustrated recto and rules verso; no common back exists.')
(root/'recipe.json').write_text(json.dumps(recipe,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
original=Path(r'C:\Users\david\.codex\plugins\cache\created-by-me-remote\card-extractor\1.1.0\skills\extract-cards\scripts\cards.py')
adapted=root.parent/'cartes-cyberware-20261108/cards-windows.py'
head,tail=original.read_text(encoding='utf-8').split('        stage.rename(out)')
after=adapted.read_text(encoding='utf-8')
assert after.startswith(head) and after.endswith(tail)
assert 'shutil.copytree(stage, out)' in after and 'sha(file) != sha(out / file.relative_to(stage))' in after
(root/'cards-windows.py').write_bytes(adapted.read_bytes())
(root/'extractor.json').write_text(json.dumps({'original_sha256':hashlib.sha256(original.read_bytes()).hexdigest(),
    'adapted_sha256':hashlib.sha256(adapted.read_bytes()).hexdigest(),
    'adaptation':'Only stage.rename(out) replaced by copytree with SHA-256 equality checks. Rendering unchanged.'},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'pages':62,'pairs':30,'instructions':2,'start_indices':starts},ensure_ascii=True))
