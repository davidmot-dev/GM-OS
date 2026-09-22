import React from 'react';
import {
    importanceDeLaScene, couleurDuLisere, lisereEstPointille, infobulleDeLImportance,
} from '../../logic/importanceDeLaScene';

/**
 * Le liseré qui dit le rang d'une scène dans l'intrigue.
 *
 * **Le pendant de `PastilleDePreparation`, et pour la même raison** : un signe
 * qui s'affiche sur quatre écrans se code une fois. Celui-ci se distingue de la
 * pastille en cela qu'il ne dit rien de ce que la fiche porte ni de ce qu'elle a
 * vécu — *il dit ce que le meneur en attend*, et c'est le seul des trois qu'une
 * machine ne saurait pas déduire.
 *
 * ⚠️ **Il est rendu même sans rang, en transparent.** Le retirer décalerait les
 * titres des scènes classées par rapport aux autres, et la colonne de liserés —
 * la seule chose qu'on vient lire ici — n'existerait plus. Voir
 * `couleurDuLisere`.
 *
 * **`self-stretch` et non une hauteur fixe** : la ligne de la trame fait deux
 * lignes de texte quand le titre est long, celle de la tablette une seule. Un
 * liseré plus court que sa ligne ressemble à un défaut d'affichage.
 */
const MarqueDIntrigue: React.FC<{ scene: { importance?: unknown }; className?: string }> = ({
    scene, className = '',
}) => {
    const importance = importanceDeLaScene(scene);
    const couleur = couleurDuLisere(importance);
    return (
        <span
            aria-hidden
            title={infobulleDeLImportance(importance)}
            className={`w-0.5 self-stretch min-h-[1rem] shrink-0 rounded-full ${className}`}
            style={lisereEstPointille(importance)
                ? {
                    /* Un pointillé de 2 px de large ne se fait pas avec
                       `border-dotted` : la bordure dessinerait des points de la
                       largeur du trait. Le dégradé répété, lui, donne un vrai
                       tiret de trois pixels. */
                    backgroundImage: `repeating-linear-gradient(to bottom, ${couleur} 0 3px, transparent 3px 6px)`,
                }
                : { backgroundColor: couleur }}
        />
    );
};

export default MarqueDIntrigue;
