import fs from 'node:fs';
const p='e2e/clipStarTrek.spec.ts';let t=fs.readFileSync(p,'utf8');
for(const libelle of ['Attaquant','Arme','Cible','Système touché'])t=t.replace(`attaque.getByLabel('${libelle}',{exact:true})`,`attaque.getByLabel(/^${libelle}/)`);
fs.writeFileSync(p,t);
