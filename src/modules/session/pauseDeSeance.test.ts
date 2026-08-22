import { describe, it, expect } from 'vitest';
import {
    DUREE_DE_PAUSE_PAR_DEFAUT_MS, estEnPause, libelleDeLaPause,
    pauseEcouleeMs, pauseRestanteMs,
} from './pauseDeSeance';
import { BUDGETS, budgetDuMoment, momentDeJeu } from '../ai/budgetsDeTemps';

/**
 * Ce que ces tests protègent : **la pause lève les plafonds de partie, et ne les
 * abaisse jamais.**
 *
 * Axe G. *« Un bouton pause avec chronomètre : la pause lève les plafonds de
 * partie, la reprise récupère l'IA. »*
 */

const T0 = 1_000_000_000_000;
const min = (n: number) => n * 60 * 1000;

const seance = (p?: Partial<{ status: string; pausedAt: number; pauseDureePrevueMs: number }>) =>
    ({ status: 'active', ...p });

describe('une séance est-elle en pause', () => {
    it('l’est dès qu’elle porte l’instant du clic', () => {
        expect(estEnPause(seance({ pausedAt: T0 }))).toBe(true);
    });

    it('ne l’est pas sans ce champ', () => {
        expect(estEnPause(seance())).toBe(false);
        expect(estEnPause(undefined)).toBe(false);
    });

    /**
     * **Un champ qu'on oublie de nettoyer devient un état permanent.** Une
     * séance close qui porterait encore son `pausedAt` lèverait les plafonds
     * pour l'éternité — et rien ne le dirait.
     */
    it('ne l’est plus une fois la séance terminée', () => {
        expect(estEnPause({ status: 'done', pausedAt: T0 })).toBe(false);
        expect(estEnPause({ status: 'planned', pausedAt: T0 })).toBe(false);
    });
});

describe('le chronomètre', () => {
    it('compte le temps écoulé', () => {
        expect(pauseEcouleeMs(seance({ pausedAt: T0 }), T0 + min(18))).toBe(min(18));
    });

    it('suppose un quart d’heure quand rien n’est annoncé', () => {
        expect(pauseRestanteMs(seance({ pausedAt: T0 }), T0))
            .toBe(DUREE_DE_PAUSE_PAR_DEFAUT_MS);
    });

    /**
     * **Le dépassement se dit, il ne se cache pas** : une pause de quinze
     * minutes qui en dure vingt-cinq est le cas le plus fréquent, et le plus
     * utile à signaler. *Le masquer rendrait le chronomètre décoratif.*
     */
    it('passe en négatif quand la pause déborde, et le dit', () => {
        const tard = T0 + min(25);
        expect(pauseRestanteMs(seance({ pausedAt: T0 }), tard)).toBe(min(-10));
        expect(libelleDeLaPause(seance({ pausedAt: T0 }), tard))
            .toBe('25 min de pause — 10 min de plus que prévu');
    });

    it('annonce ce qui reste tant qu’il en reste', () => {
        expect(libelleDeLaPause(seance({ pausedAt: T0 }), T0 + min(5)))
            .toBe('5 min de pause — 10 min restantes');
    });

    it('ne dit rien d’une séance qui tourne', () => {
        expect(libelleDeLaPause(seance())).toBe('');
    });
});

describe('le moment de jeu', () => {
    it('reste « partie » tant que la séance tourne', () => {
        expect(momentDeJeu([seance()])).toBe('partie');
    });

    /** C'est toute la raison d'être du bouton : personne n'attend à la table. */
    it('redevient « préparation » pendant la pause', () => {
        expect(momentDeJeu([seance({ pausedAt: T0 })])).toBe('preparation');
    });

    /**
     * **Une seule séance est active globalement**, mais si le magasin en portait
     * deux, il suffirait qu'une seule tourne pour qu'on soit en partie : *le
     * plafond protège le meneur qui attend, et il en resterait un.*
     */
    it('suffit d’une séance en cours pour retomber en partie', () => {
        expect(momentDeJeu([seance({ pausedAt: T0 }), seance()])).toBe('partie');
    });

    it('est « préparation » quand aucune séance ne tourne', () => {
        expect(momentDeJeu([])).toBe('preparation');
        expect(momentDeJeu(undefined)).toBe('preparation');
    });
});

describe('le plafond pendant la pause', () => {
    /** *« Pause de 15 min : cette Forge en demande 4, on y va. »* */
    it('suit le temps de pause restant', () => {
        expect(budgetDuMoment([seance({ pausedAt: T0 })], T0 + min(5))).toBe(min(10));
    });

    /**
     * **La pause ne peut que LEVER le plafond, jamais l'abaisser.** Sinon une
     * pause qui touche à sa fin rendrait quelques secondes — plus sévère que la
     * partie elle-même — et *« couper net à la onzième minute sur douze serait
     * punitif et dissuaderait de rien lancer. »*
     */
    it('ne descend jamais sous le budget de partie', () => {
        expect(budgetDuMoment([seance({ pausedAt: T0 })], T0 + min(14))).toBe(BUDGETS.partie);
        expect(budgetDuMoment([seance({ pausedAt: T0 })], T0 + min(40))).toBe(BUDGETS.partie);
    });

    it('ne dépasse pas non plus le budget de préparation', () => {
        const longue = seance({ pausedAt: T0, pauseDureePrevueMs: min(120) });
        expect(budgetDuMoment([longue], T0)).toBe(BUDGETS.preparation);
    });

    it('rend le plafond de partie quand la séance tourne', () => {
        expect(budgetDuMoment([seance()], T0)).toBe(BUDGETS.partie);
    });

    it('rend celui de préparation hors séance', () => {
        expect(budgetDuMoment([], T0)).toBe(BUDGETS.preparation);
    });
});
