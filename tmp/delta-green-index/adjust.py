from pathlib import Path
p=Path('tmp/delta-green-index/join.py')
s=p.read_text(encoding='utf8')
s=s.replace("if continuation: prev['text']+=' '+t", "if pt in {'compétences','dégâts','Professions','renseignement','expérience'}: continuation=False\n if pt in {'connaissance approfondie d’une','améliorer des compétences ou des'}: continuation=True\n if continuation: prev['text']+=' '+t")
p.write_text(s,encoding='utf8')
