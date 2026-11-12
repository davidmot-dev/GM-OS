import re,json
from pathlib import Path
import pdfplumber
out=Path('tmp/delta-green-index')
records=[]
with pdfplumber.open('docs/Reference/Delta Green/dgmanuel_de_lagent_Index.pdf') as pdf:
 for pi,p in enumerate(pdf.pages):
  base=72 if pi%2==0 else 36
  for ci in range(3):
   left=base+ci*168.4-2; right=left+168.4
   chars=[c for c in p.chars if left <= (c['x0']+c['x1'])/2 < right and (100 if pi==0 else 35)<c['top']<780]
   crop=p.filter(lambda o:o.get('object_type')=='char' and o in chars)
   lines=crop.extract_text_lines(x_tolerance=1.5,y_tolerance=2)
   for line in lines:
    records.append(dict(page=179+pi,col=ci+1,x=round(line['x0']-(base+ci*168.4),1),text=line['text']))
(out/'index-lines.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
headings={'compétences','dégâts','Professions','renseignement','expérience'}
entries=[]
for line in records:
 t=line['text']; x=line['x']
 if not entries:
  entries.append(dict(**line)); continue
 prev=entries[-1]; pt=prev['text']
 ends=bool(re.search(r'\d\s*$',pt)) or 'Voir' in pt
 continuation=x>16 or (not ends and pt not in headings)
 if continuation:
  prev['text']+=' '+t
 else: entries.append(dict(**line))
(out/'index-entries.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2),encoding='utf8')
(out/'index-candidate.txt').write_text('\n'.join(f"{i:03} p{e['page']}c{e['col']} {e['text']}" for i,e in enumerate(entries)),encoding='utf8')
print('lines',len(records),'entries',len(entries))
# TOC, left then right; every entry terminates in its printed page.
with pdfplumber.open('docs/Reference/Delta Green/dgmanuel_de_lagent_TOC.pdf') as pdf:
 p=pdf.pages[0]; toc=[]; pending=''
 for bounds in [(30,75,285,765),(290,75,565,765)]:
  for line in p.crop(bounds).extract_text_lines(x_tolerance=1.5,y_tolerance=2):
   t=line['text']; pending=(pending+' '+t).strip()
   match=re.search(r'\.{2,}\s*(\d+)$',pending)
   if match:
    title=pending[:match.start()].strip(); toc.append((title,match.group(1))); pending=''
 if pending: raise ValueError(pending)
(out/'toc-entries.json').write_text(json.dumps(toc,ensure_ascii=False,indent=2),encoding='utf8')
print('toc',len(toc),toc[0],toc[-1])
