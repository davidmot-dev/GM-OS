import React from 'react';

/**
 * **Une icône que le jeu peut remplacer** — socle, phase 6 (V4), contrat v1.6,
 * 2026-10-03.
 *
 * `repli` est l'icône de GM-OS (un pictogramme `lucide-react`, déjà dimensionné
 * et coloré par l'appelant) ; `nom` est l'un des noms du § 9. Quand le thème du
 * jeu fournit ce nom, `appliquerLeTheme` pose trois variables :
 *
 * - `--icone-<nom>` — le dessin, en adresse `data:` ;
 * - `--icone-<nom>-affichage: inline-block` — le dessin s'affiche ;
 * - `--icone-<nom>-repli: none` — l'icône de GM-OS s'efface.
 *
 * **Tout se décide en CSS**, sans état React : changer de campagne repeint les
 * icônes comme il repeint les couleurs. Sans icône fournie — *le cas normal* —
 * les variables manquent et l'icône de GM-OS reste, à l'identique.
 *
 * Le dessin est posé en **masque** sur `currentColor` : il prend la couleur du
 * texte autour, comme l'icône qu'il remplace — actif, survolé, atténué.
 */
export interface IconeProps {
    nom: string;
    /** L'icône de GM-OS, quand le jeu n'en fournit pas. */
    repli: React.ReactNode;
    /** La taille du dessin du jeu, en pixels — celle du `repli`. */
    taille?: number;
    className?: string;
}

export const Icone: React.FC<IconeProps> = ({ nom, repli, taille = 16, className = '' }) => {
    const masque = `var(--icone-${nom})`;
    return (
        <>
            <span
                aria-hidden="true"
                data-icone={nom}
                className={`shrink-0 bg-current align-middle ${className}`}
                style={{
                    display: `var(--icone-${nom}-affichage, none)`,
                    width: taille,
                    height: taille,
                    maskImage: masque,
                    WebkitMaskImage: masque,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                }}
            />
            <span data-icone-repli={nom} style={{ display: `var(--icone-${nom}-repli, contents)` }}>{repli}</span>
        </>
    );
};
