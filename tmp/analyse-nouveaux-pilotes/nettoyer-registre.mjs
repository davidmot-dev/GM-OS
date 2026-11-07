import fs from 'node:fs';
import assert from 'node:assert/strict';
const p='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const titre='### 199 · Analyse des améliorations RuneQuest, Degenesis, COC et Shadowrun — 01/11/2026';
const a=t.indexOf(titre),b=t.indexOf(titre,a+1),c=t.indexOf("## La vue d'un coup d'œil",b);
assert.ok(a>=0&&b>a&&c>b);assert.equal(t.slice(a,b).trim(),t.slice(b,c).trim());t=t.slice(0,b)+t.slice(c);
const lignes=t.split('\n'),vues=lignes.filter(l=>l.startsWith('| 135 |'));assert.equal(vues.length,2);assert.equal(vues[0],vues[1]);let vueGardee=false;
t=lignes.filter(l=>{if(!l.startsWith('| 135 |'))return true;if(vueGardee)return false;vueGardee=true;return true;}).join('\n');
assert.equal(t.split(titre).length-1,1);fs.writeFileSync(p,t);
