import { describe, it, expect } from 'vitest';
import { rollManually } from './diceActions';

/**
 * Ce que ces tests protègent : **le sens du comptage arrive jusqu'au moteur,
 * depuis la tablette aussi**.
 *
 * Le pupitre du meneur a été corrigé le 2026-08-16 ; le mode manuel de la
 * tablette portait le même défaut et personne ne l'avait vu. `rollManually`
 * appelait `rollThreshold`, `rollPool` et `rollAdvantage` **sans leur passer le
 * sens** — les trois retombent sur `over`. Sur un jeu qui jette SOUS une
 * Sauvegarde, la tablette d'un joueur rendait donc l'inverse du bon résultat, et
 * un Avantage y gardait **le plus haut** : le pire dé possible.
 *
 * On ne peut pas forcer le tirage : on vérifie l'invariant sur les valeurs
 * réellement obtenues, deux cents fois.
 */
const centFois = (f: () => void) => { for (let i = 0; i < 200; i++) f(); };
const charge = {} as Parameters<typeof rollManually>[5];

describe('le mode manuel de la tablette compte dans le bon sens', () => {
    it('« threshold » réussit SOUS le seuil quand le jeu compte dessous', () => {
        centFois(() => {
            const r = rollManually('threshold', 20, 1, 0, 11, charge, 'under');
            expect(r.tagSuccess).toBe(r.total <= 11);
        });
    });

    it('« pool » compte les dés sous le seuil', () => {
        const r = rollManually('pool', 20, 10, 0, 11, charge, 'under');
        const attendus = r.rolls.filter(d => typeof d.val === 'number' && (d.val as number) <= 11).length;
        expect(r.successes).toBe(attendus);
    });

    it('« pool_explode » aussi', () => {
        const r = rollManually('pool_explode', 20, 10, 0, 11, charge, 'under');
        const attendus = r.rolls.filter(d => typeof d.val === 'number' && (d.val as number) <= 11).length;
        expect(r.successes).toBe(attendus);
    });

    it('l\'Avantage garde le PLUS BAS — le defaut qui a motive ce correctif', () => {
        centFois(() => {
            const r = rollManually('advantage', 20, 1, 0, 11, charge, 'under');
            const garde = r.rolls[0].val as number;
            const ecarte = r.rolls[1].val as number;
            expect(garde).toBe(Math.min(garde, ecarte));
        });
    });

    it('le Désavantage garde le plus haut', () => {
        centFois(() => {
            const r = rollManually('disadvantage', 20, 1, 0, 11, charge, 'under');
            const garde = r.rolls[0].val as number;
            const ecarte = r.rolls[1].val as number;
            expect(garde).toBe(Math.max(garde, ecarte));
        });
    });

    it('et « over » reste le comportement quand le jeu compte au-dessus', () => {
        // Un pilote muet ne doit pas changer de sens du jour au lendemain : la
        // réserve à la Vampire ou Year Zero compte bien les dés qui atteignent.
        centFois(() => {
            const r = rollManually('advantage', 20, 1, 0, 11, charge, 'over');
            const garde = r.rolls[0].val as number;
            const ecarte = r.rolls[1].val as number;
            expect(garde).toBe(Math.max(garde, ecarte));
        });
    });
});
