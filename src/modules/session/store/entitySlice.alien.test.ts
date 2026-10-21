import { createStore } from 'zustand/vanilla';
import { describe, expect, it } from 'vitest';
import { createEntitySlice, type EntitySlice } from './entitySlice';
import type { Campaign } from '../../../types/campaign.types';
import type { GameDriver } from '../../../types/drivers';
import type { PlayerCharacter } from '../../../types/player.types';
import { CLE_PANIQUE_ALIEN, appliquerLaPaniqueAlien, lireLaPaniqueAlien, type RegleDePaniqueAlien } from '../../dice/systemes/paniqueAlien';
import { CLE_COMBAT_ALIEN, combatAlienVierge, lireLeCombatAlien } from '../../dice/systemes/combatAlien';
import type { Entity } from '../../../types/entity.types';
import { estHorsDeCombat, decrireLaSante } from '../../combat/logic/SanteDuCombattant';
import { synthetiqueVierge } from '../../dice/systemes/synthetiquesAlien';
import { CLE_SURVIE_ALIEN, lireLaSurvieAlien } from '../../dice/systemes/survieAlien';

const regle: RegleDePaniqueAlien = { mecanique: 'alien', stress: 'stress', agilite: 'agilite', empathie: 'empathie', androide: 'androide' };
function magasin(androide = false, a3 = false) {
    const pilote = { id: 'alien-test', jet: { panique: { suites: regle, champ: 'panique' } }, combat: {
        defaultHealthType: 'hp', santeDeDepart: 'force', statsToTrack: [{ fieldId: 'sante', isMainHP: true, max: 'force' }],
        ...(a3 ? { alien: { sante:'sante',force:'force',endurance:'endurance',protection:'protection',talents:'talent',proprietesArmes:'proprietes',stress:'stress',androide:'androide' } } : {}),
    } } as GameDriver;
    const s = createStore<EntitySlice & { campaigns: Campaign[]; customGameDrivers: GameDriver[]; activeCampaignId: string }>((set, get, api) => ({
        ...createEntitySlice(set, get, api), campaigns: [{ id: 'c', system: pilote.id }] as Campaign[], customGameDrivers: [pilote], activeCampaignId: 'c',
    }));
    const sheetData = { sante: 4, force: 4, stress: 2, androide, panique: 0 };
    const personnage: PlayerCharacter = { id: 'pj', name: 'Fictif', portraitUrl: '', templateId: 'test', campaignId: 'c', hp: 4, maxHp: 4, sheetData };
    s.setState({ players: [{ id: 'j', realName: 'Test', avatarUrl: '', isOnline: false, characters: [personnage] }] });
    return s;
}

describe('A1 : Stress après dégâts effectifs, par la vraie écriture de santé', () => {
    it('deux dégâts coûtent deux Santé mais donnent un seul Stress ; soin et coup à zéro n’en ajoutent pas', () => {
        const s = magasin();
        const lire = () => s.getState().players[0].characters[0].sheetData!;
        s.getState().handleApplyImpact('pj', 'pc', { value: 2, type: 'combat' });
        expect(lire()).toMatchObject({ sante: 2, stress: 3 });
        s.getState().handleApplyImpact('pj', 'pc', { value: 0 });
        expect(lire().stress).toBe(3);
        s.getState().handleApplyImpact('pj', 'pc', { value: 1, isRecovery: true });
        expect(lire()).toMatchObject({ sante: 3, stress: 3 });
    });
    it('Brisé termine l’effet sans effacer le risque de traumatisme', () => {
        const s = magasin();
        const c = s.getState().players[0].characters[0];
        s.getState().updateCharacter('j', 'pj', { sheetData: { ...c.sheetData, ...appliquerLaPaniqueAlien(regle, 'panique', c.sheetData!, 'fuite', 13) } });
        s.getState().handleApplyImpact('pj', 'pc', { value: 4 });
        const fiche = s.getState().players[0].characters[0].sheetData!;
        expect(fiche.panique).toBe(0);
        expect(lireLaPaniqueAlien(fiche)).toMatchObject({ effet: undefined, traumaEnAttente: true });
    });
    it('un androïde ne gagne pas de Stress en subissant des dégâts', () => {
        const s = magasin(true);
        s.getState().handleApplyImpact('pj', 'pc', { value: 1 });
        expect(s.getState().players[0].characters[0].sheetData?.stress).toBe(2);
    });
    it('une écriture de fiche HTML qui ignore le suivi conserve les reçus et conséquences', () => {
        const s = magasin();
        const fiche = appliquerLaPaniqueAlien(regle, 'panique', {}, 'evenement', 10);
        s.getState().updateCharacter('j', 'pj', { sheetData: { sante: 4, force: 4, ...fiche,
            _gmos_jet_alien: { version: 1, id: 'test-a2', eclats: [{ id: 'degat' }] } } });
        s.getState().updateCharacter('j', 'pj', { sheetData: { sante: 3, force: 4 } });
        expect(lireLaPaniqueAlien(s.getState().players[0].characters[0].sheetData!).traites).toContain('evenement');
        expect(s.getState().players[0].characters[0].sheetData?.[CLE_PANIQUE_ALIEN]).toBeTruthy();
        expect(s.getState().players[0].characters[0].sheetData?._gmos_jet_alien).toMatchObject({ id: 'test-a2', eclats: [{ id: 'degat' }] });
    });
});

