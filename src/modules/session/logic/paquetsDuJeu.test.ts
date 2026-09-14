import { describe, it, expect } from 'vitest';
import {
    paquetsDuJeu,
    paquetsOffertsAuxJoueurs,
    systemeDeLaCampagne,
    JEU_UNIVERSEL,
} from './paquetsDuJeu';
import type { DeckManifest, Campaign } from '../store/types';

/**
 * **Un paquet sorti du jeu disparaît des DEUX écrans.**
 *
 * ⛔ **Le défaut, signalé par David le 2026-09-14** : *« j'ai désactivé les
 * cartes pour Blade Runner mais elles restent visibles dans la tablette »*.
 *
 * Il avait sorti un paquet du jeu. La bibliothèque du meneur l'a retiré ; la
 * tablette a continué de l'offrir, parce qu'elle ne regardait que
 * `ouvertAuxJoueurs`. *Deux lecteurs d'une même liste, dont un seul connaissait
 * la règle* — c'est le motif que Deck-OS avait déjà payé le 2026-08-30, quand
 * la liste « Donner à » ignorait la campagne.
 */

const paquet = (p: Partial<DeckManifest>): DeckManifest => ({
    id: 'd', name: 'Paquet', systemId: JEU_UNIVERSEL, folderPath: '', cardCount: 54,
    format: 'poker', orientation: 'portrait', useDiscard: true, ...p,
});

const BLADE_RUNNER = 'custom-1774725549525';
const TORG = 'custom-1774618478256';

const PAQUETS = [
    paquet({ id: 'action', name: 'Torg Action', systemId: TORG, ouvertAuxJoueurs: true }),
    paquet({ id: 'indices', name: 'Indices', systemId: BLADE_RUNNER, ouvertAuxJoueurs: true }),
    paquet({ id: 'oracle', name: 'Oracle du MJ', systemId: BLADE_RUNNER }),
    paquet({ id: '54', name: 'Jeu de 54', systemId: JEU_UNIVERSEL, ouvertAuxJoueurs: true }),
];

describe('systemeDeLaCampagne', () => {
    const campagnes = [
        { id: 'c-1', name: 'Anges de Feu', system: BLADE_RUNNER, activeLocationIds: [] },
        { id: 'c-2', name: 'Sans jeu', system: '', activeLocationIds: [] },
    ] as Campaign[];

    it('rend le système de la campagne ouverte', () => {
        expect(systemeDeLaCampagne(campagnes, 'c-1')).toBe(BLADE_RUNNER);
    });

    /* Aucune campagne ouverte, une campagne sans jeu, une campagne introuvable :
       trois façons de ne rien savoir, et une seule réponse sûre. */
    it.each([
        ['aucune campagne ouverte', null],
        ['une campagne sans jeu', 'c-2'],
        ['une campagne introuvable', 'c-disparue'],
    ])('retombe sur le jeu universel : %s', (_cas, id) => {
        expect(systemeDeLaCampagne(campagnes, id)).toBe(JEU_UNIVERSEL);
    });

    it('ne s’étrangle pas sur une liste absente', () => {
        expect(systemeDeLaCampagne(undefined, 'c-1')).toBe(JEU_UNIVERSEL);
    });
});

describe('paquetsDuJeu', () => {
    it('garde ceux du jeu, et les universels', () => {
        expect(paquetsDuJeu(PAQUETS, BLADE_RUNNER).map(p => p.id))
            .toEqual(['indices', 'oracle', '54']);
    });

    /**
     * ⛔ **Le cas de David, exactement.** Le paquet « Torg Action » était
     * déclaré sous Blade Runner ; il l'a rendu à Torg. Il doit alors quitter les
     * deux écrans, pas seulement celui du meneur.
     */
    it('écarte celui qu’on vient de rendre à un autre jeu', () => {
        expect(paquetsDuJeu(PAQUETS, BLADE_RUNNER).map(p => p.id)).not.toContain('action');
        expect(paquetsDuJeu(PAQUETS, TORG).map(p => p.id)).toContain('action');
    });

    /** *Un jeu de 54 cartes sert partout* — l'exclure obligerait à le déclarer
        une fois par système. */
    it('laisse passer l’universel dans tous les jeux', () => {
        for (const jeu of [BLADE_RUNNER, TORG, JEU_UNIVERSEL, 'un-jeu-inconnu']) {
            expect(paquetsDuJeu(PAQUETS, jeu).map(p => p.id)).toContain('54');
        }
    });

    it('ne s’étrangle pas sur une liste absente', () => {
        expect(paquetsDuJeu(undefined, BLADE_RUNNER)).toEqual([]);
    });
});

