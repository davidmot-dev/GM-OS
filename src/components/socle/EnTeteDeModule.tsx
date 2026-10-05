import React from 'react';
import { Ornement } from './Ornement';

/**
 * **`<EnTeteDeModule>`** — socle, P3.6, 2026-09-30.
 *
 * Le premier des quatre étages de la grammaire d'écran : le titre du module
 * dans la police des titres, avec l'espacement et la casse du thème
 * (`--titre-espacement`, `--titre-casse`), un surtitre, une **ligne d'état en
 * pastilles**, et les actions de l'en-tête à droite. L'ornement `entete` du
 * thème se pose dessous, en frise.
 */
interface EnTeteCommunProps {
    surtitre?: React.ReactNode;
    /** La ligne d'état : des `<Etiquette>`. */
    etat?: React.ReactNode;
    /** Les actions de l'en-tête, à droite. */
    actions?: React.ReactNode;
    className?: string;
}

export type EnTeteDeModuleProps = EnTeteCommunProps & (
    | { habillage?: 'socle'; titre: React.ReactNode; children?: never }
    /** Garde le contenu et les classes d'un en-tête historique pendant T2. */
    | { habillage: 'libre'; children: React.ReactNode; titre?: never }
);

export const EnTeteDeModule: React.FC<EnTeteDeModuleProps> = ({ titre, habillage = 'socle', children, surtitre, etat, actions, className = '' }) => habillage === 'libre' ? (
    <header className={className} data-en-tete-de-module="">{children}</header>
) : (
    <header className={`flex flex-col gap-2 ${className}`} data-en-tete-de-module="">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                {surtitre && (
                    <p className="text-ui-11 font-bold uppercase text-app-muted" style={{ letterSpacing: 'var(--surtitre-espacement, 0.12em)' }}>
                        {surtitre}
                    </p>
                )}
                <h1
                    className="font-display text-2xl font-bold text-app-text leading-tight truncate"
                    style={{ letterSpacing: 'var(--titre-espacement, 0.02em)', textTransform: 'var(--titre-casse, none)' as React.CSSProperties['textTransform'] }}
                >
                    {titre}
                </h1>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {etat && <div className="flex flex-wrap items-center gap-1.5">{etat}</div>}
        <Ornement emplacement="entete" className="h-3 w-48 max-w-full" />
    </header>
);
