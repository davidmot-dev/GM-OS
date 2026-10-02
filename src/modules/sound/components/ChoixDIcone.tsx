import React from 'react';
import { Ban } from 'lucide-react';
import { ICONES_DU_SON } from '../logic/iconesDuSon';

/**
 * **La grille des icônes** — une seule, pour l'onglet d'une atmosphère et pour
 * une pastille. *Deux grilles écrites séparément finiraient par ne plus
 * proposer les mêmes icônes.* La première case retire l'icône : sans elle,
 * en poser une serait un aller sans retour.
 */
export const ChoixDIcone: React.FC<{
    actuelle: string | null | undefined;
    onChoisir: (icone: string | null) => void;
}> = ({ actuelle, onChoisir }) => {
    const caseDIcone = (choisie: boolean) => `flex size-6 items-center justify-center rounded-md transition-colors ${choisie
        ? 'bg-accent text-app-on-accent'
        : 'text-app-muted hover:bg-app-surface hover:text-app-text'}`;

    return (
        <div role="group" aria-label="Icône" className="grid grid-cols-8 gap-0.5">
            <button
                onClick={(e) => { e.stopPropagation(); onChoisir(null); }}
                aria-pressed={!actuelle}
                title="Aucune icône"
                aria-label="Aucune icône"
                className={caseDIcone(!actuelle)}
            >
                <Ban size={12} />
            </button>
            {Object.entries(ICONES_DU_SON).map(([cle, { nom, Icone }]) => (
                <button
                    key={cle}
                    onClick={(e) => { e.stopPropagation(); onChoisir(cle); }}
                    aria-pressed={actuelle === cle}
                    title={nom}
                    aria-label={nom}
                    className={caseDIcone(actuelle === cle)}
                >
                    <Icone size={13} />
                </button>
            ))}
        </div>
    );
};
