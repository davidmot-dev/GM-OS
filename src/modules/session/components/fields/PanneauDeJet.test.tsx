import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PanneauDeJet from './PanneauDeJet';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **ce que le joueur peut choisir avant de lancer.**
 *
 * L'écran n'en avait aucun jusqu'au 2026-08-23, et c'est pourtant lui qui rend
 * visible tout le travail du descripteur : un menu incomplet est indiscernable
 * d'un menu complet, et *un jet faux ne se voit jamais en séance.*
 */

const DICE = { defaultDice: '1d100', logic: 'd100-low' as const };

/** La fiche de Rêves de Dragons : des compétences en sous-groupes. */
const FICHE_RDD = {
    id: 't-rdd', name: 'Haut-rêvant', emoji: '🐉',
    sections: [
        { id: 'competences_generales', label: 'Compétences Générales', fields: [
            { id: 'esquive', label: 'Esquive', type: 'number', defaultValue: 3 },
        ] },
        { id: 'competences_combat', label: 'Compétences de Combat', fields: [
            { id: 'melee', label: 'Mêlée', type: 'number', defaultValue: 7 },
        ] },
    ],
} as unknown as SheetTemplate;

/** Une fiche à une seule section par composante : c'est le cas de Dune. */
const FICHE_SIMPLE = {
    id: 't-dune', name: 'Agent', emoji: '🏜️',
    sections: [
        { id: 'competences', label: 'Compétences', fields: [
            { id: 'combat', label: 'Combat', type: 'number', defaultValue: 6 },
        ] },
    ],
} as unknown as SheetTemplate;

const jetAvec = (sectionId: string, sectionsSupplementaires?: string[]): DescripteurDeJet => ({
    seuil: [{ id: 'competence', label: 'Compétence', sectionId, ...(sectionsSupplementaires ? { sectionsSupplementaires } : {}) }],
    sens: 'sous-ou-egal',
    reserve: { base: 1, max: 1, faces: 100 },
});

describe('le menu des composantes', () => {
    it('propose les champs des AUTRES sous-groupes, pas seulement du premier', () => {
        /*
          **Le mur du 2026-08-23.** « Mêlée » est sur la fiche du personnage, et
          le menu du jet ne la proposait pas : elle vit dans un sous-groupe que
          la composante ne nommait pas. Le joueur la voyait et ne pouvait pas la
          jeter.
        */
        render(
            <PanneauDeJet
                descripteur={jetAvec('competences_generales', ['competences_combat'])}
                dice={DICE} template={FICHE_RDD} valeurs={{ esquive: 3, melee: 7 }}
            />,
        );

        expect(screen.getByRole('option', { name: /Esquive/ })).toBeTruthy();
        expect(screen.getByRole('option', { name: /Mêlée/ })).toBeTruthy();
    });

    it('coiffe chaque sous-groupe de son nom, pour qu on sache où l on pioche', () => {
        render(
            <PanneauDeJet
                descripteur={jetAvec('competences_generales', ['competences_combat'])}
                dice={DICE} template={FICHE_RDD} valeurs={{ esquive: 3, melee: 7 }}
            />,
        );

        const groupes = [...document.querySelectorAll('optgroup')].map(g => g.label);
        expect(groupes).toEqual(['Compétences Générales', 'Compétences de Combat']);
    });

    it('un seul sous-groupe ne s annonce pas', () => {
        /*
          Coiffer une liste unique du nom de sa section ajouterait une ligne qui
          ne distingue rien. L'`optgroup` ne sert que là où il y a un choix de
          sous-groupe à faire — Rêves de Dragons, pas Dune.
        */
        render(
            <PanneauDeJet
                descripteur={jetAvec('competences')}
                dice={DICE} template={FICHE_SIMPLE} valeurs={{ combat: 6 }}
            />,
        );

        expect(screen.getByRole('option', { name: /Combat/ })).toBeTruthy();
        expect(document.querySelectorAll('optgroup')).toHaveLength(0);
    });

    it('montre la valeur lue sur la fiche, sous-groupe ou pas', () => {
        // Le menu sert à choisir, mais aussi à VOIR : le meneur compare les
        // valeurs sans ouvrir la fiche.
        render(
            <PanneauDeJet
                descripteur={jetAvec('competences_generales', ['competences_combat'])}
                dice={DICE} template={FICHE_RDD} valeurs={{ esquive: 3, melee: 7 }}
            />,
        );

        expect(screen.getByRole('option', { name: 'Mêlée (7)' })).toBeTruthy();
    });
});
