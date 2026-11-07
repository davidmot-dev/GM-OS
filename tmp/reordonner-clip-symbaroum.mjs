import fs from 'node:fs';
const p='e2e/clipSymbaroum.spec.ts';let t=fs.readFileSync(p,'utf8');
const avant="await r.carte('');await r.cocher(panneau.getByRole('radio',{name:'Attaque',exact:true}));await r.choisir(attribut,'precision');await jeter(1);";
if(!t.includes(avant))throw new Error('Séquence attendue absente.');
t=t.replace(avant,"await r.carte('');await r.choisir(attribut,'precision');await r.cocher(panneau.getByRole('radio',{name:'Attaque',exact:true}));await jeter(1);");
fs.writeFileSync(p,t);
