/**
 * **Les couleurs d'un lien web — une palette de contenu.**
 *
 * Le meneur donne une couleur à chaque lien, pour le retrouver d'un coup d'œil
 * dans la grille : orange, cyan, violet… Ce sont des **teintes choisies**, pas
 * des états ni des catégories de l'interface. Les passer aux jetons du thème
 * (refonte, L6 — 2026-10-03) aurait fondu l'orange et l'ambre dans le même
 * `etat-alerte`, et fait d'un lien rose un lien « en erreur ». D'où ce fichier,
 * exempté de la garde des couleurs brutes (`PALETTES_DE_CONTENU`), comme les
 * pastilles de Music-OS.
 *
 * ⚠️ **Le lien stocke la CLÉ** (`'orange'`), jamais la classe.
 *
 * ⚠️ **Les classes sont écrites en toutes lettres** : Tailwind analyse le
 * source, une classe composée à l'exécution ne produit aucune règle.
 */

/** Les pastilles proposées dans la fenêtre d'édition d'un lien. */
export const ECHANTILLONS_DES_LIENS = [
    { id: 'orange', class: 'bg-orange-500' },
    { id: 'cyan', class: 'bg-cyan-500' },
    { id: 'purple', class: 'bg-purple-500' },
    { id: 'emerald', class: 'bg-accent' },
    { id: 'amber', class: 'bg-amber-500' },
    { id: 'rose', class: 'bg-rose-500' },
] as const;

/**
 * La tuile d'un lien selon sa couleur. `blue` n'est plus proposé, mais des
 * liens anciens le portent encore.
 */
export const TEINTES_DES_LIENS: Readonly<Record<string, string>> = {
    orange: 'border-orange-500/30 hover:border-orange-500 text-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/10 hover:bg-orange-500/20',
    cyan: 'border-cyan-500/30 hover:border-cyan-500 text-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-cyan-500/10 hover:bg-cyan-500/20',
    purple: 'border-purple-500/30 hover:border-purple-500 text-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-purple-500/10 hover:bg-purple-500/20',
    emerald: 'border-accent/30 hover:border-accent text-accent hover:shadow-glow-accent bg-accent/10 hover:bg-accent/20',
    blue: 'border-blue-500/30 hover:border-blue-500 text-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-blue-500/10 hover:bg-blue-500/20',
    amber: 'border-amber-500/30 hover:border-amber-500 text-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-amber-500/10 hover:bg-amber-500/20',
    rose: 'border-rose-500/30 hover:border-rose-500 text-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-rose-500/10 hover:bg-rose-500/20',
    default: 'border-app-border/30 hover:border-accent/50 text-app-muted hover:shadow-lg bg-app-surface/10 hover:bg-app-surface/20',
};
