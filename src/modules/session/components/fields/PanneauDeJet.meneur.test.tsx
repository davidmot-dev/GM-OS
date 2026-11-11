import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useJetsCachesStore } from '../../../dice/jetsCaches';
import { useDiceStore } from '../../../../stores/useDiceStore';
import { useJournalStore } from '../../../journal/useJournalStore';
import { estUnJetCache } from '../../../journal/consignerLeJet';
import { useSessionOSStore } from '../../useSessionOSStore';
import { demandesOuvertes } from '../../../dice/filDesDemandes';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Les commandes du meneur dans « Lancer un test »** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T7 (C7 à C9) ; maquette Stitch adoptée
 * le 11/11. « Jet caché » garde le résultat chez le meneur ; « Demander à
 * (personnage) » envoie la composition à sa tablette ; la liste dit où en sont
 * ses demandes. Rien de cela n'existe sur la tablette.
 */
const DICE_D20 = { defaultDice: '1d20', logic: 'count-success', engine: 'standard' } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl', name: 'Essai', emoji: '🎲',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'precision', label: 'Précision', type: 'number', defaultValue: 0 },
            { id: 'vigilance', label: 'Vigilance', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
const SOUS_UN_SEUIL: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }],
    reserve: { base: 1, max: 1, faces: 20 },
    modificateurDuSeuil: { min: -5, max: 5, defaut: 0 },
};

/*
  Le même seuil au d100 : la tablette le lance elle-même (« Lancer un test »).
  Au d20 « sous ou égal », c'est une Sauvegarde pour elle (`estUneSauvegarde`) :
  le meneur demande alors une Sauvegarde, que la tablette sait ouvrir (T8).
*/
const DICE_D100 = { defaultDice: '1d100', logic: 'count-success', engine: 'standard' } as unknown as DiceConfig;
const EN_POURCENTAGE: DescripteurDeJet = { ...SOUS_UN_SEUIL, reserve: { base: 1, max: 1, faces: 100 } };

const panneauDuMeneur = (descripteur = EN_POURCENTAGE, dice = DICE_D100) => render(<PanneauDeJet descripteur={descripteur} dice={dice} template={FICHE}
    valeurs={{ precision: 12, vigilance: 14 }} personnageId="pj-wilson" nomDuPersonnage="Wilson" />);
const choisirVigilance = () => fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'vigilance' } });
const evenementsDeDes = () => {
    const j = useJournalStore.getState();
    return (j.journals.find(x => x.id === j.activeJournalId)?.events ?? []).filter(e => e.type === 'DICE');
};

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    de = vi.spyOn(DiceEngine, 'roll').mockImplementation(() => 7);
    useJetsCachesStore.getState().vider();
    useDiceStore.setState({ lastRoll: null, history: [] });
    useSessionOSStore.setState({ messages: [] });
    useJournalStore.setState({ journals: [], activeJournalId: null, isRecording: false });
    useJournalStore.getState().startJournal({ nom: 'Campagne de test' }, 'Séance de test');
});
afterEach(() => { cleanup(); de.mockRestore(); });

describe('le jet caché, depuis la fiche du meneur', () => {
    it('va au journal marqué et au pupitre, jamais au dernier jet (C7, C8)', () => {
        panneauDuMeneur();
        choisirVigilance();
        fireEvent.click(screen.getByRole('switch', { name: /Jet caché/ }));
        fireEvent.click(screen.getByRole('button', { name: /Lancer en caché/ }));

        expect(useJetsCachesStore.getState().jets).toHaveLength(1);
        // Le titre est celui que le panneau consignait déjà : la composante.
        expect(useJetsCachesStore.getState().jets[0].titre).toBe('Attribut');
        const [e] = evenementsDeDes();
        expect(estUnJetCache(e)).toBe(true);
        expect(useDiceStore.getState().lastRoll).toBeNull();
    });

    it('éteint, le jet se consigne comme avant, sans marque', () => {
        panneauDuMeneur();
        choisirVigilance();
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(useJetsCachesStore.getState().jets).toHaveLength(0);
        expect(estUnJetCache(evenementsDeDes()[0])).toBe(false);
    });
});

describe('« Demander à Wilson »', () => {
    it('envoie la composition du panneau à la tablette du personnage', () => {
        panneauDuMeneur();
        choisirVigilance();
        fireEvent.click(screen.getByRole('button', { name: /Demander à Wilson/ }));

        const [demande] = demandesOuvertes(useSessionOSStore.getState().messages, 'pj-wilson');
        expect(demande.genre).toBe('test');
        expect(demande.genre === 'test' && demande.composition.champs).toEqual({ attribut: 'vigilance' });
        expect(demande.titre).toContain('Vigilance');
        // Aucun dé n'a roulé chez le meneur : c'est le joueur qui lance.
        expect(de).not.toHaveBeenCalled();
    });

    it('la demande paraît en attente, et « Annuler » la clôt', () => {
        panneauDuMeneur();
        choisirVigilance();
        fireEvent.click(screen.getByRole('button', { name: /Demander à Wilson/ }));
        const liste = screen.getByRole('region', { name: 'Demandes en cours' });
        expect(within(liste).getByText(/en attente/)).toBeTruthy();

        fireEvent.click(within(liste).getByRole('button', { name: /Annuler/ }));
        expect(demandesOuvertes(useSessionOSStore.getState().messages, 'pj-wilson')).toHaveLength(0);
        expect(within(screen.getByRole('region', { name: 'Demandes en cours' })).getByText(/annulée/)).toBeTruthy();
    });

    it('ne se demande pas en caché : le joueur verrait son propre résultat', () => {
        panneauDuMeneur();
        choisirVigilance();
        fireEvent.click(screen.getByRole('switch', { name: /Jet caché/ }));
        expect((screen.getByRole('button', { name: /Demander à Wilson/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('pour un jeu à Sauvegarde, demande la Sauvegarde que la tablette sait ouvrir', () => {
        panneauDuMeneur(SOUS_UN_SEUIL, DICE_D20);
        choisirVigilance();
        fireEvent.click(screen.getByRole('button', { name: /Demander à Wilson/ }));
        const [demande] = demandesOuvertes(useSessionOSStore.getState().messages, 'pj-wilson');
        expect(demande).toMatchObject({ genre: 'sauvegarde', champ: 'vigilance' });
        expect(demande.titre).toBe('Sauvegarde de Vigilance');
    });

    it('ne se demande pas un jet incomplet', () => {
        panneauDuMeneur();
        expect((screen.getByRole('button', { name: /Demander à Wilson/ }) as HTMLButtonElement).disabled).toBe(true);
    });
});

describe('sur la tablette', () => {
    it('ni « Jet caché », ni « Demander à », ni liste des demandes', () => {
        render(<PanneauDeJet descripteur={SOUS_UN_SEUIL} dice={DICE_D20} template={FICHE}
            valeurs={{ vigilance: 14 }} personnageId="pj-wilson" nomDuPersonnage="Wilson" pourLesJoueurs />);
        expect(screen.queryByRole('switch', { name: /Jet caché/ })).toBeNull();
        expect(screen.queryByRole('button', { name: /Demander à/ })).toBeNull();
        expect(screen.queryByRole('region', { name: 'Demandes en cours' })).toBeNull();
    });
});
