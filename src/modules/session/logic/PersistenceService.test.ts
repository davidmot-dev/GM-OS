import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Régression de la perte de campagnes du 2026-08-07.
 *
 * Une fenêtre secondaire écrivait sa charge réduite sous la clé de la fenêtre
 * MJ. Au démarrage à froid suivant, la charge lue n'avait pas de `campaigns`,
 * la fusion de Zustand laissait les mocks d'initialisation en place, et le MJ
 * les persistait par-dessus les vraies données.
 */

const role = vi.hoisted(() => ({ current: 'gm' as string }));

vi.mock('../../../utils/windowRole', () => ({
    getWindowRole: () => role.current,
    isMainWindow: () => role.current === 'gm',
}));

const setItemSpy = vi.hoisted(() => vi.fn());
const removeItemSpy = vi.hoisted(() => vi.fn());
const backing = vi.hoisted(() => new Map<string, string>());
const panne = vi.hoisted(() => ({ enLecture: false }));

vi.mock('./idbStorage', () => ({
    idbStateStorage: {
        getItem: async (name: string) => {
            if (panne.enLecture) throw new Error('IndexedDB indisponible');
            return backing.get(name) ?? null;
        },
        setItem: async (name: string, value: string) => {
            setItemSpy(name, value);
            backing.set(name, value);
        },
        removeItem: async (name: string) => {
            removeItemSpy(name);
            backing.delete(name);
        },
    },
    onPersistedStateChanged: () => () => { /* pas d'abonnement en test */ },
}));

const { PersistenceService, SESSION_STORE_KEY, lEcritureEstOuverte, __refermerLEcriturePourTests } =
    await import('./PersistenceService');
const { viderLesEcrituresDifferees } = await import('../../../utils/ecritureReserveeAuMJ');

/** Le stockage tel que Zustand le reçoit, une fois `createJSONStorage` déballé. */
const storage = (PersistenceService.storage as unknown as {
    getItem: (n: string) => Promise<unknown>;
    setItem: (n: string, v: unknown) => Promise<void>;
    removeItem: (n: string) => Promise<void>;
});

const ETAT_REEL = JSON.stringify({
    state: { campaigns: [{ id: 'c-1774865486579', name: 'Anges de Feu' }] },
    version: 10,
});

/**
 * La séquence réelle de Zustand : il lit le magasin, puis annonce la fin de la
 * relecture. C'est cette annonce, et elle seule, qui ouvre l'écriture.
 */
async function relire(): Promise<void> {
    await storage.getItem(SESSION_STORE_KEY);
    (PersistenceService.onRehydrateStorage as never as () => (s: unknown, e?: unknown) => void)()(undefined);
}

beforeEach(async () => {
    role.current = 'gm';
    panne.enLecture = false;
    /*
      ⚠️ **Le tampon d'écriture différée est un singleton de module** : ce qu'un
      essai y laisse en attente, le suivant le **relit** — `getItem` sert ce qui
      attend avant d'aller au disque, et c'est voulu. Sans cette purge, la
      relecture ci-dessous ne toucherait pas le stockage mimé et la garde
      resterait fermée, pour une raison qui n'a rien à voir avec ce qu'on teste.
    */
    viderLesEcrituresDifferees();
    backing.clear();
    setItemSpy.mockClear();
    removeItemSpy.mockClear();
    __refermerLEcriturePourTests();
    await relire(); // le cas courant : la base a été relue. La garde a son propre bloc plus bas.
    setItemSpy.mockClear();
});