describe('A3 : critiques au raccord réel de Santé', () => {
    it('A5 : dégâts de survie sans critique humain, avec un seul Stress ; suffocation sans critique ni Stress', () => {
        const s=magasin(false,true);
        s.getState().handleApplyImpact('pj','pc',{value:4,procedureAlien:'survie'});
        let fiche=s.getState().players[0].characters[0].sheetData!;
        expect(fiche).toMatchObject({sante:0,stress:3});expect(lireLeCombatAlien(fiche).critiques).toHaveLength(0);
        const autre=magasin(false,true);autre.getState().handleApplyImpact('pj','pc',{value:4,procedureAlien:'suffocation'});
        fiche=autre.getState().players[0].characters[0].sheetData!;
        expect(fiche).toMatchObject({sante:0,stress:2});expect(lireLeCombatAlien(fiche).critiques).toHaveLength(0);
    });
    it('A5 : une ancienne fiche HTML conserve échéances, reçus et surplus de radiations', () => {
        const s=magasin(false,true),suivi={...lireLaSurvieAlien({}),radsEnPlus:3,traites:['tour:1']};
        s.getState().updateCharacter('j','pj',{sheetData:{sante:4,[CLE_SURVIE_ALIEN]:suivi}});
        s.getState().updateCharacter('j','pj',{sheetData:{sante:4}});
        expect(s.getState().players[0].characters[0].sheetData?.[CLE_SURVIE_ALIEN]).toEqual(suivi);
    });
    it('A5 : une privation refuse les premiers soins et le retour de Santé par le magasin', () => {
        const s=magasin(false,true),pilote=s.getState().customGameDrivers[0];
        pilote.combat.alien!.survie={air:'air',eau:'eau',nourriture:'nourriture',energie:'energie',radiations:'rads',permanents:'permanents',affame:'affame',dehydrate:'dehydrate',epuise:'epuise',gele:'gele',inventaire:'inventaire',armes:'armes',encombrement:'charge'};
        s.getState().handleApplyImpact('pj','pc',{value:2});
        const c=s.getState().players[0].characters[0];
        s.getState().updateCharacter('j','pj',{sheetData:{...c.sheetData,dehydrate:true}});
        s.getState().handleApplyImpact('pj','pc',{value:2,isRecovery:true});
        expect(s.getState().players[0].characters[0].sheetData?.sante).toBe(2);
    });
    it('un PNJ déclaré humain devient Brisé, pas automatiquement mort, et ne gagne pas de Stress', () => {
        const s = magasin(false,true);
        s.setState({ entities:[{id:'pnj',name:'Humain fictif',hp:3,maxHp:3,status:'alive',type:'npc',role:'neutral',avatar:'',ac:0,speed:0,initiative:0,
            description:'',roleplayingNotes:'',gmSecretInfo:'',linkedMapIds:[],campaignId:'c',sheetData:{sante:3,force:3,[CLE_COMBAT_ALIEN]:{...combatAlienVierge(),humain:true}}} satisfies Entity] });
        s.getState().handleApplyImpact('pnj','npc',{value:3});
        const e = s.getState().entities[0];
        expect(e.hp).toBe(0); expect(e.status).toBe('injured');
        expect(lireLeCombatAlien(e.sheetData!).critiques).toHaveLength(1); expect(e.sheetData?.stress).toBeUndefined();
        s.getState().updateEntity('pnj',{sheetData:{sante:0,force:3}});
        expect(lireLeCombatAlien(s.getState().entities[0].sheetData!).critiques).toHaveLength(1);
    });
    it('demande un critique à zéro, puis un par nouveau coup ; ni soins ni coup absorbé', () => {
        const s = magasin(false,true), lire = () => s.getState().players[0].characters[0].sheetData!;
        s.getState().handleApplyImpact('pj','pc',{value:0}); expect(lireLeCombatAlien(lire()).critiques).toHaveLength(0);
        s.getState().handleApplyImpact('pj','pc',{value:4}); expect(lireLeCombatAlien(lire()).critiques).toHaveLength(1);
        s.getState().handleApplyImpact('pj','pc',{value:1}); expect(lireLeCombatAlien(lire()).critiques).toHaveLength(2);
        s.getState().handleApplyImpact('pj','pc',{value:1,isRecovery:true}); expect(lireLeCombatAlien(lire()).critiques).toHaveLength(2);
        const suivi = lire()[CLE_COMBAT_ALIEN];
        s.getState().updateCharacter('j','pj',{sheetData:{sante:1,force:4}});
        expect(lire()[CLE_COMBAT_ALIEN]).toEqual(suivi);
    });
    it('conserve la demande pour la table synthétique, sans blessure humaine ni Stress', () => {
        const s = magasin(true,true);
        s.getState().handleApplyImpact('pj','pc',{value:4});
        const fiche = s.getState().players[0].characters[0].sheetData!;
        expect(lireLeCombatAlien(fiche).critiques).toHaveLength(1);
        expect(lireLeCombatAlien(fiche).blessures).toHaveLength(0);
        expect(fiche.stress).toBe(2);
        expect(estHorsDeCombat(s.getState().players[0].characters[0])).toBe(false);
        expect(decrireLaSante(s.getState().players[0].characters[0])).toContain('synthétique actif');
        s.getState().handleApplyImpact('pj','pc',{value:1});
        expect(lireLeCombatAlien(s.getState().players[0].characters[0].sheetData!).critiques).toHaveLength(2);
        const c = s.getState().players[0].characters[0];
        s.getState().updateCharacter('j','pj',{sheetData:{...c.sheetData,[CLE_COMBAT_ALIEN]:{...lireLeCombatAlien(c.sheetData!),synthetique:{...synthetiqueVierge(),arret:true}}}});
        expect(estHorsDeCombat(s.getState().players[0].characters[0])).toBe(true);
        expect(decrireLaSante(s.getState().players[0].characters[0])).toContain('Arrêt du système');
    });
    it('A4 : le PNJ synthétique utilise sa Santé, sans déclaration humaine ni mort automatique', () => {
        const s = magasin(false,true);
        s.setState({entities:[{id:'pnj',name:'Synthétique fictif',hp:8,maxHp:8,status:'alive',type:'npc',role:'neutral',avatar:'',ac:0,speed:0,initiative:0,
            description:'',roleplayingNotes:'',gmSecretInfo:'',linkedMapIds:[],campaignId:'c',sheetData:{sante:3,force:3,androide:true}} satisfies Entity]});
        s.getState().handleApplyImpact('pnj','npc',{value:3});
        const e = s.getState().entities[0];
        expect(e.hp).toBe(0); expect(e.status).toBe('injured');
        expect(lireLeCombatAlien(e.sheetData!).critiques).toHaveLength(1); expect(estHorsDeCombat(e)).toBe(false);
    });
});
