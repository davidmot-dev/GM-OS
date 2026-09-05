import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import WebLinkPad from './WebLinkPad';
import { useImageStore } from '../../image/useImageStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';

/**
 * **Choisir l'écran de sortie depuis Web-OS.**
 *
 * Demandé par David le 2026-09-05 : *« quand je lance une vidéo YouTube, je veux
 * pouvoir choisir la sortie »*. Le bouton nommait l'écran réglé **dans Image-OS**
 * sans laisser en changer : viser le second moniteur demandait de quitter ce
 * module, changer un réglage ailleurs, et revenir.
 *
 * ⭐ Le point que ces tests gardent vraiment : **choisir où part une vidéo ne
 * déplace pas la cible d'Image-OS.** *Un geste ici ne doit pas déplacer les
 * images du meneur à son insu.*
 */

const projectMedia = vi.fn().mockResolvedValue('ok');
const blackout = vi.fn().mockResolvedValue(undefined);

vi.mock('../../image/logic/ImageService', () => ({
    ImageService: {
        projectMedia: (...args: unknown[]) => projectMedia(...args),
        blackout: (...args: unknown[]) => blackout(...args),
    },
}));

const LIEN = {
    id: 'l1',
    name: 'Ouverture',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    color: 'orange',
};
const MARQUEUR = '__youtube__dQw4w9WgXcQ';

const ecran = (id: string, label: string) => ({
    id, label, bounds: { x: 0, y: 0, width: 1920, height: 1080 },
});

beforeEach(() => {
    projectMedia.mockClear();
    blackout.mockClear();
    useImageStore.setState({
        displays: [ecran('m1', 'Moniteur 1'), ecran('m2', 'Moniteur 2')],
        projections: {},
        projectionTarget: 'hub',
    });
    /*
      **Les libellés viennent du magasin du matériel, pas d'Image-OS.**
      `getDisplayLabel` lit d'abord un alias donné par le meneur, puis le libellé
      détecté ; sans quoi il rend « Écran m1 ». *Deux magasins pour un même écran :
      l'un dit qu'il existe, l'autre comment on l'appelle.*
    */
    useHardwareStore.setState({
        displays: [
            { id: 'm1', label: 'Moniteur 1', bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
            { id: 'm2', label: 'Moniteur 2', bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
        ],
        displayAliases: {},
    });
});

const poser = () => render(React.createElement(WebLinkPad, { link: LIEN, onEdit: () => {} }));

describe('le choix de l’écran', () => {
    it('propose le Player Hub et chaque moniteur détecté', () => {
        poser();
        fireEvent.click(screen.getByLabelText("Choisir l'écran de projection"));

        expect(screen.getByText('Player Hub')).toBeTruthy();
        expect(screen.getByText('Moniteur 1')).toBeTruthy();
        expect(screen.getByText('Moniteur 2')).toBeTruthy();
    });

    it('projette sur l’écran choisi, et pas sur la cible d’Image-OS', async () => {
        /*
          Le cœur de la demande : la cible d'Image-OS est `hub`, on choisit
          `Moniteur 2`, et c'est bien là que ça part.
        */
        poser();
        fireEvent.click(screen.getByLabelText("Choisir l'écran de projection"));
        fireEvent.click(screen.getByTitle('Projeter sur Moniteur 2'));

        await waitFor(() => expect(projectMedia).toHaveBeenCalledWith(MARQUEUR, 'm2'));
    });

    it('ne déplace pas la cible d’Image-OS', async () => {
        /*
          ⭐ *Choisir où part une vidéo ne doit pas déplacer les images du meneur
          à son insu.* Le raccourci tentant — poser `projectionTarget` avant de
          projeter — aurait fait qu'une vidéo envoyée sur le moniteur 2 y
          enverrait aussi la prochaine image projetée depuis Image-OS.
        */
        poser();
        fireEvent.click(screen.getByLabelText("Choisir l'écran de projection"));
        fireEvent.click(screen.getByTitle('Projeter sur Moniteur 2'));

        await waitFor(() => expect(projectMedia).toHaveBeenCalled());
        expect(useImageStore.getState().projectionTarget).toBe('hub');
    });

    it('coupe l’écran où la vidéo est déjà, au lieu de la relancer', async () => {
        useImageStore.setState({ projections: { m1: MARQUEUR } });
        poser();
        fireEvent.click(screen.getByLabelText("Choisir l'écran de projection"));
        /* Le pad porte aussi une étiquette « Moniteur 1 » ; on vise le bouton
           par son titre, qui nomme le geste et pas seulement l'écran. */
        fireEvent.click(screen.getByTitle('Couper sur Moniteur 1'));

        await waitFor(() => expect(blackout).toHaveBeenCalledWith('m1'));
        expect(projectMedia).not.toHaveBeenCalled();
    });

    it('annonce sur le pad chaque écran où la vidéo est à l’antenne', () => {
        /* Une vidéo qu'on a lancée et qu'on ne retrouve plus est une vidéo qu'on
           ne peut pas couper. */
        useImageStore.setState({ projections: { hub: MARQUEUR, m2: MARQUEUR } });
        poser();

        expect(screen.getByText('Player Hub')).toBeTruthy();
        expect(screen.getByText('Moniteur 2')).toBeTruthy();
        expect(screen.queryByText('Moniteur 1')).toBeNull();
    });

    it('n’offre aucun écran pour un lien qui n’est pas une vidéo', () => {
        render(React.createElement(WebLinkPad, {
            link: { ...LIEN, url: 'https://5thsrd.org/' },
            onEdit: () => {},
        }));
        expect(screen.queryByLabelText("Choisir l'écran de projection")).toBeNull();
    });
});
