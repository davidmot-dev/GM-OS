import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, GripVertical, Play, Settings2, Square, Trash2, SkipBack, SkipForward } from 'lucide-react';
import { Etiquette, Panneau } from '../../components/socle';
import type { StoryboardMoment } from './useStoryboardStore';
import { SOURCES_DU_MOMENT, type CleDeSource } from './sourcesDuMoment';

/**
 * **Le tableau des moments** — refonte, L5, étape 2. Une ligne par moment,
 * une colonne par source ; « Jouer » par ligne, et « Arrêter » sur la ligne en
 * cours, qui se détache. Remplace la pellicule de cartes en défilé horizontal,
 * où « ce moment touche-t-il la lumière ? » se cherchait carte par carte.
 *
 * Le gabarit est partagé par l'en-tête et les lignes : *deux gabarits pour une
 * même grille finissent par décaler leurs colonnes.*
 */
export const GABARIT_DES_LIGNES = 'grid-cols-[4.5rem_minmax(9rem,1fr)_repeat(7,2.5rem)_7.5rem_6.5rem]';

export const EnTeteDuTableau: React.FC = () => {
    const { t } = useTranslation(['modules']);
    return (
        <div className={`sticky top-0 z-10 grid ${GABARIT_DES_LIGNES} items-center border-b border-app-border bg-app-surface-2 text-ui-9 font-black uppercase tracking-widest text-app-muted`}>
            <span className="py-3 pl-3">{t('modules:storyboard.agencement.ordre')}</span>
            <span className="py-3">{t('modules:storyboard.agencement.moment')}</span>
            {SOURCES_DU_MOMENT.map(s => (
                <span key={s.cle} className="flex justify-center py-3" title={t(s.libelle)}>
                    <s.icone size={14} className={s.teinte} />
                </span>
            ))}
            <span className="py-3 text-center">{t('modules:storyboard.agencement.commande')}</span>
            <span className="py-3 text-center">{t('modules:storyboard.agencement.gestion')}</span>
        </div>
    );
};

interface LigneDeMomentProps {
    moment: StoryboardMoment;
    index: number;
    enCours: boolean;
    onJouer: (id: string) => void;
    /** Referme la parenthèse : l'image de la scène revient. */
    onArreter: () => void;
    onRegler: (moment: StoryboardMoment) => void;
    onSupprimer: (id: string) => void;
    onDupliquer: (id: string) => void;
}

