import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pistesDeSanteSelonLeJeu, type RegleDesPistesDeSante } from './pistesDeDegenesis';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';

/** La santé de Degenesis à la porte des dégâts, contre les exemples du livre Katharsys (p. 94, 107). */

const REGLE: RegleDesPistesDeSante = { mecanique: 'degenesis', blessures: 'blessures_superficielles', traumatismes: 'traumatismes', ego: 'ego_jauge' };
const STATS = [
    { fieldId: 'sante', isMainHP: true, max: '(physique + resistance) * 2 + physique + psyche' },
    { fieldId: 'blessures_superficielles', max: '(physique + resistance) * 2' },
    { fieldId: 'traumatismes', max: 'physique + psyche' },
    { fieldId: 'ego_jauge', max: 'ego_max' },
];
// L'Usudi : PHY+Résistance 4 (8 Blessures superficielles), PHY 2 + PSY 2 (4 Traumatismes).
const USUDI = { physique: 2, resistance: 2, psyche: 2, sante: 12, blessures_superficielles: 0, traumatismes: 0, ego_jauge: 6, ego_max: 8 };

describe('les deux pistes', () => {
    it('le défricheur de Vedran, 10 dégâts : 8 Blessures superficielles et 2 Traumatismes (p. 107)', () => {
        const r = pistesDeSanteSelonLeJeu(REGLE, USUDI, { value: 10 }, STATS);
        expect(r?.fiche).toEqual({ blessures_superficielles: 8, traumatismes: 2 });
        expect(r?.impact).toMatchObject({ value: 10, isRecovery: false });
        expect(r?.texte).toBe('10 dégâts : Blessures superficielles 8/8, 2 Traumatismes de plus (2/4, −2D).');
    });

    it('au maximum des Traumatismes, il ne peut plus être sauvé ; la jauge tombe à zéro', () => {
        const r = pistesDeSanteSelonLeJeu(REGLE, { ...USUDI, sante: 2, blessures_superficielles: 8, traumatismes: 2 }, { value: 11 }, STATS);
        expect(r?.fiche).toEqual({ blessures_superficielles: 8, traumatismes: 4 });
        expect(r?.impact.value).toBe(2);
        expect(r?.texte).toMatch(/ne peut plus être sauvé/);
    });

    it('le soin efface les Blessures superficielles, jamais les Traumatismes', () => {
        const r = pistesDeSanteSelonLeJeu(REGLE, { ...USUDI, sante: 4, blessures_superficielles: 6, traumatismes: 2 }, { value: 4, isRecovery: true }, STATS);
        expect(r?.fiche).toEqual({ blessures_superficielles: 2, traumatismes: 2 });
        expect(r?.impact).toMatchObject({ value: 4, isRecovery: true });
    });

    it('une piste corrigée à la main : la jauge la rejoint au coup suivant', () => {
        // La fiche HTML dit 3 Blessures ; la jauge, restée à 12, n'en savait rien.
        const r = pistesDeSanteSelonLeJeu(REGLE, { ...USUDI, blessures_superficielles: 3 }, { value: 2 }, STATS);
        expect(r?.fiche).toMatchObject({ blessures_superficielles: 5 });
        expect(r?.impact.value).toBe(5);
    });

    it('une attaque mentale retire ses dégâts à l’Égo ; à zéro, il s’effondre (p. 107)', () => {
        const r = pistesDeSanteSelonLeJeu(REGLE, USUDI, { value: 7, type: 'mental' }, STATS);
        expect(r?.fiche).toEqual({ ego_jauge: 0 });
        expect(r?.impact.value).toBe(0);
        expect(r?.texte).toMatch(/s'effondre.*PSY\+Foi ou Volonté \(2\)/);
    });

    it('sans règle ou sans maximum lisible, l’impact passe tel quel', () => {
        expect(pistesDeSanteSelonLeJeu(undefined, USUDI, { value: 3 }, STATS)).toBeNull();
        expect(pistesDeSanteSelonLeJeu(REGLE, { sante: 5 }, { value: 3 }, STATS)).toBeNull();
    });
});

describe('à la porte des dégâts', () => {
    const session = useSessionOSStore.getState();
    const DEGENESIS = {
        id: 'degenesis', name: 'Degenesis', templateId: 'tpl',
        combat: { defaultHealthType: 'hp', initiativeFormula: 'psyche + reactivite', statsToTrack: STATS, pistesDeSante: REGLE },
    } as unknown as GameDriver;

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        useSessionOSStore.setState({
            activeCampaignId: 'c', customGameDrivers: [DEGENESIS],
            campaigns: [{ id: 'c', name: 'Borca', system: 'degenesis', activeLocationIds: [] }],
            players: [{ id: 'p', realName: 'Léa', avatarUrl: '', isOnline: false, characters: [{
                id: 'falberg', name: 'Falberg', campaignId: 'c', templateId: 'tpl', systemId: 'degenesis',
                hp: 15, maxHp: 15, sheetData: { physique: 3, resistance: 2, psyche: 2, sante: 15, blessures_superficielles: 0, traumatismes: 0 },
            }] }],
        } as never);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        useSessionOSStore.setState(session, true);
    });

    it('Falberg encaisse 12 dégâts : 10 Blessures superficielles, 2 Traumatismes, la santé à 3 sur 15', () => {
        useSessionOSStore.getState().handleApplyImpact('falberg', 'pc', { value: 12 });
        const falberg = useSessionOSStore.getState().players[0].characters[0];
        expect(falberg.sheetData).toMatchObject({ blessures_superficielles: 10, traumatismes: 2, sante: 3 });
        expect(falberg.hp).toBe(3);
    });
});
