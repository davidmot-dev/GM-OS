import { describe, it, expect } from 'vitest';
import {
    budgetEnCaracteres, direLEcart, preparerLeTexte, type PieceDeLaForge,
} from './budgetDeLaForge';

/**
 * Ce que ces tests protègent : **la Forge dit ce qu'elle n'a pas lu.**
 *
 * Le plan décrivait un plafond ; le code en portait trois défauts, et deux
 * étaient muets. Le pire : une fois le plafond atteint, la boucle cessait
 * simplement d'ajouter — *le meneur croit avoir forgé depuis quatre livres, la
 * Forge en a lu deux.*
 */

const texte = (name: string, taille: number): PieceDeLaForge =>
    ({ name, type: 'text', content: 'x'.repeat(taille) });

describe('le budget', () => {
    it('se déduit de la fenêtre du modèle, et non d’une constante', () => {
        // 16 384 jetons, 3 000 réservés à l'invite et à la réponse.
        expect(budgetEnCaracteres(16384, 3000)).toBe(Math.floor(13384 * 3.5));
    });

    /**
     * **La réserve n'est pas une précaution, c'est une place déjà prise.**
     * L'invite, le schéma et la réponse partent dans la même fenêtre : compter
     * la fenêtre entière ferait couper le décodeur au moment de répondre.
     */
    it('ne rend jamais un budget négatif', () => {
        expect(budgetEnCaracteres(2000, 4000)).toBe(0);
    });
});

describe('ce que la Forge envoie, et ce qu’elle laisse', () => {
    it('prend tout quand tout entre', () => {
        const { texte: envoye, ecarts } = preparerLeTexte(
            [texte('Livre A', 100), texte('Livre B', 100)], 10_000, 5,
        );

        expect(envoye).toContain('Livre A');
        expect(envoye).toContain('Livre B');
        expect(ecarts).toEqual([]);
    });

    /**
     * **Le défaut le plus grave, et le plus silencieux.** La garde valait « si
     * le cumul est SOUS le plafond, ajoute le document ENTIER » : les documents
     * suivants disparaissaient sans un mot.
     */
    it('nomme le document qui n’est pas entré', () => {
        const { texte: envoye, ecarts } = preparerLeTexte(
            [texte('Le gros livre', 5_000), texte('Le petit oublié', 3_000)], 5_200, 5,
        );

        expect(envoye).toContain('Le gros livre');
        expect(envoye, 'le second n’est pas dedans').not.toContain('Le petit oublié');
        expect(ecarts).toHaveLength(1);
        expect(ecarts[0]).toMatchObject({ nom: 'Le petit oublié', raison: 'budget' });
    });

    /**
     * **Un document trop gros est COUPÉ, pas jeté** — la première moitié d'un
     * chapitre vaut mieux que rien. Mais on le DIT.
     */
    it('coupe un document trop gros, et dit combien il en reste', () => {
        const { texte: envoye, ecarts } = preparerLeTexte([texte('Le pavé', 50_000)], 10_000, 5);

        expect(envoye).toContain('[TEXTE TRONQUÉ]');
        expect(envoye.length, 'on ne dépasse pas le budget de beaucoup')
            .toBeLessThan(10_000 + 200);
        expect(ecarts[0]).toMatchObject({ nom: 'Le pavé', raison: 'tronque' });
        expect(ecarts[0].garde).toBeGreaterThan(0);
    });

    /**
     * **Sous mille caractères, on n'ampute pas, on écarte.** Un fragment de
     * quelques lignes ne renseigne sur rien et coûte son en-tête.
     */
    it('n’envoie pas un fragment qui ne renseigne sur rien', () => {
        const { ecarts } = preparerLeTexte(
            [texte('Presque tout', 9_500), texte('La miette', 2_000)], 10_000, 5,
        );

        expect(ecarts.map(e => e.raison)).toContain('budget');
    });

    it('écarte les pièces jointes en trop, au lieu de les taire', () => {
        const pdf = (name: string): PieceDeLaForge =>
            ({ name, type: 'pdf', content: 'base64', mimeType: 'application/pdf' });
        const { pieces, ecarts } = preparerLeTexte(
            [pdf('un'), pdf('deux'), pdf('trois')], 10_000, 2,
        );

        expect(pieces).toHaveLength(2);
        expect(ecarts).toEqual([{ nom: 'trois', raison: 'trop-de-pieces' }]);
    });
});

describe('ce qui s’écrit au journal', () => {
    it('dit le nom, la raison, et ce que ça coûte', () => {
        expect(direLEcart({ nom: 'Le pavé', raison: 'tronque', garde: 4200 }))
            .toContain('4200 caractères envoyés');
        expect(direLEcart({ nom: 'L’oublié', raison: 'budget' }))
            .toContain('La forge ne l\'a pas lu');
        expect(direLEcart({ nom: 'La sixième', raison: 'trop-de-pieces' }))
            .toContain('trop de pièces jointes');
    });
});
