import React from 'react';

/**
 * **`<Bouton>`** — socle, P3.3, 2026-09-30.
 *
 * Quatre variantes, quatre états (repos, survol, actif, désactivé), et **un
 * anneau de focus toujours visible** au clavier. L'arrondi est celui de la
 * famille « moyen » (`--rayon-md`, § 4.5 : boutons et cartes) ; le texte posé
 * sur l'accent lit `--app-accent-contrast`, jamais un blanc supposé.
 *
 * La cible fait 44 px, **48 px à la table** (`aLaTable`) : on y vise du pouce,
 * à un mètre de l'écran.
 */
export type VarianteDeBouton = 'neutre' | 'accent' | 'succes' | 'danger';

const PAR_VARIANTE: Record<VarianteDeBouton, string> = {
    neutre: 'bg-app-surface-2 text-app-text border border-app-border hover:border-accent/60 active:border-accent',
    accent: 'bg-accent text-app-on-accent border border-accent hover:brightness-110 active:brightness-95',
    succes: 'bg-etat-succes/15 text-etat-succes border border-etat-succes/40 hover:bg-etat-succes/25 active:bg-etat-succes/35',
    danger: 'bg-etat-danger/15 text-etat-danger border border-etat-danger/40 hover:bg-etat-danger/25 active:bg-etat-danger/35',
};

export interface BoutonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: VarianteDeBouton;
    /** Le régime Table : cibles de 48 px. */
    aLaTable?: boolean;
    /** Un pictogramme devant le libellé. */
    icone?: React.ReactNode;
}

export const Bouton: React.FC<BoutonProps> = ({
    variante = 'neutre', aLaTable = false, icone, className = '', type = 'button', children, ...reste
}) => (
    <button
        type={type}
        data-variante={variante}
        className={`inline-flex items-center justify-center gap-2 px-4 rounded-lg font-display text-ui-11 font-bold uppercase transition-all
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
            disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
            ${aLaTable ? 'min-h-12' : 'min-h-11'} ${PAR_VARIANTE[variante]} ${className}`}
        style={{ letterSpacing: 'var(--surtitre-espacement, 0.1em)' }}
        {...reste}
    >
        {icone}
        {children}
    </button>
);
