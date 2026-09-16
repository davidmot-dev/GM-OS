import { describe, it, expect } from 'vitest';
import { LONGUEUR_DU_CONTENU, invitePourUnIndice } from './inviteDImage';

/**
 * **L'invite d'un indice.**
 *
 * *David, le 2026-09-15 : « est-ce que tu peux brancher le générateur d'image IA
 * sur la définition des indices ? ».*
 *
 * ⭐ **Un indice n'est pas un portrait.** Les trois générateurs existants
 * demandent une illustration ; un indice est **un objet qu'on pose devant un
 * joueur**. Registre tranché par David : la **pièce à conviction**.
 */

const indice = (sur: Partial<{ title: string; content: string }> = {}) => ({
    title: 'Une lettre froissée',
    content: 'Signée d’un sceau brisé, tachée de cire rouge.',
    ...sur,
});

describe('invitePourUnIndice — le registre de la pièce à conviction', () => {
    it('demande une photographie de l’objet, pas une scène', () => {
        const invite = invitePourUnIndice(indice());

        expect(invite).toContain('Evidence photograph');
        expect(invite).toContain('Close-up on the object itself');
        expect(invite).toContain('neutral background');
    });

    it('emporte le titre et le contenu', () => {
        const invite = invitePourUnIndice(indice());

        expect(invite).toContain('Une lettre froissée');
        expect(invite).toContain('sceau brisé');
    });

    /**
     * ⚠️ Ces modèles écrivent des lettres qui n'en sont pas. *Mieux vaut un
     * document dont on devine l'écriture qu'un document dont on lit le
     * charabia.*
     */
    it('écarte explicitement le texte lisible', () => {
        expect(invitePourUnIndice(indice())).toContain('No readable text');
    });

    it('met le contenu à plat — un saut de ligne casse l’invite', () => {
        const invite = invitePourUnIndice(indice({ content: 'Ligne un.\n\nLigne deux.' }));

        expect(invite).not.toContain('\n');
        expect(invite).toContain('Ligne un. Ligne deux.');
    });

    /** *Un prompt qui dit tout ne dit plus rien* — même borne que les PNJ. */
    it('borne le contenu', () => {
        const invite = invitePourUnIndice(indice({ content: 'a'.repeat(900) }));

        expect(invite).toContain('a'.repeat(LONGUEUR_DU_CONTENU));
        expect(invite).not.toContain('a'.repeat(LONGUEUR_DU_CONTENU + 1));
    });

    it('borne aussi un titre démesuré', () => {
        const invite = invitePourUnIndice(indice({ title: 'T'.repeat(400) }));

        expect(invite).not.toContain('T'.repeat(121));
    });

    /** Un indice qu'on vient de créer n'a ni titre ni contenu. */
    it('reste utilisable sur un indice vide', () => {
        const invite = invitePourUnIndice({ title: '', content: '' });

        expect(invite).toContain('an unidentified piece of evidence');
        expect(invite).toContain('Evidence photograph');
    });

    it('n’ajoute pas d’espace en trop quand le contenu manque', () => {
        expect(invitePourUnIndice(indice({ content: '   ' }))).not.toContain('  ');
    });
});

describe('les instructions du meneur', () => {
    /**
     * *Le meneur qui prend la plume doit obtenir ce qu'il a écrit, pas ce qu'il
     * a écrit noyé dans ce que nous aurions dit.* Même geste que chez les PNJ.
     */
    it('remplacent entièrement l’invite composée', () => {
        const invite = invitePourUnIndice(indice(), 'A rusted iron key on black velvet');

        expect(invite).toBe('A rusted iron key on black velvet');
        expect(invite).not.toContain('Evidence photograph');
    });

    it('sont ignorées quand elles sont vides', () => {
        expect(invitePourUnIndice(indice(), '   ')).toContain('Evidence photograph');
        expect(invitePourUnIndice(indice(), undefined)).toContain('Evidence photograph');
    });
});
