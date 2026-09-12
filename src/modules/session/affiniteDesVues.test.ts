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

/**
 * ⛔ **LA GARDE NÉE D'UNE SÉANCE PERDUE — 2026-09-12.**
 *
 * Le storyboard était classé « préparation ». Pendant une séance,
 * `useLayoutManager` ramenait donc la vue au cockpit à chaque tentative :
 * *« le bouton s'allume quand je vais dessus, mais ne lance pas le
 * storyboard »*. **Aucune erreur, aucune ligne de journal** — le mécanisme
 * faisait exactement ce qu'on lui avait dit.
 *
 * ⭐ *Ce classement n'est pas une préférence d'affichage : c'est le seul endroit
 * du code qui peut rendre un écran INATTEIGNABLE.* Ce qu'on y écrit mérite donc
 * la même discipline que le registre des actions distantes : une liste gelée,
 * qu'on ne modifie que sciemment.
 */
describe('⛔ ce qui disparaît pendant une séance', () => {
    /**
     * **La liste gelée.** Toute vue ajoutée ici devient invisible dès qu'une
     * séance est ouverte, et **rien ne le dira à l'écran**. Ce test rougit tant
     * qu'on n'a pas mis à jour la liste — c'est-à-dire tant que le choix n'a pas
     * été fait consciemment.
     */
    const INACCESSIBLES_EN_SEANCE: CurrentView[] = [
        'forge', 'rule-workshop', 'template-editor', 'driver-editor',
        'templates', 'library', 'campaign-editor', 'campaign-details',
        'campaign-form', 'session-prep', 'deck-library',
    ];

    it('la liste des écrans écartés de la table n’a pas bougé en douce', () => {
        const ecartes = (Object.keys(AFFINITE_DES_VUES) as CurrentView[])
            .filter(v => !vueConvientAu('partie', v))
            .sort();

        expect(
            ecartes,
            'un écran est devenu inaccessible en séance — était-ce voulu ?',
        ).toEqual([...INACCESSIBLES_EN_SEANCE].sort());
    });

    /*
      ⭐ **Le storyboard n'en fait plus partie, et il ne doit jamais y revenir.**
      Ses moments se déclenchent à la table depuis le panneau de trame : c'est le
      seul écran dont le contenu est *utilisé* pendant qu'on joue. Et une
      séquence qui rate en séance est précisément le moment où l'on veut l'ouvrir.
    */
    it('le storyboard s’ouvre pendant une séance', () => {
        expect(AFFINITE_DES_VUES.storyboard).toBe('les-deux');
        expect(
            vueConvientAu('partie', 'storyboard'),
            'le storyboard redeviendrait inatteignable en pleine séance',
        ).toBe(true);
    });

    /* Et il reste évidemment atteignable en préparation : c'est là qu'on l'écrit. */
    it('et en préparation, où on le bâtit', () => {
        expect(vueConvientAu('preparation', 'storyboard')).toBe(true);
    });

    /*
      ⚠️ **Un écran écarté doit avoir un remplaçant, ou il n'en est pas un.**
      Deck-OS l'a (`deck-library` → `deck-player`). Ceux de la liste ci-dessus
      n'en ont pas — c'est le parti pris de l'axe N —, mais `vueDeRepli` doit
      alors toujours convenir, sans quoi on renverrait le meneur dans un écran
      qui se refermerait aussitôt. *Une boucle de repli serait pire que tout.*
    */
    it('le repli convient aux deux moments — sinon il bouclerait', () => {
        expect(vueConvientAu('partie', vueDeRepli())).toBe(true);
        expect(vueConvientAu('preparation', vueDeRepli())).toBe(true);
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
