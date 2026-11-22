import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
const out='output/studio/penombre/2026-11-22';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1040}});await context.setOffline(true);
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(out,'apercu-theme.html')).href);await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.icons figure').count(),30);assert.equal(await page.locator('.coin').count(),2);
 await page.screenshot({path:`${out}/apercu-theme.png`,fullPage:true});assert.deepEqual(errors,[]);
 fs.writeFileSync(`${out}/verification-apercu.json`,JSON.stringify({statut:'Rendu local examiné séparément',capture:'apercu-theme.png',maquette:true,captureGMOS:false,policeAffichee:'Georgia, repli hors ligne',erreurs:errors},null,2)+'\n');
 console.log('Maquette capturée hors ligne ; 15 icônes aux deux tailles.');
}finally{await browser.close();}
