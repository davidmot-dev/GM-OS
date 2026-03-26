import { useMediaStore } from '../stores/useMediaStore';
import { useNPCStore } from '../modules/npc/useNPCStore';
import { useImageStore } from '../modules/image/useImageStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useCombatStore } from '../modules/combat/useCombatStore';
import { useSoundStore } from '../modules/sound/useSoundStore';
import { useMusicStore } from '../modules/music/useMusicStore';
import { useAmbientStore } from '../modules/ambient/useAmbientStore';

export class MediaCleanupService {
    private static instance: MediaCleanupService;

    private isCleaning = false;

    private constructor() {}

    public static getInstance(): MediaCleanupService {
        if (!MediaCleanupService.instance) {
            MediaCleanupService.instance = new MediaCleanupService();
        }
        return MediaCleanupService.instance;
    }

    /**
     * Scans all stores for media references and deletes orphans from IndexedDB.
     * @returns The number of deleted items.
     */
    public async performCleanup(): Promise<{ deletedCount: number; savedBytes: number }> {
        if (this.isCleaning) {
            console.log("[MediaCleanupService] Cleanup already in progress, skipping.");
            return { deletedCount: 0, savedBytes: 0 };
        }
        
        this.isCleaning = true;
        try {
            const mediaStore = useMediaStore.getState();
        await mediaStore.initDB();
        
        const allMedia = mediaStore.mediaList;
        if (allMedia.length === 0) return { deletedCount: 0, savedBytes: 0 };

        const referencedIds = new Set<string>();

        // 1. collect references from NPC Store
        const npcStore = useNPCStore.getState();
        if (npcStore.currentEntity?.avatar) this.collectId(npcStore.currentEntity.avatar, referencedIds);
        npcStore.savedEntities.forEach((e) => {
            if (e.avatar) this.collectId(e.avatar, referencedIds);
        });

        // 2. collect references from Image Store
        const imageStore = useImageStore.getState();
        imageStore.mediaList.forEach((m) => {
            this.collectId(m.id, referencedIds);
            this.collectId(m.path, referencedIds);
        });
        Object.values(imageStore.projections).forEach((id) => {
            if (typeof id === 'string') this.collectId(id, referencedIds);
        });

        // 3. collect references from SessionOS Store
        const sessionStore = useSessionOSStore.getState();
        sessionStore.campaigns.forEach((c) => {
            if (c.wallpaperUrl) this.collectId(c.wallpaperUrl, referencedIds);
        });
        sessionStore.entities.forEach((e) => {
            if (e.avatar) this.collectId(e.avatar, referencedIds);
        });
        sessionStore.players?.forEach((p) => {
            p.characters?.forEach((c) => {
                if (c.portraitUrl) this.collectId(c.portraitUrl, referencedIds);
                if (c.tokenUrl) this.collectId(c.tokenUrl, referencedIds);
            });
        });
        sessionStore.atlasMaps?.forEach((m) => {
            if (m.fileUrl) this.collectId(m.fileUrl, referencedIds);
        });
        sessionStore.wikiEntries?.forEach((w) => {
            w.imageUrls?.forEach((url: string) => this.collectId(url, referencedIds));
        });

        // 4. collect references from Combat Store
        const combatStore = useCombatStore.getState();
        combatStore.combatants.forEach((c) => {
            if (c.avatar) this.collectId(c.avatar, referencedIds);
        });

        // 5. collect references from Sound Store
        const soundStore = useSoundStore.getState();
        soundStore.atmospheres.forEach((a) => {
            Object.values(a.pads).forEach((p) => {
                const pad = p as { filePath?: string };
                if (pad.filePath) this.collectId(pad.filePath, referencedIds);
            });
        });

        // 6. collect references from Music Store
        const musicStore = useMusicStore.getState();
        musicStore.playlists.forEach((playlist) => {
            playlist.pads.forEach((pad) => {
                if (pad.url) this.collectId(pad.url, referencedIds);
            });
        });

        // 7. collect references from Ambient Store
        const ambientStore = useAmbientStore.getState();
        ambientStore.presets.forEach((preset) => {
            preset.tracks.forEach((track) => {
                if (track.url) this.collectId(track.url, referencedIds);
            });
        });
        ambientStore.tracks.forEach((track) => {
            if (track.url) this.collectId(track.url, referencedIds);
        });

        // 8. Identify and delete orphans
        let deletedCount = 0;
        let savedBytes = 0;

        for (const media of allMedia) {
            if (!referencedIds.has(media.id) && !media.isPersistent) {
                console.log(`[MediaCleanup] Deleting orphan media: ${media.name} (${media.id})`);
                savedBytes += media.size;
                await mediaStore.deleteMedia(media.id);
                deletedCount++;
            } else if (media.isPersistent && !referencedIds.has(media.id)) {
                console.log(`[MediaCleanup] Sparing persistent orphan: ${media.name} (${media.id})`);
            }
        }

            return { deletedCount, savedBytes };
        } finally {
            this.isCleaning = false;
        }
    }

    private collectId(value: string | undefined, set: Set<string>) {
        if (!value) return;
        if (value.startsWith('m-')) {
            set.add(value);
        }
    }
}

export const mediaCleanupService = MediaCleanupService.getInstance();
