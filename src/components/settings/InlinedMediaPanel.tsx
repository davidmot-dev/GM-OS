import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Images, RefreshCw, ShieldCheck } from 'lucide-react';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { useFavoriteStore } from '../../modules/favorite/useFavoriteStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { gmToast } from '../../stores/useToastStore';
import {
    scanInlinedMedia,
    summarize,
    migrateInlinedMedia,
    type ScanSummary,
    type MigrationReport,
} from '../../modules/system/logic/InlinedMediaMigration';
import { formatBytes } from '../../modules/session/logic/storageDiagnostics';

/** Tranches d'état porteuses de médias, copiées pour travailler hors du store. */
function cloneScannableState() {
    const s = useSessionOSStore.getState();
    return structuredClone({
        campaigns: s.campaigns || [],
        atlasMaps: s.atlasMaps || [],
        entities: s.entities || [],
        clues: s.clues || [],
        players: s.players || [],
    });
}

/**
 * Reprise des médias stockés en base64 dans les campagnes.
 *
 * Deux temps assumés : une analyse qui n'écrit rien et annonce ce qui serait
 * fait, puis la migration proprement dite. Le MJ décide entre les deux.
 */
export const InlinedMediaPanel: React.FC = () => {
    const { t } = useTranslation(['settings', 'common']);
    const [summary, setSummary] = useState<ScanSummary | null>(null);
    const [report, setReport] = useState<MigrationReport | null>(null);
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const handleScan = () => {
        try {
            const entries = scanInlinedMedia(cloneScannableState(), {
                favorites: useFavoriteStore.getState().favorites || [],
            });
            setSummary(summarize(entries));
            setReport(null);
        } catch (err) {
            console.error('[InlinedMedia] Analyse impossible:', err);
            gmToast(t('settings:inlined_media.scan_failed'), 'error');
        }
    };

    const handleMigrate = async () => {
        if (!window.confirm(t('settings:inlined_media.confirm'))) return;

        setIsBusy(true);
        setProgress({ done: 0, total: summary?.count ?? 0 });
        try {
            // On travaille sur des copies : l'état vivant n'est remplacé qu'une
            // fois la migration terminée, et seulement pour les champs repris.
            const state = cloneScannableState();
            const favorites = structuredClone({ favorites: useFavoriteStore.getState().favorites || [] });

            const entries = scanInlinedMedia(state, favorites);
            const media = useMediaStore.getState();
            await media.initDB();

            const result = await migrateInlinedMedia(entries, {
                addMedia: media.addMedia,
                getMediaBlob: media.getMediaBlob,
                onProgress: (done, total) => setProgress({ done, total }),
            });

            if (result.migrated > 0) {
                useSessionOSStore.setState(state as any);
                useFavoriteStore.setState(favorites as any);
            }

            setReport(result);
            setSummary(null);
            gmToast(
                t('settings:inlined_media.done', {
                    count: result.migrated,
                    size: formatBytes(result.freedBytes),
                }),
                result.failed > 0 ? 'warning' : 'success'
            );
        } catch (err) {
            console.error('[InlinedMedia] Migration impossible:', err);
            gmToast(t('settings:inlined_media.migrate_failed'), 'error');
        } finally {
            setIsBusy(false);
            setProgress(null);
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-app-surface/20 border border-app-border/10">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h4 className="text-app-text font-bold text-sm mb-1">{t('settings:inlined_media.title')}</h4>
                    <p className="text-xs text-app-text/40 max-w-md">{t('settings:inlined_media.description')}</p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isBusy}
                    className="flex items-center gap-2 bg-app-surface/60 hover:bg-app-surface text-app-text/80 border border-app-border/30 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    <Images size={16} />
                    {t('settings:inlined_media.scan_button')}
                </button>
            </div>

            {summary && (
                <div className="mt-5 pt-5 border-t border-app-border/10">
                    {summary.count === 0 ? (
                        <p className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                            <ShieldCheck size={14} />
                            {t('settings:inlined_media.none')}
                        </p>
                    ) : (
                        <>
                            <p className="text-xs text-app-text/70 mb-3">
                                {t('settings:inlined_media.found', {
                                    count: summary.count,
                                    size: formatBytes(summary.totalBytes),
                                })}
                            </p>
                            <div className="space-y-1 mb-4">
                                {summary.byField.map(f => (
                                    <div key={f.field} className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-app-text/50">
                                        <span>{f.field} × {f.count}</span>
                                        <span className="tabular-nums">{formatBytes(f.bytes)}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-amber-400/80 mb-3">{t('settings:inlined_media.backup_hint')}</p>
                            <button
                                onClick={handleMigrate}
                                disabled={isBusy}
                                className="flex items-center gap-2 bg-accent/10 hover:bg-accent text-accent hover:text-app-bg border border-accent/30 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                {isBusy ? <RefreshCw size={16} className="animate-spin" /> : <Images size={16} />}
                                {isBusy && progress
                                    ? t('settings:inlined_media.migrating', { done: progress.done, total: progress.total })
                                    : t('settings:inlined_media.migrate_button')}
                            </button>
                        </>
                    )}
                </div>
            )}

            {report && (
                <div className="mt-5 pt-5 border-t border-app-border/10 space-y-1">
                    <p className="text-xs text-emerald-400 font-bold">
                        {t('settings:inlined_media.report', {
                            count: report.migrated,
                            size: formatBytes(report.freedBytes),
                        })}
                    </p>
                    {(report.failed > 0 || report.skipped > 0) && (
                        <>
                            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                {t('settings:inlined_media.kept', { count: report.failed + report.skipped })}
                            </p>
                            {report.errors.slice(0, 5).map((e, i) => (
                                <p key={i} className="text-[10px] text-app-text/40">{e}</p>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
