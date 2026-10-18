import { describe, expect, it } from 'vitest';
import { DonneesDeFicheSchema } from './donneesDeFiche';
import { SessionOSModuleSchema } from './schemas';
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
