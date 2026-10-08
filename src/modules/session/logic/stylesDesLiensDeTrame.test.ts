import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';
import { normaliserLeStyleDeLien, accrocheDuLien, coteDeLAccroche, pointDeLAccroche } from './stylesDesLiensDeTrame';
import { ajouterUnPointDePassage, trajetDeTrameValide } from './trajetsDeTrame';
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
                        sourceHandle: accroches[depart], targetHandle: accroches[arrivee], style: ancien.style,
                        data: { lien: ancien.data!.lien, trajet: ancien.data!.trajet }, reconnectable: true });
                    expect(rendu.noeuds.every(n => n.data.jonction)).toBe(true);
                }
            expect(adapterLeGrapheDeTrame(graphe, {}, { ...options, lienChoisi: id, liaison: true }).liens[0].reconnectable).toBe(false);
        }
    });
    it('conserve les anciens identifiants centraux et distingue les douze accroches', () => {
        for (const cote of ['haut', 'bas', 'gauche', 'droite'] as const)
            for (const point of [1, 2, 3] as const) {
                const id = accrocheDuLien(cote, point);
                expect(coteDeLAccroche(id)).toBe(cote);
                expect(pointDeLAccroche(id)).toBe(point);
            }
        expect(accrocheDuLien('gauche', 2)).toBe('entree');
        expect(pointDeLAccroche('haut-8')).toBeUndefined();
        expect(normaliserLeStyleDeLien({ pointDepart: 2, pointArrivee: 9 })).toBeUndefined();
    });
    it('refuse les points invalides des imports et conserve la frappe du commentaire', () => {
        expect(normaliserLeStyleDeLien({ commentaire: ' note avec espace ', pointsDePassage: [{ x: 4, y: 9 }] }))
            .toEqual({ commentaire: ' note avec espace ', pointsDePassage: [{ x: 4, y: 9 }] });
        for (const pointsDePassage of [[{ x: Infinity, y: 0 }], [null], Array(21).fill({ x: 0, y: 0 })])
            expect(normaliserLeStyleDeLien({ pointsDePassage, commentaire: '   ' })).toBeUndefined();
        expect(normaliserLeStyleDeLien({ commentaire: 'a'.repeat(1001) })?.commentaire).toHaveLength(1000);
    });
    it('enregistre commentaire, ports et détours sans changer les scènes, puis les restitue après sérialisation', () => {
        const store = createStore<CampaignSlice>()(createCampaignSlice);
        const campagne: Campaign = { id: 'a', name: 'A', system: 'test', activeLocationIds: [] };
        store.setState({ campaigns: [campagne] });
        const style = { commentaire: '<b>En secret</b>', pointDepart: 1 as const, pointArrivee: 3 as const,
            pointsDePassage: [{ x: 80, y: 160 }], couleur: 'accent' as const };
        store.getState().stylerLeLienDeTrame('a', 'lien', style);
        const restaure: Campaign = JSON.parse(JSON.stringify(store.getState().campaigns[0]));
        expect(normaliserLeStyleDeLien(restaure.stylesDesLiensDeTrame?.lien)).toEqual(style);
        style.pointsDePassage[0].x = 999;
        expect(store.getState().campaigns[0].stylesDesLiensDeTrame?.lien.pointsDePassage?.[0].x).toBe(80);
    });
    it('insère le détour dans le bon segment sans modifier le trajet existant', () => {
        const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
        expect(ajouterUnPointDePassage(points, { x: 120, y: 70 })).toEqual([{ x: 100, y: 0 }, { x: 120, y: 70 }]);
        expect(points).toHaveLength(3);
        const trajet = { points, depart: 'droite' as const, arrivee: 'haut' as const,
            positionDepart: points[0], positionArrivee: points[2] };
        expect(trajetDeTrameValide(trajet, points[0], points[2], { pointDepart: 1 })).toBe(false);
        expect(trajetDeTrameValide({ ...trajet, pointDepart: 1 }, points[0], points[2], { pointDepart: 1 })).toBe(true);
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
