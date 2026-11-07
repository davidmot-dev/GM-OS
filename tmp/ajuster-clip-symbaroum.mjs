import fs from 'node:fs';
const p='e2e/clipSymbaroum.spec.ts';let t=fs.readFileSync(p,'utf8');
t=t.replaceAll('hasardClipRdd','hasardClipSymbaroum');
t=t.replace("await vue('cockpit');const alerte=", "const alerte=");
t=t.replace("await chapitre('5 · Déclarer la fin de scène');await vue('cockpit');", "await chapitre('5 · Déclarer la fin de scène');");
t=t.replace("await photo('12-voyage');", "await expect.poll(async()=>(await personnage()).sheetData._gmos_symbaroum).toMatchObject({jour:1,stigmates:[]});await photo('12-voyage');");
fs.writeFileSync(p,t);
