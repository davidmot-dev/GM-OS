const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const formats = ['compact','telephone','portrait','paysage','pupitre'];
function journal(f) { const b=fs.readFileSync(f); return b[0]===255 ? b.toString('utf16le') : b.toString('utf8'); }
if(!/80 passed/.test(journal('.tmp-m1-final.log'))) throw Error('Missing full regression');
if(!/20 passed/.test(journal('.tmp-m1-resultats.log'))) throw Error('Missing final dice replay');
if(!/201 passed/.test(journal('.tmp-m1-tests-revue.log'))) throw Error('Missing unit results');
const manuel=journal('.tmp-m1-revue.log');
if(!/14 passed/.test(manuel) || !/tablette-du-meneur-combat/.test(manuel)) throw Error('Missing manual results');
const lint=JSON.parse(fs.readFileSync(path.join(__dirname,'lint-compare.json'),'utf8'));
const galerie=JSON.parse(fs.readFileSync(path.join(__dirname,'galerie-controles.json'),'utf8'));
if(lint.nouveaux || galerie.erreurs.length || galerie.vues!==66) throw Error('Review incomplete');
const empreinte = source => ({source, sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')});
const sources=[...lint.fichiers.map(f=>f.fichier),'documentation/User Guides/60-Tablette-du-meneur.md'].map(empreinte);
const captures=formats.flatMap(f=>fs.readdirSync(path.join(__dirname,f)).filter(n=>n.endsWith('.png')).map(n=>path.relative(process.cwd(),path.join(__dirname,f,n)).replaceAll('\\','/'))).map(empreinte);
if(captures.length!==66) throw Error('Unexpected PNG count');
const manuelCaptures=['tablette-du-meneur','tablette-du-meneur-des','tablette-du-meneur-combat'].map(n=>empreinte('documentation/User Guides/captures/'+n+'.jpg'));
const resultat={date:'2026-10-06',lot:'T4/M1 meneur',autorisation:'David confirme GM-OS eteint, puis demande commence M1 et continue.',
  construction:{types:0,code:0},unites:{fichiers:26,reussis:201,code:0},
  e2e:{passageComplet:{m1:36,t0:44,total:80,code:0},relecture:{total:15,reussis:14,echecs:['Le resultat long perdait sa fermeture apres defilement.'],manuelReussis:4},dernierRejeuDes:{m1:12,t0:8,total:20,code:0},distinctsValidesApresRejeu:81,echecsAttendus:0},
  lint:{fichiers:lint.fichiers.length,nouveaux:lint.nouveaux},galerie:{vues:66,erreurs:[],regardees:true,planches:galerie.planches},sources,captures,manuelCaptures,
  limites:['La seconde demande de synchronisation T0 reste utilisee : course initiale du serveur non corrigee.','Les protections de presentation ne constituent pas un audit des donnees transportees.','Pas de validation des appareils physiques, de Safari ou des mises en veille.','M1 pret pour un essai de David avant M2.'],commit:false,push:false};
fs.writeFileSync(path.join(__dirname,'controles-integration.json'),JSON.stringify(resultat,null,2));
console.log('81 scenarios valides apres rejeu ; 201 tests unitaires, 66 PNG et 3 JPEG consignes.');
