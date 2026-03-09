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
                    return;
                }

                // Return directly if it's already a usable URL
                if (sourceIdOrUrl.startsWith('http') || sourceIdOrUrl.startsWith('data:')) {
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
                    // Unknown format, try to format as local file URL if bridge is available
                    const formatted = window.appBridge?.utils?.formatFileUrl 
                        ? window.appBridge.utils.formatFileUrl(sourceIdOrUrl)
                        : sourceIdOrUrl;
                    if (isMounted) setResolvedUrl(formatted);
                }
            } catch (err) {
                console.error("[useMediaUrl] Failed to resolve source:", sourceIdOrUrl, err);
                if (isMounted) setResolvedUrl(undefined);
            }
        };

        resolveSource();

        return () => {
            isMounted = false;
            // Cleanup the memory and state to avoid ERR_FILE_NOT_FOUND on next render
            setResolvedUrl(undefined);
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [sourceIdOrUrl, getMediaBlob]);

    return resolvedUrl;
};
