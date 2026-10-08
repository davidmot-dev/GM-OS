import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutEffect, useRef } from 'react';
import { act, render } from '@testing-library/react';
import AmbientTrack from './AmbientTrack';
import type { AmbientTrackState } from '../useAmbientStore';

const moteur = vi.hoisted(() => ({ niveaux: [255, 128] }));
vi.mock('../AmbientEngine', () => ({ ambientEngine: { tracks: [0, 1].map(index => ({
    getAnalyser: () => ({ getByteFrequencyData: (donnees: Uint8Array) => donnees.fill(moteur.niveaux[index]) }),
})) } }));
vi.mock('../useAmbientStore', () => ({ useAmbientStore: () => ({
    toggleTrack: vi.fn(), setTrackVolume: vi.fn(), updateTrack: vi.fn(),
}) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (cle: string) => cle }) }));

const piste: AmbientTrackState = {
    id: 'pluie', label: 'Pluie', url: 'blob:pluie', volume: 0.5, isPlaying: true, color: '#ff0000',
};
const frames = new Map<number, FrameRequestCallback>();
let suivant: number;
const demander = vi.fn<(callback: FrameRequestCallback) => number>();
const annuler = vi.fn<(id: number) => void>();
const hauteurs = (racine: HTMLElement) => Array.from(racine.querySelectorAll<HTMLElement>('.duration-75'), b => b.style.height);
function observerLeRendu(track: AmbientTrackState, index = 0, rendus: string[][] = []) {
    function Sonde({ track, index }: { track: AmbientTrackState; index: number }) {
        const ref = useRef<HTMLDivElement>(null);
        useLayoutEffect(() => { if (ref.current) rendus.push(hauteurs(ref.current)); });
        return <div ref={ref}><AmbientTrack track={track} index={index} onRequestMediaBrowser={() => {}} /></div>;
    }
    const vue = render(<Sonde track={track} index={index} />);
    return { ...vue, changer: (track: AmbientTrackState, index = 0) => vue.rerender(<Sonde track={track} index={index} />) };
}
function animer() {
    const [id, callback] = frames.entries().next().value!;
    frames.delete(id);
    act(() => callback(0));
}

beforeEach(() => {
    frames.clear(); suivant = 0;
    demander.mockReset().mockImplementation(callback => { const id = suivant++; frames.set(id, callback); return id; });
    annuler.mockReset().mockImplementation(id => { frames.delete(id); });
    vi.stubGlobal('requestAnimationFrame', demander);
    vi.stubGlobal('cancelAnimationFrame', annuler);
});
afterEach(() => vi.unstubAllGlobals());

describe('le visualiseur de piste', () => {
    it('reste au minimum sans boucle quand la piste est arrêtée', () => {
        const vue = observerLeRendu({ ...piste, isPlaying: false });
        expect(hauteurs(vue.container)).toEqual(Array(16).fill('15%'));
        expect(demander).not.toHaveBeenCalled();
    });

    it('échantillonne la piste et éteint les barres dès le premier rendu à l’arrêt', () => {
        const rendus: string[][] = [];
        const vue = observerLeRendu(piste, 0, rendus);
        animer();
        expect(hauteurs(vue.container)).toEqual(Array(16).fill('100%'));
        rendus.length = 0;
        vue.changer({ ...piste, isPlaying: false });
        expect(rendus).toEqual([Array(16).fill('15%')]);
        expect(frames.size).toBe(0);
    });

    it('reprend au minimum jusqu’au nouvel échantillon', () => {
        const vue = observerLeRendu(piste);
        animer();
        vue.changer({ ...piste, isPlaying: false });
        vue.changer(piste);
        expect(hauteurs(vue.container)).toEqual(Array(16).fill('15%'));
        animer();
        expect(hauteurs(vue.container)).toEqual(Array(16).fill('100%'));
    });

    it('ne montre pas la mesure de la piste précédente en changeant de canal', () => {
        const vue = observerLeRendu(piste);
        animer();
        vue.changer(piste, 1);
        expect(hauteurs(vue.container)).toEqual(Array(16).fill('15%'));
        animer();
        const attendu = `${(128 / 255) * 100}%`;
        expect(hauteurs(vue.container)).toEqual(Array(16).fill(attendu));
    });

    it('garde la mesure et la boucle quand seule la couleur change', () => {
        const vue = observerLeRendu(piste);
        animer();
        const demandes = demander.mock.calls.length;
        vue.changer({ ...piste, color: '#00ff00' });
        expect(hauteurs(vue.container)).toEqual(Array(16).fill('100%'));
        expect(vue.container.querySelector<HTMLElement>('.duration-75')?.style.backgroundColor).toBe('rgb(0, 255, 0)');
        expect(demander).toHaveBeenCalledTimes(demandes);
    });

    it('annule aussi la frame zéro et empêche un rappel tardif de réarmer la boucle', () => {
        const vue = observerLeRendu(piste);
        const ancienRappel = frames.get(0)!;
        vue.unmount();
        expect(annuler).toHaveBeenCalledExactlyOnceWith(0);
        act(() => ancienRappel(0));
        expect(demander).toHaveBeenCalledOnce();
        expect(frames.size).toBe(0);
    });
});
