import { useState, useEffect } from 'react';
import { useMediaStore } from '../stores/useMediaStore';
import { AppBridge } from '../bridge/AppBridge';

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

                // Optimization: If the source matches the already resolved URL (e.g. data URI already proxied), skip
                if (sourceIdOrUrl === resolvedUrl) {
                    return;
                }

                if (sourceIdOrUrl.includes('m-') || sourceIdOrUrl.includes('temp/')) {
                    console.log(`[useMediaUrl] Resolving media: "${sourceIdOrUrl.substring(0, 50)}${sourceIdOrUrl.length > 50 ? '...' : ''}"`);
                }

                // Return directly if it's already a usable URL
                if (sourceIdOrUrl.startsWith('http') || sourceIdOrUrl.startsWith('gmos://') || sourceIdOrUrl.startsWith('blob:')) {
                    if (isMounted) setResolvedUrl(sourceIdOrUrl);
                    return;
                }

                // Root-relative paths (e.g. /assets/decks/...) or plain relative paths
                // that don't match any other prefix - return as-is for Electron/browser to resolve
                if (sourceIdOrUrl.startsWith('/') || 
                    sourceIdOrUrl.startsWith('assets/') || 
                    sourceIdOrUrl.startsWith('./')) {
                    if (isMounted) setResolvedUrl(sourceIdOrUrl);
                    return;
                }

                // Pour les data URI : conversion en Blob URL via fetch() (non-bloquant, rapide)
                // ⚠️ Ne PAS utiliser atob() : bloque le thread UI pour les gros fichiers (50MB+)
                if (sourceIdOrUrl.startsWith('data:')) {
                    try {
                        const mimeMatch = sourceIdOrUrl.match(/^data:([^;]+)/);
                        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
                        
                        // Pour les vidéos : le `<video>` gère les DataURL nativement.
                        // Pas besoin de Blob URL — évite une copie mémoire inutile.
                        if (mime.startsWith('video/')) {
                            if (isMounted) setResolvedUrl(sourceIdOrUrl);
                            return;
                        }

                        // Pour les images : fetch() est non-bloquant (vs atob qui gèle l'UI)
                        const response = await fetch(sourceIdOrUrl);
                        const blob = await response.blob();
                        objectUrl = URL.createObjectURL(blob);
                        console.log(`[useMediaUrl] Created Blob URL from data URI (${mime}): ${objectUrl}`);
                        if (isMounted) setResolvedUrl(objectUrl);
                    } catch (e) {
                        console.warn('[useMediaUrl] Erreur conversion data URI, usage direct:', e);
                        if (isMounted) setResolvedUrl(sourceIdOrUrl);
                    }
                    return;
                }


                // Try to resolve as a media ID from the DB
                if (sourceIdOrUrl.startsWith('m-')) {
                    // 1ère tentative : Zustand MediaStore (MJ window, déjà chargé en mémoire)
                    const blob = await getMediaBlob(sourceIdOrUrl);
                    if (blob) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            if (isMounted) {
                                const base64data = reader.result as string;
                                setResolvedUrl(base64data);
                            }
                        };
                        reader.onerror = () => {
                            console.error('[useMediaUrl] Erreur FileReader:', reader.error);
                            if (isMounted) setResolvedUrl(undefined);
                        };
                        reader.readAsDataURL(blob);
                        return;
                    }

                    // 2ème tentative : IndexedDB partagée (Hub/Projector window)
                    // resolveToSendableUrl lit directement depuis gmos-media-db (même origine Tauri)
                    // C'est le cas quand le Hub essaie de résoudre un m-xxx que seul le MJ a chargé en Zustand.
                    try {
                        const { resolveToSendableUrl } = await import('../utils/mediaResolver');
                        const dataUrl = await resolveToSendableUrl(sourceIdOrUrl);
                        if (dataUrl && isMounted) {
                            setResolvedUrl(dataUrl);
                            return;
                        }
                    } catch (e) {
                        console.warn('[useMediaUrl] IndexedDB fallback failed for:', sourceIdOrUrl, e);
                    }

                    // FAILSAFE: Appareil distant (tablette sans appBridge) → proxy HTTP
                    if (!window.appBridge) {
                        const host = window.location.hostname;
                        const remoteUrl = `http://${host}:3001/temp/${sourceIdOrUrl}`;
                        console.log(`[useMediaUrl] Remote failsafe: resolving ${sourceIdOrUrl} to ${remoteUrl}`);
                        if (isMounted) setResolvedUrl(remoteUrl);
                        return;
                    }

                    if (isMounted) setResolvedUrl(undefined);

                } else {
                // Unknown format (local path or ID), try to format as local file URL
                const formatted = (() => {
                    if (sourceIdOrUrl.startsWith('data:') || sourceIdOrUrl.startsWith('blob:')) {
                        return sourceIdOrUrl;
                    }
                    
                    // MJ App (Electron or Tauri)
                    if (AppBridge.utils.hasSupport) {
                        return AppBridge.utils.formatFileUrl(sourceIdOrUrl);
                    }
                    
                    // Remote device (tablet/player hub) - use the media proxy on port 3001
                    const host = window.location.hostname;
                    const cleanPath = sourceIdOrUrl.replace(/^(file:\/\/\/|gmos:\/\/media\/)/i, '');
                    const isTemp = cleanPath.startsWith('temp/') || cleanPath.startsWith('m-');
                    const endpoint = isTemp ? 'temp' : 'media';
                    const finalCleanPath = isTemp ? cleanPath.replace('temp/', '') : cleanPath;
                    
                    return `http://${host}:3001/${endpoint}/${encodeURIComponent(finalCleanPath.replace(/\\/g, '/'))}`;
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
            // Add a small delay for revocation to give the browser time to finish any pending internal requests
            if (objectUrl) {
                const urlToRevoke = objectUrl;
                setTimeout(() => {
                    URL.revokeObjectURL(urlToRevoke);
                }, 1000);
            }
        };
    }, [sourceIdOrUrl]); // Removed getMediaBlob to prevent redundant cycles if the store is unstable

    return resolvedUrl;
};
