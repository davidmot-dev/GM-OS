import { describe, it, expect } from 'vitest';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { champsAMontrer, ficheDuCombattant } from './ficheDuCombattant';

/**
 * **La fiche d'un combattant vient d'un seul endroit — et il fallait le prouver.**
 *
 * *Question de David le 2026-09-03 : « comment revoir la fiche de ces nouveaux
 * combattants ? »* Elle a révélé que `CombatCard` lisait la fiche à deux
 * endroits, et qu'un seul des deux avait le repli vers le combattant lui-même.
 * Les adversaires de la Fabrique — qui n'ont pas de fiche en campagne —
 * affichaient donc des **zéros** sur la voie historique.
 */

const GABARIT_DU_JEU: SheetTemplate = {
    id: 'alien', name: 'Alien', emoji: '👽',
    sections: [
        {
            id: 'attributs', label: 'Attributs', fields: [
                { id: 'force', label: 'Force', type: 'number', defaultValue: 3, max: 5 },
                { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 3, max: 5 },
            ],
        },
        {
            id: 'notes', label: 'Notes', fields: [
                { id: 'histoire', label: 'Histoire', type: 'textarea', defaultValue: '' },
                { id: 'total', label: 'Total', type: 'formula', defaultValue: 0, formula: 'force + 1' },
            ],
        },
    ],
};

const GABARIT_DU_PJ: SheetTemplate = { ...GABARIT_DU_JEU, id: 'perso-maison', name: 'Fiche maison' };
const GABARITS = [GABARIT_DU_JEU, GABARIT_DU_PJ];

describe('ficheDuCombattant', () => {
    it('⭐ lit le combattant lui-même quand il n’a pas de fiche en campagne', () => {
        /* Le cas de la Fabrique : c'est celui qui affichait des zéros. */
        const fiche = ficheDuCombattant({ sheetData: { force: 4 } }, null, GABARITS, 'alien');
        expect(fiche.valeurs).toEqual({ force: 4 });
        expect(fiche.origine).toBe('combattant');
    });

    it('⭐ trouve quand même un gabarit : celui du jeu', () => {
        /*
          Sans lui, plus de libellé, plus de type, plus de plafond — la fiche
          serait illisible alors que ses valeurs sont là.
        */
        const fiche = ficheDuCombattant({ sheetData: { force: 4 } }, null, GABARITS, 'alien');
        expect(fiche.gabarit?.id).toBe('alien');
    });

    it('préfère la fiche de campagne quand elle existe — elle est plus fraîche', () => {
        /*
          Un PJ évolue entre deux combats. La copie posée sur le plateau au
          moment où il y est entré ne doit pas l'emporter sur sa vraie fiche.
        */
        const fiche = ficheDuCombattant(
            { sheetData: { force: 2 } },
            { sheetData: { force: 5 }, templateId: 'perso-maison' },
            GABARITS, 'alien',
        );
        expect(fiche.valeurs).toEqual({ force: 5 });
        expect(fiche.gabarit?.id).toBe('perso-maison');
        expect(fiche.origine).toBe('campagne');
    });

    it('retombe sur le combattant si la source existe mais n’a rien dans sa fiche', () => {
        /*
          ⚠️ Le piège du `||` : une fiche VIDE est un objet, donc vraie. Elle
          aurait gagné contre une fiche pleine, et l'écran n'aurait rien montré
          sans jamais dire pourquoi.
        */
        const fiche = ficheDuCombattant(
            { sheetData: { force: 4 } },
            { sheetData: {}, templateId: 'perso-maison' },
            GABARITS, 'alien',
        );
        expect(fiche.valeurs).toEqual({ force: 4 });
        expect(fiche.origine).toBe('combattant');
    });

    it('dit qu’il n’a rien plutôt que de rendre undefined', () => {
        const fiche = ficheDuCombattant({}, null, GABARITS, 'alien');
        expect(fiche.valeurs).toEqual({});
        expect(fiche.origine).toBe('aucune');
    });

    it('n’invente pas de gabarit quand le jeu n’en déclare aucun', () => {
        const fiche = ficheDuCombattant({ sheetData: { force: 4 } }, null, GABARITS, undefined);
        expect(fiche.gabarit).toBeNull();
    });
});

describe('champsAMontrer', () => {
    it('garde les caractéristiques et écarte le texte et les formules', () => {
        const blocs = champsAMontrer(GABARIT_DU_JEU);
        expect(blocs).toHaveLength(1);
        expect(blocs[0].section).toBe('Attributs');
        expect(blocs[0].champs.map(c => c.id)).toEqual(['force', 'agilite']);
    });

    it('ne rend rien sans gabarit, plutôt que de lever', () => {
        expect(champsAMontrer(null)).toEqual([]);
    });
});
