import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
const dir=path.resolve('output/gmos-studio/traveller'),out=path.join(dir,'controles');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1100}});await context.setOffline(true);
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(pathToFileURL(path.join(dir,'Traveller-theme.html')).href);await page.locator('.icons svg').last().waitFor();
 await page.screenshot({path:path.join(out,'theme.png'),fullPage:true});
 await page.locator('#roll').click();assert.match(await page.locator('#result').textContent(),/\d \+ \d = \d+/);
 await page.locator('nav button').nth(1).click();assert.equal(await page.locator('#sectionTitle').textContent(),'Journal');
 await page.locator('#clear').click();assert.doesNotMatch(await page.locator('#result').textContent(),/ = /);
 assert.equal(await page.locator('.icons svg').count(),15);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 fs.writeFileSync(path.join(out,'verification-apercu.json'),JSON.stringify({horsLigne:true,icones:15,jetDeDemonstration:true,navigation:true,effacement:true,errors,requests,captureDeGMOS:false},null,2)+'\n');
 console.log(JSON.stringify({errors,requests,icones:15}));await context.close();
}finally{await browser.close();}
