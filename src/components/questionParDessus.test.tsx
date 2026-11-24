import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * **La question de la médiathèque ne démonte plus le formulaire qui l'a ouverte** (24/11/2026, § 1 bis
 * du 20/11). Le magasin des fenêtres n'avait qu'une place : « Supprimer ce média ? », posé depuis la
 * médiathèque ouverte par « Modifier la campagne », remplaçait le formulaire, et ses modifications non
 * enregistrées étaient perdues. La question se pose désormais par-dessus (`gmConfirmParDessus`).
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
// Un formulaire de campagne réduit à sa saisie locale : c'est elle qui se perdait au démontage.
vi.mock('../modules/session/components/CampaignForm', () => ({
    default: function FormulaireDeCampagne() {
        const [nom, setNom] = useState('');
        return <input aria-label="Nom de la campagne" value={nom} onChange={e => setNom(e.target.value)} />;
    },
}));

const { default: ModalProvider } = await import('./ModalProvider');
const { useModalStore, gmCustom, gmConfirmParDessus, gmPromptParDessus } = await import('../stores/useModalStore');

beforeEach(() => {
    useModalStore.getState().closeModal();
    useModalStore.getState().fermerLaQuestion();
});

const ouvrirLeFormulaire = () => {
    act(() => gmCustom('campaign-edit', { id: 'c-1', name: 'Arrakis' }));
    const champ = screen.getByLabelText('Nom de la campagne') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: 'Arrakis, saison 2' } });
    return champ;
};

describe('une question posée par-dessus une fenêtre', () => {
    it('« Supprimer ce média ? » : le formulaire reste ouvert dessous, sa saisie aussi, quelle que soit la réponse', () => {
        render(<ModalProvider />);
        const champ = ouvrirLeFormulaire();
        const supprimer = vi.fn();
        act(() => gmConfirmParDessus('Supprimer ce média ?', supprimer));
        expect(screen.getByText('Supprimer ce média ?')).toBeTruthy();
        expect(useModalStore.getState()).toMatchObject({ type: 'custom', customVariant: 'campaign-edit' });
        fireEvent.click(screen.getByText('common:confirm'));
        expect(supprimer).toHaveBeenCalledOnce();
        expect(screen.queryByText('Supprimer ce média ?')).toBeNull();
        // Le même nœud, pas un formulaire remonté : la saisie non enregistrée est là.
        expect(screen.getByLabelText('Nom de la campagne')).toBe(champ);
        expect(champ.value).toBe('Arrakis, saison 2');

        act(() => gmConfirmParDessus('Supprimer ce dossier ?', vi.fn()));
        fireEvent.click(screen.getByText('common:cancel'));
        expect(champ.value).toBe('Arrakis, saison 2');
        expect(useModalStore.getState().type).toBe('custom');
    });

    it('renommer : la saisie de la question part, celle du formulaire reste', () => {
        render(<ModalProvider />);
        const champ = ouvrirLeFormulaire();
        const renommer = vi.fn();
        act(() => gmPromptParDessus('Nouveau nom :', 'Portraits', renommer));
        const saisie = screen.getByRole('textbox', { name: /Nouveau nom/ }) as HTMLInputElement;
        expect(saisie.value).toBe('Portraits');
        fireEvent.change(saisie, { target: { value: 'Visages' } });
        fireEvent.keyDown(saisie, { key: 'Enter' });
        expect(renommer).toHaveBeenCalledWith('Visages');
        expect(useModalStore.getState().question).toBeNull();
        expect(champ.value).toBe('Arrakis, saison 2');
    });

    it('sans fenêtre ouverte (le Media Hub), la question s’affiche seule', () => {
        render(<ModalProvider />);
        act(() => gmConfirmParDessus('Tout purger ?', vi.fn()));
        expect(screen.getByText('Tout purger ?')).toBeTruthy();
        expect(useModalStore.getState().type).toBeNull();
    });
});
