import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSonDeLaVideoProjetee } from './useSonDeLaVideoProjetee';
import { useAudioMasterStore } from '../../stores/useAudioMasterStore';
import { useImageStore } from './useImageStore';

/**
 * **Le meneur dicte au projecteur le niveau de sa vidéo.**
 *
 * Une vidéo joue dans la fenêtre de projection et ne peut pas rejoindre le bus
 * audio du meneur — voir [[gainDeLaVideo]]. Ces tests gardent le seul point
 * fragile de ce montage : **l'émetteur**.
 *
 * *Un récepteur sans émetteur ne lève aucune erreur* — c'est le motif qui a
 * coûté le plus cher sur ce projet. Ici le récepteur est dans une autre
 * fenêtre : personne ne verrait jamais le silence.
 *
 * ⚠️ **Voice-OS n'est jamais importé en tête de ce fichier**, pas plus que dans
 * le crochet : il ouvrirait le cycle décrit là-bas, et les moteurs de Music-OS
 * et d'Ambient-OS perdraient leur abonnement au ducking. *Un test qui reproduit
 * le défaut qu'il surveille ne surveille rien.*
 */

/*
  ⛔ **Voice-OS est remplacé, et ce n'est pas de la commodité.**

  Charger le vrai magasin depuis ici ouvre un cycle d'imports **pré-existant** :
  `useVoiceStore` tire `modeDeContexte`, puis `useSessionOSStore`, qui construit
  les moteurs de Music-OS et d'Ambient-OS ; ceux-ci réimportent `useVoiceStore`,
  encore à moitié évalué, et **leur abonnement au ducking échoue en silence**.
  Vérifié le 2026-09-05 par une sonde de trois lignes n'important que ce magasin :
  deux rejets non gérés, sans une seule ligne de ce module en cause.

  Le sujet de ce fichier est l'émetteur du niveau sonore. *Un test qui reproduit
  un défaut étranger à son sujet mesure le défaut, pas le sujet.*
*/
interface EtatVoix {
    isDucking: boolean;
    currentEffects: { duckingRange: number };
}

const AU_REPOS: EtatVoix = { isDucking: false, currentEffects: { duckingRange: 0.3 } };

const voix = {
    etat: AU_REPOS,
    abonnes: new Set<(e: EtatVoix) => void>(),
    getState: (): EtatVoix => voix.etat,
    subscribe(rappel: (e: EtatVoix) => void): () => void {
        voix.abonnes.add(rappel);
        return () => { voix.abonnes.delete(rappel); };
    },
    setState(partiel: Partial<EtatVoix>): void {
        voix.etat = { ...voix.etat, ...partiel };
        voix.abonnes.forEach((rappel) => rappel(voix.etat));
    },
};

vi.mock('../voice/useVoiceStore', () => ({ useVoiceStore: voix }));

const envois = () => (window.appBridge!.image!.syncHubData as ReturnType<typeof vi.fn>).mock.calls
    .filter(([type]) => type === 'son-video')
    .map(([, niveau]) => Number(niveau));

/** Monte le crochet et laisse son abonnement différé s'installer. */
const monter = async () => {
    const rendu = renderHook(() => useSonDeLaVideoProjetee());
    await act(async () => { await Promise.resolve(); });
    return rendu;
};

/** Fait parler ou taire le meneur. */
const laVoix = async (parle: boolean) => {
    await act(async () => { voix.setState({ isDucking: parle }); });
};

beforeEach(() => {
    (window as unknown as { appBridge: unknown }).appBridge = {
        image: { syncHubData: vi.fn() },
    };
    useAudioMasterStore.setState({ masterVolume: 1, isFocusMode: false, focusDuckingRatio: 0.1 });
    useImageStore.setState({ volumeVideo: 1, projections: {} });
    voix.etat = AU_REPOS;
    voix.abonnes.clear();
});

describe('ce que le projecteur reçoit', () => {
    it('annonce le niveau dès le montage', async () => {
        /* Sans cet envoi initial, une fenêtre de projection ouverte après coup
           jouerait à plein volume jusqu'au prochain mouvement de curseur. */
        await monter();
        expect(envois()).toEqual([1]);
    });

    it('suit le volume général de la table', async () => {
        await monter();
        act(() => { useAudioMasterStore.setState({ masterVolume: 0.4 }); });
        expect(envois().at(-1)).toBeCloseTo(0.4);
    });

    it('se tamise en mode Focus', async () => {
        await monter();
        act(() => { useAudioMasterStore.setState({ isFocusMode: true, focusDuckingRatio: 0.2 }); });
        expect(envois().at(-1)).toBeCloseTo(0.2);
    });

    it('plonge quand le meneur parle, et remonte quand il se tait', async () => {
        await monter();
        await laVoix(true);
        expect(envois().at(-1)).toBeLessThan(1);

        await laVoix(false);
        expect(envois().at(-1)).toBe(1);
    });

    it('se tait quand le son de la table est coupé', async () => {
        await monter();
        act(() => { useAudioMasterStore.getState().basculerLaCoupure(); });
        expect(envois().at(-1)).toBe(0);
    });

    it('suit son propre curseur, celui d’Image-OS', async () => {
        await monter();
        act(() => { useImageStore.getState().setVolumeVideo(0.5); });
        expect(envois().at(-1)).toBeCloseTo(0.5);
    });

    it('ne répète pas un niveau qui n’a pas changé', async () => {
        /* Le curseur du volume émet à chaque pixel parcouru ; sans ce filtre, un
           glissement inonderait le canal qui porte aussi les projections et les
           tablettes. */
        await monter();
        const avant = envois().length;
        act(() => { useAudioMasterStore.setState({ masterVolume: 1 }); });
        expect(envois().length).toBe(avant);
    });

    it('répète le niveau quand une projection change', async () => {
        /*
          **Le point qui fait vivre ou mourir ce montage.** Une fenêtre de
          projection qui vient de naître n'a rien reçu. Si le meneur n'a touché à
          rien depuis, aucun changement de niveau ne surviendra — et la vidéo
          resterait à plein volume pour toujours. On renvoie donc à chaque
          changement de projection, même si le niveau, lui, n'a pas bougé.
        */
        await monter();
        const avant = envois().length;
        act(() => { useImageStore.setState({ projections: { monitor: 'm-1' } }); });
        expect(envois().length).toBe(avant + 1);
    });

    it('ne tombe pas là où il n’y a pas de pont Electron', async () => {
        // La tablette n'a pas de pont, et ne projette pas de vidéo.
        (window as unknown as { appBridge: unknown }).appBridge = undefined;
        await expect(monter()).resolves.toBeTruthy();
    });
});
