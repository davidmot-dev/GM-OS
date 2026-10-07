/**
 * **Le papier du tableau blanc — clair ou sombre, au choix du meneur.**
 *
 * Le papier clair est blanc quel que soit le thème : c'est une feuille, pas un
 * fond d'interface. Ses barres d'outils suivent la feuille, pour rester
 * lisibles dessus. Le papier sombre, lui, est le fond de l'application et
 * prend les jetons du thème.
 *
 * Refonte, L6 (2026-10-03) : sorti des composants pour être exempté de la garde
 * des couleurs brutes (`PALETTES_DE_CONTENU`), comme
 * `RemoteWhiteboardView.tsx`, le même papier vu de la tablette.
 *
 * ⚠️ Les classes sont écrites en toutes lettres : Tailwind analyse le source.
 */

export interface Papier {
    /** La feuille elle-même. */
    fond: string;
    /** Le bandeau du haut. */
    bandeau: string;
    /** Les panneaux d'outils flottants. */
    panneau: string;
    /** Un outil non choisi. */
    outil: string;
    /** Le bouton qui bascule le papier. */
    bascule: string;
    /** L'icône de la palette de couleurs. */
    icone: string;
    /** Le tour d'une pastille de couleur. */
    tourDePastille: string;
}

/** La première couleur du crayon suit le papier, comme ses barres d'outils. */
export const couleursDuTableau = (clair: boolean) => [
    clair ? '#000000' : '#ffffff',
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4',
];

export const PAPIER: Readonly<Record<'clair' | 'sombre', Papier>> = {
    clair: {
        fond: 'bg-white',
        bandeau: 'bg-white/80 border-app-border/30',
        panneau: 'bg-white/90 border-black/10',
        outil: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        bascule: 'text-amber-600 hover:bg-amber-600/10',
        icone: 'text-slate-600',
        tourDePastille: 'border-black/10',
    },
    sombre: {
        fond: 'bg-app-bg',
        bandeau: 'bg-app-surface/50 border-app-border/20',
        panneau: 'bg-app-surface/80 border-app-text/10',
        outil: 'text-app-text/50 hover:text-app-text hover:bg-app-text/5',
        bascule: 'text-app-text/50 hover:text-accent hover:bg-app-text/5',
        icone: 'text-app-text/40',
        tourDePastille: 'border-app-text/10',
    },
};
