from pathlib import Path

root=Path(__file__).parent
previous=root.parent/'cartes-cyberware-20261108'
for name in ('prepare.py','verify_and_package.py'):
    code=(previous/name).read_text(encoding='utf-8')
    code=code.replace('Cyberware Deck (v0).pdf','Objets Magiques (v0).pdf')
    code=code.replace('Cyberware Deck','Objets Magiques')
    code=code.replace('Cyberware','Objets Magiques').replace('cyberware','objets-magiques')
    code=code.replace('fais ce paquet comme à 0','fais celui-ci ensuite commence à 0')
    assert 'cyberware' not in code.lower()
    (root/name).write_text(code,encoding='utf-8')
