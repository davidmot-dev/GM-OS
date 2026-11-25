/**
 * **Les trois rôles de la tablette de la table** — Fire HD 8, registre § 256, T14 (24/11/2026).
 *
 * Décision Q1 du 15/11 : un rôle à la fois, choisi sur un accueil à trois boutons ; la tablette garde
 * son rôle et le rouvre au démarrage (C11). Le rôle se mémorise dans le stockage du navigateur, lu et
 * écrit sous `try/catch` : stockage bloqué ou effacé, la tablette revient simplement à l'accueil.
 */
export type RoleDeLaTablette = 'aide' | 'appareil' | 'ecran';

const CLE = 'gmos-role-de-la-tablette';

/** La fenêtre que chaque rôle ouvre (`?window=`). */
export const FENETRE_DU_ROLE: Record<RoleDeLaTablette, string> = {
    aide: 'remote',
    appareil: 'appareil-de-table',
    ecran: 'ecran-de-table',
};

/** Les rôles publics : sans privilège, ils font oublier le secret d'appairage (si un code est réglé). */
export const estPublic = (role: RoleDeLaTablette): boolean => role !== 'aide';

const estUnRole = (v: unknown): v is RoleDeLaTablette => v === 'aide' || v === 'appareil' || v === 'ecran';

export function lireRoleMemorise(): RoleDeLaTablette | null {
    try {
        const v = window.localStorage.getItem(CLE);
        return estUnRole(v) ? v : null;
    } catch {
        return null;
    }
}

export function memoriserRole(role: RoleDeLaTablette): void {
    try { window.localStorage.setItem(CLE, role); } catch { /* stockage bloqué : l'accueil reviendra */ }
}

/**
 * Le port du serveur annoncé par l'adresse (`sync=`), gardé d'un rôle à l'autre : en développement, la
 * page vient de Vite et c'est lui seul qui dit où joindre le `SyncServer` (`portsDuRenderer.ts`).
 */
const suiteDeLAdresse = (): string => {
    const sync = new URLSearchParams(window.location.search).get('sync');
    return sync ? `&sync=${encodeURIComponent(sync)}` : '';
};

/** L'adresse d'un rôle, sur l'origine de la page (le port applicatif, jamais celui des médias). */
export function adresseDuRole(role: RoleDeLaTablette): string {
    return `${window.location.pathname}?window=${FENETRE_DU_ROLE[role]}${suiteDeLAdresse()}`;
}

/** L'accueil, qui ne rouvre pas le rôle mémorisé : c'est le bouton « Changer de rôle ». */
export function adresseDeLAccueil(): string {
    return `${window.location.pathname}?window=accueil-tablette&choisir=1${suiteDeLAdresse()}`;
}
