import React from 'react';
import type { Emplacement } from '../../theme/ornements';

/**
 * **Un ornement du thème, posé en masque** — socle, P3.1, 2026-09-30.
 *
 * Le dessin vient du thème (`--orne-<emplacement>`, écrit par
 * `appliquerLeTheme`), la couleur de l'accent : c'est ce qui accorde
 * l'ornement au thème et au mode clair (§ 8 du cahier). Sans ornement déclaré,
 * `--orne-<emplacement>-affichage` est absent et l'élément ne s'affiche pas —
 * *la plupart des jeux n'en auront jamais, c'est le cas normal.*
 */
export type Angle = 'haut-gauche' | 'haut-droit' | 'bas-gauche' | 'bas-droit';

/** Le coin est dessiné pour le haut à gauche ; GM-OS le retourne pour les trois autres (§ 8). */
const RETOURNEMENT: Record<Angle, string> = {
    'haut-gauche': 'none',
    'haut-droit': 'scaleX(-1)',
    'bas-gauche': 'scaleY(-1)',
    'bas-droit': 'scale(-1, -1)',
};

const POSITION: Record<Angle, React.CSSProperties> = {
    'haut-gauche': { top: 4, left: 4 },
    'haut-droit': { top: 4, right: 4 },
    'bas-gauche': { bottom: 4, left: 4 },
    'bas-droit': { bottom: 4, right: 4 },
};

interface OrnementProps {
    emplacement: Emplacement;
    /** Pour un `coin` seulement : l'angle où le poser. */
    angle?: Angle;
    className?: string;
    style?: React.CSSProperties;
}

export const Ornement: React.FC<OrnementProps> = ({ emplacement, angle, className = '', style }) => {
    const masque = `var(--orne-${emplacement})`;
    return (
        <span
            aria-hidden="true"
            data-ornement={emplacement}
            className={`pointer-events-none bg-accent ${className}`}
            style={{
                display: `var(--orne-${emplacement}-affichage, none)`,
                maskImage: masque,
                WebkitMaskImage: masque,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                ...(angle ? { position: 'absolute', width: 28, height: 28, transform: RETOURNEMENT[angle], ...POSITION[angle] } : {}),
                ...style,
            }}
        />
    );
};

/** Les quatre coins d'un panneau orné. */
export const CoinsOrnes: React.FC = () => (
    <>
        {(Object.keys(RETOURNEMENT) as Angle[]).map(angle => (
            <Ornement key={angle} emplacement="coin" angle={angle} />
        ))}
    </>
);
