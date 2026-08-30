import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * **Le clavier voit-il vraiment ce que l'écran montre ?**
 *
 * `playlistsDeLaCampagne.test.ts` prouve que le filtre est juste. Il ne prouve
 * pas que le clavier s'en sert — et c'est le motif que ce projet paie le plus
 * souvent : *le chemin s'arrête avant le moteur*. Une fonction correcte que
 * personne n'appelle laisse tous les tests au vert et le défaut intact.
 *
 * Ce test-ci part donc d'un vrai `keydown` sur `window` et regarde ce qui
 * arrive à `playPad`. Un jet faux ne se voit jamais en séance ; une musique
 * fausse, si — mais trop tard, elle est déjà partie devant les joueurs.
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

/*
  **Le ducking, coupé net — et ce n'est pas un caprice de test.**

  `useVoiceStore` importe `ai/modeDeContexte`, qui importe `useSessionOSStore`.
  Dès que l'un des deux bouts de ce cycle est le **premier** module évalué,
  `useVoiceStore` vaut `undefined` au moment où `AmbientEngine.setupDucking` et
  `MusicEngine.setupDucking` s'y abonnent, et les deux partent en rejet non
  capturé. L'application n'y tombe jamais — son entrée est `main.tsx` — mais un
  fichier de test qui part du magasin de session, si.

  *C'est une fragilité réelle des deux moteurs, hors du sujet du jour :* on la
  contourne ici plutôt que de la maquiller ailleurs. Le ducking n'a de toute
  façon rien à voir avec le choix d'une pastille.
*/
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { useMusicKeyboardControls } = await import('./useMusicKeyboardControls');
const { useMusicStore } = await import('./useMusicStore');
const { useSessionOSStore } = await import('../session/useSessionOSStore');

const pad = (id: string, url: string) => ({
    id, label: id, url, type: 'local' as const, loopA: null, loopB: null, keybind: 'Numpad1',
});

const jouee = vi.fn();

beforeEach(() => {
    jouee.mockClear();
    useMusicStore.setState({
        playPad: jouee,
        playlists: [
            { id: 'pl-rues', name: 'Rues', campagneId: 'c-blade', pads: [pad('blade', 'blade.mp3')] },
            { id: 'pl-colonie', name: 'Colonie', campagneId: 'c-hadley', pads: [pad('colonie', 'colonie.mp3')] },
        ],
    });
    useSessionOSStore.setState({
        campaigns: [{ id: 'c-blade' }, { id: 'c-hadley' }] as never,
        activeCampaignId: 'c-hadley',
    });
});

const frapper = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
};

describe('la touche d’une pastille, campagne ouverte', () => {
    /**
     * Deux campagnes attribuent naturellement `Numpad1` à leur ambiance
     * d'ouverture. La boucle d'origine parcourait TOUTES les playlists et
     * gardait la première trouvée — ici, celle de Blade Runner, alors qu'on
     * joue Hadley Hope.
     */
    it('lance la pastille de la campagne ouverte, pas la première trouvée', () => {
        renderHook(() => useMusicKeyboardControls());

        frapper('Numpad1');

        expect(jouee).toHaveBeenCalledTimes(1);
        expect(jouee.mock.calls[0][0].id).toBe('colonie');
    });

    it('suit le changement de campagne', () => {
        renderHook(() => useMusicKeyboardControls());
        useSessionOSStore.setState({ activeCampaignId: 'c-blade' });

        frapper('Numpad1');

        expect(jouee.mock.calls[0][0].id).toBe('blade');
    });

    /** Les atmosphères communes restent atteignables depuis n'importe où. */
    it('atteint encore une atmosphère commune', () => {
        useMusicStore.setState({
            playlists: [{ id: 'pl-tension', name: 'Tension', pads: [pad('tension', 'tension.mp3')] }],
        });
        renderHook(() => useMusicKeyboardControls());

        frapper('Numpad1');

        expect(jouee.mock.calls[0][0].id).toBe('tension');
    });

    /**
     * Aucune campagne ouverte : rien n'est masqué, donc rien n'est muet. Le
     * meneur qui prépare hors campagne doit pouvoir tout essayer.
     */
    it('ne rend rien muet quand aucune campagne n’est ouverte', () => {
        useSessionOSStore.setState({ activeCampaignId: null });
        renderHook(() => useMusicKeyboardControls());

        frapper('Numpad1');

        expect(jouee).toHaveBeenCalledTimes(1);
    });
});
