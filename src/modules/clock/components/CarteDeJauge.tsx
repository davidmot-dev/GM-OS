import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronsUp, EllipsisVertical, Eye, EyeOff, Hourglass, Minus, MonitorSmartphone, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useClockStore } from '../../../store/useClockStore';
import type { ClockTheme } from '../../../store/useClockStore';
import NarrativeClock from './NarrativeClock';
import ChoixDeLaForme from './ChoixDeLaForme';
import ChoixDuSens from './ChoixDuSens';
import { FORME_PAR_DEFAUT } from './formesDeJauge';
import { elleSeVide, graviteDeLaJauge, pasDuClicPrincipal, sensDe } from '../logic/sensDeLaJauge';
import { COULEURS_DU_COMPTE } from '../../ulanzi/widgets/compteARebours';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';

/** Ce que l'afficheur montre quand une jauge n'a pas de couleur choisie. */
const COULEUR_DE_JAUGE_PAR_DEFAUT = COULEURS_DU_COMPTE.plein;

type Jauge = ReturnType<typeof useClockStore.getState>['tensions'][number];

/**
 * **La carte d'une jauge — refonte, phase 4, L4, étape 2 (2026-10-02).**
 *
 * La maquette retenue le 2026-09-27 (`documentation/Planning/stitch/
 * horloge/`) : **le nom en entier**, sur deux ou trois lignes (il était
 * tronqué à 120 px) ; la complétion ; **le dernier quart en rouge, avec son
 * bandeau** ; « Par scène » et − / + en pied. Et surtout, **les réglages dans
 * un menu « ⋮ »** au lieu d'une rangée de dix icônes sans nom posée sous la
 * jauge — *la jauge est la seule chose à lire en séance.*
 *
 * Le bandeau lit `graviteDeLaJauge`, la règle partagée : *une comparaison
 * recopiée dans un écran est une règle que les trois autres ne connaîtront
 * jamais.*
 */
