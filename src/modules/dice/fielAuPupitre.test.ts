import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import type { GameDriver } from '../../types/drivers';
import { attribuerLeFielDuDernierJet, jetDeDestinAAttribuer, unsDuJetDeDestin } from './fielAuPupitre';

/**
 * **Les 1 d'un jet de destin au pupitre** — NOC, 2026-10-16 : un Héros verse le
 * Fiel, un Rouage hostile en retire ; à zéro, un Héros gagne de la Singularité.
 */
const PILOTE = {
    id: 'noc', name: 'NOC',
    jet: { sens: 'superieur-ou-egal', destin: { fiel: 'Fiel' } },
    ressourcesDeTable: [
        { id: 'Fiel', label: 'Fiel', proprietaire: 'meneur', depart: 0, min: 0, max: 5, debordement: { vers: 'Menace' } },
        { id: 'Menace', label: 'Menace', proprietaire: 'meneur', depart: 0, min: 0 },
    ],
} as unknown as GameDriver;
const jet = (...faces: number[]): RollRecord => ({
    id: `j-${faces.join('')}`, timestamp: new Date(), title: 'Rouage', total: 0, modifier: 0, successes: 0, fails: 0,
    tagSuccess: false, totalDisplay: '', rolls: faces.map(val => ({ val, sides: 10 })),
} as unknown as RollRecord);
const fiel = () => useRessourcesDeTableStore.getState().reserves.c?.Fiel ?? 0;

const initial = useSessionOSStore.getState();
beforeEach(() => {
    useSessionOSStore.setState({
        activeCampaignId: 'c', campaigns: [{ id: 'c', name: 'NOC', system: 'noc', activeLocationIds: [] }],
        getActiveDriver: () => PILOTE,
    } as never);
    useRessourcesDeTableStore.setState({ reserves: {} });
    useDiceStore.setState({ history: [], lastRoll: null });
});
afterEach(() => { useSessionOSStore.setState(initial, true); });

const lancer = (r: RollRecord) => useDiceStore.getState().setLastRoll(r);

describe('les 1 d’un jet de destin au pupitre', () => {
    it('compte les 1 des d10, sans les dés écartés', () => {
        expect(unsDuJetDeDestin({ rolls: [{ val: 1, sides: 10 }, { val: 1, sides: 10, isDropped: true }, { val: 9, sides: 10 }] } as never)).toBe(1);
    });

    it('un Héros verse ses 1 dans le Fiel — une seule fois par jet', () => {
        lancer(jet(1, 1, 8));
        expect(jetDeDestinAAttribuer(useDiceStore.getState().history[0], PILOTE.jet)).toBe(true);
        attribuerLeFielDuDernierJet('heros');
        expect(fiel()).toBe(2);
        expect(jetDeDestinAAttribuer(useDiceStore.getState().history[0], PILOTE.jet)).toBe(false);
        expect(attribuerLeFielDuDernierJet('heros')).toEqual([]);
        expect(fiel()).toBe(2);
    });

    it('un Rouage hostile retire autant de gouttes que de 1', () => {
        useRessourcesDeTableStore.setState({ reserves: { c: { Fiel: 3 } } });
        lancer(jet(1, 1, 4));
        const dits = attribuerLeFielDuDernierJet('rouage');
        expect(fiel()).toBe(1);
        expect(dits[0]).toBe('Rouage hostile : Fiel −2.');
    });

    it('le Fiel à zéro : un Héros désigné par la Loi gagne la Singularité qui reste', () => {
        useRessourcesDeTableStore.setState({ reserves: { c: { Fiel: 1 } } });
        lancer(jet(1, 1, 1));
        const dits = attribuerLeFielDuDernierJet('rouage');
        expect(fiel()).toBe(0);
        expect(dits.at(-1)).toBe('Fiel déjà à 0 : un Héros désigné par la Loi gagne 2 points de Singularité.');
    });

    it('rien à attribuer sans 1, ou sur un jeu sans Fiel', () => {
        lancer(jet(8, 9));
        expect(jetDeDestinAAttribuer(useDiceStore.getState().history[0], PILOTE.jet)).toBe(false);
        lancer(jet(1));
        expect(jetDeDestinAAttribuer(useDiceStore.getState().history[0], { sens: 'superieur-ou-egal' } as never)).toBe(false);
    });
});
