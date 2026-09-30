import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * **Le pupitre n'avait pas de bouton pour lancer.**
 *
 * Signalé par David le 2026-08-30, **une heure après** avoir signalé le même
 * oubli un cran plus haut : les dés échelonnés étaient absents de la liste des
 * moteurs reconnus, puis absents de la liste des modes qui reçoivent un bouton
 * « Lancer ». Les autres affichent la grille des faces — d4, d6, d20 — et c'est
 * le clic sur une face qui lance. Un mode oublié y proposait donc de choisir un
 * nombre de faces que son moteur ignore, **et n'offrait aucun moyen de lancer**.
 *
 * *Une liste de noms recopiée à la main dérive le jour où un nom s'ajoute.*
 * Deux listes, deux oublis, le même jour. Ce test rend le troisième visible
 * avant qu'il ne coûte une séance.
 */

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (cle: string) => cle, i18n: { language: 'fr' } }),
    initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

/* Le ducking referme un cycle d'imports dès qu'un test entre par le magasin de
   session ; il n'a rien à voir avec le choix d'un bouton. */
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: DiceBoard } = await import('./DiceBoard');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { useDiceStore } = await import('../../stores/useDiceStore');

/*
  On passe par le **sélecteur de mode** plutôt que par un pilote monté à la
  main : le pupitre choisit le sien depuis la campagne ouverte, et reconstituer
  cette chaîne dans un test ferait porter l'échec à la plomberie plutôt qu'au
  sujet. Le sélecteur mène au même endroit — c'est `mode` qui décide du bouton —
  et il est de toute façon le chemin qu'emprunte un meneur sans campagne Blade
  Runner ouverte.
*/
const choisirLeMode = (mode: string) => {
    render(<DiceBoard />);
    fireEvent.change(screen.getByLabelText('dice.inputs.mode'), { target: { value: mode } });
};

beforeEach(() => {
    useSessionOSStore.setState({ activeCampaignId: null } as never);
    /* Le dernier jet s'affiche avec ses faces (« d6 ») : il fausserait la recherche des boutons. */
    useDiceStore.getState().clearHistory();
});

describe('le bouton de lancer', () => {
    /**
     * Les faces d'un jet échelonné viennent des lettres saisies, jamais d'une
     * grille : ce mode doit donc recevoir le bouton, comme `yze`.
     */
    it('existe en mode dés échelonnés', () => {
        choisirLeMode('yze-echelonne');
        expect(screen.queryByText('dice.actions.roll')).not.toBe(null);
    });

    it('existe aussi en Year Zero à réserve', () => {
        choisirLeMode('yze');
        expect(screen.queryByText('dice.actions.roll')).not.toBe(null);
    });

    /**
     * ⭐ **Un seul geste pour tous les modes** (phase 4, L1, étape 2,
     * 2026-09-30). David : *« comment se fait-il que parfois j'ai un bouton
     * pour lancer les dés et parfois non ? »* — les modes à faces lançaient au
     * clic sur un dé. Ils ont désormais le bouton, eux aussi.
     */
    it('existe aussi sur un mode ordinaire', () => {
        choisirLeMode('standard');
        expect(screen.queryByText('dice.actions.roll')).not.toBe(null);
    });

    /**
     * Et les faces **choisissent** le dé, elles ne lancent plus : un clic sur
     * d6 ne doit rien ajouter à l'historique, et « Lancer » doit lancer ce d6.
     */
    it('lance le dé choisi, et le choix seul ne lance rien', () => {
        choisirLeMode('standard');
        fireEvent.click(screen.getByText('d6'));
        expect(useDiceStore.getState().history).toHaveLength(0);

        fireEvent.click(screen.getByText('dice.actions.roll'));
        const jet = useDiceStore.getState().history[0];
        expect(jet.rolls).toHaveLength(1);
        expect(jet.rolls[0].sides).toBe(6);
    });

    /** L'envers : un mode dont le dé est décidé n'offre pas la rangée. */
    it("n'offre pas les faces quand le dé est décidé", () => {
        choisirLeMode('yze-echelonne');
        expect(screen.queryByText('d6')).toBe(null);
    });
});
