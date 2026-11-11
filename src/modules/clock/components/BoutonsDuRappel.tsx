import React from 'react';
import { useTranslation } from 'react-i18next';
import { repondreAuRappel } from '../logic/repondreAuRappel';
import type { RappelEnAttente } from '../logic/rappelDeLaJauge';

const CLASSE_DU_BOUTON = 'px-3 py-1 rounded-lg border text-ui-9 font-black uppercase tracking-widest transition-colors';

/**
 * **Fait / Écarter** — les deux réponses au rappel d'une jauge, mêmes boutons
 * aux trois endroits où il paraît (cockpit, carte de la jauge, carte volante).
 * `apres` : ce que l'endroit fait de plus (la carte volante se ferme).
 */
export const BoutonsDuRappel: React.FC<{ rappel: RappelEnAttente; apres?: () => void }> = ({ rappel, apres }) => {
    const { t } = useTranslation('modules');
    const repondre = (fait: boolean) => { repondreAuRappel(rappel, fait); apres?.(); };
    return (
        <span className="flex gap-2">
            <button type="button" onClick={() => repondre(true)} title={t('clock.rappel_fait_hint')}
                className={`${CLASSE_DU_BOUTON} border-accent/50 text-accent hover:bg-accent/10`}>
                {t('clock.rappel_fait')}
            </button>
            <button type="button" onClick={() => repondre(false)} title={t('clock.rappel_ecarter_hint')}
                className={`${CLASSE_DU_BOUTON} border-app-border/40 text-app-text/50 hover:border-accent/40 hover:text-accent`}>
                {t('clock.rappel_ecarter')}
            </button>
        </span>
    );
};

export default BoutonsDuRappel;
