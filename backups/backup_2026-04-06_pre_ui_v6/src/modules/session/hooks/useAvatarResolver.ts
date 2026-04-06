import { useState, useCallback } from 'react';
import { useMediaStore } from '../../../stores/useMediaStore';

/**
 * Cache persistant des ObjectURLs pour éviter les fuites et le clignotement.
 */
const globalAvatarCache: Record<string, string> = {};

export interface ResolvedAvatar {
    id: string;
    url: string;
}

export const useAvatarResolver = () => {
    const { getMediaBlob } = useMediaStore();
    const [resolvedAvatars, setResolvedAvatars] = useState<Record<string, string>>(globalAvatarCache);
    const [, setUpdateTrigger] = useState(0);

    const resolveAvatar = useCallback(async (id: string, path: string) => {
        // Déjà en cache ?
        if (globalAvatarCache[id]) return globalAvatarCache[id];

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
            else if (path.startsWith('C:') || path.startsWith('D:') || path.startsWith('/') || path.startsWith('\\')) {
                const cleanPath = path.replace(/\\/g, '/');
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
        return '';
    }, [getMediaBlob]);

    const resolveBatch = useCallback(async (nodes: { id: string, avatar: string }[]) => {
        let changed = false;
        const newResolved = { ...globalAvatarCache };

        for (const node of nodes) {
            if (!node.avatar || globalAvatarCache[node.id]) continue;
            
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
