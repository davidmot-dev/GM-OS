// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import { useModulesDuJeuJoueur } from '../../modules/modulesDuJeu/magasins';
import { HubModulesDuJeu } from './HubModulesDuJeu';
const { montages, demontages } = vi.hoisted(() => ({ montages: vi.fn(), demontages: vi.fn() }));
vi.mock('../../modules/session/useSessionOSStore', () => ({ useSessionOSStore: (select: (v: unknown) => unknown) => select({ activeCampaignId: 'camp' }) }));
vi.mock('../../stores/useClientStore', () => ({ useClientStore: (select: (v: unknown) => unknown) => select({ characterId: 'bob' }) }));
vi.mock('./HubConsultation', () => ({ HubConsultation: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('../../modules/modulesDuJeu/vuesDuRegistre', () => ({ VueDeModule: () => {
    useEffect(() => { montages(); return () => { demontages(); }; }, []);
    return <p>Instrument ouvert</p>;
} }));
const carte = { id: 'alien-detecteur', libelle: 'Détecteur', revision: 1, ouverture: 2, vue: {} };
const initiale = { campagneId: 'camp', personnageId: 'bob', contexte: 2, revision: 1, modules: [carte] };
afterEach(() => { cleanup(); useModulesDuJeuJoueur.setState({ vue: null }); vi.clearAllMocks(); });
describe('continuité d’un instrument autorisé', () => {
    it('modifier les droits d’un autre PJ ou outil ne démonte pas son instrument', () => {
        useModulesDuJeuJoueur.setState({ vue: initiale });
        const ecran = render(<HubModulesDuJeu />);
        fireEvent.click(ecran.getByRole('button', { name: 'Ouvrir Détecteur' }));
        act(() => useModulesDuJeuJoueur.setState({ vue: { ...initiale, contexte: 3, revision: 2 } }));
        expect(ecran.getByText('Instrument ouvert')).toBeTruthy(); expect(montages).toHaveBeenCalledTimes(1); expect(demontages).not.toHaveBeenCalled();
    });
    it('une nouvelle ouverture du même module exige un clic et ne reprend aucun effet local', () => {
        useModulesDuJeuJoueur.setState({ vue: initiale });
        const ecran = render(<HubModulesDuJeu />);
        fireEvent.click(ecran.getByRole('button', { name: 'Ouvrir Détecteur' }));
        // Même si React regroupe retrait et réouverture, le nouveau droit a sa propre clé.
        act(() => useModulesDuJeuJoueur.setState({ vue: { ...initiale, contexte: 4, revision: 3, modules: [{ ...carte, ouverture: 4 }] } }));
        expect(ecran.queryByText('Instrument ouvert')).toBeNull(); expect(demontages).toHaveBeenCalledTimes(1);
        fireEvent.click(ecran.getByRole('button', { name: 'Ouvrir Détecteur' })); expect(montages).toHaveBeenCalledTimes(2);
        act(() => useModulesDuJeuJoueur.setState({ vue: null })); expect(demontages).toHaveBeenCalledTimes(2);
    });
});
