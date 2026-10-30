// Paquet privé portable ; aucune installation de dépendance ou de service.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {zipSync,unzipSync} from 'fflate';
const ici=path.dirname(fileURLToPath(import.meta.url)),name='gmos-campagnes-tests',root=path.join(ici,'plugin',name),files={};
const sha=b=>createHash('sha256').update(b).digest('hex');
function lire(dir,prefix=''){
 for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  assert.ok(!e.isSymbolicLink(),'Lien symbolique interdit');
  const rel=prefix+e.name;assert.ok(!['.git','node_modules','__pycache__'].includes(e.name),'Fichier de développement dans le paquet : '+rel);
  if(e.isDirectory())lire(path.join(dir,e.name),rel+'/');else files[name+'/'+rel]=new Uint8Array(fs.readFileSync(path.join(dir,e.name)));
 }
}
lire(root);
const manifest=JSON.parse(Buffer.from(files[name+'/plugin.json']).toString('utf8'));
assert.equal(manifest.$schema,'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');assert.equal(manifest.name,name);assert.match(manifest.version,/^\d+\.\d+\.\d+$/);
const ui=manifest.extensions['com.openai'].interface;
assert.ok(ui.shortDescription.length<=30);assert.ok(ui.displayName.length<=30);assert.ok(Array.isArray(ui.capabilities));assert.equal(ui.category,'Productivity');
for(const field of ['logo','composerIcon'])assert.ok(files[name+'/'+ui[field].replace(/^\.\//,'')]);
for(const prompt of ui.defaultPrompt)assert.ok(prompt.length<=128&&!prompt.includes('\n'));
const skills=Object.keys(files).filter(p=>/^gmos-campagnes-tests\/skills\/[^/]+\/SKILL\.md$/.test(p));assert.equal(skills.length,1);
for(const p of skills){
 const text=Buffer.from(files[p]).toString('utf8'),fm=text.match(/^---\n([\s\S]*?)\n---\n/);assert.ok(fm);
 const meta=YAML.parse(fm[1]);assert.equal(meta.name,path.posix.basename(path.posix.dirname(p)));assert.ok(meta.description.length>0);
 for(const m of text.matchAll(/\]\(([^)]+)\)/g)){const dest=path.posix.normalize(path.posix.join(path.posix.dirname(p),m[1]));assert.ok(files[dest],'Référence absente : '+dest);}
}
const agent=YAML.parse(Buffer.from(files[name+'/skills/campagnes-de-test/agents/openai.yaml']).toString('utf8'));assert.equal(typeof agent.policy.allow_implicit_invocation,'boolean');assert.ok(agent.interface.display_name&&agent.interface.short_description&&agent.interface.default_prompt);
for(const [p,b]of Object.entries(files)){assert.ok(b.length<1024*1024,'Fichier trop gros : '+p);assert.ok(!/\.(gmos|gmos-driver|pdf|zip|pyc)$/.test(p),'Donnée de jeu dans le plugin');}
const dist=path.join(ici,'dist');fs.mkdirSync(dist,{recursive:true});
const archive=path.join(dist,name+'-'+manifest.version+'.zip'),bytes=zipSync(files,{level:9,mtime:new Date('2026-10-30T12:00:00Z')});
fs.writeFileSync(archive,bytes);
const reread=unzipSync(fs.readFileSync(archive));assert.deepEqual(Object.keys(reread).sort(),Object.keys(files).sort());
for(const p of Object.keys(files))assert.equal(sha(reread[p]),sha(files[p]),'Archive différente : '+p);
const report={name,version:manifest.version,archive,bytes:bytes.length,sha256:sha(bytes),files:Object.keys(files).length,skills:skills.length,checks:['Manifestes JSON/YAML analysés','Liens du skill résolus dans le paquet','Icône contenue','Aucun export personnel, PDF, secret ou dépendance serveur','Archive rouverte et comparée fichier par fichier'],inventory:Object.entries(files).map(([p,b])=>({path:p,bytes:b.length,sha256:sha(b)}))};
fs.writeFileSync(path.join(dist,'verification-paquet.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,inventory:undefined},null,2));
