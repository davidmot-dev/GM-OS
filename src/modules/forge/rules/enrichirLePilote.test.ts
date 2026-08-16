import { describe, it, expect } from 'vitest';
import { enrichirLePilote, estVide } from './enrichirLePilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **enrichir un pilote n'en crée pas un second, et
 * n'efface rien du premier**.
 *
 * L'enregistrement de la Forge Système faisait `custom-${Date.now()}` sans
 * condition. Reforger Cthulhu Hack aurait produit un pilote jumeau à côté de
 * celui que les campagnes désignent, et un gabarit jumeau à côté de celui que
 * les fiches de personnage désignent.
 *
 * C'est ici que le double coûte le plus cher : `sheetData` est indexé par
 * `field.id`. Un gabarit remplacé, ce sont des fiches déjà remplies qui perdent
 * leurs valeurs — sans erreur, sans champ en rouge.
 */

const PILOTE = (): GameDriver => ({
    id: 'custom-1774643419710',
    name: 'Cthulhu Hack',
    templateId: 'tpl-1774643419711',
    dice: { defaultDice: '1d20', logic: 'sum', engine: 'standard' },
    combat: {
        statsToTrack: [{ fieldId: 'hp', label: 'PV', isMainHP: true, isResource: false }],
        initiativeFormula: 'manual',
        defaultHealthType: 'hp',
    },
} as unknown as GameDriver);

const GABARIT = (): SheetTemplate => ({
    id: 'tpl-1774643419711',
    name: 'Fiche Cthulhu Hack',
    isBuiltin: false,
    sections: [
        {
            id: 'sauvegardes',
            label: 'Sauvegardes',
            fields: [
                { id: 'force', label: 'Force', type: 'number' },
                { id: 'dexterite', label: 'Dextérité', type: 'number' },
            ],
        },
    ],
} as unknown as SheetTemplate);

describe('enrichirLePilote', () => {
    it("garde l'identifiant du pilote et celui de son gabarit", () => {
        const { driver } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { driver: { id: 'custom-neuf', templateId: 'tpl-neuf', name: 'Cthulhu Hack v2' } as Partial<GameDriver> },
        );

        // Les campagnes designent `id`, les personnages designent `templateId`.
        expect(driver.id).toBe('custom-1774643419710');
        expect(driver.templateId).toBe('tpl-1774643419711');
        expect(driver.name).toBe('Cthulhu Hack');
    });

    it('remplit le bloc qui manquait, et le dit', () => {
        // Le cas réel : le pilote de David n'a AUCUN `jet`, et c'est ce qui fait
        // résoudre ses jets à l'envers.
        const { driver, journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { driver: { jet: { sens: 'sous-ou-egal', seuil: [{ id: 'sauvegardes', label: 'Sauvegarde', sectionId: 'sauvegardes' }] } } as Partial<GameDriver> },
        );

        expect(driver.jet?.sens).toBe('sous-ou-egal');
        expect(journal.remplis).toContain('jet');
    });

    it('ne remplace jamais une valeur déjà posée, et signale le désaccord', () => {
        const { driver, journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { driver: { dice: { defaultDice: '2d20', logic: 'count-success', engine: '2d20' } } as Partial<GameDriver> },
        );

        expect(driver.dice.defaultDice).toBe('1d20');
        expect(driver.dice.logic).toBe('sum');
        expect(journal.conserves).toEqual(
            expect.arrayContaining(['dice.defaultDice', 'dice.logic', 'dice.engine']),
        );
    });

    it('descend dans les objets au lieu de les remplacer en bloc', () => {
        const { driver, journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { driver: { combat: { defaultHealthType: 'clocks', damageTypes: ['physique', 'mental'] } } as unknown as Partial<GameDriver> },
        );

        // `statsToTrack` survit : une fusion superficielle l'aurait emporte.
        expect(driver.combat.statsToTrack).toHaveLength(1);
        expect(driver.combat.defaultHealthType).toBe('hp');
        expect(driver.combat.damageTypes).toEqual(['physique', 'mental']);
        expect(journal.remplis).toContain('combat.damageTypes');
        expect(journal.conserves).toContain('combat.defaultHealthType');
    });

    it("ne dit rien quand la dérivation confirme ce qui est là", () => {
        const { journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { driver: { dice: { defaultDice: '1d20', logic: 'sum', engine: 'standard' } } as Partial<GameDriver> },
        );

        expect(journal.remplis).toEqual([]);
        expect(journal.conserves).toEqual([]);
    });

    it("ignore une dérivation muette plutôt que de vider un champ", () => {
        const { driver, journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { driver: { name: '', description: '', combat: {} } as unknown as Partial<GameDriver> },
        );

        expect(driver.name).toBe('Cthulhu Hack');
        expect(driver.combat.statsToTrack).toHaveLength(1);
        expect(journal.remplis).toEqual([]);
    });
});

describe('le gabarit ne se remplace pas, il se complète', () => {
    it('ajoute une section absente', () => {
        const { template, journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { template: { sections: [{ id: 'ressources', label: 'Ressources', fields: [{ id: 'torche', label: 'Torche', type: 'text' }] }] } as unknown as Partial<SheetTemplate> },
        );

        expect(template!.sections.map(s => s.id)).toEqual(['sauvegardes', 'ressources']);
        expect(journal.sectionsAjoutees).toEqual(['ressources']);
    });

    it("ajoute un champ manquant dans une section qui existait", () => {
        const { template, journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { template: { sections: [{ id: 'sauvegardes', label: 'Sauvegardes', fields: [{ id: 'constitution', label: 'Constitution', type: 'number' }] }] } as unknown as Partial<SheetTemplate> },
        );

        expect(template!.sections[0].fields.map(f => f.id)).toEqual(['force', 'dexterite', 'constitution']);
        expect(journal.champsAjoutes).toEqual(['sauvegardes.constitution']);
    });

    it("ne touche jamais un champ existant, meme si la derivation le decrit autrement", () => {
        // `sheetData` est indexe par `field.id` : changer un type vide la case
        // correspondante sur toutes les fiches deja remplies.
        const { template, journal } = enrichirLePilote(
            { driver: PILOTE(), template: GABARIT() },
            { template: { sections: [{ id: 'sauvegardes', label: 'Jets de sauvegarde', fields: [{ id: 'force', label: 'FOR', type: 'text' }] }] } as unknown as Partial<SheetTemplate> },
        );

        expect(template!.sections[0].label).toBe('Sauvegardes');
        expect(template!.sections[0].fields[0]).toEqual({ id: 'force', label: 'Force', type: 'number' });
        expect(journal.champsAjoutes).toEqual([]);
    });

    it("ne rend aucun gabarit quand le pilote n'en avait pas", () => {
        const { template } = enrichirLePilote(
            { driver: PILOTE() },
            { template: { sections: [{ id: 'x', label: 'X', fields: [] }] } as unknown as Partial<SheetTemplate> },
        );

        expect(template).toBeUndefined();
    });
});

describe('estVide', () => {
    it('ne prend ni zéro ni faux pour une absence', () => {
        // Un modificateur nul, une option désactivée : ce sont des décisions.
        expect(estVide(0)).toBe(false);
        expect(estVide(false)).toBe(false);
    });

    it('reconnaît les absences réelles', () => {
        for (const vide of [undefined, null, '', '   ', [], {}]) {
            expect(estVide(vide), JSON.stringify(vide)).toBe(true);
        }
    });
});
