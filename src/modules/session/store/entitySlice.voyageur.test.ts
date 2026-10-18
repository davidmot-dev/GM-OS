import { createStore } from 'zustand/vanilla';
import { describe, expect, it } from 'vitest';
import { createEntitySlice, type EntitySlice } from './entitySlice';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { fiche } from '../logic/ficheDeVoyageur.fixtures';
import { CLE_ORIGINAUX, reprendreFicheDeVoyageur } from '../logic/ficheDeVoyageur';
import type { PlayerCharacter } from '../../../types/player.types';
import type { Entity } from '../../../types/entity.types';
import { initialiserSanteVoyageur, proposerEncaissement, finaliserMajSante, etatsDeSanteVoyageur } from '../logic/santeDuVoyageur';

function magasin() {
    const s = createStore<EntitySlice & {customSheetTemplates: SheetTemplate[]}>((set, get, api) => ({
        ...createEntitySlice(set, get, api), customSheetTemplates: [fiche],
    }));
    const personnage: PlayerCharacter = {id: 'pj', name: 'Voyageur fictif', portraitUrl: '', campaignId: null,
        templateId: fiche.id, hp: 7, maxHp: 22, sheetData: {vie: 7, melee: 8}};
    s.setState({players: [{id: 'j', realName: 'Test', avatarUrl: '', isOnline: false, characters: [personnage]}]});
    return s;
}

