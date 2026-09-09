import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../../../store/useSessionStore';
import { momentDeJeu } from '../../ai/budgetsDeTemps';
import { regimeDInterface } from './regimeDInterface';

/**
 * Ce que ces tests protègent : **on peut sortir du mode « table » à la main, et
 * l'IA ne suit pas.**
 *
 * Demandé par David le 2026-09-09 : *« je voulais le MJ Focus, mais je veux aussi
 * une possibilité d'en sortir au besoin. »*
 *
 * ⛔ Le mode existait déjà — `aLaTable`, axe N.3 — mais il se **déduisait en
 * silence** de `momentDeJeu`, sans rien pour le voir ni le contredire. Le champ
 * `isSessionMode` qui prétendait le porter était écrit, mis dans une sauvegarde,
 * et **lu par aucun écran** ; le brancher aurait créé un second écrivain pour le
 * même fait. Il a été supprimé.
 */

/** Une séance telle que `momentDeJeu` la lit. */
const seance = (etat: 'active' | 'closed', pausedAt?: number) =>
    ({ status: etat, pausedAt } as never);

beforeEach(() => {
    useSessionStore.getState().forcerLeRegime(null);
});

describe('le régime, quand personne ne force', () => {
    it('suit la séance ouverte', () => {
        expect(momentDeJeu([seance('active')])).toBe('partie');
        expect(regimeDInterface('partie').aLaTable).toBe(true);
    });

    /** La porte de sortie qui existait déjà, et que personne n'annonçait. */
    it('repasse en atelier quand la séance est en pause', () => {
        expect(momentDeJeu([seance('active', Date.now())])).toBe('preparation');
    });

    it('est en atelier hors séance', () => {
        expect(momentDeJeu([])).toBe('preparation');
        expect(momentDeJeu(undefined)).toBe('preparation');
    });
});

describe('la surcharge du meneur', () => {
    it('n’existe pas tant qu’il n’a rien forcé', () => {
        expect(useSessionStore.getState().surchargeDuRegime).toBeNull();
    });

    it('fait sortir du mode table pendant une séance ouverte', () => {
        useSessionStore.getState().forcerLeRegime('preparation');

        const moment = momentDeJeu([seance('active')]);
        const effectif = useSessionStore.getState().surchargeDuRegime ?? moment;

        expect(moment).toBe('partie');
        expect(regimeDInterface(effectif).aLaTable).toBe(false);
    });

    it('fait entrer en mode table hors séance', () => {
        useSessionStore.getState().forcerLeRegime('partie');

        const moment = momentDeJeu([]);
        const effectif = useSessionStore.getState().surchargeDuRegime ?? moment;

        expect(moment).toBe('preparation');
        expect(regimeDInterface(effectif).aLaTable).toBe(true);
    });

    /** *Rendre la main* est un geste distinct de *forcer l'autre régime*. */
    it('se rend avec null, et la séance reprend la parole', () => {
        useSessionStore.getState().forcerLeRegime('preparation');
        useSessionStore.getState().forcerLeRegime(null);

        const moment = momentDeJeu([seance('active')]);
        const effectif = useSessionStore.getState().surchargeDuRegime ?? moment;

        expect(regimeDInterface(effectif).aLaTable).toBe(true);
    });

    /**
     * ⚠️ **Elle ne va pas plus loin que l'écran — tranché par David.** Les
     * budgets de temps de l'IA lisent `momentDeJeu` directement : *replier son
     * écran ne veut pas dire que la table a cessé d'attendre.*
     */
    it('ne touche pas au moment que lisent les budgets de l’IA', () => {
        useSessionStore.getState().forcerLeRegime('preparation');
        expect(momentDeJeu([seance('active')])).toBe('partie');
    });

    /**
     * *Un forçage est un geste « pour maintenant ».* Le restaurer au lancement
     * mettrait l'écran dans un régime que personne n'a demandé ce jour-là.
     */
    it('n’est pas persistée', () => {
        useSessionStore.getState().forcerLeRegime('preparation');

        const persiste = JSON.parse(localStorage.getItem('gmos-session-storage') ?? '{}');
        // La première assertion tient la seconde : sans elle, ce test passerait
        // aussi bien si rien n'était écrit du tout.
        expect(persiste.state?.theme).toBeDefined();
        expect(persiste.state?.surchargeDuRegime).toBeUndefined();
    });
});
