/**
 * **Les couleurs d'une pastille — une palette, pas un nuancier.**
 *
 * Demandée par David le 2026-09-16, avec le nom et le raccourci : *« quand
 * j'édite un pad, je veux pouvoir changer le nom, la couleur du pad et
 * assigner une touche »*. Palette imposée plutôt que sélecteur libre, tranché
 * avec lui.
 *
 * ⛔ **Le motif est déjà payé par Light-OS** : `#334155` y voulait dire
 * « personne n'a choisi », et son contraste de 1,6 sur le fond le rendait
 * invisible. Un sélecteur libre laisse piocher exactement ça. *Huit teintes
 * choisies pour tenir sur le fond sombre valent mieux que seize millions dont
 * la plupart ne se voient pas.*
 *
 * ⚠️ **On stocke la CLÉ, jamais la couleur.** Une pastille enregistre `'ambre'`
 * et non `'#f59e0b'` : le jour où le thème change, ou qu'une teinte se révèle
 * illisible, on corrige ici et **toutes les pastilles suivent**. Une valeur
 * hexadécimale recopiée dans les données serait, elle, gelée pour toujours.
 *
 * ⚠️ **Les classes sont écrites en toutes lettres, exprès.** Tailwind analyse
 * le source : une classe composée à l'exécution (`border-${teinte}-500`) ne
 * produit aucune règle. *C'est la panne du greffon `tailwindcss-animate` du
 * 03/09, en plus discret — une classe qui n'existe pas ne prévient pas.*
 */

export interface CouleurDePastille {
    /** Ce que le meneur lit dans l'éditeur. */
    nom: string;
    /** La bordure et le fond au repos. */
    tuile: string;
    /** L'icône du morceau. */
    icone: string;
    /** La pastille de couleur dans l'éditeur. */
    echantillon: string;
}

/**
 * La clé qui veut dire « aucune couleur choisie ».
 *
 * Elle existe pour qu'on puisse la **choisir à nouveau** : sans elle, colorer
 * une pastille serait un aller sans retour.
 */
export const SANS_COULEUR = 'aucune';

export const COULEURS_DE_PASTILLE: Record<string, CouleurDePastille> = {
    [SANS_COULEUR]: {
        nom: 'Aucune',
        tuile: 'bg-app-bg/40 border-app-border/50 hover:bg-app-surface/60 hover:border-accent/40',
        icone: 'text-slate-700 group-hover:text-accent/70',
        echantillon: 'bg-app-surface border-app-border',
    },
    ambre: {
        nom: 'Ambre',
        tuile: 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400',
        icone: 'text-amber-500/70 group-hover:text-amber-400',
        echantillon: 'bg-amber-500 border-amber-400',
    },
    rouge: {
        nom: 'Rouge',
        tuile: 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20 hover:border-red-400',
        icone: 'text-red-500/70 group-hover:text-red-400',
        echantillon: 'bg-red-500 border-red-400',
    },
    orange: {
        nom: 'Orange',
        tuile: 'bg-orange-500/10 border-orange-500/40 hover:bg-orange-500/20 hover:border-orange-400',
        icone: 'text-orange-500/70 group-hover:text-orange-400',
        echantillon: 'bg-orange-500 border-orange-400',
    },
    emeraude: {
        nom: 'Émeraude',
        tuile: 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-400',
        icone: 'text-emerald-500/70 group-hover:text-emerald-400',
        echantillon: 'bg-emerald-500 border-emerald-400',
    },
    cyan: {
        nom: 'Cyan',
        tuile: 'bg-cyan-500/10 border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400',
        icone: 'text-cyan-500/70 group-hover:text-cyan-400',
        echantillon: 'bg-cyan-500 border-cyan-400',
    },
    violet: {
        nom: 'Violet',
        tuile: 'bg-violet-500/10 border-violet-500/40 hover:bg-violet-500/20 hover:border-violet-400',
        icone: 'text-violet-500/70 group-hover:text-violet-400',
        echantillon: 'bg-violet-500 border-violet-400',
    },
    rose: {
        nom: 'Rose',
        tuile: 'bg-pink-500/10 border-pink-500/40 hover:bg-pink-500/20 hover:border-pink-400',
        icone: 'text-pink-500/70 group-hover:text-pink-400',
        echantillon: 'bg-pink-500 border-pink-400',
    },
};

/**
 * La couleur d'une pastille, **toujours** — y compris pour une clé inconnue.
 *
 * ⚠️ Une clé absente de la palette n'est pas une erreur du meneur : c'est une
 * teinte retirée d'une version à l'autre, ou une sauvegarde plus ancienne.
 * *Rendre `undefined` ferait une tuile sans bordure ni fond, donc une pastille
 * invisible — bien pire que la couleur qu'on ne sait plus rendre.*
 */
export function couleurDeLaPastille(cle: string | undefined | null): CouleurDePastille {
    if (!cle) return COULEURS_DE_PASTILLE[SANS_COULEUR];
    return COULEURS_DE_PASTILLE[cle] ?? COULEURS_DE_PASTILLE[SANS_COULEUR];
}

/** Les clés dans l'ordre où l'éditeur les propose, « Aucune » en tête. */
export function clesDeLaPalette(): string[] {
    return Object.keys(COULEURS_DE_PASTILLE);
}
