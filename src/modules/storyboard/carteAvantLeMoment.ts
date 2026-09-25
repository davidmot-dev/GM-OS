import type { ImageAvantLeMoment } from './useStoryboardStore';

/**
 * **La carte d'un moment est une parenthèse — sa projection comprise.**
 *
 * *Demandé par David le 2026-09-25 : « est-ce que si je change de moment ou
 * j'arrête le moment en cours, la projection de la carte s'arrête ? »* — la
 * réponse était non. On rechargeait la carte d'avant, mais la projection
 * restait où le moment l'avait mise ; et quand il n'y avait **aucune** carte
 * avant, celle du moment restait chez les joueurs pendant que Map-OS était
 * vide chez le meneur : `syncToPlayers` n'envoie la carte que si elle existe,
 * donc « plus de carte » ne partait jamais.
 *
 * La règle est celle de l'image depuis le 31/08 : **ce que le moment a allumé
 * s'éteint avec lui, ce que le meneur avait allumé revient.**
 */

/** Ce qu'il faut du magasin de la carte — lu par le global, comme ailleurs ici. */
interface MagasinDeLaCarte {
    getState: () => {
        mapUrl?: string | null;
        mapName?: string | null;
        isVideo?: boolean;
        projectionTarget?: 'hub' | 'monitor' | null;
        ecranDeLaCarte?: string | null;
        setMap: (url: string | null, isVideo?: boolean, name?: string) => unknown;
        clearProjectedState: () => void;
    };
    setState: (partiel: Record<string, unknown>) => void;
}

/** Ce que la table montre avant que le moment ne prenne la main. */
export function releverLaCarte(magasin: MagasinDeLaCarte): ImageAvantLeMoment {
    const etat = magasin.getState();
    return {
        mapUrl: etat.mapUrl ?? null,
        mapName: etat.mapName ?? null,
        isVideo: !!etat.isVideo,
        projection: etat.projectionTarget ?? null,
        ecran: etat.ecranDeLaCarte ?? null,
    };
}

/**
 * **Rendre la carte, et l'écran où elle était.**
 *
 * ⚠️ `projection` absente veut dire « relevée avant ce jour » : on rend la
 * carte comme avant et on ne touche pas à la projection.
 */
export async function rendreLaCarte(
    avant: ImageAvantLeMoment,
    magasin: MagasinDeLaCarte,
): Promise<void> {
    /* Attendue, comme au déclenchement : `setMap` relit le brouillard, et une
       projection partie avant lui enverrait celui de la carte du moment. */
    await magasin.getState().setMap(avant.mapUrl, avant.isVideo, avant.mapName ?? 'Sans titre');

    if (avant.projection === undefined) return;

    const maintenant = magasin.getState();

    /* Rien n'était projeté : ce que le moment a allumé s'éteint. Les fenêtres
       de moniteur restent ouvertes et deviennent noires — les fermer toutes,
       comme le fait Map-OS, emporterait aussi l'image d'un autre écran. */
    if (avant.projection === null) {
        if (maintenant.projectionTarget) maintenant.clearProjectedState();
        return;
    }

    const { projeterLaCarteSur } = await import('../map/projectionDeLaCarte');
    if (avant.projection === 'hub' && maintenant.projectionTarget !== 'hub') {
        projeterLaCarteSur('hub');
    } else if (avant.projection === 'monitor' && avant.ecran
        && (maintenant.projectionTarget !== 'monitor' || maintenant.ecranDeLaCarte !== avant.ecran)) {
        projeterLaCarteSur(avant.ecran);
    }

    /*
      **Une projection sans carte, avant le moment, doit rester sans carte.**
      `syncToPlayers` ne l'effacerait pas — il n'envoie la carte que si elle
      existe —, et celle du moment resterait chez les joueurs.
    */
    if (!avant.mapUrl) {
        magasin.setState({ projectedMapUrl: null, projectedFogDataUrl: null });
    }
}
