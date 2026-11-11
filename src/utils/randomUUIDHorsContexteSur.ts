/**
 * **`crypto.randomUUID` sur une tablette servie en `http`** — 11/11/2026.
 *
 * *David, sur une vraie tablette, en Argyropée : « l'écran apparaît bien, mais
 * lancer le jet ne fait rien ».* Le panneau de jet appelle `crypto.randomUUID()`
 * dès le début de `lancer()` (depuis le 21/10) ; or le navigateur **ne fournit
 * cette fonction que dans un contexte sûr** (HTTPS, `localhost`, `127.0.0.1`).
 * Le Hub d'une tablette s'ouvre en `http://192.168.…` : la fonction n'existe
 * pas, l'appel lève une erreur, et le bouton ne fait rien — sans un mot.
 *
 * ⚠️ **Invisible à tous les essais** : jsdom la fournit, et les e2e ouvrent le
 * Hub en `127.0.0.1`, qui compte pour un contexte sûr. Le code en compte plus de
 * cent appels (combat, modules du jeu, Voyageur…) : chacun casserait de même sur
 * une vraie tablette. On la fournit donc **une fois, au démarrage**, plutôt que
 * de corriger cent appels et d'attendre le cent-unième.
 *
 * `crypto.getRandomValues`, lui, reste disponible hors contexte sûr : il donne
 * le hasard d'un UUID version 4 (RFC 9562, § 5.4).
 */

type Uuid = `${string}-${string}-${string}-${string}-${string}`;

/** Un UUID version 4 tiré de seize octets de hasard. */
export function uuidDepuisLeHasard(octets: Uint8Array): Uuid {
    const o = Uint8Array.from(octets.subarray(0, 16));
    o[6] = (o[6] & 0x0f) | 0x40; // version 4
    o[8] = (o[8] & 0x3f) | 0x80; // variante RFC
    const h = Array.from(o, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Fournit `randomUUID` à `cible` quand le navigateur l'a retenu. Rend `true`
 * s'il a fallu le fournir ; ne remplace jamais celui du navigateur.
 */
export function fournirRandomUUID(cible: Crypto | undefined = globalThis.crypto): boolean {
    if (!cible || typeof cible.randomUUID === 'function' || typeof cible.getRandomValues !== 'function') return false;
    Object.defineProperty(cible, 'randomUUID', {
        value: () => uuidDepuisLeHasard(cible.getRandomValues(new Uint8Array(16))),
        configurable: true,
        writable: true,
    });
    return true;
}

fournirRandomUUID();
