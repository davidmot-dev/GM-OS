import { describe, it, expect } from 'vitest';
import { extraireLaRegle, laFicheRepondSeule, motsPorteurs } from './ficheQuiRepond';

/**
 * Ce que ces tests protègent : **on ne répond avec une fiche que si c'est LA
 * bonne.**
 *
 * *« La valeur de l'étage 1 n'est pas la milliseconde, c'est la traçabilité. »*
 * Mais le risque est de répondre avec la mauvaise fiche, et il est plus grave
 * qu'une paraphrase maladroite : le meneur lirait **une règle exacte, tirée
 * d'une source vérifiée, qui ne répond pas à sa question.**
 */

describe('les mots qui portent', () => {
    it('écarte les mots qui ne distinguent rien', () => {
        expect(motsPorteurs('Quelles sont les règles de l’éthylisme ?')).toEqual(['ethylisme']);
    });

    it('ramène les pluriels, pour que deux formulations se rejoignent', () => {
        expect(motsPorteurs('dégâts')).toEqual(motsPorteurs('dégât'));
    });
});

describe('la fiche répond-elle seule', () => {
    it('répond quand la question ne parle que de son sujet', () => {
        expect(laFicheRepondSeule('Éthylisme (jet, degrés et malus)', 'règles d’éthylisme'))
            .toBe(true);
    });

    it('répond aussi dans l’autre sens', () => {
        expect(laFicheRepondSeule('Poursuites', 'Comment gère-t-on une poursuite ?')).toBe(true);
    });

    /**
     * **Le cas qui justifie la sévérité, et le seul qui la teste vraiment.**
     *
     * Les mots SE CROISENT — « dégâts » est des deux côtés — et la question
     * déborde pourtant : elle porte sur la chute, dont la fiche générale ne
     * parle pas. Un rapprochement qui se contenterait d'un mot commun
     * répondrait ici **une règle exacte et hors sujet**, ce qui est plus grave
     * qu'une paraphrase maladroite.
     */
    it('se tait quand la question déborde du sujet, même si des mots se croisent', () => {
        expect(laFicheRepondSeule('Dégâts et types de dégâts', 'Comment se calculent les dégâts de chute ?'))
            .toBe(false);
    });

    it('se tait aussi quand rien ne se croise', () => {
        expect(laFicheRepondSeule('Santé et blessures', 'règles de poursuite')).toBe(false);
    });

    /**
     * **Il faut au moins un mot porteur.** Une question sans substance
     * recouvrirait tout, et répondrait avec la première fiche venue.
     */
    it('ne répond jamais à une question sans substance', () => {
        expect(laFicheRepondSeule('Éthylisme', 'et alors ?')).toBe(false);
        expect(laFicheRepondSeule(undefined, 'éthylisme')).toBe(false);
        expect(laFicheRepondSeule('', 'éthylisme')).toBe(false);
    });
});

describe('ce qu’on montre de la fiche', () => {
    const fiche = [
        '---', 'sujet: Éthylisme', 'relu: true', '---', '',
        '# Éthylisme', '',
        '## Règle', 'Le personnage jette sous sa Constitution.', '',
        '## Valeurs', 'Malus de −2 par verre.', '',
        '## Non couvert', 'Les sources ne disent rien des elfes.', '',
    ].join('\n');

    /**
     * **C'est « Règle » qui répond.** Rendre le tout noierait la réponse sous
     * l'inventaire des valeurs et des cas limites.
     */
    it('rend la section « Règle », et elle seule', () => {
        const regle = extraireLaRegle(fiche);

        expect(regle).toContain('sous sa Constitution');
        expect(regle, 'sans les valeurs').not.toContain('Malus de −2');
        expect(regle, 'ni le frontmatter').not.toContain('relu: true');
    });

    /**
     * **Le corps entier en secours, jamais rien.** Une fiche sans « Règle » est
     * une fiche ancienne ou faite à la main : la taire reviendrait à perdre la
     * seule réponse traçable qu'on avait.
     */
    it('retombe sur le corps quand il n’y a pas de section « Règle »', () => {
        const brute = '---\nsujet: Notes\n---\n\n# Notes\n\nUn texte libre.\n';
        expect(extraireLaRegle(brute)).toContain('Un texte libre.');
    });
});
