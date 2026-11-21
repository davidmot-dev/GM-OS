import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

/**
 * **La médiathèque s'ouvrait sous la fenêtre qui l'appelait.** David, 20/11/2026 :
 * « quand j'essaie de modifier l'image de la campagne rien ne se passe ». Elle
 * était au niveau 100, la fenêtre « Modifier la campagne » au niveau 150.
 * L'essai garde l'ordre : fenêtre < médiathèque < questions — les questions
 * (renommer, supprimer) que la médiathèque pose elle-même restent visibles.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../modules/session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

const { NIVEAU_DE_LA_FENETRE, NIVEAU_DE_LA_MEDIATHEQUE, NIVEAU_DES_QUESTIONS, valeurDuNiveau } = await import('./niveauxDesSurcouches');
const { default: ModalProvider } = await import('./ModalProvider');
const { MediaBrowser } = await import('./MediaBrowser');
const { useModalStore, gmConfirm, gmPrompt, gmAlert, gmCustom } = await import('../stores/useModalStore');

beforeEach(() => {
    useModalStore.getState().closeModal();
});

const niveauDe = (el: Element | null) => valeurDuNiveau(el?.className ?? '');

describe('l’ordre des surcouches', () => {
    it('fenêtre < médiathèque < questions', () => {
        expect(valeurDuNiveau(NIVEAU_DE_LA_FENETRE)).toBeLessThan(valeurDuNiveau(NIVEAU_DE_LA_MEDIATHEQUE));
        expect(valeurDuNiveau(NIVEAU_DE_LA_MEDIATHEQUE)).toBeLessThan(valeurDuNiveau(NIVEAU_DES_QUESTIONS));
    });

    it('la médiathèque s’affiche à son niveau, au-dessus des fenêtres', () => {
        render(<MediaBrowser isOpen onClose={() => {}} onSelect={() => {}} allowedTypes={['image']} />);
        const racine = [...document.body.querySelectorAll('div')].find(d => d.classList.contains(NIVEAU_DE_LA_MEDIATHEQUE)) ?? null;
        expect(racine).not.toBeNull();
        expect(niveauDe(racine)).toBeGreaterThan(valeurDuNiveau(NIVEAU_DE_LA_FENETRE));
    });

    it.each([
        ['confirmation', () => gmConfirm('Supprimer ?', () => {})],
        ['saisie', () => gmPrompt('Nom :', 'x', () => {})],
        ['alerte', () => gmAlert('Attention')],
    ])('la %s passe au-dessus de la médiathèque', (_nom, ouvrir) => {
        ouvrir();
        render(<ModalProvider />);
        expect(niveauDe(document.querySelector('[role="dialog"]'))).toBe(valeurDuNiveau(NIVEAU_DES_QUESTIONS));
    });

    it('une fenêtre de ModalProvider reste sous la médiathèque', () => {
        gmCustom('session-select');
        render(<ModalProvider />);
        expect(niveauDe(document.querySelector('[role="dialog"]'))).toBe(valeurDuNiveau(NIVEAU_DE_LA_FENETRE));
    });
});
