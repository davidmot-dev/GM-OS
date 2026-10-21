import { describe, expect, it } from 'vitest';
import { DonneesDeFicheSchema } from './donneesDeFiche';
import { SessionOSModuleSchema } from './schemas';
import { CLE_COMBAT_ALIEN, combatAlienVierge } from '../modules/dice/systemes/combatAlien';
import { CLE_PROGRESSION_ALIEN, lireProgressionAlien } from '../modules/dice/systemes/progressionAlien';
import { xenoViergeAlien } from '../modules/dice/systemes/xenomorphesAlien';
describe('sauvegarde des états réservés de la fiche RdD', () => {
    it('relit reçus, reprise, fatigue et blessures structurés sans retirer de clé ni zéro', () => {
        const sheetData = { reve_pts: 0, fatigue: 4, nom: 'Voyageur', actif: true, __rddReprise231: 1,
            __rddAvantReprise231: { vie: 12, notes: 'Ancienne saisie' }, __rddFatigueReveil: null,
            __rddSante231: { version: 1, blessures: [{ id: 'blessure', gravite: 'grave', repitJusqua: null }] },
            __rddRecusTMR231: [{ id: 'recu', empreinte: 'preuve' }] };
        const personnage = { id: 'pj', name: 'Fictif', portraitUrl: '', campaignId: 'c', hp: 12, maxHp: 12, sheetData };
        const original = { players: [{ id: 'j', realName: 'Fictif', avatarUrl: '', isOnline: false, characters: [personnage] }] };
        expect(SessionOSModuleSchema.parse(JSON.parse(JSON.stringify(original))).players?.[0].characters[0].sheetData).toEqual(sheetData);
    });
    it('préserve le contrat scalaire des autres champs et refuse du non-JSON ou un mémo démesuré', () => {
        expect(() => DonneesDeFicheSchema.parse({ champ: { inattendu: true } })).toThrow();
        expect(() => DonneesDeFicheSchema.parse({ __rddMemo: new Date() })).toThrow();
        expect(() => DonneesDeFicheSchema.parse({ __rddMemo: { fonction: () => true } })).toThrow();
        const boucle: Record<string, unknown> = {}; boucle.lien = boucle;
        expect(() => DonneesDeFicheSchema.parse({ __rddMemo: boucle })).toThrow();
        expect(() => DonneesDeFicheSchema.parse({ __rddMemo: 'x'.repeat(9 * 1024 * 1024) })).not.toThrow(); // chaîne scalaire : contrat historique
        expect(() => DonneesDeFicheSchema.parse({ __rddMemo: ['x'.repeat(9 * 1024 * 1024)] })).toThrow();
        expect(DonneesDeFicheSchema.parse({ __rddInconnu: { conserve: [1, null, 'valeur'] } })).toEqual({ __rddInconnu: { conserve: [1, null, 'valeur'] } });
    });
});

describe('sauvegarde des suivis Alien A6/A7',()=>{
    it('réimporte critiques, aspersions, objectifs secrets et reçus sans les tronquer',()=>{
        const sheetData={sante:1,[CLE_COMBAT_ALIEN]:{...combatAlienVierge(),xenomorphe:{...xenoViergeAlien(),vitesse:2,demandesAcide:[{id:'impact',des:14}]}},
            [CLE_PROGRESSION_ALIEN]:{...lireProgressionAlien({}),objectifs:{'film:1':'Secret du personnage'},finsActe:['film:1'],bilans:['s1'],achats:['achat'],pxEnPlus:11}};
        const original={players:[{id:'j',realName:'Fictif',avatarUrl:'',isOnline:false,characters:[{id:'pj',name:'Fictif',portraitUrl:'',campaignId:'c',sheetData}]}]};
        expect(SessionOSModuleSchema.parse(JSON.parse(JSON.stringify(original))).players?.[0].characters[0].sheetData).toEqual(sheetData);
    });
    it('refuse toujours un objet non déclaré, les cycles et les fonctions dans le suivi Alien',()=>{
        const boucle:Record<string,unknown>={};boucle.soi=boucle;
        for(const valeur of [boucle,{fonction:()=>true},new Date()])expect(()=>DonneesDeFicheSchema.parse({[CLE_PROGRESSION_ALIEN]:valeur})).toThrow();
        expect(()=>DonneesDeFicheSchema.parse({_gmos_inconnu:{objet:true}})).toThrow();
    });
});