export const LigneDeMoment: React.FC<LigneDeMomentProps> = ({ moment, index, enCours, onJouer, onArreter, onRegler, onSupprimer, onDupliquer }) => {
    const { t } = useTranslation(['modules']);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: moment.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }}
            className={`group relative grid ${GABARIT_DES_LIGNES} items-center border-b border-app-border transition-colors ${
                enCours ? 'bg-accent/10' : 'hover:bg-app-surface-2/60'
            } ${isDragging ? 'bg-app-surface-2 shadow-2xl' : ''}`}
        >
            {enCours && <span className="absolute inset-y-0 left-0 w-1 bg-accent" />}

            <div className="flex items-center gap-1 pl-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab rounded p-1 text-app-subtle transition-colors hover:text-accent active:cursor-grabbing"
                    title={t('modules:storyboard.actions.drag_hint')}
                >
                    <GripVertical size={14} />
                </button>
                <span className={`font-mono text-sm font-black ${enCours ? 'text-accent' : 'text-app-muted'}`}>
                    {(index + 1).toString().padStart(2, '0')}
                </span>
            </div>

            <div className="min-w-0 py-3 pr-3">
                <p className={`truncate text-sm font-black uppercase tracking-wide ${enCours ? 'text-accent' : 'text-app-text'}`} title={moment.name}>{moment.name}</p>
                {/* L'étiquette sous le nom, pas à côté : en fenêtre étroite elle
                    le réduisait à « LA … ». */}
                {(enCours || moment.titre?.trim()) && (
                    <div className="mt-0.5 flex min-w-0 items-center gap-2">
                        {enCours && <Etiquette ton="accent" className="shrink-0 whitespace-nowrap">{t('modules:storyboard.agencement.en_cours')}</Etiquette>}
                        {moment.titre?.trim() && <p className="truncate text-ui-10 text-app-muted">« {moment.titre.trim()} »</p>}
                    </div>
                )}
            </div>

            {SOURCES_DU_MOMENT.map(s => {
                const touchee = s.touche(moment);
                return (
                    <span key={s.cle} className="flex justify-center" title={touchee ? t(s.libelle) : undefined}>
                        <span className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                            touchee ? `${s.fond} ${s.teinte}` : 'border-transparent text-app-subtle'
                        }`}>
                            {touchee ? <s.icone size={14} /> : <span className="text-xs">·</span>}
                        </span>
                    </span>
                );
            })}

            <div className="px-2">
                {/* Le même bouton arrête ce qu'il a lancé : un moment qu'on ne
                    peut couper que depuis un autre écran laisse son image sur la
                    table, et l'image de la scène ne revient jamais. */}
                <button
                    onClick={() => (enCours ? onArreter() : onJouer(moment.id))}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-ui-10 font-black uppercase tracking-widest transition-all ${
                        enCours
                            ? 'bg-etat-danger text-app-bg hover:bg-etat-danger/80'
                            : 'border border-app-border bg-app-surface-2 text-app-text hover:border-accent/50 hover:text-accent'
                    }`}
                >
                    {enCours ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {enCours ? t('modules:storyboard.agencement.arreter') : t('modules:storyboard.agencement.jouer')}
                </button>
            </div>

            <div className="flex justify-center gap-0.5">
                <button onClick={() => onDupliquer(moment.id)} className="rounded-md p-1.5 text-app-muted transition-colors hover:bg-app-text/10 hover:text-app-text" title={t('modules:storyboard.actions.duplicate')}>
                    <Copy size={14} />
                </button>
                <button onClick={() => onRegler(moment)} className="rounded-md p-1.5 text-app-muted transition-colors hover:bg-app-text/10 hover:text-accent" title={t('modules:storyboard.actions.edit')}>
                    <Settings2 size={14} />
                </button>
                <button onClick={() => onSupprimer(moment.id)} className="rounded-md p-1.5 text-app-muted transition-colors hover:bg-etat-danger/15 hover:text-etat-danger" title={t('modules:storyboard.actions.delete')}>
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

interface DetailDuMomentProps {
    moment: StoryboardMoment | null;
    /** Ce que la source joue, en mots — le tableau de bord connaît les listes. */
    nommer: (cle: CleDeSource, moment: StoryboardMoment) => string;
    onPrecedent: (() => void) | null;
    onSuivant: (() => void) | null;
    onArreter: () => void;
}

/**
 * **Le détail du moment en cours** : ce que chaque source joue, en clair, et
 * les deux gestes pour enchaîner sans viser la ligne.
 */
export const DetailDuMoment: React.FC<DetailDuMomentProps> = ({ moment, nommer, onPrecedent, onSuivant, onArreter }) => {
    const { t } = useTranslation(['modules']);
    const sources = moment ? SOURCES_DU_MOMENT.filter(s => s.touche(moment)) : [];

    return (
        <div className="flex flex-col gap-3">
            <Panneau niveau={2} className="p-4">
                <p className="text-ui-10 font-black uppercase tracking-[0.2em] text-accent">{t('modules:storyboard.agencement.moment_en_cours')}</p>
                <h3 className={`mt-1 font-display text-lg font-bold leading-tight ${moment ? 'text-app-text' : 'text-app-subtle'}`}>
                    {moment ? moment.name : t('modules:storyboard.agencement.aucun_moment')}
                </h3>
                {moment && (
                    <div className="mt-3 divide-y divide-app-border rounded-lg border border-app-border">
                        {sources.map(s => (
                            <div key={s.cle} className="flex items-center gap-3 px-3 py-2">
                                <s.icone size={14} className={`shrink-0 ${s.teinte}`} />
                                <span className="shrink-0 text-ui-10 font-black uppercase tracking-widest text-app-muted">{t(`modules:storyboard.agencement.source_${s.cle}`)}</span>
                                <span className="ml-auto truncate text-right text-xs font-bold text-app-text" title={nommer(s.cle, moment)}>{nommer(s.cle, moment)}</span>
                            </div>
                        ))}
                        {sources.length === 0 && <p className="px-3 py-2 text-xs italic text-app-subtle">{t('modules:storyboard.agencement.ne_touche_rien')}</p>}
                    </div>
                )}
            </Panneau>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onPrecedent?.()}
                    disabled={!onPrecedent}
                    className="flex items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface py-3 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-accent/50 disabled:opacity-30"
                >
                    <SkipBack size={14} />{t('modules:storyboard.agencement.precedent')}
                </button>
                <button
                    onClick={() => onSuivant?.()}
                    disabled={!onSuivant}
                    className="flex items-center justify-center gap-2 rounded-lg bg-accent py-3 text-ui-10 font-black uppercase tracking-widest text-app-on-accent transition-all hover:bg-accent/80 disabled:opacity-30"
                >
                    {t('modules:storyboard.agencement.suivant')}<SkipForward size={14} />
                </button>
            </div>
            {moment && (
                <button
                    onClick={onArreter}
                    className="flex items-center justify-center gap-2 rounded-lg bg-etat-danger py-3 text-xs font-black uppercase tracking-widest text-app-bg transition-all hover:bg-etat-danger/80"
                >
                    <Square size={14} fill="currentColor" />{t('modules:storyboard.agencement.arreter_le_moment')}
                </button>
            )}
        </div>
    );
};
