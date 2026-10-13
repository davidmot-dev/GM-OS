import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';
import type { Campaign } from '../../../types/campaign.types';

/*
  L'hôte des fiches charge une iframe de sept mégaoctets et ouvre un pont : on
  le remplace par ce qu'il reçoit, pour vérifier que la vue lui passe le groupe
  de la campagne — et rien d'un personnage.
*/
const recu = vi.hoisted(() => ({ props: null as null | { personnage: { id: string; name: string; ficheId?: string } } }));
vi.mock('../../fiches/FicheHote', () => ({
    default: (props: { personnage: { id: string; name: string; ficheId?: string } }) => {
        recu.props = props;
        return <div data-testid="hote">{props.personnage.name}</div>;
    },
}));
// La table se lit sur le disque par le pont Electron : absente ici, la vue doit tenir.
vi.mock('../../fiches/useCorrespondanceDuGroupe', () => ({ useCorrespondanceDuGroupe: () => null }));

import FicheDuGroupe from './FicheDuGroupe';

const initial = useSessionOSStore.getState();

const NOC = {
    id: 'noc', name: 'NOC', templateId: 'noc-reference',
    ficheDeGroupe: { libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale' },
} as GameDriver;

const campagne = (extra: Partial<Campaign> = {}): Campaign => ({
    id: 'c-1', name: 'Test NOC', system: 'noc', activeLocationIds: [], ...extra,
} as Campaign);

beforeEach(() => {
    recu.props = null;
    useSessionOSStore.setState({ activeCampaignId: 'c-1', customGameDrivers: [NOC], campaigns: [campagne()] });
});

afterEach(() => {
    cleanup();
    useSessionOSStore.setState(initial, true);
});

describe('la fiche du groupe', () => {
    it('ouvre la Cabale de la campagne, sous le mot du jeu tant qu’elle n’a pas de nom', () => {
        render(<FicheDuGroupe />);
        expect(screen.getByRole('heading', { name: 'Cabale' })).toBeTruthy();
        expect(recu.props?.personnage.id).toBe('groupe:c-1');
        expect(screen.getByText(/commune à toute la table · Test NOC/)).toBeTruthy();
    });

    it('rend à l’hôte la fiche déjà liée', () => {
        useSessionOSStore.setState({ campaigns: [campagne({ groupe: { ficheId: 'f-7', sheetData: {} } })] });
        render(<FicheDuGroupe />);
        expect(recu.props?.personnage.ficheId).toBe('f-7');
    });

    it('un jeu sans fiche de groupe le dit, plutôt qu’un écran vide', () => {
        useSessionOSStore.setState({ customGameDrivers: [{ ...NOC, ficheDeGroupe: undefined }] });
        render(<FicheDuGroupe />);
        expect(screen.getByText(/n'a pas de fiche de groupe/)).toBeTruthy();
        expect(screen.queryByTestId('hote')).toBeNull();
    });
});
