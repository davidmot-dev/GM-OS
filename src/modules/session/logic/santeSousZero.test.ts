import { describe, it, expect, afterEach } from 'vitest';
import { HealthInterpreter } from './HealthInterpreter';
import { estInconscient, laSantePasseSousZero, marquerSousZero, motDeLaSanteSousZero } from './santeSousZero';
import { estHorsDeCombat, pointsDeVieApres, santeAffichee, santeAlignee, santePrincipaleDeLaFiche } from '../../combat/logic/SanteDuCombattant';
import { syncHealthSystem } from '../store/entitySlice';
import { useSessionOSStore } from '../useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';

/**
 * **Argyropée : sous zéro, inconscient — pas mort** (12/11/2026, écart SAN-02 de la
 * campagne de recette, registre § 240). Livre 2 p. 52-53 : santé 4, coup de 5, l'avatar
 * est à −1 et inconscient ; à 0, il se traîne. GM-OS bornait à 0 et écrivait `dead`.
 */
const ARGYROPEE = {
    id: 'argyropee', name: 'Argyropée', templateId: 'tpl',
    jet: { argyropee: { sante: 'points_de_sante', panache: 'panache' } },
    combat: {
        defaultHealthType: 'hp', santeDeDepart: '2 + endurance_morale + endurance_physique',
        statsToTrack: [{ fieldId: 'points_de_sante', label: 'Points de santé', isMainHP: true, isResource: true }],
    },
} as unknown as GameDriver;
const BLADE_RUNNER = { combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', isMainHP: true, max: 'santeMax' }] } };

describe('la règle et son drapeau', () => {
    it('Argyropée la déclare par sa santé ; les autres jeux non', () => {
        expect(laSantePasseSousZero(ARGYROPEE)).toBe(true);
        expect(laSantePasseSousZero(BLADE_RUNNER)).toBe(false);
        expect(laSantePasseSousZero({ jet: { argyropee: { sante: 'autre' } }, combat: { statsToTrack: [{ fieldId: 'pv', isMainHP: true }] } })).toBe(false);
        expect(laSantePasseSousZero(undefined)).toBe(false);
    });
    it('le drapeau se pose sur une santé en points de vie, jamais sur des cases', () => {
        expect(marquerSousZero(HealthInterpreter.createDefault('hp'), ARGYROPEE).data.sousZero).toBe(true);
        expect(marquerSousZero(HealthInterpreter.createDefault('boxes'), ARGYROPEE).data.sousZero).toBeUndefined();
        expect(marquerSousZero(HealthInterpreter.createDefault('hp'), BLADE_RUNNER).data.sousZero).toBeUndefined();
    });
});

describe('le moteur de santé (SAN-02)', () => {
    const santeA = (courant: number) => ({ type: 'hp' as const, data: { current: courant, max: 8, sousZero: true }, state: 'healthy' as const, badges: [] });

    it('santé 4, coup de 5 : −1, inconscient, pas mort', () => {
        const apres = HealthInterpreter.calculateNextState(santeA(4), { value: 5 });
        expect(apres.data.current).toBe(-1);
        expect(apres.state).toBe('critical');
        expect(motDeLaSanteSousZero(apres)).toBe('Inconscient');
        expect(estInconscient(apres)).toBe(true);
    });
    it('à zéro tout juste : à terre, conscient', () => {
        const apres = HealthInterpreter.calculateNextState(santeA(4), { value: 4 });
        expect([apres.data.current, apres.state, motDeLaSanteSousZero(apres)]).toEqual([0, 'critical', 'À terre']);
    });
    it('un soin remonte depuis le négatif, jusqu’au maximum seulement', () => {
        expect(HealthInterpreter.calculateNextState(santeA(-1), { value: 3, isRecovery: true }).data.current).toBe(2);
        expect(HealthInterpreter.calculateNextState(santeA(-1), { value: 30, isRecovery: true }).data.current).toBe(8);
    });
    it('sans la règle, rien ne change : 0 et K.O', () => {
        const apres = HealthInterpreter.calculateNextState(HealthInterpreter.createDefault('hp'), { value: 15 });
        expect([apres.data.current, apres.state]).toEqual([0, 'dead']);
        expect(motDeLaSanteSousZero(apres)).toBeNull();
    });
    it('la synchronisation des PV garde l’état critique', () => {
        expect(syncHealthSystem(-1, 8, santeA(4))!.state).toBe('critical');
        expect(syncHealthSystem(0, 8, HealthInterpreter.createDefault('hp'))!.state).toBe('dead');
    });
});

describe('la santé lue sur la fiche', () => {
    it('la fiche porte −1 : elle fait foi, et la santé s’aligne avec la règle', () => {
        const principale = santePrincipaleDeLaFiche(ARGYROPEE, { points_de_sante: -1, endurance_morale: 3, endurance_physique: 3 });
        expect(principale).toEqual({ champ: 'points_de_sante', courant: -1, max: 8, sousZero: true });
        const alignee = santeAlignee(HealthInterpreter.createDefault('hp'), principale)!;
        expect([alignee.data.current, alignee.data.sousZero, alignee.state]).toEqual([-1, true, 'critical']);
    });
    it('les autres jeux bornent toujours à zéro', () => {
        expect(santePrincipaleDeLaFiche(BLADE_RUNNER, { sante: -2, santeMax: 8 })).toEqual({ champ: 'sante', courant: 0, max: 8 });
    });
});

describe('Combat-OS', () => {
    it('le coup descend sous zéro, et l’inconscient est hors de combat', () => {
        const c = { hp: 4, hpMax: 8, santeSousZero: true };
        expect(pointsDeVieApres(c, -5)).toBe(-1);
        expect(estHorsDeCombat({ ...c, hp: -1 })).toBe(true);
        expect(estHorsDeCombat({ ...c, hp: 0 })).toBe(false);
        expect(santeAffichee({ ...c, hp: -1 })).toMatchObject({ data: { current: -1, sousZero: true }, state: 'critical' });
    });
    it('sans la règle, zéro et hors de combat, comme avant', () => {
        expect(pointsDeVieApres({ hp: 4, hpMax: 8 }, -5)).toBe(0);
        expect(estHorsDeCombat({ hp: 0, hpMax: 8 })).toBe(true);
    });
});

describe('un coup porté depuis la console du meneur', () => {
    const initial = useSessionOSStore.getState();
    afterEach(() => { useSessionOSStore.setState(initial, true); });
    const monter = () => useSessionOSStore.setState({
        activeCampaignId: 'c',
        campaigns: [{ id: 'c', name: 'Les Comptes de la marée', system: 'argyropee', activeLocationIds: [] }],
        customGameDrivers: [ARGYROPEE],
        customSheetTemplates: [{ id: 'tpl', name: 'Fiche', emoji: '', sections: [{ id: 's', label: 'S', fields: ['points_de_sante', 'endurance_morale', 'endurance_physique'].map(id => ({ id, label: id, type: 'number' })) }] }],
        players: [{ id: 'p', realName: 'J', avatarUrl: '', isOnline: false, characters: [
            { id: 'pj', name: 'Vanille', campaignId: 'c', templateId: 'tpl', hp: 4, maxHp: 8,
                sheetData: { points_de_sante: 4, endurance_morale: 3, endurance_physique: 3 }, healthSystem: HealthInterpreter.createDefault('hp') },
        ] }],
        entities: [{ id: 'pnj', name: 'Gabelou', type: 'npc', campaignId: 'c', hp: 4, maxHp: 6, status: 'alive',
            healthSystem: { type: 'hp', data: { current: 4, max: 6 }, state: 'healthy', badges: [] } }],
    } as never);
    const pj = () => useSessionOSStore.getState().players[0].characters[0];
    const pnj = () => useSessionOSStore.getState().entities.find(e => e.id === 'pnj')!;

    it('Vanille, santé 4, prend 5 : la fiche dit −1 et elle est inconsciente', () => {
        monter();
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 5, type: 'solide' });
        expect(pj().sheetData!.points_de_sante).toBe(-1);
        expect(pj().hp).toBe(-1);
        expect(pj().healthSystem!.state).toBe('critical');
        expect(motDeLaSanteSousZero(pj().healthSystem)).toBe('Inconscient');
        // Un soin de 3 la ramène à 2.
        useSessionOSStore.getState().handleApplyImpact('pj', 'pc', { value: 3, isRecovery: true });
        expect(pj().sheetData!.points_de_sante).toBe(2);
    });
    it('un PNJ aussi tombe à −1, sans être marqué mort', () => {
        monter();
        useSessionOSStore.getState().handleApplyImpact('pnj', 'npc', { value: 5, type: 'solide' });
        expect(pnj().hp).toBe(-1);
        expect(pnj().status).not.toBe('dead');
        expect(pnj().healthSystem!.state).toBe('critical');
    });
    it('les PV réglés depuis le plateau gardent le négatif', () => {
        monter();
        useSessionOSStore.getState().updateCharacterHP('p', 'pj', -2);
        expect(pj().hp).toBe(-2);
        expect(pj().healthSystem).toMatchObject({ data: { current: -2, sousZero: true }, state: 'critical' });
    });
});
