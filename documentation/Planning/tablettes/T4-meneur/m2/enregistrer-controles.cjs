// Consigner les journaux de cette execution avant le nettoyage des temporaires.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const formats = ['compact','telephone','portrait','paysage','pupitre'];
function journal(f) { const b=fs.readFileSync(f); return b[0]===255 ? b.toString('utf16le') : b.toString('utf8'); }
for (const [f,n] of [['.tmp-m2-e2e.log',35],['.tmp-m2-compact-final.log',8],['.tmp-m2-regressions.log',81],['.tmp-m2-manuel.log',6],['.tmp-m2-unites.log',201]]) {
  if(!journal(f).includes(n+' passed')) throw Error('Missing validated result: '+f);
}
const lint=JSON.parse(fs.readFileSync(path.join(__dirname,'lint-compare.json'),'utf8'));
const galerie=JSON.parse(fs.readFileSync(path.join(__dirname,'galerie-controles.json'),'utf8'));
if(lint.nouveaux || galerie.erreurs.length || galerie.vues!==116) throw Error('Review incomplete');
const empreinte = source => ({source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')});
const sources=[...lint.fichiers.map(f=>f.fichier),'documentation/User Guides/60-Tablette-du-meneur.md'].map(empreinte);
const captures=formats.flatMap(f=>fs.readdirSync(path.join(__dirname,f)).filter(n=>n.endsWith('.png')).map(n=>path.relative(process.cwd(),path.join(__dirname,f,n)).replaceAll('\\','/'))).map(empreinte);
if(captures.length!==116) throw Error('Unexpected PNG count');
const manuelCaptures=['sons','scenario','tableau','notes','messages'].map(n=>empreinte('documentation/User Guides/captures/tablette-du-meneur-'+n+'.jpg'));
const resultat={date:'2026-10-06',lot:'T4/M2 meneur',autorisation:'David demande continue apres M1. Sa confirmation GM-OS eteint reste valable ; aucun essai physique de M1 declare.',
  construction:{types:0,code:0},unites:{fichiers:26,reussis:201,code:0},
  e2e:{m2Complet:{total:35,code:0},rejeuCompactAvecCheminLong:{total:8,code:0},m2DistinctsValides:36,regressions:{m1:37,t0:44,total:81,code:0},distinctsValides:117,echecsAttendus:0,manuel:{total:6,code:0}},
  lint:{fichiers:lint.fichiers.length,nouveaux:lint.nouveaux},galerie:{vues:116,erreurs:[],regardees:true,planches:galerie.planches},sources,captures,manuelCaptures,
  limites:['Seconde demande de synchronisation T0 conservee : course initiale du serveur non corrigee.','Gardes de presentation : pas un audit des donnees reseau.','Appareils physiques, Safari, clavier virtuel et veille a eprouver en T6.','Les captures Sons et Messages du manuel montrent les etats vides de la campagne de demonstration.','M2 pret pour un essai de David ; T5 et T6 restent ouverts.'],commit:false,push:false};
fs.writeFileSync(path.join(__dirname,'controles-integration.json'),JSON.stringify(resultat,null,2));
console.log('117 scenarios, 201 tests unitaires, 116 PNG et 5 JPEG consignes.');
