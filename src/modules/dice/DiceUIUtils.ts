import type { TFunction } from 'i18next';

export const getFateRankLabel = (rank: number, t: TFunction) => {
    if (rank >= 8) return t('dice.fate_ranks.legendary');
    if (rank >= 4) return t('dice.fate_ranks.superb');
    if (rank >= 2) return t('dice.fate_ranks.good');
    if (rank <= -2) return t('dice.fate_ranks.poor');
    return t('dice.fate_ranks.neutral');
};

export const getDieCssClass = (r: any) => {
    if (r.isExploded) return 'bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-400/50';
    if (r.isCritMax) return 'bg-emerald-500/30 text-emerald-700 dark:text-emerald-100 border border-emerald-400/50';
    if (r.isCritMin) return 'bg-rose-500/30 text-rose-700 dark:text-rose-100 border border-rose-400/50';
    if (r.source === 'gear') return 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30';
    if (r.source === 'base') return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30';
    return 'bg-app-surface/40 border-app-border/20 text-app-text/40';
};
