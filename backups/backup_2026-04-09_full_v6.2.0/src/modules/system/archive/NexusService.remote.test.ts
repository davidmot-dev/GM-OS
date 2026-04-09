import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NexusService } from './NexusService';
import type { NexusCampaignState } from './nexus.types';

// Mocks
vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: {
        getState: vi.fn(),
        setState: vi.fn(),
    },
}));

vi.mock('../../../stores/useMediaStore', () => ({
    useMediaStore: {
        getState: vi.fn(() => ({
            addMedia: vi.fn().mockResolvedValue('m-remote-001'),
            initDB: vi.fn().mockResolvedValue(undefined),
        })),
    },
}));

vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn(),
}));

vi.mock('../../music/useMusicStore', () => ({
    useMusicStore: {
        getState: vi.fn(() => ({
            tracks: [],
        })),
    },
}));

vi.mock('../../sound/useSoundStore', () => ({
    useSoundStore: {
        getState: vi.fn(() => ({
            soundboards: [],
        })),
    },
}));

// Mock global AudioContext
vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => ({})));
vi.stubGlobal('File', class {
    constructor() {}
});

// Mock fetch global
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('NexusService Remote Assets', () => {
    let service: NexusService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = NexusService.getInstance();
    });

    describe('scanForRemoteUrls', () => {
        it('should detect http and https URLs in a complex state', () => {
            const mockState = {
                campaign: { wallpaperUrl: 'https://example.com/wp.jpg' },
                entities: [
                    { name: 'NPC 1', avatar: 'http://mycdn.com/avatar.png' },
                    { name: 'NPC 2', avatar: 'm-local-id' }
                ],
                unused: { deeper: { url: 'https://other.com/file.png' } }
            } as unknown as NexusCampaignState;

            const urls = service.scanForRemoteUrls(mockState);
            expect(urls).toHaveLength(3);
            expect(urls).toContain('https://example.com/wp.jpg');
            expect(urls).toContain('http://mycdn.com/avatar.png');
            expect(urls).toContain('https://other.com/file.png');
        });

        it('should exclude technical domains like youtube, spotify and localhost', () => {
            const mockState = {
                campaign: { 
                    wallpaperUrl: 'https://example.com/wp.jpg',
                    yt: 'https://youtube.com/watch?v=123',
                    sp: 'https://open.spotify.com/track/456',
                    local: 'http://localhost:3000/test'
                }
            } as unknown as NexusCampaignState;

            const urls = service.scanForRemoteUrls(mockState);
            expect(urls).toHaveLength(1);
            expect(urls).toContain('https://example.com/wp.jpg');
        });
    });

    describe('downloadAndLocalize', () => {
        it('should download URLs and replace them in state with Media Hub IDs', async () => {
            const mockState = {
                campaign: { wallpaperUrl: 'https://example.com/wp.jpg' },
                entities: [
                    { name: 'NPC 1', avatar: 'https://example.com/wp.jpg' } // Same URL twice
                ]
            } as unknown as NexusCampaignState;

            const urls = ['https://example.com/wp.jpg'];
            
            // Setup fetch mock
            mockFetch.mockResolvedValue({
                ok: true,
                blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
            });

            const result = await service.downloadAndLocalize(urls, mockState);
            
            expect(mockFetch).toHaveBeenCalledWith('https://example.com/wp.jpg');
            expect(result.state.campaign.wallpaperUrl).toBe('m-remote-001');
            expect(result.state.entities[0].avatar).toBe('m-remote-001');
            expect(result.failedCount).toBe(0);
        });

        it('should keep original URL and increment failedCount in case of download failure', async () => {
            const mockState = {
                campaign: { wallpaperUrl: 'https://dead-link.com/404.jpg' }
            } as unknown as NexusCampaignState;

            const urls = ['https://dead-link.com/404.jpg'];
            
            // Setup fetch mock to fail
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            const result = await service.downloadAndLocalize(urls, mockState);
            
            expect(result.state.campaign.wallpaperUrl).toBe('https://dead-link.com/404.jpg');
            expect(result.failedCount).toBe(1);
        });
    });
});
