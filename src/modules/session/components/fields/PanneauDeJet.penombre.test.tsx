import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const consigner = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';
import type { RessourceDeTable } from '../../../table/RessourcesDeTable';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';

/**
 * **Le jet de Pénombre au panneau** (22/11/2026) : le jet du pilote 2.0.0, sur les exemples du
 * livre (pages imprimées = PDF). Le pilote forgé rendait des dés vides et un total `NaN`.
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    seuil: [
        { id: 'harmonique', label: 'Harmonique', sectionId: 'harmoniques' },
        { id: 'atout', label: 'Atout', sectionId: 'atouts', facultative: true },
    ],
    reserve: { base: 1, max: 1, faces: 20 },
    penombre: {
        harmoniques: { ame: 'ame', esprit: 'esprit', etincelle: 'etincelle', nature: 'nature', nuit: 'nuit' },
        composanteHarmonique: 'harmonique', composanteAtout: 'atout',
        atouts: [{ niveau: 'atout1_niveau', libelle: 'atout1' }, { niveau: 'atout2_niveau', libelle: 'atout2' }],
        cle: 'cle',
        conscience: { restants: 'conscience', actifs: 'jetons_actifs', max: 'conscience_max' },
        timbre: 'timbre',
        partition: { cle: 'partition_cle', notes: ['partition_note1', 'partition_note2', 'partition_note3', 'partition_note4'] },
        reserveCollegiale: 'reserve_collegiale', tailleCollegiale: 'taille_reserve_collegiale',
    },
};
const DICE = { defaultDice: '1d20', logic: 'count-success', engine: 'pool' } as unknown as DiceConfig;
const DES = ['D4', 'D6', 'D8', 'D10', 'D12'];
const FICHE = {
    id: 'tpl-penombre', name: 'Pénombre', emoji: '🎭',
    sections: [
        { id: 'personnage', label: 'Personnage', fields: [{ id: 'cle', label: 'Clé', type: 'text', defaultValue: '' }] },
        { id: 'harmoniques', label: 'Harmoniques', fields: ['ame', 'esprit', 'etincelle', 'nature', 'nuit'].map(id => ({ id, label: id, type: 'select', options: DES, defaultValue: '' })) },
        { id: 'atouts', label: 'Atouts', fields: [
            { id: 'atout1', label: 'Atout 1', type: 'text', defaultValue: '' },
            { id: 'atout1_niveau', label: 'Niveau de l’atout 1', type: 'number', defaultValue: 0, libelleSur: 'atout1' },
            { id: 'atout2', label: 'Atout 2', type: 'text', defaultValue: '' },
            { id: 'atout2_niveau', label: 'Niveau de l’atout 2', type: 'number', defaultValue: 0, libelleSur: 'atout2' },
        ] },
        { id: 'conscience', label: 'Conscience', fields: [
            { id: 'conscience_max', label: 'Conscience', type: 'number', defaultValue: 7 },
            { id: 'conscience', label: 'Jetons restants', type: 'number', defaultValue: 7 },
            { id: 'jetons_actifs', label: 'Jetons actifs', type: 'number', defaultValue: 7 },
        ] },
    ],
} as unknown as SheetTemplate;
const LANCINE = {
    cle: 'âme', ame: 'D8', esprit: 'D12', etincelle: 'D10', nature: 'D6', nuit: 'D4',
    atout1: 'N’aie pas peur', atout1_niveau: 2, atout2: 'Mémoire des textes', atout2_niveau: 3,
    conscience_max: 7, conscience: 7, jetons_actifs: 7, timbre: 'Harmonieux',
    partition_cle: false, partition_note1: false, partition_note2: false, partition_note3: false, partition_note4: false,
};

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigner.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown> = LANCINE, harmonique = 'ame', atout?: string) => {
    const ecrire = vi.fn();
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} />).container;
    const [h, a] = screen.getAllByRole('combobox');
    fireEvent.change(h, { target: { value: harmonique } });
    if (atout) fireEvent.change(a, { target: { value: atout } });
    return { panneau, ecrire };
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('le jet de Pénombre au panneau', () => {
    it('Charlie : D8 d’âme et l’atout de niveau 2, 7, 4 et 5 font 3 succès (p. 31-32)', () => {
        const { panneau } = monter(LANCINE, 'ame', 'atout1_niveau');
        expect(panneau.querySelector('[data-composition-penombre]')!.textContent).toContain('1D8 + 2D6');
        faces(7, 4, 5);
        lancer();
        expect(de.mock.calls.map((c: unknown[]) => c[0])).toEqual([8, 6, 6]);
        expect(screen.getAllByText(/Réussite — 3 succès pour une difficulté de 1/).length).toBeGreaterThan(0);
        expect((consigner.mock.calls[0][0] as { titre: string; tagSuccess: boolean })).toMatchObject({ titre: 'Âme D8 + N’aie pas peur 2', tagSuccess: true });
    });

    it('le D20 merveilleux se paie sur la conscience ; un 1 puis, relancé, un 20 (p. 35-36)', () => {
        const { panneau, ecrire } = monter(LANCINE, 'esprit', 'atout1_niveau');
        fireEvent.click(screen.getByLabelText('Tenter des merveilles'));
        expect(panneau.querySelector('[data-composition-penombre]')!.textContent).toContain('1D20 + 2D6');
        faces(1, 4, 5);
        lancer();
        expect(ecrire).toHaveBeenCalledWith({ conscience: 7, jetons_actifs: 6, conscience_max: 7 });
        expect(panneau.querySelector('[data-incident-penombre]')).toBeTruthy();
        // La relance du D20 seul, pour 1 jeton : 20 et 2, 7 succès ; l'incident reste acquis (p. 34).
        fireEvent.click(panneau.querySelector('[data-relance-penombre] input')!);
        faces(20);
        fireEvent.click(screen.getByText(/Relancer \(1 jeton/));
        expect(screen.getAllByText(/Réussite — 7 succès/).length).toBeGreaterThan(0);
        expect(panneau.querySelector('[data-incident-penombre]')).toBeTruthy();
        // Esprit n'est pas la clé de Lancine (âme) : une case « note » (p. 36).
        fireEvent.click(screen.getByText('Cocher la partition'));
        expect(ecrire).toHaveBeenCalledWith(expect.objectContaining({ partition_note1: true, partition_cle: false, timbre: 'Harmonieux' }));
        expect(screen.getByText('Partition mise à jour')).toBeTruthy();
    });

    it('succès insuffisants : la prolongation coûte les succès manquants et fixe la difficulté suivante (p. 33)', () => {
        const { ecrire } = monter(LANCINE, 'ame');
        fireEvent.change(screen.getByLabelText('Difficulté'), { target: { value: '4' } });
        faces(7);
        lancer();
        expect(screen.getAllByText(/3 succès manquants/).length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText(/Prolongation \(−3 jetons conscience\)/));
        expect(ecrire).toHaveBeenCalledWith({ conscience: 4, jetons_actifs: 4, conscience_max: 7 });
        expect((screen.getByLabelText('Difficulté') as HTMLSelectElement).value).toBe('3');
    });

    it('une réussite mitigée paie les succès manquants en jetons (p. 32)', () => {
        const { ecrire } = monter(LANCINE, 'ame');
        fireEvent.change(screen.getByLabelText('Difficulté'), { target: { value: '2' } });
        faces(5);
        lancer();
        fireEvent.click(screen.getByText(/Réussite mitigée \(1 jeton/));
        expect(ecrire).toHaveBeenCalledWith({ conscience: 7, jetons_actifs: 6, conscience_max: 7 });
        expect(screen.getAllByText(/Réussite mitigée — 1 succès/).length).toBeGreaterThan(0);
    });

    it('une fausse note fait perdre 1 jeton, les inactifs d’abord (p. 24, 34)', () => {
        const { ecrire } = monter({ ...LANCINE, jetons_actifs: 5 }, 'nuit', 'atout1_niveau');
        faces(1, 4, 5);
        lancer();
        fireEvent.click(screen.getByText('Perdre 1 jeton'));
        expect(ecrire).toHaveBeenCalledWith({ conscience: 6, jetons_actifs: 5, conscience_max: 7 });
        expect(screen.getByText('Jeton perdu')).toBeTruthy();
    });

    it('l’envolée réactive un jeton dépensé (p. 34)', () => {
        const { ecrire } = monter({ ...LANCINE, jetons_actifs: 5 }, 'nuit');
        faces(4);
        lancer();
        fireEvent.click(screen.getByText('Réactiver 1 jeton conscience'));
        expect(ecrire).toHaveBeenCalledWith({ conscience: 7, jetons_actifs: 6, conscience_max: 7 });
    });

    it('troublée, elle ne paie plus : le D20 bloque le lancer (p. 25)', () => {
        monter({ ...LANCINE, jetons_actifs: 0 }, 'ame');
        fireEvent.click(screen.getByLabelText('Tenter des merveilles'));
        expect((screen.getByText('Lancer', { exact: true }) as HTMLButtonElement).disabled).toBe(true);
    });
});

/** Le recompte de la réserve collégiale chez le meneur (22/11/2026, p. 24, 102). */
describe('la réserve collégiale de Pénombre se recompte', () => {
    const RESSOURCES: RessourceDeTable[] = [
        { id: 'reserve_collegiale', label: 'Réserve collégiale', proprietaire: 'joueurs', depart: 10, min: 0, max: 10, maxSur: 'taille_reserve_collegiale' },
        { id: 'taille_reserve_collegiale', label: 'Taille de la réserve collégiale', proprietaire: 'joueurs', depart: 10, min: 0, max: 10, horsDuBandeau: true },
    ];
    const initialSession = useSessionOSStore.getState();
    const groupe = (timbreDElegie: string) => useSessionOSStore.setState({
        players: [{ id: 'j', realName: 'Table', avatarUrl: '', isOnline: false, characters: [
            { id: 'lancine', name: 'Lancine', portraitUrl: '', campaignId: 'c-pen', sheetData: { timbre: 'Harmonieux' } },
            { id: 'elegie', name: 'Élégie', portraitUrl: '', campaignId: 'c-pen', sheetData: { timbre: timbreDElegie } },
            { id: 'ailleurs', name: 'Autre', portraitUrl: '', campaignId: 'autre', sheetData: { timbre: 'Dissonant' } },
        ] }],
    } as never);
    const valeur = (id: string) => useRessourcesDeTableStore.getState().valeur('c-pen', RESSOURCES, id);
    const monterAuMeneur = (valeurs: Record<string, unknown>, harmonique: string) => {
        const ecrire = vi.fn();
        render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire}
            campaignId="c-pen" ressourcesDeTable={RESSOURCES} personnageId="lancine" />);
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: harmonique } });
        return ecrire;
    };
    beforeEach(() => useRessourcesDeTableStore.setState({ reserves: {} }));
    afterEach(() => useSessionOSStore.setState(initialSession, true));

    it('Élégie est fausse : le bouton ramène la réserve à 5, les jetons dépensés restent dépensés', () => {
        groupe('Faux');
        useRessourcesDeTableStore.setState({ reserves: { 'c-pen': { reserve_collegiale: 8, taille_reserve_collegiale: 10 } } });
        monterAuMeneur(LANCINE, 'ame');
        expect(screen.getByText(/les timbres du groupe en demandent 5/)).toBeTruthy();
        fireEvent.click(screen.getByText('Recompter la réserve collégiale'));
        expect(valeur('taille_reserve_collegiale')).toBe(5);
        expect(valeur('reserve_collegiale')).toBe(3);
        expect(screen.getByText(/conforme aux timbres du groupe/)).toBeTruthy();
    });

    it('Élégie redevient harmonieuse : la réserve remonte à 10', () => {
        groupe('Harmonieux');
        useRessourcesDeTableStore.setState({ reserves: { 'c-pen': { reserve_collegiale: 2, taille_reserve_collegiale: 5 } } });
        monterAuMeneur(LANCINE, 'ame');
        fireEvent.click(screen.getByText('Recompter la réserve collégiale'));
        expect(valeur('taille_reserve_collegiale')).toBe(10);
        expect(valeur('reserve_collegiale')).toBe(7);
    });

    it('une merveille qui rend Lancine fausse recompte d’elle-même (p. 36, 102)', () => {
        groupe('Harmonieux');
        const toutesNotes = { ...LANCINE, partition_note1: true, partition_note2: true, partition_note3: true, partition_note4: true };
        const ecrire = monterAuMeneur(toutesNotes, 'esprit');
        fireEvent.click(screen.getByLabelText('Tenter des merveilles'));
        faces(20);
        lancer();
        fireEvent.click(screen.getByText('Cocher la partition'));
        expect(ecrire).toHaveBeenCalledWith(expect.objectContaining({ timbre: 'Faux' }));
        expect(valeur('taille_reserve_collegiale')).toBe(5);
        // Le D20 s'est payé sur la conscience : la réserve était pleine, elle perd l'écart de taille.
        expect(valeur('reserve_collegiale')).toBe(5);
    });
});
