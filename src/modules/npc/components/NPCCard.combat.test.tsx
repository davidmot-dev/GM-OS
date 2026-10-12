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
