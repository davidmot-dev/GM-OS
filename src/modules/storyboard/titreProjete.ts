import { create } from 'zustand';

/**
 * **Un titre par-dessus l'image projetée — demandé par David le 2026-08-31.**
 *
 * *« Je voudrais aussi pouvoir rajouter un texte qui s'affichera en titre sur
 * l'écran choisi pour l'image, avec un fade-in / fade-out configurable (en
 * seconde ou permanent). Le texte prend la police définie dans le CSS de la
 * campagne en cours. »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX SURFACES, UN SEUL MESSAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'image projetée s'affiche sur deux surfaces qui ne partagent rien : la
 * fenêtre de projection (`ProjectorView`) et le Player Hub.
 *
 * Le titre emprunte donc **le canal qui les atteint déjà toutes les deux**,
 * `image:sync-hub-data`, avec un type de plus. Le processus principal le diffuse
 * sans savoir à qui il s'adresse ; **chaque surface filtre sur sa propre cible**.
 * *Diffuser puis filtrer est plus sûr qu'adresser : une fenêtre qui s'ouvre en
 * retard n'a pas à être connue de l'émetteur.*
 *
 * ⛔ **La tablette est hors sujet — tranché par David le 2026-08-31 :** *« le
 * storyboard n'est pas destiné aux tablettes »*. Le message y arrive bien par la
 * liaison réseau, mais rien ne le lit : ce n'est pas un oubli, c'est le
 * périmètre. *La contrainte de police que j'allais documenter n'en était donc
 * pas une — je décrivais un défaut sur un écran qui n'était pas concerné.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA POLICE VIENT DU THÈME, PAS D'UN RÉGLAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le texte prend `--font-display`, la police de titre que `useThemeDuJeu` pose
 * depuis `docs/systems/<jeu>/theme/theme.css`. Rien à choisir, rien à retenir :
 * *changer de campagne change le titre*, comme le reste de l'interface.
 *
 * Les deux surfaces qui l'affichent sont des fenêtres Electron : elles portent
 * le thème du jeu, donc la bonne police, sans rien de plus à faire.
 */

/** Ce qui part vers les écrans. Sérialisé en JSON dans le canal existant. */
export interface TitreProjete {
    /** L'écran visé : `hub`, ou l'identifiant d'un moniteur. */
    cible: string;
    /** Le texte. **Vide veut dire « retire le titre »**. */
    texte: string;
    /** Durée du fondu, d'entrée comme de sortie, en secondes. */
    fondu: number;
    /** Combien de temps il reste à l'écran. **`null` = permanent.** */
    duree: number | null;
    /**
     * **Où il se pose sur l'image** — demandé par David le 2026-09-21.
     *
     * ⚠️ `haut` est le défaut parce que c'était le seul comportement avant ce
     * réglage : *un champ neuf ne doit jamais rendre faux ce qui marchait avant
     * lui.* Les titres des moments déjà écrits ne bougent pas d'un pixel.
     */
    position: PositionDuTitre;
    /**
     * La famille de police, prise dans la **même liste que les réglages**
     * (`POLICES_CONNUES`). Vide = la police de titre du thème du jeu, qui était
     * le seul choix jusqu'ici.
     */
    police: string;
    /** La couleur du texte, en hexadécimal. */
    couleur: string;
    /**
     * L'ombre portée.
     *
     * ⛔ **Elle n'est pas décorative** : c'est elle qui rend un titre lisible
     * sur une image claire comme sur une sombre. `fort` est le défaut, parce que
     * c'est ce que faisait le titre avant qu'on puisse en changer — et parce
     * qu'*un titre illisible sur une image trop claire ressemble à un titre qui
     * ne s'est pas affiché.*
     */
    contour: ContourDuTitre;
}

/** Les trois hauteurs offertes. */
export const POSITIONS = ['haut', 'milieu', 'bas'] as const;
export type PositionDuTitre = typeof POSITIONS[number];

/** Les trois ombres offertes. */
export const CONTOURS = ['aucun', 'leger', 'fort'] as const;
export type ContourDuTitre = typeof CONTOURS[number];

/** Le blanc d'avant ce réglage. */
export const COULEUR_PAR_DEFAUT = '#ffffff';

const HEXADECIMAL = /^#[0-9a-f]{6}$/i;

/** Bornes du fondu : zéro est net, au-delà de dix on ne voit plus le titre venir. */
export const FONDU_MIN = 0;
export const FONDU_MAX = 10;
export const FONDU_PAR_DEFAUT = 1;

/** Bornes de la tenue. En deçà d'une seconde, personne n'a le temps de lire. */
export const DUREE_MIN = 1;
export const DUREE_MAX = 600;

/**
 * Ramène des réglages saisis à la main dans des bornes jouables.
 *
 * **`duree` absente ou nulle veut dire permanent**, et c'est le choix de David :
 * un titre de scène reste tant que la scène dure. Il s'en va alors avec le
 * moment, ou quand un autre titre le remplace.
 */
