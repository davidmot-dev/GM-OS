import React from 'react';
import { CalendarCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { IMPORTANCES, MOT_DE_L_IMPORTANCE } from '../../logic/importanceDeLaScene';
import { LIBELLE_DE_L_ETAT, AIDE_DE_L_ETAT, ORDRE_DES_ETATS, MARQUE_DU_RANG, AIDE_DU_RANG } from './reperesDesScenes';

/**
 * Ce que veulent dire le contour et la bordure d'une carte de scène.
 *
 * ⭐ **Les vignettes portent les MÊMES attributs que les cartes** (`data-etat`,
 * `data-importance`, `data-annulee`) et donc les mêmes règles CSS : la légende
 * ne peut pas montrer un repère que la carte n'a plus.
 */
export const LegendeDeTrame: React.FC<{ numeroDeSeance?: number }> = ({ numeroDeSeance }) => {
    const [ouverte, setOuverte] = React.useState(true);
    const rangs = [...IMPORTANCES, 'non-classee'] as const;
    return (
        <section className="legende-de-trame" aria-label="Légende des scènes">
            <button type="button" onClick={() => setOuverte(v => !v)} aria-expanded={ouverte}>
                Légende {ouverte ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
            {ouverte && <div className="legende-de-trame-corps">
                <h4>État</h4>
                <ul>
                    {ORDRE_DES_ETATS.map(etat => <li key={etat} title={AIDE_DE_L_ETAT[etat]}>
                        <span className="carte-de-trame" data-etat={etat} data-importance="secondaire" aria-hidden />
                        {LIBELLE_DE_L_ETAT[etat]}
                    </li>)}
                    <li title={AIDE_DE_L_ETAT.annulee}>
                        <span className="carte-de-trame" data-etat="terminee" data-annulee data-importance="secondaire" aria-hidden><s>Aa</s></span>
                        Annulée
                    </li>
                </ul>
                <h4>Rang</h4>
                <ul>
                    {rangs.map(rang => <li key={rang} title={AIDE_DU_RANG[rang]}>
                        <span className="carte-de-trame" data-importance={rang} aria-hidden>
                            {React.createElement(MARQUE_DU_RANG[rang], { size: 10 })}
                        </span>
                        {rang === 'non-classee' ? 'Non classée' : MOT_DE_L_IMPORTANCE[rang]}
                    </li>)}
                </ul>
                <h4>Séance</h4>
                <ul>
                    <li><CalendarCheck size={13} className="legende-de-trame-seance" aria-hidden />
                        {numeroDeSeance === undefined ? 'Aucune séance planifiée' : `Prévue dans la séance n° ${numeroDeSeance}`}
                    </li>
                </ul>
            </div>}
        </section>
    );
};
