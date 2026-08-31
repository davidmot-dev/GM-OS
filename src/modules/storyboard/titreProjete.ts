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
 * TROIS SURFACES, UN SEUL MESSAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'image projetée s'affiche à trois endroits qui ne partagent rien : la fenêtre
 * de projection (`ProjectorView`), le Player Hub, et la tablette — qui est au
 * bout d'un réseau et n'a pas de pont Electron.
 *
 * Le titre emprunte donc **le canal qui les atteint déjà tous les trois**,
 * `image:sync-hub-data`, avec un type de plus. Le processus principal le diffuse
 * sans savoir à qui il s'adresse ; **chaque surface filtre sur sa propre cible**.
 * *Diffuser puis filtrer est plus sûr qu'adresser : une fenêtre qui s'ouvre en
 * retard n'a pas à être connue de l'émetteur.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA POLICE VIENT DU THÈME, PAS D'UN RÉGLAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le texte prend `--font-display`, la police de titre que `useThemeDuJeu` pose
 * depuis `docs/systems/<jeu>/theme/theme.css`. Rien à choisir, rien à retenir :
 * *changer de campagne change le titre*, comme le reste de l'interface.
 *
 * ⚠️ La tablette n'a pas de pont Electron et ne lit donc pas le thème du jeu :
 * elle retombe sur la police de titre de GM-OS. Le titre s'y affiche, dans une
 * autre fonte.
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
}

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
}): TitreProjete {
    const fondu = Math.min(FONDU_MAX, Math.max(FONDU_MIN, Number(brut.fondu ?? FONDU_PAR_DEFAUT) || 0));
    const duree = brut.duree === null || brut.duree === undefined || Number(brut.duree) <= 0
        ? null
        : Math.min(DUREE_MAX, Math.max(DUREE_MIN, Number(brut.duree)));
    return { cible: brut.cible, texte: brut.texte.trim(), fondu, duree };
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
 * Un magasin plutôt qu'un état local : deux chemins l'alimentent — le pont
 * Electron pour les fenêtres, la liaison réseau pour la tablette — et l'écran
 * n'a pas à savoir duquel il vient.
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
        return normaliserLeTitre({ cible: brut.cible, texte: brut.texte, fondu: brut.fondu, duree: brut.duree });
    } catch {
        // Un message illisible ne doit pas faire tomber l'écran de projection.
        return null;
    }
}

/** Envoie un titre — ou son retrait, avec un texte vide — vers les écrans. */
export function envoyerLeTitre(titre: TitreProjete): void {
    window.appBridge?.image?.syncHubData?.('titre', JSON.stringify(titre));
}
