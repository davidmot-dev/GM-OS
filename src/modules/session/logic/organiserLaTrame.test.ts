import { describe, it, expect, vi } from 'vitest';
import ELK from 'elkjs/lib/elk.bundled.js';
import { createStore } from 'zustand';
import { organiserLaTrame } from './organiserLaTrame';
import { trajetDeTrameValide, cheminDuTrajet } from './trajetsDeTrame';
import { DIMENSIONS_DES_CARTES } from './geometrieDesCartesDeTrame';
import { adapterLeGrapheDeTrame } from './adapterLeGrapheDeTrame';
import { createCampaignSlice, type CampaignSlice } from '../store/campaignSlice';
import type { Campaign } from '../../../types/campaign.types';
import type { GrapheDeTrame, NoeudDeTrame } from './grapheDeLaTrame';

vi.mock('./SessionBackupManager', () => ({ sessionBackupManager: {} }));
vi.mock('../useObsidianStore', () => ({ useObsidianStore: {} }));
const n = (type: NoeudDeTrame['type'], id: string): NoeudDeTrame => ({ id, refId: id, type, nom: id });
function temoin(): GrapheDeTrame {
    return { noeuds: [n('acte', 'a'), n('acte', 'b'), ...['s1', 's2', 's3', 's4'].map(id => n('scene', id)),
        n('pnj', 'partage'), n('indice', 'local'), n('pj', 'orphelin')], liens: [
        ...['s1', 's2', 's3'].map(target => ({ source: 'a', target, nature: 'appartenance' as const })),
        { source: 'b', target: 's4', nature: 'appartenance' },
        { source: 's1', target: 's2', nature: 'enchainement', libelle: 'si oui' },
        { source: 's1', target: 's3', nature: 'enchainement' }, { source: 's3', target: 's4', nature: 'enchainement' },
        { source: 's4', target: 's1', nature: 'enchainement' },
        { source: 's1', target: 'partage', nature: 'pnj' }, { source: 's4', target: 'partage', nature: 'pnj' },
        { source: 's2', target: 'local', nature: 'indice' },
    ] };
}
const id = JSON.stringify(['enchainement', 's1', 's2']);

