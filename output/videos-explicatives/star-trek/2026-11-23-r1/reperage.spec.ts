import fs from 'node:fs';import path from 'node:path';
import {test,expect} from '@playwright/test';
import {lancerGmOs,attendreLHydratation,ouvrirLeModule} from '../../../../e2e/lancerGmOs';
const r=path.resolve('output/videos-explicatives/star-trek/2026-11-23-r1');
test('repérage réel Nacre dans Electron',async()=>{
 test.setTimeout(240000);
 const sortie=path.join(r,process.env.GMOS_REPERAGE??'reperage-r1');fs.mkdirSync(sortie);
 const a=JSON.parse(fs.readFileSync(path.join(r,'acteurs.json'),'utf8'));
 const g=await lancerGmOs({semence:path.join(r,'semence-tournage.json'),preparerLeProfil(p){
  fs.mkdirSync(path.join(p,'modules-du-jeu'),{recursive:true});
  fs.copyFileSync(path.join(r,'modules-tournage.json'),path.join(p,'modules-du-jeu/instances.json'));
  for(const d of ['theme','fiche'])fs.cpSync(path.join('docs/systems/star-trek',d),path.join(p,'corpus/systems/star-trek',d),{recursive:true});
 }});
 const f=g.fenetre;f.setDefaultTimeout(15000);
 const preuve=async(n:string)=>{fs.writeFileSync(path.join(sortie,n+'.txt'),await f.locator('body').innerText());await f.screenshot({path:path.join(sortie,n+'.jpg'),type:'jpeg',quality:85});};
 try{
  await g.application.evaluate(({session})=>session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(d,cb)=>{const u=new URL(d.url);cb({cancel:!(['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&['4100','4101'].includes(u.port))});}));
  const w=await g.application.browserWindow(f);await w.evaluate(w=>{w.unmaximize();w.setContentSize(1440,1000);w.webContents.setAudioMuted(true);});
  await attendreLHydratation(g);await expect(f.locator('[data-ecran-d-accueil]')).toHaveCount(0,{timeout:20000});
  expect(await f.evaluate(()=>(window as any).useSessionOSStore.getState().activeCampaignId)).toBe(a.campagne);
  await ouvrirLeModule(g,'Tableau de Bord');await preuve('01-cockpit');
  await f.getByRole('button',{name:'Joueurs',exact:true}).click();await preuve('02-joueurs');
  const retour=f.getByRole('button',{name:/^retour$/i});if(await retour.isVisible())await retour.click();
  await f.getByText('Thomas D.',{exact:true}).first().click();
  const h=f.getByRole('heading',{name:a.jet.nom,exact:true});await h.locator('xpath=ancestor::div[.//button[normalize-space()="Fiche"]][1]').getByRole('button',{name:'Fiche',exact:true}).click();
  await f.getByRole('tab',{name:'Lancer un test',exact:true}).click();await preuve('03-jet');
  const panneau=f.locator('[data-panneau-de-jet]').first();
  await panneau.locator('select').nth(0).selectOption('raison');await panneau.locator('select').nth(1).selectOption('science');
  await panneau.getByLabel('Difficulté',{exact:true}).fill('1');await panneau.getByLabel(/^Spécialisation/).check();
  await f.evaluate(()=>{const w=window as any;w.__hasard=Math.random;let i=0;Math.random=()=>/\broll\b/.test(new Error().stack??'')?([.175,.675][Math.min(i++,1)]):w.__hasard();});
  try{await panneau.getByRole('button',{name:'Lancer',exact:true}).click();}finally{await f.evaluate(()=>{Math.random=(window as any).__hasard;delete (window as any).__hasard;});}
  const resultat=panneau.getByRole('region',{name:'Résultat',exact:true});await expect(resultat).toBeVisible();await resultat.scrollIntoViewIfNeeded();await preuve('03b-resultat');
  await expect(resultat).toContainText('3 réussites');
  expect(await f.evaluate(id=>(window as any).useRessourcesDeTableStore.getState().reserves[id].impulsion,a.campagne)).toBe(2);
  await f.getByRole('button',{name:'Tableau de Bord',exact:true}).first().click();
  await f.getByRole('button',{name:'Retour Cockpit',exact:true}).click();
  await f.getByRole('button',{name:'Modules du jeu',exact:true}).click();await preuve('04-modules');
  const etat=await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire());fs.writeFileSync(path.join(sortie,'modules.json'),JSON.stringify(etat,null,2));
  expect(etat.modules).toHaveLength(2);
  for(const nom of ['LCARS — Passerelle','Bataille spatiale et tâches étendues']){
   const article=f.locator('article').filter({has:f.getByRole('heading',{name:nom,exact:true})});await article.getByRole('button',{name:'Ouvrir le pupitre',exact:true}).click();
   const contenu=f.locator(nom.startsWith('LCARS')?'.lcars-prototype':'[data-pupitre-operations]');await expect(contenu).toBeVisible();await contenu.scrollIntoViewIfNeeded();await preuve(nom.startsWith('LCARS')?'05-lcars':'06-operations');
   if(!nom.startsWith('LCARS')){
    const tache=contenu.locator('[data-tache-etendue]').filter({hasText:'[RECETTE] Effort'});
    await tache.getByLabel('Fonction',{exact:true}).fill('4');
    await tache.getByRole('button',{name:'Tâche réussie : cocher l’impact',exact:true}).click();
    const v:any=await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire());
    expect(v.modules.find((m:any)=>m.id==='star-trek-operations').vue.taches.find((t:any)=>t.nom==='[RECETTE] Effort').coches).toBe(3);
    await tache.scrollIntoViewIfNeeded();await preuve('07-impact');
    await f.reload();await attendreLHydratation(g);
    const recharge:any=await f.evaluate(()=>window.appBridge!.modulesDuJeu!.lire());
    expect(recharge.modules.find((m:any)=>m.id==='star-trek-operations').vue.taches.find((t:any)=>t.nom==='[RECETTE] Effort').coches).toBe(3);
    fs.writeFileSync(path.join(sortie,'verification.json'),JSON.stringify({jet:{faces:[4,14],reussites:3,difficulte:1,impulsion:2},modulesCharges:2,tache:{fonction:4,obstacle:1,coches:3,persistantesApresRechargement:true},tournageFinal:false},null,2));
   }
  }
 }catch(e){await preuve('diagnostic');throw e;}finally{await g.fermer();}
});
