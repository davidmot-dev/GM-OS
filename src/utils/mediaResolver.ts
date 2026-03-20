import { openDB } from 'idb';
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
            const db = await openDB('gmos-media-db', 1);
            const item = await db.get('media', src);
            if (item?.blob) {
                const blob = item.blob as Blob;
                const result = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => resolve('');
                    reader.readAsDataURL(blob);
                });
                if (result) mediaCache.set(src, result);
                return result;
            }
        } catch (e) {
            console.error('[MediaResolver] Could not resolve m- ID:', src, e);
        }
        return '';
    }
    
    return src;
}
