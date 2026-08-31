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
    useImageStore.setState({
        projectionTarget: 'hub', projections: {}, imagePrecedente: {}, projectedEntity: null,
    });
    (window as unknown as { appBridge: unknown }).appBridge = {
        image: {
            syncHubData: (type: string, data: string) => { versLeHub.push({ type, data }); },
            launchDisplay: vi.fn(),
        },
    };
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
    useImageStore.setState({
        projectionTarget: 'hub', projections: {}, imagePrecedente: {}, projectedEntity: null,
    });
});

/** Une image du décor, posée comme le meneur la poserait. */
const DECOR = 'http://192.168.0.10:3001/temp/rue-sous-la-pluie.png';
/** Ce qu'il faut pour projeter une image de la bibliothèque. */
const media = (path: string) => ({ id: `m-${path}`, name: 'Décor', path, active: true });

const RACHAEL = { id: 'pnj-1', name: 'Rachael', avatar: 'http://192.168.0.10:3001/temp/rachael.png' };
const LEON = { id: 'pnj-2', name: 'Leon', avatar: 'http://192.168.0.10:3001/temp/leon.png' };

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

/**
 * **Le décor revient quand la fiche s'en va.**
 *
 * *Demandé par David le 2026-08-31, en séance :* « quand je projette un PNJ et
 * qu'il y avait une image avant, lorsque j'arrête de projeter le PNJ, l'image
 * précédente doit revenir ».
 *
 * La bascule appelait `blackout` : montrer un PNJ par-dessus le plan d'un lieu
 * coûtait le plan, et il fallait le reprojeter à la main. *Le geste « j'ai fini
 * avec cette fiche » n'est pas le geste « je veux du noir ».*
 */
describe('revenir à l’image précédente', () => {
    /** **Le test qui garde la demande de David.** */
    it('ramène l’image quand on arrête la fiche', async () => {
        await useImageStore.getState().projectSolo(media(DECOR));
        await useImageStore.getState().projectEntity(RACHAEL);
        await vi.waitFor(() => expect(versLeHub).toHaveLength(2));

        await useImageStore.getState().projectEntity(RACHAEL); // la même : on arrête

        await vi.waitFor(() => expect(versLeHub[2]).toEqual({ type: 'image', data: DECOR }));
        expect(useImageStore.getState().projections.hub).toBe(DECOR);
        expect(useImageStore.getState().projectedEntity).toBeNull();
    });

    /**
     * *Décision de David : l'image est le décor, les fiches passent devant.* Deux
     * PNJ de suite ne s'empilent pas — sans quoi revenir au plan de la scène
     * demanderait autant de gestes qu'on a montré de fiches.
     */
    it('ramène l’image, et non la fiche d’avant, après deux fiches', async () => {
        await useImageStore.getState().projectSolo(media(DECOR));
        await useImageStore.getState().projectEntity(RACHAEL);
        await useImageStore.getState().projectEntity(LEON);
        await vi.waitFor(() => expect(versLeHub).toHaveLength(3));

        await useImageStore.getState().projectEntity(LEON);

        await vi.waitFor(() => expect(versLeHub[3]).toEqual({ type: 'image', data: DECOR }));
    });

    it('éteint quand il n’y avait rien avant la fiche', async () => {
        await useImageStore.getState().projectEntity(RACHAEL);
        await vi.waitFor(() => expect(versLeHub).toHaveLength(1));

        await useImageStore.getState().projectEntity(RACHAEL);

        await vi.waitFor(() => expect(versLeHub[1]).toEqual({ type: 'image', data: '' }));
        expect(useImageStore.getState().projectedEntity).toBeNull();
    });

    /**
     * *Le noir voulu est le noir.* Un décor éteint à la main ne doit pas
     * ressusciter à la fin de la prochaine fiche, des heures plus tard.
     */
    it('oublie le décor que le meneur a éteint lui-même', async () => {
        await useImageStore.getState().projectSolo(media(DECOR));
        useImageStore.getState().blackout();
        await vi.waitFor(() => expect(versLeHub).toHaveLength(2));

        await useImageStore.getState().projectEntity(RACHAEL);
        await vi.waitFor(() => expect(versLeHub).toHaveLength(3));
        await useImageStore.getState().projectEntity(RACHAEL);

        await vi.waitFor(() => expect(versLeHub[3]).toEqual({ type: 'image', data: '' }));
    });

    /** Une image choisie pendant qu'une fiche est à l'écran devient le décor. */
    it('remplace le décor quand le meneur projette une autre image', async () => {
        const AUTRE = 'http://192.168.0.10:3001/temp/toit-du-bradbury.png';
        await useImageStore.getState().projectSolo(media(DECOR));
        await useImageStore.getState().projectEntity(RACHAEL);
        await useImageStore.getState().projectSolo(media(AUTRE));
        await vi.waitFor(() => expect(versLeHub).toHaveLength(3));

        expect(useImageStore.getState().projectedEntity).toBeNull();
        expect(useImageStore.getState().imagePrecedente.hub).toBeNull();
    });

    /** `projectEntity(null)` — la bascule de projection des paquets. */
    it('ramène le décor aussi quand la fiche est retirée par null', async () => {
        await useImageStore.getState().projectSolo(media(DECOR));
        await useImageStore.getState().projectEntity(RACHAEL);
        await vi.waitFor(() => expect(versLeHub).toHaveLength(2));

        await useImageStore.getState().projectEntity(null);

        await vi.waitFor(() => expect(versLeHub[2]).toEqual({ type: 'image', data: DECOR }));
    });
});

/**
 * **Modifier une fiche affichée la rafraîchit, elle ne l'éteint pas.**
 *
 * *Verrue trouvée le 2026-08-31 en réparant le décor.* `useFavoriteStore` rejoue
 * la projection d'un favori qu'on vient de modifier — l'intention était écrite
 * dans le code depuis toujours, « même si l'ID est identique » — mais elle
 * retombait sur la bascule : enregistrer une retouche **coupait** la projection.
 *
 * *Un commentaire ne force rien ; il dit seulement ce qu'on croyait faire.*
 */
describe('rejouer la projection d’une fiche', () => {
    it('renvoie le nouveau portrait au lieu d’arrêter', async () => {
        await useImageStore.getState().projectEntity(RACHAEL);
        await vi.waitFor(() => expect(versLeHub).toHaveLength(1));

        const retouchee = { ...RACHAEL, avatar: 'http://192.168.0.10:3001/temp/rachael-v2.png' };
        await useImageStore.getState().projectEntity(retouchee, { forcer: true });

        await vi.waitFor(() => expect(versLeHub[1]).toEqual({
            type: 'image', data: 'http://192.168.0.10:3001/temp/rachael-v2.png',
        }));
        expect(useImageStore.getState().projectedEntity?.id).toBe('pnj-1');
    });

    /** Forcer ne mange pas le décor : la fiche était déjà devant lui. */
    it('garde le décor mis de côté', async () => {
        await useImageStore.getState().projectSolo(media(DECOR));
        await useImageStore.getState().projectEntity(RACHAEL);
        await useImageStore.getState().projectEntity({ ...RACHAEL, name: 'Rachael Tyrell' }, { forcer: true });
        await vi.waitFor(() => expect(versLeHub).toHaveLength(3));

        expect(useImageStore.getState().imagePrecedente.hub).toBe(DECOR);

        await useImageStore.getState().projectEntity(RACHAEL);
        await vi.waitFor(() => expect(versLeHub[3]).toEqual({ type: 'image', data: DECOR }));
    });
});
