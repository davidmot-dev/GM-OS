import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * **Le nom, la couleur et la touche, au même endroit.**
 *
 * Demandé par David le 2026-09-16. Ce qui est gardé ici n'est pas la mise en
 * page mais les deux règles qui se voient mal :
 *
 * 1. **une touche ne commande qu'une pastille** — l'attribuer à une seconde la
 *    retire à la première, sinon l'une des deux devient muette et **rien ne le
 *    dit** (c'est la règle de Light-OS, reprise telle quelle) ;
 * 2. **on n'attribue que des touches que le clavier acceptera ensuite** — la
 *    garde partagée écarte Ctrl, Alt et Cmd, donc les proposer ici serait un
 *    réglage qui ment.
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { EditeurDePastille } = await import('./components/EditeurDePastille');
const { useMusicStore } = await import('./useMusicStore');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { couleurDeLaPastille, SANS_COULEUR } = await import('./logic/couleursDePastille');

const pad = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    label: id,
    url: `${id}.mp3`,
    type: 'local' as const,
    loopA: null,
    loopB: null,
    ...extra,
});

const fermer = vi.fn();

beforeEach(() => {
    fermer.mockClear();
    useSessionOSStore.setState({ campaigns: [] as never, activeCampaignId: null });
    useMusicStore.setState({
        playlists: [
            { id: 'pl-1', name: 'Rues', pads: [pad('pluie'), pad('sirenes', { keybind: 'Numpad1' })] },
        ],
        activePlaylistId: 'pl-1',
    });
});

const padsDuMagasin = () => useMusicStore.getState().playlists.flatMap(p => p.pads);
const ouvrir = (padIndex = 0) =>
    render(<EditeurDePastille playlistId="pl-1" padIndex={padIndex} onClose={fermer} />);

describe('le nom', () => {
    it('part de la valeur actuelle et s\'enregistre', () => {
        ouvrir();

        fireEvent.change(screen.getByDisplayValue('pluie'), { target: { value: 'Averse' } });
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin()[0].label).toBe('Averse');
        expect(fermer).toHaveBeenCalled();
    });

    /** *Un champ vidé par mégarde ne doit pas donner une pastille sans nom.* */
    it('garde l\'ancien nom si le champ est vidé', () => {
        ouvrir();

        fireEvent.change(screen.getByDisplayValue('pluie'), { target: { value: '   ' } });
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin()[0].label).toBe('pluie');
    });

    it('n\'écrit rien si on annule', () => {
        ouvrir();

        fireEvent.change(screen.getByDisplayValue('pluie'), { target: { value: 'Averse' } });
        fireEvent.click(screen.getByText('Annuler'));

        expect(padsDuMagasin()[0].label).toBe('pluie');
        expect(fermer).toHaveBeenCalled();
    });
});

describe('la couleur', () => {
    it('enregistre la CLÉ de la teinte, jamais une valeur hexadécimale', () => {
        ouvrir();

        fireEvent.click(screen.getByLabelText('Ambre'));
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin()[0].couleur).toBe('ambre');
    });

    /** *Sans ce retour, colorer une pastille serait un aller sans retour.* */
    it('« Aucune » efface la couleur', () => {
        useMusicStore.setState({
            playlists: [{ id: 'pl-1', name: 'Rues', pads: [pad('pluie', { couleur: 'ambre' })] }],
        });
        ouvrir();

        fireEvent.click(screen.getByLabelText('Aucune'));
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin()[0].couleur).toBeUndefined();
    });
});

describe('la touche', () => {
    const ecouter = () => fireEvent.click(screen.getByText('Assigner une touche'));

    it('capture la frappe suivante', () => {
        ouvrir();

        ecouter();
        fireEvent.keyDown(window, { code: 'KeyK' });
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin()[0].keybind).toBe('KeyK');
    });

    /**
     * ⛔ La garde partagée `estUneFrappeDePastille` écarte Ctrl, Alt et Cmd :
     * une touche attribuée avec l'un d'eux ne partirait jamais en séance.
     */
    it('refuse une frappe tenue avec Ctrl — le clavier ne la rendrait jamais', () => {
        ouvrir();

        ecouter();
        fireEvent.keyDown(window, { code: 'KeyK', ctrlKey: true });

        // Toujours en écoute : la frappe n'a pas été retenue.
        expect(screen.getByText(/Appuyez sur une touche/)).toBeTruthy();
    });

    it('Échap sort de l\'écoute sans rien attribuer', () => {
        ouvrir();

        ecouter();
        fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin()[0].keybind).toBeUndefined();
    });

    it('se retire', () => {
        ouvrir(1);

        fireEvent.click(screen.getByTitle('Retirer la touche'));
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin()[1].keybind).toBeUndefined();
    });
});

describe('une touche ne commande qu\'une pastille', () => {
    it('annonce le détenteur AVANT d\'enregistrer, et le nomme', () => {
        ouvrir();

        fireEvent.click(screen.getByText('Assigner une touche'));
        fireEvent.keyDown(window, { code: 'Numpad1' });

        expect(screen.getByText(/lance déjà/)).toBeTruthy();
        expect(screen.getByText(/sirenes/)).toBeTruthy();
    });

    it('la retire au détenteur à l\'enregistrement', () => {
        ouvrir();

        fireEvent.click(screen.getByText('Assigner une touche'));
        fireEvent.keyDown(window, { code: 'Numpad1' });
        fireEvent.click(screen.getByText('Enregistrer'));

        expect(padsDuMagasin().find(p => p.id === 'pluie')?.keybind).toBe('Numpad1');
        expect(padsDuMagasin().find(p => p.id === 'sirenes')?.keybind).toBeUndefined();
    });

    /** Se réattribuer sa propre touche n'est pas un conflit. */
    it('ne se signale pas soi-même comme détenteur', () => {
        ouvrir(1);

        expect(screen.queryByText(/lance déjà/)).toBeNull();
    });
});

describe('couleurDeLaPastille', () => {
    /**
     * ⚠️ Une clé inconnue arrive d'une sauvegarde plus ancienne, ou d'une teinte
     * retirée. *Rendre `undefined` donnerait une tuile sans bordure ni fond —
     * une pastille invisible, bien pire que la couleur qu'on ne sait plus rendre.*
     */
    it('retombe sur « aucune » pour une clé inconnue', () => {
        expect(couleurDeLaPastille('turquoise-de-2019')).toBe(couleurDeLaPastille(SANS_COULEUR));
        expect(couleurDeLaPastille(undefined).tuile).toBeTruthy();
        expect(couleurDeLaPastille(null).tuile).toBeTruthy();
    });

    it('rend des classes écrites en toutes lettres — Tailwind ne compose pas à l\'exécution', () => {
        expect(couleurDeLaPastille('ambre').tuile).toContain('border-amber-500/40');
    });
});
