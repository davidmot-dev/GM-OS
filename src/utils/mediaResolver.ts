import { openDB } from 'idb';
import { withTimeout } from './promiseUtils';
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
        console.log(`[MediaResolver] Resolving m- ID: ${src}...`);
        // Check cache first
        if (mediaCache.has(src)) {
             console.log(`[MediaResolver] ${src} found in cache.`);
             return mediaCache.get(src)!;
        }

        try {
            console.log(`[MediaResolver] Opening IndexedDB...`);
            const db = await withTimeout(openDB('gmos-media-db'), 3000, 'DB_TIMEOUT');
            console.log(`[MediaResolver] Fetching from DB...`);
            const item = await withTimeout(db.get('media', src), 3000, 'DB_GET_TIMEOUT');
            
            if (!item) {
                 console.log(`[MediaResolver] Item ${src} NOT FOUND in DB.`);
                 return '';
            }
            if (!item.blob) {
                 console.log(`[MediaResolver] Item ${src} found but HAS NO BLOB.`);
                 return '';
            }
            
            const blob = item.blob as Blob;
            console.log(`[MediaResolver] Blob retrieved, size: ${blob.size} bytes`);

            // NEW: Use local HTTP proxy instead of Base64 to save bandwidth
            const bridge = window.appBridge;
            if (bridge?.remote?.cacheMedia && bridge?.remote?.getConnectionInfo) {
                console.log(`[MediaResolver] Local cache export path executing for ${src}...`);
                try {
                    const info = await bridge.remote.getConnectionInfo();
                    const buffer = await blob.arrayBuffer();
                    
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const success = await (bridge.remote as any).cacheMedia(buffer, src);
                    console.log(`[MediaResolver] cacheMedia response for ${src}: ${success}`);
                    
                    if (success && info && info.ip) {
                        // The server on port 3001 serves files from the temp directory.
                        const id = src.replace('m-', '');
                        const result = `http://${info.ip}:${info.port}/temp/${id}`;
                        console.log(`[MediaResolver] Resolved ${src} to ${result}`);
                        mediaCache.set(src, result);
                        return result;
                    }
                } catch (err) {
                    console.warn('[MediaResolver] Local cache export failed:', err);
                }
            } else {
                 console.log(`[MediaResolver] Bridge cacheMedia unavailable, falling back to Base64.`);
            }

            console.log(`[MediaResolver] Falling back to Base64 read...`);
            // Fallback to Base64 for legacy support or if bridge is unavailable
            const result = await withTimeout(new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (e) => {
                     console.error(`[MediaResolver] FileReader error`, e);
                     resolve('');
                }
                reader.readAsDataURL(blob);
            }), 5000, 'FILEREADER_TIMEOUT');
            
            if (result) {
                 console.log(`[MediaResolver] Base64 created, length: ${result.length}`);
                 mediaCache.set(src, result);
            } else {
                 console.log(`[MediaResolver] Base64 returned empty.`);
            }
            return result;
        } catch (e) {
            console.error(`[MediaResolver] Error resolving ${src}`, e);
        }
        return '';
    }
    
    return src;
}