describe('les écritures réelles de la fiche Voyageur', () => {
    it('R8 : une ancienne fiche ou un brouillon ne retire pas un reçu de débit déjà enregistré', () => {
        const s = magasin();
        const recu = { id: 'operation-tmr', demandeId: 'demande', campagneId: 'c', personnageId: 'pj', empreinte: 'preuve', sortieForcee: false, detail: 'Rêve 12 → 11' };
        const d = reprendreFicheDeVoyageur(fiche, { vie: 12, endurance: 24, fatigue: 1, reve_pts: 11, __rddFatigue231: 1, __rddRecusTMR231: [recu] });
        s.getState().updateCharacter('j', 'pj', { sheetData: d });
        const { __rddRecusTMR231: _recu, ...ancien } = d;
        s.getState().updateCharacter('j', 'pj', { sheetData: { ...ancien, notes: 'Notes depuis un brouillon ancien' } });
        expect(s.getState().players[0].characters[0].sheetData.__rddRecusTMR231).toEqual([recu]);
    });
    it('R2 couvre aussi le PNJ de campagne et ses écritures de jauge, sans le déclarer mort à zéro vie', () => {
        const s = magasin();
        const d = initialiserSanteVoyageur(reprendreFicheDeVoyageur(fiche,{vie:12,endurance:2,fatigue:0,__rddFatigue231:1}));
        const e: Entity = {id:'pnj',name:'PNJ fictif',type:'npc',role:'hostile',status:'alive',avatar:'',hp:12,maxHp:12,
            ac:0,speed:0,initiative:0,description:'',roleplayingNotes:'',gmSecretInfo:'',linkedMapIds:[],campaignId:'rdd-r2-test',templateId:fiche.id,sheetData:d};
        s.setState({entities:[e]});
        s.getState().updateEntity('pnj',{sheetData:d});
        expect(s.getState().entities[0].status).toBe('alive');
        s.getState().updateEntitySheetData('pnj','endurance',0);
        expect(s.getState().entities[0]).toMatchObject({hp:11,sheetData:{fatigue:2,vie:11},status:'injured'});
        s.getState().updateEntityHP('pnj',0);
        expect(s.getState().entities[0]).toMatchObject({hp:0,sheetData:{vie:0},status:'injured',healthSystem:{data:{rdd:{coma:true,mort:false}}}});
    });
    it('R2 : une opération ou perte externe passe une fois ; zéro et les PV négatifs restent un coma', () => {
        const s = magasin();
        const donnees = initialiserSanteVoyageur(reprendreFicheDeVoyageur(fiche,{vie:12,endurance:2,fatigue:0,__rddFatigue231:1}));
        s.getState().updateCharacter('j','pj',{sheetData:donnees});
        s.getState().updateCharacterSheetData('j','pj','endurance',0);
        const lire = () => s.getState().players[0].characters[0];
        expect(lire()).toMatchObject({hp:11,sheetData:{vie:11,endurance:0,fatigue:2}});
        s.getState().updateCharacterSheetData('j','pj','endurance',0);expect(lire().hp).toBe(11);
        s.getState().updateCharacterHP('j','pj',0);
        expect(lire().sheetData.vie).toBe(0);expect(lire().healthSystem?.data.rdd).toMatchObject({coma:true,mort:false});
        s.getState().updateCharacterHP('j','pj',-4);
        expect(etatsDeSanteVoyageur(lire().sheetData)).toMatchObject({coma:true,mort:false});
        s.getState().updateCharacterHP('j','pj',-5);expect(etatsDeSanteVoyageur(lire().sheetData)!.mort).toBe(true);
    });
    it('R2 : une critique à 22 enlève six PV, sans seconde perte de vie ou de fatigue à l’écriture', () => {
        const s = magasin();
        const d = initialiserSanteVoyageur(reprendreFicheDeVoyageur(fiche,{vie:12,endurance:23,fatigue:0,__rddFatigue231:1}));
        s.getState().updateCharacter('j','pj',{sheetData:d});
        const v = [10,10];const p = proposerEncaissement(d,2,0,false,() => v.shift()!,'critique');
        const n = finaliserMajSante(d,p);
        s.getState().updateCharacter('j','pj',{sheetData:n});
        expect(s.getState().players[0].characters[0]).toMatchObject({hp:6,sheetData:{endurance:0,fatigue:23,vie:6}});
        s.getState().updateCharacter('j','pj',{sheetData:n});
        expect(s.getState().players[0].characters[0].hp).toBe(6);
    });
    it('R1 suit une perte locale ou distante une fois ; une opération calculée garde sa fatigue et sa trace', () => {
        const s = magasin();
        s.getState().updateCharacter('j','pj',{sheetData: reprendreFicheDeVoyageur(fiche,{vie:12,endurance:23,fatigue:0,__rddFatigue231:1})});
        const lire = () => s.getState().players[0].characters[0];
        s.getState().updateCharacterSheetData('j','pj','endurance',20);
        expect(lire().sheetData).toMatchObject({fatigue:3,endurance:20});
        s.getState().updateCharacter('j','pj',{sheetData:{...lire().sheetData,endurance:18}});
        expect(lire().sheetData).toMatchObject({fatigue:5,endurance:18});
        s.getState().updateCharacter('j','pj',{sheetData:{...lire().sheetData}});
        expect(lire().sheetData.fatigue).toBe(5);
        const alcool = {...lire().sheetData,endurance:14,fatigue:5,fatigue_differee:4,__rddOperationFatigue:'op-alcool'};
        s.getState().updateCharacter('j','pj',{sheetData:alcool});
        expect(lire().sheetData).toMatchObject({fatigue:5,endurance:14,fatigue_differee:4});
        s.getState().updateCharacter('j','pj',{sheetData:alcool});
        expect(lire().sheetData.fatigue).toBe(5);
    });
    it('ne migre pas un ancien personnage silencieusement ; la reprise recalcule aussi la santé de combat', () => {
        const s = magasin();
        s.getState().updateCharacterSheetData('j', 'pj', 'agilite', 16);
        expect(s.getState().players[0].characters[0].sheetData.melee).toBe(8);
        const avant = s.getState().players[0].characters[0];
        s.getState().updateCharacter('j', 'pj', {sheetData: reprendreFicheDeVoyageur(fiche, avant.sheetData)});
        const apres = s.getState().players[0].characters[0];
        expect(apres).toMatchObject({hp: 7, maxHp: 12, healthSystem: {data: {current: 7, max: 12}}});
        expect(apres.sheetData.melee).toBe(13);
        expect(apres.sheetData[CLE_ORIGINAUX]).toEqual(avant.sheetData);
    });

    it('une modification ultérieure met à jour les maxima et dérivées sans restaurer les points dépensés', () => {
        const s = magasin();
        s.getState().updateCharacter('j', 'pj', {sheetData: reprendreFicheDeVoyageur(fiche, {vie: 7, endurance: 6, reve_pts: 19})});
        s.getState().updateCharacterSheetData('j', 'pj', 'constitution', 15);
        const courant = s.getState().players[0].characters[0];
        expect(courant.sheetData).toMatchObject({vie_max: 13, endurance_max: 25, vie: 7, endurance: 6, reve_pts: 19});
        expect(courant).toMatchObject({hp: 7, maxHp: 13, healthSystem: {data: {current: 7, max: 13}}});
        // Même porte que l'action de fiche distante : l'état reçu est recomposé au meneur.
        s.getState().updateCharacter('j', 'pj', {sheetData: {...courant.sheetData, force: 15}});
        expect(s.getState().players[0].characters[0].sheetData).toMatchObject({melee: 14, lancer: 13, vie: 7});
    });
});
