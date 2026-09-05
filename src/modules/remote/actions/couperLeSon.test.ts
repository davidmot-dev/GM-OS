import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Couper le son coupe les trois sources.**
 *
 * Trouvé par David en séance le 2026-09-05 : *« le bouton tout couper ne coupe
 * pas la musique et ambiant »*. Le handler n'appelait que `stopAllPads()` —
 * **les bruitages de Sound-OS et rien d'autre**.
 *
 * Le bouton s'appelait « STOP ALL SOUNDS » ; je l'avais renommé « Tout couper »
 * la veille en le promouvant dans la ligne d'état, *sans vérifier ce qu'il
 * coupait*. Il s'appelle maintenant « Couper le son ».
 */

const stopAllPads = vi.fn();
const stopMusique = vi.fn(async () => {});
const fadeOutAll = vi.fn();

vi.mock('../../sound/useSoundStore', () => ({
    useSoundStore: { getState: () => ({ stopAllPads, setMasterVolume: vi.fn() }) },
}));
vi.mock('../../music/useMusicStore', () => ({
    useMusicStore: { getState: () => ({ stopAll: stopMusique }) },
}));
vi.mock('../../ambient/useAmbientStore', () => ({
    useAmbientStore: { getState: () => ({ fadeOutAll }) },
}));

const { audioActions } = await import('./audioActions');

/** Le contexte que le répartiteur passe à tout handler. */
const CONTEXTE = { activeCampaignId: 'c-1', sync: vi.fn() };

beforeEach(() => vi.clearAllMocks());

describe('remote:sound:stop-all', () => {
    it('coupe les bruitages, la musique ET l’ambiance — le défaut du 05/09', async () => {
        await audioActions['remote:sound:stop-all']!(null, CONTEXTE);

        expect(stopAllPads).toHaveBeenCalledTimes(1);
        expect(stopMusique).toHaveBeenCalledTimes(1);
        expect(fadeOutAll).toHaveBeenCalledTimes(1);
    });

    it('le raccourci sans préfixe fait la même chose', async () => {
        await audioActions['sound:stop-all']!(null, CONTEXTE);

        expect(stopAllPads).toHaveBeenCalledTimes(1);
        expect(stopMusique).toHaveBeenCalledTimes(1);
        expect(fadeOutAll).toHaveBeenCalledTimes(1);
    });

    it('un refus de la musique n’empêche pas l’ambiance de se taire', async () => {
        /* Chacun dans son coin : sinon une seule source en panne laisserait
           tourner les deux autres, et le geste d'urgence ne serait pas fiable. */
        stopMusique.mockRejectedValueOnce(new Error('moteur absent'));

        await audioActions['remote:sound:stop-all']!(null, CONTEXTE);

        expect(fadeOutAll).toHaveBeenCalledTimes(1);
    });

    it('passe par l’action du magasin d’ambiance, pas par le moteur', () => {
        /*
          `fadeOutAll` du magasin oublie aussi le thème chargé ; appeler le
          moteur directement laisserait la ligne d'état nommer une ambiance qui
          ne joue plus.
        */
        expect(fadeOutAll).not.toHaveBeenCalled();
    });
});
