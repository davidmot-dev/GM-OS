import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UlanziService } from './UlanziService';
import { useUlanziStore } from './useUlanziStore';

/**
 * **L'écran noir du 2026-08-30 — le défaut le plus coûteux de ce module.**
 *
 * David, après le premier essai en conditions : *« l'écran reste noir et je
 * n'arrive pas à faire un reset malgré un reboot »*. Relevé sur l'appareil :
 * `TIM/HUM/TEMP/BAT` tous à `false`, et `/api/loop` **vide**. L'afficheur
 * n'était pas en panne — il n'avait **rien à afficher**, et un redémarrage n'y
 * pouvait rien : ces réglages vivent en flash.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA CAUSE, ET POURQUOI ELLE REND L'APPAREIL IRRÉCUPÉRABLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `prendreLaMain` fabrique la routine **en relisant les réglages de
 * l'appareil**. Elle n'est donc vraie qu'au premier contact. Une seconde prise —
 * GM-OS relancé pendant une séance ouverte, rechargement à chaud, changement
 * d'hôte — relit un appareil **déjà muet** et mémorise « tout était éteint ».
 * La restitution n'a alors plus rien à rendre, et efface la routine en partant.
 *
 * *Une sauvegarde qu'on réécrit avec l'état qu'elle servait à réparer n'est plus
 * une sauvegarde.*
 *
 * Deux réparations, à deux étages, et ces tests gardent les deux.
 */

const ETEINT = { ATIME: 7, TIM: false, HUM: false, TEMP: false, BAT: false };
const ALLUME = { ATIME: 7, TIM: true, HUM: true, TEMP: true, BAT: true };

describe('la routine ne se mémorise qu’une fois', () => {
    beforeEach(() => useUlanziStore.setState({ routine: null }));

    it('enregistre la première, qui a vu l’appareil intact', () => {
        useUlanziStore.getState().memoriserLaRoutine(ALLUME);
        expect(useUlanziStore.getState().routine).toEqual(ALLUME);
    });

    /** **Le test qui garde l'écran noir de David.** */
    it('refuse d’écraser avec ce qu’un appareil déjà muet renvoie', () => {
        useUlanziStore.getState().memoriserLaRoutine(ALLUME);
        useUlanziStore.getState().memoriserLaRoutine(ETEINT);

        expect(useUlanziStore.getState().routine).toEqual(ALLUME);
    });

    /** Elle ne s'efface qu'à une restitution réussie — et alors on repart à zéro. */
    it('se remémorise après avoir été rendue', () => {
        useUlanziStore.getState().memoriserLaRoutine(ALLUME);
        useUlanziStore.getState().setRoutine(null);
        useUlanziStore.getState().memoriserLaRoutine(ETEINT);

        expect(useUlanziStore.getState().routine).toEqual(ETEINT);
    });
});

/* ────────────────────────── Le filet, un étage plus bas ────────────────────── */

/** Ce que l'appareil répond, et ce qu'on lui a envoyé. */
let reglagesDeLAppareil: Record<string, unknown>;
let envois: { url: string; method: string; body?: unknown }[];

beforeEach(() => {
    reglagesDeLAppareil = { ATIME: 7, TIM: false, HUM: false, TEMP: false, BAT: false };
    envois = [];
    (window as unknown as { appBridge: unknown }).appBridge = {
        ulanzi: {
            request: vi.fn(async (url: string, method: string, body?: unknown) => {
                envois.push({ url, method, body });
                if (method === 'GET' && url.includes('/api/settings')) return reglagesDeLAppareil;
                return 'OK';
            }),
        },
    };
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

const reglagesEcrits = () =>
    envois.filter(e => e.method === 'POST' && e.url.includes('/api/settings')).map(e => e.body);
const aRedemarre = () => envois.some(e => e.url.includes('/api/reboot'));

describe('rendre la main', () => {
    it('remet ce qui était allumé, et redémarre', async () => {
        await new UlanziService('appareil.local').rendreLaMain(ALLUME, ['gmos_quarts']);

        expect(reglagesEcrits()).toEqual([{ TIM: true, HUM: true, TEMP: true, BAT: true }]);
        // Écrire sans redémarrer laisserait l'afficheur amputé jusqu'à sa
        // prochaine coupure de courant — c'est-à-dire ne pas rendre du tout.
        expect(aRedemarre()).toBe(true);
    });

    /**
     * **Le filet.** Une routine « tout éteint » est indiscernable d'une routine
     * empoisonnée, et l'asymétrie est brutale : une horloge qui revient alors
     * qu'on l'avait coupée, contre un afficheur noir toute la nuit.
     */
    it('ne croit pas une routine qui prétend que tout était éteint', async () => {
        await new UlanziService('appareil.local').rendreLaMain(ETEINT, ['gmos_quarts']);

        expect(reglagesEcrits()).toEqual([{ TIM: true, HUM: true, TEMP: true, BAT: true }]);
        expect(aRedemarre()).toBe(true);
    });

    it('rend les valeurs d’usine quand on ne sait plus ce qu’on a pris', async () => {
        await new UlanziService('appareil.local').rendreLaMain(null, ['gmos_quarts']);

        expect(reglagesEcrits()).toEqual([{ TIM: true, HUM: true, TEMP: true, BAT: true }]);
    });

    /**
     * Le meneur avait lui-même coupé la météo : on ne la lui rallume pas. Le
     * filet ci-dessus ne se déclenche que si **tout** était éteint, cas où la
     * routine ne dit plus rien d'utile.
     */
    it('respecte une extinction partielle voulue par le meneur', async () => {
        await new UlanziService('appareil.local')
            .rendreLaMain({ ATIME: 7, TIM: true, HUM: false, TEMP: false, BAT: true }, []);

        expect(reglagesEcrits()).toEqual([{ TIM: true, BAT: true }]);
    });

    /** Rien à rendre : on n'inflige pas dix secondes d'écran noir pour rien. */
    it('ne redémarre pas quand il n’y a rien à remettre', async () => {
        reglagesDeLAppareil = { ATIME: 7, TIM: true, HUM: true, TEMP: true, BAT: true };
        await new UlanziService('appareil.local').rendreLaMain(ALLUME, ['gmos_quarts']);

        expect(reglagesEcrits()).toEqual([]);
        expect(aRedemarre()).toBe(false);
    });

    it('retire le widget avant de rendre les réglages', async () => {
        await new UlanziService('appareil.local').rendreLaMain(ALLUME, ['gmos_quarts']);

        expect(envois[0].url).toContain('/api/custom?name=gmos_quarts');
        expect(envois[0].body).toEqual({});
    });
});
