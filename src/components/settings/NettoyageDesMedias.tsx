import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, RefreshCw, Search, Lock, AlertTriangle } from 'lucide-react';
import { mediaCleanupService, type ApercuDuNettoyage } from '../../services/MediaCleanupService';
import { gmToast } from '../../stores/useToastStore';

/** Combien d'orphelins on nomme avant de compter le reste. */
const NOMMES = 8;

const enMo = (octets: number) => (octets / 1024 / 1024).toFixed(2);

/**
 * **Le nettoyage annonce avant d'agir.**
 *
 * Le bouton précédent supprimait au premier clic — sans confirmation, sans
 * liste — et donnait le compte une fois le mal fait. Sur une base dont la revue
 * du 2026-09-04 a montré qu'elle avait **six angles morts** (Map-OS, les
 * indices, le storyboard, les documents de fiche, l'avatar d'un joueur, les
 * favoris), c'était la manœuvre la plus coûteuse de l'application.
 *
 * Deux temps désormais : **Analyser**, qui ne touche à rien et nomme ce qui
 * partirait, puis **Supprimer**, qui exécute exactement le plan affiché.
 */
const NettoyageDesMedias: React.FC = () => {
    const { t } = useTranslation(['settings', 'common']);
    const [apercu, setApercu] = useState<ApercuDuNettoyage | null>(null);
    const [enAnalyse, setEnAnalyse] = useState(false);
    const [enSuppression, setEnSuppression] = useState(false);
    const [dernier, setDernier] = useState<{ deletedCount: number; savedBytes: number } | null>(null);

    const analyser = async () => {
        setEnAnalyse(true);
        setDernier(null);
        try {
            setApercu(await mediaCleanupService.apercu());
        } catch {
            gmToast(t('common:error_cleanup'), 'error');
        } finally {
            setEnAnalyse(false);
        }
    };

    const supprimer = async () => {
        if (!apercu) return;
        setEnSuppression(true);
        try {
            /*
              On repasse le plan affiché : sans lui, un second recensement
              trancherait à nouveau, et l'utilisateur confirmerait une liste
              qui n'est plus celle qu'il a lue.
            */
            const res = await mediaCleanupService.performCleanup(apercu);
            setDernier(res);
            setApercu(null);
            gmToast(t('common:success_cleanup', { count: res.deletedCount }), 'success');
        } catch {
            gmToast(t('common:error_cleanup'), 'error');
        } finally {
            setEnSuppression(false);
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-app-surface/20 border border-app-border/10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h4 className="text-app-text font-bold text-sm mb-1">
                        {t('settings:maintenance.media_cleanup_title')}
                    </h4>
                    <p className="text-xs text-app-text/40 max-w-md">
                        {t('settings:maintenance.media_cleanup_desc')}
                    </p>
                    {dernier && (
                        <p className="text-[10px] text-accent font-black uppercase mt-2">
                            {t('settings:maintenance.media_cleanup_last', {
                                count: dernier.deletedCount,
                                size: enMo(dernier.savedBytes),
                            })}
                        </p>
                    )}
                </div>
                <button
                    onClick={analyser}
                    disabled={enAnalyse || enSuppression}
                    className="flex items-center gap-2 bg-accent/10 hover:bg-accent text-accent hover:text-app-bg border border-accent/30 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    {enAnalyse ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
                    {enAnalyse
                        ? t('settings:maintenance.media_cleanup_scanning')
                        : t('settings:maintenance.media_cleanup_scan')}
                </button>
            </div>

            {apercu && !apercu.fiable && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        {t('settings:maintenance.media_cleanup_unreliable', {
                            modules: apercu.modulesEnEchec.join(', '),
                        })}
                    </p>
                </div>
            )}

            {apercu && apercu.fiable && apercu.aSupprimer.length === 0 && (
                <p className="text-[11px] text-app-text/40 italic">
                    {t('settings:maintenance.media_cleanup_none')}
                </p>
            )}

            {apercu && apercu.fiable && apercu.aSupprimer.length > 0 && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-app-bg/40 border border-app-border/20">
                    <p className="text-[11px] font-black uppercase tracking-widest text-app-text/60">
                        {t('settings:maintenance.media_cleanup_found', {
                            count: apercu.aSupprimer.length,
                            size: enMo(apercu.octets),
                        })}
                    </p>

                    <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {apercu.aSupprimer.slice(0, NOMMES).map(({ media }) => (
                            <li
                                key={media.id}
                                className="flex items-center justify-between gap-3 text-[11px] text-app-text/50"
                            >
                                <span className="truncate">{media.name}</span>
                                <span className="tabular-nums text-app-text/25 flex-shrink-0">
                                    {enMo(media.size)} Mo
                                </span>
                            </li>
                        ))}
                        {apercu.aSupprimer.length > NOMMES && (
                            <li className="text-[11px] text-app-text/25 italic">
                                {t('settings:maintenance.media_cleanup_more', {
                                    count: apercu.aSupprimer.length - NOMMES,
                                })}
                            </li>
                        )}
                    </ul>

                    {apercu.epargnes.length > 0 && (
                        <p className="flex items-center gap-2 text-[10px] text-app-text/30">
                            <Lock size={11} />
                            {t('settings:maintenance.media_cleanup_spared', {
                                count: apercu.epargnes.length,
                            })}
                        </p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={supprimer}
                            disabled={enSuppression}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {enSuppression ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <Trash2 size={14} />
                            )}
                            {enSuppression
                                ? t('settings:maintenance.cleaning')
                                : t('settings:maintenance.media_cleanup_confirm', {
                                      count: apercu.aSupprimer.length,
                                  })}
                        </button>
                        <button
                            onClick={() => setApercu(null)}
                            disabled={enSuppression}
                            className="text-[11px] font-bold uppercase tracking-widest text-app-text/30 hover:text-app-text/60 transition-colors disabled:opacity-50"
                        >
                            {t('settings:maintenance.media_cleanup_cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NettoyageDesMedias;
