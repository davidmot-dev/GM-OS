from pathlib import Path
import json
import pypdfium2 as pdfium
import pdfplumber

root=Path(__file__).resolve().parents[2]
source=root/'docs/Reference/Argyropée'
dest=Path(__file__).parent
for path in source.glob('*.pdf'):
    name='fiche' if 'Fiche PJ' in path.name else 'toc' if '_TOC' in path.name else 'index' if '_index' in path.name else 'livre'
    doc=pdfium.PdfDocument(str(path))
    print(name,len(doc),[doc[i].get_size() for i in range(min(len(doc),3))])
    with pdfplumber.open(path) as pdf:
        texts=[]
        for i,p in enumerate(pdf.pages):
            texts.append(f'\n--- PAGE {i+1} ---\n'+(p.extract_text(layout=True) or ''))
            if name!='livre' or i<3:
                doc[i].render(scale=1.5).to_pil().save(dest/f'{name}-{i+1}.png')
        (dest/f'{name}.txt').write_text('\n'.join(texts),encoding='utf-8')
        if name=='fiche':
            (dest/'fiche-mots.json').write_text(json.dumps([p.extract_words() for p in pdf.pages],ensure_ascii=False,indent=2),encoding='utf-8')
