/**
 * **Cette frappe est-elle destinée à une pastille ?**
 *
 * Music-OS et Sound-OS écoutent le clavier sur `window` et déclenchent une
 * pastille dès que `e.code` correspond. Chacun portait sa propre garde —
 * identiques toutes les deux, et **toutes les deux incomplètes**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLES LAISSAIENT PASSER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `e.code` **ignore les modificateurs** : `Ctrl+C` produit `KeyC`, comme `C`
 * seul. Un meneur qui copiait du texte hors d'un champ de saisie **lançait donc
 * le son lié à la touche C**, en pleine séance, sans rien avoir demandé. Idem
 * pour `Ctrl+V`, `Ctrl+S`, `Ctrl+Z`.
 *
 * Trouvé le 2026-08-30 en préparant les raccourcis de navigation, qui se
 * seraient heurtés au même mur : `Ctrl+1` produit `Digit1`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `Shift` n'est pas retenu : il ne sert à aucun raccourci de l'application, et
 * une pastille sur une touche du haut du clavier doit continuer de répondre
 * quand la main traîne sur la majuscule. *On écarte ce qui est revendiqué
 * ailleurs, pas tout ce qui est inhabituel.*
 */
export function estUneFrappeDePastille(evenement: KeyboardEvent): boolean {
    // Revendiqué par les raccourcis de navigation et par le système.
    if (evenement.ctrlKey || evenement.metaKey || evenement.altKey) return false;

    const cible = evenement.target;
    if (cible instanceof HTMLInputElement || cible instanceof HTMLTextAreaElement) return false;
    if (cible instanceof HTMLElement && cible.isContentEditable) return false;

    // Une boîte ouverte a la main sur le clavier.
    if (typeof document !== 'undefined' && document.querySelectorAll('[role="dialog"]').length > 0) {
        return false;
    }

    return true;
}
