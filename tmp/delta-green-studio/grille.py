import pdfplumber
with pdfplumber.open('docs/Reference/Delta Green/dgmanuel_de_lagent_PJ.pdf') as doc:
 for i,p in enumerate(doc.pages):
  print('PAGE',i+1,'h',sorted(set(round(l['top'],2) for l in p.lines if abs(l['top']-l['bottom'])<.01)))
  print('v',sorted(set(round(l['x0'],2) for l in p.lines if abs(l['x0']-l['x1'])<.01)))
