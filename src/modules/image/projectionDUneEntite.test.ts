import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useImageStore, portraitDeLEntite } from './useImageStore';

/**
 * **Projeter la fiche d'un PNJ — le défaut trouvé par David en pleine partie.**
 *
 * *Le 2026-08-31, en séance : « lorsque je veux projeter l'image d'un PNJ, cela
 * ne fonctionne pas, rien n'apparaît sur le Player Hub ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA CAUSE, ET POURQUOI ELLE A TENU QUATRE MOIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le magasin appelait `ImageService.projectEntity(entity, target)` — l'entité
 * entière, puis la cible — quand le service attendait `(mediaId, name)`. L'objet
 * arrivait donc là où une chaîne était attendue ; `resolveToSendableUrl` faisait
 * `src.startsWith(…)` dessus, l'exception partait dans le `catch` du service, et
 * **rien n'était envoyé au hub**.
 *
 * Deux masques par-dessus, et c'est ce qui l'a rendue invisible si longtemps :
 *
 * 1. le service rendait `Promise<void>`, donc le magasin croyait **toujours** à
 *    un échec — il éteignait la projection et la chronique restait muette ;
 * 2. le message d'échec, `image.notifications.projectionFailed`, **n'existait
 *    dans aucune des deux langues**. Le meneur voyait une clé, ou rien.
 *
 * *Ce n'est pas la faute de frappe qui a coûté quatre mois, ce sont les deux
 * `as any` qui l'ont laissée passer la compilation.*
 */

/** Ce qui part vers le Player Hub. */
let versLeHub: { type: string; data: string }[];

beforeEach(() => {
    versLeHub = [];
    useImageStore.setState({ projectionTarget: 'hub', projections: {}, projectedEntity: null });
    (window as unknown as { appBridge: unknown }).appBridge = {
        image: {
            syncHubData: (type: string, data: string) => { versLeHub.push({ type, data }); },
            launchDisplay: vi.fn(),
        },
    };
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
    useImageStore.setState({ projectionTarget: 'hub', projections: {}, projectedEntity: null });
});

describe('le portrait d’une entité', () => {
    /**
     * Dix appelants sur onze posent `avatar` ; `SessionClueDeck` pose `imageUrl`.
     * *Lire un seul champ ferait taire un appelant, en silence.*
     */
    it('se cherche dans les trois champs qui le portent', () => {
        expect(portraitDeLEntite({ id: '1', name: 'A', avatar: 'a.png' })).toBe('a.png');
        expect(portraitDeLEntite({ id: '2', name: 'B', imageUrl: 'b.png' })).toBe('b.png');
        expect(portraitDeLEntite({ id: '3', name: 'C', portraitUrl: 'c.png' })).toBe('c.png');
    });

    it('rend « rien » quand l’entité n’en a aucun', () => {
        expect(portraitDeLEntite({ id: '4', name: 'D' })).toBeUndefined();
        // Un champ vide n'est pas un portrait : `CluesManager` pose `avatar: ''`
        // quand l'indice n'a pas de média.
        expect(portraitDeLEntite({ id: '5', name: 'E', avatar: '' })).toBeUndefined();
    });
});

describe('projeter une entité', () => {
    /** **Le test qui garde le défaut de David.** */
    it('envoie le portrait du PNJ au Player Hub', async () => {
        await useImageStore.getState().projectEntity({
            id: 'pnj-1', name: 'Rachael', avatar: 'http://192.168.0.10:3001/temp/rachael.png',
        });

        await vi.waitFor(() =>
            expect(versLeHub).toEqual([
                { type: 'image', data: 'http://192.168.0.10:3001/temp/rachael.png' },
            ]));
    });

    it('retient l’entité projetée, et ce qui occupe la cible', async () => {
        await useImageStore.getState().projectEntity({
            id: 'pnj-1', name: 'Rachael', avatar: 'http://192.168.0.10:3001/temp/rachael.png',
        });

        await vi.waitFor(() => expect(versLeHub).toHaveLength(1));
        expect(useImageStore.getState().projectedEntity?.id).toBe('pnj-1');
        expect(useImageStore.getState().projections.hub).toBe('pnj-1');
    });

    /** L'indice de `SessionClueDeck`, qui porte son image dans `imageUrl`. */
    it('sait projeter une entité dont le portrait vit dans imageUrl', async () => {
        await useImageStore.getState().projectEntity({
            id: 'indice-1', name: 'Photo froissée', imageUrl: 'http://192.168.0.10:3001/temp/photo.png',
        });

        await vi.waitFor(() =>
            expect(versLeHub).toEqual([
                { type: 'image', data: 'http://192.168.0.10:3001/temp/photo.png' },
            ]));
    });

    /**
     * *Sans portrait, on le dit — et on ne touche à rien.* Éteindre la projection
     * en cours parce qu'un PNJ n'a pas d'image punirait le meneur pour un geste
     * qui n'a rien cassé.
     */
    it('ne casse pas la projection en cours quand le PNJ n’a pas de portrait', async () => {
        useImageStore.setState({
            projectedEntity: { id: 'pnj-1', name: 'Rachael' },
            projections: { hub: 'pnj-1' },
        });

        await useImageStore.getState().projectEntity({ id: 'pnj-2', name: 'Sans visage' });

        expect(versLeHub).toEqual([]);
        expect(useImageStore.getState().projectedEntity?.id).toBe('pnj-1');
        expect(useImageStore.getState().projections.hub).toBe('pnj-1');
    });

    /** Reprojeter la même entité l'éteint — c'est la bascule du bouton. */
    it('éteint le hub quand on reprojette la même entité', async () => {
        useImageStore.setState({ projectedEntity: { id: 'pnj-1', name: 'Rachael' } });

        await useImageStore.getState().projectEntity({
            id: 'pnj-1', name: 'Rachael', avatar: 'http://192.168.0.10:3001/temp/rachael.png',
        });

        await vi.waitFor(() => expect(versLeHub).toEqual([{ type: 'image', data: '' }]));
        expect(useImageStore.getState().projectedEntity).toBeNull();
    });
});
