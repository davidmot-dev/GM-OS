import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlarmClock } from 'lucide-react';
import { useClockStore } from '../../../store/useClockStore';
import { rappelsEnAttente } from '../logic/rappelDeLaJauge';
import BoutonsDuRappel from './BoutonsDuRappel';

/**
 * **Les rappels des jauges, au cockpit du meneur** — lot 2 des idées de GM Codex
 * (`documentation/Planning/2026-11-11-rappel-de-jet-du.md`, T4 ; registre § 244).
 *
 * Sous le bandeau des réserves, à côté des seuils franchis
 * (`AlertesDeFranchissement`, dont il reprend l'habillage) : une ligne par jauge
 * arrivée au bout qui porte un rappel — « ⏰ Air respirable — à vide : Jet
 * d'Endurance, tout le monde ». L'icône pulse jusqu'à ce que le meneur réponde :
 * **Fait** (le jet est lancé ou demandé ; le journal le note) ou **Écarter**.
 * Dans les deux cas, plus rien avant le prochain passage au bout. Les mêmes
 * réponses existent sur la carte de la jauge (Clock-OS) et sur la carte volante.
 *
 * Pour tous les jeux : le rappel est une affaire de jauge, pas de pilote.
 */
const RappelsDesJauges: React.FC = () => {
    const { t } = useTranslation('modules');
    const tensions = useClockStore(s => s.tensions);
    const enAttente = rappelsEnAttente(tensions);
    if (enAttente.length === 0) return null;

    return (
        <ul data-rappels-des-jauges aria-label={t('clock.rappel_liste')}
            className="flex flex-col gap-1 border-b border-app-border/20 bg-accent/5 px-6 py-2">
            {enAttente.map(r => (
                <li key={r.jaugeId} className="flex flex-wrap items-center gap-3 text-xs">
                    <AlarmClock size={13} className="text-accent shrink-0 animate-pulse" aria-hidden />
                    <span className="font-bold text-app-text">{r.nom}</span>
                    <span className="text-app-text/50">{r.bout === 'vide' ? t('clock.rappel_a_vide') : t('clock.rappel_au_plein')}</span>
                    <span className="min-w-0 flex-1 text-app-text/80 break-words">{r.texte}</span>
                    <span className="ml-auto"><BoutonsDuRappel rappel={r} /></span>
                </li>
            ))}
        </ul>
    );
};

export default RappelsDesJauges;
