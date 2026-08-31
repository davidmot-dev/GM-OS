import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SortiesAudio, estLaSortieParDefaut } from './sortiesAudio';

/**
 * **Le routeur de sorties — ce qui rend « ce son sur cette enceinte » possible.**
 *
 * *Demande de David du 2026-08-31, tranchée par lui vers le vrai routage par
 * son.* `setSinkId` se pose sur un contexte ou sur un élément, jamais sur un
 * son : router deux sons du même module vers deux enceintes demande donc deux
 * voies de sortie, et c'est tout l'objet de cette classe.
 */

/** L'élément `<audio>` que jsdom fabrique n'a pas `setSinkId` : on le pose. */
let sortiesPosees: string[];

beforeEach(() => {
    sortiesPosees = [];
    Object.defineProperty(HTMLMediaElement.prototype, 'setSinkId', {
        configurable: true,
        writable: true,
        value: vi.fn(function (this: HTMLAudioElement, id: string) {
            sortiesPosees.push(id);
            return Promise.resolve();
        }),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
        configurable: true,
        writable: true,
        value: vi.fn(() => Promise.resolve()),
    });
});

const contexte = () => new AudioContext();

describe('la sortie par défaut', () => {
    it('se reconnaît sous ses trois noms', () => {
        expect(estLaSortieParDefaut('default')).toBe(true);
        expect(estLaSortieParDefaut('')).toBe(true);
        expect(estLaSortieParDefaut(undefined)).toBe(true);
        expect(estLaSortieParDefaut('enceintes-du-salon')).toBe(false);
    });

    /**
     * **Le point qui rend l'ajout sans risque** : sans sortie demandée, aucune
     * voie n'est ouverte et le moteur branche comme hier.
     */
    it('n’ouvre aucune voie', () => {
        const routeur = new SortiesAudio(contexte(), 'Essai');

        expect(routeur.canal('default')).toBeNull();
        expect(routeur.canal(undefined)).toBeNull();
        expect(routeur.canaux).toEqual([]);
    });
});

describe('une sortie nommée', () => {
    it('ouvre une voie, et la pose sur l’appareil demandé', async () => {
        const routeur = new SortiesAudio(contexte(), 'Essai');

        const canal = routeur.canal('enceintes-du-salon');

        expect(canal).not.toBeNull();
        expect(canal!.deviceId).toBe('enceintes-du-salon');
        await vi.waitFor(() => expect(sortiesPosees).toEqual(['enceintes-du-salon']));
    });

    /** Deux sons vers la même enceinte partagent la voie : une seule suffit. */
    it('n’est ouverte qu’une fois', () => {
        const routeur = new SortiesAudio(contexte(), 'Essai');

        const premier = routeur.canal('enceintes-du-salon');
        const second = routeur.canal('enceintes-du-salon');

        expect(second).toBe(premier);
        expect(routeur.canaux).toHaveLength(1);
    });

    /** C'est là tout le sujet : deux enceintes servies en même temps. */
    it('coexiste avec une autre sortie', () => {
        const routeur = new SortiesAudio(contexte(), 'Essai');

        routeur.canal('enceintes-du-salon');
        routeur.canal('casque-du-mj');

        expect(routeur.canaux.map(c => c.deviceId)).toEqual(['enceintes-du-salon', 'casque-du-mj']);
    });

    /**
     * *Un réglage qui ne vaut plus pour une partie de ce qu'on entend est pire
     * qu'un réglage absent.* La voie porte sa copie du master et du ducking pour
     * que le moteur les mène avec les siens.
     */
    it('porte de quoi suivre le volume général et le ducking', () => {
        const routeur = new SortiesAudio(contexte(), 'Essai');

        const canal = routeur.canal('enceintes-du-salon')!;

        expect(canal.entree.gain).toBeDefined();
        expect(canal.ducking.gain).toBeDefined();
        expect(canal.entree.connect).toHaveBeenCalledWith(canal.ducking);
    });

    it('se referme, et libère son élément', () => {
        const routeur = new SortiesAudio(contexte(), 'Essai');
        const canal = routeur.canal('enceintes-du-salon')!;
        document.body.appendChild(canal.element);

        routeur.fermerTout();

        expect(routeur.canaux).toEqual([]);
        expect(document.body.contains(canal.element)).toBe(false);
    });
});

describe('quand l’appareil se dérobe', () => {
    /**
     * **Un appareil disparu ne rend pas muet.** Le son sort des mauvaises
     * enceintes, ce qui s'entend et se corrige ; le silence, lui, passerait pour
     * une panne du moment.
     */
    it('garde la voie ouverte si la sortie est introuvable', async () => {
        (HTMLMediaElement.prototype as unknown as { setSinkId: unknown }).setSinkId =
            vi.fn(() => Promise.reject(new Error('NotFoundError')));
        const routeur = new SortiesAudio(contexte(), 'Essai');

        const canal = routeur.canal('enceinte-debranchee');

        expect(canal).not.toBeNull();
        await vi.waitFor(() => expect(routeur.canaux).toHaveLength(1));
    });

    /** Un navigateur sans `setSinkId` ne doit pas faire tomber le moteur. */
    it('survit à un navigateur qui ne sait pas router', () => {
        delete (HTMLMediaElement.prototype as unknown as { setSinkId?: unknown }).setSinkId;
        const routeur = new SortiesAudio(contexte(), 'Essai');

        expect(() => routeur.canal('enceintes-du-salon')).not.toThrow();
    });
});
