// Références retenues le 06/10/2026 : copie exacte des propositions corrigées.
import {constants} from 'node:fs';
import {readFile,readdir,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const racine=new URL('.',import.meta.url),copies=[];
const chemin=u=>relative(fileURLToPath(new URL('../../../',racine)),fileURLToPath(u)).split(sep).join('/');
const hash=b=>createHash('sha256').update(b).digest('hex');
async function copier(source,cible){await mkdir(new URL('.',cible),{recursive:true});const contenu=await readFile(source);try{await copyFile(source,cible,constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST'||hash(await readFile(cible))!==hash(contenu))throw e;}if(hash(await readFile(cible))!==hash(contenu))throw Error('Copie différente : '+cible);copies.push({source:chemin(source),cible:chemin(cible),sha256:hash(contenu)});}
async function arbre(source,cible){await mkdir(cible,{recursive:true});for(const entry of await readdir(source,{withFileTypes:true})){if(entry.isDirectory())await arbre(new URL(entry.name+'/',source),new URL(entry.name+'/',cible));else await copier(new URL(entry.name,source),new URL(entry.name,cible));}}
for(const [dossier,cible,noms,annexes] of [
 ['T3-propositions','tablettes-joueurs',['accueil','direct','inventaire','cartes','archives','pnj','lieux','messages','notifications'],['j2.css']],
 ['T3-meneur-propositions','tablette-meneur',['pads','des','combat','sons','scenario','tableau','notes','messages'],['meneur.css','donnees-demo.json']],
]){
 const source=new URL(dossier+'/',racine),destination=new URL('../stitch/'+cible+'/',racine);
 for(const nom of noms)for(const format of ['telephone','paysage'])await copier(new URL(nom+'-'+format+'.html',source),new URL(nom+'-'+format+'.html',destination));
 for(const f of [...annexes,'ecrans.json','controles.json'])await copier(new URL(f,source),new URL(f,destination));
 await arbre(new URL('assets/',source),new URL('assets/',destination));await arbre(new URL('rendus/',source),new URL('rendus/',destination));
}
await writeFile(new URL('T3-references-retenues.json',racine),JSON.stringify({date:'2026-10-06',decision:'ok c’est bon pour moi, est-ce que t3 est fini ?',portee:'Accord consigné pour toutes les propositions présentées J1/J2/M1/M2.',copies},null,2));console.log(copies.length+' références archivées, identiques aux propositions corrigées (SHA-256).');
