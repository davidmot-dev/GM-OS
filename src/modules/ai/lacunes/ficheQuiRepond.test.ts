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

    /**
     * **Une liste qui couvre un verbe à une forme et pas aux autres est une
     * liste qui ne le couvre pas.**
     *
     * `fonctionne` y était depuis toujours ; `fonctionnent` non. Le
     * rapprochement étant un recouvrement STRICT, ce seul mot parasite suffisait
     * à faire échouer « Comment fonctionnent les points de tâche ? » — quatre
     * fiches sur vingt-et-une restaient muettes le 2026-08-22.
     */
    it('écarte le verbe interrogatif à toutes ses formes', () => {
        expect(motsPorteurs('Comment fonctionne l’initiative ?')).toEqual(['initiative']);
        expect(motsPorteurs('Comment fonctionnent les jauges ?')).toEqual(['jauge']);
        expect(motsPorteurs('fonctionner'), 'l’infinitif aussi').toEqual([]);
    });

    /**
     * **Et il n'y en a qu'un.** `résoudre`, `calculer`, `gérer`, `dérouler`
     * NOMMENT un sujet dans un corpus de règles — résolution, calcul,
     * déroulement — là où `fonctionner` ne titre jamais rien.
     *
     * La mesure l'a tranché : en retirant `résolvent`, « Comment se résolvent
     * les jets ? » se réduisait à `jets` et répondait *Jets opposés, aide et
     * coopération*. **La mauvaise fiche.** Voir le test qui garde ce cas plus
     * bas.
     */
    it('garde les verbes qui peuvent être le sujet', () => {
        expect(motsPorteurs('Comment se résolvent les jets ?')).toContain('resolvent');
        expect(motsPorteurs('Comment se calculent les dégâts ?')).toContain('calculent');
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
     * **Le cas qui a fait rejeter six verbes de la liste des mots vides.**
     *
     * Privée de `résolvent`, la question ne pèse plus que `jets` — et un mot
     * générique recouvre la première fiche venue. Elle répondait alors *Jets
     * opposés, aide et coopération* là où *Résolution des jets* était la bonne.
     *
     * *Retirer un mot qui pouvait être le sujet coûte une règle exacte et hors
     * sujet, ce qui est pire que la question restée sans réponse.*
     */
    it('ne répond pas « jets opposés » à une question sur la résolution des jets', () => {
        const question = 'Comment se résolvent les jets ?';
        expect(laFicheRepondSeule('Jets opposés, aide et coopération', question)).toBe(false);
    });

    /** Le verbe interrogatif, lui, ne fait plus obstacle. */
    it.each([
        ['Jauges et ressources individuelles', 'Comment fonctionnent les jauges et ressources ?'],
        ['Les points de tâche (actions dans la durée)', 'Comment fonctionnent les points de tâche ?'],
        ['Jets opposés, aide et coopération', 'Comment fonctionnent les jets opposés ?'],
    ])('« %s » répond à « %s »', (sujet, question) => {
        expect(laFicheRepondSeule(sujet, question)).toBe(true);
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
