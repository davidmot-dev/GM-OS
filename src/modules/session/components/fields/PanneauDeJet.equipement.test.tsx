import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PanneauDeJet from './PanneauDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { ObjetDuCatalogue } from '../../../../types/drivers';

/**
 * L'équipement porté au panneau de jet d'Alien — § 203, étape E (02/11/2026).
 * Les effets sont ceux du catalogue relu : palmes M11 et CCC5 de Colonial
 * Marines.
 */
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: vi.fn() }));
vi.mock('../../../tables/pontDesTables', () => ({ pontDesTables: () => null }));

const jet: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 10, faces: 6, sansPlafond: true,
        composantes: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }, { id: 'competence', label: 'Compétence', sectionId: 'competences' }],
        secondaire: { label: 'Stress', libelleDuUn: 'Panique', composantes: [{ id: 'stress', label: 'Stress', sectionId: 'jauges' }] } },
    panique: { faces: 6, champ: 'panique', seuil: 7, suites: { mecanique: 'alien', stress: 'stress', agilite: 'agilite', empathie: 'empathie', androide: 'androide', talents: 'talent' } },
    alien: { competence: 'competence', competences: { mobilite: 'mobilite', observation: 'observation' }, equipement: { noms: 'armes', bonus: 'bonus', degats: 'degats', portees: 'portees' } },
};
const template = { id: 'test', name: 'Alien fictif', sections: [
    { id: 'attributs', label: 'Attributs', fields: [{ id: 'agilite', label: 'Agilité', type: 'number' }] },
    { id: 'competences', label: 'Compétences', fields: [{ id: 'mobilite', label: 'Mobilité', type: 'number' }, { id: 'observation', label: 'Observation', type: 'number' }] },
    { id: 'jauges', label: 'Jauges', fields: [{ id: 'stress', label: 'Stress', type: 'number' }] },
] } as SheetTemplate;
const PORTES: ObjetDuCatalogue[] = [
    { id: 'palmes-m11', famille: 'materiel', nom: 'Palmes d’ornithorynque M11', valeurs: {},
        effets: [{ cible: 'mobilite', valeur: 2, condition: 'sous l’eau', texte: 'Bonus de +2 aux tests de Mobilité sous l’eau' }] },
    { id: 'ccc5', famille: 'protection', nom: 'Combinaison de compression offensive CCC5', valeurs: {},
        effets: [{ cible: 'observation', valeur: -1, texte: 'Malus de -1 aux tests d’Observation' }] },
];

const monter = (objetsPortes?: ObjetDuCatalogue[]) => render(
    <PanneauDeJet descripteur={jet} dice={{ engine: 'yze', defaultDice: 'd6', logic: 'count-success', successThreshold: 6 }}
        template={template} valeurs={{ agilite: 2, mobilite: 1, observation: 0, stress: 0, panique: 0 }} personnageId="pj" campaignId="c"
        objetsPortes={objetsPortes} />,
);
const choisir = (competence: string) => {
    const selects = screen.getAllByRole('combobox');
    [ 'agilite', competence, 'stress' ].forEach((v, i) => fireEvent.change(selects[i], { target: { value: v } }));
};
afterEach(cleanup);

describe('Équipement porté au jet d’Alien', () => {
    it('ne rappelle que les effets qui visent la compétence choisie, sans rien cocher', () => {
        monter(PORTES);
        choisir('mobilite');
        const carte = screen.getByRole('region', { name: 'Équipement porté' });
        expect(carte.textContent).toContain('Palmes d’ornithorynque M11');
        expect(carte.textContent).toContain('sous l’eau');
        expect(carte.textContent).not.toContain('CCC5');
        expect((screen.getByRole('checkbox', { name: /Palmes/ }) as HTMLInputElement).checked).toBe(false);
        expect(screen.getByText(/→ 3 dés de base/)).toBeTruthy();
    });

    it('une case cochée s’ajoute aux dés et se nomme dans le détail du jet', () => {
        monter(PORTES);
        choisir('mobilite');
        fireEvent.click(screen.getByRole('checkbox', { name: /Palmes/ }));
        expect(screen.getByText(/équipement \+2 \(Palmes d’ornithorynque M11\).*→ 5 dés de base/)).toBeTruthy();
        expect(screen.getByText('Équipement : +2')).toBeTruthy();
        // Changer de compétence : l'effet ne vise plus le jet et ne compte plus.
        choisir('observation');
        expect(screen.queryByRole('checkbox', { name: /Palmes/ })).toBeNull();
        expect(screen.getByText(/→ 2 dés de base/)).toBeTruthy();
    });

    it('un effet sur le Niveau de Stress ne se propose pas au jet : ce n’est pas un dé de base', () => {
        monter([{ id: 'cafe', famille: 'materiel', nom: 'Café', valeurs: {}, effets: [{ cible: 'stress', valeur: 1, texte: 'Niveau de stress +1' }] }]);
        choisir('mobilite');
        expect(screen.queryByRole('region', { name: 'Équipement porté' })).toBeNull();
    });

    it('sans objets portés, pas de carte', () => {
        monter(undefined);
        choisir('mobilite');
        expect(screen.queryByRole('region', { name: 'Équipement porté' })).toBeNull();
    });
});
