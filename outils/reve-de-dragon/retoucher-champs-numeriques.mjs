// Corriger le livrable existant sans refaire les images ni recréer les champs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {corrigerChampsNumeriques,AIDE_NUMERIQUE_RDD} from './fiche-voyageur/champs-numeriques.mjs';
const racine=fileURLToPath(new URL('../../',import.meta.url));
const cible=process.argv[2]||path.join(racine,'docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html');
let html=fs.readFileSync(cible,'utf8');
const expression=/(<script type="application\/json" id="character-sheet-template">)([\s\S]*?)(<\/script>)/;
const bloc=html.match(expression);assert.ok(bloc,'Manifeste absent');
const manifeste=JSON.parse(bloc[2]),avant=structuredClone(manifeste);
const ancienCss=manifeste.template.customCss;
const elargis=corrigerChampsNumeriques(manifeste.template);
assert.ok(html.includes(`${ancienCss}</style>`),'Copie CSS autonome inattendue : ne pas modifier le reste du HTML.');
html=html.replace(`${ancienCss}</style>`,`${manifeste.template.customCss}</style>`);
html=html.replace(expression,()=>bloc[1]+JSON.stringify(manifeste).replaceAll('<','\\u003c')+bloc[3]);
if(!html.includes(AIDE_NUMERIQUE_RDD))html=html.replace('<h2>Le livret, à l’écran</h2>',`<h2>Le livret, à l’écran</h2><p>${AIDE_NUMERIQUE_RDD}</p>`);
assert.ok(html.includes(AIDE_NUMERIQUE_RDD),'Aide introuvable');
// Le contrat autorise uniquement la CSS et les augmentations de largeur.
const comparaison=structuredClone(manifeste);comparaison.template.customCss=avant.template.customCss;
comparaison.template.pages.forEach((p,i)=>p.fields.forEach((f,j)=>{assert.ok(f.w>=avant.template.pages[i].fields[j].w);f.w=avant.template.pages[i].fields[j].w;}));
assert.deepEqual(comparaison,avant);
for(const p of manifeste.template.pages)for(const [i,a]of p.fields.entries()){
    assert.ok(a.x+a.w<=p.width,`${a.key} sort de la page`);
    for(const b of p.fields.slice(i+1))assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${a.key} recouvre ${b.key}`);
}
fs.writeFileSync(cible,html);
const dossier=path.join(racine,'scratch/reve-de-dragon-fiche/numeriques');fs.mkdirSync(dossier,{recursive:true});
fs.writeFileSync(path.join(dossier,'elargissements.json'),JSON.stringify(elargis,null,2));
console.log(JSON.stringify({id:manifeste.template.id,champsNumeriques:manifeste.template.pages.flatMap(p=>p.fields).filter(f=>f.type==='number').length,elargis:elargis.length,parPage:manifeste.template.pages.map((_,i)=>elargis.filter(f=>f.page===i+1).length),clesInchangees:true}));
