import json,re
from pathlib import Path
root=Path('tmp/delta-green-index')
r=json.loads((root/'index-lines.json').read_text(encoding='utf8'))
entries=[]
for line in r:
 t=line['text']; x=line['x']
 if not entries: entries.append(dict(line));continue
 prev=entries[-1];pt=prev['text']
 numeric=bool(re.match(r'^\d+(?:[–, ]|$)',t))
 endnum=bool(re.search(r'\d\s*$',pt))
 continuation=(x>16 or t.startswith('Voir ') or numeric or (x>prev['x']+4 and not endnum and 'Voir' not in pt))
 # Wrapped cross-references at main-entry indentation + 9.
 if x>prev['x']+4 and 'Voir' in pt and not endnum and line['page']==prev['page'] and line['col']==prev['col']:
  continuation=True
 if pt in {'compétences','dégâts','Professions','renseignement','expérience'}: continuation=False
 if pt in {'connaissance approfondie d’une','améliorer des compétences ou des'}: continuation=True
 if continuation: prev['text']+=' '+t
 else: entries.append(dict(line))
for e in entries: e['text']=re.sub(r'(?<=\d)([–-])\s+(?=\d)',r'\1',e['text'])
(root/'index-entries.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2),encoding='utf8')
(root/'index-candidate.txt').write_text('\n'.join(f"{i:03} p{e['page']}c{e['col']} {e['text']}" for i,e in enumerate(entries)),encoding='utf8')
print(len(entries))
