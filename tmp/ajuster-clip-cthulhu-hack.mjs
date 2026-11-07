import fs from 'node:fs';
const p='e2e/clipCthulhuHack.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace("import { modulesDuPilote } from '../src/modules/modulesDuJeu/catalogue';\n",'');
s=s.replace("expect(modulesDuPilote(source.gameDriver,'systems/cthulhu hack').modules).toEqual([]);","expect(fs.readFileSync('src/modules/modulesDuJeu/catalogue.ts','utf8')).not.toMatch(/cthulhu/i);");
s=s.replace("await photo('02-desavantage');await r.choisir(tirage,'aucun');","await photo('02-desavantage');");
s=s.replace("await chapitre('3 · Enquête", "await r.choisir(tirage,'aucun');\n        await chapitre('3 · Enquête");
s=s.replace(".sheetData.torche).toBe('d6');", ".sheetData.torche).toBe('d6');await expect.poll(async()=>(await dernier()).usure).toEqual({avant:8,apres:6});");
fs.writeFileSync(p,s);
