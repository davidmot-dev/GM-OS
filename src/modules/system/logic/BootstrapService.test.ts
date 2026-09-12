import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * **Le démarrage aboutit, quoi qu'il arrive — § 1 bis, ligne fermée le 2026-09-12.**
 *
 * ⛔ `etapesDuDemarrage.test.ts` garde la mécanique ; celui-ci garde **le
 * branchement**. C'est une distinction qui a déjà coûté à ce dépôt : *une garde
 * qui vit dans un module et que personne n'appelle est une promesse sans code.*
 *
 * La seule assertion qui compte vraiment tient en une ligne — **`isSystemReady`
 * est posé même quand tout échoue** —, parce que c'est exactement ce que
 * l'ancien `catch` refusait de faire, et que l'application restait alors sur
 * `GM-OS BOOTING...` sans porte de sortie.
 */

/*
  ⚠️ `vi.mock` est hissé en tête de fichier : une variable déclarée au-dessus
  n'existe pas encore quand sa fabrique s'exécute. `vi.hoisted` monte avec elle.
*/
const faux = vi.hoisted(() => ({
    setSystemReady: vi.fn(),
    initDB: vi.fn<() => Promise<void>>(),
    syncIA: vi.fn<() => Promise<void>>(),
    syncHue: vi.fn<() => Promise<void>>(),
    startWatching: vi.fn(),
    recenser: vi.fn<() => Promise<void>>(),
    gmToast: vi.fn(),
    /** L'état que `initDB` laisse derrière elle — elle avale ses propres erreurs. */
    media: { erreur: null as string | null },
}));

vi.mock('../../../store/useSessionStore', () => ({
    useSessionStore: { getState: () => ({ setSystemReady: faux.setSystemReady }) },
}));
vi.mock('../../../stores/useMediaStore', () => ({
    useMediaStore: { getState: () => ({ initDB: faux.initDB, error: faux.media.erreur }) },
}));
vi.mock('../../../stores/useAIStore', () => ({
    useAIStore: { getState: () => ({ syncWithKeychain: faux.syncIA }) },
}));
vi.mock('../../light/useLightStore', () => ({
    useLightStore: { getState: () => ({ syncWithKeychain: faux.syncHue }) },
}));
vi.mock('../../map/SpatialTriggerService', () => ({
    spatialTriggerService: { startWatching: faux.startWatching },
}));
vi.mock('../../image/useImageStore', () => ({
    useImageStore: { getState: () => ({ clearActiveProjections: vi.fn() }) },
}));
vi.mock('../../map/useMapStore', () => ({
    useMapStore: { getState: () => ({ resetProjectionState: vi.fn() }) },
}));
vi.mock('../../../stores/useToastStore', () => ({ gmToast: faux.gmToast }));
vi.mock('../../../stores/useHardwareStore', () => ({
    useHardwareStore: { getState: () => ({ recenserLeMateriel: faux.recenser }) },
}));

const { setSystemReady, initDB, syncIA, syncHue, startWatching, gmToast } = faux;

import { BootstrapService } from './BootstrapService';
import { useDemarrageStore } from '../useDemarrageStore';

/** Le drapeau « déjà fait » est un statique privé : chaque test repart neuf. */
function remettreAZero() {
    (BootstrapService as unknown as { isInitialized: boolean }).isInitialized = false;
    useDemarrageStore.setState({ etapeEnCours: null, rendus: [], rapport: null });
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    faux.media.erreur = null;
    initDB.mockResolvedValue(undefined);
    syncIA.mockResolvedValue(undefined);
    syncHue.mockResolvedValue(undefined);
    faux.recenser.mockResolvedValue(undefined);
    remettreAZero();
});
afterEach(() => { vi.useRealTimers(); });

/** Mène le démarrage jusqu'au bout en laissant filer tous les délais. */
async function demarrer(): Promise<void> {
    const fini = BootstrapService.bootstrap();
    await vi.advanceTimersByTimeAsync(120_000);
    await fini;
}

