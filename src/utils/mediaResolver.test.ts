import { describe, it, expect, vi, beforeEach } from 'vitest';

const idb = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('idb', () => ({
    openDB: vi.fn(async () => ({ get: idb.get })),
}));

const { resolveToSendableUrl } = await import('./mediaResolver');

describe('mediaResolver - resolveToSendableUrl', () => {
    beforeEach(() => {
        // Mock window.appBridge
        vi.stubGlobal('window', {
            appBridge: {
                remote: {
                    getConnectionInfo: vi.fn().mockResolvedValue({
                        ip: '192.168.1.50',
                        port: 3001
                    })
                }
            }
        });
    });

    it('should convert absolute Windows paths to proxy URLs', async () => {
        const input = 'C:\\Users\\david\\Desktop\\npc.png';
        const result = await resolveToSendableUrl(input);
        expect(result).toBe('http://192.168.1.50:3001/media/C%3A%2FUsers%2Fdavid%2FDesktop%2Fnpc.png');
    });

    it('should convert relative temp paths to proxy URLs', async () => {
        const input = 'temp/npcs/caleb.png';
        const result = await resolveToSendableUrl(input);
        expect(result).toBe('http://192.168.1.50:3001/media/temp%2Fnpcs%2Fcaleb.png');
    });

    it('should NOT convert if IP is loopback', async () => {
        //@ts-ignore
        window.appBridge.remote.getConnectionInfo.mockResolvedValue({
            ip: '127.0.0.1',
            port: 3001
        });
        const input = 'C:\\npc.png';
        const result = await resolveToSendableUrl(input);
        expect(result).toBe(input);
    });

    it('should leave web URLs as-is', async () => {
        const input = 'https://example.com/image.png';
        const result = await resolveToSendableUrl(input);
        expect(result).toBe(input);
    });
    
    it('should leave data URIs as-is', async () => {
        const input = 'data:image/png;base64,abc';
        const result = await resolveToSendableUrl(input);
        expect(result).toBe(input);
    });
});

describe('mediaResolver — médias par référence', () => {
    let cacheMedia: ReturnType<typeof vi.fn>;

    /** Identifiant distinct par test : le module mémorise ce qu'il a déjà déposé. */
    let counter = 0;
    const freshId = () => `m-${++counter}-${Date.now()}`;

    beforeEach(() => {
        cacheMedia = vi.fn().mockResolvedValue(true);
        idb.get.mockReset();
        idb.get.mockResolvedValue({ blob: new Blob(['octets'], { type: 'image/png' }) });

        vi.stubGlobal('window', {
            appBridge: {
                remote: {
                    getConnectionInfo: vi.fn().mockResolvedValue({ ip: '192.168.1.50', port: 3001 }),
                    cacheMedia,
                },
            },
        });
    });

    it('dépose le média et renvoie une référence, pas du base64', async () => {
        const id = freshId();
        const result = await resolveToSendableUrl(id);

        expect(result).toBe(`http://192.168.1.50:3001/temp/${id}`);
        expect(result.startsWith('data:')).toBe(false);
        expect(cacheMedia).toHaveBeenCalledTimes(1);
    });

    it('passe le tampon puis l\'identifiant, dans cet ordre', async () => {
        // La déclaration de type inversait ces deux arguments.
        const id = freshId();
        await resolveToSendableUrl(id);

        const [buffer, passedId] = cacheMedia.mock.calls[0];
        expect(buffer).toBeInstanceOf(ArrayBuffer);
        expect(passedId).toBe(id);
    });

    it('ne dépose qu\'une fois le même média', async () => {
        const id = freshId();
        await resolveToSendableUrl(id);
        await resolveToSendableUrl(id);
        await resolveToSendableUrl(id);

        expect(cacheMedia).toHaveBeenCalledTimes(1);
    });

    it('retombe sur le base64 si le dépôt échoue', async () => {
        cacheMedia.mockResolvedValue(false);

        const result = await resolveToSendableUrl(freshId());

        expect(result.startsWith('data:')).toBe(true);
    });

    it('retombe sur le base64 sans réseau local exploitable', async () => {
        vi.stubGlobal('window', {
            appBridge: {
                remote: {
                    getConnectionInfo: vi.fn().mockResolvedValue({ ip: '127.0.0.1', port: 3001 }),
                    cacheMedia,
                },
            },
        });

        const result = await resolveToSendableUrl(freshId());

        expect(result.startsWith('data:')).toBe(true);
        expect(cacheMedia).not.toHaveBeenCalled();
    });

    it('sert les médias sur le port du proxy, pas sur celui de l\'application', async () => {
        // En développement, getConnectionInfo renvoie le port de Vite (5173)
        // pour charger le PWA. Vite ne sert ni /temp/ ni /media/ : il répond son
        // index.html, et une image arrivant en text/html ne s'affiche pas.
        vi.stubGlobal('window', {
            appBridge: {
                remote: {
                    getConnectionInfo: vi.fn().mockResolvedValue({ ip: '192.168.0.211', port: 5173, mediaPort: 3001 }),
                    cacheMedia,
                },
            },
        });

        const id = freshId();
        expect(await resolveToSendableUrl(id)).toBe(`http://192.168.0.211:3001/temp/${id}`);
        expect(await resolveToSendableUrl('C:/medias/carte.png')).toBe(
            'http://192.168.0.211:3001/media/C%3A%2Fmedias%2Fcarte.png'
        );
    });

    it('retombe sur le port applicatif si mediaPort est absent', async () => {
        vi.stubGlobal('window', {
            appBridge: {
                remote: {
                    getConnectionInfo: vi.fn().mockResolvedValue({ ip: '192.168.0.211', port: 3001 }),
                    cacheMedia,
                },
            },
        });

        const id = freshId();
        expect(await resolveToSendableUrl(id)).toBe(`http://192.168.0.211:3001/temp/${id}`);
    });

    it('retourne une chaîne vide si le média est introuvable en base', async () => {
        idb.get.mockResolvedValue(undefined);

        expect(await resolveToSendableUrl(freshId())).toBe('');
        expect(cacheMedia).not.toHaveBeenCalled();
    });
});
