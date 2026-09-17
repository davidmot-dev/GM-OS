import { describe, it, expect, vi } from 'vitest';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { DELAI_D_ECRITURE_MS, ecritureDifferee, type Minuteur } from './ecritureDifferee';

/**
 * **Ce que ces essais protègent : qu'un geste continu n'écrive pas cent fois sur
 * le disque, et qu'il n'écrive pas zéro fois non plus.**
 *
 * ⛔ Défaut trouvé par David à l'écran le 2026-09-17 : *« whiteboard os saccade un
 * peu »*. Chaque point d'un trait sérialisait tout le tableau et l'écrivait dans
 * `localStorage` — jusqu'à **4,18 ms de `JSON.stringify` par point** sur un
 * tableau bien rempli, plus l'écriture bloquante.
 */

type Etat = { n: number };

/** Un minuteur de laboratoire : rien ne s'exécute tant qu'on ne le décide pas. */
const minuteurDeLabo = () => {
    let prochain = 1;
    const differes = new Map<number, () => void>();
    const minuteur: Minuteur = {
        differer: (fn) => { const id = prochain++; differes.set(id, fn); return id; },
        annuler: (jeton) => { differes.delete(jeton as number); },
    };
    return {
        minuteur,
        /** Fait sonner tous les minuteurs armés. */
        sonner: () => {
            const aExecuter = [...differes.values()];
            differes.clear();
            aExecuter.forEach(fn => fn());
        },
        armes: () => differes.size,
    };
};

const stockageEspion = () => {
    const ecrit = new Map<string, StorageValue<Etat>>();
    const journal: string[] = [];
    const storage: PersistStorage<Etat> = {
        getItem: (nom) => { journal.push(`get ${nom}`); return ecrit.get(nom) ?? null; },
        setItem: (nom, valeur) => { journal.push(`set ${nom}`); ecrit.set(nom, valeur); },
        removeItem: (nom) => { journal.push(`remove ${nom}`); ecrit.delete(nom); },
    };
    return { storage, ecrit, journal };
};

const valeur = (n: number): StorageValue<Etat> => ({ state: { n }, version: 0 });

describe('l’écriture différée', () => {
    it('n’écrit rien avant que la fenêtre ne se referme', () => {
        const { storage, journal } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('k', valeur(1));
        expect(journal).toEqual([]);
        expect(differe.enAttente()).toBe(1);

        labo.sonner();
        expect(journal).toEqual(['set k']);
    });

    /** Cent points d'un trait, une seule sérialisation. */
    it('agglutine cent modifications en une écriture', () => {
        const { storage, journal, ecrit } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        for (let i = 1; i <= 100; i++) differe.setItem('k', valeur(i));
        labo.sonner();

        expect(journal.filter(l => l === 'set k')).toHaveLength(1);
        expect(ecrit.get('k')).toEqual(valeur(100));
    });

    /**
     * ⭐ **La garde qui distingue une fenêtre fixe d'un report perpétuel.**
     *
     * ⛔ Un « debounce » repousserait l'échéance à chaque nouvelle modification :
     * pendant un glissement de pion qui dure, *rien ne serait jamais écrit*. Ici
     * la première modification arme la fenêtre, et les suivantes ne la
     * repoussent pas.
     */
    it('n’arme qu’une fenêtre, que les modifications suivantes ne repoussent pas', () => {
        const { storage } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('k', valeur(1));
        expect(labo.armes()).toBe(1);
        for (let i = 2; i <= 50; i++) differe.setItem('k', valeur(i));
        expect(labo.armes()).toBe(1);
    });

    /**
     * ⚠️ **Ce qui attend fait autorité.** Sans ça, une relecture pendant la
     * fenêtre rendrait la version précédente — *un tampon qu'on n'interroge pas
     * est un mensonge de 250 ms.*
     */
    it('rend ce qui attend, pas ce qui est encore sur le disque', () => {
        const { storage } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('k', valeur(1));
        labo.sonner();
        differe.setItem('k', valeur(2));

        expect(differe.getItem('k')).toEqual(valeur(2));
    });

    it('rend le disque quand rien n’attend', () => {
        const { storage } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('k', valeur(7));
        labo.sonner();
        expect(differe.getItem('k')).toEqual(valeur(7));
        expect(differe.getItem('inconnue')).toBeNull();
    });

    /**
     * ⛔ **Le piège le plus vicieux de ce mécanisme.** Sans cette annulation, une
     * écriture encore en vol **ressusciterait** ce qu'on vient d'effacer, un quart
     * de seconde plus tard et sans que rien ne le dise.
     */
    it('un effacement annule l’écriture qui attendait', () => {
        const { storage, ecrit } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('k', valeur(1));
        differe.removeItem('k');
        labo.sonner();

        expect(ecrit.has('k')).toBe(false);
        expect(differe.getItem('k')).toBeNull();
    });

    it('vide à la demande, sans attendre le minuteur', () => {
        const { storage, ecrit } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('k', valeur(3));
        differe.viderMaintenant();

        expect(ecrit.get('k')).toEqual(valeur(3));
        expect(differe.enAttente()).toBe(0);
        /* Et le minuteur armé a été désarmé : pas de seconde écriture fantôme. */
        expect(labo.armes()).toBe(0);
    });

    it('vider deux fois n’écrit pas deux fois', () => {
        const { storage, journal } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('k', valeur(1));
        differe.viderMaintenant();
        differe.viderMaintenant();

        expect(journal.filter(l => l === 'set k')).toHaveLength(1);
    });

    it('sépare les clés sans les confondre', () => {
        const { storage, ecrit } = stockageEspion();
        const labo = minuteurDeLabo();
        const differe = ecritureDifferee(storage, { minuteur: labo.minuteur });

        differe.setItem('a', valeur(1));
        differe.setItem('b', valeur(2));
        expect(differe.enAttente()).toBe(2);
        labo.sonner();

        expect(ecrit.get('a')).toEqual(valeur(1));
        expect(ecrit.get('b')).toEqual(valeur(2));
    });

    /** Le vrai minuteur, une fois, pour vérifier qu'on a bien branché le délai. */
    it('emploie le délai déclaré quand on ne lui en donne pas', () => {
        vi.useFakeTimers();
        try {
            const { storage, ecrit } = stockageEspion();
            const differe = ecritureDifferee(storage);

            differe.setItem('k', valeur(9));
            vi.advanceTimersByTime(DELAI_D_ECRITURE_MS - 1);
            expect(ecrit.has('k')).toBe(false);
            vi.advanceTimersByTime(1);
            expect(ecrit.get('k')).toEqual(valeur(9));
        } finally {
            vi.useRealTimers();
        }
    });

    /** *Un quart de seconde, pas plus* — la borne est une décision, pas un hasard. */
    it('borne la perte possible à un quart de seconde', () => {
        expect(DELAI_D_ECRITURE_MS).toBeLessThanOrEqual(250);
        expect(DELAI_D_ECRITURE_MS).toBeGreaterThan(0);
    });
});
