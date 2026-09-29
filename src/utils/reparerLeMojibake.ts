/**
 * **Rend lisible un texte UTF-8 qui a été relu en cp1252.**
 *
 * Trouvé par la vitrine le 2026-09-28 : les chroniques affichaient
 * « âš”ï¸ Rapport de Combat ». La source est réparée depuis le 18/08
 * (`f3c7c672` : `fr/modules.json` avait été relu en cp1252), mais **les
 * événements écrits avant gardent le texte abîmé** — la sauvegarde du 22/09
 * porte encore les octets de « âš”ï¸ ».
 *
 * ⛔ **On répare à la lecture, jamais dans les données.** Réécrire la chronologie
 * de David pour un défaut d'affichage serait faire du correctif un risque de
 * perte ; un événement réparé ne s'enregistre que si le meneur le modifie.
 *
 * **Ne touche que les séquences qui redeviennent de l'UTF-8 valide.** Un octet
 * de tête (`Â` à `ô`) suivi d'exactement le nombre d'octets de suite qu'il
 * annonce, et que le décodeur strict accepte : « é », « Déjà » ou « ²⁄ » ne se
 * décodent pas, ils restent tels quels.
 */

/** Les caractères que cp1252 place entre 0x80 et 0x9F. Les cinq trous restent leur contrôle C1. */
const CP1252_80_9F = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ';

/** L'octet que cp1252 donne à ce caractère, ou `null` s'il n'en a pas. */
function octetCp1252(caractere: string): number | null {
    const code = caractere.charCodeAt(0);
    if (code < 0x80) return code;
    if (code >= 0xa0 && code <= 0xff) return code;
    const i = CP1252_80_9F.indexOf(caractere);
    return i >= 0 ? 0x80 + i : null;
}

/** Combien d'octets de suite annonce cet octet de tête UTF-8 (0 s'il n'en est pas un). */
function suitesAnnoncees(octet: number): number {
    if (octet >= 0xc2 && octet <= 0xdf) return 1;
    if (octet >= 0xe0 && octet <= 0xef) return 2;
    if (octet >= 0xf0 && octet <= 0xf4) return 3;
    return 0;
}

const DECODEUR = new TextDecoder('utf-8', { fatal: true });

export function reparerLeMojibake(texte: string): string;
export function reparerLeMojibake(texte: string | undefined): string | undefined;
export function reparerLeMojibake(texte: string | undefined): string | undefined {
    // Le cas de presque tous les textes : aucun octet de tête possible, rien à faire.
    if (!texte || !/[Â-ô]/.test(texte)) return texte;

    let sortie = '';
    let i = 0;
    while (i < texte.length) {
        const tete = octetCp1252(texte[i]);
        const n = tete === null ? 0 : suitesAnnoncees(tete);
        if (n > 0 && i + n < texte.length) {
            const octets = [tete as number];
            for (let k = 1; k <= n; k++) {
                const o = octetCp1252(texte[i + k]);
                if (o === null || o < 0x80 || o > 0xbf) break;
                octets.push(o);
            }
            if (octets.length === n + 1) {
                try {
                    sortie += DECODEUR.decode(new Uint8Array(octets));
                    i += n + 1;
                    continue;
                } catch {
                    // Pas de l'UTF-8 valide (surlong, surrogat…) : le texte était sans doute juste.
                }
            }
        }
        sortie += texte[i];
        i += 1;
    }
    return sortie;
}
