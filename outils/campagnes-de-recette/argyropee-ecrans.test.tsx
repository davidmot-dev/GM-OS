import fs from 'node:fs';
import React from 'react';
import {Buffer} from 'node:buffer';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import type {NexusCampaignState} from '../../src/modules/system/archive/nexus.types';
import PanneauDeJet from '../../src/modules/session/components/fields/PanneauDeJet';
import GuigneDArgyropee from '../../src/modules/dice/GuigneDArgyropee';
import {DiceEngine} from '../../src/modules/dice/DiceEngine';
import {useSessionOSStore} from '../../src/modules/session/useSessionOSStore';
const log=vi.fn();vi.mock('../../src/modules/journal/consignerLeJet',()=>({consignerLeJet:(...a:unknown[])=>log(...a)}));
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const s=JSON.parse(new AdmZip('output/campagnes-tests/argyropee/01-Les-Comptes-de-la-maree.gmos').readAsText('state.json')) as NexusCampaignState;
const pilote=s.requiredDriverData![0],fiche=s.requiredTemplateData![0],pcs=s.players.flatMap(p=>p.characters),pj=(code:string)=>pcs.find(c=>c.id.endsWith('-'+code.toLowerCase()))!;
const initial=useSessionOSStore.getState();
afterEach(()=>{cleanup();vi.restoreAllMocks();log.mockClear();useSessionOSStore.setState(initial,true);});
const monter=(code:string,plus:Record<string,unknown>={})=>{
 const ecrire=vi.fn(),v={...pj(code).sheetData,...plus};
 const panneau=render(<PanneauDeJet descripteur={pilote.jet!} dice={pilote.dice!} template={fiche} valeurs={v} ecrireSurLaFiche={ecrire}/>).container;
 return {ecrire,panneau};
};
describe('composants natifs avec les profils de la campagne livrée',()=>{
 it('JOUR : Réveil dépense l’offrande et remet les suivis à0',()=>{
  vi.spyOn(DiceEngine,'roll').mockReturnValue(10);const{ecrire}=monter('JOUR');fireEvent.click(screen.getByText('Réveil'));
  expect(ecrire).toHaveBeenCalledWith({panache:15,faveur_divine:0,guigne_depense:0,guigne_offerte:0,magie_du_combat:0});
 });
 it('JOUR : repas et collation changent le Panache, sans soin de santé',()=>{
  const{ecrire}=monter('JOUR');fireEvent.click(screen.getByText('Repas +3'));fireEvent.click(screen.getByText('Collation +1'));expect(ecrire).toHaveBeenLastCalledWith({panache:7});expect(ecrire.mock.calls.every(c=>!('points_de_sante'in c[0]))).toBe(true);
 });
 it('JOUR : à0PS, Exubérance fonctionne après le second clic ; BAS et INCONSCIENT sont refusés',()=>{
  const{ecrire}=monter('JOUR');fireEvent.click(screen.getByText('Exubérance'));expect(ecrire).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Sacrifier 3 points'));expect(ecrire).toHaveBeenCalledWith({panache:0});
  cleanup();monter('BAS');expect((screen.getByText('Exubérance') as HTMLButtonElement).disabled).toBe(true);cleanup();monter('INCONSCIENT');expect((screen.getByText('Exubérance') as HTMLButtonElement).disabled).toBe(true);
 });
 it('JOUR : une Faveur consomme la dernière prière ; BAS épuisé ne la propose plus',()=>{
  const{ecrire,panneau}=monter('JOUR');fireEvent.change(screen.getAllByRole('combobox')[0],{target:{value:'commerce'}});fireEvent.click(panneau.querySelector('[data-faveur-argyropee] input')!);
  const faces=[10,8];vi.spyOn(DiceEngine,'roll').mockImplementation(()=>faces.shift()??1);fireEvent.click(screen.getByText('Lancer',{exact:true}));expect(ecrire).toHaveBeenCalledWith({faveur_divine:2});expect(panneau.textContent).toContain('Faveur divine : 0 et 8');
  cleanup();const second=monter('BAS');expect((second.panneau.querySelector('[data-faveur-argyropee] input') as HTMLInputElement).disabled).toBe(true);
 });
 it('MAGIE : la dépense discrète coûte2 ; DOUBLE seulement1 ; ZERO refuse',()=>{
  const a=monter('MAGIE',{magie_du_combat:0});fireEvent.click(screen.getByLabelText('Sans lueur'));fireEvent.click(screen.getByText('Exprimer (2 Panache)'));expect(a.ecrire).toHaveBeenCalledWith({panache:8,magie_du_combat:2});
  cleanup();const b=monter('DOUBLE');fireEvent.click(screen.getByLabelText('Sans lueur'));fireEvent.click(screen.getByText('Exprimer (1 Panache)'));expect(b.ecrire).toHaveBeenCalledWith({panache:2,magie_du_combat:1});
  cleanup();monter('ZERO');expect((screen.getByText('Exprimer (1 Panache)') as HTMLButtonElement).disabled).toBe(true);
 });
 it('MAGIE : le vrai profil6→7 lance une fois le d100, puis Fin du combat ne guérit pas',()=>{
  const de=vi.spyOn(DiceEngine,'roll').mockReturnValue(20);const{ecrire}=monter('MAGIE');fireEvent.click(screen.getByText('Exprimer (1 Panache)'));
  expect(ecrire).toHaveBeenCalledWith({panache:9,magie_du_combat:7,silenciada:true});expect(de).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('Exprimer (1 Panache)'));expect(de).toHaveBeenCalledTimes(1);fireEvent.click(screen.getByText('Fin du combat'));expect(ecrire).toHaveBeenLastCalledWith({magie_du_combat:0});
 });
 it('la Guigne est réellement collective : +3 ajoutés à l’offrande de chaque PJ, sans toucher le Panache',()=>{
  const ecrire=vi.fn();const personnages=s.players.flatMap(p=>p.characters.map(personnage=>({joueurId:p.id,personnage})));
  render(<GuigneDArgyropee regle={pilote.jet!.argyropee!} personnages={personnages} ecrire={ecrire}/>);
  fireEvent.click(screen.getByText(/Guigne réglée :/));expect(ecrire).toHaveBeenCalledTimes(22);
  for(const p of personnages){expect(ecrire).toHaveBeenCalledWith(p.joueurId,p.personnage.id,'guigne_offerte',Number(p.personnage.sheetData!.guigne_offerte)+3);expect(ecrire).toHaveBeenCalledWith(p.joueurId,p.personnage.id,'guigne_depense',0);}
  expect(ecrire.mock.calls.every(c=>c[2]!=='panache')).toBe(true);
 });
 it('restauration locale via le vrai magasin : principal et scène restent identiques après sérialisation',()=>{
  const joueurs=JSON.parse(JSON.stringify(s.players)),scenes=JSON.parse(JSON.stringify(s.scenes)),marin=joueurs[0].characters[0],cible=joueurs.flatMap((p:typeof s.players[number])=>p.characters).find((c:typeof pcs[number])=>c.id===pj('SANTE').id)!;
  scenes[0].notesDuMeneur+=' TEMOIN_AVANCEE_MAREE';marin.sheetData.panache=17;const owner=joueurs.find((p:typeof s.players[number])=>p.characters.some(c=>c.id===cible.id))!;
  useSessionOSStore.setState({...initial,players:joueurs,scenes,campaigns:[s.campaign],activeCampaignId:s.campaign.id,customGameDrivers:[pilote]});
  const avant=JSON.stringify({marin,scene:scenes[0]}),base=JSON.parse(JSON.stringify(cible));
  useSessionOSStore.getState().updateCharacter(owner.id,cible.id,{sheetData:{...cible.sheetData,points_de_sante:1,panache:0}});
  useSessionOSStore.getState().updateCharacter(owner.id,cible.id,{sheetData:base.sheetData,healthSystem:base.healthSystem,hp:base.hp,maxHp:base.maxHp});
  const sauvegarde=JSON.parse(JSON.stringify({players:useSessionOSStore.getState().players,scenes:useSessionOSStore.getState().scenes}));
  const lu=sauvegarde.players.flatMap((p:typeof s.players[number])=>p.characters).find((c:typeof pcs[number])=>c.id===marin.id);
  expect(JSON.stringify({marin:lu,scene:sauvegarde.scenes[0]})).toBe(avant);expect(sauvegarde.players.flatMap((p:typeof s.players[number])=>p.characters).find((c:typeof pcs[number])=>c.id===cible.id).sheetData).toEqual(base.sheetData);
  // Sérialisation de données seulement : aucun rechargement Electron n’est revendiqué.
  fs.writeFileSync('output/campagnes-tests/argyropee/verification-restauration.json',JSON.stringify({methode:'Magasin réel en mémoire + sérialisation JSON, aucun profil disque',principalEtScenePreserves:true,rechargementElectron:false},null,2)+'\n');
 });
});
