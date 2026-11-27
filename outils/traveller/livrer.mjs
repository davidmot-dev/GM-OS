import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';

const root=process.cwd(),out=path.resolve('output/gmos-studio/traveller'),controls=path.join(out,'controles');
const sha=data=>createHash('sha256').update(data).digest('hex');
const read=p=>fs.readFileSync(p,'utf8');
const json=(name,value)=>fs.writeFileSync(path.join(controls,name),JSON.stringify(value,null,2)+'\n');
const theme=JSON.parse(execFileSync(process.execPath,['scripts/theme-valider.mjs','traveller','--json'],{encoding:'utf8'}));
const sheets=JSON.parse(execFileSync(process.execPath,['scripts/fiche-valider.mjs','Traveller','--json'],{encoding:'utf8'}));
assert.equal(theme.accepte,true);assert.equal(theme.erreurs.length,0);assert.equal(theme.avertissements.length,0);
assert.equal(sheets.length,1);assert.equal(sheets[0].accepte,true);assert.equal(sheets[0].erreurs.length,0);assert.equal(sheets[0].avertissements.length,2);
json('validation-theme.json',theme);json('validation-fiche.json',sheets);
const identityTool='C:/Users/david/.codex/plugins/cache/created-by-me-remote/gmos-studio/0.1.0/skills/identite/scripts/valider-identite.mjs';
const identity=JSON.parse(execFileSync(process.execPath,[identityTool,path.join(out,'identite-visuelle.txt')],{encoding:'utf8'}));assert.equal(identity.valid,true);json('validation-identite.json',identity);
const banner=JSON.parse(read(path.join(controls,'banniere.json')));
banner.accordDavid='2026-11-26 — « Oui, exporter en 2 400 × 600 »';json('banniere.json',banner);
assert.deepEqual(banner.dimensions,[2400,600]);assert.ok(banner.poidsOctets<=500000);assert.equal(banner.agrandissementPourcent,10.5);
assert.equal(sha(fs.readFileSync(path.join(out,'Traveller-Band.jpg'))),banner.sha256);
assert.equal(sha(fs.readFileSync('docs/systems/traveller/Traveller Band.jpg')),banner.sha256);

fs.mkdirSync(path.join(out,'fiche'),{recursive:true});
fs.copyFileSync('docs/fiches/Traveller/traveller-fiche-personnage-interactive.html',path.join(out,'fiche/traveller-fiche-personnage-interactive.html'));
fs.cpSync('docs/systems/traveller/theme',path.join(out,'theme'),{recursive:true});
const html=read(path.join(out,'fiche/traveller-fiche-personnage-interactive.html'));
assert.ok(!html.includes('Mira Venn'),'La livraison doit être vierge.');
const manifest=JSON.parse(html.match(/<script type="application\/json" id="character-sheet-template">([\s\S]*?)<\/script>/)[1]);
assert.equal(manifest.template.pages.length,2);assert.equal(manifest.template.pages.flatMap(p=>p.fields).length,331);
const qa=JSON.parse(read(path.join(controls,'verification-fiche.json')));assert.equal(qa.checks.length,13);assert.deepEqual(qa.errors,[]);assert.deepEqual(qa.requests,[]);
const preview=JSON.parse(read(path.join(controls,'verification-apercu.json')));assert.equal(preview.icones,15);assert.deepEqual(preview.errors,[]);

const sources=fs.readdirSync('docs/Reference/Traveller').filter(n=>n.endsWith('.pdf')).map(name=>{const p=path.join('docs/Reference/Traveller',name);return {fichier:p.split(path.sep).join('/'),sha256:sha(fs.readFileSync(p))};});
json('provenance.json',{date:'2026-11-26',plugin:'GM-OS Studio',sources,fiche:{id:manifest.template.id,pagesPDFUtiles:[2,3],rotation:90,pages:2,champs:331},banniere:banner,theme:{erreurs:0,avertissements:0,icones:15,ornements:3},identite:{styleMots:42,avoidMots:13},applicationModifiee:false,donneesPersonnellesLues:false,integrationMoteur:false,correspondance:false});

const listFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listFiles(path.join(dir,e.name)):[path.join(dir,e.name)]);
const themeZip=new AdmZip();for(const p of listFiles(path.join(out,'theme')))themeZip.addFile('theme/'+path.relative(path.join(out,'theme'),p).split(path.sep).join('/'),fs.readFileSync(p));
themeZip.writeZip(path.join(out,'Traveller-theme.zip'));
const excluded=new Set(['Traveller-Band-native.jpg','banniere-native.json','validation-fiche-brute.txt','verification-archive.json']);
const files=listFiles(out).filter(p=>!p.endsWith('.zip')&&!excluded.has(path.basename(p)));
const zip=new AdmZip();for(const p of files)zip.addFile(path.relative(out,p).split(path.sep).join('/'),fs.readFileSync(p));
const archive=path.join(out,'Traveller-GM-OS-Studio.zip');zip.writeZip(archive);
const reopened=new AdmZip(archive);assert.equal(reopened.getEntries().length,files.length);
for(const file of files){const rel=path.relative(out,file).split(path.sep).join('/');assert.equal(sha(reopened.readFile(rel)),sha(fs.readFileSync(file)),rel);}
const report={archive:path.relative(root,archive).split(path.sep).join('/'),octets:fs.statSync(archive).size,sha256:sha(fs.readFileSync(archive)),fichiers:files.length,controle:'Archive relue ; chaque entrée comparée à son fichier source par SHA-256.',relectureVisuelle:{ficheDeuxPages:true,zones:true,impressionDeuxPages:true,theme:true,banniereCompleteEtEntetes:true},integrationGMOS:false};
json('verification-archive.json',report);console.log(JSON.stringify(report,null,2));
