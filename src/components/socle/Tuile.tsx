import React from 'react';

/**
 * **`<Tuile>`** — socle, P3.4, 2026-09-30.
 *
 * La carte cliquable d'une grille : un pad, un dé, une ambiance. ⚠️ **Elle a
 * une taille fixe** (`taille`, carré par défaut) : ce qu'on y ajoute pousse ce
 * qui y était, jamais la grille. L'état actif se lit en bordure pleine et en
 * halo — le halo du thème (`shadow-glow-accent`, dérivé de l'accent ou éteint).
 */
export interface TuileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    actif?: boolean;
    /** Le côté en pixels ; `null` pour laisser la grille décider (la tuile reste carrée). */
    taille?: number | null;
}

export const Tuile: React.FC<TuileProps> = ({
    actif = false, taille = null, className = '', style, type = 'button', children, ...reste
}) => (
    <button
        type={type}
        aria-pressed={actif}
        data-tuile=""
        className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-3 text-app-text transition-all
            bg-app-surface-2 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
            disabled:opacity-40 disabled:cursor-not-allowed
            ${actif ? 'border-accent shadow-glow-accent' : 'border-app-border hover:border-accent/60'}
            ${taille === null ? 'aspect-square w-full' : ''} ${className}`}
        style={taille === null ? style : { width: taille, height: taille, ...style }}
        {...reste}
    >
        {children}
    </button>
);
