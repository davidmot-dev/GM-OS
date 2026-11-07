import fs from 'node:fs';const p='e2e/clipCoc.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace("expect(panneau.locator('[data-sante-coc]'))","expect(f.locator('[data-sante-coc]'))");
s=s.replace('let debutTablette=0,finTablette=0,dureeTablette=0,finTournageTablette=0;', 'let debutTablette=0,finTablette=0,dureeTablette=0,finTournageTablette=0,touchersRecus=0;');
s=s.replace("expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);", "expect(await client.evaluate(()=>!!window.appBridge)).toBe(false);await client.evaluate(()=>{const w=window as unknown as {touchesClipCoc:number};w.touchesClipCoc=0;document.addEventListener('touchstart',()=>w.touchesClipCoc++,true);});");
s=s.replace("await photo('14-tablette-html',stage);dureeTablette=", "await photo('14-tablette-html',stage);touchersRecus=await client.evaluate(()=>(window as unknown as {touchesClipCoc:number}).touchesClipCoc);expect(touchersRecus).toBeGreaterThan(7);dureeTablette=");
s=s.replace('touchersPlaywright:true,appareilPhysique:', 'touchersPlaywright:true,touchersRecus,appareilPhysique:');
fs.writeFileSync(p,s);
