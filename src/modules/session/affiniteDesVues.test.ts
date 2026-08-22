import { describe, it, expect } from 'vitest';
import {
    AFFINITE_DES_VUES, vueConvientAu, vueDeRepli, vuesDuMoment,
} from './affiniteDesVues';
import type { CurrentView } from '../../types/campaign.types';

/**
 * Ce que ces tests protègent : **deux régimes d'interface — axe N.**
 *
 * *« Ce qui change vraiment entre les deux modes n'est pas la liste des boutons :
 * la densité, les valeurs par défaut, et ce qui est à portée de main. »*
 */

describe('le classement des vues', () => {
    /**
     * **Exhaustif par construction.** `Record<CurrentView, …>` refuse de
     * compiler si une vue naît sans être classée — *une table qu'on tient à la
     * main finit incomplète, et son trou ne se voit pas.* Ce test tient l'autre
     * bout : il vérifie qu'aucune valeur n'a été posée au hasard.
     */
    it('classe chaque vue dans l’une des trois familles', () => {
        const familles = new Set(Object.values(AFFINITE_DES_VUES));
        expect([...familles].sort()).toEqual(['les-deux', 'partie', 'preparation']);
        expect(Object.keys(AFFINITE_DES_VUES).length).toBeGreaterThan(20);
    });

    it('suit la table du plan pour les deux extrémités', () => {
        expect(AFFINITE_DES_VUES.forge).toBe('preparation');
        expect(AFFINITE_DES_VUES['rule-workshop']).toBe('preparation');
        expect(AFFINITE_DES_VUES['session-focus']).toBe('partie');
        expect(AFFINITE_DES_VUES['deck-player']).toBe('partie');
        expect(AFFINITE_DES_VUES.rulebook).toBe('partie');
    });

    /**
     * **`les-deux` est la majorité, et c'est voulu** : le classement sert à
     * repérer les extrémités, *pas à cloisonner l'application.*
     */
    it('laisse les écrans de consultation ouverts aux deux moments', () => {
        for (const vue of ['cockpit', 'npc-gallery', 'world-atlas', 'trame'] as CurrentView[]) {
            expect(AFFINITE_DES_VUES[vue], vue).toBe('les-deux');
            expect(vueConvientAu('partie', vue)).toBe(true);
            expect(vueConvientAu('preparation', vue)).toBe(true);
        }
    });
});

describe('ce qui convient à quel moment', () => {
    it('écarte la Forge de la table', () => {
        expect(vueConvientAu('partie', 'forge')).toBe(false);
        expect(vueConvientAu('preparation', 'forge')).toBe(true);
    });

    it('écarte l’écran de séance de l’atelier', () => {
        expect(vueConvientAu('preparation', 'session-focus')).toBe(false);
        expect(vueConvientAu('partie', 'session-focus')).toBe(true);
    });
});

describe('le repli', () => {
    /**
     * **Le cockpit, et pas ailleurs.** Il convient aux deux moments et porte le
     * bouton de séance : *on rend la main au meneur, on ne le téléporte pas dans
     * un écran qu'il n'a pas demandé.*
     */
    it('rend un écran qui convient toujours', () => {
        expect(vueConvientAu('partie', vueDeRepli())).toBe(true);
        expect(vueConvientAu('preparation', vueDeRepli())).toBe(true);
    });
});

describe('le groupement par moment', () => {
    it('sépare les deux familles sans les mélanger', () => {
        const prep = vuesDuMoment('preparation');
        const partie = vuesDuMoment('partie');
        expect(prep).toContain('forge');
        expect(partie).toContain('session-focus');
        expect(prep.some(v => partie.includes(v))).toBe(false);
    });
});
