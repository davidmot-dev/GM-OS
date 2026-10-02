import React from 'react';
import { X } from 'lucide-react';

/**
 * **`<CadreDeSurcouche>`** — le cadre commun des fenêtres, refonte L5,
 * maquette retenue le 2026-09-27 (`surcouches/`).
 *
 * *Si le cadre est juste, la plupart suivent.* L'en-tête : le pictogramme dans
 * une case, le titre, « Échap » et la croix à droite ; le corps ; le pied
 * séparé par un filet, l'action principale pleine **à droite**, « Annuler » à
 * sa gauche. **Un seul bord** pour toutes : la maquette en donnait deux
 * (halo cyan sur la saisie, rien sur la confirmation).
 *
 * L'écran assombri et Échap restent l'affaire de l'appelant
 * (`useFermetureParEchap`) : le cadre ne dessine que la boîte.
 */
export interface CadreDeSurcoucheProps {
    titre: React.ReactNode;
    icone?: React.ReactNode;
    /** Le ton de la case du pictogramme — l'accent par défaut. */
    tonIcone?: 'accent' | 'alerte' | 'danger' | 'info' | 'succes';
    onFermer?: () => void;
    /** Le libellé de la croix, pour les lecteurs d'écran et l'infobulle. */
    libelleFermer?: string;
    /** Le pied : les boutons, l'action principale en dernier (à droite). */
    pied?: React.ReactNode;
    /** `etroit` : une question (~500 px). `large` : un outil. `plein` : la taille de l'écran. */
    largeur?: 'etroit' | 'moyen' | 'large' | 'plein';
    className?: string;
    children?: React.ReactNode;
}

const LARGEURS = {
    etroit: 'max-w-lg w-full',
    moyen: 'max-w-2xl w-full max-h-[90vh]',
    large: 'max-w-6xl w-full h-[90vh]',
    plein: 'w-full h-full',
};

const TONS = {
    accent: 'border-accent/40 bg-accent/10 text-accent',
    alerte: 'border-etat-alerte/40 bg-etat-alerte/10 text-etat-alerte',
    danger: 'border-etat-danger/40 bg-etat-danger/10 text-etat-danger',
    info: 'border-etat-info/40 bg-etat-info/10 text-etat-info',
    succes: 'border-etat-succes/40 bg-etat-succes/10 text-etat-succes',
};

export const CadreDeSurcouche: React.FC<CadreDeSurcoucheProps> = ({
    titre, icone, tonIcone = 'accent', onFermer, libelleFermer = 'Fermer', pied, largeur = 'etroit', className = '', children,
}) => (
    <div
        data-cadre-de-surcouche=""
        className={`flex flex-col overflow-hidden border border-app-border bg-app-surface text-app-text shadow-2xl animate-in zoom-in-95 duration-200 ${
            largeur === 'plein' ? 'rounded-none' : 'rounded-xl'
        } ${LARGEURS[largeur]} ${className}`}
    >
        <div className="flex shrink-0 items-center gap-3 border-b border-app-border px-5 py-3">
            {icone && (
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${TONS[tonIcone]}`}>{icone}</span>
            )}
            <h3 className="min-w-0 flex-1 truncate font-display text-sm font-bold uppercase tracking-wider text-app-text">{titre}</h3>
            {onFermer && (
                <button
                    type="button"
                    onClick={onFermer}
                    className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-app-muted transition-colors hover:bg-app-text/5 hover:text-app-text"
                    title={libelleFermer}
                    aria-label={libelleFermer}
                >
                    <span className="rounded border border-app-border px-1.5 py-0.5 font-mono text-ui-9 font-bold">Échap</span>
                    <X size={18} />
                </button>
            )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">{children}</div>
        {pied && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-app-border px-5 py-3">{pied}</div>}
    </div>
);

/** Le bouton secondaire du pied — « Annuler », « Fermer ». */
export const BoutonSecondaire: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...reste }) => (
    <button
        type="button"
        className={`rounded-lg border border-app-border bg-app-surface-2 px-4 py-2 text-sm font-bold text-app-text transition-colors hover:border-app-text/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
        {...reste}
    />
);

/** L'action principale — pleine, à droite. `ton` danger pour ce qui détruit. */
export const BoutonPrincipal: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { ton?: 'accent' | 'alerte' | 'danger' }> = ({ ton = 'accent', className = '', ...reste }) => (
    <button
        type="button"
        className={`rounded-lg px-4 py-2 text-sm font-bold transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            ton === 'accent' ? 'bg-accent text-app-on-accent' : ton === 'alerte' ? 'bg-etat-alerte text-app-bg' : 'bg-etat-danger text-app-bg'
        } ${className}`}
        {...reste}
    />
);