describe('PersistenceService — seule la fenêtre MJ écrit', () => {
    it('la fenêtre MJ écrit', async () => {
        await storage.setItem(SESSION_STORE_KEY, { state: { campaigns: [] }, version: 10 });
        /* L'écriture est différée de 250 ms depuis le 2026-09-18 : un essai qui
           lit le disque exige que le disque soit à jour, sans connaître le délai. */
        viderLesEcrituresDifferees();
        expect(setItemSpy).toHaveBeenCalledOnce();
    });

    it.each(['hub', 'projector', 'tablet', 'remote'])(
        "la fenêtre '%s' n'écrit pas",
        async (secondaire) => {
            role.current = secondaire;
            await storage.setItem(SESSION_STORE_KEY, { state: { currentView: 'world-atlas' }, version: 10 });
            expect(setItemSpy).not.toHaveBeenCalled();
        },
    );

    it("une fenêtre secondaire n'efface pas la clé", async () => {
        role.current = 'hub';
        await storage.removeItem(SESSION_STORE_KEY);
        expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('une fenêtre secondaire lit toujours la base partagée', async () => {
        backing.set(SESSION_STORE_KEY, ETAT_REEL);
        role.current = 'hub';
        expect(await storage.getItem(SESSION_STORE_KEY)).toEqual(JSON.parse(ETAT_REEL));
    });

    it("l'état du MJ survit à l'ouverture d'une fenêtre secondaire", async () => {
        backing.set(SESSION_STORE_KEY, ETAT_REEL);

        // Le Hub s'ouvre, sélectionne une vue, navigue : autant d'écritures.
        role.current = 'hub';
        for (const vue of ['world-atlas', 'combat', 'whiteboard']) {
            await storage.setItem(SESSION_STORE_KEY, { state: { currentView: vue }, version: 10 });
        }

        expect(backing.get(SESSION_STORE_KEY)).toBe(ETAT_REEL);
    });
});

/**
 * Régression de la **seconde** perte de campagnes, le 2026-08-24.
 *
 * Le correctif du 07/08 ne fermait que les fenêtres secondaires. La fenêtre MJ,
 * elle, pouvait écrire avant la fin de sa relecture — et ce qu'elle avait alors
 * en mémoire, c'étaient les mocks. IndexedDB se lisant de façon asynchrone, la
 * fenêtre existe vraiment : au démarrage, et à chaque rechargement à chaud.
 */
describe('PersistenceService — on n’écrit pas avant d’avoir lu', () => {
    const MOCKS = { state: { campaigns: [{ id: 'c-1', name: 'The Eternal Quest' }] }, version: 10 };

    beforeEach(() => {
        __refermerLEcriturePourTests();
        setItemSpy.mockClear();
    });

    it('le MJ n’écrit pas tant que la base n’a pas été relue', async () => {
        backing.set(SESSION_STORE_KEY, ETAT_REEL);

        await storage.setItem(SESSION_STORE_KEY, MOCKS);

        expect(setItemSpy).not.toHaveBeenCalled();
        expect(backing.get(SESSION_STORE_KEY)).toBe(ETAT_REEL);
        expect(lEcritureEstOuverte()).toBe(false);
    });

    it('il n’efface pas non plus la clé', async () => {
        backing.set(SESSION_STORE_KEY, ETAT_REEL);
        await storage.removeItem(SESSION_STORE_KEY);
        expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it('l’écriture s’ouvre dès que la relecture est annoncée', async () => {
        backing.set(SESSION_STORE_KEY, ETAT_REEL);
        await relire();

        expect(lEcritureEstOuverte()).toBe(true);
        await storage.setItem(SESSION_STORE_KEY, { state: { campaigns: [] }, version: 10 });
        viderLesEcrituresDifferees();
        expect(setItemSpy).toHaveBeenCalledOnce();
    });

    it('une base vide se lit très bien — c’est un premier démarrage', async () => {
        await relire();
        expect(lEcritureEstOuverte()).toBe(true);
    });

    /**
     * Le cas qui distingue cette garde d'un simple drapeau d'hydratation : la
     * relecture s'est *terminée*, mais elle a échoué. Zustand annonce quand même
     * la fin. Ouvrir l'écriture ici, c'est écraser la base avec les mocks.
     */
    it('une lecture en échec laisse l’écriture fermée, définitivement', async () => {
        const erreur = vi.spyOn(console, 'error').mockImplementation(() => { /* attendu */ });
        backing.set(SESSION_STORE_KEY, ETAT_REEL);
        panne.enLecture = true;

        // Zustand lit — la lecture échoue — puis annonce la fin de la relecture.
        await expect(storage.getItem(SESSION_STORE_KEY)).resolves.toBeNull();
        (PersistenceService.onRehydrateStorage as never as () => (s: unknown, e?: unknown) => void)()(
            undefined, new Error('IndexedDB indisponible'),
        );

        expect(lEcritureEstOuverte()).toBe(false);
        await storage.setItem(SESSION_STORE_KEY, MOCKS);
        expect(backing.get(SESSION_STORE_KEY)).toBe(ETAT_REEL);
        expect(erreur).toHaveBeenCalled();
        erreur.mockRestore();
    });

    it('la garde du rôle reste indépendante de celle-ci', async () => {
        await relire();
        role.current = 'hub';
        await storage.setItem(SESSION_STORE_KEY, MOCKS);
        expect(setItemSpy).not.toHaveBeenCalled();
    });
});

/**
 * ⭐ **L'écriture différée du magasin de session — 2026-09-18.**
 *
 * Zustand appelle `setItem()` à chaque `set()`, et les tranches de ce magasin en
 * comptent 163. Le gain est réel, mais il ouvre trois questions, et chacune a
 * son essai ici — *un tampon posé devant la couche qui a déjà perdu les
 * campagnes deux fois ne se juge pas sur son bénéfice.*
 */
describe('PersistenceService — une seule écriture par fenêtre', () => {
    it('agglutine cent modifications en une seule écriture', async () => {
        for (let i = 0; i < 100; i++) {
            await storage.setItem(SESSION_STORE_KEY, { state: { campaigns: [{ id: `c${i}` }] }, version: 10 });
        }
        expect(setItemSpy).not.toHaveBeenCalled();

        viderLesEcrituresDifferees();
        expect(setItemSpy).toHaveBeenCalledOnce();
        // Et c'est la DERNIÈRE valeur qui atterrit, pas la première.
        expect(setItemSpy.mock.calls[0][1]).toContain('c99');
    });

    /*
      ⛔ **Le filet de fermeture, prouvé et pas supposé.** Ce magasin n'écrit pas
      dans `localStorage` : il ne peut pas passer par `stockageLocalDuMJ`, donc
      son inscription au registre est un geste séparé — et un geste séparé
      s'oublie. Sans lui, jusqu'à 250 ms d'écritures disparaîtraient à la
      fermeture, en silence, visibles seulement au démarrage suivant.
    */
    it('est inscrit au registre que la fermeture vide', async () => {
        await storage.setItem(SESSION_STORE_KEY, { state: { campaigns: [{ id: 'c-tardive' }] }, version: 10 });

        // `viderLesEcrituresDifferees` est exactement ce que `beforeunload`,
        // `pagehide` et `visibilitychange` appellent.
        viderLesEcrituresDifferees();

        expect(setItemSpy).toHaveBeenCalledOnce();
        expect(backing.get(SESSION_STORE_KEY)).toContain('c-tardive');
    });

    /*
      ⛔ **La garde porte AVANT le tampon.** Un tampon qui accepte une écriture
      interdite la sert ensuite en lecture : une fenêtre secondaire qui se
      réhydrate y relirait sa propre vue partielle, et c'est le mécanisme de la
      perte du 2026-08-07. *Ce qui n'a pas le droit d'être écrit n'a pas le droit
      d'être lu comme s'il l'avait été.*
    */
    it('⛔ une écriture refusée n’est pas servie en lecture pendant la fenêtre', async () => {
        backing.set(SESSION_STORE_KEY, ETAT_REEL);
        role.current = 'hub';

        await storage.setItem(SESSION_STORE_KEY, { state: { currentView: 'combat' }, version: 10 });

        // Le Hub relit AVANT que la fenêtre de 250 ms ne se referme.
        expect(await storage.getItem(SESSION_STORE_KEY)).toEqual(JSON.parse(ETAT_REEL));
        viderLesEcrituresDifferees();
        expect(setItemSpy).not.toHaveBeenCalled();
        expect(backing.get(SESSION_STORE_KEY)).toBe(ETAT_REEL);
    });

    it('⛔ et rien n’est mis en attente avant que la base ait été relue', async () => {
        __refermerLEcriturePourTests();
        backing.set(SESSION_STORE_KEY, ETAT_REEL);

        // Les données de démonstration : exactement ce qu'une écriture prématurée
        // écraserait par-dessus la vraie base.
        await storage.setItem(SESSION_STORE_KEY, {
            state: { campaigns: [{ id: 'c-1', name: 'The Eternal Quest' }] }, version: 10,
        });

        // Ni en attente, ni sur le disque, ni servie en lecture.
        expect(await storage.getItem(SESSION_STORE_KEY)).toEqual(JSON.parse(ETAT_REEL));
        viderLesEcrituresDifferees();
        expect(setItemSpy).not.toHaveBeenCalled();
    });
});

describe('PersistenceService — partialize', () => {
    it('persiste toujours les campagnes, quel que soit le rôle', () => {
        const etat = {
            campaigns: [{ id: 'c-1774865486579' }],
            currentView: 'world-atlas',
        } as never;

        for (const r of ['gm', 'hub', 'projector']) {
            role.current = r;
            expect(PersistenceService.partialize!(etat)).toHaveProperty('campaigns');
        }
    });
});
