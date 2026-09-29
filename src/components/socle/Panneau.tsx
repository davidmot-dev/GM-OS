import React from 'react';
import { CoinsOrnes, Ornement } from './Ornement';

/**
 * **`<Panneau>`** — socle, P3.2, 2026-09-30.
 *
 * Le seul à connaître la forme d'un panneau : son relief, son arrondi, sa
 * bordure, sa matière et ses ornements, **tous lus dans le thème**, avec un
 * repli quand il ne dit rien.
 *
 * | Niveau | Usage | Relief | Arrondi (famille) |
 * | --- | --- | --- | --- |
 * | 1 · posé | carte, bloc de réglages | `shadow-sm` → `--elev-1` | moyen (`--rayon-md`) |
 * | 2 · flottant | panneau surélevé, colonne | `shadow-lg` → `--elev-2` | moyen, sur `surface-2` |
 * | 3 · dialogue | fenêtre, surcouche | `shadow-2xl` → `--elev-3` | grand (`--rayon-lg`) |
 *
 * Décision de David (2026-09-30) : **les ornements avec parcimonie**. Un panneau
 * ne porte ses coins que si on le lui demande (`orne`) — un ou deux par écran ;
 * *un écran qui orne tout n'orne rien.* Le filigrane (`fond`) ne paraît que
 * dans un panneau `vide`.
 */
export type NiveauDePanneau = 1 | 2 | 3;

const PAR_NIVEAU: Record<NiveauDePanneau, string> = {
    1: 'bg-app-surface shadow-sm rounded-xl',
    2: 'bg-app-surface-2 shadow-lg rounded-xl',
    3: 'bg-app-surface shadow-2xl rounded-2xl',
};

export interface PanneauProps extends React.HTMLAttributes<HTMLElement> {
    niveau?: NiveauDePanneau;
    /** Les coins ornés du thème, s'il en a. Un ou deux panneaux par écran. */
    orne?: boolean;
    /** Le panneau n'a rien à montrer : l'ornement `fond` s'y pose en filigrane. */
    vide?: boolean;
    /** La balise rendue — `section` par défaut, `aside` pour un panneau de réglages. */
    as?: 'section' | 'aside' | 'div' | 'article';
}

export const Panneau: React.FC<PanneauProps> = ({
    niveau = 1, orne = false, vide = false, as: Balise = 'section', className = '', style, children, ...reste
}) => (
    <Balise
        data-panneau={niveau}
        className={`relative overflow-hidden text-app-text border-app-border ${PAR_NIVEAU[niveau]} ${className}`}
        style={{
            // La bordure du thème (§ 4.5) ; 1 px plein, celle d'aujourd'hui, en repli.
            borderWidth: 'var(--bordure-largeur, 1px)',
            borderStyle: 'var(--bordure-style, solid)',
            ...style,
        }}
        {...reste}
    >
        {/* La matière de panneau (§ 7), sous le contenu. Absente : rien. */}
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'var(--texture-panneau, none)', opacity: 'var(--texture-opacite, 0)' }}
        />
        {orne && <CoinsOrnes />}
        {vide && (
            <Ornement
                emplacement="fond"
                className="absolute inset-0 m-auto opacity-15"
                style={{ width: '40%', height: '40%' }}
            />
        )}
        <div className="relative">{children}</div>
    </Balise>
);
