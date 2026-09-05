/**
 * **Reconnaître une vidéo YouTube dans un marque-page, et savoir la projeter.**
 *
 * Demandé par David le 2026-09-05 : *« les vidéos YouTube sont visibles à partir
 * de Web-OS »*. Web-OS tient déjà la liste des liens du meneur ; une vidéo n'y
 * devient donc pas un nouvel objet, juste **un lien qu'on sait aussi projeter**.
 *
 * ⚠️ **Une vidéo YouTube n'est pas un média de GM-OS, et il faut le savoir en la
 * lançant.** Elle demande Internet en séance, et elle ne part ni dans la
 * sauvegarde ni dans Nexus — seule l'adresse voyage.
 *
 * ⭐ **Son volume, lui, obéit depuis le 2026-09-05.** J'avais annoncé le
 * contraire : un cadre distant n'est branchable sur aucun contexte audio, donc
 * *rien* ne l'atteindrait. C'était confondre deux choses. L'**enceinte de
 * sortie** reste hors de portée — `setSinkId` n'a pas de prise sur un cadre —
 * mais le **niveau** se commande par `postMessage`, et suit donc le volume
 * général, le Focus et le ducking comme le reste. Voir
 * [[pilotageDuLecteurYouTube]].
 */

/** Les hôtes que YouTube emploie, et eux seuls. */
const HOTES = new Set([
    'youtube.com', 'www.youtube.com', 'm.youtube.com',
    'youtu.be', 'www.youtu.be',
    'youtube-nocookie.com', 'www.youtube-nocookie.com',
]);

/**
 * Un identifiant de vidéo fait onze caractères de l'alphabet des URL.
 *
 * Le vérifier évite de projeter un cadre noir sur une adresse qui *ressemble* à
 * une vidéo — `youtube.com/results?search_query=…`, une chaîne, une playlist
 * sans vidéo. *Un bouton qui s'allume sur ce qu'il ne sait pas faire ment.*
 */
const IDENTIFIANT = /^[A-Za-z0-9_-]{11}$/;

/** Les segments de chemin qui précèdent un identifiant. */
const SEGMENTS_PORTEURS = new Set(['embed', 'shorts', 'live', 'v']);

/**
 * Le début demandé, en secondes.
 *
 * YouTube écrit `t=90`, `t=90s`, ou `t=1m30s` — et `start=90` dans ses propres
 * URL d'intégration. Les trois se lisent ici.
 */
function debutDe(parametres: URLSearchParams): number | undefined {
    const brut = parametres.get('t') ?? parametres.get('start');
    if (!brut) return undefined;

    const simple = Number(brut);
    if (Number.isFinite(simple) && simple > 0) return Math.floor(simple);

    const compose = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(brut.trim());
    if (!compose) return undefined;
    const [, h, m, s] = compose;
    const total = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
    return total > 0 ? total : undefined;
}

/** Ce qu'on retient d'un lien YouTube. */
export interface VideoYouTube {
    id: string;
    /** Secondes à passer avant de commencer, si l'adresse en demandait. */
    debut?: number;
}

/**
 * La vidéo que désigne cette adresse, ou `null` si ce n'en est pas une.
 *
 * ⚠️ **`null` n'est pas une erreur** : la plupart des marque-pages du meneur
 * sont des tables de règles et des générateurs de noms. Ne rien reconnaître est
 * le cas courant.
 */
export function videoYouTube(adresse: string): VideoYouTube | null {
    let url: URL;
    try {
        url = new URL(adresse.trim());
    } catch {
        return null;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!HOTES.has(url.hostname.toLowerCase())) return null;

    const debut = debutDe(url.searchParams);
    const segments = url.pathname.split('/').filter(Boolean);

    // youtu.be/<id> — l'identifiant est seul, à la racine.
    if (url.hostname.toLowerCase().endsWith('youtu.be')) {
        const id = segments[0];
        return id && IDENTIFIANT.test(id) ? { id, debut } : null;
    }

    // youtube.com/watch?v=<id>
    const parV = url.searchParams.get('v');
    if (parV && IDENTIFIANT.test(parV)) return { id: parV, debut };

    // youtube.com/embed/<id>, /shorts/<id>, /live/<id>
    if (segments.length >= 2 && SEGMENTS_PORTEURS.has(segments[0])) {
        const id = segments[1];
        if (IDENTIFIANT.test(id)) return { id, debut };
    }

    return null;
}

