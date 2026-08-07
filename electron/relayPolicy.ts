/**
 * Politique d'autorisation des messages relayés entre fenêtres locales.
 *
 * Le point 9 a réglé qui, sur le **réseau**, peut déclencher quoi
 * (`electron/actionPolicy.ts`). Il laissait entier le cas des fenêtres
 * **locales** : le relais les traitait comme égales, et la fenêtre MJ adoptait
 * ce qu'une fenêtre secondaire disait sans se demander si elle avait autorité
 * pour le dire.
 *
 * Ce n'est pas théorique. Le Player Hub s'ouvrait, diffusait son tableau vide et
 * sa projection à `null`, le MJ adoptait puis rediffusait — la projection
 * s'éteignait toute seule. La faille est restée invisible des mois, et n'est
 * apparue que parce que la bascule d'un flux a changé l'ordre d'arrivée des
 * messages. Elle a une jumelle côté persistance, corrigée le même jour :
 * `documentation/Planning/2026-08-07-perte-campagnes-persistance.md`.
 *
 * **Portée : le type du message, pas ses champs.** Le relais transporte une
 * chaîne déjà sérialisée, et c'est la condition de performance mesurée le
 * 2026-08-06 (`scripts/ipc-bench/`). Contrôler un champ obligerait le process
 * principal à `JSON.parse` puis re-sérialiser chaque message, sur le flux le
 * plus chaud de l'application. Le contrôle par champ reste donc où il est —
 * `stripProjectionTarget`, dans le renderer — mais il s'appuie désormais sur le
 * rôle estampillé par le relais, que l'émetteur ne peut pas forger.
 */

export type RelayRole = 'gm' | 'hub' | 'projector' | 'unknown';

/**
 * Ce que chaque fenêtre secondaire a le droit d'émettre.
 *
 * Établi sur ce que ces fenêtres émettent réellement aujourd'hui :
 *
 * - `hub:ready` part des trois rôles secondaires (`App.tsx`, `notifyReady`).
 * - Le Player Hub est émetteur **légitime** du tableau blanc — `PlayerDrawingCanvas`
 *   publie via `setActivePath` et `setLaserPointer` — et des positions de jetons,
 *   qui voyagent dans `map`.
 * - Les verrous restent ouverts à tous : ils ne portent aucun état partagé, donc
 *   ne peuvent rien écraser, et les retenir laisserait un jeton saisissable deux
 *   fois pendant les premières secondes d'une fenêtre.
 *
 * Refus par défaut pour le reste, comme au point 9. `clock` et `combat` sont
 * ainsi hors de portée d'une fenêtre secondaire : ils viennent du MJ.
 *
 * Le projecteur garde `map` et `whiteboard` faute de les avoir observés à
 * l'émission : les lui retirer sur une simple lecture du code risquerait
 * d'éteindre une projection en pleine partie. Les refus étant journalisés,
 * c'est l'usage qui dira s'il faut resserrer — c'est la journalisation, pas la
 * relecture, qui avait révélé la régression `remote:request-sync` au point 9.
 */
const ROLE_ALLOWED: Record<Exclude<RelayRole, 'gm'>, ReadonlySet<string>> = {
    hub: new Set(['combat', 'hub:ready', 'map', 'map:lock', 'map:unlock', 'whiteboard']),
    projector: new Set(['combat', 'hub:ready', 'map', 'map:lock', 'map:unlock', 'whiteboard']),
    // Une fenêtre qu'on ne sait pas rattacher n'émet rien.
    unknown: new Set<string>(),
};

/**
 * Pourquoi `combat` figure dans ces listes alors que le flux vient du MJ.
 *
 * La première version l'en excluait, sur lecture du code : `HubCombatTracker`
 * ne fait que lire, aucune vue secondaire n'appelle d'action de combat. L'usage
 * a démenti immédiatement — 92 refus en une minute d'essai le 2026-08-07, par
 * rafales de cinq à dix en quelques millisecondes.
 *
 * Ce ne sont pas des gestes : ce sont des échos. Une fenêtre secondaire applique
 * le `combat` du MJ, sa souscription de store repart, et elle republie. Le garde
 * `isApplyingRemoteUpdate` ne couvre que le temps synchrone de l'application.
 *
 * Le refus ne protégeait donc presque rien : la branche MJ de `handleMessage`
 * n'a **aucun cas `combat`**, ces messages y étaient déjà jetés en silence. Il ne
 * fermait que le chemin fenêtre secondaire → projecteur, et au prix de rendre le
 * journal d'audit illisible.
 *
 * Le vrai correctif est en amont, dans l'écho lui-même — c'est le point 3 du plan
 * des restes, à traiter sur symptôme. La politique n'est pas l'endroit pour
 * rattraper un flux trop bavard.
 */

export interface RelayVerdict {
    allowed: boolean;
    /** Détail journalisable côté MJ ; jamais renvoyé à l'émetteur. */
    detail?: string;
}

const ALLOWED: RelayVerdict = { allowed: true };

/**
 * Décide si une fenêtre peut émettre un message d'un type donné.
 *
 * La fenêtre MJ possède l'état de l'application : elle émet tout.
 */
export function evaluateRelay(role: RelayRole, type: string): RelayVerdict {
    if (role === 'gm') return ALLOWED;

    if (ROLE_ALLOWED[role].has(type)) return ALLOWED;

    return {
        allowed: false,
        detail: `'${type}' n'est pas émis par une fenêtre '${role}'`,
    };
}
