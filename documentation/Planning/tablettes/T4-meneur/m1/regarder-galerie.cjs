const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const formats = ['compact', 'telephone', 'portrait', 'paysage', 'pupitre'];
const groupes = { Pads: ['01-pads','02-pads-filtre','03-pads-vides'], Des: ['04-des','05-resultat','06-formule','07-echelonnes'], Combat: ['08-combat','09-combat-vide','10-combat-aventure'], Etat: ['11-etat','12-etat-messages','13-non-appairee'] };
(async () => {
  const browser = await chromium.launch({channel:'msedge'});
  try {
    const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
    const erreurs=[]; page.on('pageerror',e=>erreurs.push(e.message));
    await page.goto('file:///'+path.join(__dirname,'index.html').replaceAll('\\','/'));
    let vues=0;
    for (const [g, etats] of Object.entries(groupes).entries()) {
      await page.locator('#ecrans button').nth(g).click();
      for (const [f, format] of formats.entries()) {
        await page.locator('#formats button').nth(f).click();
        for (const [e, etat] of etats[1].entries()) {
          await page.locator('#etats button').nth(e).click();
          await page.locator('#capture').evaluate(img=>img.decode());
          if (!(await page.locator('#original').getAttribute('href')).endsWith(format+'/'+etat+'.png')) throw Error('Wrong capture');
          vues++;
        }
      }
    }
    const resultatLong = await page.locator('#long').getAttribute('href');
    if (resultatLong !== 'compact/14-resultat-long.png') throw Error('Missing long result link');
    await page.goto('file:///'+path.join(__dirname,resultatLong).replaceAll('\\','/'));
    await page.locator('img').evaluate(img=>img.decode()); vues++;
    await page.goto('about:blank');
    fs.mkdirSync(path.join(__dirname,'revues'),{recursive:true});
    for(const [g,etats] of Object.entries(groupes)) {
      const figures=etats.flatMap(e=>formats.map(f=>`<figure><figcaption>${f}/${e}</figcaption><img src="data:image/png;base64,${fs.readFileSync(path.join(__dirname,f,e+'.png')).toString('base64')}"></figure>`)).join('');
      await page.setContent(`<html><style>body{margin:12px;background:#182131;color:white;font:14px system-ui}main{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{min-height:40px}</style><main>${figures}</main></html>`, {waitUntil:'domcontentloaded'});
      await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
      await page.screenshot({path:path.join(__dirname,'revues',g+'.png'),fullPage:true});
    }
    fs.writeFileSync(path.join(__dirname,'galerie-controles.json'),JSON.stringify({vues,erreurs,groupes,formats,planches:Object.keys(groupes).map(g=>'revues/'+g+'.png')},null,2));
    if(erreurs.length) throw Error(erreurs.join('\n'));
    console.log(vues+' captures ouvertes, quatre planches creees.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
