import pdfplumber
from pathlib import Path
with pdfplumber.open('docs/Reference/Delta Green/dgmanuel_de_lagent_Index.pdf') as doc:
 for i,p in enumerate(doc.pages):
  print('PAGE',i+1)
  for line in p.extract_text_lines()[:4]: print(round(line['x0'],2),round(line['top'],2),line['text'][:110])
  starts={}
  for w in p.extract_words():
   if w['top']<780: starts[round(w['x0'])]=starts.get(round(w['x0']),0)+1
  print(sorted(starts.items(),key=lambda a:-a[1])[:12])
