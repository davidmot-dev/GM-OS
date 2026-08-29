import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    refletterLesMedias, restaurerLesMedias, mediasRestituables, ID_DU_BROUILLARD,
} from './MiroirDesMedias';
import { useMediaStore, type MediaItem } from '../../../stores/useMediaStore';
import { fogDB } from '../../../utils/indexedDB';

/**
 * **Le miroir, côté rendu — ce qu'il envoie et ce qu'il NE renvoie PAS.**
 *
 * 115 images, 261 Mo mesurés le 2026-08-29. Les relire toutes à chaque
 * sauvegarde rendrait la sauvegarde de sortie impossible : elle a quatre
 * secondes. L'incrément n'est pas une optimisation, c'est ce qui rend le
 * chantier faisable.
 */

const media = (id: string, name: string, size = 1024): MediaItem => ({
    id, name, type: 'image', size, createdAt: 1, tags: [], campaignIds: [],
});

function poserLePont() {
    const copies: string[] = [];
    const envoyes: string[] = [];
    const pont = {
        mediasCopies: vi.fn(async () => copies),
        copierUnMedia: vi.fn(async (id: string, o: ArrayBuffer) => {
            envoyes.push(id);
            return { ecrit: true, octets: o.byteLength };
        }),
        inscrireAuCatalogue: vi.fn(async () => ({ statut: 'ecrit' as const, medias: 0 })),
    };
    (window as unknown as { appBridge: unknown }).appBridge = { sauvegarde: pont };
    return { pont, copies, envoyes };
}

const pontDOrigine = window.appBridge;

beforeEach(() => {
    vi.spyOn(fogDB, 'exporterTout').mockResolvedValue({});
});

afterEach(() => {
    (window as { appBridge?: unknown }).appBridge = pontDOrigine;
    vi.restoreAllMocks();
});

function poserLaBibliotheque(items: MediaItem[], blobs: Record<string, Blob | undefined> = {}) {
    useMediaStore.setState({
        mediaList: items,
        // `in` et non `??` : c'est la seule façon de dire « ce média n'a PLUS
        // d'octets », qui est précisément le cas qu'un des tests éprouve.
        getMediaBlob: async (id: string) => (id in blobs ? blobs[id] : new Blob([new Uint8Array(8)])),
    } as never);
}

describe('refletterLesMedias', () => {
    /** *L'incrément est la seule chose qui rend ce chantier possible.* */
    it('n’envoie QUE ce que le miroir n’a pas déjà', async () => {
        const { copies, envoyes } = poserLePont();
        copies.push('m-1', 'm-2');
        poserLaBibliotheque([media('m-1', 'Carte'), media('m-2', 'Bar'), media('m-3', 'Rue')]);

        const bilan = await refletterLesMedias();

        expect(envoyes, 'seule la nouveauté part').toEqual(['m-3']);
        expect(bilan.copiees).toBe(1);
    });

    it('ne renvoie rien quand tout est déjà là — le cas normal', async () => {
        const { copies, envoyes } = poserLePont();
        copies.push('m-1');
        poserLaBibliotheque([media('m-1', 'Carte')]);

        expect((await refletterLesMedias()).copiees).toBe(0);
        expect(envoyes).toEqual([]);
    });

    /**
     * **Rien ici ne doit empêcher la sauvegarde de session d'aboutir.** Une
     * image illisible, un blob disparu : chacun se compte et le passage continue.
     * *Un filet qui refuse de poser la moitié qu'il peut poser ne vaut pas mieux
     * qu'un filet absent.*
     */
    it('continue quand une image manque, et le compte', async () => {
        const { envoyes } = poserLePont();
        poserLaBibliotheque(
            [media('m-1', 'Disparue'), media('m-2', 'Bar')],
            { 'm-1': undefined },
        );

        const bilan = await refletterLesMedias();

        expect(bilan.echecs).toBe(1);
        expect(envoyes, 'la suivante part quand même').toEqual(['m-2']);
        expect(bilan.copiees).toBe(1);
    });

    it('continue quand le miroir refuse une copie', async () => {
        const { pont } = poserLePont();
        pont.copierUnMedia.mockResolvedValueOnce({ statut: 'echec', raison: 'disque plein' } as never);
        poserLaBibliotheque([media('m-1', 'Carte'), media('m-2', 'Bar')]);

        const bilan = await refletterLesMedias();
        expect(bilan.echecs).toBe(1);
        expect(bilan.copiees).toBe(1);
    });

    /**
     * Le catalogue s'écrit même quand rien n'a été copié : un renommage doit se
     * propager, sinon la restauration rendrait des fichiers portant le nom
     * qu'ils avaient il y a six mois.
     */
    it('inscrit le catalogue même sans rien copier', async () => {
        const { pont, copies } = poserLePont();
        copies.push('m-1');
        poserLaBibliotheque([media('m-1', 'Hadley Hope')]);

        await refletterLesMedias();

        expect(pont.inscrireAuCatalogue).toHaveBeenCalledTimes(1);
        const fiches = pont.inscrireAuCatalogue.mock.calls[0] as unknown as [{ name: string }[]];
        expect(fiches[0][0].name).toBe('Hadley Hope');
    });

    /** Tablette, navigateur : pas de disque à écrire, et ce n'est pas une panne. */
    it('se sait hors service sans pont', async () => {
        delete (window as { appBridge?: unknown }).appBridge;
        expect(await refletterLesMedias()).toMatchObject({ horsService: true, copiees: 0 });
    });
});

