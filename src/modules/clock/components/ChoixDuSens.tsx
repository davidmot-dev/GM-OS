import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SENS_DE_JAUGE, type SensDeLaJauge } from '../logic/sensDeLaJauge';

/**
 * **Le sens d'une jauge — un seul sélecteur, deux emplois.**
 *
 * *Demandé par David le 2026-09-15 :* **« je n'ai pas de jauge qui diminue pour
 * simuler la diminution de consommable »**.
 *
 * Comme `ChoixDeLaForme`, il sert à la création et au changement d'avis. Deux
 * copies auraient fini par ne plus dire la même chose — *quand une liste est
 * écrite deux fois, c'est la divergence qu'on planifie.*
 *
 * Les libellés disent **ce que la jauge raconte**, pas ce que le code fait :
 * « ce qui monte » et « ce qui s'épuise » se choisissent d'un regard en pleine
 * séance, là où « remplissage » et « épuisement » demandent de réfléchir.
 */

const APPARENCE: Record<SensDeLaJauge, { icone: React.ReactNode; nom: string; dit: string }> = {
    remplissage: {
        icone: <TrendingUp size={12} />,
        nom: 'Monte',
        dit: 'Elle monte vers le danger — alerte, rituel, compte à rebours. '
            + 'Elle part vide et crie quand elle est pleine.',
    },
    epuisement: {
        icone: <TrendingDown size={12} />,
        nom: 'S’épuise',
        dit: 'Elle descend vers le manque — vivres, munitions, oxygène, batterie. '
            + 'Elle part pleine et crie quand elle est vide.',
    },
};

interface ChoixDuSensProps {
    valeur: SensDeLaJauge;
    onChoisir: (sens: SensDeLaJauge) => void;
    /** `true` sur une carte de jauge, où la place manque : icônes seules. */
    compact?: boolean;
}

export const ChoixDuSens: React.FC<ChoixDuSensProps> = ({ valeur, onChoisir, compact = false }) => (
    <div className={`flex ${compact ? 'gap-0.5' : 'gap-1'}`} role="group" aria-label="Sens de la jauge">
        {SENS_DE_JAUGE.map((sens) => {
            const { icone, nom, dit } = APPARENCE[sens];
            const actif = valeur === sens;
            return (
                <button
                    key={sens}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChoisir(sens); }}
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
                    {!compact && <span className="text-ui-9 font-bold uppercase tracking-wider">{nom}</span>}
                </button>
            );
        })}
    </div>
);

export default ChoixDuSens;
