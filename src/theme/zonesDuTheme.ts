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
