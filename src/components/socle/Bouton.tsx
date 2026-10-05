import React from 'react';

/**
 * **`<Bouton>`** — socle, P3.3, 2026-09-30.
 *
 * Quatre variantes, quatre états (repos, survol, actif, désactivé), et **un
 * anneau de focus toujours visible** au clavier. L'arrondi est celui de la
 * famille « moyen » (`--rayon-md`, § 4.5 : boutons et cartes) ; le texte posé
 * sur l'accent lit `--app-accent-contrast`, jamais un blanc supposé.
 *
 * `cibleTactile` garantit une hauteur de 44 px réels (48 px avec `aLaTable`) :
 * les tailles Tailwind en rem restent plus petites quand la racine vaut 85 %.
 * Les boutons à seule icône demandent aussi `min-w-[44px]` dans leur classe.
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
    /** Pour les commandes illustrées ou compactes héritées : conserve leurs classes visuelles. */
    habillage?: 'socle' | 'libre';
    /** Le régime Table : cibles de 48 px. */
    aLaTable?: boolean;
    /** Hauteur de 44 px réels sur tablette, indépendamment de la taille de la racine. */
    cibleTactile?: boolean;
    /** Un pictogramme devant le libellé. */
    icone?: React.ReactNode;
}

export const Bouton: React.FC<BoutonProps> = ({
    variante = 'neutre', habillage = 'socle', aLaTable = false, cibleTactile = false,
    icone, className = '', type = 'button', children, ...reste
}) => (
    <button
        type={type}
        data-variante={habillage === 'socle' ? variante : undefined}
        className={`${habillage === 'socle'
            ? `inline-flex items-center justify-center gap-2 px-4 rounded-lg font-display text-ui-11 font-bold uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${PAR_VARIANTE[variante]}`
            : ''}
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
            ${cibleTactile ? (aLaTable ? 'min-h-[48px]' : 'min-h-[44px]') : (aLaTable ? 'min-h-12' : 'min-h-11')} ${className}`}
        style={habillage === 'socle' ? { letterSpacing: 'var(--surtitre-espacement, 0.1em)' } : undefined}
        {...reste}
    >
        {icone}
        {children}
    </button>
);
