import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevueDuPilote } from './RevueDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * Ce que ces tests protègent : **la revue montre ce qui ne se raccorde pas.**
 *
 * C'est sa seule raison d'être, et elle a déjà été mise hors service par le
 * défaut qu'elle devait nommer — le 2026-08-22, une cible sans caractéristique
 * et `undefined.sectionId` ont fait tomber tout l'écran.
 */

const FICHE = {
    id: 't-rdd', name: 'Haut-rêvant',
    sections: [
        { id: 'competences_generales', label: 'Compétences Générales', fields: [
            { id: 'esquive', label: 'Esquive', type: 'number', defaultValue: 3 },
        ] },
        { id: 'competences_combat', label: 'Compétences de Combat', fields: [
            { id: 'melee', label: 'Mêlée', type: 'number', defaultValue: 7 },
        ] },
    ],
} as unknown as Partial<SheetTemplate>;

const piloteAvec = (sectionsSupplementaires: string[]): Partial<GameDriver> => ({
    jet: {
        seuil: [{
            id: 'competence', label: 'Compétence',
            sectionId: 'competences_generales', sectionsSupplementaires,
        }],
        sens: 'sous-ou-egal',
    },
});

describe('les sous-groupes à la revue', () => {
    it('montre TOUS les sous-groupes, pas seulement le premier', () => {
        /*
          **N'en montrer qu'un laisserait les autres se raccorder — ou pas —
          sans que rien ne le dise**, et c'est exactement ce que cet écran
          existe pour empêcher.
        */
        render(<RevueDuPilote driver={piloteAvec(['competences_combat'])} template={FICHE} />);

        // `getAllByText` et non `getByText` : la revue montre aussi les sections
        // du gabarit, donc chaque identifiant y figure plus d'une fois. Ce qu'on
        // vérifie ici, c'est qu'ils sont TOUS LES DEUX rendus comme sections du
        // jet — la ligne « Compétence » les porte l'un et l'autre.
        const ligne = screen.getByText('Compétence').parentElement!.parentElement!;
        expect(ligne.textContent).toContain('competences_generales');
        expect(ligne.textContent).toContain('competences_combat');
        expect(ligne.textContent, 'les sous-groupes se lisent comme une alternative').toContain(' ou ');
    });

    it('marque le sous-groupe qui ne se raccorde pas', () => {
        render(<RevueDuPilote driver={piloteAvec(['competences_draconiques'])} template={FICHE} />);

        const fantome = screen.getAllByText(/competences_draconiques/)
            .find(e => e.tagName === 'CODE')!;
        expect(fantome.textContent).toContain('✕');
    });

    it('ne montre rien de plus quand le pilote ne nomme qu une section', () => {
        // La migration : un pilote d'avant le 2026-08-23 s'affiche comme avant.
        render(
            <RevueDuPilote
                driver={{ jet: { seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences_generales' }], sens: 'sous-ou-egal' } }}
                template={FICHE}
            />,
        );

        const ligne = screen.getByText('Compétence').parentElement!.parentElement!;
        expect(ligne.textContent).toContain('competences_generales');
        expect(ligne.textContent, 'rien à mettre en alternative').not.toContain(' ou ');
    });
});
