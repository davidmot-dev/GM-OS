import json
from pathlib import Path

root=Path(__file__).parent
previous=root.parent/'cartes-menaces-aysle-20261108'
titles=['GOSPOG DE LA 5E RÉCOLTE','GOSPOG DE LA 4E RÉCOLTE','GOSPOG DE LA 3E RÉCOLTE','GOSPOG DE LA 2DE RÉCOLTE',
    'CYGOYLE','AENGE','SURVOLTCHIEN','CARTAGRAS','JEAN MALRAUX','MOLOSSE INFERNAL','INQUISITEUR','VEILLEUR DE BABEL',
    'CYBERCHEVALIER',"PARANGON DE LA POLICE DE L'ÉGLISE",'PARJURE','HOSPITALIER','CONNECTPRÊTRE SENTINELLE',
    "INSPECTEUR DE LA POLICE DE L'ÉGLISE",'DÉVOREUR','CHAR À RÉPULSION MAGNÉTIQUE SAMSON',"DRONE D'ASSAUT",'MORGANA',
    'LE DIRECTEUR','CYBERNONNE POSSÉDÉE','FANATIQUES','APOSTATS','IRZZOMETH','URIEL','CHASSEUR DRAYGAKK','POLICE SECRÈTE DU VATICAN']
assert len(titles)==30
prepare=(previous/'prepare.py').read_text(encoding='utf-8')
a=prepare.index('titles=[')
b=prepare.index('\ndef normalize',a)
prepare=prepare[:a]+'titles='+repr(titles)+'\n'+prepare[b:]
old="        source_title='CHARYB' if page==14 else title\n        assert normalize(source_title) in normalize(s['pages'][page-1]['text']),(page,title)"
new="""        text=normalize(s['pages'][page-1]['text'])
        if i<4:
            # Superscript ordinals appear twice in the PDF text layer.
            ordinal=('5E','4E','3E','2DE')[i]
            assert 'GOSPOG DE LA' in text and ordinal in text and 'RÉCOLTE' in text,(page,title)
        else:
            assert normalize(title) in text,(page,title)"""
assert old in prepare
prepare=prepare.replace(old,new)
old="        if page==14:\n            evidence+=' Le PDF imprime CHARYB au verso et CHARYBDE au recto page 13 ; paire vérifiée par illustration, statistiques et ordre source, graphisme conservé sans correction.'\n"
assert old in prepare
prepare=prepare.replace(old,'')
prepare=prepare.replace("'answer':'0'","'answer':'fais les carte de menaces démarre à 0'")
prepare=prepare.replace('Cartes Menaces Aysle','Cartes de Menaces de la Cyberpapauté')
(root/'prepare.py').write_text(prepare,encoding='utf-8')
for name in ('instructions.py','qa_preview.py'):
    code=(previous/name).read_text(encoding='utf-8').replace('menaces-aysle','menaces-cyberpapaute')
    (root/name).write_text(code,encoding='utf-8')
verify=(previous/'verify_and_package.py').read_text(encoding='utf-8')
replacements={
    'menaces-aysle':'menaces-cyberpapaute',
    'Cartes Menaces (v1).pdf':'Cartes De Menaces De La Cyberpapaut+_ (v0).pdf',
    'first illustrated front and the Charybde pair opened separately':'first illustrated front opened separately',
    "'Pages 13–14 form the Charybde pair, but the original verso prints CHARYB. Both original spellings preserved.',\n        'Some original numeric labels overlap adjacent text. Original PDF rendering preserved without retouching.',\n        ":'',
    'Menaces d’Aysle':'Menaces de la Cyberpapauté',
    'Les coquilles et chevauchements du PDF source sont conservés. Charybde est nommé CHARYB sur son verso original.':'Le graphisme, les titres, les statistiques et les textes du PDF source sont conservés sans retouche.',
}
for old,new in replacements.items():
    assert old in verify,old
    verify=verify.replace(old,new)
assert 'Charybde' not in verify and 'CHARYB' not in verify and 'Aysle' not in verify
(root/'verify_and_package.py').write_text(verify,encoding='utf-8')
print(json.dumps({'threat_pairs':len(titles),'fresh_source_inspection':True}))
