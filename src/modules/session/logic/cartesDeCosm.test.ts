import { describe, it, expect } from 'vitest';
import {
    cartesDeCosmAuChangement, cartesDeCosmDuDebutDActe, jouerUneCarteDeCosm, paquetsDeCosm, paquetsDesCosmsCourants,
} from './cartesDeCosm';
import { mainDuPorteur, piocherEnMain } from './mainsDuPaquet';
import type { DeckManifest, DeckSessionState } from '../../../types/deck.types';

/** Les Cartes de Cosm de Torg (livre p. 113, carnet « Torg »). */
const paquet = (id: string, cosm: string): DeckManifest => ({
    id, name: id, systemId: 'torg', folderPath: 'x', cardCount: 10, format: 'poker', orientation: 'portrait',
    useDiscard: true, role: 'cosm', cosm,
} as DeckManifest);
const NIL = paquet('p-nil', 'nil');
const AYSLE = paquet('p-aysle', 'aysle');
const PAQUETS = [NIL, AYSLE];

const etat = (deckId: string, remaining: number[]): DeckSessionState =>
    ({ deckId, remainingIndices: remaining, discardedIndices: [], currentCardIndex: null, enMain: [] });
/** Le mélange ne mélange pas : l'ordre reste lisible. */
const pasDeMelange = (indices: number[]) => indices;
const tenues = (e: DeckSessionState, p: string) => mainDuPorteur(e, p).map(c => c.index);

describe('les paquets de Cosm', () => {
    it('un paquet par cosm, et ceux des cosms courants dans l’ordre', () => {
        const decks = [...PAQUETS, { ...NIL, id: 'destin', role: 'destin' as const }];
        expect(paquetsDeCosm(decks, 'torg').map(p => p.id)).toEqual(['p-nil', 'p-aysle']);
        expect(paquetsDesCosmsCourants(PAQUETS, ['aysle', 'nil']).map(p => p.id)).toEqual(['p-aysle', 'p-nil']);
    });
});

describe('le début d’un Acte', () => {
    it('la carte non jouée est défaussée, le paquet remélangé, chacun en reçoit une', () => {
        const nil = piocherEnMain(etat('p-nil', [1, 2, 3]), 1, 'mara', 'revelee');
        const d = cartesDeCosmDuDebutDActe({
            paquets: PAQUETS, etats: { 'p-nil': { ...nil, discardedIndices: [7], cosmJoues: ['zed'] }, 'p-aysle': etat('p-aysle', [1]) },
            porteurs: ['mara', 'zed'], courants: [NIL], melanger: pasDeMelange,
        });
        expect(d.defaussees).toEqual(['mara']);
        expect(d.recues).toEqual({ mara: 'p-nil', zed: 'p-nil' });
        expect(d.etats['p-nil'].cosmJoues).toEqual([]);
        // La défausse (7 puis la carte de Mara) est revenue dans la pioche avant la donne.
        expect(tenues(d.etats['p-nil'], 'mara')).toEqual([2]);
        expect(tenues(d.etats['p-nil'], 'zed')).toEqual([3]);
        expect(d.etats['p-nil'].remainingIndices).toEqual([7, 1]);
    });

    it('zone mixte : chacun pioche dans le paquet qu’il a choisi', () => {
        const d = cartesDeCosmDuDebutDActe({
            paquets: PAQUETS, etats: { 'p-nil': etat('p-nil', [1]), 'p-aysle': etat('p-aysle', [5]) },
            porteurs: ['mara', 'zed'], courants: [NIL, AYSLE], choix: { zed: 'p-aysle' }, melanger: pasDeMelange,
        });
        expect(d.recues).toEqual({ mara: 'p-nil', zed: 'p-aysle' });
    });

    it('un paquet vide se dit', () => {
        const d = cartesDeCosmDuDebutDActe({
            paquets: PAQUETS, etats: { 'p-nil': etat('p-nil', []) }, porteurs: ['mara'], courants: [NIL], melanger: pasDeMelange,
        });
        expect(d.sansCarte).toEqual(['mara']);
    });
});

describe('le changement de cosm en cours d’Acte', () => {
    it('la carte du cosm quitté s’échange ; qui a joué la sienne ne reçoit rien', () => {
        const nil = piocherEnMain(etat('p-nil', [1, 2]), 1, 'mara', 'revelee');
        const d = cartesDeCosmAuChangement({
            paquets: PAQUETS, etats: { 'p-nil': { ...nil, cosmJoues: ['zed'] }, 'p-aysle': etat('p-aysle', [5, 6]) },
            porteurs: ['mara', 'zed'], courants: [AYSLE], melanger: pasDeMelange,
        });
        expect(d.defaussees).toEqual(['mara']);
        expect(d.recues).toEqual({ mara: 'p-aysle' });
        expect(d.dejaJouee).toEqual(['zed']);
        expect(tenues(d.etats['p-nil'], 'mara')).toEqual([]);
        expect(d.etats['p-nil'].discardedIndices).toEqual([1]);
    });

    it('une carte d’un cosm encore courant (zone mixte) se garde', () => {
        const nil = piocherEnMain(etat('p-nil', [1, 2]), 1, 'mara', 'revelee');
        const d = cartesDeCosmAuChangement({
            paquets: PAQUETS, etats: { 'p-nil': nil, 'p-aysle': etat('p-aysle', [5]) },
            porteurs: ['mara'], courants: [NIL, AYSLE], melanger: pasDeMelange,
        });
        expect(d.recues).toEqual({});
        expect(tenues(d.etats['p-nil'], 'mara')).toEqual([1]);
    });
});

describe('jouer sa carte de Cosm', () => {
    it('elle part en défausse, et son porteur l’a jouée pour cet Acte', () => {
        const e = jouerUneCarteDeCosm(piocherEnMain(etat('p-nil', [1, 2]), 1, 'mara', 'revelee'), 1, true);
        expect(e.discardedIndices).toEqual([1]);
        expect(e.cosmJoues).toEqual(['mara']);
    });
});
