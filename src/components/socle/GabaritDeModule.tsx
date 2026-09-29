import React from 'react';
import { Ornement } from './Ornement';

/**
 * **`<GabaritDeModule>`** — socle, P3.7, 2026-09-30.
 *
 * **La grammaire d'écran** (décision D2, retenue avec Stitch le 2026-09-26),
 * la même dans chaque module :
 *
 * 1. l'**en-tête** du module (`<EnTeteDeModule>`) ;
 * 2. la **barre d'outils**, juste dessous — l'action principale en bouton
 *    plein à gauche, les secondaires ensuite ;
 * 3. la **zone de travail**, au centre, la plus grande possible ;
 * 4. le **panneau de réglages à droite** (~300 px) : ce qui se règle, séparé de
 *    ce qui se fait.
 *
 * C'est la disposition, pas l'allure : l'allure vient du thème. **À la table**
 * (`aLaTable`), les espacements s'élargissent et le panneau de réglages se
 * replie derrière un bouton (`reglagesOuverts`).
 */
export interface GabaritDeModuleProps {
    entete: React.ReactNode;
    barreDOutils?: React.ReactNode;
    reglages?: React.ReactNode;
    /** À la table : espacements élargis, réglages repliables. */
    aLaTable?: boolean;
    /** À la table seulement : le panneau de réglages est-il déplié ? */
    reglagesOuverts?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const GabaritDeModule: React.FC<GabaritDeModuleProps> = ({
    entete, barreDOutils, reglages, aLaTable = false, reglagesOuverts = false, children, className = '',
}) => {
    const reglagesVisibles = !!reglages && (!aLaTable || reglagesOuverts);
    return (
        <div data-gabarit-de-module="" className={`flex h-full min-h-0 flex-col ${aLaTable ? 'gap-6 p-6' : 'gap-3 p-4'} ${className}`}>
            {entete}
            {barreDOutils && (
                <div role="toolbar" className={`flex flex-wrap items-center ${aLaTable ? 'gap-3' : 'gap-2'}`}>
                    {barreDOutils}
                </div>
            )}
            <div className={`flex min-h-0 flex-1 ${aLaTable ? 'gap-6' : 'gap-4'}`}>
                <main className="min-w-0 flex-1 overflow-auto">{children}</main>
                {reglagesVisibles && (
                    <aside aria-label="Réglages" className="flex w-[300px] shrink-0 flex-col gap-3 overflow-y-auto">
                        {reglages}
                    </aside>
                )}
            </div>
        </div>
    );
};

/**
 * **Le séparateur entre deux sections** — l'ornement `separateur` du thème
 * s'il en a un, un filet sinon.
 */
export const Separateur: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div role="separator" className={`relative flex items-center justify-center py-1 ${className}`}>
        <span className="h-px w-full bg-app-soft" />
        <Ornement emplacement="separateur" className="absolute inset-x-0 mx-auto h-3 w-40" />
    </div>
);
