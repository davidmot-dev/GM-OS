import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import RencontresDeLaScene from './RencontresDeLaScene';
import { useSessionOSStore } from '../../useSessionOSStore';
import type { Scene } from '../../../../types/trame.types';
import type { Entity } from '../../../../types/entity.types';

/*
  R3 (2026-10-12) : composer les rencontres d'une scène dans la Trame — l'autre
  porte que « Garder le plateau comme rencontre » dans Combat-OS.
*/
const initial = useSessionOSStore.getState();
const SCENE: Scene = {
    id: 'sc-1', campaignId: 'c-1', acteId: 'a-1', ordre: 0, titre: 'L’embuscade', resume: '',
    origine: 'preparee', entiteIds: ['pnj-luv'], indiceIds: [], creeeLe: 1,
};
const luv = { id: 'pnj-luv', name: 'Luv', campaignId: 'c-1', type: 'npc', role: 'boss' } as Entity;

const rencontres = () => useSessionOSStore.getState().rencontres;
const choisir = (libelle: string, valeur: string) =>
    fireEvent.change(screen.getByLabelText(libelle), { target: { value: valeur } });

beforeEach(() => {
    useSessionOSStore.setState({ rencontres: [], entities: [luv], activeCampaignId: 'c-1' });
});

afterEach(() => {
    cleanup();
    useSessionOSStore.setState(initial, true);
});

describe('RencontresDeLaScene', () => {
    it('crée une rencontre rattachée à la scène, et la compose ligne à ligne', () => {
        render(<RencontresDeLaScene scene={SCENE} />);
        fireEvent.click(screen.getByText('Nouvelle rencontre'));

        expect(rencontres()).toHaveLength(1);
        expect(rencontres()[0]).toMatchObject({ campaignId: 'c-1', sceneId: 'sc-1', lignes: [] });

        choisir('Ajouter un adversaire', 'a:brute');
        choisir('Ajouter un adversaire', 'e:pnj-luv');
        expect(rencontres()[0].lignes).toEqual([
            { genre: 'archetype', archetypeId: 'brute', rangId: 'pietaille', nombre: 4 },
            { genre: 'entite', entiteId: 'pnj-luv' },
        ]);

        choisir('Nombre', '2');
        expect(rencontres()[0].lignes[0]).toMatchObject({ nombre: 2 });
    });

    it('détacher rend la rencontre libre, et une rencontre libre se rattache', () => {
        useSessionOSStore.getState().ajouterUneRencontre({ campaignId: 'c-1', sceneId: 'sc-1', nom: 'La patrouille', lignes: [] });
        useSessionOSStore.getState().ajouterUneRencontre({ campaignId: 'c-1', nom: 'Libre', lignes: [] });
        render(<RencontresDeLaScene scene={SCENE} />);

        fireEvent.click(screen.getByTitle('Détacher : la rencontre devient libre'));
        expect(rencontres().find(r => r.nom === 'La patrouille')?.sceneId).toBeUndefined();

        const libre = rencontres().find(r => r.nom === 'Libre')!;
        choisir('Rattacher une rencontre libre', libre.id);
        expect(rencontres().find(r => r.nom === 'Libre')?.sceneId).toBe('sc-1');
    });
});
