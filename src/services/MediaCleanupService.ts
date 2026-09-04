import { useMediaStore, type MediaItem } from '../stores/useMediaStore';
import { usagesDesMedias, type UsageDunMedia } from './proprietairesDesMedias';

/** Un média que plus personne ne retient. */
export interface MediaOrphelin {
    media: MediaItem;
    /** Vrai s'il est verrouillé — orphelin, mais épargné par le nettoyage. */
    protege: boolean;
}

/** Ce qu'un nettoyage supprimerait, avant de le faire. */
export interface ApercuDuNettoyage {
    /** Les orphelins non protégés — ceux qui partiraient. */
    aSupprimer: MediaOrphelin[];
    /** Les orphelins verrouillés — listés pour la revue, jamais supprimés. */
    epargnes: MediaOrphelin[];
    /** Octets récupérés si l'on confirme. */
    octets: number;
    /**
     * Faux si un module n'a pas pu être interrogé. **Le nettoyage refuse alors
     * d'agir** : ses médias passeraient pour orphelins.
     */
    fiable: boolean;
    modulesEnEchec: string[];
}

export class MediaCleanupService {
    private static instance: MediaCleanupService;

    private isCleaning = false;

    private constructor() {}

    public static getInstance(): MediaCleanupService {
        if (!MediaCleanupService.instance) {
            MediaCleanupService.instance = new MediaCleanupService();
        }
        return MediaCleanupService.instance;
    }

    /**
     * **Dit ce qui serait supprimé, sans rien supprimer.**
     *
     * Le bouton de nettoyage effaçait d'un clic, sans confirmation, et
     * annonçait le compte **après**. Une suppression de masse irréversible
     * derrière un seul clic, sur une base dont on a découvert le 2026-09-04
     * qu'elle avait six angles morts. *Ce qu'on ne peut pas défaire, on doit au
     * moins pouvoir le regarder d'abord.*
     */
    public async apercu(): Promise<ApercuDuNettoyage> {
        const mediaStore = useMediaStore.getState();
        await mediaStore.initDB();

        const { usages, complet, modulesEnEchec } = usagesDesMedias();

        const aSupprimer: MediaOrphelin[] = [];
        const epargnes: MediaOrphelin[] = [];
        let octets = 0;

        for (const media of useMediaStore.getState().mediaList) {
            if (usages.has(media.id)) continue;
            if (media.isPersistent) {
                epargnes.push({ media, protege: true });
            } else {
                aSupprimer.push({ media, protege: false });
                octets += media.size;
            }
        }

        return { aSupprimer, epargnes, octets, fiable: complet, modulesEnEchec };
    }

    /**
     * Supprime les médias que plus aucun module ne retient.
     *
     * @param apercu L'aperçu déjà montré à l'utilisateur. Le passer garantit
     * qu'on supprime **exactement ce qui a été annoncé** — sans lui, un second
     * recensement pourrait trancher autrement entre l'affichage et le clic.
     */
    public async performCleanup(
        apercu?: ApercuDuNettoyage,
    ): Promise<{ deletedCount: number; savedBytes: number; refuse?: string[] }> {
        if (this.isCleaning) {
            console.log('[MediaCleanupService] Cleanup already in progress, skipping.');
            return { deletedCount: 0, savedBytes: 0 };
        }

        this.isCleaning = true;
        try {
            const plan = apercu ?? (await this.apercu());

            /*
              **Un recensement incomplet ne supprime rien.**
              Si un magasin n'a pas répondu, tout ce qu'il détenait paraît
              orphelin — et c'est précisément ce qu'on effacerait.
            */
            if (!plan.fiable) {
                console.warn(
                    '[MediaCleanup] Recensement incomplet, aucune suppression :',
                    plan.modulesEnEchec.join(', '),
                );
                return { deletedCount: 0, savedBytes: 0, refuse: plan.modulesEnEchec };
            }

            const mediaStore = useMediaStore.getState();
            let deletedCount = 0;
            let savedBytes = 0;

            for (const orphelin of plan.aSupprimer) {
                console.log(
                    `[MediaCleanup] Deleting orphan media: ${orphelin.media.name} (${orphelin.media.id})`,
                );
                savedBytes += orphelin.media.size;
                await mediaStore.deleteMedia(orphelin.media.id);
                deletedCount++;
            }

            return { deletedCount, savedBytes };
        } finally {
            this.isCleaning = false;
        }
    }
}

export const mediaCleanupService = MediaCleanupService.getInstance();

/** Réexporté pour que les écrans n'aient qu'un point d'entrée à connaître. */
export type { UsageDunMedia };
