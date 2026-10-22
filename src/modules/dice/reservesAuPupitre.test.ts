import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { jetARegler, lireLeJetAuPupitre, reglerLesReservesDuDernierJet } from './reservesAuPupitre';
import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';

/**
 * **Les réserves d'un jet 2d20 au pupitre** — C1 de l'audit du 2026-10-22 :
 * le même jet, depuis le pupitre, paie ses dés et verse son excédent comme
 * depuis la fiche ; le meneur dit qui l'a lancé.
 */
const DUNE = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!;
const initialSession = useSessionOSStore.getState();
const initialDes = useDiceStore.getState();

/** Un jet de quatre d20 (deux achetés : 1 + 2 = 3 points), et ses réussites. */
const jet = (successes: number, des = 4): RollRecord => ({
    id: 'j1', timestamp: new Date(), title: 'Système (Dune)', total: successes, successes, modifier: 0,
    totalDisplay: `${successes}`, rolls: Array.from({ length: des }, () => ({ val: 5, sides: 20 })),
} as RollRecord);
const poser = (record: RollRecord, reserves: Record<string, number>) => {
    useDiceStore.setState({ history: [record], lastRoll: record });
    useRessourcesDeTableStore.setState({ reserves: { c: reserves } });
};
const reserves = () => useRessourcesDeTableStore.getState().reserves.c;

beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'c',
        campaigns: [{ id: 'c', name: 'Dune', system: 'dune', activeLocationIds: [] }],
        getActiveDriver: () => DUNE,
    } as never);
});
afterEach(() => {
    useSessionOSStore.setState(initialSession, true);
    useDiceStore.setState(initialDes, true);
    useRessourcesDeTableStore.setState({ reserves: {} });
});

describe('les réserves d\'un jet 2d20 au pupitre', () => {
    it('lit les dés achetés au-delà de la base, au prix croissant', () => {
        expect(lireLeJetAuPupitre(jet(3), DUNE.jet)).toEqual({ des: 4, desAchetes: 2, cout: 3 });
        expect(lireLeJetAuPupitre(jet(1, 2), DUNE.jet)).toEqual({ des: 2, desAchetes: 0, cout: 0 });
    });

    it('un personnage paie en Impulsion, puis la remplit de son excédent', () => {
        poser(jet(3), { impulsion: 4, menace: 0 });
        reglerLesReservesDuDernierJet('personnage', { difficulte: 1 });
        expect(reserves()).toMatchObject({ impulsion: 3, menace: 0 }); // 4 − 3 + 2
    });

    it('… ou en Menace par choix, quand le jeu le permet', () => {
        poser(jet(3), { impulsion: 4, menace: 0 });
        reglerLesReservesDuDernierJet('personnage', { difficulte: 1, enReport: 2 });
        expect(reserves()).toMatchObject({ impulsion: 5, menace: 2 }); // 4 − 1 + 2
    });

    it('un PNJ paie en Menace, et son excédent va à la Menace', () => {
        poser(jet(3), { impulsion: 4, menace: 5 });
        reglerLesReservesDuDernierJet('pnj', { difficulte: 1 });
        expect(reserves()).toMatchObject({ impulsion: 4, menace: 4 }); // 5 − 3 + 2
    });

    it('réserve pleine : l\'excédent hors réserve se dit, rien n\'est détruit en silence', () => {
        poser(jet(2, 2), { impulsion: 6, menace: 0 });
        const dits = reglerLesReservesDuDernierJet('personnage', { difficulte: 1 });
        expect(reserves().impulsion).toBe(6);
        expect(dits).toContain('1 Impulsion hors réserve, pleine : à dépenser sur ce test, sinon perdu.');
    });

    it('un jet réglé ne se règle plus : on ne paie pas deux fois', () => {
        poser(jet(3), { impulsion: 4, menace: 0 });
        reglerLesReservesDuDernierJet('personnage', { difficulte: 1 });
        expect(jetARegler(useDiceStore.getState().history[0], DUNE.jet)).toBe(false);
        expect(reglerLesReservesDuDernierJet('pnj', { difficulte: 1 })).toEqual([]);
        expect(reserves()).toMatchObject({ impulsion: 3, menace: 0 });
    });

    it('un jeu qui ne paie pas ses dés n\'a rien à régler', () => {
        expect(jetARegler(jet(3), { sens: 'sous-ou-egal', reserve: { base: 1, max: 1, faces: 20 } })).toBe(false);
        expect(jetARegler(jet(3), undefined)).toBe(false);
    });
});
