import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import NPCCard from './NPCCard';
import { useNPCStore } from '../useNPCStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';

/*
  2026-10-12, décision de David : un PNJ de NPC-OS entre au combat comme un
  adversaire de l'Atelier. Il partait avec 10 PV en dur et une initiative tirée
  au hasard, qui ne venaient de nulle part.
*/
const initialNpc = useNPCStore.getState();
const initialSession = useSessionOSStore.getState();

beforeEach(() => {
    useCombatStore.getState().reset();
    useNPCStore.setState({
        currentEntity: { id: 'n-1', category: 'npcs', name: 'Contrebandier', gmNotes: '', fields: {}, timestamp: 1 },
    });
    useSessionOSStore.setState({
        getActiveDriver: () => ({ combat: { defaultHealthType: 'clocks' } }) as never,
    });
});

afterEach(() => {
    cleanup();
    useNPCStore.setState(initialNpc, true);
    useSessionOSStore.setState(initialSession, true);
});

describe('NPCCard — Ajouter au combat', () => {
    it('envoie le PNJ avec la santé par défaut du jeu, initiative à 0', () => {
        render(<NPCCard />);
        fireEvent.click(screen.getByText(/combat_add|Ajouter au Combat OS/));

        const [c] = useCombatStore.getState().combatants;
        expect(c.name).toBe('Contrebandier');
        expect(c.init, 'l’initiative se tire à la table, pas au hasard').toBe(0);
        expect(c.healthSystem?.type, 'la santé suit le pilote du jeu').toBe('clocks');
        expect(c.faction).toBe('enemy');
    });
});

/*
  2026-10-17, David : « voici quand je génère une image » — un cadre vide. Une
  image générée est rangée au Media Hub sous un identifiant `m-…` ; la carte en
  faisait un chemin de fichier `gmos://media/m-…`, qui n'existe pas. L'import,
  qui rend un chemin, marchait.
*/
describe('NPCCard — un portrait généré', () => {
    it('garde son identifiant de média, au combat comme à l’écran', async () => {
        const { useMediaStore } = await import('../../../stores/useMediaStore');
        const getMediaBlob = useMediaStore.getState().getMediaBlob;
        useMediaStore.setState({ getMediaBlob: async () => new Blob(['x'], { type: 'image/jpeg' }) });
        useNPCStore.setState({ currentEntity: { id: 'n-2', category: 'npcs', name: 'Marco', gmNotes: '', fields: {}, timestamp: 1, avatar: 'm-2e6fc58b' } });
        try {
            render(<NPCCard />);
            fireEvent.click(screen.getByText(/combat_add|Ajouter au Combat OS/));
            expect(useCombatStore.getState().combatants[0].avatar).toBe('m-2e6fc58b');
            const portrait = await screen.findByAltText('Marco');
            await expect.poll(() => portrait.getAttribute('src') ?? '').toMatch(/^data:image\/jpeg;base64,/);
        } finally {
            useMediaStore.setState({ getMediaBlob });
        }
    });

    it('un chemin de fichier importé passe toujours par gmos://', () => {
        useNPCStore.setState({ currentEntity: { id: 'n-3', category: 'npcs', name: 'Lina', gmNotes: '', fields: {}, timestamp: 1, avatar: 'file:///C:/portraits/lina.png' } });
        render(<NPCCard />);
        fireEvent.click(screen.getByText(/combat_add|Ajouter au Combat OS/));
        expect(useCombatStore.getState().combatants[0].avatar).toBe('gmos://media/C:/portraits/lina.png');
    });
});
