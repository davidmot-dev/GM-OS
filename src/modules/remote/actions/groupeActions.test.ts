import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { groupeActions } from './groupeActions';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';

/**
 * Ce que ces tests protègent : **un joueur n'écrit que dans le groupe de SA
 * campagne**, et seulement quand le jeu en déclare un. `actionPolicy` a vérifié
 * qu'il parle pour son personnage ; la campagne, elle, se déduit ici — le
 * message n'en nomme aucune.
 */

const ecrire = groupeActions['groupe:ecrire'];
const ctx = { activeCampaignId: 'c-noc', sync: () => {} };
const initial = useSessionOSStore.getState();

const NOC = { id: 'noc', name: 'NOC', templateId: 'noc-reference', ficheDeGroupe: { libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale' } } as GameDriver;
const DUNE = { id: 'dune', name: 'Dune', templateId: 'dune' } as GameDriver;

const groupeDe = (id: string) => useSessionOSStore.getState().campaigns.find(c => c.id === id)?.groupe;

beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    useSessionOSStore.setState({
        activeCampaignId: 'c-noc',
        customGameDrivers: [NOC, DUNE],
        campaigns: [
            { id: 'c-noc', name: 'Test NOC', system: 'noc', activeLocationIds: [], groupe: { ficheId: 'f1', sheetData: { 'domains.vie': 1 } } },
            { id: 'c-dune', name: 'Agents de Dune', system: 'dune', activeLocationIds: [] },
        ],
        players: [{
            id: 'p1', realName: 'Léa', avatarUrl: '', isOnline: true,
            characters: [
                { id: 'pj-noc', name: 'Ivo', campaignId: 'c-noc' },
                { id: 'pj-dune', name: 'Paul', campaignId: 'c-dune' },
            ],
        }],
    } as never);
});

afterEach(() => {
    vi.restoreAllMocks();
    useSessionOSStore.setState(initial, true);
});

describe('un joueur écrit dans la fiche du groupe', () => {
    it('la valeur atterrit dans le groupe de SA campagne, fusionnée', () => {
        ecrire({ characterId: 'pj-noc', sheetData: { 'domains.action': 3 } }, ctx);
        expect(groupeDe('c-noc')).toMatchObject({ ficheId: 'f1', sheetData: { 'domains.vie': 1, 'domains.action': 3 } });
    });

    it('un jeu sans fiche de groupe ne reçoit rien', () => {
        ecrire({ characterId: 'pj-dune', sheetData: { 'domains.action': 3 } }, ctx);
        expect(groupeDe('c-dune')).toBeUndefined();
    });

    it('un personnage inconnu, ou un message mal formé, ne touche à rien', () => {
        ecrire({ characterId: 'personne', sheetData: { 'domains.action': 3 } }, ctx);
        ecrire({ characterId: 'pj-noc', sheetData: 'domains.action=3' }, ctx);
        ecrire(null, ctx);
        expect(groupeDe('c-noc')?.sheetData).toEqual({ 'domains.vie': 1 });
    });

    it('seules les valeurs simples passent', () => {
        ecrire({ characterId: 'pj-noc', sheetData: { 'identity.name': 'Rue Krev', piege: { a: 1 }, nan: Number.NaN } }, ctx);
        expect(groupeDe('c-noc')?.sheetData).toEqual({ 'domains.vie': 1, 'identity.name': 'Rue Krev' });
    });
});

describe('la tablette écrit chez elle, puis prévient le meneur', () => {
    it('remoteEcrireLeGroupe applique et diffuse groupe:ecrire', () => {
        const recus: unknown[] = [];
        const ecoute = (e: Event) => recus.push((e as CustomEvent).detail);
        window.addEventListener('groupe:ecrire', ecoute);
        try {
            useSessionOSStore.getState().remoteEcrireLeGroupe('c-noc', 'pj-noc', { 'tracks.espoir': 4 });
        } finally {
            window.removeEventListener('groupe:ecrire', ecoute);
        }
        expect(groupeDe('c-noc')?.sheetData).toMatchObject({ 'tracks.espoir': 4 });
        expect(recus).toEqual([{ characterId: 'pj-noc', sheetData: { 'tracks.espoir': 4 } }]);
    });
});
