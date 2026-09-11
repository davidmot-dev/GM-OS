/**
 * **Les ports que GM-OS ouvre, et d'où ils viennent.**
 *
 * ⛔ **Ce fichier n'importe rien** — ni `electron`, ni `node`. Les écrans en
 * lisent les valeurs par défaut, et ils tournent dans le navigateur. Même parti
 * pris que `formeDuManuel.ts`, et pour la même raison : *une correction qui ne
 * tient que par l'élagage d'un outil est une correction qu'on casse sans le
 * voir.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI ILS DEVIENNENT RÉGLABLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux instances de GM-OS se disputaient 3001 et 3002. Depuis le 2026-09-11 le
 * second démarrage ne fait plus tomber le premier — `SyncServer` a enfin son
 * gestionnaire d'erreur — mais il démarre **infirme** : pas de tablettes, pas de
 * fiches.
 *
 * Les rendre réglables ouvre l'exécution **parallèle** des tests de bout en
 * bout : chaque instance reçoit sa paire de ports et personne ne marche sur
 * personne.
 *
 * ⚠️ **Les valeurs par défaut ne changent pas.** Un meneur qui ne pose aucune
 * variable retrouve 3001 et 3002, et ses tablettes déjà appairées continuent de
 * répondre. *Rendre réglable ne doit jamais vouloir dire déplacer.*
 */

/** Le SyncServer : WebSocket des tablettes, proxy des médias, et `dist/` en production. */
export const PORT_SYNC_PAR_DEFAUT = 3001;

/** Le serveur des fiches — un port à lui, c'est ce qui isole la fiche. */
export const PORT_FICHES_PAR_DEFAUT = 3002;

export const VARIABLE_PORT_SYNC = 'GMOS_PORT_SYNC';
export const VARIABLE_PORT_FICHES = 'GMOS_PORT_FICHES';

/**
 * Lit un port dans l'environnement, ou rend le défaut.
 *
 * ⚠️ **Une valeur illisible rend le défaut plutôt que de lever.** Un `0` ou un
 * `abc` dans une variable ne doit pas empêcher GM-OS de démarrer : le meneur
 * perdrait son cockpit pour une faute de frappe dans un script. On le signale,
 * et on continue.
 *
 * Le `0` mérite un mot : c'est un port valide pour `listen` — il demande au
 * système d'en attribuer un — mais ici il voudrait dire « je n'ai pas choisi »,
 * et les écrans ne sauraient pas lequel joindre. On le refuse.
 */
export function lirePort(
    valeur: string | undefined,
    defaut: number,
    nom: string,
): number {
    if (valeur === undefined || valeur.trim() === '') return defaut;

    const port = Number(valeur);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        console.warn(`[Ports] ${nom} = « ${valeur} » n'est pas un port : on garde ${defaut}.`);
        return defaut;
    }
    return port;
}

/** Les deux ports, tels que ce démarrage les emploiera. */
export function portsDeGmOs(env: Record<string, string | undefined>): {
    sync: number;
    fiches: number;
} {
    const sync = lirePort(env[VARIABLE_PORT_SYNC], PORT_SYNC_PAR_DEFAUT, VARIABLE_PORT_SYNC);
    const fiches = lirePort(env[VARIABLE_PORT_FICHES], PORT_FICHES_PAR_DEFAUT, VARIABLE_PORT_FICHES);

    /*
      ⚠️ Deux serveurs sur le même port, c'est le second qui ne démarre pas — et
      en silence, puisque chacun a désormais sa garde. Le dire ici vaut mieux que
      de laisser chercher pourquoi les fiches n'arrivent pas.
    */
    if (sync === fiches) {
        console.warn(
            `[Ports] ${VARIABLE_PORT_SYNC} et ${VARIABLE_PORT_FICHES} valent tous deux ${sync} : ` +
            `le serveur des fiches ne démarrera pas.`,
        );
    }

    return { sync, fiches };
}
