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
