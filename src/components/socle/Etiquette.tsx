import React from 'react';

/**
 * **`<Etiquette>`** — socle, P3.6, 2026-09-30.
 *
 * La pastille d'état : un camp, un statut, une valeur. Les quatre couleurs
 * d'état du thème (`--etat-*`), l'accent, ou le neutre. **Jamais sous 11 px**
 * (`text-ui-11`, qui suit la bande « étiquettes » de l'échelle) : la règle de
 * la grammaire, pour un meneur qui lit à un mètre.
 */
export type TonDEtiquette = 'neutre' | 'accent' | 'succes' | 'alerte' | 'danger' | 'info';

const PAR_TON: Record<TonDEtiquette, string> = {
    neutre: 'bg-app-surface-2 text-app-muted border-app-border',
    accent: 'bg-accent/15 text-accent border-accent/40',
    succes: 'bg-etat-succes/15 text-etat-succes border-etat-succes/40',
    alerte: 'bg-etat-alerte/15 text-etat-alerte border-etat-alerte/40',
    danger: 'bg-etat-danger/15 text-etat-danger border-etat-danger/40',
    info: 'bg-etat-info/15 text-etat-info border-etat-info/40',
};

export interface EtiquetteProps extends React.HTMLAttributes<HTMLSpanElement> {
    ton?: TonDEtiquette;
}

export const Etiquette: React.FC<EtiquetteProps> = ({ ton = 'neutre', className = '', style, children, ...reste }) => (
    <span
        data-ton={ton}
        className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-ui-11 font-bold uppercase ${PAR_TON[ton]} ${className}`}
        style={{ letterSpacing: 'var(--surtitre-espacement, 0.12em)', ...style }}
        {...reste}
    >
        {children}
    </span>
);
