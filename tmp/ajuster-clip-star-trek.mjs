import fs from 'node:fs';
const p='e2e/clipStarTrek.spec.ts';let t=fs.readFileSync(p,'utf8');
t=t.replace("f.getByRole('group',{name:'Accès des personnages',exact:true}).getByRole('checkbox'", "f.locator('article').filter({has:f.getByRole('heading',{name:'LCARS — Passerelle',exact:true})}).getByRole('group',{name:'Accès des personnages',exact:true}).getByRole('checkbox'");
t=t.replace("getByLabel('Dégâts de l’attaque',{exact:true}),'14'", "getByLabel('Dégâts de l’attaque',{exact:true}),'16'").replace('14 dégâts − Résistance 2','16 dégâts − Résistance 4');
t=t.replace("getByLabel('Jauge d’effort',{exact:true}),'6');", "getByLabel('Jauge d’effort',{exact:true}),'6');await r.taper(nouvelle.getByLabel('Obstacle',{exact:true}),'1');");
t=t.replace("const tache=ops.locator('[data-tache-etendue]');", "const tache=ops.locator('[data-tache-etendue]');await r.taper(tache.getByLabel('Fonction',{exact:true}),'4');");
t=t.replace('Science 3 et obstacle 0','Science 4 et obstacle 1');
fs.writeFileSync(p,t);
