/**
 * **Cette fenêtre de projection doit-elle montrer la carte ?**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉFAUT — constaté le 2026-09-25, corrigé le même jour
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `projectionTarget` vaut `'monitor'` **sans dire lequel**, et `ProjectorView`
 * dessinait la carte dès que `mapTarget === 'monitor' && isProjectorWindow` :
 * projeter sur le moniteur 2 la faisait apparaître aussi sur le moniteur 1, en
 * couche 0, sous son image. *Une image opaque le cachait ; un écran au repos le
 * montrait.*
 *
 * Le moniteur est connu depuis le § 114 (`ecranDeLaCarte`, écrit par
 * `projeterLaCarteSur`) : il voyage désormais jusqu'aux projecteurs, et seule
 * la fenêtre de CET écran montre la carte.
 *
 * ⚠️ **Écran inconnu = comportement d'avant.** Une projection démarrée avant ce
 * correctif, ou relue d'un état persisté, n'a pas d'écran : on la laisse
 * s'afficher partout plutôt que nulle part. *Un réglage absent ne doit pas
 * éteindre ce qui marchait.*
 */
export interface FenetreDeProjection {
    /** La cible de la carte : `'hub'`, `'monitor'`, ou `null`. */
    cibleDeLaCarte: string | null;
    /** Le moniteur qui porte la carte, quand la cible est `'monitor'`. */
    ecranDeLaCarte: string | null | undefined;
    /** L'identifiant de CETTE fenêtre — le `displayId` de son adresse. */
    idDeLaFenetre: string;
    /** Est-ce une fenêtre de projecteur (et non le Hub) ? */
    estUnProjecteur: boolean;
    /** Ce que la fenêtre affiche comme image — `__tactical_map__` pour la carte. */
    imageAffichee: string | null;
}

export function fenetreMontreLaCarte(f: FenetreDeProjection): boolean {
    if (f.cibleDeLaCarte === f.idDeLaFenetre) return true;

    if (f.cibleDeLaCarte === 'monitor' && f.estUnProjecteur) {
        /* L'écran est connu : lui, et lui seul. Le marqueur ne suffit plus —
           l'ancien écran de la carte le garde jusqu'à sa prochaine image. */
        if (f.ecranDeLaCarte) return f.ecranDeLaCarte === f.idDeLaFenetre;
        return true;
    }

    return f.imageAffichee === '__tactical_map__';
}
