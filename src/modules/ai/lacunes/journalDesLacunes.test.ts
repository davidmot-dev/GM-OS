import { describe, it, expect, beforeEach } from 'vitest';
import {
    atteinteDeLaRecherche, clefDeRegroupement, estUneLacune,
} from './atteinteDeLaRecherche';
import { useJournalDesLacunes } from './useJournalDesLacunes';
import { doitJuger } from './jugementDeTable';

/**
 * Ce que ces tests protègent : **les sujets à forger sont désignés par l'usage,
 * pas par l'intuition.**
 *
 * Étage 4 de l'axe M, que le plan appelle « la meilleure idée du lot ». Et il se
 * remplit **sans intervention** : pas de pouces haut/bas, qui créent une
 * friction à table et ne sont jamais cliqués.
 */

const source = (provenance: string, sujet?: string) => ({ provenance, sujet });

describe('ce que la recherche a atteint', () => {
    it('reconnaît une fiche du corpus comme la seule réponse pleine', () => {
        const sources = [source('fiche', 'Éthylisme (jet, degrés et malus)'), source('systeme')];
        expect(atteinteDeLaRecherche(sources, "règles d'éthylisme")).toBe('fiche');
    });

    /**
     * Une décharge brute ou des notes de campagne ont répondu **sans être une
     * règle vérifiée** : la question entre dans la file.
     */
    it('range un document non vérifié dans la file', () => {
        expect(atteinteDeLaRecherche([source('campagne')], 'peu importe')).toBe('document');
        expect(estUneLacune('document')).toBe(true);
    });

    /**
     * **Le cas le plus grave** : le modèle a répondu de lui-même, et rien dans
     * sa réponse ne le dit.
     */
    it('appelle « rien » une réponse sans aucune source', () => {
        expect(atteinteDeLaRecherche([], 'peu importe')).toBe('rien');
        expect(estUneLacune('rien')).toBe(true);
        expect(estUneLacune('fiche'), 'une fiche n’est pas une lacune').toBe(false);
    });

    /**
     * **Le cas de table du 2026-08-22, et la raison du quatrième état.**
     *
     * « Comment se calculent les dégâts de chute ? » retenait deux fiches du
     * corpus Rêves de Dragons — dont aucune ne parle de la chute. Le meneur
     * repartait sans règle, **sans renvoi au livre et sans que la Forge
     * apprenne le manque** : la recherche avait touché une fiche, donc tout
     * allait bien.
     *
     * *Deux verdicts portaient sur la même chose et se contredisaient* —
     * l'étage 1 disait « aucune fiche ne couvre », l'étage 4 disait « une fiche
     * a répondu ». C'est le test de l'étage 1 qui tranche désormais.
     */
    it('distingue une fiche VOISINE d’une fiche qui répond', () => {
        const voisines = [
            source('fiche', 'Dégâts et types de dégâts'),
            source('fiche', 'Environnement et dangers'),
        ];
        const question = 'Comment se calculent les dégâts de chute ?';

        expect(atteinteDeLaRecherche(voisines, question)).toBe('fiche-hors-sujet');
        expect(estUneLacune('fiche-hors-sujet'), 'la Forge doit l’apprendre').toBe(true);
    });

    /**
     * **Un état distinct, et pas un repli sur `document`.** « Rien du tout » et
     * « des fiches voisines mais aucune qui couvre » sont deux manques de
     * nature différente : le second nomme même les fiches à étendre.
     */
    it('ne se confond ni avec « rien » ni avec « document »', () => {
        const question = 'Comment se calculent les dégâts de chute ?';
        expect(atteinteDeLaRecherche([source('fiche', 'Poursuites')], question))
            .not.toBe('document');
        expect(atteinteDeLaRecherche([source('fiche', 'Poursuites')], question))
            .not.toBe('rien');
    });

    /**
     * **Une fiche voisine ne suffit plus à faire taire le jugement**, mais le
     * livre, lui, le fait taire. Les deux conditions du plan : *« à défaut
     * d'une fiche ET à défaut du livre »*.
     */
    it('déclenche le jugement seulement si le livre est muet lui aussi', () => {
        expect(doitJuger('fiche-hors-sujet', false)).toBe(true);
        expect(doitJuger('fiche-hors-sujet', true), 'le livre a répondu').toBe(false);
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
        // **Une fiche SANS sujet ne pouvait pas servir de témoin** : le moteur
        // ne classe une source comme « fiche » que si elle en déclare un, et
        // c'est ce sujet qui dit si elle répond. La fixture décrivait quelque
        // chose qui n'existe pas.
        useJournalDesLacunes.getState().noter('Ivresse ?', [source('fiche', 'Ivresse')]);
        expect(useJournalDesLacunes.getState().lacunes()).toEqual([]);
    });

    /**
     * **Et une fiche voisine, elle, se retient.** C'est le cas de table du
     * 2026-08-22 : deux fiches retenues, aucune qui parle de la chute, et la
     * Forge n'en savait rien.
     */
    it('retient une question que seules des fiches voisines ont touchée', () => {
        useJournalDesLacunes.getState()
            .noter('Comment se calculent les dégâts de chute ?', [source('fiche', 'Dégâts et types de dégâts')]);

        const lacunes = useJournalDesLacunes.getState().lacunes();
        expect(lacunes).toHaveLength(1);
        expect(lacunes[0].atteinte).toBe('fiche-hors-sujet');
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
