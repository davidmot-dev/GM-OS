import { describe, it, expect } from 'vitest';
import { BUDGETS, attenteAnnoncee, budgetDuMoment, momentDeJeu } from './budgetsDeTemps';

/**
 * **Ce que ces tests protègent : un seul endroit décide de la patience.**
 *
 * Trois plafonds vivaient chacun de leur côté et ne s'accordaient sur rien —
 * 45 minutes pour le modèle (écrit deux fois), 10 minutes pour le MCP, **rien du
 * tout** pour la génération d'image. L'incohérence avait une conséquence
 * concrète : une Forge dont le carnet répond en 12 minutes échouait sur le MCP
 * alors que le modèle, lui, l'aurait attendue.
 *
 * Et aucun ne consultait le moment de jeu, alors que le signal existe depuis
 * toujours : *quarante-cinq minutes d'attente en préparation sont normales, en
 * pleine partie elles sont absurdes.*
 */

describe('le moment de jeu se lit globalement', () => {
    it('une séance active met en partie', () => {
        expect(momentDeJeu([{ status: 'planned' }, { status: 'active' }])).toBe('partie');
    });

    it('sans séance active, on prépare', () => {
        expect(momentDeJeu([{ status: 'done' }, { status: 'planned' }])).toBe('preparation');
        expect(momentDeJeu([])).toBe('preparation');
    });

    it('un magasin absent ne fait pas tomber le calcul', () => {
        // Le budget ne doit jamais être la raison d'un plantage : sans réponse,
        // on prépare — c'est le comportement d'avant, et il est sûr.
        expect(momentDeJeu(undefined)).toBe('preparation');
    });
});

describe('le budget suit le moment, pas l\'usage', () => {
    it('la partie est nettement plus serrée que la préparation', () => {
        /**
         * Une Forge lancée en séance ne mérite pas plus de patience qu'autre
         * chose : c'est le meneur qui attend, et ses joueurs avec lui.
         */
        expect(BUDGETS.partie).toBeLessThan(BUDGETS.preparation);
    });

    it('en partie, on n\'attend pas plus de cinq minutes', () => {
        expect(budgetDuMoment([{ status: 'active' }])).toBe(5 * 60 * 1000);
    });

    it('en préparation, le plafond historique de 45 min est conservé', () => {
        // Faute d'une mesure qui justifierait de le baisser : ça se mesure, ça
        // ne s'intuite pas.
        expect(budgetDuMoment([])).toBe(45 * 60 * 1000);
    });
});

describe('l\'attente annonce sa borne, jamais une prédiction', () => {
    it('les longues durées se disent en minutes', () => {
        expect(attenteAnnoncee(5 * 60 * 1000)).toBe('5 min au plus');
        expect(attenteAnnoncee(45 * 60 * 1000)).toBe('45 min au plus');
    });

    it('les courtes se disent en secondes', () => {
        expect(attenteAnnoncee(90_000)).toBe('90 s au plus');
    });

    it('« au plus » et jamais « environ » — c\'est une promesse, pas une estimation', () => {
        /**
         * Prédire la durée d'une génération demanderait de connaître la machine,
         * le modèle et la longueur de la réponse ; annoncer « environ 20 s » et
         * se tromper ferait plus de mal que de se taire. Le plafond, lui, est
         * une promesse tenue — et depuis l'axe D.1, elle est tenue pour de bon.
         */
        for (const budget of Object.values(BUDGETS)) {
            expect(attenteAnnoncee(budget)).toContain('au plus');
        }
    });
});
