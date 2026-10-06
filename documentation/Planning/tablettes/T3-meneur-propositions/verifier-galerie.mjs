import {chromium,expect} from '@playwright/test';
import {access,writeFile} from 'node:fs/promises';
const dossier=new URL('.',import.meta.url),browser=await chromium.launch({channel:'msedge',headless:true});
const controles=[];
try{for(const width of [360,1180]){
 const page=await browser.newPage({viewport:{width,height:900}}),erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));
 await page.goto(new URL('index.html',dossier).href);
 const verifier=async(vue)=>{await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));expect(await page.locator('img').count()).toBe(16);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);expect(erreurs).toEqual([]);controles.push({width,vue,imagesChargees:16,debordement:false,erreurs:[...erreurs]});};
 await verifier('T3-390');await page.getByLabel('Téléphone :').selectOption('360');await verifier('T3-360');await page.getByRole('button',{name:'Références T0'}).click();await verifier('T0');await page.getByRole('button',{name:'Propositions T3'}).click();await verifier('T3-retour');
 const liens=await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.href));for(const lien of liens){const url=new URL(lien);if(url.protocol==='file:'){url.hash='';url.search='';await access(url);}}
 await page.close();
}
 // Le point d’entrée déjà ouvert par David mène à la nouvelle galerie.
 const page=await browser.newPage();await page.goto(new URL('../T3-propositions/index.html',dossier).href);await page.getByRole('link',{name:'Propositions meneur M1 et M2'}).click();await expect(page.getByRole('heading',{name:'Propositions du meneur',exact:true})).toBeVisible();await page.close();
}finally{await browser.close();}
await writeFile(new URL('galerie-controles.json',dossier),JSON.stringify(controles,null,2));console.log('Galerie : 8 contrôles, 16 images, tous les liens locaux et accès depuis J1/J2 OK.');
