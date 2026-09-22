import React from 'react';
import type { Scene } from '../../../../types/trame.types';
import {
    importanceDeLaScene, IMPORTANCES, MOT_DE_L_IMPORTANCE, LIBELLE_DE_L_IMPORTANCE,
} from '../../logic/importanceDeLaScene';

/**
 * Le rang d'une scène dans l'intrigue, à choisir.
 *
 * **Pourquoi ce composant existe.** Il vivait dans la fiche de
 * `TrameDashboard` ; le panneau du graphe en aurait fait une seconde copie. Le
 * dépôt a déjà payé ce motif assez de fois pour ne plus attendre la troisième :
 * *deux contrôles du même champ finissent par ne plus offrir les mêmes valeurs*
 * — la palette du Nexus social avait divergé au point qu'« Ami » enregistrait
 * `romantic`.
 *
 * ⚠️ **« Non classée » est une vraie réponse, et c'est le défaut.** Sans elle, on
 * ne pourrait plus revenir en arrière après un clic, et les scènes écrites avant
 * ce champ se retrouveraient classées d'autorité.
 */
const ChoixDuRang: React.FC<{
    scene: Scene;
    onChange: (updates: Partial<Scene>) => void;
    /** Serré pour le panneau du graphe, aéré pour la fiche. */
    compact?: boolean;
}> = ({ scene, onChange, compact = false }) => {
    const rang = importanceDeLaScene(scene);
    const taille = compact ? 'px-2 py-1' : 'px-3 py-1.5';

    return (
        <div className="flex flex-wrap gap-1.5">
            {IMPORTANCES.map(valeur => {
                const actif = rang === valeur;
                return (
                    <button
                        key={valeur}
                        onClick={() => onChange({ importance: actif ? undefined : valeur })}
                        title={actif ? 'Cliquer à nouveau pour ne plus la classer' : LIBELLE_DE_L_IMPORTANCE[valeur]}
                        className={`${taille} rounded-lg text-ui-10 font-bold border transition-all ${
                            actif
                                ? 'bg-sky-500/20 border-sky-400/40 text-sky-300'
                                : 'bg-app-bg/30 border-app-border/20 text-app-text/40 hover:text-app-text/70'
                        }`}
                    >
                        {MOT_DE_L_IMPORTANCE[valeur]}
                    </button>
                );
            })}
            <button
                onClick={() => onChange({ importance: undefined })}
                className={`${taille} rounded-lg text-ui-10 font-bold border transition-all ${
                    rang === null
                        ? 'bg-app-text/10 border-app-border/30 text-app-text/60'
                        : 'bg-app-bg/30 border-app-border/20 text-app-text/30 hover:text-app-text/60'
                }`}
            >
                Non classée
            </button>
        </div>
    );
};

export default ChoixDuRang;
