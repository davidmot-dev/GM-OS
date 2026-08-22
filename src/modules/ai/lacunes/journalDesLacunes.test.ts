import { describe, it, expect, beforeEach } from 'vitest';
import {
    atteinteDeLaRecherche, clefDeRegroupement, estUneLacune,
} from './atteinteDeLaRecherche';
import { useJournalDesLacunes } from './useJournalDesLacunes';

/**
 * Ce que ces tests protègent : **les sujets à forger sont désignés par l'usage,
 * pas par l'intuition.**
 *
 * Étage 4 de l'axe M, que le plan appelle « la meilleure idée du lot ». Et il se
 * remplit **sans intervention** : pas de pouces haut/bas, qui créent une
 * friction à table et ne sont jamais cliqués.
 */

const source = (provenance: string) => ({ provenance });

describe('ce que la recherche a atteint', () => {
    it('reconnaît une fiche du corpus comme la seule réponse pleine', () => {
        expect(atteinteDeLaRecherche([source('fiche'), source('systeme')])).toBe('fiche');
    });

    /**
     * Une décharge brute ou des notes de campagne ont répondu **sans être une
     * règle vérifiée** : la question entre dans la file.
     */
    it('range un document non vérifié dans la file', () => {
        expect(atteinteDeLaRecherche([source('campagne')])).toBe('document');
        expect(estUneLacune('document')).toBe(true);
    });

    /**
     * **Le cas le plus grave** : le modèle a répondu de lui-même, et rien dans
     * sa réponse ne le dit.
     */
    it('appelle « rien » une réponse sans aucune source', () => {
        expect(atteinteDeLaRecherche([])).toBe('rien');
        expect(estUneLacune('rien')).toBe(true);
        expect(estUneLacune('fiche'), 'une fiche n’est pas une lacune').toBe(false);
    });
});

describe('le regroupement', () => {
    /**
     * *« Regrouper avant de forger, sinon dix questions sur l'ivresse
     * produisent dix fiches au lieu d'une. »*
     */
    it('rapproche deux formulations de la même demande', () => {
        expect(clefDeRegroupement('Quelle est la règle pour l’ivresse ?'))
            .toBe(clefDeRegroupement('règles d’ivresse'));
    });

    it('ignore accents, casse et ponctuation', () => {
        expect(clefDeRegroupement('DÉGÂTS !!')).toBe(clefDeRegroupement('degats'));
    });

    /**
     * **On ne rapproche pas plus que ça.** Un rapprochement approximatif
     * fusionnerait deux sujets voisins mais distincts, et on forgerait une fiche
     * pour une question que personne n'a posée.
     */
    it('ne fusionne pas deux sujets voisins', () => {
        expect(clefDeRegroupement('règles de chute'))
            .not.toBe(clefDeRegroupement('règles de chasse'));
    });

    it('ne rend rien pour une question qui n’a que des mots vides', () => {
        expect(clefDeRegroupement('et alors ?'), 'le pluriel tombe, ici a tort et sans consequence').toBe('alor');
        expect(clefDeRegroupement('le la les')).toBe('');
    });
});

describe('le journal', () => {
    beforeEach(() => useJournalDesLacunes.setState({ questions: [] }));

    it('ne retient pas une question à laquelle une fiche a répondu', () => {
        useJournalDesLacunes.getState().noter('Ivresse ?', [source('fiche')]);
        expect(useJournalDesLacunes.getState().lacunes()).toEqual([]);
    });

    it('compte les fois où la même demande est revenue', () => {
        const { noter } = useJournalDesLacunes.getState();
        noter('Quelle est la règle pour l’ivresse ?', []);
        noter('règles d’ivresse', []);
        noter('Et la chute ?', []);

        const lacunes = useJournalDesLacunes.getState().lacunes();
        expect(lacunes).toHaveLength(2);
        expect(lacunes[0].fois, 'la plus fréquente en tête').toBe(2);
    });

    /**
     * **La formulation la plus récente**, pas la première : c'est celle dont le
     * meneur se souvient, et souvent la mieux posée — *une question reformulée
     * l'est parce que la première n'avait pas abouti.*
     */
    it('garde la dernière formulation', () => {
        const { noter } = useJournalDesLacunes.getState();
        noter('regles ivresse', []);
        noter('Quelles sont les règles d’ivresse ?', []);

        const lacune = useJournalDesLacunes.getState().lacunes()[0];
        expect(lacune.fois, 'les deux formulations se regroupent').toBe(2);
        expect(lacune.question, 'et c’est la dernière qui reste').toContain('Quelles sont');
    });

    it('n’enregistre rien pour une question vide ou sans substance', () => {
        const { noter } = useJournalDesLacunes.getState();
        noter('   ', []);
        noter('le la les', []);
        expect(useJournalDesLacunes.getState().questions).toEqual([]);
    });

    it('s’oublie sujet par sujet', () => {
        const { noter } = useJournalDesLacunes.getState();
        noter('ivresse', []);
        noter('chute', []);

        const clef = useJournalDesLacunes.getState().lacunes()[0].clef;
        useJournalDesLacunes.getState().oublier(clef);

        expect(useJournalDesLacunes.getState().lacunes()).toHaveLength(1);
    });
});
