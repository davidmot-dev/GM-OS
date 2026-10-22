import React from 'react';

/** Un onglet de la fiche : le formulaire, le test, la fiche du jeu… */
export interface OngletDeLaFiche<T extends string> {
    id: T;
    libelle: string;
    icone?: React.ReactNode;
}

/**
 * **Les onglets d'une fiche de personnage** — chez le meneur et sur la tablette.
 *
 * David, le 2026-10-22 : *« je voudrais déporter la section "Lancer un Test"
 * dans un onglet séparé, car cela prend de plus en plus de place sur la
 * fiche »*. La maquette retenue (Stitch, `Stitch/onglet-test/`) les pose sous
 * la barre de la fiche, soulignés de l'accent. Un seul composant pour les deux
 * écrans : deux barres d'onglets écrites à part auraient fini par diverger.
 */
export function OngletsDeLaFiche<T extends string>({ onglets, actif, onChoisir, idDuPanneau, className = '' }: {
    onglets: readonly OngletDeLaFiche<T>[];
    actif: T;
    onChoisir: (id: T) => void;
    /** Préfixe des identifiants de panneaux, pour `aria-controls`. */
    idDuPanneau: string;
    className?: string;
}) {
    return (
        <div role="tablist" aria-label="Vues de la fiche" className={`flex items-stretch gap-1 border-b border-app-border ${className}`}>
            {onglets.map(o => {
                const choisi = o.id === actif;
                return (
                    <button
                        key={o.id}
                        type="button"
                        role="tab"
                        id={`${idDuPanneau}-onglet-${o.id}`}
                        aria-selected={choisi}
                        aria-controls={`${idDuPanneau}-${o.id}`}
                        onClick={() => onChoisir(o.id)}
                        className={`flex items-center gap-2 px-5 py-3 -mb-px border-b-2 text-ui-11 font-black uppercase tracking-widest transition-colors ${
                            choisi
                                ? 'border-accent text-accent'
                                : 'border-transparent text-app-text/50 hover:text-app-text'
                        }`}
                    >
                        {o.icone}
                        {o.libelle}
                    </button>
                );
            })}
        </div>
    );
}

export default OngletsDeLaFiche;
