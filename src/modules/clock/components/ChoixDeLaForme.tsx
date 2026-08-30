import React from 'react';
import { Circle, RectangleHorizontal, MoreHorizontal, Gauge } from 'lucide-react';
import { FORMES_DE_JAUGE, type FormeDeJauge } from './formesDeJauge';

/**
 * **Le choix de la forme d'une jauge — un seul sélecteur, deux emplois.**
 *
 * Il sert à la création d'une jauge et au changement d'avis sur une jauge
 * existante. Deux copies auraient fini par ne plus proposer les mêmes formes,
 * ou les mêmes dans un autre ordre : *quand une liste est écrite deux fois,
 * c'est la divergence qu'on planifie.*
 */

const APPARENCE: Record<FormeDeJauge, { icone: React.ReactNode; nom: string; dit: string }> = {
    anneau: {
        icone: <Circle size={12} />,
        nom: 'Anneau',
        dit: 'Anneau segmenté — le compte circulaire, l’idiome du jeu de rôle',
    },
    barre: {
        icone: <RectangleHorizontal size={12} />,
        nom: 'Barre',
        dit: 'Barre segmentée — la seule qui reste lisible à dix ou douze segments',
    },
    points: {
        icone: <MoreHorizontal size={12} />,
        nom: 'Points',
        dit: 'Points — le plus net à petite taille, pensé pour la tablette',
    },
    aiguille: {
        icone: <Gauge size={12} />,
        nom: 'Aiguille',
        dit: 'Cadran à aiguille — une pression qui monte, plutôt qu’un compte de coups',
    },
};

interface ChoixDeLaFormeProps {
    valeur: FormeDeJauge;
    onChoisir: (forme: FormeDeJauge) => void;
    /** `true` sur une carte de jauge, où la place manque : icônes seules. */
    compact?: boolean;
}

export const ChoixDeLaForme: React.FC<ChoixDeLaFormeProps> = ({ valeur, onChoisir, compact = false }) => (
    <div className={`flex ${compact ? 'gap-0.5' : 'gap-1'}`} role="group" aria-label="Forme de la jauge">
        {FORMES_DE_JAUGE.map((forme) => {
            const { icone, nom, dit } = APPARENCE[forme];
            const actif = valeur === forme;
            return (
                <button
                    key={forme}
                    onClick={(e) => { e.stopPropagation(); onChoisir(forme); }}
                    title={dit}
                    aria-pressed={actif}
                    aria-label={nom}
                    className={`flex items-center justify-center gap-1.5 rounded-md border transition-all ${
                        compact ? 'p-1' : 'flex-1 px-2 py-1.5'
                    } ${actif
                        ? 'bg-accent/20 border-accent/60 text-accent'
                        : 'bg-app-bg/50 border-app-border text-app-text/40 hover:text-app-text hover:border-accent/30'}`}
                >
                    {icone}
                    {!compact && <span className="text-[9px] font-bold uppercase tracking-wider">{nom}</span>}
                </button>
            );
        })}
    </div>
);

export default ChoixDeLaForme;