export const CarteDeJauge: React.FC<{ clock: Jauge; theme: ClockTheme }> = ({ clock, theme }) => {
    const { t } = useTranslation('modules');
    const {
        removeTensionClock, updateTensionSegments, changerLaFormeDeLaJauge, changerLaCouleurDeLaJauge,
        remplirLaJauge, changerLeSensDeLaJauge, reglerLePasParScene, basculerSurLAfficheur, basculerLaVueDesJoueurs,
    } = useClockStore();
    const [menuOuvert, setMenuOuvert] = React.useState(false);
    useFermetureParEchap(menuOuvert, () => setMenuOuvert(false), 'Réglages de la jauge');

    const gravite = graviteDeLaJauge(clock);
    const auDernierQuart = gravite === 'urgence' || gravite === 'critique';
    const completion = clock.totalSegments > 0 ? Math.round((clock.filledSegments / clock.totalSegments) * 1000) / 10 : 0;
    const surLAfficheur = clock.surLAfficheur ?? true;
    const vueParLesJoueurs = clock.vueParLesJoueurs ?? true;

    const teinteDeLaGravite = auDernierQuart ? 'text-etat-danger' : gravite === 'tension' ? 'text-etat-alerte' : 'text-accent';
    const cadre = auDernierQuart
        ? 'border-etat-danger/70 shadow-[0_0_18px_-6px] shadow-etat-danger/60'
        : gravite === 'tension' ? 'border-etat-alerte/50' : 'border-app-border hover:border-accent/40';
    const ligne = 'flex items-center justify-between gap-2';
    const etiquette = 'text-ui-9 font-black uppercase tracking-widest text-app-subtle';
    const interrupteur = (actif: boolean) => (
        <span className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors ${actif ? 'bg-accent' : 'bg-app-surface-2 border border-app-border'}`}>
            <span className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-fixe-blanc shadow transition-all ${actif ? 'left-[1.15rem]' : 'left-0.5'}`} />
        </span>
    );

    return (
        <div
            className={`relative flex flex-col gap-3 rounded-xl border bg-app-surface/60 p-4 transition-all ${cadre}`}
            style={{ zIndex: menuOuvert ? 40 : undefined }}
        >
            {auDernierQuart && (
                <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded bg-etat-danger px-2 py-0.5 text-ui-8 font-black uppercase tracking-widest text-app-bg">
                    <TriangleAlert size={10} /> {gravite === 'critique' ? t('clock.agencement.au_bout') : t('clock.agencement.dernier_quart')}
                </span>
            )}

            <div className={ligne}>
                {/* Le pourcentage seul : le mot « Complétion » coupait le nombre, qui est l'information. */}
                <span
                    title={t('clock.agencement.completion', { p: completion.toLocaleString() })}
                    className={`whitespace-nowrap font-mono text-sm font-black ${teinteDeLaGravite}`}
                >
                    {completion.toLocaleString()} %
                </span>
                <button
                    onClick={() => setMenuOuvert(!menuOuvert)}
                    aria-label={t('clock.agencement.reglages')}
                    aria-expanded={menuOuvert}
                    title={t('clock.agencement.reglages')}
                    className={`-mr-1 rounded-md p-1 transition-colors ${menuOuvert ? 'bg-accent text-app-on-accent' : 'text-app-subtle hover:text-app-text hover:bg-app-surface'}`}
                >
                    <EllipsisVertical size={16} />
                </button>
            </div>

            <h4 className="line-clamp-3 break-words text-sm font-black uppercase leading-tight tracking-tight text-app-text" title={clock.name}>
                {clock.name}
            </h4>

            <div
                className="flex cursor-pointer justify-center"
                title={elleSeVide(clock)
                    ? 'Clic : consommer un segment — shift-clic ou clic droit : en rendre un'
                    : 'Clic : avancer d’un segment — shift-clic ou clic droit : reculer'}
                onClick={(e) => {
                    /*
                      **Le clic facile suit le sens de la jauge** — tranché par
                      David le 2026-09-15. Sur un consommable, le geste de la
                      soirée est de consommer ; shift-clic rend.
                    */
                    const pas = pasDuClicPrincipal(clock);
                    updateTensionSegments(clock.id, e.shiftKey ? -pas : pas);
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    updateTensionSegments(clock.id, -pasDuClicPrincipal(clock));
                }}
            >
                <NarrativeClock clock={clock} theme={theme} size={120} />
            </div>

            {/*
              `4 / 6 restants` plutôt que `4 / 6 segments` : sur un
              consommable, le mot est la moitié de l'information.
            */}
            <p className="text-center font-mono text-ui-10 italic text-app-subtle">
                {clock.filledSegments} / {clock.totalSegments}{' '}
                {elleSeVide(clock) ? t('clock.remaining') : t('clock.segments')}
            </p>

            {/*
              **Ce qu'une fin de scène coûte à cette jauge** (portée choisie par
              David le 2026-09-15). Le nombre est saisi **positif** : c'est le
              sens de la jauge qui décide de la direction.
            */}
            <div className="mt-auto flex items-center gap-2 border-t border-app-border/50 pt-3">
                <label className="flex min-w-0 flex-1 items-center gap-1.5 text-ui-10 text-app-subtle" title={t('clock.gauge_step_hint')}>
                    <Hourglass size={11} className="shrink-0" />
                    <span className="truncate">{t('clock.gauge_step')}</span>
                    <input
                        type="number"
                        min={0}
                        max={clock.totalSegments}
                        value={clock.pasParScene ?? ''}
                        placeholder="0"
                        onChange={(e) => reglerLePasParScene(clock.id, e.target.value === '' ? null : Number(e.target.value))}
                        aria-label={t('clock.gauge_step_hint')}
                        className="w-10 shrink-0 rounded border border-app-border/40 bg-app-bg/60 px-1 py-0.5 text-center font-mono text-app-text/80 focus:border-accent focus:outline-none"
                    />
                    {!!clock.pasParScene && (
                        <span className="font-mono text-app-subtle">{elleSeVide(clock) ? '−' : '+'}{clock.pasParScene}</span>
                    )}
                </label>
                <button
                    onClick={() => updateTensionSegments(clock.id, -1)}
                    aria-label={t('clock.agencement.moins')}
                    title={t('clock.agencement.moins')}
                    className="flex size-8 items-center justify-center rounded-lg border border-app-border bg-app-bg/60 text-app-muted hover:text-app-text hover:border-accent/50 transition-colors"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={() => updateTensionSegments(clock.id, 1)}
                    aria-label={t('clock.agencement.plus')}
                    title={t('clock.agencement.plus')}
                    className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${auDernierQuart
                        ? 'border-etat-danger bg-etat-danger text-app-bg hover:bg-etat-danger/90'
                        : 'border-accent/60 bg-accent/10 text-accent hover:bg-accent/20'}`}
                >
                    <Plus size={14} />
                </button>
            </div>

            {menuOuvert && (
                <>
                    {/* Un clic à côté referme le menu. */}
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOuvert(false)} />
                    <div
                        role="dialog"
                        aria-label={t('clock.agencement.reglages')}
                        className="absolute right-2 top-11 z-50 flex w-[15rem] flex-col gap-3 rounded-xl border border-app-border bg-app-bg p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                    >
                        <div className="flex flex-col gap-1.5">
                            <span className={etiquette}>{t('clock.agencement.forme')}</span>
                            <ChoixDeLaForme
                                compact
                                valeur={clock.forme ?? FORME_PAR_DEFAUT}
                                onChoisir={(f) => changerLaFormeDeLaJauge(clock.id, f)}
                            />
                        </div>
                        {/*
                          **Changer d'avis sur le sens.** Une jauge qu'on n'a pas
                          encore touchée se replace toute seule au départ de son
                          nouveau sens ; dès qu'elle a compté quelque chose, le
                          magasin garde ce compte.
                        */}
                        <div className="flex flex-col gap-1.5">
                            <span className={etiquette}>{t('clock.agencement.sens')}</span>
                            <ChoixDuSens compact valeur={sensDe(clock)} onChoisir={(s) => changerLeSensDeLaJauge(clock.id, s)} />
                        </div>

                        {/*
                          **Remplir d'un coup.** Un instrument qui *se vide* — le
                          Voight-Kampff — part de son maximum ; sans ce geste il
                          fallait six clics sur `+1` avant de pouvoir le descendre.
                        */}
                        <button
                            onClick={() => remplirLaJauge(clock.id)}
                            title={t('clock.gauge_fill')}
                            className="flex items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface py-1.5 text-ui-10 font-bold uppercase tracking-wider text-app-text hover:border-accent/50"
                        >
                            <ChevronsUp size={13} /> {t('clock.agencement.remplir')}
                        </button>

                        {/*
                          **Sur l'afficheur, ou non** : ce drapeau choisit
                          LESQUELLES des jauges vont sur les 32 pixels. **Les
                          joueurs la voient, ou non** (David, 2026-09-04) : une
                          jauge NEUVE naît fermée.
                        */}
                        <button onClick={() => basculerSurLAfficheur(clock.id)} aria-pressed={surLAfficheur} className={ligne}
                            title={surLAfficheur ? t('clock.gauge_display_off') : t('clock.gauge_display_on')}>
                            <span className="flex items-center gap-1.5 text-xs text-app-text"><MonitorSmartphone size={13} /> {t('clock.gauge_display')}</span>
                            {interrupteur(surLAfficheur)}
                        </button>
                        <button onClick={() => basculerLaVueDesJoueurs(clock.id)} aria-pressed={vueParLesJoueurs} className={ligne}
                            title={vueParLesJoueurs ? t('clock.gauge_players_hide') : t('clock.gauge_players_show')}>
                            <span className="flex items-center gap-1.5 text-xs text-app-text">
                                {vueParLesJoueurs ? <Eye size={13} /> : <EyeOff size={13} />} {t('clock.gauge_players')}
                            </span>
                            {interrupteur(vueParLesJoueurs)}
                        </button>

                        {/*
                          **La couleur de cette jauge SUR L'AFFICHEUR** (David,
                          2026-08-31). Les jauges de CET écran gardent leur
                          habillage de thème : ce réglage ne parle qu'à l'objet de
                          la table.
                        */}
                        <div className={ligne}>
                            <span className="text-xs text-app-text">{t('clock.agencement.couleur_afficheur')}</span>
                            <span className="flex items-center gap-1.5">
                                <input
                                    type="color"
                                    value={clock.color ?? COULEUR_DE_JAUGE_PAR_DEFAUT}
                                    onChange={(e) => changerLaCouleurDeLaJauge(clock.id, e.target.value)}
                                    title={t('clock.gauge_color')}
                                    aria-label={t('clock.gauge_color')}
                                    className="h-6 w-6 shrink-0 cursor-pointer rounded border border-app-border bg-transparent p-0"
                                />
                                {clock.color && (
                                    <button
                                        type="button"
                                        onClick={() => changerLaCouleurDeLaJauge(clock.id, null)}
                                        title={t('clock.gauge_color_reset')}
                                        className="rounded border border-app-border px-1.5 text-ui-9 font-bold uppercase text-app-subtle hover:text-app-text"
                                    >
                                        {t('clock.agencement.couleur_origine')}
                                    </button>
                                )}
                            </span>
                        </div>

                        <button
                            onClick={() => { setMenuOuvert(false); removeTensionClock(clock.id); }}
                            className="flex items-center justify-center gap-2 rounded-lg border border-etat-danger/30 bg-etat-danger/5 py-1.5 text-ui-10 font-bold uppercase tracking-wider text-etat-danger/80 hover:bg-etat-danger/15 hover:text-etat-danger"
                        >
                            <Trash2 size={13} /> {t('clock.agencement.supprimer')}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CarteDeJauge;
