import { describe, it, expect } from 'vitest';
import { assemblerLeContexte } from './AIService';

/**
 * **Ce que ce fichier protège : le stable passe avant le volatil.**
 *
 * Axe C.1 du plan d'accélération du 2026-08-07, fait le 2026-08-21 après que
 * David a signalé *« les temps de réponse sont très longs »*.
 *
 * Un modèle ne réutilise son cache que tant que **le début** de l'invite est
 * identique. Le bloc volatil — points de vie, round, tour — précédait le bloc
 * massif et stable des règles : dès qu'un PJ perdait un point de vie, tout le
 * cache du RAG était invalidé, et le prefill des règles se repayait à chaque
 * question au lieu d'une fois par séance.
 *
 * **Ce défaut n'a aucun symptôme visible.** L'invite est correcte dans les deux
 * sens — mêmes blocs, mêmes titres, même contenu. Seule sa réutilisabilité
 * change, et elle ne se lit nulle part. Un ordre remis à l'envers demain ne se
 * plaindrait de rien : d'où ces tests, qui sont la seule chose capable de le
 * dire.
 */

const RAG = 'RÈGLE : chaque six est une réussite.';
const VIVANT = 'Brucelin : 3/10 PV';

describe('l\'ordre des blocs de l\'invite système', () => {
    it('le RAG précède le contexte vivant', () => {
        const invite = assemblerLeContexte(RAG, undefined, VIVANT);

        expect(invite.indexOf(RAG)).toBeLessThan(invite.indexOf(VIVANT));
    });

    it('les deux blocs restent nommés — on n\'a rien retiré au modèle', () => {
        const invite = assemblerLeContexte(RAG, undefined, VIVANT);

        expect(invite).toContain('--- CONTEXTE RAG (RÈGLES ET LORE) ---');
        expect(invite).toContain('--- CONTEXTE VIVANT (SESSION ACTUELLE) ---');
        expect(invite).toContain(RAG);
        expect(invite).toContain(VIVANT);
    });

    it('le contexte de l\'appelant est stable : il reste du côté du RAG', () => {
        // `customContext` est fourni par le geste en cours — un rapport tactique,
        // une consigne de format. Il ne change pas d'un tour à l'autre pendant
        // ce geste : le placer devant le vivant le rend cachable avec lui.
        const invite = assemblerLeContexte(RAG, 'RAPPORT TACTIQUE', VIVANT);

        expect(invite.indexOf('RAPPORT TACTIQUE')).toBeLessThan(invite.indexOf(VIVANT));
        expect(invite.indexOf('RAPPORT TACTIQUE')).toBeLessThan(invite.indexOf(RAG));
    });

    /**
     * La mesure qui explique tout l'axe : **seule la fin de l'invite bouge**
     * quand la partie avance.
     */
    it('deux tours de jeu partagent tout leur début', () => {
        const tour1 = assemblerLeContexte(RAG, undefined, 'Brucelin : 10/10 PV');
        const tour2 = assemblerLeContexte(RAG, undefined, 'Brucelin : 3/10 PV');

        let commun = 0;
        while (commun < tour1.length && tour1[commun] === tour2[commun]) commun++;

        // Le préfixe partagé doit couvrir tout le RAG, donc dépasser sa fin.
        expect(commun).toBeGreaterThan(tour1.indexOf(RAG) + RAG.length);
    });

    it('un contexte vide ne casse pas la structure', () => {
        const invite = assemblerLeContexte('', undefined, '');

        expect(invite).toContain('--- CONTEXTE RAG (RÈGLES ET LORE) ---');
        expect(invite).toContain('--- CONTEXTE VIVANT (SESSION ACTUELLE) ---');
    });
});
