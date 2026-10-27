import '../../../../../outils/campagnes-de-recette/charger-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const {lancerGmOs,attendreLHydratation,ouvrirLeModule}=await import('../../../../../e2e/lancerGmOs.ts');
const base=path.resolve('docs/systems/barbarian/theme'),out=path.join(base,'apercu');
const g=await lancerGmOs({preparerLeProfil(profil){fs.cpSync(base,path.join(profil,'corpus','systems','barbarian','theme'),{recursive:true,filter:p=>!p.includes(path.sep+'apercu')});}});
try{
 const p=g.fenetre;await attendreLHydratation(g);const bw=await g.application.browserWindow(p);await bw.evaluate(w=>{w.unmaximize();w.setContentSize(1440,1000);w.webContents.setAudioMuted(true);});
 await p.evaluate(async()=>{const s=window.useSessionOSStore.getState(),c=s.campaigns[0];s.setActiveCampaign(null);await new Promise(r=>setTimeout(r,350));s.updateCampaign(c.id,{name:'BARBARIAN OF LEMURIA — APERÇU DU THÈME',systemPath:'systems/barbarian',themeDuJeu:true});s.setActiveCampaign(c.id);s.setCurrentView('cockpit');});
 try{await p.waitForFunction(()=>document.documentElement.style.getPropertyValue('--app-bg').trim()==='#e5e0d3',undefined,{timeout:25000});}catch(e){await p.screenshot({path:path.join(out,'diagnostic.png')});console.log(await p.evaluate(()=>({fond:document.documentElement.style.getPropertyValue('--app-bg'),campagne:window.useSessionOSStore.getState().campaigns[0]})));throw e;}
 assert(await p.evaluate(()=>document.documentElement.hasAttribute('data-personnalites')));
 await ouvrirLeModule(g,'Tableau de Bord');await p.getByText(/Master Cockpit/i).first().waitFor({state:'visible',timeout:20000});await p.evaluate(async()=>{await Promise.all([document.fonts.load('16px "Rye"'),document.fonts.load('16px "IBM Plex Mono"')]);await document.fonts.ready;});await p.screenshot({path:path.join(out,'01-cockpit.png')});
 await ouvrirLeModule(g,'Dice-OS');await p.waitForTimeout(700);await p.screenshot({path:path.join(out,'02-des.png')});
 await p.keyboard.press('Control+KeyK');await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'03-palette.png')});
 const valeurs=await p.evaluate(()=>({fond:getComputedStyle(document.documentElement).getPropertyValue('--app-bg').trim(),personnalites:document.documentElement.hasAttribute('data-personnalites'),policeTitre:document.fonts.check('16px "Rye"'),policeChiffres:document.fonts.check('16px "IBM Plex Mono"')}));fs.writeFileSync(path.join(out,'verification-visuelle.json'),JSON.stringify({date:'2026-10-27',profilIsole:true,donnees:'Données d’usine fictives ; thème uniquement, pas de recette du pilote Barbarian',...valeurs},null,2));
}finally{await g.fermer();}
const browser=await chromium.launch({channel:'msedge'});try{const page=await browser.newPage({viewport:{width:1100,height:760}});await page.context().setOffline(true);const svg=(f)=>'data:image/svg+xml;base64,'+fs.readFileSync(path.join(base,f)).toString('base64');const icons=JSON.parse(fs.readFileSync(path.join(base,'icones.json'),'utf8'));
 await page.setContent('<html lang="fr"><style>body{margin:32px;background:#e5e0d3;color:#24221c;font:18px Georgia}h1{font-size:28px}.icons{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}.cell{padding:20px;background:#f6f3ea;border:1px solid #847b65;display:flex;align-items:center;gap:12px}img{width:24px;height:24px}.orn{display:flex;justify-content:space-around;align-items:center;height:200px;background:#f6f3ea;border:1px solid #847b65;margin:24px 0}.big{width:150px;height:150px}.sep{width:480px;height:32px}</style><h1>Barbarian of Lemuria · ornements et icônes originaux</h1><div class="orn"><img class="big" src="'+svg('ornements/coin.svg')+'"><img class="sep" src="'+svg('ornements/separateur.svg')+'"><img class="big" src="'+svg('ornements/fond.svg')+'"></div><div class="icons">'+Object.entries(icons).map(([name,file])=>'<div class="cell"><img src="'+svg(file)+'">'+name+'</div>').join('')+'</div></html>');assert(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));await page.screenshot({path:path.join(out,'04-ornements-icones.png')});
}finally{await browser.close();}
console.log('Aperçus réels et planche SVG créés.');
