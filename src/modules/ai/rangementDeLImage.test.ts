import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Une image fabriquée ne doit jamais repartir dans l'état persisté.**
 *
 * ⛔ Mesuré le 2026-09-18 dans la sauvegarde automatique : sur 2 746 Ko,
 * **2 078 Ko étaient deux images en base64** — un indice à 1 250 Ko, l'avatar
 * d'un PNJ à 828 Ko. Les quatre fournisseurs de `generateImage` jetaient
 * l'identifiant rendu par `addMedia` et se rabattaient en silence sur une data
 * URI, que les appelants nommaient `mediaId` et persistaient.
 *
 * Ces essais gardent les trois sorties possibles, et surtout **celle qui
 * n'existe plus**.
 */

const media = { addMedia: vi.fn(), getState: () => media };
const session = { activeCampaignId: 'c1', getState: () => session };

vi.mock('../../stores/useMediaStore', () => ({ useMediaStore: media }));
vi.mock('../session/useSessionOSStore', () => ({ useSessionOSStore: session }));

const {
    rangerLImageFabriquee, ErreurDeRangement, estUneImageEnLigne, octetsDuBase64,
} = await import('./rangementDeLImage');

const uneImage = () => ({
    octets: new Uint8Array([1, 2, 3, 4]),
    nomDeFichier: 'portrait.png',
    mimeType: 'image/png',
    etiquettes: ['AI Generated', 'Test'],
});

beforeEach(() => {
    vi.clearAllMocks();
    session.activeCampaignId = 'c1';
    (window as unknown as { appBridge?: unknown }).appBridge = undefined;
});

describe('ranger une image fabriquée', () => {
    it('rend l’identifiant du Media Hub, et lui passe la campagne ouverte', async () => {
        media.addMedia.mockResolvedValue('m-neuf');

        await expect(rangerLImageFabriquee(uneImage())).resolves.toBe('m-neuf');

        const [fichier, etiquettes, campagnes] = media.addMedia.mock.calls[0];
        expect(fichier.name).toBe('portrait.png');
        expect(etiquettes).toEqual(['AI Generated', 'Test']);
        expect(campagnes).toEqual(['c1']);
    });

    it('range sans campagne quand aucune n’est ouverte', () => {
        // Une image sans campagne vaut mieux qu'une image sans entrée.
        session.activeCampaignId = null as unknown as string;
        media.addMedia.mockResolvedValue('m-neuf');

        return rangerLImageFabriquee(uneImage()).then(() => {
            expect(media.addMedia.mock.calls[0][2]).toEqual([]);
        });
    });

    it('retombe sur le disque si le Hub échoue, et le dit', async () => {
        media.addMedia.mockRejectedValue(new Error('base fermée'));
        const saveAvatar = vi.fn().mockResolvedValue('C:/avatars/portrait.png');
        (window as unknown as { appBridge: unknown }).appBridge = { npc: { saveAvatar } };
        const dit = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(rangerLImageFabriquee(uneImage())).resolves.toBe('C:/avatars/portrait.png');

        /* La dégradation se dit : le fichier survit à la fermeture, mais il
           n'entrera pas dans le miroir des médias. */
        expect(dit.mock.calls.some(c => String(c[0]).includes('miroir'))).toBe(true);
        dit.mockRestore();
    });

    it('⛔ LÈVE au lieu de rendre une data URI quand tout échoue', async () => {
        media.addMedia.mockRejectedValue(new Error('base fermée'));
        // Pas de pont : c'était exactement le cas qui produisait le mégaoctet.
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(rangerLImageFabriquee(uneImage())).rejects.toBeInstanceOf(ErreurDeRangement);
    });

    it('lève aussi quand le Hub rend un identifiant vide', async () => {
        // `addMedia` qui rend une chaîne vide est un échec silencieux : sans ce
        // cas, on écrirait `''` dans un champ d'image.
        media.addMedia.mockResolvedValue('');
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(rangerLImageFabriquee(uneImage())).rejects.toBeInstanceOf(ErreurDeRangement);
    });
});

describe('reconnaître une image collée', () => {
    it('ne prend que les URL de données', () => {
        expect(estUneImageEnLigne('data:image/png;base64,AAAA')).toBe(true);
        expect(estUneImageEnLigne('m-1234')).toBe(false);
        expect(estUneImageEnLigne('C:/images/a.png')).toBe(false);
        expect(estUneImageEnLigne(undefined)).toBe(false);
    });

    it('décode le base64 en octets', () => {
        expect([...octetsDuBase64(btoa('abc'))]).toEqual([97, 98, 99]);
    });
});

/**
 * ⭐ **Le contrôle qui empêche le repli de revenir.**
 *
 * Les trois essais au-dessus gardent le comportement du rangement. Celui-ci
 * garde `AIService` : un `return \`data:…\`` réintroduit dans `generateImage`
 * remettrait un mégaoctet dans l'état persisté sans qu'aucun autre essai ne
 * rougisse — *le défaut d'origine ne faisait échouer rien du tout, il rendait
 * une image parfaitement valide.*
 */
describe('le service d’IA ne rend plus jamais l’image elle-même', () => {
    it('n’a plus aucun repli en data URI', async () => {
        const source = (await import('./AIService.ts?raw')).default as string;
        /* ⚠️ Sans ce témoin, une lecture qui rend une chaîne vide ferait passer
           l'essai au vert pour la pire raison — il ne garderait plus rien. */
        expect(source, 'la source d’AIService n’a pas été lue').toContain('generateImage');

        const replis = source.match(/return\s+`data:/g) ?? [];
        expect(replis, 'un repli en data URI est revenu dans AIService').toEqual([]);
    });
});
