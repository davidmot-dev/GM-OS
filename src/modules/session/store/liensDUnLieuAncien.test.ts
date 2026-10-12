import { afterEach, describe, expect, it } from 'vitest';
import { useSessionOSStore } from '../useSessionOSStore';

/*
  2026-10-12 : l'Atlas plantait (« linkedEntities is not iterable ») en liant
  quoi que ce soit à un lieu d'ancien format, sans liste de liens — vu sur la
  carte « Station Varn » de la campagne de démonstration.
*/
const initial = useSessionOSStore.getState();
afterEach(() => useSessionOSStore.setState(initial, true));

describe('les liens d’un lieu d’ancien format', () => {
    it('se lient et se délient sans planter', () => {
        // Le format d'avant : ni `linkedEntities`, ni `type`.
        useSessionOSStore.setState({
            atlasMaps: [{ id: 'vieux', campaignId: 'c-1', name: 'Station Varn' } as never],
        });
        const etat = () => useSessionOSStore.getState();

        etat().addLinkedEntity('vieux', { name: 'Pont C', category: 'lieu', mapId: 'pont-c' });
        const liens = etat().atlasMaps[0].linkedEntities;
        expect(liens.map(l => l.mapId)).toEqual(['pont-c']);

        etat().removeLinkedEntity('vieux', liens[0].id);
        expect(etat().atlasMaps[0].linkedEntities).toEqual([]);
    });
});
