import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

/**
 * **Les Vécus reliés à leur liste** — Nephilim, 2026-10-17 : la fiche propose
 * les noms, ⓘ ouvre ce que le corpus en dit, et le jet rappelle le Vécu retenu.
 */
vi.mock('../../logic/banniereDuPilote', () => ({ racineDuPilote: async () => 'systems/nephilim' }));
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

const INDEX = {
    referentiel: 'Vécus passés',
    entrees: [
        { nom: 'Héros', fichier: '00-atlantide.md', details: { 'Ka-élément': 'Feu', Époque: "La Chute de l'Atlantide" } },
        { nom: 'Mercenaire', fichier: '07-mesopotamie.md', details: { 'Ka-élément': 'Eau' } },
        { nom: 'Mercenaire', fichier: '10-carthage.md', details: { 'Ka-élément': 'Feu' } },
    ],
};
const FICHIERS: Record<string, string> = {
    'gmos://media/docs/systems/nephilim/vecus/index.json': JSON.stringify(INDEX),
    'gmos://media/docs/systems/nephilim/vecus/00-atlantide.md': '## Héros — Ka-Feu\n\nVous avez été un héros fondateur.\n',
    'gmos://media/docs/systems/nephilim/vecus/07-mesopotamie.md': '## Mercenaire — Ka-Eau\n\nSoldat de fortune perse.\n',
    'gmos://media/docs/systems/nephilim/vecus/10-carthage.md': '## Mercenaire — Ka-Feu\n\nSoldat de fortune punique.\n',
};

const { default: ChampDuReferentiel } = await import('./ChampDuReferentiel');
const { default: PanneauDeJet } = await import('./PanneauDeJet');

const PILOTE = { id: 'neph', name: 'Nephilim', corpusId: 'nephilim' };
const CHAMP = { id: 'pastlives_0_name', label: 'Vécu passé 1', type: 'text' as const, defaultValue: '', referentiel: 'vecus/index.json' };

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (adresse: string) => (adresse in FICHIERS
        ? { ok: true, text: async () => FICHIERS[adresse] }
        : { ok: false, text: async () => '' })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('un nom de Vécu relié à la liste', () => {
    it('la saisie propose les noms de la liste', async () => {
        const { container } = render(<ChampDuReferentiel field={CHAMP} value="" onChange={vi.fn()} pilote={PILOTE} />);
        await vi.waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
        expect([...container.querySelectorAll('datalist option')].map(o => o.getAttribute('value'))).toEqual(['Héros', 'Mercenaire']);
    });

    it('un nom de la liste ouvre ses détails et sa description', async () => {
        render(<ChampDuReferentiel field={CHAMP} value="héros" onChange={vi.fn()} pilote={PILOTE} />);
        fireEvent.click(await screen.findByLabelText(/Ce que dit le corpus de « héros »/));
        const panneau = screen.getByText("Ka-élément : Feu · Époque : La Chute de l'Atlantide").closest('[data-description-du-referentiel]') as HTMLElement;
        expect(await within(panneau).findByText('Vous avez été un héros fondateur.')).toBeTruthy();
    });

    it('un nom porté par deux époques les montre toutes deux', async () => {
        render(<ChampDuReferentiel field={CHAMP} value="Mercenaire" onChange={vi.fn()} pilote={PILOTE} />);
        fireEvent.click(await screen.findByLabelText(/Ce que dit le corpus/));
        expect(screen.getByText(/2 entrées portent ce nom/)).toBeTruthy();
        expect(await screen.findByText('Soldat de fortune perse.')).toBeTruthy();
        expect(await screen.findByText('Soldat de fortune punique.')).toBeTruthy();
    });

    it('un nom inventé reste permis, sans bouton', async () => {
        const { container } = render(<ChampDuReferentiel field={CHAMP} value="Templier" onChange={vi.fn()} pilote={PILOTE} />);
        await vi.waitFor(() => expect(container.querySelectorAll('datalist option').length).toBeGreaterThan(0));
        expect(screen.queryByLabelText(/Ce que dit le corpus/)).toBeNull();
    });
});

describe('le Vécu retenu au jet', () => {
    it('la ligne d’aide dit ses détails et le début de sa description', async () => {
        const { useSessionOSStore } = await import('../../useSessionOSStore');
        useSessionOSStore.setState({ customGameDrivers: [{ ...PILOTE, templateId: 'tpl-neph' }], campaigns: [] } as never);
        const fiche = {
            id: 'tpl-neph', name: 'Nephilim', emoji: '✨',
            sections: [{ id: 'les_vecus', label: 'Vécus', fields: [
                CHAMP,
                { id: 'pastlives_0_degree', label: 'Degré du vécu passé 1', type: 'number', defaultValue: 0, libelleSur: 'pastlives_0_name' },
            ] }],
        };
        const jet = { sens: 'sous-ou-egal' as const, cible: { mecanique: 'nephilim' as const, caracteristique: { id: 'vecu', label: 'Vécu', sectionId: 'les_vecus' } }, reserve: { base: 1, max: 1, faces: 100 } };
        render(<PanneauDeJet descripteur={jet} dice={{ defaultDice: '1d100', logic: 'd100-low', engine: 'standard' }} template={fiche as never}
            valeurs={{ pastlives_0_name: 'Héros', pastlives_0_degree: 4 }} />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'pastlives_0_degree' } });
        const ligne = await screen.findByText(/Ka-élément : Feu/);
        expect(ligne.closest('[data-ligne-du-referentiel]')).toBeTruthy();
        expect(await screen.findByText('Vous avez été un héros fondateur.')).toBeTruthy();
    });
});
