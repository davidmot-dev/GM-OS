/**
 * Rôle de la fenêtre courante.
 *
 * L'application ouvre plusieurs fenêtres sur la **même origine** — Player Hub,
 * projecteur, télécommande — qui partagent donc la même base IndexedDB, et avec
 * elle le store de campagne persisté.
 *
 * Une seule d'entre elles possède ces données : la fenêtre MJ. Les autres les
 * reçoivent par synchronisation, avec les médias déjà résolus (base64 ou URL).
 * Si elles les réécrivaient, ces formes résolues remplaceraient les
 * identifiants de la médiathèque dans la campagne elle-même, définitivement.
 */

export type WindowRole = 'gm' | 'hub' | 'tablet' | 'projector' | 'remote';

export function getWindowRole(): WindowRole {
    if (typeof window === 'undefined') return 'gm';

    const target = new URLSearchParams(window.location.search).get('window');
    switch (target) {
        case 'hub': return 'hub';
        case 'tablet': return 'tablet';
        case 'projector': return 'projector';
        case 'remote': return 'remote';
        default: return 'gm';
    }
}

/** Vrai pour la seule fenêtre autorisée à écrire les données de campagne. */
export function isMainWindow(): boolean {
    return getWindowRole() === 'gm';
}
