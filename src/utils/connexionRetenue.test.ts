import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveToSendableUrl, oublierLaConnexionRetenue } from './mediaResolver';

/**
 * **Un aller-retour IPC par diffusion, pas un par média.**
 *
 * ⛔ **Le défaut trouvé le 2026-09-22.** David, tablette connectée : *« j'ai
 * encore des saccades dans l'ambiance »*, puis *« la vidéo aussi lag »*. ⭐ **Ce
 * sont les deux ensemble qui ont donné la réponse** : quand l'audio ET la vidéo
 * souffrent, ce n'est ni l'un ni l'autre — c'est **le fil principal qui
 * sature**.
 *
 * `getLanConnection` fait un aller-retour vers le processus principal, et il
 * était attendu à **chaque** appel de `resolveToSendableUrl`, y compris sur un
 * cache plein. Or la synchronisation de la tablette résout dix familles de
 * médias **en séquence**, jusqu'à deux fois par seconde : sur une campagne de 43
 * PNJ, cela dépasse **cent allers-retours par seconde**.
 *
 * ⭐ *L'ordre reste le bon — interroger avant de croire le cache, parce que le
 * dossier temporaire du meneur a pu être vidé. Mais il n'a pas à être payé par
 * média : le dossier ne se vide pas entre deux avatars du même envoi.*
 */

const getConnectionInfo = vi.fn();

beforeEach(() => {
    vi.useFakeTimers();
    getConnectionInfo.mockReset();
    getConnectionInfo.mockResolvedValue({ ip: '192.168.1.42', port: 3002 });
    (window as unknown as { appBridge: unknown }).appBridge = {
        remote: { getConnectionInfo },
    };
    oublierLaConnexionRetenue();
});

afterEach(() => {
    vi.useRealTimers();
    delete (window as unknown as { appBridge?: unknown }).appBridge;
});

/** Un identifiant de média : c'est la branche qui interroge la connexion. */
const UN_MEDIA = 'm-1757000000';

describe('la connexion au réseau local', () => {
    it('n’est demandée qu’une fois pour toute une diffusion', async () => {
        await Promise.all([
            resolveToSendableUrl(UN_MEDIA),
            resolveToSendableUrl('m-2'),
            resolveToSendableUrl('m-3'),
        ]);

        expect(getConnectionInfo.mock.calls.length,
            'un aller-retour par média sature le fil principal').toBe(1);
    });

    /** ⚠️ Une campagne de 43 PNJ, c'est autant d'avatars dans une seule diffusion. */
    it('tient sur beaucoup de médias', async () => {
        for (let i = 0; i < 40; i++) await resolveToSendableUrl(`m-${i}`);

        expect(getConnectionInfo.mock.calls.length).toBe(1);
    });

    /**
     * ⭐ **Elle est redemandée à la diffusion suivante**, sans quoi le contrôle
     * qu'elle sert — *le dossier temporaire du meneur a-t-il été vidé ?* —
     * cesserait d'avoir lieu.
     */
    it('est redemandée à la diffusion suivante', async () => {
        await resolveToSendableUrl(UN_MEDIA);
        vi.advanceTimersByTime(1_000);
        await resolveToSendableUrl(UN_MEDIA);

        expect(getConnectionInfo.mock.calls.length).toBe(2);
    });

    /**
     * ⚠️ **Les réponses négatives se retiennent aussi.** Sans ça, une machine
     * sans réseau local paierait l'aller-retour à chaque média — c'est-à-dire
     * **le cas le plus lent pour celui qui ne s'en sert pas.**
     */
    it('retient aussi une absence de réseau', async () => {
        getConnectionInfo.mockResolvedValue({ ip: '127.0.0.1', port: 3002 });

        await resolveToSendableUrl(UN_MEDIA);
        await resolveToSendableUrl('m-2');

        expect(getConnectionInfo.mock.calls.length).toBe(1);
    });

    it('et une réponse vide', async () => {
        getConnectionInfo.mockResolvedValue(null);

        await resolveToSendableUrl(UN_MEDIA);
        await resolveToSendableUrl('m-2');

        expect(getConnectionInfo.mock.calls.length).toBe(1);
    });

    /** Ce qui n'est pas un média ne demande rien du tout. */
    it('n’est pas demandée pour une adresse déjà résolue', async () => {
        await resolveToSendableUrl('data:image/png;base64,xxx');
        await resolveToSendableUrl('https://exemple.test/image.png');

        expect(getConnectionInfo).not.toHaveBeenCalled();
    });
});
