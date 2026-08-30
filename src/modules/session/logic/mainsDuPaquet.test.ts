import { describe, it, expect } from 'vitest';
import type { DeckSessionState } from '../../../types/deck.types';
import {
    changerLePorteur,
    garderLaCarteRetournee,
    jouerUneCarteTenue,
    mainDuPorteur,
    mainsPourLaTable,
    placesDesCartes,
    porteursDeCartes,
    rendreUneCarteAuPaquet,
    reprendreToutesLesMains,
    retournerUneCarte,
} from './mainsDuPaquet';

/**
 * **Le quatrième tas — garder une carte tirée.**
 *
 * Idée de David du 2026-08-23, garée faute de deux décisions, tranchée le
 * 2026-08-30 : les joueurs aussi peuvent tenir une carte, chacune est face
 * visible ou cachée au choix, et **le paquet détient la vérité**.
 *
 * Presque tous les tests d'ici vérifient une seule chose, sous des angles
 * différents : **chaque carte est à un seul endroit**. C'est le seul défaut qui
 * compte dans un paquet, et c'est celui qui ne se voit pas — un paquet qui
 * distribue deux fois la même carte reste plausible toute une séance, et un
 * paquet qui en perd une ne se découvre qu'au remélange, des semaines plus
 * tard.
 */

const paquetDe = (n: number, retournee: number | null = null): DeckSessionState => ({
    deckId: 'd-1',
    remainingIndices: Array.from({ length: n }, (_, i) => i + 1).filter(i => i !== retournee),
    discardedIndices: [],
    currentCardIndex: retournee,
});

/** Le compte total, tous tas confondus — il ne doit jamais bouger. */
const total = (etat: DeckSessionState) => placesDesCartes(etat).places.size;
const doublons = (etat: DeckSessionState) => placesDesCartes(etat).doublons;

describe('garder la carte retournée', () => {
    it('la sort de la carte retournée et la met en main', () => {
        const apres = garderLaCarteRetournee(paquetDe(10, 7), 'pc-rick');

        expect(apres.currentCardIndex).toBe(null);
        expect(apres.enMain).toEqual([{ index: 7, porteur: 'pc-rick', face: 'scellee' }]);
    });

    /** Le meneur garde pour lui : c'est le porteur `null`. */
    it('accepte le meneur comme porteur', () => {
        const apres = garderLaCarteRetournee(paquetDe(10, 3), null, 'revelee');
        expect(apres.enMain).toEqual([{ index: 3, porteur: null, face: 'revelee' }]);
    });

    /** *Garder ce qu'on n'a pas tiré n'est pas une erreur, c'est un geste sans objet.* */
    it('ne fait rien quand aucune carte n’est retournée', () => {
        const avant = paquetDe(10);
        expect(garderLaCarteRetournee(avant, 'pc-rick')).toBe(avant);
    });

    it('ne perd ni ne duplique aucune carte', () => {
        const apres = garderLaCarteRetournee(paquetDe(10, 7), 'pc-rick');

        expect(total(apres)).toBe(10);
        expect(doublons(apres)).toEqual([]);
    });
});

describe('ce qu’on fait d’une carte tenue', () => {
    const enMain = (porteur: string | null = 'pc-rick') =>
        garderLaCarteRetournee(paquetDe(10, 7), porteur);

    it('se donne à un autre personnage', () => {
        const apres = changerLePorteur(enMain(), 7, 'pc-willem');

        expect(mainDuPorteur(apres, 'pc-willem')).toHaveLength(1);
        expect(mainDuPorteur(apres, 'pc-rick')).toEqual([]);
        expect(total(apres)).toBe(10);
    });

    it('se retourne dans les deux sens', () => {
        const cachee = enMain();
        const visible = retournerUneCarte(cachee, 7);
        const recachee = retournerUneCarte(visible, 7);

        expect(visible.enMain?.[0].face).toBe('revelee');
        expect(recachee.enMain?.[0].face).toBe('scellee');
    });

    it('se joue vers la défausse', () => {
        const apres = jouerUneCarteTenue(enMain(), 7, true);

        expect(apres.enMain).toEqual([]);
        expect(apres.discardedIndices).toEqual([7]);
        expect(total(apres)).toBe(10);
        expect(doublons(apres)).toEqual([]);
    });

    /**
     * Un paquet sans défausse remet ses cartes dans la pioche. Il n'y a aucune
     * raison qu'une carte tenue échappe à la règle du paquet qui la porte.
     */
    it('retourne à la pioche quand le paquet n’a pas de défausse', () => {
        const apres = jouerUneCarteTenue(enMain(), 7, false);

        expect(apres.discardedIndices).toEqual([]);
        expect(apres.remainingIndices).toContain(7);
        expect(total(apres)).toBe(10);
    });

    it('se rend au paquet sans passer par la défausse', () => {
        const apres = rendreUneCarteAuPaquet(enMain(), 7);

        expect(apres.enMain).toEqual([]);
        expect(apres.remainingIndices).toContain(7);
        expect(doublons(apres)).toEqual([]);
    });

    /** Jouer une carte qu'on ne tient pas ne doit rien fabriquer. */
    it('ignore une carte qui n’est pas en main', () => {
        const avant = enMain();
        expect(jouerUneCarteTenue(avant, 4, true)).toBe(avant);
        expect(rendreUneCarteAuPaquet(avant, 4)).toBe(avant);
    });
});

