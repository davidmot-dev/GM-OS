import fs from 'node:fs';const p='e2e/clipCoc.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace("ph.locator('[data-heros-coc]').getByRole('button',{name:'+2 (1 échelon)',exact:true})","ph.locator('[data-heros-coc]').getByRole('button',{name:'+5 (1 échelon)',exact:true})");
s=s.replace('Le joueur choisit Furtif, lance et ajoute deux grâce au héros.','Le joueur choisit Furtif, lance et ajoute cinq grâce au héros.');
s=s.replace('.etat{margin-top:50px;','.etat{white-space:pre-line;margin-top:50px;');
fs.writeFileSync(p,s);
