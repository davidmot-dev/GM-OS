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

describe('les Vécus des époques incarnées', () => {
    /* Son propre index : la lecture est gardée par adresse, d'un essai à l'autre. */
    const SELON = { ...CHAMP, referentiel: 'vecus-incarnes/index.json', referentielSelon: { detail: 'Époque', champs: ['incarnations_0_era', 'incarnations_1_era'], libelle: 'incarnations' } };
    const INDEX_EPOQUES = { referentiel: 'Vécus passés', entrees: [
        { nom: 'Héros', fichier: '00-atlantide.md', details: { Époque: "La Chute de l'Atlantide" } },
        { nom: 'Mercenaire', fichier: '10-carthage.md', details: { Époque: "L'empire de Carthage" } },
    ] };
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async (adresse: string) => (adresse.endsWith('index.json')
            ? { ok: true, text: async () => JSON.stringify(INDEX_EPOQUES) }
            : { ok: true, text: async () => '## Héros — Ka-Feu\n\nUn héros.\n' })));
    });

    it('la saisie ne propose que les Vécus des époques incarnées, et le dit', async () => {
        const { container } = render(<ChampDuReferentiel field={SELON} value="" onChange={vi.fn()} pilote={PILOTE}
            valeurs={{ incarnations_0_era: 'La Chute de l’Atlantide', incarnations_1_era: '' }} />);
        await vi.waitFor(() => expect([...container.querySelectorAll('datalist option')].map(o => o.getAttribute('value'))).toEqual(['Héros']));
        expect(screen.getByText('1 vécus passés proposés — incarnations : La Chute de l’Atlantide.')).toBeTruthy();
    });

    it('un Vécu hors des incarnations le signale dans ⓘ', async () => {
        render(<ChampDuReferentiel field={SELON} value="Héros" onChange={vi.fn()} pilote={PILOTE}
            valeurs={{ incarnations_0_era: "L'empire de Carthage" }} />);
        fireEvent.click(await screen.findByLabelText(/Ce que dit le corpus/));
        expect(screen.getByText("Époque « La Chute de l'Atlantide » : absente des incarnations de la fiche.")).toBeTruthy();
    });

    /* Le lien visible entre une époque et ses Vécus (2026-10-18). */
    const INCARNATIONS = [
        { id: 'incarnations_0_era', label: 'Incarnation 1 — dates et lieux', type: 'text' as const, defaultValue: '', referentiel: 'vecus/epoques.json' },
        { id: 'incarnations_1_era', label: 'Incarnation 2 — dates et lieux', type: 'text' as const, defaultValue: '', referentiel: 'vecus/epoques.json' },
    ];
    const CHAMPS_DE_LA_FICHE = [
        ...INCARNATIONS, SELON,
        { id: 'pastlives_0_degree', label: 'Degré du vécu passé 1', type: 'number' as const, defaultValue: 0, libelleSur: 'pastlives_0_name' },
        { ...SELON, id: 'pastlives_1_name', label: 'Vécu passé 2' },
    ];

    it('un Vécu porte l’incarnation dont il vient', async () => {
        render(<ChampDuReferentiel field={SELON} value="Héros" onChange={vi.fn()} pilote={PILOTE} champsDeLaFiche={CHAMPS_DE_LA_FICHE}
            valeurs={{ incarnations_0_era: "L'empire de Carthage", incarnations_1_era: 'La Chute de l’Atlantide' }} />);
        const etiquette = await screen.findByText(/↳ Incarnation 2/);
        expect(etiquette.textContent).toBe('↳ Incarnation 2 — La Chute de l’Atlantide');
    });

    it('un Vécu dont l’époque n’est pas incarnée le dit sous le champ', async () => {
        const { container } = render(<ChampDuReferentiel field={SELON} value="Héros" onChange={vi.fn()} pilote={PILOTE} champsDeLaFiche={CHAMPS_DE_LA_FICHE}
            valeurs={{ incarnations_0_era: "L'empire de Carthage" }} />);
        await vi.waitFor(() => expect(container.querySelector('[data-origine-du-vecu]')?.textContent)
            .toBe("Époque « La Chute de l'Atlantide » : absente des incarnations."));
    });

    it('une incarnation montre les Vécus de la fiche qui en viennent, et eux seuls', async () => {
        render(<ChampDuReferentiel field={INCARNATIONS[0]} value="L'empire de Carthage" onChange={vi.fn()} pilote={PILOTE} champsDeLaFiche={CHAMPS_DE_LA_FICHE}
            valeurs={{ incarnations_0_era: "L'empire de Carthage", pastlives_0_name: 'Héros', pastlives_0_degree: 4, pastlives_1_name: 'Mercenaire' }} />);
        const ligne = (await screen.findByText(/Vécus de cette incarnation/)).closest('[data-vecus-de-l-incarnation]') as HTMLElement;
        expect(ligne.textContent).toBe('Vécus de cette incarnation : Mercenaire');
    });

    it('le Vécu d’une incarnation porte son degré', async () => {
        render(<ChampDuReferentiel field={INCARNATIONS[1]} value="La Chute de l'Atlantide" onChange={vi.fn()} pilote={PILOTE} champsDeLaFiche={CHAMPS_DE_LA_FICHE}
            valeurs={{ pastlives_0_name: 'Héros', pastlives_0_degree: 4 }} />);
        expect(await screen.findByText(/Vécus de cette incarnation :/)).toBeTruthy();
        expect(screen.getByText('Héros (4)')).toBeTruthy();
    });

    it('une incarnation sans Vécu le dit', async () => {
        render(<ChampDuReferentiel field={INCARNATIONS[0]} value="L'empire de Carthage" onChange={vi.fn()} pilote={PILOTE} champsDeLaFiche={CHAMPS_DE_LA_FICHE}
            valeurs={{ pastlives_0_name: 'Héros' }} />);
        expect(await screen.findByText('Aucun Vécu de la fiche ne vient encore de cette époque.')).toBeTruthy();
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
