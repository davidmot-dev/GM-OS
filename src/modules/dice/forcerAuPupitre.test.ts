import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { forcerLeDernierJet, pourquoiNePasForcerAuPupitre } from './forcerAuPupitre';
import { DiceEngine } from './DiceEngine';
import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';

/**
 * **Forcer au pupitre** — Year Zero, 2026-10-14. Le pupitre relance selon la
 * règle du pilote et annonce le prix ; il ne connaît pas la fiche.
 */
const ALIEN = {
    id: 'alien', name: 'Alien', templateId: 't', dice: { defaultDice: 'd6', logic: 'count-success', engine: 'yze' },
    jet: {
        sens: 'superieur-ou-egal',
        reserve: { base: 0, max: 10, faces: 6, secondaire: { label: 'Stress', libelleDuUn: 'Panique', composantes: [] } },
        forcer: { garde: 'reussites', bloqueParLaSeconde: true, monteeDeLaSeconde: 1 },
    },
};
const BLADE_RUNNER = {
    id: 'br', name: 'Blade Runner', templateId: 't', dice: { defaultDice: '1d6', logic: 'count-success', engine: 'yze-echelonne' },
    jet: {
        sens: 'superieur-ou-egal',
        desEchelonnes: { echelle: 'yze-lettres', composantes: [] },
        forcer: {
            garde: 'reussites-et-uns',
            foisSi: [{ si: { champ: 'nature', contient: ['réplicant'] }, fois: 2 }],
            prixDesUns: { champ: 'sante', label: 'Santé', si: [{ si: { champ: 'nature', contient: ['réplicant'] }, champ: 'sangFroid', label: 'Sang-froid' }] },
        },
    },
};
const jet = (rolls: RollRecord['rolls'], titre = 'Jet'): RollRecord =>
    ({ id: 'j1', timestamp: new Date(), title: titre, total: 0, modifier: 0, totalDisplay: '', rolls });
const sousLePilote = (pilote: object) => useSessionOSStore.setState({
    activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'C', system: (pilote as { id: string }).id }], customGameDrivers: [pilote],
} as never);

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); useDiceStore.setState({ history: [], lastRoll: null, isDiceProjected: false }); });
afterEach(() => { de.mockRestore(); useSessionOSStore.setState({ campaigns: [], customGameDrivers: [], activeCampaignId: null } as never); });

describe('forcer le dernier jet du pupitre', () => {
    it('Alien : on relance, un dé de Stress s’ajoute, et le prix s’annonce', () => {
        sousLePilote(ALIEN);
        useDiceStore.setState({ history: [jet([{ val: 6, sides: 6, source: 'base' }, { val: 2, sides: 6, source: 'base' }, { val: 4, sides: 6, source: 'gear' }], 'Combat rapproché')] });
        const faces = [6, 3, 5];
        de.mockImplementation(() => faces.shift()!);
        expect(forcerLeDernierJet()).toBeNull();
        const force = useDiceStore.getState().history[0];
        expect(force.rolls.map(d => d.val)).toEqual([6, 6, 3, 5]);
        expect(force.successes).toBe(2);
        expect(force.title).toBe('Combat rapproché · forcé — Stress +1 à reporter sur la fiche');
        expect(force.forcages).toBe(1);
        expect(forcerLeDernierJet()).toBe('Ce jet a déjà été forcé.');
    });

    it('Alien : une Panique au premier lancer l’interdit', () => {
        expect(pourquoiNePasForcerAuPupitre(jet([{ val: 2, sides: 6, source: 'base' }, { val: 1, sides: 6, source: 'gear' }]), ALIEN.jet as never))
            .toMatch(/^Panique/);
    });

    it('Blade Runner : deux forçages au plus, chaque crâne annoncé une seule fois', () => {
        sousLePilote(BLADE_RUNNER);
        useDiceStore.setState({ history: [jet([{ val: 1, sides: 10, source: 'base' }, { val: 4, sides: 8, source: 'base' }])] });
        de.mockImplementation(() => 3);
        forcerLeDernierJet();
        expect(useDiceStore.getState().history[0].title).toBe('Jet · forcé — −1 Santé ou Sang-froid à reporter sur la fiche');
        de.mockImplementation(() => 1);
        forcerLeDernierJet();
        expect(useDiceStore.getState().history[0].title).toBe('Jet · forcé — −1 Santé ou Sang-froid à reporter sur la fiche');
        expect(forcerLeDernierJet()).toBe('Ce jet a déjà été forcé 2 fois.');
    });

    it('un jet qui n’est pas Year Zero ne se force pas', () => {
        expect(pourquoiNePasForcerAuPupitre(jet([{ val: 14, sides: 20 }]), ALIEN.jet as never)).toBe('Seul un jet Year Zero se force.');
    });
});
