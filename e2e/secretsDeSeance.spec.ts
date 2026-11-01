import {test,expect,chromium,type Browser} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {lancerGmOs,attendreLHydratation,ouvrirLeModule} from './lancerGmOs';
import type {useSessionOSStore} from '../src/modules/session/useSessionOSStore';

type Fenetre = Window & {useSessionOSStore:typeof useSessionOSStore};
const sortie=path.resolve('output/verification-gm05');
const lots=[
 {jeu:'runequest',archive:'01-Les-Bornes-du-gue.gmos',campagne:'recette-rq-campagne-bornes'},
 {jeu:'degenesis',archive:'01-La-Station-des-Cendres.gmos',campagne:'recette-dg-campagne-station'},
 {jeu:'coc',archive:'01-Les-Minutes-de-Verre.gmos',campagne:'recette-coc-campagne-minutes'},
 {jeu:'shadowrun-anarchy',archive:'01-La-Derniere-Couleur.gmos',campagne:'recette-shadowrun-campagne-couleur'},
];

// GM-05 : contrôler les trames reçues, pas seulement un secret caché par l'interface.
// Les rapports historiques des campagnes restent intacts : nouvelles preuves séparées.
for(const lot of lots)test(`${lot.jeu} : secrets de séance absents avant et après reconnexion`,async()=>{
 test.setTimeout(180_000);fs.mkdirSync(sortie,{recursive:true});
 const archive=path.resolve('output/campagnes-tests',lot.jeu,lot.archive);
 const gmos=await lancerGmOs();
 let navigateur:Browser|undefined;
 const f=gmos.fenetre,fuites=new Set<string>(),tablettes:object[]=[];
 const marqueur=`SECRET_GM05_${lot.jeu}`,publicInitial=`PUBLIC_GM05_${lot.jeu}`,publicModifie=`PUBLIC_GM05_MODIF_${lot.jeu}`;
 let publics=0,phase='initiale';
 try{
  navigateur=await chromium.launch({channel:'msedge',args:['--mute-audio']});
  await attendreLHydratation(gmos);await ouvrirLeModule(gmos,'Tableau de Bord');
  // L'instance neuve contient une démo active : revenir en préparation avant l'import.
  await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.setState({
   campaigns:[],players:[],entities:[],sessions:[],actes:[],scenes:[],atlasMaps:[],clues:[],rencontres:[],activeCampaignId:null,currentView:'library',
  }));
  await gmos.application.evaluate(({dialog},cible)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[cible]});},archive);
  await f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().setCurrentView('library'));
  await f.getByRole('button',{name:/Importer un bundle Nexus/i}).click();await f.locator('#nexus-import-tel-quel').click();
  await expect.poll(()=>f.evaluate(()=>(window as unknown as Fenetre).useSessionOSStore.getState().activeCampaignId)).toBe(lot.campagne);
  const fermer=f.locator('#nexus-bilan-fermer');if(await fermer.isVisible())await fermer.click();
  await f.evaluate(({campagne,secret,publicSummary})=>{const st=(window as unknown as Fenetre).useSessionOSStore,s=st.getState();st.setState({sessions:s.sessions.map(se=>se.campaignId===campagne?{...se,status:se.number===1?'active' as const:'planned' as const,gmSecrets:secret+'_'+se.number,publicSummary}:se)});},{campagne:lot.campagne,secret:marqueur,publicSummary:publicInitial});
  const personnages=await f.evaluate(campagne=>(window as unknown as Fenetre).useSessionOSStore.getState().players.map(p=>p.characters.find(c=>c.campaignId===campagne)!).filter(Boolean),lot.campagne);
  expect(personnages).toHaveLength(3);
  for(const[i,largeur]of [360,768,1180].entries()){
   phase=`${largeur}-initiale`;const vus=new Set<string>();
   const contexte=await navigateur.newContext({viewport:{width:largeur,height:1000},isMobile:true,hasTouch:true,serviceWorkers:'block',locale:'fr-FR'});
   await contexte.route('**/*',route=>{const u=new URL(route.request().url());return ['blob:','data:'].includes(u.protocol)||(u.hostname==='127.0.0.1'&&[String(gmos.ports.sync),String(gmos.ports.fiches)].includes(u.port))?route.continue():route.abort();});
   await contexte.addInitScript(id=>localStorage.setItem('gmos-tablet-uuid',id),`gm05-${lot.jeu}-${i}`);
   const tablette=await contexte.newPage();
   tablette.on('websocket',ws=>ws.on('framereceived',trame=>{
    const payload=String(trame.payload);
    if(payload.includes(marqueur)||payload.includes('SECRET_MJ_'))fuites.add(phase);
    for(const publicSummary of [publicInitial,publicModifie])if(payload.includes(publicSummary))vus.add(publicSummary);
   }));
   await tablette.goto(`http://127.0.0.1:${gmos.ports.sync}/?window=tablet&sync=${gmos.ports.sync}`);
   await tablette.getByRole('button',{name:new RegExp(personnages[i].name)}).click();await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();
   await expect.poll(()=>vus.size).toBeGreaterThan(0);publics++;
   phase=`${largeur}-differentielle`;vus.clear();
   const publicSummary=i%2?publicInitial:publicModifie;
   await f.evaluate(({campagne,publicSummary})=>{const st=(window as unknown as Fenetre).useSessionOSStore,s=st.getState();st.setState({sessions:s.sessions.map(se=>se.campaignId===campagne?{...se,publicSummary}:se)});},{campagne:lot.campagne,publicSummary});
   await expect.poll(()=>vus.has(publicSummary)).toBe(true);
   phase=`${largeur}-reconnexion`;vus.clear();await tablette.reload();
   await expect(tablette.getByText('Connecté',{exact:true})).toBeVisible();await expect.poll(()=>vus.size).toBeGreaterThan(0);
   await tablette.screenshot({path:path.join(sortie,`${lot.jeu}-${largeur}.jpg`),type:'jpeg',quality:80,animations:'disabled'});
   tablettes.push({largeur,publicRecu:true,miseAJourRecue:true,reconnexion:true});await contexte.close();
  }
  // Le caviardage ne doit jamais modifier l'état privé du MJ.
  const secrets=await f.evaluate(campagne=>(window as unknown as Fenetre).useSessionOSStore.getState().sessions.filter(s=>s.campaignId===campagne).map(s=>s.gmSecrets),lot.campagne);
  expect(secrets).toHaveLength(4);expect(secrets.every(s=>s.startsWith(marqueur))).toBe(true);
  const rapport={jeu:lot.jeu,reussi:fuites.size===0,archive:lot.archive,sha256:createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),publicsRecus:publics,tablettes,secretsConservesChezLeMJ:true,fuites:[...fuites]};
  fs.writeFileSync(path.join(sortie,lot.jeu+'.json'),JSON.stringify(rapport,null,2)+'\n');expect(fuites.size,'GM-05 : aucun secret dans les trames joueur').toBe(0);
 }finally{try{await navigateur?.close();}finally{await gmos.fermer();}}
});
