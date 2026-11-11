from pathlib import Path

root=Path(__file__).parent
code=(root.parent/'cartes-terre-vivante-20261108/verify_and_package.py').read_text(encoding='utf-8')
replacements={
    'output/cartes/torg/terre-vivante':'output/cartes/torg/cyberware',
    'Paquet Bonus Terre Vivante (v1).pdf':'Cyberware Deck (v0).pdf',
    "expected={'action':(120,40,(1040,745)), 'cosm-terre-vivante':(10,10,(745,1040)), 'destin':(71,5,(745,1040))}":"expected={'cyberware':(0,55,(745,1040))}",
    "[('action',2),('cosm-terre-vivante',82),('destin',102)]":"[('cyberware',2)]",
    'len(checks)==58':'len(checks)==56',
    'len(duplicates)==52':'len(duplicates)==54',
    "'distinct_backs':3":"'distinct_backs':1",
    "'jpeg_cards':58":"'jpeg_cards':56",
    "'replay_identical_jpeg_count':58":"'replay_identical_jpeg_count':56",
    "'duplicate_backs_identical_at_300dpi':52":"'duplicate_backs_identical_at_300dpi':54",
    ")==58":")==56",
    "'replay_identical':58":"'replay_identical':56",
    'Terre Vivante — extraction':'Cyberware — extraction',
    "'Action : 120.jpg à 159.jpg et back.jpg (paysage).\\n'\n    'Cosm Terre Vivante : 10.jpg à 19.jpg et back.jpg (portrait).\\n'\n    'Destin : 71.jpg à 75.jpg et back.jpg (portrait).\\n\\n'":"'Cyberware : 0.jpg à 54.jpg et back.jpg (portrait).\\n\\n'",
    '58 JPEG identiques':'56 JPEG identiques',
    '52 répétitions de dos':'54 répétitions de dos',
    'terre-vivante-rejoue':'cyberware-rejoue',
}
for old,new in replacements.items():
    assert old in code,old
    code=code.replace(old,new)
assert 'terre-vivante' not in code and '58' not in code and '52' not in code
(root/'verify_and_package.py').write_text(code,encoding='utf-8')
