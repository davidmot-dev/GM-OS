import { useState, useCallback } from 'react';
import { useMediaStore } from '../../../stores/useMediaStore';

/**
 * Cache persistant des ObjectURLs pour éviter les fuites et le clignotement.
 */
const globalAvatarCache: Record<string, string> = {};

// Fallback avatar if resolution fails (DiceBear NPC-like avatar)
const FALLBACK_AVATAR = 'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=NPC&backgroundColor=b6e3f4';

export interface ResolvedAvatar {
    id: string;
    url: string;
}

export const useAvatarResolver = () => {
    const { getMediaBlob } = useMediaStore();
    const [resolvedAvatars, setResolvedAvatars] = useState<Record<string, string>>(globalAvatarCache);
    const [, setUpdateTrigger] = useState(0);

    const resolveAvatar = useCallback(async (id: string, path: string | undefined) => {
        // Déjà en cache ?
        if (globalAvatarCache[id]) return globalAvatarCache[id];

        if (!path) {
            globalAvatarCache[id] = FALLBACK_AVATAR;
            return FALLBACK_AVATAR;
        }

        try {
            // ID Media Hub
            if (path.startsWith('m-')) {
                const blob = await getMediaBlob(path);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    globalAvatarCache[id] = url;
                    return url;
                }
            } 
            // Chemin local
            else if (path.startsWith('C:') || path.startsWith('D:') || path.startsWith('/') || path.startsWith('\\') || path.startsWith('file:///')) {
                let cleanPath = path;
                if (path.startsWith('file:///')) {
                    // Utiliser decodeURI pour gérer les %20 et autres caractères encodés
                    cleanPath = decodeURI(path.substring(8)); 
                }
                cleanPath = cleanPath.replace(/\\/g, '/');
                const url = `gmos://media/${cleanPath}`;
                globalAvatarCache[id] = url;
                return url;
            }
            // Déjà une URL ou data:
            else if (path) {
                globalAvatarCache[id] = path;
                return path;
            }
        } catch (e) {
            console.error(`[useAvatarResolver] Error resolving avatar for ${id}:`, e);
        }

        // Fallback final
        globalAvatarCache[id] = FALLBACK_AVATAR;
        return FALLBACK_AVATAR;
    }, [getMediaBlob]);

    const resolveBatch = useCallback(async (nodes: { id: string, avatar?: string }[]) => {
        let changed = false;
        const newResolved = { ...globalAvatarCache };

        for (const node of nodes) {
            const cached = globalAvatarCache[node.id];
            // Skip if already resolved to a real URL, but re-try if it was a fallback and we have a path
            if (cached && cached !== FALLBACK_AVATAR) continue;
            if (cached === FALLBACK_AVATAR && !node.avatar) continue;
            
            const url = await resolveAvatar(node.id, node.avatar);
            if (url) {
                newResolved[node.id] = url;
                changed = true;
            }
        }

        if (changed) {
            setResolvedAvatars({ ...newResolved });
            setUpdateTrigger(v => v + 1);
        }
    }, [resolveAvatar]);

    return { resolvedAvatars, resolveAvatar, resolveBatch };
};
