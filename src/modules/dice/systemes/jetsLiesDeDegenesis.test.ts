import { describe, expect, it } from 'vitest';
import { reserveDeDegenesis, resoudreDegenesis } from './degenesis';
import {
    combinerLesDeclencheurs, cumulDeLAction, desDeLAide, issueDeLaConfrontation, texteDeLaCombinaison, texteDuVersement,
    verser, versementDuJet, type ActionComplexe,
} from './jetsLiesDeDegenesis';

describe('DEG-A4 — les jets liés de Degenesis (p. 19-21)', () => {
    it('aide : 2 déclencheurs d’un assistant qui réussit apportent 2D ; un échec n’apporte rien', () => {
        // Difficulté 2 + 1 d'aide = 3 : trois succès dont deux 6.
        expect(desDeLAide(resoudreDegenesis([6, 6, 4, 2], 0, 3))).toBe(2);
        expect(desDeLAide(resoudreDegenesis([6, 6, 2, 2], 0, 3))).toBe(0);
    });

    it('les dés d’aide restent sous le plafond de 12 : le surplus devient des succès d’office', () => {
        const r = reserveDeDegenesis(11, { modificateur: 3 });
        expect(r).toMatchObject({ valeur: 14, des: 12, automatiques: 2 });
    });

    it('combinaison, exemple de Falberg : 2 déclencheurs reportés + 1 = 3, comptés une fois', () => {
        // AGI+Navigation : 5 succès et 2 déclencheurs ; PHY+Corps à corps : 6 succès et 1 déclencheur (p. 20-21).
        const second = resoudreDegenesis([6, 5, 5, 4, 4, 4, 2], 0, 4);
        const c = combinerLesDeclencheurs(second, 2);
        expect(c.degenesis).toMatchObject({ declencheurs: 3, reportes: 2, libelle: 'Réussite excellent' });
        expect(texteDeLaCombinaison(c)).toBe('1 déclencheur + 2 reportés = 3 déclencheurs (p. 20).');
        expect(combinerLesDeclencheurs(second, 0)).toBe(second);
    });

    it('combinaison : un second test raté perd les déclencheurs reportés', () => {
        const c = combinerLesDeclencheurs(resoudreDegenesis([6, 2, 2], 0, 4), 2);
        expect(c.degenesis.declencheurs).toBe(0);
        expect(texteDeLaCombinaison(c)).toContain('sont perdus');
    });

    it('confrontation, exemple du dealer : 3 succès partout, Falberg l’emporte par son 6 (p. 20)', () => {
        const i = issueDeLaConfrontation({ nom: 'Falberg', succes: 3, six: 1 }, { nom: 'L’Apocalyptique', succes: 3, six: 0 });
        expect(i).toMatchObject({ gagnant: 'a', par: 'six' });
        expect(i.texte).toContain('Falberg l’emporte aux six');
    });

    it('confrontation : plus de succès gagne ; égalité parfaite, statu quo ou défaite de l’initiative', () => {
        expect(issueDeLaConfrontation({ nom: 'A', succes: 4, six: 0 }, { nom: 'B', succes: 3, six: 3 }).gagnant).toBe('a');
        expect(issueDeLaConfrontation({ nom: 'A', succes: 2, six: 1 }, { nom: 'B', succes: 2, six: 1 })).toMatchObject({ gagnant: 'egalite', par: 'statu-quo' });
        // L'assassin repéré même à égalité : celui qui prend l'initiative perd (p. 20).
        expect(issueDeLaConfrontation({ nom: 'Assassin', succes: 2, six: 1 }, { nom: 'Victime', succes: 2, six: 1 }, 'a'))
            .toMatchObject({ gagnant: 'b', par: 'initiative' });
    });

    it('action complexe, exemple du chariot : 2, puis 6 + 2, puis 4 + 1 → 15 / 20, il en manque 5', () => {
        // Le livre dit « il faut 7 succès de plus » : son exemple oublie les 2 déclencheurs du second
        // Préserviste (« reste 12 » au lieu de 10), mais compte celui de Falberg. La règle (p. 21) les compte tous.
        let a: ActionComplexe = { id: 'x', nom: 'Dégager le chariot', objectif: 20, versements: [] };
        a = verser(a, versementDuJet('Préserviste 1', resoudreDegenesis([5, 4, 2], 0, 1)));
        a = verser(a, versementDuJet('Préserviste 2', resoudreDegenesis([6, 6, 5, 5, 4, 4, 1], 0, 1)));
        const v = versementDuJet('Falberg', resoudreDegenesis([6, 5, 4, 4, 2], 0, 1));
        a = verser(a, v);
        expect(cumulDeLAction(a)).toBe(15);
        expect(texteDuVersement(a, v)).toBe('Dégager le chariot — Falberg : 4 succès + 1 déclencheur = 5 → 15 / 20 (p. 21).');
    });

    it('action complexe, exemple de la mine : 2 succès et un déclencheur valent 3 (p. 21)', () => {
        expect(versementDuJet('Falberg', resoudreDegenesis([6, 4, 2, 1], 0, 1)).total).toBe(3);
    });
});
