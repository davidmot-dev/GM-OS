import type { ProjectionTarget } from '../types';
import { resolveToSendableUrl } from '../../../utils/mediaResolver';
import { useImageStore } from '../useImageStore';

/**
 * ImageService - Gère la logique métier de projection d'images.
 * 
 * 🛡️ FIABILISATION v6 :
 * - DISTINCTION LOCALE/DISTANTE : On n'envoie plus d'URLs temporaires (Blobs) au Bridge local.
 * - RÉSOLUTION LÉGÈRE : Seul le Hub (Tablette) reçoit une URL préparée (Proxy/Base64).
 */
export class ImageService {
    /**
     * Projette un média sur une cible spécifiée.
     */
    static async projectMedia(mediaPath: string, target: ProjectionTarget): Promise<string | null> {
        try {
            console.log(`[ImageService] Projecting ${mediaPath} to ${target}...`);
            const bridge = window.appBridge;
            console.log(`[ImageService] Bridge status:`, !!bridge, !!bridge?.image?.launchDisplay, !!bridge?.image?.syncHubData);
            
            // 🛡️ CAS LOCAL (Monitor / Player / Monitor2/3/4)
            if (target !== 'hub') {
                console.log(`[ImageService] Sending Local Projection via launchDisplay and syncHubData (Broadcast)`);
                bridge?.image?.launchDisplay([mediaPath], target);
                bridge?.image?.syncHubData('image', mediaPath);
                
                useImageStore.getState().setProjection(target, mediaPath);
                return mediaPath;
            }

            // 📡 CAS DISTANT (Hub / Tablette)
            // La tablette ne peut pas lire IndexedDB localement, on doit lui envoyer une URL résolue.
            const resolvedPath = await resolveToSendableUrl(mediaPath);
            if (resolvedPath) {
                window.appBridge?.image?.syncHubData('image', resolvedPath);
                useImageStore.getState().setProjection(target, mediaPath);
                return resolvedPath;
            }

            return null;
        } catch (error) {
            console.error('[ImageService] Error projecting media:', error);
            return null;
        }
    }

    /**
     * Projette une entité (PNJ/PJ) via son portrait.
     */
    static async projectEntity(mediaId: string, name: string): Promise<void> {
        try {
            console.log(`[ImageService] Projecting Entity: ${name} (${mediaId})...`);
            
            const store = useImageStore.getState();
            const target = store.projectionTarget;

            if (target !== 'hub') {
                window.appBridge?.image?.launchDisplay([mediaId], target);
                store.setProjection(target, mediaId);
            } else {
                const resolved = await resolveToSendableUrl(mediaId);
                if (resolved) {
                    window.appBridge?.image?.syncHubData('image', resolved);
                    store.setProjection(target, mediaId);
                }
            }
        } catch (error) {
            console.error('[ImageService] Error projecting entity:', error);
        }
    }

    /**
     * Efface la projection.
     */
    static async blackout(targetId?: string): Promise<void> {
        const store = useImageStore.getState();
        const target = targetId || store.projectionTarget;
        
        console.log(`[ImageService] Blackout for ${target}...`);
        
        if (target === 'hub') {
            window.appBridge?.image?.syncHubData('image', '');
        } else {
            // Pour les écrans, on envoie launchDisplay avec un tableau vide
            window.appBridge?.image?.launchDisplay([], target);
            // 📡 Broadcast de sécurité : Force le blackout sur le canal global
            window.appBridge?.image?.syncHubData('image', '');
        }
        
        store.setProjection(target, null);
    }

    /**
     * Efface toutes les projections.
     */
    static async blackoutAll(targets: string[]): Promise<void> {
        for (const target of targets) {
            await this.blackout(target);
        }
    }
}
