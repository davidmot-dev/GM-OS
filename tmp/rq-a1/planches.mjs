import fs from 'node:fs';
import {chromium} from '@playwright/test';
const dossier='output/campagnes-tests/runequest/captures';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
    const contexte=await browser.newContext({viewport:{width:1350,height:1150}});await contexte.setOffline(true);
    const page=await contexte.newPage();
    for(const type of ['medias','electron']){
        const noms=fs.readdirSync(dossier).filter(n=>n.endsWith('.jpg')&&(type==='medias'?n.startsWith('rendu-'):!n.startsWith('rendu-')));
        await page.setContent('<style>body{margin:0;background:#eee;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(3,450px)}article{padding:8px;box-sizing:border-box;height:370px}img{width:434px;height:330px;object-fit:contain;background:white}</style><main>'+noms.map(n=>'<article><div>'+n+'</div><img src="data:image/jpeg;base64,'+fs.readFileSync(dossier+'/'+n).toString('base64')+'"></article>').join('')+'</main>');
        await page.locator('img').evaluateAll(images=>Promise.all(images.map(im=>im.decode())));
        await page.screenshot({path:'tmp/rq-a1/planche-'+type+'.jpg',fullPage:true,type:'jpeg',quality:90});
    }
}finally{await browser.close();}
