import fs from 'node:fs';const p='e2e/clipCthulhuHack.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace("await r.montrer(f.locator('[data-suites-du-jet]'),2800);await photo('06-armure-usee');","await vue();p=suivre();await r.cliquer(p.getByText('Armures — protection déclarée',{exact:true}));await r.montrer(p,2800);await photo('06-armure-usee');await pupitre();");
s=s.replace("await r.montrer(f.getByRole('button',{name:/^Gilet renforcé /}),2800);await photo('07-armure-sauvee');","await vue();p=suivre();await r.cliquer(p.getByText('Armures — protection déclarée',{exact:true}));await r.montrer(p,2800);await photo('07-armure-sauvee');");
s=s.replace("await expect(resultat).toContainText('6');","await expect(resultat).toContainText('6');await expect.poll(async()=>(await dernier()).tagSuccess).toBe(true);");
fs.writeFileSync(p,s);
let qa=fs.readFileSync('tmp/verifier-film-degenesis.mjs','utf8').replaceAll('degenesis','cthulhu-hack').replaceAll('Degenesis','Cthulhu Hack');fs.writeFileSync('tmp/verifier-film-cthulhu-hack.mjs',qa);
