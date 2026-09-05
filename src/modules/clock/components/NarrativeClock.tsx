import React from 'react';
import type { TensionClock, ClockTheme } from '../../../store/useClockStore';
import {
    FORME_PAR_DEFAUT,
    REPERE,
    RAYON_DE_L_ANNEAU,
    Y_DU_COMPTE_CADRAN,
    Y_DU_COMPTE_PLAT,
    aiguilleDuCadran,
    arcDuCadran,
    arcsDeLAnneau,
    boiteDeLaForme,
    casesDeLaBarre,
    fractionRemplie,
    pastillesDeLaJauge,
    traitsDuCadran,
} from './formesDeJauge';

interface NarrativeClockProps {
    clock: TensionClock;
    theme?: ClockTheme;
    size?: number;
}

interface CouleursDeJauge {
    plein: string;
    vide: string;
    texte: string;
    halo: string;
    fond: string;
    contour: string;
}

/**
 * **Les variables s'appellent `--app-accent`, pas `--accent`.**
 *
 * Le thème « moderne » écrivait `var(--accent)` et `rgba(var(--accent-rgb), .5)`
 * — deux noms qui ne désignent rien. Une valeur invalide fait tomber la
 * déclaration entière : les segments pleins retombaient sur la couleur héritée,
 * et le halo, dont la couleur venait de la seconde, disparaissait tout entier.
 * Exactement le même défaut que celui du minuteur, dans le fichier d'à côté.
 */
function couleursDeLaJauge(theme: ClockTheme): CouleursDeJauge {
    switch (theme) {
        case 'cyberpunk':
            return {
                plein: '#22d3ee',
                vide: '#312e81',
                texte: '#f472b6',
                halo: 'rgba(34, 211, 238, 0.6)',
                fond: 'rgba(30, 41, 59, 0.2)',
                contour: 'rgba(51, 65, 85, 0.3)',
            };
        case 'oldstyle':
            return {
                plein: '#f59e0b',
                vide: '#451a03',
                texte: '#d97706',
                halo: 'rgba(245, 158, 11, 0.4)',
                fond: 'rgba(69, 26, 3, 0.1)',
                contour: 'rgba(120, 53, 15, 0.2)',
            };
        case 'modern':
        default:
            return {
                plein: 'var(--app-accent)',
                vide: 'var(--app-surface)',
                texte: 'var(--app-text)',
                halo: 'rgba(var(--app-accent-rgb), 0.5)',
                fond: 'rgba(30, 41, 59, 0.2)',
                contour: 'rgba(51, 65, 85, 0.3)',
            };
    }
}

/**
 * **Une jauge de tension, dans l'une de ses quatre formes.**
 *
 * La forme se choisit **par jauge** — décidé par David le 2026-08-30 : une
 * alerte des gardes n'a pas la même voix que des provisions qui s'épuisent. Une
 * jauge sans forme est un anneau, ce qui laisse intactes toutes celles créées
 * avant ce jour.
 *
 * Le composant ne dessine que la forme : les trois écrans qui l'appellent
 * portent déjà le nom et le compte à côté.
 *
 * `size` donne la **largeur** ; la hauteur suit le cadre de la forme. Les
 * quatre partageaient d'abord le carré de l'anneau, où une barre n'occupe qu'un
 * quart de la hauteur — sur le Player Hub, il n'en restait qu'un trait perdu au
 * milieu d'un vide. *Un carré n'est la bonne boîte que pour ce qui est rond.*
 */
