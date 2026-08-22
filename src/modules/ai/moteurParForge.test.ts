import { describe, it, expect, beforeEach } from 'vitest';
import {
    DUREE_ESTIMEE, minutesHautesEstimees, moteurDeLaForge, useMoteurParForge,
} from './moteurParForge';

/**
 * Ce que ces tests protègent : **le moteur d'une Forge est un choix, jamais une
 * bascule — axe J.**
 *
 * *« Cloud accepté pour les Forges, choix explicite à chaque lancement, jamais
 * de bascule automatique. »*
 */

describe('le moteur retenu', () => {
    it('suit le réglage global tant que rien n’a été choisi', () => {
        expect(moteurDeLaForge('systeme', {}, 'ollama')).toBe('ollama');
    });

    it('préfère le choix de la Forge quand il existe', () => {
        expect(moteurDeLaForge('systeme', { systeme: 'gemini' }, 'ollama')).toBe('gemini');
    });

    /**
     * **Chaque Forge a le sien.** Une campagne se forge volontiers au loin ; une
     * dérivation de pilote peut rester locale. *Un réglage unique pour les deux
     * obligerait à le rebasculer à chaque fois, donc à l'oublier une fois.*
     */
    it('ne déborde pas d’une Forge sur l’autre', () => {
        const choix = { systeme: 'gemini' as const };
        expect(moteurDeLaForge('campagne', choix, 'ollama')).toBe('ollama');
    });
});

describe('la mémoire du choix', () => {
    beforeEach(() => useMoteurParForge.setState({ choix: {} }));

    it('retient ce qu’on lui donne', () => {
        useMoteurParForge.getState().retenir('campagne', 'gemini');
        expect(useMoteurParForge.getState().choix.campagne).toBe('gemini');
    });

    /**
     * **`undefined` veut dire « suivre le réglage global »**, et c'est un
     * troisième état. Enregistré tel quel, il se relirait plus tard comme un
     * choix — la clé disparaît donc.
     */
    it('oublie proprement quand on revient au réglage global', () => {
        const { retenir } = useMoteurParForge.getState();
        retenir('campagne', 'gemini');
        retenir('campagne', undefined);
        expect('campagne' in useMoteurParForge.getState().choix).toBe(false);
        expect(moteurDeLaForge('campagne', useMoteurParForge.getState().choix, 'ollama'))
            .toBe('ollama');
    });
});

describe('l’estimation de durée', () => {
    /**
     * **Les chiffres sont mesurés, pas devinés** — § 5 du plan du 2026-08-07.
     * Et c'est une fourchette : *annoncer « 3 min » et en mettre neuf fait plus
     * de mal que de ne rien dire.*
     */
    it('annonce une fourchette pour le local, une valeur courte pour le cloud', () => {
        expect(DUREE_ESTIMEE.ollama).toBe('~2 à 5 min');
        expect(DUREE_ESTIMEE.gemini).toBe('~30 s');
    });

    /**
     * **La borne HAUTE, parce que c'est la seule qui permette de dire oui sans
     * se tromper** — *« pause de 15 min : cette Forge en demande 4, on y va. »*
     */
    it('rend la borne haute, pour la comparer au temps de pause restant', () => {
        expect(minutesHautesEstimees('ollama')).toBe(5);
        expect(minutesHautesEstimees('gemini')).toBe(1);
    });

    /** Le plan le relève : à 25 minutes, aucune pause honnête n'y suffit. */
    it('tient dans un quart d’heure sur les deux moteurs', () => {
        expect(minutesHautesEstimees('ollama')!).toBeLessThan(15);
        expect(minutesHautesEstimees('gemini')!).toBeLessThan(15);
    });
});
