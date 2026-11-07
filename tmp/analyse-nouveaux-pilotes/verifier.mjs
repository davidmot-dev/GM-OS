import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const p='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md',t=fs.readFileSync(p,'utf8');
for(const[n,prefixe]of Object.entries({'RuneQuest':'RQ','Degenesis':'DEG','Chroniques Oubliées Contemporain':'COC','Shadowrun Anarchy':'SR'})){
 const a=t.indexOf('## '+n+'\n'),b=t.indexOf('\n## ',a+4),s=t.slice(a,b<0?t.length:b);
 const lignes=s.split('\n').filter(l=>/^\| [🟢🟠🔴]/u.test(l));
 const compte=Object.fromEntries(['🟢','🟠','🔴'].map(e=>[e,lignes.filter(l=>l.startsWith('| '+e)).length]));
 const vue=t.split('\n').find(l=>l.startsWith('| ['+n+']'));
 assert.ok(vue.includes(`🟢 ${compte['🟢']} · 🟠 ${compte['🟠']} · 🔴 ${compte['🔴']}`),'Compteur '+n);
 for(let i=1;i<=6;i++)assert.equal(s.split('\n').filter(l=>/^\| [🟢🟠🔴]/u.test(l)&&l.includes(prefixe+'-A'+i+' —')).length,1);
 console.log(n+' : '+JSON.stringify(compte));
}
const fichiers=[p,'documentation/Planning/2026-11-01-analyse-nouveaux-pilotes.md','documentation/Planning/2026-11-01-etat-et-reprise-codex-analyse-pilotes.md'];
let liens=0;for(const f of fichiers){const texte=fs.readFileSync(f,'utf8');for(const match of texte.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)){let cible=match[1];if(/^(?:https?:|#)/.test(cible))continue;cible=decodeURIComponent(cible);assert.ok(fs.existsSync(path.resolve(path.dirname(f),cible)),'Lien manquant '+f+' : '+cible);liens++;}}
console.log('Liens locaux vérifiés : '+liens);
