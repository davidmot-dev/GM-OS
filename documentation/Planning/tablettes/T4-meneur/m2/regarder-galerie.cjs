const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const formats = ['compact', 'telephone', 'portrait', 'paysage', 'pupitre'];
const groupes = {"Sons":["01-sons","02-sons-filtre","03-sons-vides"],"Scénario":["04-scenario","05-scenario-vide"],"Tableau":["06-tableau","07-tableau-dessine","08-tableau-clair"],"Notes":["09-notes-seance","10-notes-detail","11-notes-trame","12-notes-chroniques","13-notes-indices","14-notes-secrets","22-notes-aventure"],"Coffre":["15-coffre","16-coffre-dossier","17-coffre-recherche","18-coffre-note"],"Messages":["19-messages","20-messages-prives","21-messages-longs","23-non-appairee"]};
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
    const cheminLong = await page.locator('#long').getAttribute('href');
    if (cheminLong !== 'compact/24-coffre-chemin-long.png') throw Error('Missing long path link');
    await page.goto('file:///'+path.join(__dirname,cheminLong).replaceAll('\\','/'));
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
    console.log(vues+' captures ouvertes, six planches creees.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
