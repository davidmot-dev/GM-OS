import fs from 'node:fs';const p='e2e/clipCoc.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace("hero.locator('summary')","hero.locator('summary').first()");
s=s.replaceAll("getByLabel('Échelle d’évolution',{exact:true})",'getByLabel("Échelle d\'évolution — échelon",{exact:true})');
s=s.replace("expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);","expect(await client.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);expect(await client.evaluate(()=>[innerWidth,innerHeight])).toEqual([768,1024]);");
fs.writeFileSync(p,s);
