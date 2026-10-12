import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import EcranDeLaSceneEnCours from './EcranDeLaSceneEnCours';
import { useSessionOSStore } from '../useSessionOSStore';
import { useEcranDeSceneStore } from '../useEcranDeSceneStore';
import type { Scene } from '../../../types/trame.types';
import type { Entity } from '../../../types/entity.types';

/*
  L'écran « Scène en cours » (L2, 2026-10-12). David, après la première séance
  jouée : *« lorsque je démarre une scène, ses informations ne sont pas
  facilement accessibles »* — il doit s'ouvrir tout seul, se fermer par Échap,
  et Ctrl+E le rouvre.
*/
const initial = useSessionOSStore.getState();
const SCENE: Scene = {
    id: 'sc-1', campaignId: 'c-1', acteId: 'a-1', ordre: 0, titre: 'L’entrepôt', resume: 'Pour le meneur.',
    origine: 'preparee', entiteIds: ['luv'], indiceIds: [], creeeLe: 1,
    descriptionNarrative: 'La **pluie** tambourine sur la tôle.', enjeux: 'Retrouver le témoin.',
    notesDuMeneur: 'Le témoin ment.',
};
const luv = { id: 'luv', name: 'Luv', campaignId: 'c-1', type: 'npc', role: 'boss', avatar: '' } as Entity;

const ecran = () => useEcranDeSceneStore.getState();
const commencer = () => act(() => {
    useSessionOSStore.setState(s => ({
        scenes: s.scenes.map(x => (x.id === 'sc-1' ? { ...x, passages: [{ debut: Date.now() }] } : x)),
    }));
});

beforeEach(() => {
    useEcranDeSceneStore.setState({ ouvert: false, sceneId: null });
    useSessionOSStore.setState({
        activeCampaignId: 'c-1', scenes: [SCENE], actes: [], entities: [luv], clues: [], rencontres: [],
        isSystemSyncing: false,
    });
});

afterEach(() => {
    cleanup();
    useSessionOSStore.setState(initial, true);
});

describe('EcranDeLaSceneEnCours', () => {
    it('s’ouvre tout seul quand une scène commence, sur cette scène', async () => {
        render(<EcranDeLaSceneEnCours />);
        expect(screen.queryByRole('dialog')).toBeNull();

        commencer();

        expect(ecran().ouvert).toBe(true);
        // Le titre, dans l'en-tête et dans l'onglet de la scène.
        expect((await screen.findAllByText('L’entrepôt')).length).toBe(2);
        expect(screen.getByText('pluie')).toBeTruthy();
        expect(screen.getByText('Retrouver le témoin.')).toBeTruthy();
        expect((screen.getByLabelText('Notes du meneur') as HTMLTextAreaElement).value).toBe('Le témoin ment.');
    });

    it('ne s’ouvre pas pendant une relecture de la base (import, restauration)', () => {
        render(<EcranDeLaSceneEnCours />);
        act(() => { useSessionOSStore.setState({ isSystemSyncing: true }); });
        commencer();
        expect(ecran().ouvert).toBe(false);
    });

    it('Échap le ferme, Ctrl+E le rouvre', () => {
        render(<EcranDeLaSceneEnCours />);
        commencer();
        expect(ecran().ouvert).toBe(true);

        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
        expect(ecran().ouvert).toBe(false);

        fireEvent.keyDown(window, { key: 'e', code: 'KeyE', ctrlKey: true });
        expect(ecran().ouvert).toBe(true);
    });

    it('les notes du meneur sont LE champ de la scène', () => {
        render(<EcranDeLaSceneEnCours />);
        commencer();
        fireEvent.change(screen.getByLabelText('Notes du meneur'), { target: { value: 'Il dit vrai.' } });
        expect(useSessionOSStore.getState().scenes[0].notesDuMeneur).toBe('Il dit vrai.');
    });

    /* L5 : un lieu-image se projette, une battlemap se charge dans Map-OS. */
    it('le lieu propose « Projeter l’image », ses battlemaps « Charger dans Map-OS »', () => {
        const carte = (id: string, type: 'city' | 'battlemap', liens: string[] = []) => ({
            id, name: id, fileUrl: `${id}.jpg`, isVideo: false, type, narrativeDescription: '', gmNotes: '',
            campaignId: 'c-1', linkedEntities: liens.map(mapId => ({ id: `l-${mapId}`, name: mapId, category: 'lieu' as const, mapId })),
        });
        useSessionOSStore.setState(s => ({
            atlasMaps: [carte('Palais', 'city', ['Hall']), carte('Hall', 'battlemap')],
            scenes: s.scenes.map(x => ({ ...x, lieuId: 'Palais' })),
        }));
        render(<EcranDeLaSceneEnCours />);
        commencer();

        expect(screen.getByText('Projeter l’image')).toBeTruthy();
        expect(screen.getAllByText('Charger dans Map-OS')).toHaveLength(1);
        expect(screen.queryByText('Mettre sur la table')).toBeNull();
    });

    it('montrer un PNJ aux joueurs garde la trace de la rencontre, avec la scène', () => {
        render(<EcranDeLaSceneEnCours />);
        commencer();
        fireEvent.click(screen.getByText('Caché aux joueurs'));

        const vu = useSessionOSStore.getState().entities.find(e => e.id === 'luv');
        expect(vu?.isVisibleByPlayers).toBe(true);
        expect(vu?.vuParLesJoueurs?.sceneId).toBe('sc-1');

        // Le cacher ensuite n'efface pas la rencontre.
        fireEvent.click(screen.getByText('Montré aux joueurs'));
        expect(useSessionOSStore.getState().entities.find(e => e.id === 'luv')?.vuParLesJoueurs?.sceneId).toBe('sc-1');
    });
});