export function normaliserLeTitre(brut: {
    cible: string; texte: string; fondu?: number; duree?: number | null;
    position?: string; police?: string; couleur?: string; contour?: string;
}): TitreProjete {
    const fondu = Math.min(FONDU_MAX, Math.max(FONDU_MIN, Number(brut.fondu ?? FONDU_PAR_DEFAUT) || 0));
    const duree = brut.duree === null || brut.duree === undefined || Number(brut.duree) <= 0
        ? null
        : Math.min(DUREE_MAX, Math.max(DUREE_MIN, Number(brut.duree)));

    /*
      ⚠️ **Chaque défaut est le comportement d'avant ce réglage.** Un titre
      écrit hier n'a aucun de ces champs et doit s'afficher exactement comme
      hier : en haut, blanc, ombre forte, police de titre du thème.
    */
    const position = (POSITIONS as readonly string[]).includes(brut.position ?? '')
        ? brut.position as PositionDuTitre
        : 'haut';
    const contour = (CONTOURS as readonly string[]).includes(brut.contour ?? '')
        ? brut.contour as ContourDuTitre
        : 'fort';
    const couleur = typeof brut.couleur === 'string' && HEXADECIMAL.test(brut.couleur.trim())
        ? brut.couleur.trim().toLowerCase()
        : COULEUR_PAR_DEFAUT;

    return {
        cible: brut.cible,
        texte: brut.texte.trim(),
        fondu,
        duree,
        position,
        police: typeof brut.police === 'string' ? brut.police.trim() : '',
        couleur,
        contour,
    };
}

/**
 * **Quand ce titre doit s'effacer, et quand il doit disparaître.**
 *
 * Deux instants, et pas un seul : le fondu de sortie commence à la fin de la
 * tenue, et le texte ne quitte l'arbre qu'une fois le fondu terminé. *Retirer
 * le nœud à la fin de la tenue supprimerait le fondu au lieu de le jouer.*
 *
 * Rendus en millisecondes, parce que c'est ce que `setTimeout` attend — la
 * conversion faite ici est faite une fois, pas dans chaque écran.
 */
export function minuterieDuTitre(titre: TitreProjete): {
    sortieDansMs: number | null;
    retraitDansMs: number | null;
} {
    if (titre.duree === null) return { sortieDansMs: null, retraitDansMs: null };
    return {
        sortieDansMs: titre.duree * 1000,
        retraitDansMs: (titre.duree + titre.fondu) * 1000,
    };
}

/** Ce titre s'adresse-t-il à cet écran ? */
export function estPourCetEcran(titre: TitreProjete | null, cible: string): boolean {
    return !!titre && titre.cible === cible;
}

/**
 * Le dernier titre reçu par **cette fenêtre**.
 *
 * Un magasin plutôt qu'un état local : l'écran lit un état, il ne s'abonne pas à
 * un canal. La fenêtre de projection et le Player Hub y posent ce que le pont
 * Electron leur apporte.
 */
interface EtatDuTitre {
    titre: TitreProjete | null;
    poserLeTitre: (titre: TitreProjete | null) => void;
}

export const useTitreProjeteStore = create<EtatDuTitre>()((set) => ({
    titre: null,
    poserLeTitre: (titre) => set({ titre }),
}));

/** Lit un message reçu, en refusant tout ce qui n'a pas la bonne forme. */
export function lireLeTitre(charge: unknown): TitreProjete | null {
    if (typeof charge !== 'string' || !charge) return null;
    try {
        const brut = JSON.parse(charge) as Partial<TitreProjete>;
        if (typeof brut?.cible !== 'string' || typeof brut?.texte !== 'string') return null;
        /*
          ⛔ **TOUT ce que le message porte, et pas une liste écrite à la main.**

          Ce parseur reconstruisait l'objet champ par champ, et sa liste s'était
          arrêtée à `{ cible, texte, fondu, duree }`. Les quatre réglages
          d'habillage ajoutés le 2026-09-21 partaient donc de l'éditeur,
          traversaient le pont, et étaient **jetés à la réception** — sans une
          erreur. David : *« j'ai fait une configuration mais cela ne s'applique
          pas »*.

          ⭐ ***Une clé non déclarée écrite puis jetée en silence*** : le même
          défaut que le schéma Zod de la sauvegarde, qui n'était pas
          `passthrough`. On relaie donc l'objet entier, et c'est
          `normaliserLeTitre` — seul juge — qui borne ce qui entre.
        */
        return normaliserLeTitre({ ...brut, cible: brut.cible, texte: brut.texte });
    } catch {
        // Un message illisible ne doit pas faire tomber l'écran de projection.
        return null;
    }
}

/** Envoie un titre — ou son retrait, avec un texte vide — vers les écrans. */
export function envoyerLeTitre(titre: TitreProjete): void {
    window.appBridge?.image?.syncHubData?.('titre', JSON.stringify(titre));
}
