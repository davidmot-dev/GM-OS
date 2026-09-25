import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStoryboardStore } from './useStoryboardStore';

/**
 * **La carte d'un moment dit où elle part, si elle arrive révélée — et
 * s'en va avec lui.**
 *
 * *Demandé par David le 2026-09-25 : « lorsque je définis une carte, je
 * voudrais pouvoir dire où elle est projetée et si elle est révélée
 * entièrement ou non »*, puis : *« est-ce que si je change de moment ou
 * j'arrête le moment en cours, la projection de la carte s'arrête ? »*
 */

/** L'état de la carte, tenu par le faux magasin ci-dessous. */
interface EtatDeLaCarte {
    mapUrl: string | null;
    projectionTarget: 'hub' | 'monitor' | null;
    ecranDeLaCarte: string | null;
    projectedMapUrl: string | null;
}
let carte: EtatDeLaCarte;

/** L'ordre des gestes sur la carte — c'est lui que ces essais gardent. */
let journal: string[] = [];

/* La projection agit sur le faux magasin, comme la vraie sur le vrai. */
const projeterLaCarteSur = vi.fn((cible: string) => {
    journal.push(`projeter:${cible}`);
    carte = {
        ...carte,
        projectionTarget: cible === 'hub' ? 'hub' : 'monitor',
        ecranDeLaCarte: cible === 'hub' ? null : cible,
        projectedMapUrl: carte.mapUrl,
    };
    return true;
});

vi.mock('../map/projectionDeLaCarte', () => ({
    BROUILLARD_LEVE: 'data:image/png;base64,LEVE',
    projeterLaCarteSur: (cible: string) => projeterLaCarteSur(cible),
}));

const MOMENT = {
    id: 'm-1', name: 'Les égouts', description: '', color: '#fff', icon: 'Zap', campaignId: 'c-1',
    mapUrl: 'carte-egouts',
};

beforeEach(() => {
    journal = [];
    projeterLaCarteSur.mockClear();
    carte = { mapUrl: null, projectionTarget: null, ecranDeLaCarte: null, projectedMapUrl: null };
    (window as unknown as Record<string, unknown>).useMapStore = {
        getState: () => ({
            ...carte, mapName: null, isVideo: false,
            /* `setMap` relit IndexedDB : il rend la main **plus tard**, et
               c'est exactement ce qui piégeait un brouillard levé trop tôt. */
            setMap: async (url: string | null) => {
                await new Promise(r => setTimeout(r, 5));
                journal.push(`charger:${url}`);
                carte = { ...carte, mapUrl: url };
                if (carte.projectionTarget && url) carte = { ...carte, projectedMapUrl: url };
            },
            setFogDataUrl: async (fog: string) => { journal.push(`brouillard:${fog}`); },
            clearProjectedState: () => {
                journal.push('eteindre');
                carte = { ...carte, projectionTarget: null, ecranDeLaCarte: null, projectedMapUrl: null };
            },
        }),
        setState: (partiel: Partial<EtatDeLaCarte>) => { carte = { ...carte, ...partiel }; },
    };
    useStoryboardStore.setState({
        moments: [], activeMomentId: null, imageAvantLeMoment: null, cibleDeLImageDuMoment: null,
    });
});

afterEach(() => {
    delete (window as unknown as Record<string, unknown>).useMapStore;
});

const poser = (...moments: Record<string, unknown>[]) =>
    useStoryboardStore.setState({
        moments: moments.map((m, i) => ({ ...MOMENT, id: `m-${i + 1}`, ...m })) as never,
    });
const jouer = (id = 'm-1') => useStoryboardStore.getState().triggerMoment(id);

/** `arreterLeMoment` lance le retour sans l'attendre : on laisse passer `setMap`. */
const arreter = async () => {
    useStoryboardStore.getState().arreterLeMoment();
    await new Promise(r => setTimeout(r, 20));
};

