import type { ProjectionTarget } from '../types';
import { resolveToSendableUrl } from '../../../utils/mediaResolver';
import { useMediaStore } from '../../../stores/useMediaStore';
import { natureDuMedia } from './natureDuMedia';

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
     *
     * `marque` est **ce qu'on inscrit comme occupant la cible**, et il se
     * distingue du chemin envoyé : une entité projetée occupe le hub sous **son
     * identifiant**, pas sous l'adresse de son portrait. *C'est ce que lisent les
     * écrans pour savoir ce qui est à l'antenne ;* le confondre avec le chemin
     * ferait perdre le lien avec la fiche dès qu'on projette un PNJ.
     */
    static async projectMedia(
        mediaPath: string,
        target: ProjectionTarget,
        marque: string = mediaPath,
    ): Promise<string | null> {
        try {
            console.log(`[ImageService] Projecting ${mediaPath} to ${target}...`);
            const bridge = window.appBridge;
            console.log(`[ImageService] Bridge status:`, !!bridge, !!bridge?.image?.launchDisplay, !!bridge?.image?.syncHubData);
            
            // 🛡️ CAS LOCAL (Monitor / Player / Monitor2/3/4)
            if (target !== 'hub') {
                console.log(`[ImageService] Sending Local Projection via launchDisplay`);
                bridge?.image?.launchDisplay([mediaPath], target);
                
                (window as any).useImageStore.getState().setProjection(target, marque);
                return mediaPath;
            }

            /*
              **Un marqueur n'est pas un chemin, et ne se résout pas.**

              `__whiteboard__`, `__tactical_map__` et, depuis le 2026-09-05,
              `__youtube__<id>` désignent quoi afficher, pas où le trouver. Les
              passer au résolveur lui ferait chercher un média de ce nom et rendre
              `null` — *une projection qui échoue parce qu'on a cherché l'adresse
              d'une chose qui n'en a pas.*
            */
            if (mediaPath.startsWith('__')) {
                window.appBridge?.image?.syncHubData('image', mediaPath);
                /* Le Hub reconnaît lui-même le marqueur YouTube : il le porte
                   en clair, contrairement à une adresse résolue. */
                (window as any).useImageStore.getState().setProjection(target, marque);
                return mediaPath;
            }

            // 📡 CAS DISTANT (Hub / Tablette)
            // La tablette ne peut pas lire IndexedDB localement, on doit lui envoyer une URL résolue.
            const resolvedPath = await resolveToSendableUrl(mediaPath);
            if (resolvedPath) {
                /*
                  ⛔ **On ANNONCE la nature, parce que le Hub ne peut pas la
                  déduire — 2026-09-05.**

                  Les écrans de projection reçoivent un identifiant et vont
                  chercher le fichier : ils ont le type MIME. Le Hub, lui, reçoit
                  une adresse **déjà résolue** (`http://…/temp/m-1757…`), parce
                  qu'une tablette ne peut pas lire la base du meneur — et cette
                  adresse **n'a pas d'extension**.

                  Il rendait donc toute projection en `background-image`, ce qui
                  ne peut pas jouer un film : *la vidéo arrivait bien, et rien ne
                  s'affichait.* Trouvé par David.
                */
                const nature = natureDuMedia(mediaPath, useMediaStore.getState().mediaList);
                window.appBridge?.image?.syncHubData(nature === 'video' ? 'video' : 'image', resolvedPath);
                (window as any).useImageStore.getState().setProjection(target, marque);
                return resolvedPath;
            }

            return null;
        } catch (error) {
            console.error('[ImageService] Error projecting media:', error);
            return null;
        }
    }

    /**
     * Projette une entité (PNJ, PJ, indice, carte) **par son portrait**.
     *
     * ⛔ **Le défaut trouvé par David en pleine partie, le 2026-08-31 :** *« lorsque
     * je veux projeter l'image d'un PNJ, rien n'apparaît sur le Player Hub »*.
     *
     * Le magasin appelait `projectEntity(entity, target)` — l'entité entière, puis
     * la cible — quand cette fonction attendait `(mediaId, name)`. L'objet arrivait
     * donc là où une chaîne était attendue, `resolveToSendableUrl` faisait
     * `src.startsWith(…)` dessus, et l'exception était **avalée par le `catch`
     * ci-dessous**. Rien ne partait, rien ne se disait. Depuis le 2026-04-26.
     *
     * *Deux signatures qui se ressemblent assez pour passer la compilation grâce à
     * deux `as any` : c'est le `as any` qui a coûté quatre mois, pas la faute de
     * frappe.*
     *
     * **Et cette fonction ne refait plus le travail de `projectMedia`.** Elle en
     * dupliquait le corps à une ligne près ; le même motif que partout ailleurs
     * dans ce projet — *deux écrivains pour une même donnée finissent par
     * diverger.* Un seul chemin porte désormais la projection.
     */
    static async projectEntity(
        portrait: string | undefined,
        name: string,
        marque?: string,
    ): Promise<string | null> {
        if (!portrait) {
            console.warn(`[ImageService] ${name} n'a pas de portrait à projeter.`);
            return null;
        }
        console.log(`[ImageService] Projecting Entity: ${name} (${portrait})...`);
        const target = (window as any).useImageStore.getState().projectionTarget;
        // L'entité occupe la cible sous son identifiant, jamais sous l'adresse de
        // son portrait : c'est ce lien-là qui rattache la projection à la fiche.
        return this.projectMedia(portrait, target, marque ?? portrait);
    }

    /**
     * Efface la projection.
     */
    static async blackout(targetId?: string): Promise<void> {
        const store = (window as any).useImageStore.getState();
        const target = targetId || store.projectionTarget;
        
        console.log(`[ImageService] Blackout for ${target}...`);
        
        if (target === 'hub') {
            window.appBridge?.image?.syncHubData('image', '');
        } else {
            // Pour les écrans, on envoie launchDisplay avec un tableau vide
            window.appBridge?.image?.launchDisplay([], target);
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
