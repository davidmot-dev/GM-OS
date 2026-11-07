import fs from 'node:fs';
const d='output/campagnes-tests/runequest';
const i=JSON.parse(fs.readFileSync(d+'/inventaire.json'));
const texte=JSON.stringify({archives:i.archives.map(({fichier,sha256})=>({fichier,sha256})),assertions:'runequest.test.ts ; résultat global dans verification-archives.json'},null,2)+'\n';
fs.writeFileSync('tmp/rq-a1/contexte-original.json',texte);
fs.copyFileSync('tmp/rq-a1/contexte-original.json',d+'/verification-contexte.json');
console.log('Rapport de contexte restauré aux trois empreintes effectivement testées.');
