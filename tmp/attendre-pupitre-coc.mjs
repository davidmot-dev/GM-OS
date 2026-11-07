import fs from 'node:fs';const p='e2e/clipCoc.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace("await ouvrirLeModule(g,'Dice-OS');await expect.poll", "await ouvrirLeModule(g,'Dice-OS');await expect(f.getByRole('heading',{name:'Dice-OS',exact:true})).toBeVisible();await expect.poll");
s=s.replace("await photo('16-fiche-mj');", "await f.mouse.move(950,425,{steps:12});await photo('16-fiche-mj');");
fs.writeFileSync(p,s);
