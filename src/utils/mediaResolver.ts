import { openDB } from 'idb';
import { withTimeout } from './promiseUtils';
import { Logger } from './logger'; // Added this line
const mediaCache = new Map<string, string>();

/**
 * Resolves a media source (m-xxx ID or path) to a sendable URL.
 * For m-xxx IDs, it returns a base64 data URI.
 * For other paths, it returns them as-is.
 */
export async function resolveToSendableUrl(src: string | undefined): Promise<string> {
    if (!src) return '';
    
    // If it's already a data URI or blob URL, return as-is
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) {
        return src;
    }

    if (src.startsWith('m-')) {
        // Check cache first
        if (mediaCache.has(src)) return mediaCache.get(src)!;

        try {
            const db = await withTimeout(openDB('gmos-media-db', 2), 3000, 'DB_TIMEOUT');
            const item = await withTimeout(db.get('media', src), 3000, 'DB_GET_TIMEOUT');
            if (item?.blob) {
                const blob = item.blob as Blob;

                // NEW: Use local HTTP proxy instead of Base64 to save bandwidth
                const bridge = window.appBridge;
                if (bridge?.remote?.cacheMedia && bridge?.remote?.getConnectionInfo) {
                    try {
                        const info = await bridge.remote.getConnectionInfo();
                        const buffer = await blob.arrayBuffer();
                        const success = await (bridge.remote as any).cacheMedia(buffer, src);
                        if (success) {
                            const result = `http://${info.ip}:${info.port}/temp/${src}`;
                            mediaCache.set(src, result);
                            return result;
                        }
                    } catch (err) {
                        Logger.warn('[MediaResolver] Local cache export failed, falling back to Base64', err);
                    }
                }

                // Fallback to Base64 for legacy support or if bridge is unavailable
                const result = await withTimeout(new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => resolve('');
                    reader.readAsDataURL(blob);
                }), 5000, 'FILEREADER_TIMEOUT');
                if (result) mediaCache.set(src, result);
                return result;
            }
        } catch (e) {
            Logger.error('[MediaResolver] Could not resolve m- ID', src, e);
        }
        return '';
    }
    
    return src;
}
