import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';

const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../..');
const name='gmos-studio',version='0.1.0',output=path.join(root,'plugin',name),dist=path.join(root,'dist');
const ateliers=JSON.parse(await fs.readFile(path.join(root,'ateliers.json'),'utf8'));
const files=new Map(),sources=[],sha=b=>createHash('sha256').update(b).digest('hex');
const put=(p,value)=>{assert.ok(!p.startsWith('/')&&!p.split('/').includes('..'));files.set(p,Buffer.isBuffer(value)?value:Buffer.from(value));};
async function tree(dir,prefix=''){
 const result=[];for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const relative=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Lien symbolique interdit : '+relative);
  if(entry.isDirectory()){assert.ok(!['node_modules','.git','__pycache__'].includes(entry.name));result.push(...await tree(path.join(dir,entry.name),relative+'/'));}
  else if(entry.isFile())result.push(relative);
 }return result;
}
const bodyOf=text=>{assert.match(text,/^---\r?\n/);return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');};
for(const a of ateliers){
 const dir=path.resolve(root,a.source),original=await fs.readFile(path.join(dir,'SKILL.md'),'utf8');
 assert.ok(dir.startsWith(path.join(repo,'outils')+path.sep),'Source hors des outils du dépôt');
 const base='skills/'+a.id+'/';const copied=[];
 for(const relative of await tree(dir)){
  if(relative==='SKILL.md'||relative.startsWith('agents/')||relative.startsWith('lookup/'))continue;
  assert.ok(/^(references|scripts|tools)\//.test(relative),'Composant inattendu : '+relative);
  const bytes=await fs.readFile(path.join(dir,relative));put(base+relative,bytes);copied.push(relative);
 }
 // Contrats actuels du dépôt et socle SDK : ils priment sur les copies anciennes.
 const overlays=['theme','fiche'].includes(a.id)?[
  ...['Cahier-des-charges-theme-de-jeu.md','Cahier-des-charges-fiche-de-personnage.md','Pipeline-des-themes.md','Pipeline-des-fiches.md','Flux-des-constructeurs.md'].map(file=>['references/'+file,'documentation/Architecture/'+file]),
  ...(a.id==='theme'?[['references/rpg-core.css','docs/ui/rpg-theme-sdk/rpg-core.css']]:[])
 ]:[];
 for(const [relative,from]of overlays){
  let bytes=await fs.readFile(path.join(repo,from));
  if(/(?:Pipeline|Flux)-/.test(relative))bytes=Buffer.from(bytes.toString('utf8').replaceAll('../../outils/rpg-theme-builder/','../../theme/SKILL.md').replaceAll('../../outils/rpg-sheet-builder/','../../fiche/SKILL.md'));
  put(base+relative,bytes);if(!copied.includes(relative))copied.push(relative);
 }
 const refs=copied.filter(p=>p.startsWith('references/')).sort();
 if(refs.length)put(base+'lookup/knowledge-index.json',JSON.stringify({files:refs.map(p=>({name:path.posix.basename(p),path:p}))},null,2)+'\n');
 const intro=[
  '# Atelier '+a.pluginSource+' — GM-OS Studio','',
  'Appliquer cette méthode uniquement à l’atelier choisi. Pour changer de tâche ou afficher le menu, lire [l’accueil](../accueil/SKILL.md). Les formats et interdits de cet atelier ne s’appliquent pas aux autres ateliers.',
  '',
  ...(refs.length?['## Références incluses','',...refs.map(p=>'- ['+path.posix.basename(p)+'](<'+p+'>)'),'',
   'Les noms de fichiers cités sans chemin dans la méthode ci-dessous désignent ces références. Dans le dépôt GM-OS, les contrats actuels du dépôt restent prioritaires.','']:[]),
  '## Méthode de l’atelier',''
 ].join('\n');
 const content='---\n'+YAML.stringify({name:a.id,description:a.description})+'---\n\n'+intro+bodyOf(original);
 put(base+'SKILL.md',content);
 put(base+'agents/openai.yaml',YAML.stringify({interface:{display_name:a.pluginSource,short_description:['Atelier',a.id,'de GM-OS Studio'].join(' '),default_prompt:'Dans GM-OS Studio, utilise l’atelier '+a.pluginSource+' pour ma demande et ses fichiers.'},policy:{allow_implicit_invocation:true}}));
 sources.push({atelier:a.id,plugin:a.pluginSource,versionSource:a.versionSource,source:a.source,originalSkillSha256:sha(original),bodySha256:sha(bodyOf(original)),overlays:overlays.map(([file,from])=>({file,source:from})),files:copied.map(relative=>({path:relative,sha256:sha(files.get(base+relative))}))});
}
const menu=ateliers.map(a=>`| ${a.numero} | ${a.nom} | [${a.pluginSource}](../${a.id}/SKILL.md) |`).join('\n');
const accueil=(await fs.readFile(path.join(root,'accueil.md'),'utf8')).replace('<!-- ATELIERS -->','| Choix | Objectif | Méthode à lire |\n| --- | --- | --- |\n'+menu);
put('skills/accueil/SKILL.md','---\n'+YAML.stringify({name:'accueil',description:'Accueil et orientation de GM-OS Studio. Toujours utiliser lorsque GM-OS Studio est invoqué, quand l’utilisateur demande le menu, choisit un numéro ou souhaite préparer un nouveau jeu. Afficher les six ateliers si l’objectif manque ; sinon charger directement la méthode spécialisée.'})+'---\n\n'+accueil);
put('skills/accueil/agents/openai.yaml',YAML.stringify({interface:{display_name:'GM-OS Studio — accueil',short_description:'Choisir parmi les six ateliers',default_prompt:'Affiche le menu GM-OS Studio et demande-moi ce que je veux préparer.'},policy:{allow_implicit_invocation:true}}));
const manifest={
 '$schema':'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',name,version,
 description:'Un accueil et six ateliers pour préparer un jeu dans GM-OS : thème, fiche interactive, identité visuelle, bannière, table des matières et extraction de cartes.',
 author:{name:'David'},keywords:['GM-OS','jeu de rôle','thème','fiche','bannière','sommaire','cartes'],
 extensions:{'com.openai':{interface:{
  displayName:'GM-OS Studio',shortDescription:'Six ateliers pour vos jeux',
  longDescription:'Choisissez votre travail dans un menu conversationnel ou formulez directement votre demande. Réunit RPG Theme Builder, Character Sheet HTML Studio, RPG Visual Identity Builder, RPG Banner Builder, TOC Extractor et Extracteur de cartes, avec leurs contrats, références et outils. Parcours Préparer un nouveau jeu, sans intégration automatique aux campagnes.',
  developerName:'David',category:'Productivity',capabilities:[],logo:'./assets/icon.svg',composerIcon:'./assets/icon.svg',
  defaultPrompt:['Affiche le menu GM-OS Studio et demande-moi ce que je veux préparer.','Je veux préparer un nouveau jeu : aide-moi à choisir les ateliers utiles.','Voici mes fichiers et mon objectif : utilise directement le bon atelier.']
 }}}
};
put('plugin.json',JSON.stringify(manifest,null,2)+'\n');
put('assets/icon.svg','<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect x="8" y="8" width="240" height="240" rx="48" fill="#23383f"/><g fill="none" stroke="#f1ead6" stroke-width="5"><rect x="47" y="55" width="68" height="40" rx="6"/><rect x="141" y="55" width="68" height="40" rx="6"/><rect x="47" y="108" width="68" height="40" rx="6"/><rect x="141" y="108" width="68" height="40" rx="6"/><rect x="47" y="161" width="68" height="40" rx="6"/><rect x="141" y="161" width="68" height="40" rx="6"/></g><g fill="#d4b673"><circle cx="81" cy="75" r="9"/><path d="M160 69h30v6h-30zm0 11h22v5h-22zM68 121h26v14H68zM160 119h30v18h-30zM68 174h25v4H68zm0 8h25v4H68zm0 8h19v4H68zM161 173h18v21h-18zm12-5h18v21h-6v-15h-12z"/></g></svg>\n');
put('sources.json',JSON.stringify({date:'2026-10-17',sources},null,2)+'\n');
put('README.md',await fs.readFile(path.join(root,'README-plugin.md')));
assert.equal(ateliers.length,6);assert.equal(new Set(ateliers.map(a=>a.id)).size,6);
assert.ok(manifest.extensions['com.openai'].interface.shortDescription.length<=30);
for(const [relative,bytes]of files){const dest=path.join(output,relative);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes);}
const actual=await tree(output);assert.deepEqual(actual.sort(),[...files.keys()].sort(),'Fichiers obsolètes ou inattendus dans le paquet');
await fs.mkdir(dist,{recursive:true});
const archive=path.join(dist,name+'-'+version+'.zip');
const bytes=zipSync(Object.fromEntries([...files].map(([relative,b])=>[name+'/'+relative,new Uint8Array(b)])),{level:9,mtime:new Date('2026-10-17T00:00:00Z')});
await fs.writeFile(archive,bytes);const unpacked=unzipSync(await fs.readFile(archive));
assert.equal(Object.keys(unpacked).length,files.size);
for(const [relative,b]of files)assert.equal(sha(unpacked[name+'/'+relative]),sha(b),'Archive différente : '+relative);
const report={name,version,archive,bytes:bytes.length,files:files.size,skills:7,ateliers:ateliers.map(a=>({id:a.id,nom:a.pluginSource,version:a.versionSource})),archiveSha256:sha(bytes),checks:['Six ateliers et un accueil distincts','Méthodes originales conservées intégralement hors métadonnées','Contrats actuels du dépôt prioritaires','Outils, références et PDF inclus','Aucun lien symbolique ou dépendance de serveur','Archive relue, tous les fichiers comparés par SHA-256']};
await fs.writeFile(path.join(dist,'verification-construction.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
