/**
 * Registre des actions distantes.
 *
 * Ces actions arrivent par WebSocket depuis les tablettes et la télécommande,
 * et sont exécutées sur le poste MJ. Elles vivaient auparavant dans une suite
 * d'environ 270 lignes de `if` au sein de `App.tsx` : la liste de ce que
 * l'application accepte de faire sur ordre du réseau n'était énoncée nulle
 * part, et devait se déduire à la lecture.
 *
 * Un registre rend cette liste explicite et vérifiable, et permet d'ignorer —
 * en le signalant — tout type qui n'y figure pas.
 */

/** Contexte fourni aux handlers ; évite de les coupler au composant App. */
export interface ActionContext {
    /** Campagne active au moment de la réception. */
    activeCampaignId: string | null;
    /** Déclenche une diffusion complète de l'état vers les clients. */
    sync: (force?: boolean) => void;
}

export type ActionHandler = (payload: any, ctx: ActionContext) => void;

export type ActionRegistry = Record<string, ActionHandler>;

/**
 * Actions à haute fréquence, exclues de la synchronisation automatique de fin
 * de traitement : elles arrivent par rafales (déplacement du pointeur, tracé en
 * cours) et déclencheraient une diffusion complète à chaque événement.
 */
export const HIGH_FREQUENCY_ACTIONS: ReadonlySet<string> = new Set([
    'whiteboard:set-active-path',
    'whiteboard:set-laser-pointer',
]);
