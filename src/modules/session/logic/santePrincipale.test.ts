import { describe, it, expect, afterEach } from 'vitest';
import { HealthInterpreter } from './HealthInterpreter';
import { champDeSantePrincipale, santeAlignee, santePrincipaleDeLaFiche } from '../../combat/logic/SanteDuCombattant';
import { useSessionOSStore } from '../useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';

/**
 * **Les points de vie d'un PJ suivent sa fiche** — 2026-10-16.
 *
 * Trouvé par les captures du manuel : la carte de combat disait 0 / 10 pendant
 * que la fiche disait Santé 8 / 8 (Blade Runner) et PV 9 / 12 (Cthulhu Hack). La
 * santé en points de vie naissait à 10 / 10 et n'était jamais réécrite sur la
 * fiche ; les cases de NOC, elles, l'étaient.
 */
const BR = { combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', isMainHP: true, max: 'santeMax' }, { fieldId: 'sangFroid' }] } };
const CH = { combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'hp', isMainHP: true }] } };

describe('la santé principale, lue sur la fiche', () => {
    it('le champ et son maximum, par la formule de la jauge', () => {
        expect(santePrincipaleDeLaFiche(BR, { sante: 5, santeMax: 8 })).toEqual({ champ: 'sante', courant: 5, max: 8 });
    });
    it('sans formule, la valeur par défaut du champ, sinon la valeur courante', () => {
        expect(santePrincipaleDeLaFiche(CH, { hp: 9 }, 12)).toEqual({ champ: 'hp', courant: 9, max: 12 });
        expect(santePrincipaleDeLaFiche(CH, { hp: 9 })).toEqual({ champ: 'hp', courant: 9, max: 9 });
    });
    it('rien pour un jeu qui ne compte pas en points de vie, ni pour une fiche muette', () => {
        expect(santePrincipaleDeLaFiche({ combat: { defaultHealthType: 'boxes', statsToTrack: [{ fieldId: 'b', isMainHP: true }] } }, { b: 3 })).toBeNull();
        expect(santePrincipaleDeLaFiche(BR, { sante: 'beaucoup' })).toBeNull();
        expect(santePrincipaleDeLaFiche(BR, {})).toBeNull();
        expect(champDeSantePrincipale({ combat: { defaultHealthType: 'clocks', statsToTrack: [{ fieldId: 'x', isMainHP: true }] } })).toBeNull();
        expect(champDeSantePrincipale(BR)).toBe('sante');
    });
    it('la santé du combat s’aligne ; des cases restent des cases', () => {
        const alignee = santeAlignee(HealthInterpreter.createDefault('hp'), { courant: 0, max: 8 })!;
        expect([alignee.data.current, alignee.data.max, alignee.state]).toEqual([0, 8, 'dead']);
        const cases = HealthInterpreter.createDefault('boxes');
        expect(santeAlignee(cases, { courant: 0, max: 8 })).toBe(cases);
    });
});

describe('un coup porté écrit la santé de la fiche', () => {
    const initial = useSessionOSStore.getState();
    const monter = (pilote: unknown, sheetData: Record<string, unknown>, fields: { id: string; defaultValue?: number }[]) => {
        useSessionOSStore.setState({
            activeCampaignId: 'c',
            campaigns: [{ id: 'c', name: 'C', system: 'jeu', activeLocationIds: [] }],
            customGameDrivers: [{ id: 'jeu', name: 'Jeu', templateId: 'tpl', ...(pilote as object) } as unknown as GameDriver],
            customSheetTemplates: [{ id: 'tpl', name: 'Fiche', emoji: '', sections: [{ id: 's', label: 'S', fields: fields.map(f => ({ ...f, label: f.id, type: 'number' })) }] }],
            players: [{ id: 'p', realName: 'J', avatarUrl: '', isOnline: false, characters: [
                // La santé née à 10 / 10, comme pour tout PJ créé jusqu'ici.
                { id: 'pj', name: 'Kessler', campaignId: 'c', templateId: 'tpl', sheetData, healthSystem: HealthInterpreter.createDefault('hp') },
            ] }],
        } as never);
    };
    const pj = () => useSessionOSStore.getState().players[0].characters[0];
    afterEach(() => { useSessionOSStore.setState(initial, true); });

    it('Blade Runner : 3 dégâts sur une Santé de 8 / 8 donnent 5 / 8, sur la fiche comme au combat', () => {
        monter(BR, { sante: 8, santeMax: 8 }, [{ id: 'sante' }, { id: 'santeMax' }]);
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 3, type: 'percutant' });
        expect(pj().sheetData).toMatchObject({ sante: 5, santeMax: 8 });
        expect([pj().healthSystem!.data.current, pj().healthSystem!.data.max]).toEqual([5, 8]);
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 10, type: 'percutant' });
        expect(pj().sheetData!.sante).toBe(0);
        expect(pj().healthSystem!.state).toBe('dead');
    });

    it('la Santé changée sur la fiche entre deux coups est celle qui encaisse', () => {
        monter(BR, { sante: 8, santeMax: 8 }, [{ id: 'sante' }, { id: 'santeMax' }]);
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 1, type: 'percutant' });
        useSessionOSStore.getState().updateCharacterSheetData('p', 'pj', 'sante', 3);
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 1, type: 'percutant' });
        expect(pj().sheetData!.sante).toBe(2);
    });

    it('Cthulhu Hack : le maximum des PV est la valeur par défaut du champ', () => {
        monter(CH, { hp: 9 }, [{ id: 'hp', defaultValue: 12 }]);
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 2, type: 'physiques' });
        expect(pj().sheetData!.hp).toBe(7);
        expect([pj().healthSystem!.data.current, pj().healthSystem!.data.max]).toEqual([7, 12]);
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 3, type: 'physiques', isRecovery: true });
        expect(pj().sheetData!.hp).toBe(10);
    });

    it('un champ qui porte autre chose qu’un nombre n’est pas écrasé', () => {
        monter(CH, { hp: 'blessé' }, [{ id: 'hp' }]);
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 2, type: 'physiques' });
        expect(pj().sheetData!.hp).toBe('blessé');
    });
});

