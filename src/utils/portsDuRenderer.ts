import { PORT_SYNC_PAR_DEFAUT, PORT_FICHES_PAR_DEFAUT } from '../../electron/portsDeGmOs';

/**
 * **Les ports, vus depuis un écran.**
 *
 * Le port du `SyncServer` était écrit **en dur dans quatre fichiers** du
 * renderer — `useMediaUrl` deux fois, `useHubSync` deux fois, `useRemoteSync` —
 * et celui des fiches était **déclaré une seconde fois** dans `pontDeLaFiche`,
 * avec un commentaire demandant aux deux nombres de « rester d'accord ».
 *
 * *Deux nombres qu'on prie de rester d'accord finissent par diverger.* Ils
 * viennent tous d'ici, et le défaut d'ici vient de `electron/portsDeGmOs.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LA TABLETTE CONNAÎT SON PORT SANS QU'ON LUI DISE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Elle charge l'application **depuis le SyncServer lui-même** : son
 * `window.location.port` EST le port de synchronisation. Elle suit donc un port
 * déplacé sans rien recevoir de personne.
 *
 * ⚠️ **Les fenêtres Electron, elles, ne le peuvent pas** : le Player Hub est
 * chargé depuis Vite en développement (5173) et depuis un fichier en
 * production. Leur `location` ne dit rien du port des serveurs, et elles
 * retombent donc sur le défaut.
 *
 * **Ce qui reste à faire, et qu'il faut savoir :** si le meneur règle
 * `GMOS_PORT_SYNC` sur autre chose, le Player Hub et le projecteur — qui vivent
 * dans Electron — continueront de viser le défaut. Le pont sait pourtant
 * répondre : `remote:get-connection-info` rend `mediaPort` et `fichesPort`. Le
 * brancher demande de rendre ces lectures **asynchrones**, ce qui est un
 * chantier à part. *Écrit ici pour que la limite soit connue plutôt que
 * découverte.*
 */

/** Vrai dans une fenêtre Electron — meneur, Player Hub, projecteur. */
function dansElectron(): boolean {
    return typeof window !== 'undefined' && !!window.appBridge;
}

/**
 * Le port du `SyncServer` : WebSocket des tablettes, proxy des médias.
 *
 * Sur une tablette, celui d'où la page vient. Ailleurs, le défaut.
 */
export function portDeSynchronisation(): number {
    if (typeof window !== 'undefined' && !dansElectron() && window.location.port) {
        const port = Number(window.location.port);
        if (Number.isInteger(port) && port > 0) return port;
    }
    return PORT_SYNC_PAR_DEFAUT;
}

/**
 * Le port du serveur des fiches.
 *
 * ⚠️ **Il ne se déduit d'aucune adresse** : les fiches sont sur un port
 * *différent* de celui qui sert la page, et c'est cette différence qui les
 * isole du stockage du Player Hub. Une tablette ne peut donc pas le deviner —
 * elle suit le défaut jusqu'à ce que le pont le lui dise.
 */
export function portDesFiches(): number {
    return PORT_FICHES_PAR_DEFAUT;
}

/** Ce que `remote:get-connection-info` rend, vu d'ici. */
export interface InfoDeConnexion {
    ip?: string;
    /** Où l'INTERFACE est servie : Vite en développement, le SyncServer en production. */
    port?: number;
    /** Le SyncServer, **toujours** — c'est lui qui porte `/media/`, `/temp/` et `/bouton`. */
    mediaPort?: number;
}

/**
 * **L'adresse du pont des boutons de l'afficheur** — ou `null` sans réseau.
 *
 * ⛔ **C'est `mediaPort` qu'il faut, et surtout pas `port`.** Les deux sont
 * identiques en production et **diffèrent en développement**, où `port` désigne
 * Vite (5173) parce que c'est lui qui sert l'interface avec son rechargement à
 * chaud. `/bouton` vit dans le SyncServer, comme `/media/` et `/temp/`.
 *
 * ⭐ **Le défaut a été commis le 2026-09-12 et trouvé le lendemain par David** :
 * le panneau affichait `http://…:5173/bouton`, Home Assistant y postait, et
 * **Vite répondait son `index.html`** — aucune erreur, aucun effet. Le
 * commentaire de `remote:get-connection-info` décrivait pourtant ce mode
 * d'échec mot pour mot, pour le proxy média.
 *
 * *Un champ nommé `port` à côté d'un champ nommé `mediaPort` invite à prendre le
 * premier ; la seule défense est de ne composer cette adresse qu'ici.*
 */
export function adresseDuPontDesBoutons(info: InfoDeConnexion | null | undefined): string | null {
    if (!info?.ip) return null;

    const port = info.mediaPort ?? PORT_SYNC_PAR_DEFAUT;
    return `http://${info.ip}:${port}/bouton`;
}
