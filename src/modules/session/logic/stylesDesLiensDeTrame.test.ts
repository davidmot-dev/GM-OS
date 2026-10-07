import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';
import { normaliserLeStyleDeLien } from './stylesDesLiensDeTrame';
import { adapterLeGrapheDeTrame } from './adapterLeGrapheDeTrame';
import { createCampaignSlice, type CampaignSlice } from '../store/campaignSlice';
import type { Campaign } from '../../../types/campaign.types';

// Le banc de slice n'instancie ni sauvegarde ni coffre Obsidian (leurs ponts importent le magasin complet).
vi.mock('./SessionBackupManager', () => ({ sessionBackupManager: {} }));
vi.mock('../useObsidianStore', () => ({ useObsidianStore: {} }));

describe('styles des liens de Trame', () => {
    it('écarte le CSS arbitraire des campagnes importées et normalise les couleurs hexadécimales', () => {
        expect(normaliserLeStyleDeLien({ couleur: 'url(https://exemple.test)', trace: 'inconnue', epaisseur: Infinity })).toBeUndefined();
        expect(normaliserLeStyleDeLien({ couleur: '#AbC', trace: 'points', epaisseur: 'gras', autre: 'ignoré' }))
            .toEqual({ couleur: '#aabbcc', trace: 'points', epaisseur: 'gras' });
        expect(normaliserLeStyleDeLien(null)).toBeUndefined();
        expect(normaliserLeStyleDeLien({ couleur: 'constructor', trace: 'tirets' })).toEqual({ trace: 'tirets' });
        expect(normaliserLeStyleDeLien({ depart: 'constructor', arrivee: 'ailleurs' })).toBeUndefined();
    });
    it('place chaque extrémité sur les quatre côtés sans changer le sens, la nature ni l’apparence par défaut', () => {
        const noeuds = ['a', 'b'].map(refId => ({ id: 'scene:' + refId, refId, type: 'scene' as const, nom: refId }));
        const options = { positionDe: () => ({ x: 0, y: 0 }), choisi: null, liaison: false, surlignes: new Set<string>(), fige: false };
        const accroches = { haut: 'haut', bas: 'bas', gauche: 'entree', droite: 'sortie' } as const;
        for (const nature of ['enchainement', 'appartenance'] as const) {
            const graphe = { noeuds, liens: [{ source: 'scene:a', target: 'scene:b', nature }] };
            const id = JSON.stringify([nature, 'scene:a', 'scene:b']);
            const ancien = adapterLeGrapheDeTrame(graphe, {}, options).liens[0];
            expect(ancien.sourceHandle).toBe(nature === 'enchainement' ? 'sortie' : 'bas');
            expect(ancien.targetHandle).toBe(nature === 'enchainement' ? 'entree' : 'haut');
            for (const depart of Object.keys(accroches) as (keyof typeof accroches)[])
                for (const arrivee of Object.keys(accroches) as (keyof typeof accroches)[]) {
                    const rendu = adapterLeGrapheDeTrame(graphe, {}, { ...options, lienChoisi: id, styles: { [id]: { depart, arrivee } } });
                    expect(rendu.liens[0]).toMatchObject({ id, source: ancien.source, target: ancien.target,
                        sourceHandle: accroches[depart], targetHandle: accroches[arrivee], style: ancien.style, data: ancien.data, reconnectable: true });
                    expect(rendu.noeuds.every(n => n.data.jonction)).toBe(true);
                }
            expect(adapterLeGrapheDeTrame(graphe, {}, { ...options, lienChoisi: id, liaison: true }).liens[0].reconnectable).toBe(false);
        }
    });
    it('conserve le style et sa flèche quand la condition change, sans modifier le graphe métier', () => {
        const noeuds = ['a', 'b'].map(refId => ({ id: 'scene:' + refId, refId, type: 'scene' as const, nom: refId }));
        const graphe = { noeuds, liens: [{ source: 'scene:a', target: 'scene:b', nature: 'enchainement' as const, libelle: 'si oui' }] };
        const id = JSON.stringify(['enchainement', 'scene:a', 'scene:b']);
        const options = { positionDe: () => ({ x: 0, y: 0 }), choisi: null, liaison: false, surlignes: new Set<string>(), fige: false,
            styles: { [id]: { couleur: '#aabbcc' as const, epaisseur: 'gras' as const, trace: 'points' as const } } };
        const ancien = adapterLeGrapheDeTrame(graphe, {}, { ...options, styles: undefined });
        expect(ancien.liens[0].style).toEqual({ stroke: 'var(--app-accent)', strokeWidth: 2.5, opacity: 0.8 });
        const avant = structuredClone(graphe);
        const adapte = adapterLeGrapheDeTrame(graphe, {}, options).liens[0];
        expect(adapte.style).toMatchObject({ stroke: '#aabbcc', strokeWidth: 4, strokeDasharray: '1 6', strokeLinecap: 'round' });
        expect(adapte.markerEnd).toMatchObject({ color: '#aabbcc' });
        expect(graphe).toEqual(avant);
        graphe.liens[0].libelle = 'si non';
        expect(adapterLeGrapheDeTrame(graphe, {}, options).liens[0].style).toEqual(adapte.style);
    });
    it('ne touche qu’au lien et à la campagne visés, sans écrire pour une valeur identique ou une campagne absente', () => {
        const store = createStore<CampaignSlice>()(createCampaignSlice);
        const a: Campaign = { id: 'a', name: 'A', system: 'test', activeLocationIds: [], positionsDeLaTrame: { n: { x: 4, y: 8 } } };
        const b: Campaign = { id: 'b', name: 'B', system: 'test', activeLocationIds: [] };
        store.setState({ campaigns: [a, b] });
        store.getState().stylerLeLienDeTrame('a', 'lien', { couleur: '#ABCDEF', epaisseur: 'gras' });
        const conserve = store.getState();
        expect(conserve.campaigns[1]).toBe(b);
        expect(conserve.campaigns[0].positionsDeLaTrame).toBe(a.positionsDeLaTrame);
        store.getState().stylerLeLienDeTrame('a', 'lien', { epaisseur: 'gras', couleur: '#abcdef' });
        expect(store.getState()).toBe(conserve);
        store.getState().stylerLeLienDeTrame('absente', 'lien', { couleur: 'accent' });
        expect(store.getState()).toBe(conserve);
        store.getState().stylerLeLienDeTrame('a', 'autre', { trace: 'points' });
        store.getState().stylerLeLienDeTrame('a', 'lien');
        expect(store.getState().campaigns[0].stylesDesLiensDeTrame).toEqual({ autre: { trace: 'points' } });
        store.getState().stylerLeLienDeTrame('a', 'autre');
        expect(store.getState().campaigns[0].stylesDesLiensDeTrame).toBeUndefined();
        expect(store.getState().campaigns[0].positionsDeLaTrame).toBe(a.positionsDeLaTrame);
    });
});
