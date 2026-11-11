import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClockStore, jaugesVuesParLesJoueurs, type TensionClock } from '../../store/useClockStore';
import { rappelsEnAttente } from './logic/rappelDeLaJauge';
import { segmentDesHorloges } from '../remote/logic/segmentDesHorloges';

/**
 * **Le rappel d'un jet dû, dans le magasin** — lot 2
 * (`2026-11-11-rappel-de-jet-du.md`, T2 ; C1 à C5).
 *
 * Ce qui se joue ici est le **branchement** : la logique pure est éprouvée à
 * part. Les jauges ont une douzaine d'écrivains, plus la synchronisation entre
 * fenêtres et la restauration d'une séance (`setState`) ; le rappel doit
 * paraître et se réarmer **quel que soit le geste**, ce que garantit un seul
 * abonnement au magasin.
 */

vi.mock('../journal/useJournalStore', () => ({
    useJournalStore: { getState: () => ({ isRecording: false, addEvent: vi.fn() }) },
}));

const AIR: TensionClock = {
    id: 'air', name: 'Air respirable', totalSegments: 3, filledSegments: 1,
    sens: 'epuisement', vueParLesJoueurs: true, rappel: { texte: "Jet d'Endurance, tout le monde" },
};
const ALERTE: TensionClock = {
    id: 'alerte', name: 'Alerte', totalSegments: 2, filledSegments: 1, vueParLesJoueurs: true,
};

const s = () => useClockStore.getState();
const enAttente = () => rappelsEnAttente(s().tensions).map(r => r.jaugeId);
const rappel = (id: string) => s().tensions.find(t => t.id === id)?.rappel;

beforeEach(() => {
    useClockStore.setState({ tensions: [{ ...AIR, rappel: { ...AIR.rappel! } }, { ...ALERTE }] });
});

describe('régler le rappel (C1)', () => {
    it('s’écrit, se réécrit, et s’efface — une jauge sans rappel ne change pas', () => {
        s().reglerLeRappel('alerte', '  La patrouille passe : 1d6  ');
        expect(rappel('alerte')).toEqual({ texte: 'La patrouille passe : 1d6' });
        s().reglerLeRappel('alerte', '');
        expect(s().tensions.find(t => t.id === 'alerte')).toEqual(ALERTE);
        s().reglerLeRappel('alerte', null);
        expect('rappel' in s().tensions.find(t => t.id === 'alerte')!).toBe(false);
    });
});

describe('au bout, quel que soit le geste (C2)', () => {
    it('par un clic', () => {
        expect(enAttente()).toEqual([]);
        s().updateTensionSegments('air', -1);
        expect(enAttente()).toEqual(['air']);
    });

    it('par une fin de scène', () => {
        useClockStore.setState({ tensions: s().tensions.map(t => (t.id === 'air' ? { ...t, pasParScene: 1 } : t)) });
        s().laSceneSeTermine();
        expect(enAttente()).toEqual(['air']);
    });

    it('par le remplissage d’une jauge qui monte', () => {
        s().reglerLeRappel('alerte', 'Renforts');
        s().remplirLaJauge('alerte');
        expect(enAttente()).toEqual(['alerte']);
    });
});

describe('une fois par passage (C3, C4)', () => {
    it('traité, il ne revient pas tant que la jauge reste au bout ; reparti, il se réarme', () => {
        s().updateTensionSegments('air', -1);
        s().traiterLeRappel('air');
        expect(enAttente()).toEqual([]);
        // Un autre geste sur une autre jauge ne le réveille pas.
        s().updateTensionSegments('alerte', 1);
        expect(enAttente()).toEqual([]);
        // La jauge repart du bout : réarmé…
        s().updateTensionSegments('air', 1);
        expect(rappel('air')).toEqual({ texte: AIR.rappel!.texte });
        // … et il revient au passage suivant.
        s().updateTensionSegments('air', -1);
        expect(enAttente()).toEqual(['air']);
    });

    it('se réarme aussi par un `setState` venu du dehors (restauration, autre fenêtre)', () => {
        useClockStore.setState({ tensions: [{ ...AIR, filledSegments: 2, rappel: { ...AIR.rappel!, traite: true } }] });
        expect(rappel('air')).toEqual({ texte: AIR.rappel!.texte });
    });

    it('changer le texte d’un rappel traité ne le rouvre pas', () => {
        s().updateTensionSegments('air', -1);
        s().traiterLeRappel('air');
        s().reglerLeRappel('air', 'Autre jet');
        expect(enAttente()).toEqual([]);
    });
});

describe('rien à la table (C5)', () => {
    it('le segment des tablettes ne porte jamais le rappel', () => {
        s().updateTensionSegments('air', -1);
        const segment = segmentDesHorloges(s());
        expect(segment.tensions.map(t => t.id)).toEqual(['air', 'alerte']);
        for (const t of segment.tensions) expect('rappel' in t).toBe(false);
        // Le magasin du meneur, lui, le garde.
        expect(rappel('air')).toBeDefined();
    });

    it('une jauge secrète reste retirée, comme avant', () => {
        expect(jaugesVuesParLesJoueurs([{ ...AIR, vueParLesJoueurs: false }, ALERTE]).map(t => t.id)).toEqual(['alerte']);
    });
});
