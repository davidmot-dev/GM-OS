import type { ProjectionTarget } from '../types';
import { useImageStore } from '../useImageStore';

const imageChannel = new BroadcastChannel('gmos-image-sync');

/**
 * ImageService - Gère la logique métier de projection d'images.
 */
export class ImageService {
    /**
     * Projette un média sur une cible spécifiée.
     */
    static async projectMedia(mediaPath: string, target: ProjectionTarget): Promise<string | null> {
        try {
            console.log(`[ImageService] Projecting ${mediaPath} to ${target}...`);
            const bridge = (window as any).appBridge;
            
            if (target !== 'hub') {
                bridge?.image?.launchDisplay([mediaPath], target);
                useImageStore.getState().setProjection(target, mediaPath);
            } else {
                // Hub sync
                bridge?.image?.syncHubData?.('image', mediaPath);
                useImageStore.getState().setProjection(target, mediaPath);
            }

            // 📡 Émission BroadcastChannel pour une synchro immédiate (Tauri/Webview)
            imageChannel.postMessage({ type: 'image:sync', target, mediaPath });

            return mediaPath;

        } catch (error) {
            console.error('[ImageService] Error projecting media:', error);
            return null;
        }
    }

    /**
     * Projette une entité (PNJ/PJ) via son portrait.
     */
    static async projectEntity(entity: any, target: ProjectionTarget): Promise<string | null> {
        try {
            const avatar = entity?.portraitUrl || entity?.imageUrl || entity?.avatar;
            if (!avatar) return null;

            const bridge = (window as any).appBridge;
            if (target === 'hub') {
                bridge?.image?.syncHubData?.('entity', JSON.stringify(entity));
            } else {
                bridge?.image?.launchDisplay?.([avatar], target);
            }
            
            useImageStore.getState().setProjection(target, avatar);

            // 📡 Émission BroadcastChannel
            imageChannel.postMessage({ type: 'entity:sync', target, entity: JSON.stringify(entity) });

            return avatar;
        } catch (error) {
            console.error('[ImageService] Error projecting entity:', error);
            return null;
        }
    }

    /**
     * Efface la projection.
     */
    static async blackout(targetId?: string): Promise<void> {
        const store = useImageStore.getState();
        const target = targetId || store.projectionTarget;
        
        const bridge = (window as any).appBridge;
        if (target === 'hub') {
            bridge?.image?.syncHubData?.('image', '');
            bridge?.image?.syncHubData?.('entity', '');
        } else {
            bridge?.image?.launchDisplay?.([], target);
        }
        
        store.setProjection(target, null);

        // 📡 Émission BroadcastChannel
        imageChannel.postMessage({ type: 'image:clear', target });
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