describe('la carte d’un moment', () => {
    it('sans réglage, fait comme avant : charge la carte, sans projeter ni lever le brouillard', async () => {
        poser({});
        await jouer();
        expect(journal).toEqual(['charger:carte-egouts']);
    });

    /**
     * ⛔ **Le piège de l'ordre.** `setMap` relit le brouillard enregistré puis
     * l'écrit : lever le brouillard sans l'attendre, c'est le voir recouvert
     * aussitôt par l'ancien.
     */
    it('lève le brouillard APRÈS le chargement, jamais avant', async () => {
        poser({ mapBrouillard: 'revelee' });
        await jouer();
        expect(journal).toEqual(['charger:carte-egouts', 'brouillard:data:image/png;base64,LEVE']);
    });

    it('projette sur l’écran choisi, une fois la carte chargée et révélée', async () => {
        poser({ mapBrouillard: 'revelee', mapTarget: 'moniteur-2' });
        await jouer();
        expect(journal).toEqual([
            'charger:carte-egouts',
            'brouillard:data:image/png;base64,LEVE',
            'projeter:moniteur-2',
        ]);
    });
});

describe('la carte s’en va avec son moment', () => {
    /** **Le test qui garde la question de David.** */
    it('à l’arrêt, éteint la projection que le moment a allumée', async () => {
        poser({ mapTarget: 'moniteur-2' });
        await jouer();
        expect(carte.projectionTarget).toBe('monitor');

        await arreter();
        expect(carte.projectionTarget).toBeNull();
        expect(carte.projectedMapUrl).toBeNull();
    });

    it('au changement de moment, éteint la carte du précédent si le suivant n’en a pas', async () => {
        poser({ mapTarget: 'hub' }, { mapUrl: undefined, name: 'Sans carte' });
        await jouer('m-1');
        expect(carte.projectionTarget).toBe('hub');

        await jouer('m-2');
        expect(carte.projectionTarget).toBeNull();
        expect(carte.mapUrl).toBeNull();
    });

    /**
     * ⚠️ **On relève au premier moment d'une séquence, pas à chacun.** Sinon
     * l'arrêt rendrait la carte du moment précédent au lieu de ce que le
     * meneur avait à l'écran.
     */
    it('après une séquence de deux cartes, l’arrêt rend ce qu’il y avait AVANT la séquence', async () => {
        poser({ mapTarget: 'hub' }, { mapUrl: 'carte-crypte', mapTarget: 'moniteur-2' });
        await jouer('m-1');
        await jouer('m-2');
        expect(carte.mapUrl).toBe('carte-crypte');

        await arreter();
        expect(carte.mapUrl).toBeNull();
        expect(carte.projectionTarget).toBeNull();
    });

    /** Ce que le meneur avait allumé lui-même revient — écran compris. */
    it('rend la carte ET le moniteur que le meneur projetait avant le moment', async () => {
        carte = { mapUrl: 'carte-ville', projectionTarget: 'monitor', ecranDeLaCarte: 'moniteur-1', projectedMapUrl: 'carte-ville' };
        poser({ mapTarget: 'hub' });
        await jouer();
        expect(carte.projectionTarget).toBe('hub');

        await arreter();
        expect(carte.mapUrl).toBe('carte-ville');
        expect(carte.projectionTarget).toBe('monitor');
        expect(carte.ecranDeLaCarte).toBe('moniteur-1');
    });

    /**
     * ⛔ **Le défaut d'origine.** Une projection active sans carte, puis un
     * moment qui en charge une : `setMap(null)` au retour ne l'effaçait pas
     * chez les joueurs — `syncToPlayers` n'envoie la carte que si elle existe.
     */
    it('une projection sans carte avant le moment redevient sans carte', async () => {
        carte = { mapUrl: null, projectionTarget: 'hub', ecranDeLaCarte: null, projectedMapUrl: null };
        poser({});
        await jouer();
        expect(carte.projectedMapUrl).toBe('carte-egouts');

        await arreter();
        expect(carte.projectionTarget).toBe('hub');
        expect(carte.projectedMapUrl).toBeNull();
    });
});
