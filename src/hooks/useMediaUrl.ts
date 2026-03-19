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
                if (sourceIdOrUrl.startsWith('http')) {
                    if (isMounted) setResolvedUrl(sourceIdOrUrl);
                    return;
                }

                // Pour les data URI très longs (Gemini), on les convertit en Blob ObjectURL
                // pour éviter les problèmes de lenteur ou de limites de taille d'URL dans Chromium
                if (sourceIdOrUrl.startsWith('data:')) {
                    try {
                        const parts = sourceIdOrUrl.split(',');
                        if (parts.length < 2) throw new Error("Format data URI invalide");
                        
                        const byteString = atob(parts[1]);
                        const mimeString = parts[0].split(':')[1].split(';')[0];
                        console.log(`[useMediaUrl] Data URI detected. Mime: ${mimeString}, Size: ${byteString.length} bytes`);

                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const blob = new Blob([ab], {type: mimeString});
                        objectUrl = URL.createObjectURL(blob);
                        console.log(`[useMediaUrl] Created Blob URL: ${objectUrl}`);
                        if (isMounted) setResolvedUrl(objectUrl);
                    } catch (e) {
                        console.warn("[useMediaUrl] Erreur conversion data URI en Blob, usage direct:", e);
                        if (isMounted) setResolvedUrl(sourceIdOrUrl);
                    }
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
                // Unknown format (local path or ID), try to format as local file URL
                const formatted = (() => {
                    if (sourceIdOrUrl.startsWith('data:') || sourceIdOrUrl.startsWith('blob:')) {
                        return sourceIdOrUrl;
                    }
                    if (window.appBridge?.utils?.formatFileUrl) {
                        return window.appBridge.utils.formatFileUrl(sourceIdOrUrl);
                    }
                    if (sourceIdOrUrl.startsWith('C:') || sourceIdOrUrl.startsWith('D:') || sourceIdOrUrl.startsWith('/') || sourceIdOrUrl.startsWith('\\')) {
                        return `file:///${sourceIdOrUrl.replace(/\\/g, '/')}`;
                    }
                    return sourceIdOrUrl;
                })();
                
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
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [sourceIdOrUrl, getMediaBlob]);

    return resolvedUrl;
};
