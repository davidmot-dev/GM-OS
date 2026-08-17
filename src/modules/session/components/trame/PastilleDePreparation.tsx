import React from 'react';
import { remplissageDeLaScene } from '../../logic/trame';
import type { Scene } from '../../../../types/trame.types';

/**
 * Ce qu'une scène porte déjà, en une pastille.
 *
 * **Une seule couleur à opacité variable, jamais un code couleur.** Cinq
 * critères de même poids — résumé, lieu, PNJ, indice, ambiance — donc six
 * teintes possibles. Ce n'est **pas un statut** : elle ne dit rien de « jouée »
 * ou « à jouer », seulement de ce que la fiche porte. L'état de jeu se lit
 * ailleurs, et les confondre ferait prendre une scène bien préparée pour une
 * scène déjà traversée.
 *
 * **Pourquoi ce composant existe.** Le même `color-mix` était recopié dans
 * `TrameDashboard` et `PanneauDeTrameDeSeance`, et le panneau de séance en
 * aurait fait une troisième copie. Trois calculs séparés du même taux finissent
 * par ne plus donner la même teinte pour la même scène — et personne ne le
 * verrait, puisque chaque écran est cohérent avec lui-même.
 */
const PastilleDePreparation: React.FC<{ scene: Scene; className?: string }> = ({ scene, className = '' }) => {
    const pourcent = Math.round(remplissageDeLaScene(scene) * 100);
    return (
        <span
            title={`Préparation : ${pourcent} %`}
            className={`w-2 h-2 rounded-full shrink-0 ${className}`}
            style={{
                backgroundColor: `color-mix(in srgb, var(--accent, #d97706) ${pourcent}%, transparent)`,
                outline: '1px solid rgba(255,255,255,.15)',
            }}
        />
    );
};

export default PastilleDePreparation;
