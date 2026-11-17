import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
const root=process.cwd(),proof='documentation/Planning/vampire-studio-20261117';
for(const [script,target,file]of [['theme-valider.mjs','vampire','validation-theme.json'],['fiche-valider.mjs','Vampire','validation-fiche.json']]){
 const r=spawnSync(process.execPath,[`scripts/${script}`,target,'--json'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr||r.stdout);
 const parsed=JSON.parse(r.stdout);
 fs.writeFileSync(path.join(proof,file),JSON.stringify(parsed,null,2)+'\n');
}
const files=[];
const add=(src,target)=>files.push({src,target});
function folder(src,target){for(const e of fs.readdirSync(src,{withFileTypes:true})){const f=path.join(src,e.name);if(e.isDirectory())folder(f,`${target}/${e.name}`);else add(f,`${target}/${e.name}`);}}
folder('docs/systems/vampire/theme','Vampire/theme');
folder('docs/systems/vampire/references-visuelles','Vampire/references-visuelles');
add('docs/systems/vampire/Vampire Band.jpg','Vampire/Vampire Band.jpg');
add('docs/systems/vampire/identite-visuelle.txt','Vampire/identite-visuelle.txt');
add('docs/fiches/Vampire/vampire-v5-fiche-personnage-interactive.html','Vampire/fiche/vampire-v5-fiche-personnage-interactive.html');
add('documentation/Planning/2026-11-17-vampire-banniere-prompt.txt','Vampire/banniere-prompt.txt');
const zip=new AdmZip();
const manifest={date:'2026-11-17',jeu:'Vampire La Mascarade V5',files:files.map(({src,target})=>{const bytes=fs.readFileSync(src);zip.addFile(target,bytes);return{path:target,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};})};
const readme=`Vampire V5 — GM-OS Studio — 17/11/2026

Quatre éléments :
- Vampire/theme/ : conserver tout le dossier (theme.css, SVG et manifestes).
- Vampire/Vampire Band.jpg : 2400 x 600, 129 015 octets ; choisir comme Bannière de l'en-tête du pilote.
- Vampire/fiche/vampire-v5-fiche-personnage-interactive.html : ouvrir directement, ou importer par + Modèle dans le moteur de fiches. Deux pages, 455 zones, 181 clés.
- Vampire/identite-visuelle.txt : copier STYLE et AVOID dans les champs du pilote ; quatre images dans references-visuelles/.

Thème ivoire/bordeaux, cadre sombre ; trois ornements, une matière, quinze icônes.
Validateur du thème : zéro erreur, zéro avertissement.
Fiche : zéro erreur ; deux avertissements attendus (nouveau modèle, correspondance absente).
Le modèle n'est pas intégré automatiquement à GM-OS et les valeurs ne sont pas encore reliées aux champs du pilote. Ce raccord doit suivre l'examen d'un export Vampire.

Santé/Volonté : clics successifs vide, / superficiel, X aggravé, vide. Capacités manuelles ; aucune règle calculée. Les autres pistes sont numériques. Zoom, sauvegarde locale, JSON, réinitialisation et impression sont disponibles hors ligne.

Bannière créée avec l'outil natif, puis recadrée et agrandie de 10,5 % depuis 2172 x 724 avec l'accord de David. Aucun détail supplémentaire n'est revendiqué. Prompt inclus.
Le bloc d'identité est limité à 35 mots STYLE et 13 mots AVOID.

Sources : références fournies par David ; le corpus forgé reste intact et n'a pas été audité dans cet atelier.
manifest.json contient les SHA-256 des fichiers livrés.
`;
zip.addFile('LIRE-MOI.txt',Buffer.from(readme));
zip.addFile('manifest.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
const out=path.join(root,'output/gmos-studio/Vampire-2026-11-17.zip');fs.mkdirSync(path.dirname(out),{recursive:true});
zip.writeZip(out);
const check=new AdmZip(out);
for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(check.readFile(f.path)).digest('hex'),f.sha256);
console.log(JSON.stringify({archive:out,fichiers:manifest.files.length,octets:fs.statSync(out).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex')},null,2));
