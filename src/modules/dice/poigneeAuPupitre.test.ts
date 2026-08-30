import { describe, it, expect } from 'vitest';
import { poigneeDepuisLesLettres, composerLaPoignee, MAX_D12, type DeEchelonne } from './desEchelonnes';

/**
 * **Les dés échelonnés au pupitre — demandé par David le 2026-08-30 :**
 * *« le nouveau système Blade Runner ne se retrouve pas dans Dice-OS ».*
 *
 * Il s'y retrouvait à moitié. Le moteur savait résoudre les dés échelonnés
 * depuis le 29, et Dice-OS passait bien par lui — mais **faute de fiche à
 * lire**, il lui envoyait une poignée de d6. Un repli délibéré, choisi pour ne
 * jamais *inventer* un dé plus gros que le personnage, et qui rendait le
 * pupitre inutilisable : le meneur y lançait toujours la poignée d'un débutant.
 * *Des réussites plausibles, et le dé à douze faces nulle part.*
 *
 * Ce que ces tests gardent, c'est que la saisie à la main obéit **aux mêmes
 * règles** que la lecture d'une fiche — l'avantage, le désavantage et le
 * plafond du livre. Deux chemins qui composent la même poignée finiraient
 * sinon par ne plus la composer pareil, et l'écart ne se verrait qu'à un
 * désavantage ou à un troisième D12 : assez rare pour n'être découvert qu'en
 * séance.
 */

const faces = (poignee: { des: DeEchelonne[] }) => poignee.des.map(d => d.faces);

describe('la poignée composée depuis des lettres', () => {
    it('traduit chaque lettre en son dé', () => {
        const poignee = poigneeDepuisLesLettres([
            { label: 'Attribut', lettre: 'A' },
            { label: 'Compétence', lettre: 'C' },
        ]);

        expect(faces(poignee)).toEqual([12, 8]);
        expect(poignee.remarques).toEqual([]);
    });

    /** *La règle du jeu fait foi contre la saisie*, comme sur une fiche. */
    it('accepte la casse et les espaces', () => {
        expect(faces(poigneeDepuisLesLettres([
            { label: 'Attribut', lettre: ' b ' },
            { label: 'Compétence', lettre: 'd' },
        ]))).toEqual([10, 6]);
    });

    /**
     * Une lettre inconnue est écartée **en le disant**. Une poignée
     * silencieusement amputée lancerait un dé de moins sans que personne ne
     * s'en aperçoive.
     */
    it('écarte une lettre inconnue et le dit', () => {
        const poignee = poigneeDepuisLesLettres([
            { label: 'Attribut', lettre: 'B' },
            { label: 'Compétence', lettre: 'Z' },
        ]);

        expect(faces(poignee)).toEqual([10]);
        expect(poignee.remarques.join(' ')).toContain('Compétence');
    });

    it('rend une poignée vide plutôt que des dés inventés', () => {
        expect(poigneeDepuisLesLettres([{ label: 'Attribut', lettre: '' }]).des).toEqual([]);
    });
});

describe('les règles du livre, saisie à la main comprise', () => {
    /** « Ajout d'un troisième dé de base identique au plus faible des deux. » */
    it('ajoute au plus faible sur un avantage', () => {
        const poignee = poigneeDepuisLesLettres([
            { label: 'Attribut', lettre: 'A' },
            { label: 'Compétence', lettre: 'C' },
        ], 'avantage');

        expect(faces(poignee)).toEqual([12, 8, 8]);
    });

    /** « Retrait du dé de base le plus faible » — jamais le dernier. */
    it('retire le plus faible sur un désavantage', () => {
        const poignee = poigneeDepuisLesLettres([
            { label: 'Attribut', lettre: 'A' },
            { label: 'Compétence', lettre: 'C' },
        ], 'desavantage');

        expect(faces(poignee)).toEqual([12]);
    });

    /**
     * *Un jet sans dé n'échoue pas, il ne se lance pas.* C'est ce que l'ordre
     * modificateur-puis-bornes protège.
     */
    it('ne vide jamais une poignée d’un seul dé', () => {
        const poignee = poigneeDepuisLesLettres([{ label: 'Attribut', lettre: 'B' }], 'desavantage');
        expect(faces(poignee)).toEqual([10]);
    });

    /**
     * Le livre plafonne **la taille**, il ne réduit pas le nombre de dés :
     * le D12 en trop redescend à dix faces, il ne disparaît pas.
     */
    it('ramène le troisième D12 à dix faces, et le dit', () => {
        const poignee = poigneeDepuisLesLettres([
            { label: 'Attribut', lettre: 'A' },
            { label: 'Compétence', lettre: 'A' },
        ], 'avantage');

        expect(faces(poignee)).toEqual([12, 12, 10]);
        expect(poignee.des).toHaveLength(3);
        expect(poignee.remarques.join(' ')).toContain(String(MAX_D12));
    });
});

describe('la composition partagée', () => {
    /**
     * `composerLaPoignee` est le seul endroit qui connaisse l'ordre — le
     * modificateur, puis les bornes. Le panneau de fiche et le pupitre
     * l'appellent tous les deux ; borner d'abord viderait la poignée d'un
     * personnage qui n'a qu'un dé.
     */
    it('applique le modificateur avant les bornes', () => {
        const troisDouze: DeEchelonne[] = [
            { label: 'Attribut', champ: 'a', niveau: 'A', faces: 12 },
            { label: 'Compétence', champ: 'c', niveau: 'A', faces: 12 },
        ];

        const avecAvantage = composerLaPoignee(troisDouze, 'avantage');

        // L'avantage a d'abord ajouté un troisième D12, que les bornes ont
        // ensuite ramené à dix : l'ordre inverse n'aurait rien eu à borner.
        expect(avecAvantage.des.map(d => d.faces)).toEqual([12, 12, 10]);
        expect(avecAvantage.remarques).not.toEqual([]);
    });

    it('laisse une poignée conforme intacte et muette', () => {
        const poignee = composerLaPoignee([
            { label: 'Attribut', champ: 'a', niveau: 'B', faces: 10 },
            { label: 'Compétence', champ: 'c', niveau: 'C', faces: 8 },
        ]);

        expect(poignee.des.map(d => d.faces)).toEqual([10, 8]);
        expect(poignee.remarques).toEqual([]);
    });
});
