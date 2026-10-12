import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import PanneauDesRencontres from './PanneauDesRencontres';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useCombatStore } from '../useCombatStore';
import type { Scene } from '../../../types/trame.types';

/*
  R4 (2026-10-12) : depuis l'écran « Scène en cours », « Invoquer » ouvre le
  panneau directement sur « Qui entre ? », les PJ de la scène cochés d'avance.
*/
const initial = useSessionOSStore.getState();
const SCENE: Scene = {
    id: 'sc-1', campaignId: 'c-1', acteId: 'a-1', ordre: 0, titre: 'Le sas', resume: '', origine: 'preparee',
    entiteIds: [], indiceIds: [], personnagesIds: ['ripley'], creeeLe: 1,
};

beforeEach(() => {
    useCombatStore.getState().reset();
    useSessionOSStore.setState({
        activeCampaignId: 'c-1', scenes: [SCENE], actes: [], entities: [],
        players: [{ id: 'p', name: 'David', characters: [
            { id: 'ripley', name: 'Ripley', campaignId: 'c-1' },
            { id: 'dallas', name: 'Dallas', campaignId: 'c-1' },
        ] }] as never,
        rencontres: [{
            id: 'r-1', campaignId: 'c-1', sceneId: 'sc-1', nom: 'Le xénomorphe', creeeLe: 1,
            lignes: [{ genre: 'archetype', archetypeId: 'brute', rangId: 'boss', nombre: 1 }],
        }],
    });
});

afterEach(() => {
    cleanup();
    useSessionOSStore.setState(initial, true);
});

describe('PanneauDesRencontres — ouvert sur une rencontre', () => {
    it('s’ouvre sur « Qui entre ? », les PJ de la scène cochés d’avance', () => {
        render(<PanneauDesRencontres onClose={() => {}} rencontreInitiale="r-1" />);

        expect(screen.getByText('Qui entre ?')).toBeTruthy();
        expect(screen.getByText('Le xénomorphe')).toBeTruthy();
        const coche = (nom: string) => (screen.getByText(nom).closest('label')!.querySelector('input') as HTMLInputElement).checked;
        expect(coche('Ripley')).toBe(true);
        expect(coche('Dallas')).toBe(false);
    });

    it('sans rencontre désignée, s’ouvre sur la liste', () => {
        render(<PanneauDesRencontres onClose={() => {}} />);
        expect(screen.queryByText('Qui entre ?')).toBeNull();
        // Sa scène n'est pas en cours : elle est rangée, repliée, sous « Autres scènes ».
        expect(screen.getByText('Autres scènes (1)')).toBeTruthy();
    });
});
