/**
 * Rendre lisibles les titres de journaux écrits avec un identifiant de campagne.
 *
 * **Pourquoi une réparation et pas seulement un correctif.** `launchSession`
 * passait `session.campaignId` à `startJournal`, qui compose le titre une fois
 * pour toutes à l'ouverture de la séance. Corriger l'appelant ne répare donc
 * *que les séances à venir* : celles déjà archivées gardent leur
 * « c-1187082150026-gtbgs - 18/08 21:59 (Session #1) » pour toujours. Or le
 * titre d'un journal existe pour être relu des mois plus tard — c'est
 * exactement la donnée qu'il ne faut pas laisser pourrir.
 *
 * **On répare la donnée, pas l'affichage.** Le titre part aussi dans le carnet
 * (`Résumé Session: …`) et dans le nom du fichier d'export ; le réécrire au
 * rendu aurait laissé l'identifiant s'échapper par ces deux chemins.
 *
 * L'identifiant reste la signature sur laquelle on s'appuie : il est exact,
 * unique, et suivi du séparateur que `startJournal` écrit. On ne devine rien.
 */

/** La forme minimale dont la réparation a besoin. */
export interface CampagneNommee {
    id: string;
    name?: string;
}

/** Le séparateur que `startJournal` place entre la campagne et la date. */
const SEPARATEUR = ' - ';

/**
 * Le titre, avec le nom de la campagne à la place de son identifiant.
 *
 * Rend le titre **inchangé** quand rien ne correspond : aucune campagne connue
 * en tête, campagne sans nom, ou titre déjà correct. *Un titre qu'on ne sait pas
 * réparer vaut mieux qu'un titre qu'on abîme en essayant.*
 */
export function titreAvecNomDeCampagne(
    titre: string,
    campagnes: readonly CampagneNommee[],
): string {
    for (const campagne of campagnes) {
        const nom = campagne.name?.trim();
        if (!nom || !campagne.id) continue;

        // Le titre entier vaut l'identifiant : journal ouvert sans rien d'autre.
        if (titre === campagne.id) return nom;

        // Sinon l'identifiant est en tête, suivi du séparateur et de la date.
        if (titre.startsWith(campagne.id + SEPARATEUR)) {
            return nom + titre.slice(campagne.id.length);
        }
    }
    return titre;
}

/**
 * La campagne à laquelle ce titre appartient — **ou rien**.
 *
 * **Ce que ça sert à faire.** Depuis le 2026-08-19, `startJournal` reçoit
 * l'identifiant de la campagne et le garde : les journaux à venir savent d'où
 * ils viennent. Les journaux déjà archivés, eux, n'ont que leur titre — et le
 * résumé par IA a besoin de savoir à quel jeu il joue.
 *
 * On accepte les **deux formes de titre** parce que les deux existent dans la
 * base de David : ceux d'avant le 2026-08-18 portent l'identifiant en tête,
 * ceux d'après le nom. Le séparateur fait le travail de désambiguïsation — une
 * campagne « Hadley » ne s'accroche pas à « Hadley Hope - … », puisque le titre
 * ne commence pas par « Hadley - ».
 *
 * **Rien plutôt qu'un pari.** Deux campagnes qui répondent au même titre — deux
 * homonymes — ne donnent aucun rattachement : un journal rattaché à la mauvaise
 * campagne enverrait le mauvais système de jeu au modèle, ce qui est pire qu'un
 * journal sans campagne. *On ne devine rien*, comme pour les titres.
 */
export function campagneDuTitre(
    titre: string,
    campagnes: readonly CampagneNommee[],
): CampagneNommee | undefined {
    const correspond = (valeur: string | undefined) => {
        const v = valeur?.trim();
        return !!v && (titre === v || titre.startsWith(v + SEPARATEUR));
    };

    const candidates = campagnes.filter(c => c.id && (correspond(c.id) || correspond(c.name)));
    return candidates.length === 1 ? candidates[0] : undefined;
}

/**
 * Les journaux qu'on a su rattacher à leur campagne, et eux seuls.
 *
 * **Un journal déjà rattaché n'est jamais rejugé** : son `campaignId` a été
 * écrit à l'ouverture de la séance, par quelqu'un qui *savait*, là où cette
 * fonction ne fait que reconnaître une chaîne. La donnée sûre l'emporte
 * toujours sur la donnée devinée.
 *
 * Rend le **même tableau** quand il n'y a rien à faire, pour la même raison que
 * `reparerLesTitres` : cela tourne à chaque montage de l'écran.
 */
export function rattacherLesCampagnes<T extends { title: string; campaignId?: string }>(
    journaux: readonly T[],
    campagnes: readonly CampagneNommee[],
): readonly T[] {
    let touche = false;
    const rattaches = journaux.map((j) => {
        if (j.campaignId) return j;
        const campagne = campagneDuTitre(j.title, campagnes);
        if (!campagne) return j;
        touche = true;
        return { ...j, campaignId: campagne.id };
    });
    return touche ? rattaches : journaux;
}

/**
 * Les journaux dont le titre a changé, et eux seuls.
 *
 * Rend le **même tableau** quand il n'y a rien à faire : cette réparation tourne
 * à chaque montage de l'écran, et rendre un tableau neuf à chaque fois ferait
 * rejouer tout ce qui l'observe pour rien.
 */
export function reparerLesTitres<T extends { title: string }>(
    journaux: readonly T[],
    campagnes: readonly CampagneNommee[],
): readonly T[] {
    let touche = false;
    const repares = journaux.map((j) => {
        const titre = titreAvecNomDeCampagne(j.title, campagnes);
        if (titre === j.title) return j;
        touche = true;
        return { ...j, title: titre };
    });
    return touche ? repares : journaux;
}