describe('un démarrage sain', () => {
    it('mène les cinq étapes et déclare le système prêt', async () => {
        await demarrer();

        expect(initDB).toHaveBeenCalled();
        expect(syncIA).toHaveBeenCalled();
        expect(syncHue).toHaveBeenCalled();
        expect(startWatching).toHaveBeenCalled();
        expect(faux.recenser, 'le matériel de table n’a pas été recensé').toHaveBeenCalled();
        expect(setSystemReady).toHaveBeenCalledWith(true);
    });

    it('et ne dit rien au meneur — il n’y a rien à signaler', async () => {
        await demarrer();

        expect(gmToast).not.toHaveBeenCalled();
        expect(useDemarrageStore.getState().rapport?.degrade).toBe(false);
    });

    it('ne se rejoue pas une seconde fois', async () => {
        await demarrer();
        await demarrer();

        expect(initDB).toHaveBeenCalledTimes(1);
    });
});

describe('⛔ un démarrage empêché — le défaut du 2026-09-12', () => {
    /*
      **LE TEST DE LA LIGNE.** Les trois attentes muettes, ensemble : c'est la
      forme exacte du blocage (`openDB` qui ne résout jamais, un `Promise.all`
      qui ne rend rien). Avant le correctif, `setSystemReady` n'était jamais
      atteint et l'interface n'avait plus aucun moyen d'apparaître.
    */
    it('trois étapes muettes ne retiennent plus l’interface', async () => {
        const jamais = () => new Promise<void>(() => { /* jamais */ });
        initDB.mockImplementation(jamais);
        syncIA.mockImplementation(jamais);
        syncHue.mockImplementation(jamais);

        await demarrer();

        expect(setSystemReady, 'l’interface est restée bloquée').toHaveBeenCalledWith(true);
    });

    /* Et une étape muette n'emporte pas les suivantes : les services de fond
       démarrent quand même. */
    it('et la suite des étapes passe quand même', async () => {
        initDB.mockImplementation(() => new Promise<void>(() => {}));

        await demarrer();

        expect(startWatching).toHaveBeenCalled();
    });

    it('une exception ne laisse plus le système mort', async () => {
        syncIA.mockRejectedValue(new Error('coffre verrouillé'));

        await demarrer();

        expect(setSystemReady).toHaveBeenCalledWith(true);
    });

    /*
      ⚠️ **Le contrepoids obligatoire.** On a remplacé un blocage visible par un
      démarrage amputé : sans ce mot au meneur, on aurait fabriqué une panne
      muette — et *une panne muette se découvre en séance.*
    */
    it('mais le meneur est prévenu, et l’étape est nommée', async () => {
        syncHue.mockRejectedValue(new Error('coffre verrouillé'));

        await demarrer();

        expect(gmToast).toHaveBeenCalledTimes(1);
        expect(gmToast.mock.calls[0][0]).toContain('Trousseau Hue');
        expect(gmToast.mock.calls[0][0]).toContain('coffre verrouillé');
    });

    /*
      ⛔ `initDB` avale sa propre exception, pose `isInitialized: true` et laisse
      la liste vide : **une lecture ratée se présente comme une médiathèque
      vide**. Le service relit `error` pour refuser cette fausse réussite.
    */
    it('une médiathèque en panne n’est pas une médiathèque vide', async () => {
        faux.media.erreur = 'Failed to initialize Media Database.';

        await demarrer();

        const media = useDemarrageStore.getState().rapport?.etapes
            .find(e => e.nom === 'Médiathèque');

        expect(media?.etat, 'la panne est passée pour une réussite').toBe('echouee');
        expect(gmToast.mock.calls[0][0]).toContain('Médiathèque');
    });
});

describe('ce que l’écran d’attente peut montrer', () => {
    it('le nom de l’étape en cours, pendant qu’elle dure', async () => {
        let libere: () => void = () => {};
        initDB.mockImplementation(() => new Promise<void>(r => { libere = r; }));

        const fini = BootstrapService.bootstrap();
        await vi.advanceTimersByTimeAsync(0);

        expect(useDemarrageStore.getState().etapeEnCours).toBe('Médiathèque');

        libere();
        await vi.advanceTimersByTimeAsync(120_000);
        await fini;
    });

    it('puis plus rien, une fois le démarrage conclu', async () => {
        await demarrer();

        expect(useDemarrageStore.getState().etapeEnCours).toBeNull();
        expect(useDemarrageStore.getState().rendus).toHaveLength(5);
    });
});
