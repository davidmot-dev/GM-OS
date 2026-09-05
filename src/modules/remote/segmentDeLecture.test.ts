import { describe, it, expect } from 'vitest';
import { segmentDeLecture } from './segmentDeLecture';
import type { Acte, Scene } from '../../types/trame.types';
import type { WikiEntry, Clue } from '../../types/chronicle.types';

/**
 * **Ce que le meneur lit sur sa tablette.**
 *
 * Ajouté le 2026-09-05 à la demande de David. L'onglet Notes ne portait que deux
 * champs de texte libre ; la trame, le wiki et les indices vivaient sur l'écran
 * du PC, hors de portée dès qu'on tient la tablette.
 */

const CAMPAGNE = 'c-actuelle';
const AUTRE = 'c-autre';

const acte = (id: string, ordre: number, campaignId = CAMPAGNE, reste: Partial<Acte> = {}): Acte =>
    ({ id, campaignId, ordre, titre: `Acte ${ordre}`, resume: '', ...reste });

const scene = (id: string, acteId: string, ordre: number, reste: Partial<Scene> = {}): Scene =>
    ({ id, campaignId: CAMPAGNE, acteId, ordre, titre: `Scène ${id}`, resume: '',
       origine: 'manuelle', entiteIds: [], indiceIds: [], ...reste } as Scene);

describe('la trame envoyée à la tablette', () => {
    it('ne porte que la campagne active', () => {
        const rendu = segmentDeLecture(CAMPAGNE, {
            actes: [acte('a1', 1), acte('a9', 1, AUTRE)],
            scenes: [],
        });

        expect(rendu.actes.map(a => a.id)).toEqual(['a1']);
    });

    it('rend tout vide sans campagne — une tablette sans partie ouverte ne reçoit pas la précédente', () => {
        const rendu = segmentDeLecture(null, {
            actes: [acte('a1', 1)],
            wikiEntries: [{ id: 'w1', campaignId: CAMPAGNE, title: 'X', content: '', category: 'lore', tags: [], imageUrls: [], linkedEntityIds: [] }],
        });

        expect(rendu).toEqual({ actes: [], wiki: [], indices: [] });
    });

    it('range les actes et leurs scènes dans l’ordre', () => {
        const rendu = segmentDeLecture(CAMPAGNE, {
            actes: [acte('a2', 2), acte('a1', 1)],
            scenes: [scene('s2', 'a1', 2), scene('s1', 'a1', 1)],
        });

        expect(rendu.actes.map(a => a.id)).toEqual(['a1', 'a2']);
        expect(rendu.actes[0].scenes.map(s => s.id)).toEqual(['s1', 's2']);
    });
});

describe('l’état d’une scène est calculé ICI, pas sur la tablette', () => {
    it('déduit les quatre états', () => {
        const rendu = segmentDeLecture(CAMPAGNE, {
            actes: [acte('a1', 1)],
            scenes: [
                scene('prevue', 'a1', 1),
                scene('encours', 'a1', 2, { passages: [{ debut: 1000 }] }),
                scene('pause', 'a1', 3, { passages: [{ debut: 1000, fin: 2000 }] }),
                scene('close', 'a1', 4, { passages: [{ debut: 1, fin: 2 }], termineeLe: 3000 }),
            ],
        });

        expect(rendu.actes[0].scenes.map(s => s.etat))
            .toEqual(['prevue', 'en-cours', 'en-pause', 'terminee']);
    });

    it('distingue close et close-sans-avoir-été-jouée', () => {
        /* Les confondre ferait lire au journal une partie qui n'a pas eu lieu. */
        const rendu = segmentDeLecture(CAMPAGNE, {
            actes: [acte('a1', 1)],
            scenes: [
                scene('jouee', 'a1', 1, { passages: [{ debut: 1, fin: 2 }], termineeLe: 3 }),
                scene('jamais', 'a1', 2, { termineeLe: 3 }),
            ],
        });

        expect(rendu.actes[0].scenes.map(s => s.jamaisJouee)).toEqual([false, true]);
    });

    it('emporte les notes du meneur — c’est ce qu’on relit en jouant', () => {
        const rendu = segmentDeLecture(CAMPAGNE, {
            actes: [acte('a1', 1, CAMPAGNE, { notesDuMeneur: 'Le traître est le maire.' })],
            scenes: [scene('s1', 'a1', 1, { notesDuMeneur: 'Il ment sur son alibi.' })],
        });

        expect(rendu.actes[0].notesDuMeneur).toBe('Le traître est le maire.');
        expect(rendu.actes[0].scenes[0].notesDuMeneur).toBe('Il ment sur son alibi.');
    });
});

describe('le wiki', () => {
    const fiche = (id: string, campaignId: string, reste: Partial<WikiEntry> = {}): WikiEntry =>
        ({ id, campaignId, title: `Fiche ${id}`, content: 'du texte', category: 'lore',
           tags: ['a'], imageUrls: ['m-1', 'm-2'], linkedEntityIds: [], ...reste });

    it('filtre par campagne', () => {
        const rendu = segmentDeLecture(CAMPAGNE, { wikiEntries: [fiche('w1', CAMPAGNE), fiche('w9', AUTRE)] });
        expect(rendu.wiki.map(f => f.id)).toEqual(['w1']);
    });

    it('part SANS les images — elles pèseraient des mégaoctets à chaque synchronisation', () => {
        const rendu = segmentDeLecture(CAMPAGNE, { wikiEntries: [fiche('w1', CAMPAGNE)] });

        expect(Object.keys(rendu.wiki[0]).sort()).toEqual(['categorie', 'contenu', 'id', 'tags', 'titre']);
        expect(JSON.stringify(rendu.wiki)).not.toContain('m-1');
    });

    it('supporte une fiche sans tags', () => {
        const rendu = segmentDeLecture(CAMPAGNE, {
            wikiEntries: [{ ...fiche('w1', CAMPAGNE), tags: undefined as never }],
        });
        expect(rendu.wiki[0].tags).toEqual([]);
    });
});

describe('les indices', () => {
    const indice = (id: string, campaignId: string, isRevealed: boolean): Clue =>
        ({ id, campaignId, title: `Indice ${id}`, content: 'ce qu’il dit', isRevealed });

    it('dit lesquels ont été donnés', () => {
        const rendu = segmentDeLecture(CAMPAGNE, {
            clues: [indice('i1', CAMPAGNE, true), indice('i2', CAMPAGNE, false), indice('i9', AUTRE, true)],
        });

        expect(rendu.indices.map(i => [i.id, i.revele])).toEqual([['i1', true], ['i2', false]]);
    });
});

describe('une campagne vide', () => {
    it('ne lève pas sur des listes absentes', () => {
        expect(segmentDeLecture(CAMPAGNE, {})).toEqual({ actes: [], wiki: [], indices: [] });
    });
});
