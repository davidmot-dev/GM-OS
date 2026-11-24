import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import {it,expect,vi} from 'vitest';
import {nexusService} from '../../../../src/modules/system/archive/NexusService';
import {useSessionOSStore} from '../../../../src/modules/session/useSessionOSStore';
import {construireLaSauvegarde} from '../../../../src/store/SessionService';
import {validateSession} from '../../../../src/types/schemas';
import {validerSauvegardeDesModules} from '../../../../src/modules/modulesDuJeu/protocole';

vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const r=path.resolve('output/videos-explicatives/star-trek/2026-11-23-r1');
const e=(n:string,v:unknown)=>fs.writeFileSync(path.join(r,n),JSON.stringify(v,null,2)+'\n');
it('prépare la campagne Nacre et ses deux modules avec les imports natifs',()=>{
 expect(fs.existsSync(path.join(r,'prises-r1'))).toBe(false);
 const z=new AdmZip(path.join(r,'Star-Trek-Nacre-TOURNAGE.gmos'));
 const initial=JSON.parse(z.readAsText('state.json')),man=JSON.parse(z.readAsText('manifest.json'));
 expect(nexusService.validateManifest(man)).toEqual([]);
 const pilote=JSON.parse(new AdmZip(path.join(r,'livraison/Star-Trek-2.0.0.gmos-driver')).readAsText('state.json'));
 expect(initial.requiredDriverData[0]).toEqual(pilote.gameDriver);
 expect(initial.requiredTemplateData[0]).toEqual(pilote.sheetTemplate);
 const media=Object.fromEntries(man.assetMap.map((a:any)=>[a.originalRef,`data:${a.mimeType};base64,${z.readFile(a.relativePath)!.toString('base64')}`]));
 const s=(nexusService as any).remapPaths(initial,media);
 const pcs=s.players.flatMap((p:any)=>p.characters);
 const jet=pcs.find((x:any)=>x.name==='[RECETTE] JET'),corps=pcs.find((x:any)=>x.name==='[RECETTE] CORPS');
 const adversaire=s.entities.find((x:any)=>x.name==='[RECETTE] Opposant physique');
 expect([jet.sheetData.raison,jet.sheetData.science,jet.sheetData.determination]).toEqual([10,4,1]);
 expect([corps.sheetData.stress,corps.sheetData.forme]).toEqual([0,8]);
 expect(adversaire.sheetData.attaques).toMatch(/phaseur/i);
 expect(s.rencontres.find((x:any)=>x.nom==='[RECETTE] Conflit physique').lignes[0].entiteId).toBe(adversaire.id);
 const modules={version:1,campagnes:{[s.campaign.id]:s.modulesDuJeu}};
 validerSauvegardeDesModules(modules);
 const ancien=useSessionOSStore.getState();
 try{
  useSessionOSStore.setState({campaigns:[],players:[],entities:[],sessions:[],customGameDrivers:[],customSheetTemplates:[],rencontres:[],actes:[],scenes:[]});
  (nexusService as any).injectState(s);
  const st=useSessionOSStore.getState();
  st.setActiveCampaign(s.campaign.id);st.setSelectedPlayer('p-1');st.setSelectedCharacter(jet.id);st.setCurrentView('cockpit');
  const save=validateSession(construireLaSauvegarde());save.global.activeModule='dashboard';
  e('semence-tournage.json',validateSession(save));e('modules-tournage.json',modules);
  e('acteurs.json',{campagne:s.campaign.id,jet:{pj:jet.id,joueur:'p-1',nom:jet.name},corps:{pj:corps.id,joueur:'p-2',nom:corps.name},ennemi:{id:adversaire.id,nom:adversaire.name},heros:pcs.filter((x:any)=>!x.name.startsWith('[RECETTE]')).map((x:any)=>({id:x.id,nom:x.name})),modules:Object.keys(s.modulesDuJeu)});
  e('verification-preparation.json',{nexus:true,sauvegardeValidee:true,modulesValides:true,medias:man.assetMap.length,pilote:pilote.gameDriver.id,version:pilote.gameDriver.version,gabarit:pilote.sheetTemplate.id,personnages:pcs.length,pnj:s.entities.length,limite:'Import en mémoire ; chargement Electron et service de modules restent à essayer.'});
 }finally{useSessionOSStore.setState(ancien,true);}
});
