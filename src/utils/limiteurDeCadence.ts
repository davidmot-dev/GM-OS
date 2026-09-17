/**
 * **Un limiteur de cadence : laisse passer le premier, puis un par fenêtre.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ POURQUOI IL EXISTE : ON PAYAIT POUR CE QUE PERSONNE NE RECEVAIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, David : *« whiteboard os saccade un peu »*. Chaque point d'un
 * trait appelait `setActivePath`, donc un `set()` sur un magasin persisté.
 *
 * Or `CrossWindowEventService` **jette déjà** toute mise à jour du tableau
 * arrivant moins de **50 ms** après la précédente (`WB_THROTTLE`). Le réseau
 * ignorait donc environ quatre points sur cinq — mais le magasin, lui, les avait
 * tous sérialisés, écrits sur le disque et notifiés à ses abonnés.
 *
 * ⭐ ***Une limitation posée à l'arrivée ne fait pas d'économie : elle jette du
 * travail déjà payé.*** Celle-ci est posée au départ.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ OÙ IL NE FAUT PAS S'EN SERVIR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Quand le magasin EST l'affichage.** Sur la carte, la position d'un pion vient
 * du magasin : la limiter ferait traîner le pion derrière le curseur. C'est
 * l'écriture disque qu'il faut différer là-bas, pas la mise à jour — voir
 * `ecritureDifferee`.
 *
 * Sur le tableau blanc, le tracé en cours est dessiné **localement**, à partir de
 * l'état React du composant ; le magasin ne sert qu'à le **diffuser** aux autres
 * fenêtres. *Le doigt n'attend rien ; seuls les spectateurs attendent, et ils
 * attendaient déjà 50 ms.*
 */

/** La cadence de diffusion d'un tracé, alignée sur `WB_THROTTLE`. */
export const CADENCE_DE_DIFFUSION_MS = 50;

export interface LimiteurDeCadence {
    /**
     * Le geste peut-il passer maintenant ? Rend `true` **et consomme la
     * fenêtre**, ou `false` s'il est trop tôt.
     */
    tenter: (maintenant?: number) => boolean;
    /**
     * Rouvre la fenêtre, pour que le geste suivant passe quoi qu'il arrive.
     *
     * ⛔ **Indispensable à la fin d'un geste.** Sans ça, le dernier point d'un
     * trait — celui qui ferme la forme — pourrait tomber dans une fenêtre
     * fermée et **ne jamais être diffusé** : les autres écrans garderaient un
     * trait tronqué, et rien ne le dirait.
     */
    rouvrir: () => void;
}

export const limiteurDeCadence = (
    cadenceMs: number = CADENCE_DE_DIFFUSION_MS,
    horloge: () => number = () => Date.now(),
): LimiteurDeCadence => {
    /* `-Infinity` et non 0 : à l'instant 0 d'une horloge de laboratoire, le
       premier geste doit passer. *Un limiteur qui bloque le premier appel se
       remarque comme un clic perdu.* */
    let derniere = -Infinity;

    return {
        tenter: (maintenant = horloge()) => {
            if (maintenant - derniere < cadenceMs) return false;
            derniere = maintenant;
            return true;
        },
        rouvrir: () => { derniere = -Infinity; },
    };
};
