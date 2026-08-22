/**
 * **La pause de séance — axe G.**
 *
 * *« Un bouton pause avec chronomètre : la pause lève les plafonds de partie, la
 * reprise récupère l'IA. »*
 *
 * **Un champ, pas un quatrième statut**, et le plan dit pourquoi : les statuts
 * sont `planned | active | done`, et **cinq composants testent
 * `status === 'active'`**. Un statut `paused` les ferait tous considérer la
 * séance comme absente — alors que le Hub reste affiché, la projection en cours
 * et les scènes ouvertes. Un champ séparé laisse les cinq lecteurs intacts.
 *
 * **Le chronomètre vaut le coup même sans l'IA.** Savoir que la pause dure
 * depuis dix-huit minutes est utile en soi, et ferme le risque d'oubli — le même
 * que l'indicateur de séance ouverte.
 */

/**
 * Ce qu'on suppose d'une pause qu'on n'a pas mesurée.
 *
 * **Un quart d'heure, parce que c'est la pause qu'on prend vraiment** — le café,
 * la cigarette, le tour de table. Le plan s'en sert comme exemple : *« pause de
 * 15 min : cette Forge en demande 4, on y va »*.
 *
 * Ce n'est pas une limite : le chronomètre compte au-delà sans rien interrompre.
 * C'est **l'hypothèse de travail du plafond**, et elle s'ajuste.
 */
export const DUREE_DE_PAUSE_PAR_DEFAUT_MS = 15 * 60 * 1000;

/** Ce qu'il faut savoir d'une séance pour dire si elle est en pause. */
export interface SeanceEnPause {
    status?: string;
    /** Instant du clic sur « pause ». Absent : la séance n'est pas en pause. */
    pausedAt?: number;
    /** Durée annoncée, en millisecondes. Absente : on suppose un quart d'heure. */
    pauseDureePrevueMs?: number;
}

/**
 * Cette séance est-elle en pause ?
 *
 * **Le statut compte autant que le champ.** Une séance terminée qui porterait
 * encore un `pausedAt` — parce qu'on l'a close sans reprendre — ne doit pas
 * lever les plafonds pour l'éternité. *Un champ qu'on oublie de nettoyer devient
 * un état permanent*, et c'est le genre de silence que ce projet paie cher.
 */
export function estEnPause(seance: SeanceEnPause | undefined): boolean {
    return !!seance && seance.status === 'active' && typeof seance.pausedAt === 'number';
}

/** Depuis combien de temps la pause dure, en millisecondes. */
export function pauseEcouleeMs(seance: SeanceEnPause | undefined, maintenant = Date.now()): number {
    if (!estEnPause(seance)) return 0;
    return Math.max(0, maintenant - (seance!.pausedAt as number));
}

/**
 * Ce qu'il reste de la pause annoncée. **Négatif quand on l'a dépassée**, et
 * c'est voulu : le dépassement est l'information la plus utile du chronomètre.
 */
export function pauseRestanteMs(seance: SeanceEnPause | undefined, maintenant = Date.now()): number {
    if (!estEnPause(seance)) return 0;
    const prevue = seance!.pauseDureePrevueMs ?? DUREE_DE_PAUSE_PAR_DEFAUT_MS;
    return prevue - pauseEcouleeMs(seance, maintenant);
}

/** « 3 min », « 45 s » — la même lecture que la file d'attente de l'axe D. */
function duree(ms: number): string {
    const secondes = Math.round(ms / 1000);
    if (secondes < 90) return `${secondes} s`;
    return `${Math.round(secondes / 60)} min`;
}

/**
 * Ce que le chronomètre affiche.
 *
 * **Le dépassement se dit, il ne se cache pas.** Une pause de quinze minutes qui
 * en dure vingt-cinq est le cas le plus fréquent et le plus utile à signaler :
 * c'est là que la table s'est dispersée. *Masquer le dépassement rendrait le
 * chronomètre décoratif.*
 */
export function libelleDeLaPause(seance: SeanceEnPause | undefined, maintenant = Date.now()): string {
    if (!estEnPause(seance)) return '';
    const ecoulee = pauseEcouleeMs(seance, maintenant);
    const restante = pauseRestanteMs(seance, maintenant);
    if (restante < 0) return `${duree(ecoulee)} de pause — ${duree(-restante)} de plus que prévu`;
    return `${duree(ecoulee)} de pause — ${duree(restante)} restantes`;
}
