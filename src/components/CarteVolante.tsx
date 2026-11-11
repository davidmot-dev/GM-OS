import React from 'react';
import { X } from 'lucide-react';

/**
 * **La carte volante de 5 secondes, chez le meneur** — commune depuis le
 * 11/11/2026 : le résultat d'un jet demandé (lot 1, `ResultatsDesDemandesVolants`)
 * et le rappel d'une jauge arrivée au bout (lot 2, `RappelsVolants`). Habillage
 * de l'alerte « Nouveau message » (`MessageAlertOverlay`), dans la colonne de
 * laquelle elles s'empilent ; une barre dit le temps qui reste.
 *
 * La minuterie vit dans `useCartesEphemeres` : une carte s'efface seule, ou
 * plus tôt par son « ✕ ».
 */
export const CarteVolante: React.FC<{
    etiquette: string;
    sousTitre: string;
    icone: React.ReactNode;
    dureeMs: number;
    onFermer: () => void;
    ariaLabel: string;
    children: React.ReactNode;
    /** Pour les essais et les captures : `data-<attribut>` sur la carte. */
    marque?: string;
}> = ({ etiquette, sousTitre, icone, dureeMs, onFermer, ariaLabel, children, marque }) => (
    <section role="status" aria-label={ariaLabel} {...(marque ? { [`data-${marque}`]: '' } : {})}
        className="relative w-80 overflow-hidden bg-app-surface/90 border border-accent/30 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 pointer-events-auto animate-in slide-in-from-right-10 duration-300 border-l-4 border-l-accent">
        <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/20 text-accent">
                    {icone}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black uppercase tracking-widest text-accent">{etiquette}</span>
                    <span className="text-ui-10 font-bold text-app-text/80 truncate">{sousTitre}</span>
                </div>
            </div>
            <button type="button" onClick={onFermer} title="Fermer"
                className="p-1.5 hover:bg-app-text/10 rounded-lg transition-colors text-app-text/40 hover:text-app-text">
                <X size={14} />
            </button>
        </div>
        {children}
        {/* Le temps qui reste, à l'œil. */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-app-text/10" aria-hidden>
            <div className="h-full bg-accent/50 animate-out slide-out-to-left-full linear fill-mode-forwards"
                style={{ animationDuration: `${dureeMs}ms` }} />
        </div>
    </section>
);

export default CarteVolante;
