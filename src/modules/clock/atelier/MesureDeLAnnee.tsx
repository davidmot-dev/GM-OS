import React from 'react';
import { CalendarDays, Clock3, PartyPopper, Snowflake, Sparkles } from 'lucide-react';
import { mesurerLeCalendrier, type CalendrierDatable } from '../logic/formeDuCalendrier';

/**
 * **Ce que l'Atelier affiche en permanence pendant qu'on compose.**
 *
 * L'équivalent de la bande de couverture des tables, et pour la même raison —
 * mais le mal qu'elle soigne est différent, et pire.
 *
 * ⛔ **Une table trouée se voit ; un calendrier faux a l'air parfait.** Une
 * table à qui il manque les valeurs 17 à 20 rend une bande rouge en une
 * seconde. Un calendrier dont l'année fait 358 jours au lieu de 360 ne se
 * signale nulle part : il faut additionner douze champs séparés pour s'en
 * apercevoir — et personne ne le fait, jusqu'à la séance où le meneur annonce
 * « nous voyageons trois mois » et où les dates ne tombent pas juste.
 *
 * *La longueur de l'année est le seul nombre que l'auteur a vraiment en tête, et
 * c'est justement celui qu'aucune saisie ne montre.* Le calculer en direct est
 * tout l'intérêt de cet écran.
 */

interface Props {
    calendrier: CalendrierDatable;
    /** La cible que le meneur s'est donnée, s'il s'en est donné une. */
    joursVises?: number;
}

const Case: React.FC<{
    icone: React.ReactNode;
    valeur: React.ReactNode;
    libelle: string;
    accent?: boolean;
    alerte?: boolean;
}> = ({ icone, valeur, libelle, accent, alerte }) => (
    <div
        className={`flex-1 min-w-[88px] rounded-lg border px-3 py-2 transition-colors ${
            alerte
                ? 'border-red-500/50 bg-red-500/10'
                : accent
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-app-border/40 bg-app-bg/40'
        }`}
    >
        <div className="flex items-center gap-1.5 text-ui-9 uppercase tracking-wider text-app-text/40">
            {icone}
            <span className="truncate">{libelle}</span>
        </div>
        <div
            className={`font-mono font-bold text-lg leading-tight ${
                alerte ? 'text-red-400' : accent ? 'text-accent' : 'text-app-text/80'
            }`}
        >
            {valeur}
        </div>
    </div>
);

export const MesureDeLAnnee: React.FC<Props> = ({ calendrier, joursVises }) => {
    const m = mesurerLeCalendrier(calendrier);

    /*
      **La cible n'est pas une règle, c'est une intention.** Le meneur qui vise
      360 jours veut le savoir tout de suite ; celui qui n'en vise aucun ne doit
      pas voir de rouge. D'où un écart affiché seulement quand une cible existe —
      *un contrôle qu'on n'a pas demandé est un contrôle qu'on apprend à
      ignorer.*
    */
    const ecart = (joursVises && joursVises > 0)
        ? m.joursParAnneeOrdinaire - joursVises
        : null;

    return (
        <div className="flex flex-wrap gap-2">
            <Case
                accent
                alerte={m.joursParAnneeOrdinaire <= 0}
                icone={<CalendarDays size={11} />}
                libelle="Jours par an"
                valeur={
                    <span className="flex items-baseline gap-2">
                        {m.joursParAnneeOrdinaire}
                        {ecart !== null && ecart !== 0 && (
                            <span
                                className={`text-xs font-normal ${ecart > 0 ? 'text-orange-400' : 'text-orange-400'}`}
                                title={`Vous visiez ${joursVises} jours`}
                            >
                                {ecart > 0 ? `+${ecart}` : ecart}
                            </span>
                        )}
                        {ecart === 0 && (
                            <span className="text-xs font-normal text-emerald-400" title="La cible est atteinte">
                                ✓
                            </span>
                        )}
                    </span>
                }
            />

            {m.joursParAnneeBissextile !== null
                && m.joursParAnneeBissextile !== m.joursParAnneeOrdinaire && (
                <Case
                    icone={<Snowflake size={11} />}
                    libelle="Année bissextile"
                    valeur={m.joursParAnneeBissextile}
                />
            )}

            <Case icone={<CalendarDays size={11} />} libelle="Mois" valeur={m.nombreDeMois} />

            {m.joursIntercalaires > 0 && (
                <Case
                    icone={<Sparkles size={11} />}
                    libelle="Hors calendrier"
                    valeur={m.joursIntercalaires}
                />
            )}

            <Case
                icone={<CalendarDays size={11} />}
                libelle="Semaine"
                valeur={m.joursDeSemaine || '—'}
            />

            {m.joursDeFete > 0 && (
                <Case
                    icone={<PartyPopper size={11} />}
                    libelle="Jours de fête"
                    valeur={m.joursDeFete}
                />
            )}

            <Case
                alerte={m.heuresParJour <= 0}
                icone={<Clock3 size={11} />}
                libelle="Heures / jour"
                valeur={m.heuresParJour || '—'}
            />
        </div>
    );
};

export default MesureDeLAnnee;
