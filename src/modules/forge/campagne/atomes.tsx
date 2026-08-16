import React from 'react';

/**
 * Les deux atomes visuels partagés par l'Atelier et la Forge de campagne.
 *
 * **Extraits le 2026-08-16, quand le second écran est apparu.** Les recopier
 * aurait garanti la divergence : deux listes de choix qui ne se sélectionnent
 * pas de la même façon donnent l'impression de deux applications, et le meneur
 * passe de l'une à l'autre dans le même geste de travail.
 */

/**
 * Une ligne de choix — **une liste, pas un menu déroulant**.
 *
 * Le menu d'un `<select>` est une fenêtre que le SYSTÈME dessine : sous Windows,
 * Chromium en fait une fenêtre native. David l'a vue deux fois s'ouvrir en gris
 * illisible. `color-scheme` et `nativeTheme` corrigent la cause à la racine ;
 * ici, on n'a simplement pas besoin d'un menu — quelques lignes tiennent à
 * l'écran et rien n'est délégué à personne.
 */
export const CibleDeCampagne: React.FC<{
    libelle: string;
    actif: boolean;
    onChoisir: () => void;
}> = ({ libelle, actif, onChoisir }) => (
    <button
        onClick={onChoisir}
        className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs transition-all ${
            actif
                ? 'bg-accent/15 border-accent/40 text-accent font-bold'
                : 'bg-app-bg/30 border-app-border/20 text-app-text/50 hover:text-app-text/80'
        }`}
    >
        {libelle}
    </button>
);

/** Un panneau titré. */
export const Bloc: React.FC<{
    icone: React.ReactNode;
    titre: string;
    children: React.ReactNode;
}> = ({ icone, titre, children }) => (
    <div className="rounded-2xl border border-app-border/10 bg-app-surface/40 p-5">
        <div className="flex items-center gap-2 mb-3 text-accent">
            {icone}
            <h3 className="text-[11px] font-black uppercase tracking-widest text-app-text">{titre}</h3>
        </div>
        {children}
    </div>
);
