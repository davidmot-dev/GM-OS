import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';

const root=path.dirname(fileURLToPath(import.meta.url)),name='rpg-banner-builder',version='0.1.0';
const repo=path.resolve(root,'../..'),folder=path.join(root,'plugin',name),dist=path.join(root,'dist');
const instructions=await fs.readFile(path.join(root,'instructions.md'),'utf8');
const source=await fs.readFile(path.join(repo,'documentation/Planning/2026-10-04-prompts-bannieres.md'),'utf8');
const skill='---\n'+YAML.stringify({name:'create-banner',description:'Créer ou retoucher une bannière panoramique de jeu de rôle ou de campagne pour GM-OS. Utiliser pour générer l’image, construire son prompt, harmoniser sa palette, vérifier le cadrage central de l’en-tête ou préparer un JPG/WebP 4:1 sous 500 Ko. Utiliser dès que RPG Banner Builder est invoqué.'})+'---\n\n'+instructions;
const manifest={
 '$schema':'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',name,version,
 description:'Crée les bannières panoramiques des jeux et campagnes GM-OS, prépare leur invite et contrôle leur cadrage et leur export JPG/WebP.',
 author:{name:'David'},keywords:['GM-OS','bannière','jeu de rôle','panorama','image'],
 extensions:{'com.openai':{interface:{
  displayName:'RPG Banner Builder',shortDescription:'Bannières de jeux pour GM-OS',
  longDescription:'Prépare et génère les bannières avec l’outil d’images disponible : composition 4:1, détails dans le ruban central, bords calmes, cohérence avec l’identité visuelle. Inclut un outil hors ligne de recadrage, aperçu d’en-tête et export JPG/WebP 2400 × 600 sous 500 Ko. Sans serveur ni connexion automatique à GM-OS.',
  developerName:'David',category:'Productivity',capabilities:[],logo:'./assets/icon.svg',composerIcon:'./assets/icon.svg',
  defaultPrompt:[
   'Crée une bannière GM-OS pour mon jeu à partir de son univers et de son identité visuelle.',
   'Voici mes références : génère une bannière 4:1 dont la bande centrale reste lisible dans GM-OS.',
   'Adapte cette bannière à ma campagne et vérifie son cadrage dans un en-tête de 54 px.'
  ]
 }}}
};
const icon='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect x="8" y="8" width="240" height="240" rx="48" fill="#23383f"/><rect x="37" y="68" width="182" height="120" rx="8" fill="none" stroke="#f1ead6" stroke-width="7"/><path d="M41 147l46-34 28 18 27-24 72 40" fill="none" stroke="#86a8b1" stroke-width="7" stroke-linejoin="round"/><path d="M38 117h180v24H38z" fill="#d4b673" fill-opacity=".45"/><path d="M38 117h180M38 141h180" stroke="#d4b673" stroke-width="3"/><path d="M57 46v14m142-14v14M57 196v14m142-14v14" stroke="#f1ead6" stroke-width="5" stroke-linecap="round"/></svg>\n';
const files={
 'plugin.json':JSON.stringify(manifest,null,2)+'\n','assets/icon.svg':icon,
 'skills/create-banner/SKILL.md':skill,
 'skills/create-banner/agents/openai.yaml':YAML.stringify({interface:{display_name:'RPG Banner Builder',short_description:'Bannières de jeux pour GM-OS',default_prompt:'Crée la bannière de mon jeu ou de ma campagne pour GM-OS, avec son fichier image, son invite et un cadrage central vérifié.'},policy:{allow_implicit_invocation:true}}),
 'skills/create-banner/references/contrat-bannieres.md':await fs.readFile(path.join(root,'contrat-bannieres.md'),'utf8'),
 'skills/create-banner/references/prompts-historiques.md':source,
 'skills/create-banner/tools/preparer-banniere.html':await fs.readFile(path.join(root,'preparer-banniere.html'),'utf8'),
 'README.md':'# RPG Banner Builder\n\nPlugin privé pour les bannières GM-OS : jeu ou campagne, références facultatives, cohérence avec une identité visuelle fournie, invite anglaise et génération avec l’outil d’images de l’hôte. L’outil HTML joint fonctionne hors ligne pour le recadrage, l’aperçu et l’export à 2400 × 600 en JPG/WebP sous 500 Ko.\n\nLe plugin ne fournit ni modèle d’image, ni serveur, ni accès aux données GM-OS. Si la génération est indisponible, il fournit le prompt et signale cette limite. Choisir le fichier dans l’éditeur du pilote → Bannière de l’en-tête.\n'
};
assert.ok(manifest.extensions['com.openai'].interface.shortDescription.length<=30);
assert.equal(YAML.parse(skill.match(/^---\n([\s\S]*?)\n---/)[1]).name,'create-banner');
assert.equal(YAML.parse(files['skills/create-banner/agents/openai.yaml']).policy.allow_implicit_invocation,true);
for(const match of instructions.matchAll(/\]\(([^)]+)\)/g))assert.ok(files['skills/create-banner/'+match[1]],'Référence manquante : '+match[1]);
assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(files['skills/create-banner/tools/preparer-banniere.html']));
for(const [relative,content]of Object.entries(files)){const file=path.join(folder,relative);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,content,'utf8');}
await fs.mkdir(dist,{recursive:true});
const bytes=zipSync(Object.fromEntries(Object.entries(files).map(([relative,content])=>[name+'/'+relative,strToU8(content)])),{level:9});
const archive=path.join(dist,name+'-'+version+'.zip');await fs.writeFile(archive,bytes);
const entries=unzipSync(await fs.readFile(archive));assert.equal(Object.keys(entries).length,Object.keys(files).length);
for(const [relative,content]of Object.entries(files))assert.equal(strFromU8(entries[name+'/'+relative]),content);
const report={name,version,archive,bytes:bytes.length,files:Object.keys(entries),sourceSha256:createHash('sha256').update(source).digest('hex'),archiveSha256:createHash('sha256').update(bytes).digest('hex'),checks:['Manifest JSON et YAML valides','Sous-titre de 30 caractères au plus','Un skill et toutes ses références présents','Source historique conservée sans modification','Outil HTML sans ressource réseau','Icône vectorielle autonome 256 × 256','Archive de huit fichiers relue et comparée au contenu source']};
await fs.writeFile(path.join(dist,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
