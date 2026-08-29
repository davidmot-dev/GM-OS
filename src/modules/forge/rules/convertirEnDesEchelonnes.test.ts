import { describe, it, expect } from 'vitest';
import { peutEtreRequalifie, requalifierEnDesEchelonnes } from './convertirEnDesEchelonnes';
import { preparerLeJet } from '../../dice/DescripteurDeJet';
import type { GameDriver } from '../../../types/drivers';
import type { SheetSection } from '../../../data/defaultSheetTemplates';

/**
 * **Requalifier un seuil en dés échelonnés — le geste qui remplace une quatrième
 * dérivation.**
 *
 * David a dérivé son pilote Blade Runner trois fois le 2026-08-29, avec une
 * consigne corrigée entre chaque, et il est ressorti trois fois avec un
 * `jet.seuil`. *Quand une consigne échoue trois fois, ce n'est plus la consigne
 * qu'il faut réécrire.*
 */

const AVEC_SEUIL = {
    name: 'Blade Runner',
    jet: {
        sens: 'superieur-ou-egal',
        seuil: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'competence', label: 'Compétence', sectionId: 'competences', sectionsSupplementaires: ['autres'] },
        ],
        difficulte: { min: 0, max: 5, defaut: 0 },
    },
} as unknown as Partial<GameDriver>;

describe('peutEtreRequalifie', () => {
    it('ne se propose que là où il y a quelque chose à déplacer', () => {
        expect(peutEtreRequalifie(AVEC_SEUIL)).toBe(true);
        expect(peutEtreRequalifie(undefined)).toBe(false);
        expect(peutEtreRequalifie({})).toBe(false);
        expect(peutEtreRequalifie({ jet: { sens: 'superieur-ou-egal', seuil: [] } } as unknown as Partial<GameDriver>)).toBe(false);
    });

    /** *Proposer le geste sur un pilote qui n'en a pas besoin le rendrait suspect partout.* */
    it('ne se propose plus une fois la requalification faite', () => {
        const { driver } = requalifierEnDesEchelonnes(AVEC_SEUIL);
        expect(peutEtreRequalifie(driver)).toBe(false);
    });
});

describe('requalifierEnDesEchelonnes', () => {
    /**
     * **Rien n'est inventé.** Le modèle a fait la moitié difficile correctement —
     * les bonnes composantes, dans les bonnes sections. On déplace ce qu'il a
     * trouvé, mot pour mot.
     */
    it('déplace les composantes telles quelles, sections comprises', () => {
        const { driver, deplacees } = requalifierEnDesEchelonnes(AVEC_SEUIL);

        expect(driver.jet?.desEchelonnes?.composantes).toEqual(AVEC_SEUIL.jet!.seuil);
        expect(driver.jet?.desEchelonnes?.echelle).toBe('yze-lettres');
        expect(deplacees).toEqual(['Attribut', 'Compétence']);
    });

    /** Les trois voies répondent à la même question : garder deux calculs en laisse un mort. */
    it('retire le seuil et la cible', () => {
        const avecCible = {
            ...AVEC_SEUIL,
            jet: { ...AVEC_SEUIL.jet, cible: { mecanique: 'reves-de-dragons', caracteristique: { id: 'c', label: 'C', sectionId: 'attributs' } } },
        } as unknown as Partial<GameDriver>;

        const { driver, cibleRetiree } = requalifierEnDesEchelonnes(avecCible);
        expect(driver.jet).not.toHaveProperty('seuil');
        expect(driver.jet).not.toHaveProperty('cible');
        expect(cibleRetiree).toBe(true);
    });

    /**
     * **Le moteur du pupitre suit, sinon la moitié des écrans reste fausse.**
     *
     * Le panneau de fiche lit `jet.desEchelonnes` ; Dice-OS et la tablette ne
     * connaissent que `dice.engine`. Requalifier l'un sans l'autre laisserait un
     * jet lancé depuis le pupitre rendre une poignée de d6.
     */
    it('bascule aussi le moteur de Dice-OS', () => {
        expect(requalifierEnDesEchelonnes(AVEC_SEUIL).driver.dice?.engine).toBe('yze-echelonne');

        const avecYze = { ...AVEC_SEUIL, dice: { defaultDice: '2d6', logic: 'count-success', engine: 'yze' } } as unknown as Partial<GameDriver>;
        const apres = requalifierEnDesEchelonnes(avecYze).driver;
        expect(apres.dice?.engine).toBe('yze-echelonne');
        expect(apres.dice?.logic, 'le reste du bloc dés survit').toBe('count-success');
    });

    /** Le reste du descripteur survit : on requalifie, on ne réécrit pas. */
    it('ne touche à rien d’autre', () => {
        const { driver } = requalifierEnDesEchelonnes(AVEC_SEUIL);
        expect(driver.jet?.sens).toBe('superieur-ou-egal');
        expect(driver.jet?.difficulte).toEqual({ min: 0, max: 5, defaut: 0 });
        expect(driver.name).toBe('Blade Runner');
    });

    /**
     * La revue affiche l'objet du store : le muter sous elle donnerait un écran
     * qui change sans qu'aucun rendu ne l'ait décidé.
     */
    it('ne modifie jamais le pilote reçu', () => {
        const avant = JSON.stringify(AVEC_SEUIL);
        requalifierEnDesEchelonnes(AVEC_SEUIL);
        expect(JSON.stringify(AVEC_SEUIL)).toBe(avant);
    });

    it('ne fait rien sur un pilote qui n’a pas de seuil', () => {
        const nu = { jet: { sens: 'superieur-ou-egal' } } as unknown as Partial<GameDriver>;
        expect(requalifierEnDesEchelonnes(nu)).toEqual({ driver: nu, deplacees: [], cibleRetiree: false });
    });
});

describe('après requalification, le jet part vraiment', () => {
    const SECTIONS: SheetSection[] = [
        { id: 'attributs', label: 'Attributs', fields: [] },
        { id: 'competences', label: 'Compétences', fields: [] },
    ] as unknown as SheetSection[];

    /** Le bout en bout : c'est ce que David doit voir à l'écran après le clic. */
    it('compose D8 + D10 depuis la fiche de Willem Novak', () => {
        const { driver } = requalifierEnDesEchelonnes(AVEC_SEUIL);

        const jet = preparerLeJet(
            driver.jet!,
            { vigueur: 'C (D8)', discretion: 'B (D10)' },
            { champs: { attribut: 'vigueur', competence: 'discretion' } },
            SECTIONS,
        );

        expect(jet.desEchelonnes.map(d => d.faces)).toEqual([8, 10]);
        expect(jet.avertissements, 'plus rien ne bloque le bouton').toEqual([]);
    });
});