const NarrativeClock: React.FC<NarrativeClockProps> = ({ clock, theme = 'modern', size = 120 }) => {
    const { totalSegments, filledSegments } = clock;
    const forme = clock.forme ?? FORME_PAR_DEFAUT;
    const couleurs = couleursDeLaJauge(theme);

    const pleine = totalSegments > 0 && filledSegments >= totalSegments;
    const fraction = fractionRemplie(filledSegments, totalSegments);

    const halo = (rempli: boolean) => (rempli ? `drop-shadow(0 0 4px ${couleurs.halo})` : 'none');

    /*
      **Une jauge pleine passe au rouge dans sa forme, pas seulement dans son
      compte.** L'anneau avait sa pulsation et son cercle qui s'échappe ; les
      formes plates n'auraient teinté que les deux chiffres du milieu. Or c'est
      la tache de couleur que le meneur voit du coin de l'œil pendant qu'il
      parle — le compte, il faut le lire, et lire demande de s'arrêter.
    */
    const teinte = (rempli: boolean) => {
        if (!rempli) return couleurs.vide;
        return pleine ? '#ef4444' : couleurs.plein;
    };

    /** Le compte, au centre pour l'anneau, en tête pour les formes plates. */
    const compte = (y: number, taille: string) => (
        <text
            x={REPERE / 2}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={pleine ? '#ef4444' : couleurs.texte}
            className={`${taille} font-bold font-mono transition-colors ${pleine ? 'animate-pulse' : ''} ${theme === 'oldstyle' ? 'font-serif' : ''}`}
        >
            {filledSegments}/{totalSegments}
        </text>
    );

    const dessin = () => {
        switch (forme) {
            case 'barre':
                return (
                    <>
                        {compte(Y_DU_COMPTE_PLAT, 'text-[calc(15px*var(--echelle-corps,1))]')}
                        {casesDeLaBarre(totalSegments).map((c, i) => (
                            <rect
                                key={i}
                                x={c.x}
                                y={c.y}
                                width={c.largeur}
                                height={c.hauteur}
                                rx={c.rx}
                                fill={teinte(i < filledSegments)}
                                className="transition-all duration-300 ease-out"
                                style={{ filter: halo(i < filledSegments) }}
                            />
                        ))}
                    </>
                );

            case 'points':
                return (
                    <>
                        {compte(Y_DU_COMPTE_PLAT, 'text-[calc(15px*var(--echelle-corps,1))]')}
                        {pastillesDeLaJauge(totalSegments).map((p, i) => (
                            <circle
                                key={i}
                                cx={p.cx}
                                cy={p.cy}
                                r={p.r}
                                fill={i < filledSegments ? teinte(true) : 'none'}
                                stroke={i < filledSegments ? 'none' : couleurs.vide}
                                strokeWidth="2.5"
                                className="transition-all duration-300 ease-out"
                                style={{ filter: halo(i < filledSegments) }}
                            />
                        ))}
                    </>
                );

            case 'aiguille':
                return (
                    <>
                        <path
                            d={arcDuCadran(0, 1)}
                            fill="none"
                            stroke={couleurs.vide}
                            strokeWidth="7"
                            strokeLinecap="round"
                        />
                        {fraction > 0 && (
                            <path
                                d={arcDuCadran(0, fraction)}
                                fill="none"
                                stroke={pleine ? '#ef4444' : couleurs.plein}
                                strokeWidth="7"
                                strokeLinecap="round"
                                className="transition-all duration-300 ease-out"
                                style={{ filter: halo(true) }}
                            />
                        )}
                        {traitsDuCadran(totalSegments).map((trait, i) => (
                            <line
                                key={i}
                                x1={trait.x1}
                                y1={trait.y1}
                                x2={trait.x2}
                                y2={trait.y2}
                                stroke={couleurs.contour}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        ))}
                        {(() => {
                            const { pivot, pointe } = aiguilleDuCadran(fraction);
                            return (
                                <>
                                    <line
                                        x1={pivot.x}
                                        y1={pivot.y}
                                        x2={pointe.x}
                                        y2={pointe.y}
                                        stroke={pleine ? '#ef4444' : couleurs.texte}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        className="transition-all duration-300 ease-out"
                                    />
                                    <circle cx={pivot.x} cy={pivot.y} r="4.5" fill={couleurs.texte} />
                                </>
                            );
                        })()}
                        {compte(Y_DU_COMPTE_CADRAN, 'text-[calc(13px*var(--echelle-corps,1))]')}
                    </>
                );

            case 'anneau':
            default:
                return (
                    <>
                        <circle
                            cx={REPERE / 2}
                            cy={REPERE / 2}
                            r={RAYON_DE_L_ANNEAU}
                            fill={couleurs.fond}
                            stroke={couleurs.contour}
                            strokeWidth="1"
                        />
                        {arcsDeLAnneau(totalSegments).map((trace, i) => (
                            <path
                                key={i}
                                d={trace}
                                fill="none"
                                stroke={teinte(i < filledSegments)}
                                strokeWidth="8"
                                strokeLinecap="round"
                                className="transition-all duration-300 ease-out"
                                style={{ filter: halo(i < filledSegments) }}
                            />
                        ))}
                        {compte(REPERE / 2, 'text-sm')}
                        {pleine && (
                            <circle
                                cx={REPERE / 2}
                                cy={REPERE / 2}
                                r={RAYON_DE_L_ANNEAU + 4}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                className="animate-ping"
                                opacity="0.5"
                            />
                        )}
                    </>
                );
        }
    };

    /*
      **La boîte suit la forme.** Les quatre vivaient dans le carré de l'anneau,
      où une barre n'occupe qu'un quart de la hauteur : demandée à 75 px sur le
      Player Hub puis réduite à 65 %, il n'en restait qu'un trait perdu au
      milieu d'un carré vide. `size` reste la **largeur** ; la hauteur suit le
      rapport du cadre.
    */
    const boite = boiteDeLaForme(forme, totalSegments);

    return (
        <svg
            width={size}
            height={(size * boite.hauteur) / boite.largeur}
            viewBox={`${boite.x} ${boite.y} ${boite.largeur} ${boite.hauteur}`}
            data-forme={forme}
            className="transform transition-transform active:scale-95 select-none"
        >
            {dessin()}
        </svg>
    );
};

export default NarrativeClock;
