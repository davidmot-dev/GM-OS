/**
 * **Qui commande les lampes pendant qu'un moment se déclenche.**
 *
 * ⛔ **Le défaut trouvé par David le 2026-09-22** : *« quand je joue la lumière
 * Intro de Light-OS et dans une séquence de storyboard, l'effet n'est pas le
 * même »* — les couleurs différaient, et **rejouer la tuile depuis Light-OS
 * réparait**.
 *
 * Les deux chemins posaient pourtant des états **identiques**. Le moment
 * appliquait bien sa scène… puis déclenchait ses sons, et **quatre chemins**
 * peuvent appliquer une *autre* scène lumineuse juste après :
 *
 * | Qui | Où |
 * | --- | --- |
 * | une piste d'ambiance qui démarre | `useAmbientStore` |
 * | un pad de bruitage | `SoundController`, deux fois |
 * | un pad de musique | `useMusicStore` |
 *
 * ⭐ **C'est « plusieurs écrivains pour une même donnée »**, le motif que ce
 * dépôt paie le plus souvent. La règle qui manquait, tranchée par David : ***ce
 * que le meneur a déclaré dans le moment gagne sur ce qu'un enchaînement
 * propose.***
 *
 * ⚠️ **Et réordonner n'aurait pas suffi.** Les pistes d'ambiance démarrent de
 * façon **asynchrone** : une piste en retard repasserait par-dessus, même en
 * posant la lumière en dernier. Il faut que le moment *tienne* les lampes le
 * temps de son déclenchement.
 *
 * ⚠️ **Hors de React, et jamais persisté.** C'est un verrou de quelques
 * millisecondes, pas un état : le ranger dans un magasin le ferait survivre à un
 * rechargement, et **les scènes liées resteraient muettes pour toujours**.
 */

/** Nul quand personne ne tient les lampes. */
let proprietaire: string | null = null;

/** Ce qu'on a refusé pendant la réservation — pour que le moment puisse le dire. */
let ecartees: string[] = [];

/**
 * Le moment prend les lampes.
 *
 * ⛔ **À libérer dans un `finally`, sans exception.** Une réservation qu'une
 * erreur laisserait ouverte rendrait toutes les scènes liées muettes jusqu'au
 * prochain rechargement — *un correctif qui casse plus large que le défaut
 * qu'il répare.*
 */
export function reserverLesLumieres(pour: string): void {
    proprietaire = pour;
    ecartees = [];
}

/** Rend les lampes, et dit ce qui a été écarté pendant ce temps. */
export function libererLesLumieres(): { ecartees: string[] } {
    if (relache) { clearTimeout(relache); relache = null; }
    proprietaire = null;
    const bilan = ecartees;
    ecartees = [];
    return { ecartees: bilan };
}

/**
 * **Combien de temps le moment garde les lampes après son déclenchement.**
 *
 * ⛔ **Libérer à la fin du déclenchement ne suffit pas.** Music-OS applique la
 * scène liée à son pad **300 ms plus tard** — *« Delay to let audio
 * loading/decoding breathe »* — et les pistes d'ambiance démarrent de façon
 * asynchrone. Une libération immédiate laisserait donc passer exactement les
 * retardataires qu'on cherche à retenir.
 *
 * Une seconde couvre largement le plus long délai connu, et reste invisible à
 * l'usage : *personne ne change de scène lumineuse à la main dans la seconde qui
 * suit le lancement d'une séquence.*
 */
export const DELAI_DE_RELACHE_MS = 1_000;

let relache: ReturnType<typeof setTimeout> | null = null;

/** Rend les lampes après le délai, et rend ce qui était déjà écarté. */
export function relacherLesLumieresBientot(delaiMs = DELAI_DE_RELACHE_MS): string[] {
    const bilan = [...ecartees];
    if (relache) clearTimeout(relache);
    relache = setTimeout(() => { relache = null; libererLesLumieres(); }, delaiMs);
    return bilan;
}

/** Ce qui a été écarté jusqu'ici, sans rien rendre. */
export function ecarteesJusquIci(): string[] {
    return [...ecartees];
}

/** Vrai tant qu'un moment tient les lampes. */
export function lesLumieresSontReservees(): boolean {
    return proprietaire !== null;
}

/**
 * **La seule porte par laquelle une scène LIÉE passe.**
 *
 * Les quatre chemins d'enchaînement l'appellent, et aucun n'applique une scène
 * directement : *quatre gardes écrites séparément finissent par ne plus dire la
 * même chose, et la quatrième manquera le jour où on l'oubliera.*
 *
 * Rend `true` quand la scène a été appliquée, `false` quand elle s'est abstenue.
 */
export function appliquerLaSceneLiee(
    moteur: { applyScene: (sceneId: string, isAutomatic?: boolean) => unknown } | null | undefined,
    sceneId: string | null | undefined,
): boolean {
    if (!moteur || !sceneId) return false;

    if (proprietaire !== null) {
        /* On retient pour le rapport plutôt que de le taire : *un réglage
           ignoré sans un mot se lit comme un réglage qui ne marche pas.* */
        if (!ecartees.includes(sceneId)) ecartees.push(sceneId);
        return false;
    }

    moteur.applyScene(sceneId, true);
    return true;
}
