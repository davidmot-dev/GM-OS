import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {lancerGmOs,attendreLHydratation,type GmOsLance} from './lancerGmOs';
import type {useSessionOSStore} from '../src/modules/session/useSessionOSStore';

// T4 J1, accueil seulement : campagne fictive, profil jetable, véritable WebSocket.
// À lancer après construction et intégration de la maquette retenue.
const ICI=path.dirname(fileURLToPath(import.meta.url));
const SORTIE=process.env.GMOS_TABLET_CAPTURES_DIR ? path.join(path.resolve(process.env.GMOS_TABLET_CAPTURES_DIR), 'accueil') : path.join(ICI,'../documentation/Planning/tablettes/T4-joueurs/accueil');
const DEMO=JSON.parse(fs.readFileSync(path.join(ICI,'donnees/campagne-de-demo.json'),'utf8'));
type Magasins={useSessionOSStore:typeof useSessionOSStore};
let gmos:GmOsLance;
test.use({channel:'msedge',locale:'fr-FR',timezoneId:'Europe/Brussels',serviceWorkers:'block'});
test.beforeAll(async()=>{
 fs.mkdirSync(SORTIE,{recursive:true});
 gmos=await lancerGmOs({semence:path.join(ICI,'donnees/campagne-de-demo.json')});
 await attendreLHydratation(gmos);
 await expect(gmos.fenetre.locator('[data-ecran-d-accueil]')).toHaveCount(0,{timeout:20_000});
 const cadre=await gmos.application.browserWindow(gmos.fenetre);
 await cadre.evaluate(w=>w.webContents.setAudioMuted(true));
});
test.afterAll(async()=>{await gmos?.fermer();});
async function verifierLesCibles(page:Page){
 await expect.poll(()=>page.getByRole('button').evaluateAll(boutons=>boutons.map(b=>{
  const r=b.getBoundingClientRect();return{nom:b.textContent,largeur:r.width,hauteur:r.height};
 }).filter(b=>b.largeur>0&&b.hauteur>0&&(b.largeur<43.9||b.hauteur<43.9))),{message:'cibles tactiles de 44 px après les animations'}).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}
for(const taille of [
 {nom:'petit-telephone',width:360,height:800},
 {nom:'telephone',width:390,height:844},
 {nom:'portrait',width:820,height:1180},
 {nom:'paysage',width:1180,height:820},
])test(`accueil T4 — choix et confirmation à ${taille.width} px`,async({page})=>{
 await page.setViewportSize(taille);
 // Identité stable entre les contextes : permet de reprendre le verrou après fermeture.
 await page.addInitScript(()=>localStorage.setItem('gmos-tablet-uuid','t4-accueil'));
 await gmos.fenetre.evaluate(semence=>{
  const magasin=(window as unknown as Magasins).useSessionOSStore;
  magasin.setState({...semence.modules.sessionOS,sessions:semence.modules.sessionOS.sessions.map((s:{id:string})=>({...s,status:s.id==='demo-seance-2'?'active':'done'}))});
 },DEMO);
 await page.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
 expect(await page.evaluate(()=>Boolean(window.appBridge))).toBe(false);
 await expect(page.getByRole('heading',{name:'Qui es-tu ?',exact:true})).toBeVisible({timeout:20_000});
 const cartes=page.getByRole('button',{name:/Nel Varga|Idris Koa|Sora Adebayo/});
 await expect(cartes).toHaveCount(3);await verifierLesCibles(page);
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:path.join(SORTIE,taille.nom+'.png'),animations:'disabled',scale:'css'});
 if(taille.width===360){const r=await cartes.first().boundingBox();expect(r!.height,'carte compacte sur téléphone').toBeLessThanOrEqual(200);}
 if(taille.nom==='paysage'){
  const positions=await cartes.evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,bas:r.bottom};}));
  expect(Math.max(...positions.map(r=>r.y))-Math.min(...positions.map(r=>r.y))).toBeLessThan(2);
  expect(new Set(positions.map(r=>Math.round(r.x))).size).toBe(3);
  expect(Math.max(...positions.map(r=>r.bas))).toBeLessThanOrEqual(taille.height);
 }
 await cartes.last().scrollIntoViewIfNeeded();await expect(cartes.last()).toBeVisible();
 await page.getByText(/^Device ID:/).scrollIntoViewIfNeeded();await expect(page.getByText(/^Device ID:/)).toBeVisible();
 const quitter=page.getByRole('button',{name:'Quitter la session',exact:true});
 const position=await quitter.boundingBox();expect(position!.y).toBeGreaterThanOrEqual(0);expect(position!.y+position!.height).toBeLessThanOrEqual(taille.height);
 await quitter.click();await expect(page.getByText('Vraiment ?', {exact:true})).toBeVisible();await verifierLesCibles(page);
 await page.screenshot({path:path.join(SORTIE,taille.nom+'-confirmation.png'),animations:'disabled',scale:'css'});
 await page.getByRole('button',{name:'Non',exact:true}).click();await expect(page.getByText('Vraiment ?', {exact:true})).toHaveCount(0);await expect(cartes).toHaveCount(3);
 await quitter.click();await page.getByRole('button',{name:'Oui, quitter',exact:true}).click();await expect(page.getByRole('button',{name:'Oui, quitter',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:/Nel Varga/}).click();
 await expect(page.getByRole('heading',{name:'Le Silence de Varn',exact:true})).toBeVisible({timeout:20_000});
 await expect.poll(()=>gmos.fenetre.evaluate(()=>(window as unknown as Magasins).useSessionOSStore.getState().connectedCharacters['temoin-pj-1'])).toBeTruthy();
});
