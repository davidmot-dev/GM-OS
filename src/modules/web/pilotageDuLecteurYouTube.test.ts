import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import {
    commandeAuLecteur,
    poserLeNiveau,
    useNiveauDuLecteurYouTube,
    RELANCES_MS,
} from './pilotageDuLecteurYouTube';
import { adresseDIntegration } from './youtube';

/**
 * **Le volume d'une vidéo YouTube obéit à GM-OS.**
 *
 * Écrit le 2026-09-05, après avoir annoncé le contraire à David. *Ça ne l'était
 * pas.* Ce qui reste hors de portée est l'**enceinte de sortie** — `setSinkId`
 * n'a pas de prise sur un cadre distant. Le **niveau**, lui, se commande par
 * `postMessage`.
 *
 * ⚠️ Ce que ces tests prouvent : que les bons ordres partent, vers la bonne
 * origine, au bon moment. **Ils ne prouvent pas que le lecteur les applique** —
 * il vit chez YouTube, et l'envoi est sans accusé de réception. C'est pourquoi
 * l'ordre est répété, et pourquoi cela se vérifie à l'oreille.
 */

const ORIGINE = 'https://www.youtube-nocookie.com';

const faireUnCadre = () => {
    const postMessage = vi.fn();
    const cadre = { contentWindow: { postMessage } } as unknown as HTMLIFrameElement;
    return { cadre, postMessage };
};

/** Les ordres reçus, décodés, dans l'ordre. */
const ordres = (postMessage: ReturnType<typeof vi.fn>) =>
    postMessage.mock.calls.map(([corps]) => JSON.parse(corps as string));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('l’adresse du cadre', () => {
    it('ouvre l’écoute des ordres, sans quoi rien n’est pilotable', () => {
        expect(adresseDIntegration({ id: 'dQw4w9WgXcQ' })).toContain('enablejsapi=1');
    });

    it('naît muet quand on le demande, et pas autrement', () => {
        /*
          Le lecteur commence à jouer avant d'écouter : sur une table coupée, le
          laisser démarrer à plein volume ferait entrer un éclat de son que
          l'ordre suivant éteindrait une seconde trop tard.
        */
        expect(adresseDIntegration({ id: 'dQw4w9WgXcQ' }, { muet: true })).toContain('mute=1');
        expect(adresseDIntegration({ id: 'dQw4w9WgXcQ' })).not.toContain('mute=1');
    });
});

describe('les ordres envoyés', () => {
    it('ne parle qu’au lecteur, jamais à n’importe quelle origine', () => {
        const { cadre, postMessage } = faireUnCadre();
        commandeAuLecteur(cadre, 'setVolume', [50]);
        expect(postMessage.mock.calls[0][1]).toBe(ORIGINE);
    });

    it('lève la sourdine avant de poser un niveau', () => {
        /*
          ⚠️ `setVolume` seul ne suffit pas : le lecteur garde un état « muet »
          distinct du niveau. Une vidéo démarrée en sourdine — ce que nous
          faisons quand la table est coupée — resterait silencieuse même à cent.
        */
        const { cadre, postMessage } = faireUnCadre();
        poserLeNiveau(cadre, 0.4);

        expect(ordres(postMessage).map((o) => o.func)).toEqual(['unMute', 'setVolume']);
        expect(ordres(postMessage)[1].args).toEqual([40]);
    });

    it('pose la sourdine au lieu d’un volume nul', () => {
        const { cadre, postMessage } = faireUnCadre();
        poserLeNiveau(cadre, 0);
        expect(ordres(postMessage).map((o) => o.func)).toEqual(['mute']);
    });

    it('ne tombe pas sur un cadre qui n’existe pas encore', () => {
        expect(() => poserLeNiveau(null, 0.5)).not.toThrow();
    });

    it('borne un niveau absurde plutôt que de le transmettre', () => {
        const { cadre, postMessage } = faireUnCadre();
        poserLeNiveau(cadre, 4);
        expect(ordres(postMessage)[1].args).toEqual([100]);

        postMessage.mockClear();
        poserLeNiveau(cadre, Number.NaN);
        expect(ordres(postMessage)[1].args).toEqual([100]);
    });
});

describe('tenir le niveau dans la durée', () => {
    const monter = (niveau: number, actif: boolean) => {
        const { cadre, postMessage } = faireUnCadre();
        const ref = { current: cadre } as React.RefObject<HTMLIFrameElement | null>;
        const rendu = renderHook(
            ({ n, a }) => useNiveauDuLecteurYouTube(ref, n, a),
            { initialProps: { n: niveau, a: actif } },
        );
        return { postMessage, rendu };
    };

    it('répète l’ordre, parce qu’un lecteur pas encore prêt l’ignore', () => {
        /*
          **C'est la faiblesse assumée de ce montage.** Rien ne nous dit quand le
          lecteur est prêt sans monter tout l'appareillage d'événements de
          YouTube. On répète donc quelques fois — *un ordre répété quatre fois en
          deux secondes coûte moins qu'une poignée de main qu'il faut maintenir.*
        */
        const { postMessage } = monter(0.5, true);
        const auDebut = ordres(postMessage).length;

        vi.advanceTimersByTime(RELANCES_MS[RELANCES_MS.length - 1] + 10);

        expect(ordres(postMessage).length).toBeGreaterThan(auDebut);
    });

    it('suit un changement de niveau', () => {
        const { postMessage, rendu } = monter(1, true);
        postMessage.mockClear();

        rendu.rerender({ n: 0.2, a: true });

        expect(ordres(postMessage).find((o) => o.func === 'setVolume')!.args).toEqual([20]);
    });

    it('impose la sourdine là où le son n’est pas permis', () => {
        /* Les tablettes des joueurs. *Ne rien dire à un lecteur qui démarre à
           plein volume revient à autoriser le bruit.* */
        const { postMessage } = monter(1, false);
        expect(ordres(postMessage).every((o) => o.func === 'mute')).toBe(true);
    });

    it('cesse de parler une fois démonté', () => {
        const { postMessage, rendu } = monter(0.5, true);
        rendu.unmount();
        postMessage.mockClear();

        vi.advanceTimersByTime(RELANCES_MS[RELANCES_MS.length - 1] + 10);

        expect(postMessage).not.toHaveBeenCalled();
    });
});