describe('plusieurs mains à la fois', () => {
    const table = () => {
        let etat = paquetDe(10, 7);
        etat = garderLaCarteRetournee(etat, 'pc-rick');
        etat = { ...etat, currentCardIndex: 2, remainingIndices: etat.remainingIndices.filter(i => i !== 2) };
        etat = garderLaCarteRetournee(etat, 'pc-willem', 'revelee');
        etat = { ...etat, currentCardIndex: 5, remainingIndices: etat.remainingIndices.filter(i => i !== 5) };
        return garderLaCarteRetournee(etat, null);
    };

    it('range chaque carte chez son porteur', () => {
        const etat = table();

        expect(mainDuPorteur(etat, 'pc-rick').map(c => c.index)).toEqual([7]);
        expect(mainDuPorteur(etat, 'pc-willem').map(c => c.index)).toEqual([2]);
        expect(mainDuPorteur(etat, null).map(c => c.index)).toEqual([5]);
    });

    it('sait qui tient quelque chose', () => {
        expect(porteursDeCartes(table()).sort()).toEqual(['pc-rick', 'pc-willem', null].sort());
    });

    it('garde le compte juste avec trois mains ouvertes', () => {
        expect(total(table())).toBe(10);
        expect(doublons(table())).toEqual([]);
    });
});

describe('le remélange', () => {
    /**
     * `shuffleDeck` et `resetDeck` reconstruisent l'état de zéro : sans compte,
     * ils reprendraient les cartes des joueurs **sans un mot**. *Une correction
     * muette est une règle perdue.*
     */
    it('reprend les mains et dit combien', () => {
        let etat = paquetDe(10, 7);
        etat = garderLaCarteRetournee(etat, 'pc-rick');
        etat = { ...etat, currentCardIndex: 2, remainingIndices: etat.remainingIndices.filter(i => i !== 2) };
        etat = garderLaCarteRetournee(etat, 'pc-willem');

        const { etat: apres, reprises } = reprendreToutesLesMains(etat);

        expect(reprises).toBe(2);
        expect(apres.enMain).toEqual([]);
        expect(apres.remainingIndices).toContain(7);
        expect(apres.remainingIndices).toContain(2);
        expect(total(apres)).toBe(10);
    });

    it('ne dit rien quand personne ne tient de carte', () => {
        const avant = paquetDe(10, 3);
        const { etat, reprises } = reprendreToutesLesMains(avant);

        expect(reprises).toBe(0);
        expect(etat).toBe(avant);
    });
});

describe('ce qui part vers les tablettes', () => {
    const table = (): DeckSessionState => ({
        deckId: 'd-1',
        remainingIndices: [1, 2],
        discardedIndices: [],
        currentCardIndex: null,
        enMain: [
            { index: 7, porteur: 'pc-rick', face: 'revelee' },
            { index: 9, porteur: 'pc-rick', face: 'scellee' },
            { index: 4, porteur: null, face: 'scellee' },
        ],
    });

    it('donne les cartes révélées de chacun', () => {
        const diffusee = mainsPourLaTable(table());
        expect(diffusee.find(m => m.porteur === 'pc-rick')?.revelees).toEqual([7]);
    });

    it('compte les cartes cachées sans les nommer', () => {
        const rick = mainsPourLaTable(table()).find(m => m.porteur === 'pc-rick');
        expect(rick?.scellees).toBe(1);
    });

    /**
     * **Le test qui compte.** La diffusion est un seul message pour toutes les
     * tablettes : un index de carte cachée qui s'y glisserait serait déposé sur
     * l'appareil de chaque joueur, lisible dans les outils du navigateur.
     * *Un secret caviardé à l'affichage n'est pas un secret, c'est un secret
     * affiché plus tard.*
     */
    it('ne laisse sortir aucun index de carte cachée', () => {
        const indicesCaches = [9, 4];
        const texte = JSON.stringify(mainsPourLaTable(table()));

        for (const index of indicesCaches) {
            expect(mainsPourLaTable(table()).flatMap(m => m.revelees), `index ${index}`).not.toContain(index);
        }
        // Et pas davantage ailleurs dans la charge, sous un autre nom.
        expect(texte).not.toContain('9');
        expect(texte).not.toContain('"4"');
    });

    it('ne diffuse rien quand personne ne tient de carte', () => {
        expect(mainsPourLaTable(paquetDe(5))).toEqual([]);
    });
});

describe('l’état des lieux', () => {
    it('nomme le tas de chaque carte', () => {
        const etat: DeckSessionState = {
            deckId: 'd-1',
            remainingIndices: [1, 2],
            discardedIndices: [3],
            currentCardIndex: 4,
            enMain: [{ index: 5, porteur: 'pc-rick', face: 'scellee' }],
        };
        const { places } = placesDesCartes(etat);

        expect(places.get(1)).toEqual(['pioche']);
        expect(places.get(3)).toEqual(['defausse']);
        expect(places.get(4)).toEqual(['retournee']);
        expect(places.get(5)).toEqual(['main']);
    });

    /**
     * **Le rapport qui trouverait un paquet devenu menteur.** Une carte à deux
     * endroits se distribue deux fois, et ça reste plausible toute une séance.
     */
    it('dénonce une carte présente à deux endroits', () => {
        const casse: DeckSessionState = {
            deckId: 'd-1',
            remainingIndices: [1, 2, 5],
            discardedIndices: [],
            currentCardIndex: null,
            enMain: [{ index: 5, porteur: null, face: 'scellee' }],
        };

        expect(placesDesCartes(casse).doublons).toEqual([5]);
        expect(placesDesCartes(casse).places.get(5)).toEqual(['pioche', 'main']);
    });

    /** Un paquet d'avant le quatrième tas n'a pas de `enMain` du tout. */
    it('lit un paquet sans main comme un paquet vide de mains', () => {
        expect(placesDesCartes(paquetDe(5)).doublons).toEqual([]);
        expect(mainDuPorteur(paquetDe(5), null)).toEqual([]);
        expect(porteursDeCartes(paquetDe(5))).toEqual([]);
    });
});
