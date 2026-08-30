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
     * L'envers du garde-fou : un mode qui a bel et bien une face à choisir doit
     * garder sa grille. Sans ce test, ranger tous les modes dans la liste
     * ferait passer le premier.
     */
    it('cède la place à la grille des faces sur un mode ordinaire', () => {
        choisirLeMode('standard');
        expect(screen.queryByText('dice.actions.roll')).toBe(null);
    });
});
