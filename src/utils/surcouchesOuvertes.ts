/**
 * **Le registre des surcouches ouvertes — qui a la main sur le clavier.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI IL EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux défauts qui n'avaient pas l'air d'être le même, comptés le 2026-09-13 :
 *
 * 1. **Échap ne fermait presque rien.** Quarante fichiers portent un
 *    `fixed inset-0` ; douze seulement parlaient d'`Escape`, et la moitié de
 *    ces douze l'écoutaient sur un champ de saisie, pas sur la surcouche. Le
 *    `ModalProvider` — `alert`, `confirm`, `prompt` et **vingt-neuf variantes
 *    `custom`**, dont les Paramètres — ne l'écoutait pas du tout. *Le défaut
 *    signalé par David visait un écran ; il y en avait une trentaine derrière.*
 *
 * 2. **Aucune de ces surcouches ne prenait la main sur le clavier.**
 *    `estUneFrappeDePastille` écarte les « boîtes ouvertes » en cherchant
 *    `[role="dialog"]` dans le DOM. Cet attribut n'existait que dans **deux**
 *    fichiers côté meneur. Médiathèque, Forge, aperçu plein écran, Oracle,
 *    visionneur de règles : une lettre frappée hors d'un champ y lançait encore
 *    la pastille de Sound-OS **et** la scène de Light-OS, en pleine séance.
 *
 * *Une famille de défauts ne se referme pas écran par écran* — et ces deux
 * faces se referment avec la même pièce : **savoir ce qui est ouvert, et dans
 * quel ordre.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL GARANTIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - **Une seule surcouche répond à Échap : celle du dessus.** Les gardes
 *   écrites à la main ne savaient pas faire ça — la Médiathèque énumérait ses
 *   deux enfants (`if (previewItem || editingMediaId) return`), ce qui tenait
 *   tant que personne n'en ajoutait un troisième. La pile le sait sans qu'on
 *   l'énumère.
 * - **Un écouteur unique sur `window`**, posé à la première surcouche et retiré
 *   à la dernière, au lieu d'un par écran.
 * - **`estUneFrappeDePastille` l'interroge** : plus besoin de se souvenir de
 *   poser `role="dialog"` pour rendre une boîte muette au clavier.
 *
 * ⚠️ **L'ordre de la pile est l'ordre d'ouverture, pas l'ordre de rendu.** Une
 * entrée ne bouge jamais tant qu'elle reste ouverte — c'est pourquoi
 * `useFermetureParEchap` ne réinscrit rien quand son rappel change d'identité.
 * *Une pile qui se réordonne à chaque rendu ne dit plus qui est au-dessus.*
 */

export interface SurcoucheInscrite {
    /** Identité stable, propre à une ouverture. Deux surcouches n'en partagent jamais. */
    readonly jeton: symbol;
    /** Ce que fait Échap. **Jamais plus que le bouton de fermeture de l'écran.** */
    readonly fermer: () => void;
    /** Pour les traces et les tests — le nom de l'écran, pas une clé. */
    readonly nom: string;
}

const pile: SurcoucheInscrite[] = [];

/*
  **Un champ de saisie n'arrête pas Échap** — tranché le 2026-09-13.

  La règle inverse avait été écrite d'abord : rendre la main au champ, et ne
  fermer qu'à la frappe suivante, pour qu'une touche distraite ne coûte pas une
  fiche de campagne à moitié tapée. Elle a été retirée avant d'être livrée, pour
  deux raisons qui pèsent plus lourd :

  - ⛔ **Le dépôt avait déjà tranché.** `SpotlightSearch` ferme depuis son champ
    focalisé, et l'éditeur de scène de Light-OS **sélectionne** son champ à
    l'ouverture : la règle des deux frappes y aurait rendu la première muette.
    *Deux frappes pour sortir, c'est exactement ce que David a signalé comme
    « Échap ne ferme pas ».*
  - Le risque de perdre une saisie existe déjà, à l'identique, sur le bouton de
    fermeture de chaque écran. *Échap fait ce que fait ce bouton — ni plus, ni
    moins, et ce n'est pas à lui de réparer ce que la croix fait aussi.*

  ⚠️ **Ce qui reste à la charge des écrans** : une édition en ligne qui écoute
  Échap sur son champ (renommer un groupe, nommer un préréglage) doit **arrêter
  la propagation**, sans quoi une seule frappe annulerait la saisie *et*
  refermerait l'écran derrière. Les trois cas du dépôt le font.
*/
function auClavier(evenement: KeyboardEvent): void {
    if (evenement.key !== 'Escape') return;

    const sommet = pile[pile.length - 1];
    if (!sommet) return;

    /*
      `preventDefault` et rien de plus : `stopImmediatePropagation` dépendrait
      de l'ordre d'inscription des autres écouteurs de `window`, que personne ne
      contrôle. Les trois moteurs de pastilles sont écartés autrement — ils
      passent tous par `estUneFrappeDePastille`, qui interroge cette pile.
    */
    evenement.preventDefault();
    sommet.fermer();
}

function poserLEcoute(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', auClavier);
}

function retirerLEcoute(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', auClavier);
}

/** Inscrit une surcouche **au sommet**. C'est elle qui répondra à Échap. */
export function empilerLaSurcouche(surcouche: SurcoucheInscrite): void {
    if (pile.some(s => s.jeton === surcouche.jeton)) return;
    if (pile.length === 0) poserLEcoute();
    pile.push(surcouche);
}

/**
 * Retire une surcouche, **où qu'elle soit dans la pile**.
 *
 * ⚠️ Elle n'est pas toujours au sommet : React démonte parfois un parent avant
 * son enfant. *Dépiler aveuglément le dernier retirerait la mauvaise.*
 */
export function depilerLaSurcouche(jeton: symbol): void {
    const index = pile.findIndex(s => s.jeton === jeton);
    if (index === -1) return;
    pile.splice(index, 1);
    if (pile.length === 0) retirerLEcoute();
}

/** **Y a-t-il une boîte ouverte ?** Lu par `estUneFrappeDePastille`. */
export function ilYAUneSurcoucheOuverte(): boolean {
    return pile.length > 0;
}

/** Les noms des surcouches ouvertes, de la plus ancienne à celle du dessus. */
export function surcouchesOuvertes(): readonly string[] {
    return pile.map(s => s.nom);
}

/**
 * **Réservé aux tests.** Un test qui laisse une surcouche inscrite rendrait le
 * suivant muet au clavier sans dire pourquoi.
 */
export function viderLesSurcouches(): void {
    if (pile.length > 0) retirerLEcoute();
    pile.length = 0;
}
