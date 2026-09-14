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
 * **Le nom du paramètre par lequel une tablette apprend son port de synchronisation.**
 *
 * Il est écrit dans le QR-code par `adresseDeLaTablette`, et lu ici. Personne
 * d'autre ne le compose ni ne le lit.
 */
export const PARAMETRE_PORT_SYNC = 'sync';

/**
 * Le port que l'adresse de la page **dit explicitement**, ou `null`.
 *
 * ⚠️ Une valeur illisible rend `null` plutôt que de lever : la tablette
 * retombe alors sur la déduction, puis sur le défaut. *Un paramètre fautif ne
 * doit pas valoir moins qu'un paramètre absent.*
 */
function portAnnonceParLAdresse(): number | null {
    if (typeof window === 'undefined') return null;
    const annonce = new URLSearchParams(window.location.search).get(PARAMETRE_PORT_SYNC);
    if (!annonce) return null;
    const port = Number(annonce);
    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

/**
 * Le port du `SyncServer` : WebSocket des tablettes, proxy des médias.
 *
 * Trois sources, dans cet ordre : **ce que l'adresse annonce**, puis d'où la
 * page vient, puis le défaut.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI « D'OÙ LA PAGE VIENT » NE SUFFIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cette fonction affirmait que la tablette *charge l'application depuis le
 * SyncServer lui-même, donc son `window.location.port` EST le port de
 * synchronisation*. C'est vrai en production, et **faux en développement** :
 * `remote:get-connection-info` y rend délibérément le port de **Vite** comme
 * port applicatif, pour garder le rechargement à chaud, et le QR-code y
 * envoyait la tablette.
 *
 * ⭐ **Mesuré le 2026-09-14**, une WebSocket ouverte sur chacun des deux ports
 * comme le ferait une tablette :
 *
 * ```
 * ws://…:3001  -> OUVERT, reponse immediate : remote:registered
 * ws://…:5173  -> OUVERT, et AUCUN message en 4 s
 * ```
 *
 * *Vite accepte la connexion et ne dit jamais rien.* La tablette s'affichait
 * donc **connectée**, ne recevait aucune campagne, et restait sur `INITIAL_DATA`
 * — David voyait « The Eternal Quest » au lieu de sa campagne en cours. Les
 * images passaient par le même port et arrivaient en `text/html`.
 *
 * *Une déduction juste dans un cas et muette dans l'autre est pire qu'une
 * absence de valeur : elle ne laisse rien à rattraper.* D'où le paramètre — on
 * le lui **dit**, au lieu de le lui faire deviner.
 */
export function portDeSynchronisation(): number {
    const annonce = portAnnonceParLAdresse();
    if (annonce !== null) return annonce;

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

/**
 * **L'adresse qu'on met dans le QR-code** — ou `null` sans réseau.
 *
 * Elle porte **deux ports, et c'est la seule façon d'être juste dans les deux
 * régimes** :
 *
 * - `port` dit **où charger l'application**. En développement c'est Vite, et
 *   c'est voulu : la tablette profite du rechargement à chaud.
 * - `sync` dit **où est le SyncServer**, qui porte la WebSocket, `/media/` et
 *   `/temp/`. Il ne se déduit d'aucune adresse dès que ce n'est pas lui qui
 *   sert la page.
 *
 * ⛔ **Le défaut du 2026-09-14, signalé par David** : *« la tablette joueur
 * pointe vers Eternal Quest et pas vers la campagne en cours »*. Le QR-code
 * n'écrivait que `port`, donc `5173` en développement, et
 * `portDeSynchronisation()` en déduisait le port de synchronisation. La
 * tablette ouvrait sa WebSocket **sur le serveur de rechargement à chaud de
 * Vite, qui l'accepte et ne dit jamais rien** : connectée en apparence, muette
 * en fait, et restée sur les données de démonstration.
 *
 * ⭐ **Troisième fois que ces deux champs sont confondus**, après le proxy des
 * médias et le pont des boutons de l'afficheur — dont le commentaire, juste
 * au-dessus, décrit ce mode d'échec depuis le 2026-09-13. *Composer l'adresse à
 * un seul endroit ne sert à rien tant qu'il reste un endroit où on la compose
 * à la main.*
 *
 * ⚠️ En production les deux ports sont le même nombre : le paramètre y est
 * redondant, et le rendre conditionnel n'aurait fait qu'ajouter un cas où il
 * peut manquer.
 */
function adresseDUnClient(
    info: InfoDeConnexion | null | undefined,
    fenetre: 'tablet' | 'remote',
): string | null {
    if (!info?.ip) return null;

    const portDeLApplication = info.port ?? info.mediaPort ?? PORT_SYNC_PAR_DEFAUT;
    const portDuSync = info.mediaPort ?? PORT_SYNC_PAR_DEFAUT;
    return `http://${info.ip}:${portDeLApplication}/?window=${fenetre}&${PARAMETRE_PORT_SYNC}=${portDuSync}`;
}

/** L'adresse du Hub joueur — celle du QR-code. */
export function adresseDeLaTablette(info: InfoDeConnexion | null | undefined): string | null {
    return adresseDUnClient(info, 'tablet');
}

/**
 * L'adresse de la télécommande du meneur.
 *
 * ⚠️ **Elle souffrait du même défaut que la tablette**, et pour la même raison :
 * elle est un client du navigateur, elle rejoint le `SyncServer` par le même
 * chemin, et l'écran des Réglages lui composait une adresse au port applicatif.
 * *Le second exemplaire d'un défaut ne se trouve qu'en cherchant qui d'autre
 * fait le même geste.*
 */
export function adresseDeLaTelecommande(info: InfoDeConnexion | null | undefined): string | null {
    return adresseDUnClient(info, 'remote');
}
