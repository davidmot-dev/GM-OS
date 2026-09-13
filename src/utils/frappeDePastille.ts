import { ilYAUneSurcoucheOuverte } from './surcouchesOuvertes';

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

    /*
      **Une boîte ouverte a la main sur le clavier** — et on le demande
      maintenant au registre, pas au DOM.

      ⛔ La recherche de `[role="dialog"]` était une garde qui n'attrapait
      presque rien : comptée le 2026-09-13, cet attribut n'existait que dans
      **deux** fichiers côté meneur. Médiathèque, Forge, aperçu plein écran,
      Oracle, visionneur de règles, QR réseau : toutes ouvertes, **toutes
      muettes pour cette garde**. Une lettre frappée hors d'un champ y lançait
      la pastille de Sound-OS et la scène de Light-OS, en séance.

      *Une garde qui dépend d'un attribut qu'il faut penser à poser ne protège
      que les écrans dont l'auteur connaissait la garde.*

      Les deux lectures sont gardées : le registre pour les surcouches inscrites
      par `useFermetureParEchap`, le DOM pour toute boîte qui porterait
      l'attribut sans passer par le crochet.
    */
    if (ilYAUneSurcoucheOuverte()) return false;
    if (typeof document !== 'undefined' && document.querySelectorAll('[role="dialog"]').length > 0) {
        return false;
    }

    return true;
}
