import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * **Le bouton Annuler n'annulait pas.**
 *
 * Signalé par David le 2026-08-30 sur la suppression d'une atmosphère de
 * Music-OS. `ModalProvider` câblait `onClick={onCancel || closeModal}` : dès
 * qu'un appelant fournissait un rappel d'annulation, la fermeture n'avait plus
 * lieu, et la boîte restait à l'écran.
 *
 * Le défaut était **général**, pas propre à Music-OS — un seul des trois
 * appelants concernés s'en sortait, et par accident : son `onCancel` ouvrait
 * lui-même une autre boîte. D'où le troisième test, qui garde l'ordre des deux
 * gestes.
 *
 * L'état de la boîte est posé **avant** le rendu : le changer après oblige à
 * passer par `act`, et un test qui se bat contre l'ordonnanceur de React finit
 * par mesurer l'ordonnanceur plutôt que le composant.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

const { default: ModalProvider } = await import('./ModalProvider');
const { useModalStore, gmConfirm, gmPrompt } = await import('../stores/useModalStore');

beforeEach(() => {
    useModalStore.getState().closeModal();
});

const laBoiteEstOuverte = () => useModalStore.getState().type !== null;

describe('le bouton Annuler d’une confirmation', () => {
    /** Le cas exact de David : `onCancel` ne fait rien, et ne fermait rien. */
    it('ferme la boîte même quand le rappel d’annulation ne fait rien', () => {
        const supprimer = vi.fn();
        gmConfirm('Supprimer "Onirique" ?', supprimer, () => {}, 'Supprimer', 'Annuler');
        render(<ModalProvider />);

        fireEvent.click(screen.getByText('Annuler'));

        expect(laBoiteEstOuverte()).toBe(false);
        expect(supprimer).not.toHaveBeenCalled();
    });

    it('exécute quand même le rappel d’annulation', () => {
        const abandonner = vi.fn();
        gmConfirm('Reprendre ?', () => {}, abandonner, 'Laisser finir', 'Abandonner');
        render(<ModalProvider />);

        fireEvent.click(screen.getByText('Abandonner'));

        expect(abandonner).toHaveBeenCalledTimes(1);
        expect(laBoiteEstOuverte()).toBe(false);
    });

    /**
     * **L'ordre n'est pas indifférent.** Le choix de la source d'une musique
     * ouvre une saisie depuis son `onCancel` : fermer *après* le rappel
     * effacerait la boîte à peine ouverte, et le meneur ne verrait rien.
     */
    it('laisse le rappel ouvrir une autre boîte sans l’effacer', () => {
        gmConfirm(
            'Source de la musique :',
            () => {},
            () => gmPrompt('Lien externe :', '', () => {}),
            'Fichier Local',
            'Lien Externe',
        );
        render(<ModalProvider />);

        fireEvent.click(screen.getByText('Lien Externe'));

        expect(useModalStore.getState().type).toBe('prompt');
    });

    it('ferme aussi quand aucun rappel d’annulation n’est fourni', () => {
        gmConfirm('Effacer ?', () => {});
        render(<ModalProvider />);

        fireEvent.click(screen.getByText('common:cancel'));

        expect(laBoiteEstOuverte()).toBe(false);
    });
});
