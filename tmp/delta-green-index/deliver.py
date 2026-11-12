import json,re,hashlib
from pathlib import Path
from collections import Counter
work=Path('tmp/delta-green-index'); dest=Path('docs/systems/delta-green/index')
entries=json.loads((work/'index-entries.json').read_text(encoding='utf8'))
lines=json.loads((work/'index-lines.json').read_text(encoding='utf8'))
toc=json.loads((work/'toc-entries.json').read_text(encoding='utf8'))
# Every source character (other than spaces) must survive the column ordering and joining.
norm=lambda text: re.sub(r'\s+','',text)
assert norm(''.join(e['text'] for e in entries))==norm(''.join(e['text'] for e in lines))
def format_entry(text):
 before,sep,after=text.partition('Voir')
 m=re.search(r'(?<!\S)(\d[\d, –-]*)$',before.rstrip())
 if m:
  title=before[:m.start()].strip(); pages=m.group(1).strip()
  return title+' — '+pages+(' — Voir'+after if sep else '')
 return before.rstrip()+(' — Voir'+after if sep else '')
idx=['# Index — Delta Green — Manuel de l’Agent','']+['- '+format_entry(e['text']) for e in entries]
tmd=['# Table des matières — Delta Green — Manuel de l’Agent','']+['- '+title+' — '+page for title,page in toc]
assert len(toc)==93 and toc[0]==['Vue d’ensemble','4'] and toc[-1]==['Fiches de personnage','190']
for collection in [idx,tmd]:
 assert all(x.startswith('- ') for x in collection[2:])
 assert not any('\ufffd' in x or '@' in x or 'David Mot' in x for x in collection)
for name,content in [('dgmanuel_de_lagent_index_flat.md',idx),('dgmanuel_de_lagent_table_des_matieres_flat.md',tmd)]:
 target=dest/name
 assert not target.exists(),target
 target.write_text('\n'.join(content)+'\n',encoding='utf8')
 print(target,len(content)-2)
report={
 'table_des_matieres':{'entrees':len(toc),'premiere':toc[0],'derniere':toc[-1]},
 'index':{'entrees':len(entries),'par_page':dict(Counter(e['page'] for e in entries)),
 'colonnes':[{'page':p,'colonne':c,'premiere_ligne':next(e['text'] for e in lines if e['page']==p and e['col']==c),'derniere_ligne':next(e['text'] for e in reversed(lines) if e['page']==p and e['col']==c)} for p in range(179,184) for c in range(1,4)]},
 'integralite_caracteres_hors_espaces':True,
 'sources':[{ 'fichier':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in Path('docs/Reference/Delta Green').glob('*.pdf') if p.stem.endswith(('TOC','Index'))]}
(work/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(report['index']['par_page']))