describe('le retour — sans lui le miroir n’est qu’un dossier plein d’octets', () => {
    const catalogue = {
        'm-1': { id: 'm-1', name: 'Hadley Hope', type: 'image', size: 8, copieLe: 'x', tags: ['carte'], campaignIds: ['c-7'] },
        'm-2': { id: 'm-2', name: 'Le bar', type: 'image', size: 8, copieLe: 'x' },
    };

    function poserLeRetour(octetsConnus: Record<string, ArrayBuffer | null> = {}) {
        const pont = {
            lireLeCatalogue: vi.fn(async () => catalogue),
            lireUnMedia: vi.fn(async (id: string) =>
                id in octetsConnus ? octetsConnus[id] : new Uint8Array(8).buffer),
        };
        (window as unknown as { appBridge: unknown }).appBridge = { sauvegarde: pont };
        return pont;
    }

    it('dit ce qu’il peut rendre, avant de le rendre', async () => {
        poserLeRetour();
        poserLaBibliotheque([media('m-1', 'Hadley Hope')]);
        expect(await mediasRestituables()).toEqual(['m-2']);
    });

    /**
     * **L'identifiant d'origine est conservé, et c'est tout l'enjeu.** Une carte
     * de l'atlas porte `"fileUrl": "m-<uuid>"` : remettre les octets sous un
     * identifiant neuf donnerait un disque plein et des cartes toujours mortes —
     * *le pire des résultats, parce qu'il a l'air d'une réussite.*
     */
    it('remet les médias sous leur identifiant d’origine', async () => {
        poserLeRetour();
        const rendus: string[] = [];
        poserLaBibliotheque([]);
        useMediaStore.setState({
            restaurerUnMedia: async (meta: MediaItem) => { rendus.push(meta.id); return true; },
        } as never);

        const bilan = await restaurerLesMedias();
        expect(rendus.sort()).toEqual(['m-1', 'm-2']);
        expect(bilan.rendus).toBe(2);
    });

    /** Le vivant est plus récent que la copie : l'écraser ferait du filet une perte. */
    it('n’écrase jamais un média déjà présent', async () => {
        poserLeRetour();
        poserLaBibliotheque([]);
        useMediaStore.setState({
            restaurerUnMedia: async (meta: MediaItem) => meta.id !== 'm-1',
        } as never);

        const bilan = await restaurerLesMedias();
        expect(bilan.rendus).toBe(1);
        expect(bilan.dejaLa, 'm-1 était là et n’a pas bougé').toBe(1);
    });

    it('rend les étiquettes et les campagnes avec les octets', async () => {
        poserLeRetour();
        const vus: MediaItem[] = [];
        poserLaBibliotheque([]);
        useMediaStore.setState({
            restaurerUnMedia: async (meta: MediaItem) => { vus.push(meta); return true; },
        } as never);

        await restaurerLesMedias();
        const carte = vus.find(m => m.id === 'm-1')!;
        expect(carte.tags).toEqual(['carte']);
        expect(carte.campaignIds).toEqual(['c-7']);
    });

    /** Une fiche au catalogue sans octets : on le compte, et on continue. */
    it('continue quand des octets manquent', async () => {
        poserLeRetour({ 'm-1': null });
        poserLaBibliotheque([]);
        useMediaStore.setState({ restaurerUnMedia: async () => true } as never);

        const bilan = await restaurerLesMedias();
        expect(bilan.echecs).toBe(1);
        expect(bilan.rendus, 'm-2 est passé quand même').toBe(1);
    });

    it('ne fait rien sans miroir joignable', async () => {
        delete (window as { appBridge?: unknown }).appBridge;
        expect(await restaurerLesMedias()).toMatchObject({ rendus: 0, echecs: 0 });
        expect(await mediasRestituables()).toEqual([]);
    });

    /**
     * Le brouillard se remet **clé par clé et seulement s'il manque** : le
     * remettre en bloc écraserait ce que le meneur a dévoilé depuis.
     */
    it('ne recouvre pas le brouillard déjà dévoilé', async () => {
        const pont = poserLeRetour();
        pont.lireUnMedia.mockImplementation(async (id: string) =>
            id === ID_DU_BROUILLARD
                ? new TextEncoder().encode(JSON.stringify({ 'carte-1': 'ancien', 'carte-2': 'neuf' })).buffer
                : new Uint8Array(8).buffer);

        vi.spyOn(fogDB, 'getItem').mockImplementation(async (cle: string) => (cle === 'carte-1' ? 'déjà là' : null));
        const poser = vi.spyOn(fogDB, 'setItem').mockResolvedValue(undefined);

        poserLaBibliotheque([]);
        useMediaStore.setState({ restaurerUnMedia: async () => true } as never);

        const bilan = await restaurerLesMedias();
        expect(bilan.brouillard).toBe(true);
        expect(poser).toHaveBeenCalledTimes(1);
        expect(poser.mock.calls[0][0], 'seule la carte absente est remise').toBe('carte-2');
    });
});

