import React from 'react';
import { tonAutomatique } from './tonAutomatique';

/**
 * **`<Jauge>`** — socle, P3.5, 2026-09-30.
 *
 * ⚠️ **Purement visuelle.** Une jauge a cinq lecteurs dans ce dépôt, dont
 * l'afficheur Ulanzi, qui emploie d'autres noms ; et Clock-OS porte quatre
 * drapeaux et un code couleur en fractions de course. **Cette primitive n'en
 * touche aucun** : elle reçoit une fraction et un ton, et les dessine.
 *
 * Le ton `auto` suit la règle de la grammaire (Stitch) : vert, puis ambre sous
 * la moitié, puis rouge sous 25 %.
 */
export type TonDeJauge = 'auto' | 'accent' | 'succes' | 'alerte' | 'danger' | 'info';

const PAR_TON: Record<Exclude<TonDeJauge, 'auto'>, string> = {
    accent: 'bg-accent',
    succes: 'bg-etat-succes',
    alerte: 'bg-etat-alerte',
    danger: 'bg-etat-danger',
    info: 'bg-etat-info',
};

export interface JaugeProps {
    /** La fraction remplie, de 0 à 1 ; bornée. */
    valeur: number;
    ton?: TonDeJauge;
    /** Ce que la jauge mesure, pour les lecteurs d'écran. */
    libelle: string;
    className?: string;
}

export const Jauge: React.FC<JaugeProps> = ({ valeur, ton = 'auto', libelle, className = '' }) => {
    const fraction = Number.isFinite(valeur) ? Math.min(1, Math.max(0, valeur)) : 0;
    const teinte = ton === 'auto' ? tonAutomatique(fraction) : ton;
    return (
        <div
            role="meter"
            aria-label={libelle}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraction * 100)}
            data-ton={teinte}
            className={`h-2 w-full overflow-hidden rounded-sm bg-app-soft ${className}`}
        >
            <div className={`h-full rounded-sm transition-[width] duration-300 ${PAR_TON[teinte]}`} style={{ width: `${fraction * 100}%` }} />
        </div>
    );
};
