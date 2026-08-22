import { describe, it, expect } from 'vitest';
import { declarationAffichee, fusionnerLaDeclaration } from './declarationDuCorpus';
import { lireNature } from './familleDuCorpus';

/**
 * Ce que ces tests protègent : **régler un champ n'en détruit pas un autre.**
 *
 * C'est la leçon du trousseau de clés, payée le 2026-08-16 — *retaper une clé
 * détruisait les autres*, parce qu'on réécrivait le coffre entier depuis ce
 * qu'un seul écran connaissait. `corpus.json` portera demain des champs que cet
 * écran ignore ; les écraser en réglant la langue serait la même faute.
 */

describe('la fusion', () => {
    it('déclare une famille sur un corpus qui ne disait rien', () => {
        const { json } = fusionnerLaDeclaration(null, { nature: 'famille', moteur: '2d20' });
        expect(lireNature(json)).toMatchObject({ nature: 'famille', moteur: '2d20' });
    });

    it('conserve les champs que cet écran ne connaît pas', () => {
        const ancien = '{"nature":"jeu","notesDuMeneur":"à reforger","edition":3}';
        const { json } = fusionnerLaDeclaration(ancien, { nature: 'famille' });
        const relu = JSON.parse(json!);

        expect(relu.nature, 'ce qu’on règle change').toBe('famille');
        expect(relu.notesDuMeneur, 'ce qu’on ignore survit').toBe('à reforger');
        expect(relu.edition).toBe(3);
    });

    /**
     * **Vider un champ le RETIRE.** Une chaîne vide se relirait comme une
     * déclaration — « ce corpus est en langue "" » — là où l'absence se lit
     * déjà comme une absence partout ailleurs.
     */
    it('retire un champ vidé au lieu de le mettre à vide', () => {
        const ancien = '{"nature":"famille","moteur":"2d20","langue":"en"}';
        const { json } = fusionnerLaDeclaration(ancien, { nature: 'famille', moteur: '2d20', langue: '  ' });
        const relu = JSON.parse(json!);

        expect('langue' in relu, 'la clé disparaît').toBe(false);
        expect(relu.moteur).toBe('2d20');
    });

    /**
     * **Un fichier qu'on ne sait pas lire est un fichier qu'on ne réécrit pas.**
     * Le remplacer silencieusement par notre version ferait disparaître ce qu'il
     * portait — et c'est exactement le genre de perte qui ne se plaint de rien.
     */
    it('refuse d’écraser un corpus.json illisible, et le dit', () => {
        const { json, erreur } = fusionnerLaDeclaration('{"nature": "famille",,}', { nature: 'jeu' });

        expect(json).toBeUndefined();
        expect(erreur).toContain('pas été touché');
    });

    it('refuse aussi ce qui n’est pas un objet', () => {
        expect(fusionnerLaDeclaration('["famille"]', { nature: 'jeu' }).erreur).toBeTruthy();
        expect(fusionnerLaDeclaration('42', { nature: 'jeu' }).erreur).toBeTruthy();
    });

    it('rend un JSON relisible par le lecteur qui fait foi', () => {
        // Le contrat qui compte : ce qu'on écrit, `lireNature` doit le relire.
        const { json } = fusionnerLaDeclaration('{}', {
            nature: 'famille', moteur: 'yze', langue: 'fr',
        });
        expect(lireNature(json)).toEqual({ nature: 'famille', moteur: 'yze', langue: 'fr' });
    });
});

describe('ce que l’écran montre avant toute saisie', () => {
    /**
     * *Un champ vide invite à remplir, un champ juste invite à vérifier.* Un
     * corpus sans déclaration EST un jeu — c'est le défaut documenté, et neuf
     * corpus sur onze en dépendent.
     */
    it('montre « jeu » pour un corpus qui ne déclare rien', () => {
        expect(declarationAffichee(null)).toEqual({ nature: 'jeu', moteur: '', langue: '' });
    });

    it('montre ce qui est déclaré', () => {
        expect(declarationAffichee('{"nature":"famille","moteur":"2d20"}'))
            .toEqual({ nature: 'famille', moteur: '2d20', langue: '' });
    });

    it('ne prétend pas lire un fichier cassé', () => {
        expect(declarationAffichee('{cassé')).toEqual({ nature: 'jeu', moteur: '', langue: '' });
    });
});
