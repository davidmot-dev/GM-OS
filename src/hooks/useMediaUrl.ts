import { useState, useEffect } from 'react';
import { useMediaStore } from '../stores/useMediaStore';

/**
 * A hook that takes an ID or a URL and transparently returns a usable source string.
 * - If it's a regular http URL or a data: URI, it returns it directly.
 * - If it's a mediaId (starts with 'm-'), it fetches the Blob from IndexedDB,
 *   creates a temporary ObjectURL, and returns it.
 * 
 * Auto-cleans up ObjectURLs on unmount or when the source changes to prevent memory leaks.
 */
export const useMediaUrl = (sourceIdOrUrl: string | undefined): string | undefined => {
    const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(undefined);
    const { getMediaBlob } = useMediaStore();

    useEffect(() => {
        let objectUrl: string | null = null;
        let isMounted = true;

        const resolveSource = async () => {
            try {
                if (!sourceIdOrUrl || typeof sourceIdOrUrl !== 'string' || sourceIdOrUrl.trim() === '') {
                    if (isMounted) setResolvedUrl(undefined);
                    return;
                }

                // Return directly if it's already a usable URL
                if (sourceIdOrUrl.startsWith('http') || sourceIdOrUrl.startsWith('data:') || sourceIdOrUrl.startsWith('blob:')) {
                    if (isMounted) setResolvedUrl(sourceIdOrUrl);
                    return;
                }

                // Try to resolve as a media ID from the DB
                if (sourceIdOrUrl.startsWith('m-')) {
                    const blob = await getMediaBlob(sourceIdOrUrl);
                    if (blob && isMounted) {
                        objectUrl = URL.createObjectURL(blob);
                        setResolvedUrl(objectUrl);
                    } else {
                        if (isMounted) setResolvedUrl(undefined);
                    }
                } else {
                    // Unknown format, return as is (might be a local relative path during dev)
                    if (isMounted) setResolvedUrl(sourceIdOrUrl);
                }
            } catch (err) {
                console.error("[useMediaUrl] Failed to resolve source:", sourceIdOrUrl, err);
                if (isMounted) setResolvedUrl(undefined);
            }
        };

        resolveSource();

        return () => {
            isMounted = false;
            // Cleanup the blob URL to prevent memory leaks in V8
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [sourceIdOrUrl, getMediaBlob]);

    return resolvedUrl;
};
