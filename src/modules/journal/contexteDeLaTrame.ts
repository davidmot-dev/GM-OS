/**
 * **La trame dans le contexte de l'Oracle — étape 10 du § 8 du plan du
 * 2026-08-08, la dernière.**
 *
 * **Ce que l'Oracle recevait, vérifié avant d'écrire.** La campagne et son
 * synopsis, les PJ, les PNJ vivants, les indices révélés, et « Historique
 * Récent » — dix événements bruts, titre et contenu, horodatés à la seconde.
 * **Aucune scène. Aucun acte. Aucun enjeu.** Le § 7 le disait déjà le 08/08, et
 * c'était toujours vrai mot pour mot treize jours plus tard.
 *
 * Le § 7 chiffre le bénéfice : *« scène en cours : l'embuscade de l'entrepôt —
 * les PJ cherchent le manifeste, le garde est corrompu »* est **un bien meilleur
 * ancrage pour bien moins de jetons**. Ce qui compte double avec le plafond RAG
 * à 4 000 (`electron/ragSelection.ts`).
 *
 * **Deux scènes ouvertes est le cas NORMAL, pas une anomalie.** Quand le groupe
 * se sépare, deux scènes tournent en même temps — et c'est précisément le moment
 * où le meneur consulte l'Oracle. On les envoie donc toutes les deux, nommées,
 * plutôt que d'en choisir une au hasard ou de renoncer.
 */

/** Une scène ouverte, telle que le modèle doit la lire. */
export interface SceneEnContexte {
    titre: string;
    /** L'acte dont elle relève, s'il est connu. */
    acte?: string;
    /** Ce qui s'y joue, du point de vue du meneur. */
    resume?: string;
    /** Le lieu, tel que l'Atlas le nomme. */
    lieu?: string;
    /** Les PJ que la scène déclare présents. */
    pj: string[];
    /** Les PNJ en piste. */
    pnj: string[];
}

/** Une ligne, ou rien du tout — on n'écrit pas d'étiquette vide. */
function ligne(etiquette: string, valeur: string): string {
    return valeur.trim() ? `${etiquette} : ${valeur.trim()}\n` : '';
}

/**
 * Décrit les scènes ouvertes, ou rend une chaîne vide.
 *
 * **Vide plutôt qu'une phrase d'excuse.** Une campagne sans trame, une séance de
 * préparation, un journal relu des semaines plus tard : ce sont des cas
 * ordinaires. Écrire *« aucune scène en cours »* ferait dépenser des jetons pour
 * dire qu'on n'a rien à dire, et invite le modèle à commenter cette absence.
 * L'appelant n'ajoute la section que si elle porte quelque chose.
 *
 * **Le résumé de la scène passe avant tout le reste** : c'est le seul champ que
 * le meneur a écrit lui-même, et c'est celui qui dit l'enjeu.
 */
export function decrireLesScenesOuvertes(scenes: readonly SceneEnContexte[]): string {
    if (scenes.length === 0) return '';

    return scenes.map(s => {
        const entete = s.acte ? `**${s.titre}** (${s.acte})` : `**${s.titre}**`;
        return entete + '\n'
            + ligne('Enjeu', s.resume ?? '')
            + ligne('Lieu', s.lieu ?? '')
            + ligne('PJ présents', s.pj.join(', '))
            + ligne('PNJ en piste', s.pnj.join(', '));
    }).join('\n');
}

/**
 * La même chose en une ligne par scène — **pour le Cortex et le mode allégé.**
 *
 * Le § 7 promet au Cortex tactique ce gain « pour quelques dizaines de jetons » :
 * savoir *où l'on est* et *ce qui s'y joue* vaut mieux, pour un conseil de
 * combat, que tout le lore d'une campagne. On ne lui donne donc pas le détail —
 * il a déjà son rapport de situation — mais l'ancrage.
 */
export function nommerLesScenesOuvertes(scenes: readonly SceneEnContexte[]): string {
    return scenes
        .map(s => (s.resume?.trim() ? `${s.titre} — ${s.resume.trim()}` : s.titre))
        .join(' | ');
}

/**
 * Ce qui s'est raconté, réduit à ce qui raconte.
 *
 * **Le § 3 de la procédure : ne pas jeter l'historique, le réduire.** Dix
 * événements bruts partaient, jets de dés et gestes d'outil compris. La matière
 * existait déjà — la curation sait distinguer la `trace` de la `chronique`
 * depuis le 18/08, et `leRecitCureDuJournal` la rend **dans l'ordre de
 * l'histoire** et non dans celui de la pile.
 *
 * **On prend la FIN, parce que l'ensemble curé est chronologique.** C'est
 * l'inverse du journal, qui empile le plus récent en tête — le piège qui a fait
 * envoyer à l'Oracle le début d'une séance sous l'intitulé de sa fin, corrigé le
 * 20/08. *Le sens d'une pile ne se devine pas ; il se sait à un seul endroit.*
 */
export function derniersFaitsRacontes(
    recit: readonly { title: string; content: string }[],
    combien: number,
): string {
    return recit
        .slice(-combien)
        .map(e => {
            // Le contenu d'un événement peut faire des paragraphes — un résumé
            // de combat, une vision de l'Oracle. Le titre porte l'essentiel ;
            // le reste sert d'appui, pas de récit.
            const corps = e.content.replace(/\s+/g, ' ').trim();
            return corps ? `- ${e.title} : ${corps.slice(0, 220)}` : `- ${e.title}`;
        })
        .join('\n');
}
