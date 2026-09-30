import type { TFunction } from 'i18next';

export const getFateRankLabel = (rank: number, t: TFunction) => {
    if (rank >= 8) return t('dice.fate_ranks.legendary');
    if (rank >= 4) return t('dice.fate_ranks.superb');
    if (rank >= 2) return t('dice.fate_ranks.good');
    if (rank <= -2) return t('dice.fate_ranks.poor');
    return t('dice.fate_ranks.neutral');
};

export const getDieCssClass = (r: any) => {
    if (r.isExploded) return 'bg-etat-alerte/30 text-etat-alerte border border-etat-alerte/50';
    if (r.isCritMax) return 'bg-etat-succes/30 text-etat-succes border border-etat-succes/50';
    if (r.isCritMin) return 'bg-etat-danger/30 text-etat-danger border border-etat-danger/50';
    if (r.source === 'gear') return 'bg-etat-info/20 text-etat-info border border-etat-info/30';
    if (r.source === 'base') return 'bg-accent/20 text-accent border border-accent/30';
    return 'bg-app-surface/40 border-app-border/20 text-app-text/40';
};