describe('le brouillard de guerre', () => {
    /**
     * **Copié à CHAQUE passage, contrairement aux images.** Une image ne change
     * pas ; un brouillard si — le meneur le dévoile au fil de la séance. Le
     * garder figé au premier passage archiverait une carte entièrement masquée.
     */
    it('part avec les médias', async () => {
        const { envoyes } = poserLePont();
        vi.spyOn(fogDB, 'exporterTout').mockResolvedValue({ 'carte-1': 'data:...' });
        poserLaBibliotheque([]);

        await refletterLesMedias();
        expect(envoyes).toEqual([ID_DU_BROUILLARD]);
    });

    /** Un identifiant réservé, hors de l'espace des `m-<uuid>` : rien ne le recouvre. */
    it('porte un identifiant qu’aucun média ne peut prendre', () => {
        expect(ID_DU_BROUILLARD).not.toMatch(/^m-/);
    });

    it('ne s’envoie pas quand il n’y a rien à dire', async () => {
        const { envoyes } = poserLePont();
        poserLaBibliotheque([]);
        await refletterLesMedias();
        expect(envoyes).toEqual([]);
    });

    it('ne fait pas échouer le passage quand il est illisible', async () => {
        const { envoyes } = poserLePont();
        vi.spyOn(fogDB, 'exporterTout').mockRejectedValue(new Error('base fermée'));
        poserLaBibliotheque([media('m-1', 'Carte')]);

        const bilan = await refletterLesMedias();
        expect(envoyes, 'les images sont passées').toEqual(['m-1']);
        expect(bilan.echecs).toBe(1);
    });
});
