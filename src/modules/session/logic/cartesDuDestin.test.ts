import { describe, it, expect } from 'vitest';
import {
    completerLesMains,
    momentCritique,
    nouvellesMains,
    paquetDuDestinDuJeu,
    piocherPour,
    poserEnReserve,
    reprendreLesReserves,
} from './cartesDuDestin';
import { mainsPourLaTable, placesDesCartes } from './mainsDuPaquet';
import type { DeckManifest, DeckSessionState } from '../../../types/deck.types';

/**
 * **Les Cartes du Destin de Torg** — carnet NotebookLM « Torg », 2026-10-14.
 * Une main de 4, la Réserve d'Action publique, le Moment critique une fois par
 * Acte, la main complétée en fin de scène, renouvelée en fin d'Acte. Et
 * l'invariant du paquet tient partout : *chaque carte est à un seul endroit.*
 */

/** Mara tient 7 et 8 ; Teo tient 9. */
const etat = (p: Partial<DeckSessionState> = {}): DeckSessionState => ({
    deckId: 'destin',
    remainingIndices: [1, 2, 3, 4, 5, 6],
    discardedIndices: [],
    currentCardIndex: null,
    enMain: [
        { index: 7, porteur: 'mara', face: 'revelee' },
        { index: 8, porteur: 'mara', face: 'revelee' },
        { index: 9, porteur: 'teo', face: 'revelee' },
    ],
    ...p,
});
const sansDoublon = (e: DeckSessionState) => expect(placesDesCartes(e).doublons).toEqual([]);
const identite = (xs: number[]) => xs;

describe('la Réserve d’Action', () => {
    it('une carte posée devient publique : la table la voit', () => {
        const apres = poserEnReserve(etat(), 8);
        expect(apres.enMain?.find(c => c.index === 8)).toMatchObject({ enReserve: true, face: 'revelee' });
        const mara = mainsPourLaTable(apres).find(m => m.porteur === 'mara')!;
        expect(mara.enReserve).toEqual([8]);
        expect(mara.revelees).toEqual([7, 8]);
    });

    it('poser ne crée jamais de carte', () => {
        expect(poserEnReserve(etat(), 3)).toEqual(etat());
    });

    it('après le combat, la Réserve revient en main', () => {
        const { etat: apres, reprises } = reprendreLesReserves(poserEnReserve(poserEnReserve(etat(), 8), 9));
        expect(reprises).toBe(2);
        expect(apres.enMain?.some(c => c.enReserve)).toBe(false);
    });
});

describe('le Moment critique', () => {
    it('toute la main passe en Réserve, et une fois par Acte', () => {
        const { etat: apres, refus } = momentCritique(etat(), 'mara');
        expect(refus).toBeUndefined();
        expect(apres.enMain?.filter(c => c.porteur === 'mara').every(c => c.enReserve)).toBe(true);
        expect(apres.enMain?.find(c => c.index === 9)?.enReserve, 'la main de Teo ne bouge pas').toBeFalsy();
        expect(mainsPourLaTable(apres).find(m => m.porteur === 'mara')?.momentCritiqueJoue).toBe(true);

        expect(momentCritique(apres, 'mara').refus).toBe('Le Moment critique est déjà joué pour cet Acte.');
    });

    it('sans carte en main, il ne se joue pas', () => {
        expect(momentCritique(etat(), 'personne').refus).toBe('Aucune carte en main à poser en Réserve.');
    });
});

describe('les mains', () => {
    it('fin de scène : chacun complète à 4, et qui en a plus doit défausser — GM-OS ne choisit pas', () => {
        const trop = etat({ enMain: [...etat().enMain!, ...[10, 11, 12, 13].map(index => ({ index, porteur: 'teo', face: 'revelee' as const }))] });
        const bilan = completerLesMains(trop, ['mara', 'teo'], 4);
        expect(bilan.pioches).toEqual({ mara: 2 });
        expect(bilan.enTrop).toEqual({ teo: 1 });
        sansDoublon(bilan.etat);
    });

    it('la Réserve compte dans la main', () => {
        const bilan = completerLesMains(poserEnReserve(etat(), 8), ['mara'], 4);
        expect(bilan.pioches).toEqual({ mara: 2 });
    });

    it('pioche vide : la défausse est remélangée, les mains restent', () => {
        const vide = etat({ remainingIndices: [], discardedIndices: [1, 2] });
        const bilan = completerLesMains(vide, ['mara'], 4, identite);
        expect(bilan.pioches).toEqual({ mara: 2 });
        expect(bilan.etat.enMain?.filter(c => c.porteur === 'teo').map(c => c.index)).toEqual([9]);
        sansDoublon(bilan.etat);
    });

    it('plus rien nulle part : le manque se dit', () => {
        const bilan = completerLesMains(etat({ remainingIndices: [1] }), ['mara'], 4);
        expect(bilan.pioches).toEqual({ mara: 1 });
        expect(bilan.manquantes).toBe(1);
    });

    it('fin d’Acte : tout est défaussé, nouvelles mains, Moments critiques rendus', () => {
        const avant = momentCritique(etat(), 'mara').etat;
        const bilan = nouvellesMains(avant, ['mara', 'teo'], 4, true);
        expect(bilan.etat.discardedIndices.sort()).toEqual([7, 8, 9]);
        expect(bilan.pioches).toEqual({ mara: 4, teo: 2 });
        expect(bilan.etat.momentsCritiques).toEqual([]);
        expect(bilan.manquantes).toBe(2);
        sansDoublon(bilan.etat);
    });

    it('l’Action approuvée : la carte du dessus, dans la main', () => {
        const { etat: apres, index } = piocherPour(etat(), 'teo');
        expect(index).toBe(1);
        expect(apres.enMain?.find(c => c.index === 1)).toMatchObject({ porteur: 'teo', face: 'revelee' });
        sansDoublon(apres);
    });
});

describe('le Paquet du Destin du jeu', () => {
    it('est le paquet du système marqué « destin »', () => {
        const p = (id: string, role?: 'action' | 'destin', systemId = 'torg') =>
            ({ id, name: id, systemId, folderPath: '', cardCount: 1, format: 'poker', orientation: 'portrait', useDiscard: true, role }) as DeckManifest;
        expect(paquetDuDestinDuJeu([p('a', 'action'), p('d', 'destin'), p('x', 'destin', 'br')], 'torg')?.id).toBe('d');
        expect(paquetDuDestinDuJeu([p('a', 'action')], 'torg')).toBeNull();
    });
});
