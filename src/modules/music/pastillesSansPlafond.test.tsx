import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * **L'écran montre-t-il tout ce que le clavier peut atteindre ?**
 *
 * ⛔ Pendant des mois, non. La refonte `da7979d2` a fait passer les playlists de
 * **seize** pastilles à cinq et a ajouté un `.slice(0, 5)` à l'affichage — mais
 * `padDuRaccourci`, lui, parcourt **tous** les pads. Une playlist née avant la
 * refonte gardait donc ses seize pastilles, **dont onze qu'aucune tuile ne
 * montrait et qu'une touche de clavier jouait quand même**.
 *
 * *Le fichier du clavier promet que « le clavier voit exactement ce que l'écran
 * montre ». C'était vrai sur l'axe des campagnes, faux sur celui-ci.* Ce test
 * garde la promesse elle-même, et non l'un de ses deux côtés.
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { default: PlaylistManager } = await import('./components/PlaylistManager');
const { useMusicStore } = await import('./useMusicStore');
const { useSessionOSStore } = await import('../session/useSessionOSStore');
const { padDuRaccourci } = await import('./logic/playlistsDeLaCampagne');

const pad = (i: number, keybind?: string) => ({
    id: `pad-${i}`,
    label: `Ambiance ${i}`,
    url: `piste-${i}.mp3`,
    type: 'local' as const,
    loopA: null,
    loopB: null,
    ...(keybind ? { keybind } : {}),
});

const playlistDe = (nombre: number, keybindSurLaDerniere?: string) => ({
    id: 'pl-rues',
    name: 'Rues',
    pads: Array.from({ length: nombre }, (_, i) =>
        pad(i + 1, i === nombre - 1 ? keybindSurLaDerniere : undefined)
    ),
});

beforeEach(() => {
    // Aucune campagne ouverte : rien n'est masqué, le tri des playlists ne
    // participe pas au sujet du jour.
    useSessionOSStore.setState({ campaigns: [] as never, activeCampaignId: null });
});

describe('la grille des pastilles n\'a plus de plafond', () => {
    it('dessine les cinq pastilles d\'une playlist ordinaire', () => {
        useMusicStore.setState({ playlists: [playlistDe(5)], activePlaylistId: 'pl-rues' });

        render(<PlaylistManager />);

        expect(screen.getByText('Ambiance 1')).toBeTruthy();
        expect(screen.getByText('Ambiance 5')).toBeTruthy();
    });

    /**
     * ⛔ **Le défaut, nommé.** Seize pastilles est le format d'avant la refonte :
     * ce sont les playlists réelles de David qui en portent.
     */
    it('dessine les SEIZE pastilles d\'une playlist d\'avant la refonte', () => {
        useMusicStore.setState({ playlists: [playlistDe(16)], activePlaylistId: 'pl-rues' });

        render(<PlaylistManager />);

        for (const i of [1, 5, 6, 11, 16]) {
            expect(screen.getByText(`Ambiance ${i}`)).toBeTruthy();
        }
    });

    /**
     * La garde qui tient les deux bouts ensemble : ce que le clavier trouve doit
     * être à l'écran. *Deux règles écrites séparément finissent par diverger, et
     * l'écart ne se voit qu'en séance.*
     */
    it('montre la pastille qu\'une touche de clavier peut atteindre', () => {
        const playlist = playlistDe(12, 'Numpad7');
        useMusicStore.setState({ playlists: [playlist], activePlaylistId: 'pl-rues' });

        const trouveParLeClavier = padDuRaccourci([playlist], null, 'Numpad7', []);
        render(<PlaylistManager />);

        expect(trouveParLeClavier?.label).toBe('Ambiance 12');
        expect(screen.getByText('Ambiance 12')).toBeTruthy();
    });

    /**
     * ⛔ **Le retrait a changé de place deux fois, et pour deux raisons.**
     *
     * Posé d'abord en bas à droite de la tuile, il tombait **sous le bouton
     * « … »** : inatteignable. Replié dans le menu, il en a poussé la dernière
     * entrée hors du cadre — *le menu a une hauteur fixe, la tuile non.* Il vit
     * désormais **au milieu en bas**, le seul des cinq emplacements libres, et
     * **hors du menu** : c'est ce que ce test garde.
     */
    it('offre le retrait sur la tuile elle-même, sans ouvrir le menu', () => {
        useMusicStore.setState({ playlists: [playlistDe(5)], activePlaylistId: 'pl-rues' });

        render(<PlaylistManager />);

        expect(screen.getAllByTitle('Retirer cette pastille')).toHaveLength(5);
    });

    it('n\'alourdit plus le menu avec le retrait', () => {
        useMusicStore.setState({ playlists: [playlistDe(1)], activePlaylistId: 'pl-rues' });

        render(<PlaylistManager />);

        expect(screen.queryByText('RETIRER')).toBeNull();
    });

    it('offre la tuile d\'ajout au bout de la grille', () => {
        useMusicStore.setState({ playlists: [playlistDe(5)], activePlaylistId: 'pl-rues' });

        render(<PlaylistManager />);

        expect(screen.getByText('Ajouter')).toBeTruthy();
    });
});

describe('ajouterUnPad / retirerUnPad', () => {
    beforeEach(() => {
        useMusicStore.setState({ playlists: [playlistDe(5)], activePlaylistId: 'pl-rues' });
    });

    const pads = () => useMusicStore.getState().playlists[0].pads;

    it('ajoute une pastille vide à la fin', () => {
        useMusicStore.getState().ajouterUnPad('pl-rues');

        expect(pads()).toHaveLength(6);
        expect(pads()[5]).toMatchObject({ url: '', label: 'Pad 6', loopA: null, loopB: null });
    });

    it('donne un identifiant neuf à chaque ajout — deux pastilles ne se confondent jamais', () => {
        useMusicStore.getState().ajouterUnPad('pl-rues');
        useMusicStore.getState().ajouterUnPad('pl-rues');

        const identifiants = new Set(pads().map(p => p.id));
        expect(identifiants.size).toBe(pads().length);
    });

    it('retire la pastille visée, et elle seule', () => {
        useMusicStore.getState().retirerUnPad('pl-rues', 2);

        expect(pads().map(p => p.label)).toEqual(['Ambiance 1', 'Ambiance 2', 'Ambiance 4', 'Ambiance 5']);
    });

    /**
     * ⚠️ Retirer une pastille est un geste d'organisation. *Couper le son parce
     * qu'on a rangé la grille serait la pire surprise possible en séance.*
     */
    it('ne touche pas aux platines quand on retire la pastille qui joue', () => {
        useMusicStore.setState({
            deckA: { activePadId: 'pad-3', activeTrackLabel: 'Ambiance 3', volume: 1, isLooping: true, isPlaying: true },
        });

        useMusicStore.getState().retirerUnPad('pl-rues', 2);

        expect(useMusicStore.getState().deckA.isPlaying).toBe(true);
        expect(useMusicStore.getState().deckA.activeTrackLabel).toBe('Ambiance 3');
    });

    it('ne touche pas aux autres playlists', () => {
        useMusicStore.setState({
            playlists: [playlistDe(5), { id: 'pl-autre', name: 'Autre', pads: [pad(99)] }],
        });

        useMusicStore.getState().ajouterUnPad('pl-rues');

        expect(useMusicStore.getState().playlists[1].pads).toHaveLength(1);
    });
});