/**
 * L'adresse à mettre dans le cadre de projection.
 *
 * Trois choix qui se voient à la table :
 *
 * - **`youtube-nocookie.com`** : le domaine sans traceur. Rien à gagner à
 *   pister le meneur chez lui.
 * - **`rel=0`** : à la fin, YouTube ne propose plus que des extraits de la même
 *   chaîne au lieu d'un mur de vidéos suggérées. *Il n'existe aucun réglage qui
 *   supprime l'écran de fin ;* c'est le moins mauvais, et c'est pourquoi
 *   l'interface conseille de couper l'écran avant la fin.
 * - **`playsinline=1`** : la vidéo reste dans son cadre au lieu de réclamer le
 *   plein écran du système, qui passerait par-dessus la fenêtre de projection.
 * - **`enablejsapi=1`** *(2026-09-05)* : sans lui, le lecteur n'écoute aucun
 *   ordre, et **son volume échappe à GM-OS pour de bon**. Avec lui, il accepte
 *   `setVolume` par `postMessage` — voir [[pilotageDuLecteurYouTube]].
 *
 * ⚠️ **`muet` n'est pas un réglage, c'est une précaution de démarrage.** Le
 * lecteur commence à jouer avant d'écouter quoi que ce soit ; si la table est
 * coupée, le laisser démarrer à plein volume ferait entrer un éclat de son que
 * l'ordre suivant viendrait éteindre une seconde trop tard. *Ce qui doit être
 * silencieux doit naître silencieux.* Hors de ce cas, on démarre audible :
 * *rester muet parce qu'un ordre s'est perdu serait pire.*
 */
export function adresseDIntegration(video: VideoYouTube, options?: { muet?: boolean }): string {
    const parametres = new URLSearchParams({
        autoplay: '1',
        rel: '0',
        modestbranding: '1',
        playsinline: '1',
        enablejsapi: '1',
    });
    if (video.debut) parametres.set('start', String(video.debut));
    if (options?.muet) parametres.set('mute', '1');

    return `https://www.youtube-nocookie.com/embed/${video.id}?${parametres.toString()}`;
}

/**
 * Le préfixe qui distingue une projection YouTube d'un chemin de média.
 *
 * Le projecteur reçoit **une chaîne** et rien d'autre — c'est ainsi que la carte
 * (`__tactical_map__`) et le tableau blanc (`__whiteboard__`) voyagent déjà.
 * *On suit la convention en place plutôt que d'ouvrir un second canal :* un
 * deuxième chemin vers le même écran finit toujours par diverger du premier.
 */
export const PREFIXE_YOUTUBE = '__youtube__';

/** Ce qu'on envoie au projecteur pour cette vidéo. */
export function marqueurDeProjection(video: VideoYouTube): string {
    return `${PREFIXE_YOUTUBE}${video.id}${video.debut ? `@${video.debut}` : ''}`;
}

/** La vidéo que désigne un marqueur reçu, ou `null` si ce n'en est pas un. */
export function videoDuMarqueur(marqueur: string): VideoYouTube | null {
    if (!marqueur.startsWith(PREFIXE_YOUTUBE)) return null;

    const [id, debut] = marqueur.slice(PREFIXE_YOUTUBE.length).split('@');
    if (!IDENTIFIANT.test(id)) return null;

    const secondes = Number(debut);
    return { id, debut: Number.isFinite(secondes) && secondes > 0 ? secondes : undefined };
}
