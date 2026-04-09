import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveToSendableUrl } from './mediaResolver';

describe('mediaResolver - resolveToSendableUrl', () => {
    beforeEach(() => {
        // Mock window.appBridge
        global.window = {
            //@ts-ignore
            appBridge: {
                remote: {
                    getConnectionInfo: vi.fn().mockResolvedValue({
                        ip: '192.168.1.50',
                        port: 3001
                    })
                }
            }
        };
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
