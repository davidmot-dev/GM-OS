import React from 'react';

/**
 * **Où se voit ce réglage** — refonte, L6, maquette retenue de l'atelier du
 * thème (`stitch/outillage/outillage-atelier-du-theme.png`) : *« chaque
 * réglage dit où il se voit, et le montre : une vignette où la zone est
 * surlignée »* — David : *« être plus explicite sur les options »*.
 *
 * Un écran de GM-OS en miniature : le fond, une colonne, un panneau, un titre,
 * des lignes de texte, un bouton. La zone que le jeton habille est peinte en
 * alerte ; le reste reste neutre. Des classes, aucune couleur écrite en dur :
 * la vignette suit le thème qu'on est en train de régler.
 */
export type Zone =
    | 'fond' | 'surface' | 'surface-2' | 'papier' | 'texte' | 'estompe' | 'accent' | 'accent-2'
    | 'sur-accent' | 'bordure' | 'titres' | 'corps' | 'chiffres' | 'tailles' | 'rayon' | 'ombre';

/** La zone que chaque jeton habille. */
export const ZONE_DU_JETON: Record<string, Zone> = {
    bg: 'fond', surface: 'surface', 'surface-2': 'surface-2', paper: 'papier', ink: 'papier',
    text: 'texte', muted: 'estompe', accent: 'accent', 'accent-2': 'accent-2', 'accent-contrast': 'sur-accent',
    border: 'bordure', 'border-soft': 'bordure',
    'font-display': 'titres', 'font-body': 'corps', 'font-ui': 'corps', 'font-mono': 'chiffres',
    'font-scale': 'tailles', 'scale-interface': 'tailles', 'scale-corps': 'corps', 'scale-titres': 'titres', 'scale-mono': 'chiffres',
    'title-tracking': 'titres', 'kicker-tracking': 'titres',
    'radius-sm': 'rayon', 'radius-md': 'rayon', 'radius-lg': 'rayon', shadow: 'ombre',
};

const VIF = 'bg-etat-alerte';
const NEUTRE = 'bg-app-muted/40';

export const VignetteDeZone: React.FC<{ zone: Zone }> = ({ zone }) => {
    const z = (...zones: Zone[]) => zones.includes(zone);
    const trait = (actif: boolean) => (actif ? VIF : NEUTRE);
    return (
        <div
            aria-hidden
            className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                z('bordure') ? 'border-etat-alerte' : 'border-app-border'
            } ${z('fond') ? 'bg-etat-alerte/50' : 'bg-app-bg'}`}
        >
            {/* La colonne de gauche */}
            <div className={`absolute bottom-1 left-1 top-1 w-3 rounded-sm ${z('surface') ? VIF : 'bg-app-surface'}`} />
            {/* Le panneau */}
            <div
                className={`absolute bottom-1 left-5 right-1 top-1 rounded-sm p-1 ${
                    z('surface', 'papier') ? VIF : z('surface-2') ? 'bg-app-surface' : 'bg-app-surface'
                } ${z('ombre') ? 'shadow-[0_0_0_2px_var(--etat-alerte)]' : ''} ${z('rayon') ? 'rounded-lg ring-2 ring-etat-alerte' : ''}`}
            >
                {/* Le titre */}
                <div className={`h-1.5 w-2/3 rounded-full ${trait(z('titres', 'tailles'))}`} />
                {/* Les lignes de texte */}
                <div className={`mt-1 h-1 w-full rounded-full ${trait(z('texte', 'corps', 'tailles'))}`} />
                <div className={`mt-0.5 h-1 w-4/5 rounded-full ${trait(z('estompe', 'corps', 'tailles'))}`} />
                {/* Un chiffre, une case dans le panneau */}
                <div className="mt-1 flex items-center gap-1">
                    <div className={`h-1.5 w-2 rounded-sm ${trait(z('chiffres'))}`} />
                    <div className={`h-1.5 flex-1 rounded-sm ${z('surface-2') ? VIF : 'bg-app-surface-2'}`} />
                </div>
                {/* Le bouton */}
                <div className={`absolute bottom-1 right-1 flex h-2 w-5 items-center justify-center rounded-sm ${
                    z('accent', 'sur-accent') ? (z('accent') ? VIF : 'bg-accent') : z('accent-2') ? VIF : 'bg-accent/60'
                }`}>
                    <div className={`h-0.5 w-3 rounded-full ${z('sur-accent') ? VIF + ' ring-1 ring-app-bg' : 'bg-app-on-accent/70'}`} />
                </div>
            </div>
        </div>
    );
};
