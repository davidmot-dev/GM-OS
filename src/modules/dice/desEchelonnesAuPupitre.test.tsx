import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * **Le pilote actif écrasait les dés échelonnés du pupitre.**
 *
 * *Défaut trouvé par David le 2026-09-03 : « quand je mets 2x A(D12), les
 * valeurs ne dépassent jamais 6 », et l'avantage n'ajoutait aucun dé.*
 *
 * Le pupitre lançait bien la bonne poignée **sans** campagne ouverte — c'est ce
 * que gardent les essais de `poigneeAuPupitre`. Avec un pilote actif, il
 * n'écoutait plus que `dice.engine` : un pilote Blade Runner qui déclare
 * `jet.desEchelonnes` sans corriger son moteur envoyait tout le jet dans la
 * réserve de d6 de Year Zero. *Des réussites plausibles, jamais plus de six, et
 * le sélecteur de mode affiché à l'écran ne servait à rien.*
 *
 * Ces essais gardent le **chemin**, pas l'échelle : ils vérifient que ce que le
 * meneur voit à l'écran — « D12 + D12 », le bouton Avantage — est bien ce qui
 * est lancé. *C'est la cinquième fois que ce fichier paie le même motif : le
 * chemin s'arrête avant le moteur, et le résultat reste plausible.*
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
   session ; il n'a rien à voir avec la taille des dés. */
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: DiceBoard } = await import('./DiceBoard');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { useDiceStore } = await import('../../stores/useDiceStore');

/**
 * Le pilote tel qu'il sort de la Forge quand elle se trompe : il **décrit** des
 * dés échelonnés, et son moteur dit `yze`. La Forge signale cet écart depuis le
 * 2026-08-29 (`controlesDuPilote`) — un pilote déjà forgé, lui, le porte encore.
 */
const PILOTE_QUI_SE_CONTREDIT = {
    id: 'br-test',
    name: 'Blade Runner',
    dice: { defaultDice: '2d6', logic: 'count-success', engine: 'yze' },
    jet: {
        sens: 'sup-ou-egal',
        desEchelonnes: {
            echelle: 'yze-lettres',
            composantes: [
                { id: 'attribut', label: 'Attribut', champs: ['agilite'] },
                { id: 'competence', label: 'Compétence', champs: ['tir'] },
            ],
        },
    },
};

/** Le même jeu, mais dont le pilote ne dit rien des dés échelonnés. */
const PILOTE_MUET = { id: 'br-test', name: 'Blade Runner', dice: { defaultDice: '2d6', logic: 'count-success', engine: 'yze' } };

const ouvrirLaCampagneAvec = (pilote: unknown) => {
    useSessionOSStore.setState({
        activeCampaignId: 'c-1',
        campaigns: [{ id: 'c-1', name: 'Los Angeles', system: 'br-test' }],
        customGameDrivers: [pilote],
    } as never);
};

/** Le pupitre, tel que le meneur le règle : les deux lettres, puis le lancer. */
const reglerEtLancer = (attribut: string, competence: string, modificateur?: string) => {
    fireEvent.change(screen.getByLabelText('dice.inputs.mode'), { target: { value: 'yze-echelonne' } });
    fireEvent.change(screen.getByLabelText('Attribut'), { target: { value: attribut } });
    fireEvent.change(screen.getByLabelText('Compétence'), { target: { value: competence } });
    if (modificateur) fireEvent.click(screen.getByText(modificateur));
    fireEvent.click(screen.getByText('dice.actions.roll'));
};

/** Les faces réellement lancées, dans l'ordre. */
const facesLancees = () => (useDiceStore.getState().lastRoll?.rolls ?? []).map(r => r.sides);

beforeEach(() => {
    useDiceStore.setState({ lastRoll: null, history: [] } as never);
    useSessionOSStore.setState({ activeCampaignId: null, campaigns: [], customGameDrivers: [] } as never);
});

describe('les dés échelonnés au pupitre, pilote actif', () => {
    /**
     * Le cas de David : deux A, donc deux D12 — et un dix, onze ou douze vaut
     * deux réussites. Avec la réserve de Year Zero, aucune valeur ne dépassait
     * six et ces deux réussites étaient **inatteignables**.
     */
    it('lance les dés de la poignée, et pas la réserve du pilote', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);
        render(<DiceBoard />);

        reglerEtLancer('A', 'A');

        expect(facesLancees()).toEqual([12, 12]);
    });

    /**
     * **Le sélecteur de mode était affiché et ignoré.** Un pilote qui ne dit
     * rien des dés échelonnés ne doit pas empêcher le meneur d'en lancer : il
     * les a choisis à l'écran, c'est un geste, pas une préférence.
     */
    it('obéit au mode choisi par le meneur, même si le pilote se tait', () => {
        ouvrirLaCampagneAvec(PILOTE_MUET);
        render(<DiceBoard />);

        reglerEtLancer('A', 'C');

        expect(facesLancees()).toEqual([12, 8]);
    });

    /** « Ajout d'un troisième dé de base identique au plus faible des deux. » */
    it('ajoute un dé identique au plus faible sur un avantage', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);
        render(<DiceBoard />);

        reglerEtLancer('A', 'C', 'Avantage');

        expect(facesLancees()).toEqual([12, 8, 8]);
    });

    /** « Retrait du dé de base le plus faible » : il n'en reste qu'un. */
    it('retire le plus faible sur un désavantage', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);
        render(<DiceBoard />);

        reglerEtLancer('A', 'C', 'Désavantage');

        expect(facesLancees()).toEqual([12]);
    });

    /**
     * *Ce que le meneur relit dans l'historique.* Le titre disait « Système :
     * Blade Runner » et rien des dés lancés — or c'est précisément là que ce
     * chemin s'est trompé deux fois sans que personne ne puisse le voir.
     */
    it('écrit la poignée dans le titre du jet', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);
        render(<DiceBoard />);

        reglerEtLancer('A', 'B');

        expect(useDiceStore.getState().lastRoll?.title).toContain('D12 + D10');
    });
});
