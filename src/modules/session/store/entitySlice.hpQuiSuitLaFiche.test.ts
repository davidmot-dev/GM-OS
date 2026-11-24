import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './index';

/**
 * **Les points de vie suivent la santé principale écrite sur la fiche** (24/11/2026, § 1 bis des 06 et
 * 07/11). Le cockpit lit `pc.hp / pc.maxHp` : il restait à 10/10 quand le panneau de Symbaroum écrivait
 * l'Endurance à 3, et à 8/8 quand un forçage de Blade Runner écrivait la Santé à 7.
 */

const magasin = () => useSessionOSStore.getState();
const PILOTE = {
    id: 'symbaroum-test', name: 'Symbaroum',
    dice: { defaultDice: '1d20', logic: 'd20-low', engine: 'standard' },
    combat: { defaultHealthType: 'hp', statsToTrack: [
        { fieldId: 'endurance_actuelle', label: 'Endurance', isMainHP: true, max: 'endurance' },
        { fieldId: 'corruption_temporaire', label: 'Corruption temporaire', isMainHP: false, isResource: true },
    ] },
};
const pj = () => magasin().players[0].characters[0];

beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'c1',
        campaigns: [{ id: 'c1', name: 'Davokar', system: 'symbaroum-test' }],
        customGameDrivers: [PILOTE],
        players: [{ id: 'p1', realName: 'Ana', avatarUrl: '', isOnline: true, characters: [{
            id: 'pc1', name: 'Ylva', portraitUrl: '', campaignId: 'c1', templateId: 't', hp: 10, maxHp: 10,
            sheetData: { endurance: 10, endurance_actuelle: 10, corruption_temporaire: 0 },
        }] }],
    } as never);
});

describe('hp suit la santé principale de la fiche', () => {
    it('une fiche entière écrite par le panneau : l’Endurance 10 → 3 met le cockpit à 3/10', () => {
        magasin().updateCharacter('p1', 'pc1', { sheetData: { ...pj().sheetData, endurance_actuelle: 3 } });
        expect([pj().hp, pj().maxHp]).toEqual([3, 10]);
        expect(pj().healthSystem?.data).toMatchObject({ current: 3, max: 10 });
    });

    it('un seul champ écrit (Medicus : 0 → 3) suit la même règle', () => {
        magasin().updateCharacterSheetData('p1', 'pc1', 'endurance_actuelle', 3);
        expect([pj().hp, pj().maxHp]).toEqual([3, 10]);
    });

    it('un autre champ ne touche pas aux points de vie ; une écriture qui fixe hp elle-même garde la main', () => {
        magasin().updateCharacter('p1', 'pc1', { hp: 7 });
        magasin().updateCharacter('p1', 'pc1', { sheetData: { ...pj().sheetData, corruption_temporaire: 2 } });
        expect(pj().hp).toBe(7);
        magasin().updateCharacter('p1', 'pc1', { hp: 9, sheetData: { ...pj().sheetData, endurance_actuelle: 2 } });
        expect(pj().hp).toBe(9);
    });
});