describe('paquetsOffertsAuxJoueurs', () => {
    /** Les deux moitiés, et il en fallait deux : c'est la seconde qui manquait. */
    it('exige le jeu ET l’ouverture', () => {
        expect(paquetsOffertsAuxJoueurs(PAQUETS, BLADE_RUNNER).map(p => p.id))
            .toEqual(['indices', '54']);
    });

    it('n’offre jamais un paquet d’un autre jeu, même grand ouvert', () => {
        // « Torg Action » porte `ouvertAuxJoueurs: true` : sans le filtre par
        // jeu, il passait — et c'est précisément ce que David voyait.
        expect(paquetsOffertsAuxJoueurs(PAQUETS, BLADE_RUNNER).map(p => p.id))
            .not.toContain('action');
    });

    /** *L'absence vaut fermé*, et sans migration : les paquets d'avant le
        2026-08-30 restent au meneur. */
    it('traite l’absence d’ouverture comme un refus', () => {
        expect(paquetsOffertsAuxJoueurs(PAQUETS, BLADE_RUNNER).map(p => p.id))
            .not.toContain('oracle');
    });

    /** Rien d'ouvert n'est un état normal, pas une panne : l'onglet se vide. */
    it('rend une liste vide quand rien n’est ouvert dans ce jeu', () => {
        const fermes = PAQUETS.map(p => ({ ...p, ouvertAuxJoueurs: false }));
        expect(paquetsOffertsAuxJoueurs(fermes, BLADE_RUNNER)).toEqual([]);
    });
});

/**
 * **La règle ne se réécrit pas ailleurs.**
 *
 * Le défaut n'était pas une règle fausse : c'était **une règle que le second
 * lecteur ne connaissait pas**. Une garde qui vérifie seulement que la fonction
 * est juste ne protège de rien — ce qu'il faut interdire, c'est le second
 * filtrage écrit à la main.
 *
 * ⚠️ On lit le **code sans les commentaires** : ceux de ce correctif nomment
 * `ouvertAuxJoueurs` pour expliquer le défaut.
 */
const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

function sansCommentaires(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

/** Le geste : trier une liste de paquets sur l'ouverture aux joueurs. */
const FILTRE_SUR_LOUVERTURE = /\.filter\([^)]*ouvertAuxJoueurs/;

describe('le tri des paquets offerts aux joueurs', () => {
    it('ne s’écrit qu’à un seul endroit', () => {
        expect(Object.keys(sources).length).toBeGreaterThan(150);

        const trieurs = Object.entries(sources)
            .filter(([chemin]) => !chemin.endsWith('.test.ts') && !chemin.endsWith('.test.tsx'))
            .filter(([, source]) => FILTRE_SUR_LOUVERTURE.test(sansCommentaires(source)))
            .map(([chemin]) => chemin);

        expect(trieurs, [
            'Un second tri des paquets écrit à la main oublie la moitié de la règle :',
            'c’est ainsi que la tablette a offert un paquet sorti du jeu le 2026-09-14.',
            'Passez par `paquetsOffertsAuxJoueurs(decks, systemeDeLaCampagne(...))`.',
        ].join(' ')).toEqual(['/src/modules/session/logic/paquetsDuJeu.ts']);
    });
});
