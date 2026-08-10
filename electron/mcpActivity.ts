/**
 * Journal d'activité du pont MCP — ce que la Forge montre pendant qu'elle attend.
 *
 * **Pourquoi ce module existe.** Un appel MCP est un `ipcRenderer.invoke` : une
 * question, une réponse, rien entre les deux. Pendant qu'une fiche se rédige,
 * l'interface n'avait qu'un rouage qui tourne — impossible de distinguer « ça
 * travaille » de « c'est mort », et le plafond est à dix minutes.
 *
 * **Ce que le journal porte, par ordre de fiabilité :**
 *
 * 1. Ce que le pont **sait de source sûre** : la requête est partie, la réponse
 *    est arrivée, en tant de secondes, tant de caractères. Toujours disponible.
 * 2. Ce que le serveur **raconte de lui-même** — `notifications/message` et
 *    lignes de `stderr`. Bonus : rien ne garantit que le serveur NotebookLM en
 *    émette. Le journal ne doit donc jamais en dépendre pour être utile.
 *
 * Cette hiérarchie n'est pas un détail d'implémentation. Un panneau d'avancement
 * alimenté par une source incertaine est un panneau vide au pire moment.
 *
 * Module sans dépendance à `electron` : il tourne dans le projet de tests `node`.
 */

export type NiveauActivite = 'requete' | 'reponse' | 'serveur' | 'erreur';

export interface EvenementMcp {
    horodatage: number;
    niveau: NiveauActivite;
    message: string;
    /** Identifiant JSON-RPC de la requête concernée, quand il est connu. */
    requete?: number;
}

/** Au-delà, une ligne de journal cesse d'informer et encombre. */
export const LONGUEUR_MAX_LIGNE = 300;

/**
 * Séquences d'échappement ANSI — les serveurs Python colorent volontiers leur
 * sortie, et les codes bruts sont illisibles dans une interface HTML.
 */
// eslint-disable-next-line no-control-regex -- l'echappement ANSI est un caractere de controle
const ANSI = /\x1b\[[0-9;]*[A-Za-z]/g;

/**
 * Préambule des journaux Python : `INFO:module:message`, `2026-08-10 09:12:03,456 - x - INFO - message`.
 * On garde le message, on jette la plomberie.
 */
const PREAMBULES: RegExp[] = [
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}[.,]?\d*\s*-?\s*/,
    /^(?:DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL)\s*[:|-]\s*/i,
    /^[\w.]+\s*-\s*(?:DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL)\s*-\s*/i,
];

/**
 * Bruit pur : lignes de barre de progression, points de suspension d'attente,
 * et les avertissements de dépréciation qui ne disent rien de la requête.
 */
const BRUIT = [
    /^[\s.·—=-]*$/,
    /DeprecationWarning/i,
    /^\s*warnings\.warn/i,
];

/**
 * Normalise une ligne brute du serveur. Rend `null` quand la ligne n'apprend
 * rien — c'est le cas le plus fréquent, et une ligne inutile coûte la place
 * d'une ligne utile.
 */
export function ligneServeur(brut: string): string | null {
    let ligne = brut.replace(ANSI, '').replace(/\r/g, '').trim();
    if (!ligne) return null;

    for (const preambule of PREAMBULES) {
        ligne = ligne.replace(preambule, '');
    }
    ligne = ligne.trim();
    if (!ligne) return null;

    if (BRUIT.some(motif => motif.test(ligne))) return null;

    return ligne.length > LONGUEUR_MAX_LIGNE
        ? `${ligne.slice(0, LONGUEUR_MAX_LIGNE)}…`
        : ligne;
}

/**
 * Durée lisible. Les secondes seules cessent de parler passé la minute, et
 * c'est justement là que la question « est-ce que ça avance ? » se pose.
 */
export function formatDuree(ms: number): string {
    const secondes = Math.max(0, Math.round(ms / 1000));
    if (secondes < 60) return `${secondes} s`;
    const minutes = Math.floor(secondes / 60);
    const reste = secondes % 60;
    return reste === 0 ? `${minutes} min` : `${minutes} min ${reste} s`;
}

/**
 * « 12 345 caractères », groupés par milliers.
 *
 * Groupage explicite plutôt que `toLocaleString` : celui-ci rend des espaces
 * insécables étroits dont la forme dépend de la plateforme, ce qui rendrait le
 * résultat impossible à comparer dans un test.
 */
export function formatTaille(caracteres: number): string {
    const groupe = String(caracteres).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${groupe} caractères`;
}

export function evenementRequete(outil: string, requete: number): EvenementMcp {
    return { horodatage: Date.now(), niveau: 'requete', message: `Requête envoyée : ${outil}`, requete };
}

export function evenementReponse(requete: number, ms: number, caracteres: number): EvenementMcp {
    return {
        horodatage: Date.now(),
        niveau: 'reponse',
        message: `Réponse reçue en ${formatDuree(ms)} — ${formatTaille(caracteres)}`,
        requete,
    };
}

export function evenementServeur(message: string, requete?: number): EvenementMcp {
    return { horodatage: Date.now(), niveau: 'serveur', message, requete };
}

export function evenementErreur(message: string, requete?: number): EvenementMcp {
    return { horodatage: Date.now(), niveau: 'erreur', message, requete };
}

/**
 * Borne du journal conservé côté interface.
 *
 * Un serveur bavard produirait des milliers de lignes sur une génération
 * complète ; les dernières sont les seules qui renseignent sur l'instant.
 */
export const LIGNES_CONSERVEES = 200;

export function ajouterAuJournal(
    journal: readonly EvenementMcp[],
    evenement: EvenementMcp,
): EvenementMcp[] {
    const suite = [...journal, evenement];
    return suite.length > LIGNES_CONSERVEES ? suite.slice(suite.length - LIGNES_CONSERVEES) : suite;
}
