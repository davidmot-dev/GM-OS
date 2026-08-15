import { describe, it, expect } from 'vitest';
import { ficheNeuve } from './ficheNeuve';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **un personnage neuf porte les champs de son
 * jeu.**
 *
 * `AddCharacterForm` écrivait `sheetData: {}` — une fiche vide, même quand le
 * gabarit en déclarait seize. Un personnage d'Alien naissait donc sans Force,
 * sans Agilité et sans ses douze compétences, et tout ce qui se lit **sur la
 * fiche** n'avait rien à lire : la santé de départ, le seuil du jet, le seuil
 * de la tâche de défaite. Les jauges de `CombatCard` affichaient zéro — *ce qui
 * ressemble à un personnage en pleine forme.*
 */

const gabarit = (sections: unknown): SheetTemplate =>
    ({ id: 't', name: 'Fiche', sections } as SheetTemplate);

describe('une fiche neuve porte les champs du gabarit', () => {
    it('reprend les valeurs par défaut décidées à la forge', () => {
        const fiche = ficheNeuve(gabarit([
            { id: 'attributs', label: 'Attributs', fields: [
                { id: 'force', label: 'Force', type: 'number', defaultValue: 2 },
                { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 3 },
            ] },
        ]));

        expect(fiche).toEqual({ force: 2, agilite: 3 });
    });

    it('traverse toutes les sections — c\'est le cas réel d\'Alien', () => {
        // Six sections chez lui : identité, attributs, compétences, jauges,
        // équipement, relations.
        const fiche = ficheNeuve(gabarit([
            { id: 'identite', label: 'Identité', fields: [{ id: 'nom', label: 'Nom', type: 'text' }] },
            { id: 'attributs', label: 'Attributs', fields: [{ id: 'force', label: 'Force', type: 'number' }] },
            { id: 'jauges', label: 'Jauges', fields: [{ id: 'stress', label: 'Stress', type: 'gauge' }] },
        ]));

        expect(Object.keys(fiche)).toEqual(['nom', 'force', 'stress']);
    });

    it('donne à chaque type son zéro, sans rien décider d\'autre', () => {
        /**
         * Un champ sans valeur par défaut reçoit le vide de son type — jamais
         * une valeur choisie ici, qui serait une règle inventée par l'outil.
         */
        const fiche = ficheNeuve(gabarit([
            { id: 's', label: 'S', fields: [
                { id: 'n', label: 'N', type: 'number' },
                { id: 'j', label: 'J', type: 'gauge' },
                { id: 'e', label: 'E', type: 'rating' },
                { id: 'c', label: 'C', type: 'checkbox' },
                { id: 't', label: 'T', type: 'text' },
                { id: 'a', label: 'A', type: 'textarea' },
            ] },
        ]));

        expect(fiche).toEqual({ n: 0, j: 0, e: 0, c: false, t: '', a: '' });
    });

    it('une valeur par défaut à zéro reste zéro, pas le vide du type', () => {
        // `?? ` et non `||` : un attribut qui commence à 0 est une valeur
        // choisie, pas une absence.
        expect(ficheNeuve(gabarit([
            { id: 's', label: 'S', fields: [{ id: 'stress', label: 'Stress', type: 'number', defaultValue: 0 }] },
        ]))).toEqual({ stress: 0 });
    });
});

describe('ce qu\'on ne fabrique pas', () => {
    it('sans gabarit, la fiche reste vide', () => {
        // Il n'y a alors rien à déclarer, et inventer des champs serait pire
        // que l'absence.
        expect(ficheNeuve(undefined)).toEqual({});
    });

    it('un gabarit sans section, ou une section sans champ, ne casse rien', () => {
        expect(ficheNeuve(gabarit([]))).toEqual({});
        expect(ficheNeuve(gabarit([{ id: 's', label: 'S', fields: [] }]))).toEqual({});
        expect(ficheNeuve(gabarit(undefined))).toEqual({});
    });

    it('un champ sans identifiant est ignoré plutôt que rangé sous une clé vide', () => {
        const fiche = ficheNeuve(gabarit([
            { id: 's', label: 'S', fields: [
                { label: 'Sans id', type: 'number' },
                { id: 'force', label: 'Force', type: 'number', defaultValue: 4 },
            ] },
        ]));

        expect(fiche).toEqual({ force: 4 });
    });
});
