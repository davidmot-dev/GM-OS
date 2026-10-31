import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { moniteurSelonLeJeu, positionDuMoniteur, type RegleDuMoniteur } from './moniteurDeShadowrun';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';

/** Le moniteur d'état de Shadowrun : Anarchy 2.0 à la porte des dégâts, contre le livre (p. 68-69, 72). */

const REGLE: RegleDuMoniteur = {
    mecanique: 'shadowrun', sante: 'moniteur',
    legeres: 'blessures_legeres', graves: 'blessures_graves', incapacitantes: 'blessures_incapacitantes',
    capacites: { legeres: 'blessures_legeres_max', graves: 'blessures_graves_max' },
    seuils: {
        principale: { legere: 'seuil_principale_legere', grave: 'seuil_principale_grave', incapacitante: 'seuil_principale_incapacitante' },
        mental: { legere: 'seuil_mental_legere', grave: 'seuil_mental_grave', incapacitante: 'seuil_mental_incapacitante' },
    },
    force: 'force', volonte: 'volonte',
};
// L'ork de l'exemple : Force 4, Armure 2, seuils 6/9/12 précalculés sur sa fiche (p. 72).
const ORK = {
    force: 4, volonte: 2, seuil_principale_legere: 6, seuil_principale_grave: 9, seuil_principale_incapacitante: 12,
    blessures_legeres: 0, blessures_graves: 0, blessures_incapacitantes: 0, blessures_legeres_max: 2, blessures_graves_max: 1, moniteur: 0,
};

describe('le moniteur d’état', () => {
    it('VD 8 contre 6/9/12 : une blessure légère, une case (p. 72)', () => {
        const r = moniteurSelonLeJeu(REGLE, ORK, { value: 8 });
        expect(r?.fiche).toEqual({ blessures_legeres: 1, blessures_graves: 0, blessures_incapacitantes: 0 });
        expect(r?.impact.value).toBe(1);
        expect(r?.texte).toMatch(/^VD 8 contre 6\/9\/12 \(seuils de l’armure principale\) : blessure légère — désavantage/);
    });

    it('il faut dépasser le seuil : VD 6 ne blesse pas, VD 10 fait une grave (p. 68)', () => {
        expect(moniteurSelonLeJeu(REGLE, ORK, { value: 6 })?.impact.value).toBe(0);
        const grave = moniteurSelonLeJeu(REGLE, ORK, { value: 10 });
        expect(grave?.fiche.blessures_graves).toBe(1);
        // La pire blessure se lit sur les cases : deux légères, puis la grave.
        expect(grave?.impact.value).toBe(3);
    });

    it('la troisième légère s’aggrave en grave (p. 69)', () => {
        const r = moniteurSelonLeJeu(REGLE, { ...ORK, blessures_legeres: 2, moniteur: 2 }, { value: 7 });
        expect(r?.fiche).toEqual({ blessures_legeres: 2, blessures_graves: 1, blessures_incapacitantes: 0 });
        expect(r?.texte).toMatch(/aggravée en blessure grave/);
        expect(r?.impact.value).toBe(1);
    });

    it('une attaque mentale se compare aux seuils mentaux ; vides, à la Volonté seule', () => {
        expect(moniteurSelonLeJeu(REGLE, { ...ORK, seuil_mental_legere: 4, seuil_mental_grave: 7, seuil_mental_incapacitante: 10 },
            { value: 8, type: 'mental' })?.fiche.blessures_graves).toBe(1);
        expect(moniteurSelonLeJeu(REGLE, ORK, { value: 3, type: 'mental' })?.texte).toMatch(/Volonté 2 sans protection/);
    });

    it('le soin efface la plus grave d’abord (p. 70)', () => {
        const r = moniteurSelonLeJeu(REGLE, { ...ORK, blessures_legeres: 1, blessures_graves: 1, moniteur: 3 }, { value: 1, isRecovery: true });
        expect(r?.fiche).toEqual({ blessures_legeres: 1, blessures_graves: 0, blessures_incapacitantes: 0 });
        expect(r?.impact).toMatchObject({ value: 2, isRecovery: true });
    });

    it('la position des cases suit la pire blessure', () => {
        expect(positionDuMoniteur({ legeres: 1, graves: 0, incapacitantes: 0 })).toBe(1);
        expect(positionDuMoniteur({ legeres: 0, graves: 1, incapacitantes: 0 })).toBe(3);
        expect(positionDuMoniteur({ legeres: 2, graves: 1, incapacitantes: 1 })).toBe(4);
        expect(moniteurSelonLeJeu(undefined, ORK, { value: 3 })).toBeNull();
    });
});

describe('à la porte des dégâts', () => {
    const session = useSessionOSStore.getState();
    const SR = {
        id: 'sr', name: 'Shadowrun', templateId: 'tpl',
        combat: {
            defaultHealthType: 'boxes', initiativeFormula: '', statsToTrack: [], moniteurDEtat: REGLE,
            casesDeSante: { libelle: "Moniteur d'état", nombre: 4, champ: 'moniteur', seuils: [
                { aPartirDe: 1, label: 'Légère', etat: 'scratched' }, { aPartirDe: 3, label: 'Grave', etat: 'wounded' },
                { aPartirDe: 4, label: 'Incapacitante', etat: 'critical' },
            ] },
        },
    } as unknown as GameDriver;

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        useSessionOSStore.setState({
            activeCampaignId: 'c', customGameDrivers: [SR],
            campaigns: [{ id: 'c', name: 'Seattle', system: 'sr', activeLocationIds: [] }],
            players: [{ id: 'p', realName: 'Ines', avatarUrl: '', isOnline: false, characters: [{
                id: 'iron', name: 'Iron', campaignId: 'c', templateId: 'tpl', systemId: 'sr', hp: 0, maxHp: 0, sheetData: { ...ORK },
            }] }],
        } as never);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        useSessionOSStore.setState(session, true);
    });

    it('VD 10 sur Iron : une grave, les cases à la troisième, blessée — compté une seule fois', () => {
        useSessionOSStore.getState().handleApplyImpact('iron', 'pc', { value: 10 });
        const iron = useSessionOSStore.getState().players[0].characters[0];
        expect(iron.sheetData?.blessures_graves).toBe(1);
        expect(iron.sheetData?.moniteur).toBe(3);
        expect(iron.healthSystem?.type).toBe('boxes');
        expect(iron.healthSystem?.state).toBe('wounded');
    });

    it('deux légères de suite, puis une troisième : la grave', () => {
        const coup = () => useSessionOSStore.getState().handleApplyImpact('iron', 'pc', { value: 7 });
        coup(); coup(); coup();
        const iron = useSessionOSStore.getState().players[0].characters[0];
        expect([iron.sheetData?.blessures_legeres, iron.sheetData?.blessures_graves]).toEqual([2, 1]);
        expect(iron.sheetData?.moniteur).toBe(3);
    });
});
