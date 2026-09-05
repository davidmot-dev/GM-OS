import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import FondProjete from './FondProjete';

/**
 * **Le fond du Hub sait jouer un film.**
 *
 * Trouvé par David le 2026-09-05 : *« la vidéo ne se lance pas sur le Player
 * Hub »*. Le Hub peignait **toute** projection en `background-image` — une image
 * de fond CSS ne peut pas jouer une vidéo. *La vidéo arrivait bien, et l'écran
 * restait vide.*
 *
 * ⚠️ Le Hub ne devine pas ce qu'il reçoit : il lui arrive une adresse résolue
 * sans extension, et le meneur lui **annonce** la nature — voir
 * [[natureDuMedia]]. D'où le drapeau plutôt qu'une détection locale.
 */

beforeEach(() => {
    // jsdom n'implémente pas la lecture ; sans cela, `play()` lève.
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
        configurable: true,
        value: vi.fn().mockResolvedValue(undefined),
    });
});

const URL_MEDIA = 'http://192.168.1.10:3001/temp/m-1757';

describe('ce que le fond dessine', () => {
    it('peint une image de fond quand ce n’est pas un film', () => {
        const { container } = render(
            React.createElement(FondProjete, { url: URL_MEDIA, estUneVideo: false }),
        );
        expect(container.querySelector('video')).toBeNull();
        expect((container.firstChild as HTMLElement).style.backgroundImage).toContain(URL_MEDIA);
    });

    it('monte un vrai lecteur quand le meneur annonce un film', () => {
        /* Le cœur du défaut : c'est cet élément qui manquait. */
        const { container } = render(
            React.createElement(FondProjete, { url: URL_MEDIA, estUneVideo: true }),
        );
        const video = container.querySelector('video');
        expect(video).not.toBeNull();
        expect(video!.getAttribute('src')).toBe(URL_MEDIA);
        expect(video!.hasAttribute('loop')).toBe(true);
    });

    it('reconnaît seul un marqueur YouTube, qui voyage en clair', () => {
        const { container } = render(
            React.createElement(FondProjete, { url: '__youtube__dQw4w9WgXcQ', estUneVideo: false }),
        );
        const cadre = container.querySelector('iframe');
        expect(cadre).not.toBeNull();
        expect(cadre!.getAttribute('src')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    });
});

describe('le son', () => {
    it('reste muet là où on ne le permet pas — les tablettes des joueurs', () => {
        /*
          ⛔ Décision du 2026-09-05 : l'écran de la table est unique, les
          tablettes sont cinq. *Cinq bandes-son décalées par le réseau ne font
          pas une ambiance, elles font du bruit.*
        */
        const { container } = render(
            React.createElement(FondProjete, { url: URL_MEDIA, estUneVideo: true }),
        );
        const video = container.querySelector('video') as HTMLVideoElement;
        expect(video.muted).toBe(true);
        expect(video.volume).toBe(0);
    });

    it('tient le niveau dicté par le meneur là où le son est permis', () => {
        const { container } = render(
            React.createElement(FondProjete, {
                url: URL_MEDIA, estUneVideo: true, avecSon: true, niveauSonore: 0.4,
            }),
        );
        const video = container.querySelector('video') as HTMLVideoElement;
        expect(video.muted).toBe(false);
        expect(video.volume).toBeCloseTo(0.4);
    });

    it('suit le niveau quand le meneur le change', () => {
        const rendu = render(
            React.createElement(FondProjete, {
                url: URL_MEDIA, estUneVideo: true, avecSon: true, niveauSonore: 1,
            }),
        );
        rendu.rerender(
            React.createElement(FondProjete, {
                url: URL_MEDIA, estUneVideo: true, avecSon: true, niveauSonore: 0.2,
            }),
        );
        const video = rendu.container.querySelector('video') as HTMLVideoElement;
        expect(video.volume).toBeCloseTo(0.2);
    });

    it('rejoue en muet si la lecture sonore est refusée, plutôt que de figer', () => {
        /*
          Un navigateur de tablette refuse la lecture automatique sonore sans
          geste de l'utilisateur, et **le refus est silencieux** : la vidéo
          resterait sur sa première image, indiscernable d'une photographie.
        */
        const play = vi.fn()
            .mockRejectedValueOnce(new Error('NotAllowedError'))
            .mockResolvedValue(undefined);
        Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });

        render(React.createElement(FondProjete, {
            url: URL_MEDIA, estUneVideo: true, avecSon: true,
        }));

        expect(play).toHaveBeenCalled();
    });
});