describe('organiser les cartes et les trajets de Trame', () => {
    it('le vrai moteur respecte les accroches décentrées et les restitue au rendu', async () => {
        const graphe = temoin();
        const styles = { [id]: { depart: 'bas' as const, arrivee: 'haut' as const, pointDepart: 1 as const, pointArrivee: 3 as const } };
        const resultat = await organiserLaTrame(graphe, styles, { espacement: 'equilibre', proportions: 1.7 }, new ELK());
        const trajet = resultat.trajets[id];
        expect(trajet).toMatchObject({ pointDepart: 1, pointArrivee: 3 });
        expect(trajet.points[0].x).toBeCloseTo(resultat.positions.s1.x - DIMENSIONS_DES_CARTES.scene.largeur / 4);
        expect(trajet.points.at(-1)!.x).toBeCloseTo(resultat.positions.s2.x + DIMENSIONS_DES_CARTES.scene.largeur / 4);
        expect(trajetDeTrameValide(trajet, resultat.positions.s1, resultat.positions.s2, styles[id])).toBe(true);
        const rendu = adapterLeGrapheDeTrame(graphe, {}, { positionDe: n => resultat.positions[n], choisi: null,
            liaison: false, surlignes: new Set(), fige: false, organisation: resultat, styles }).liens.find(l => l.id === id)!;
        expect(rendu).toMatchObject({ sourceHandle: 'bas-1', targetHandle: 'haut-3', data: { trajet } });
    });
    it('le vrai moteur place les cartes sans chevauchement, groupe les actes et respecte les jonctions dans les trois espacements', async () => {
        const graphe = temoin(), avant = structuredClone(graphe), moteur = new ELK();
        for (const espacement of ['compact', 'equilibre', 'aere'] as const) {
            const resultat = await organiserLaTrame(graphe, { [id]: { depart: 'bas', arrivee: 'haut', couleur: '#8b5cf6' } },
                { espacement, proportions: 1.7 }, moteur);
            expect(Object.keys(resultat.positions).sort()).toEqual(graphe.noeuds.map(n => n.id).sort());
            expect(Object.keys(resultat.trajets)).toHaveLength(graphe.liens.length);
            expect(resultat.groupes).toHaveLength(2);
            expect(resultat.groupes.find(g => g.id === 'groupe:a')?.membres).toContain('local');
            expect(resultat.groupes.every(g => !g.membres.includes('partage'))).toBe(true);
            for (const a of graphe.noeuds) for (const b of graphe.noeuds) if (a.id < b.id) {
                const p = resultat.positions[a.id], q = resultat.positions[b.id], ta = DIMENSIONS_DES_CARTES[a.type], tb = DIMENSIONS_DES_CARTES[b.type];
                expect(Math.abs(p.x - q.x) >= (ta.largeur + tb.largeur) / 2 || Math.abs(p.y - q.y) >= (ta.hauteur + tb.hauteur) / 2, `${a.id} / ${b.id}`).toBe(true);
            }
            const trajet = resultat.trajets[id];
            expect(trajet).toMatchObject({ depart: 'bas', arrivee: 'haut', libelle: 'si oui' });
            for (const [i, p] of trajet.points.entries()) if (i) {
                const q = trajet.points[i - 1]; expect(Math.abs(p.x - q.x) < 0.01 || Math.abs(p.y - q.y) < 0.01).toBe(true);
            }
            const rendu = adapterLeGrapheDeTrame(graphe, {}, { positionDe: n => resultat.positions[n], choisi: null, liaison: false,
                surlignes: new Set(), fige: false, organisation: resultat });
            expect(rendu.liens.find(l => l.id === id)?.data?.trajet).toEqual(trajet);
        }
        expect(graphe).toEqual(avant);
    }, 20_000);

    it('un trajet reste lié à ses positions et jonctions ; les données importées invalides sont écartées', async () => {
        const resultat = await organiserLaTrame(temoin(), undefined, { espacement: 'compact', proportions: 1.5 }, new ELK());
        const trajet = resultat.trajets[id];
        expect(trajetDeTrameValide(trajet, trajet.positionDepart, trajet.positionArrivee, { couleur: 'accent' })).toBe(true);
        expect(trajetDeTrameValide(trajet, { x: 999, y: 999 }, trajet.positionArrivee)).toBe(false);
        expect(trajetDeTrameValide(trajet, trajet.positionDepart, trajet.positionArrivee, { depart: trajet.depart === 'haut' ? 'bas' : 'haut' })).toBe(false);
        expect(trajetDeTrameValide({ ...trajet, points: [{ x: NaN, y: 0 }, { x: 1, y: 2 }] }, trajet.positionDepart, trajet.positionArrivee)).toBe(false);
        expect(cheminDuTrajet([{ x: 1, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 8 }], { x: 0, y: 2 }, { x: 4, y: 9 }))
            .toBe('M 0 2 L 4 2 L 4 9');
    });

    it('applique et restaure en une écriture, sans perdre la campagne figée, les styles ni les positions cachées', async () => {
        const organisation = await organiserLaTrame(temoin(), undefined, { espacement: 'compact', proportions: 1.5 }, new ELK());
        const store = createStore<CampaignSlice>()(createCampaignSlice);
        const a: Campaign = { id: 'a', name: 'A', system: 'test', activeLocationIds: [], trameFigee: true,
            positionsDeLaTrame: { a: { x: 1, y: 2 } }, noeudsEpinglesDeLaTrame: { cache: { x: 3, y: 4 } },
            stylesDesLiensDeTrame: { [id]: { couleur: 'info' } } };
        const b = { ...a, id: 'b' }; store.setState({ campaigns: [a, b] });
        let ecritures = 0; store.subscribe(() => ecritures++);
        const avant = { cache: { x: 3, y: 4 }, a: { x: 1, y: 2 } };
        store.getState().organiserLeGrapheDeTrame('a', organisation, avant);
        const applique = store.getState().campaigns[0];
        expect(ecritures).toBe(1); expect(applique.trameFigee).toBe(true);
        expect(applique.noeudsEpinglesDeLaTrame?.cache).toEqual(avant.cache);
        expect(applique.stylesDesLiensDeTrame).toBe(a.stylesDesLiensDeTrame);
        expect(store.getState().campaigns[1]).toBe(b);
        store.getState().restaurerLaDispositionDeTrame('a');
        expect(ecritures).toBe(2); expect(store.getState().campaigns[0]).toEqual({ ...a, organisationDeLaTrame: undefined, dispositionPrecedenteDeTrame: undefined });
        const conserve = store.getState(); store.getState().restaurerLaDispositionDeTrame('a'); expect(store.getState()).toBe(conserve);
    });

    it('un calcul annulé ne livre pas une disposition tardive', async () => {
        const controle = new AbortController(); controle.abort();
        await expect(organiserLaTrame(temoin(), undefined, { espacement: 'compact', proportions: 1, signal: controle.signal }, new ELK()))
            .rejects.toMatchObject({ name: 'AbortError' });
    });
});
