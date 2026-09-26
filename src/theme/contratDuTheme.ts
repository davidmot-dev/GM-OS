/**
 * **Le contrat d'un thème de jeu, en données.**
 *
 * C'est la traduction exacte de
 * `documentation/Architecture/Cahier-des-charges-theme-de-jeu.md`, écrite pour
 * être lue par du code : ce que GM-OS applique (`PONT`, dans `jetonsDeTheme.ts`)
 * en est **dérivé**, le validateur (`validationDuTheme.ts`) l'importe, et
 * `electron/contratDuTheme.test.ts` vérifie que les tableaux du cahier le
 * reflètent, jeton par jeton.
 *
 * *Trois copies écrites à la main — le cahier, un JSON, le code — finiraient
 * par se contredire ; deux fichiers d'accord peuvent être faux ensemble.* Il
 * n'y en a donc que deux, le cahier pour le constructeur et ce fichier pour la
 * machine, et un essai qui les tient d'accord.
 *
 * Analyse pure, sans entrée/sortie : ce module tourne dans l'interface, dans les
 * essais de `electron/` et dans `scripts/theme-valider.mjs`, sous Node.
 */

/** La version du cahier des charges que ce fichier traduit. */
export const VERSION_DU_CONTRAT = '1.2';

/**
 * - **LU** : GM-OS l'applique aujourd'hui ;
 * - **V2** : le nouveau GM-OS l'appliquera — sans effet aujourd'hui, **et ce
 *   n'est pas un défaut** ;
 * - **SDK** : sans effet dans GM-OS, il ne sert qu'à la page de démonstration
 *   du SDK. Jamais vérifié.
 */
export type StatutDeJeton = 'LU' | 'V2' | 'SDK';

export type FormatDeJeton =
    /** `#rrggbb`, et rien d'autre : GM-OS en calcule le contraste (§ 3.7, § 5). */
    | { type: 'couleur-opaque' }
    /** `#rrggbb` ou `rgba()`, l'opacité bornée (§ 5). */
    | { type: 'couleur-ou-rgba'; alphaMin: number; alphaMax: number }
    /** `rgba()` obligatoire, l'opacité bornée (§ 4.7). */
    | { type: 'rgba'; alphaMin: number; alphaMax: number }
    /** `rgba()` ou `none` (§ 4.6). */
    | { type: 'halo' }
    /** Une pile de polices finie par une famille générique (§ 4.3). */
    | { type: 'pile' }
    | { type: 'longueur'; unite: 'px' | 'em'; min: number; max: number }
    /** Un facteur ou un pourcentage, borné de 0.8 à 2 — ramené à la borne (§ 4.4). */
    | { type: 'echelle' }
    | { type: 'nombre'; min: number; max: number }
    | { type: 'choix'; valeurs: readonly string[] }
    /** Une valeur de `box-shadow`, ou `none` (§ 4.6). */
    | { type: 'ombre' }
    /** `none`, un dégradé, ou `url('matieres/…')` dans le dossier du thème (§ 7). */
    | { type: 'matiere' }
    | { type: 'libre' };

export interface JetonDuContrat {
    /** Le nom sans le préfixe `--rpg-`. */
    cle: string;
    /** La section du cahier qui le décrit. */
    section: '4.1' | '4.2' | '4.3' | '4.4' | '4.5' | '4.6' | '4.7' | '7';
    statut: StatutDeJeton;
    obligatoire?: boolean;
    format: FormatDeJeton;
    /**
     * La variable de l'interface qu'il alimente, pour les jetons que le pont
     * transporte. Les échelles sont LU sans passer par le pont : elles ont leur
     * propre application, dans `themeDeLInterface.ts`.
     */
    versLInterface?: string;
}

const OPAQUE: FormatDeJeton = { type: 'couleur-opaque' };
const PILE: FormatDeJeton = { type: 'pile' };
const ECHELLE: FormatDeJeton = { type: 'echelle' };
const OMBRE: FormatDeJeton = { type: 'ombre' };
const MATIERE: FormatDeJeton = { type: 'matiere' };
const LIBRE: FormatDeJeton = { type: 'libre' };
const px = (max: number): FormatDeJeton => ({ type: 'longueur', unite: 'px', min: 0, max });
const em = (max: number): FormatDeJeton => ({ type: 'longueur', unite: 'em', min: 0, max });

/**
 * **Les jetons du contrat, dans l'ordre du cahier.**
 *
 * *Un jeton qui ne figure pas ici n'est lu par personne* — le validateur le
 * signale comme tel.
 */
export const JETONS_DU_CONTRAT: readonly JetonDuContrat[] = [
    // § 4.1 · Couleurs de base
    { cle: 'bg', section: '4.1', statut: 'LU', obligatoire: true, format: OPAQUE, versLInterface: '--app-bg' },
    { cle: 'surface', section: '4.1', statut: 'LU', obligatoire: true, format: OPAQUE, versLInterface: '--app-surface' },
    { cle: 'surface-2', section: '4.1', statut: 'V2', format: OPAQUE },
    { cle: 'text', section: '4.1', statut: 'LU', obligatoire: true, format: OPAQUE, versLInterface: '--app-text' },
    { cle: 'muted', section: '4.1', statut: 'LU', obligatoire: true, format: OPAQUE, versLInterface: '--app-text-muted' },
    { cle: 'accent', section: '4.1', statut: 'LU', obligatoire: true, format: OPAQUE, versLInterface: '--app-accent' },
    { cle: 'accent-2', section: '4.1', statut: 'SDK', format: LIBRE },
    { cle: 'accent-contrast', section: '4.1', statut: 'V2', format: OPAQUE },
    {
        cle: 'border', section: '4.1', statut: 'LU', obligatoire: true,
        format: { type: 'couleur-ou-rgba', alphaMin: 0.08, alphaMax: 1 }, versLInterface: '--app-border',
    },
    { cle: 'border-soft', section: '4.1', statut: 'V2', format: { type: 'couleur-ou-rgba', alphaMin: 0.08, alphaMax: 1 } },
    { cle: 'paper', section: '4.1', statut: 'SDK', format: LIBRE },
    { cle: 'ink', section: '4.1', statut: 'SDK', format: LIBRE },

    // § 4.2 · Couleurs d'état
    { cle: 'success', section: '4.2', statut: 'V2', format: OPAQUE },
    { cle: 'danger', section: '4.2', statut: 'V2', format: OPAQUE },
    { cle: 'warning', section: '4.2', statut: 'V2', format: OPAQUE },
    { cle: 'info', section: '4.2', statut: 'V2', format: OPAQUE },

    // § 4.3 · Typographie
    { cle: 'font-display', section: '4.3', statut: 'LU', obligatoire: true, format: PILE, versLInterface: '--font-display' },
    { cle: 'font-mono', section: '4.3', statut: 'LU', format: PILE, versLInterface: '--font-mono' },
    { cle: 'font-body', section: '4.3', statut: 'V2', format: PILE },
    { cle: 'font-ui', section: '4.3', statut: 'SDK', format: PILE },
    { cle: 'title-tracking', section: '4.3', statut: 'V2', format: em(0.5) },
    { cle: 'kicker-tracking', section: '4.3', statut: 'V2', format: em(0.6) },
    { cle: 'title-transform', section: '4.3', statut: 'V2', format: { type: 'choix', valeurs: ['none', 'uppercase', 'small-caps'] } },

    // § 4.4 · Tailles du texte
    { cle: 'font-scale', section: '4.4', statut: 'LU', format: ECHELLE },
    { cle: 'scale-interface', section: '4.4', statut: 'LU', format: ECHELLE },
    { cle: 'scale-corps', section: '4.4', statut: 'LU', format: ECHELLE },
    { cle: 'scale-titres', section: '4.4', statut: 'LU', format: ECHELLE },
    { cle: 'scale-mono', section: '4.4', statut: 'LU', format: ECHELLE },

    // § 4.5 · Forme
    { cle: 'radius-sm', section: '4.5', statut: 'V2', format: px(12) },
    { cle: 'radius-md', section: '4.5', statut: 'V2', format: px(20) },
    { cle: 'radius-lg', section: '4.5', statut: 'V2', format: px(32) },
    { cle: 'border-width', section: '4.5', statut: 'V2', format: px(3) },
    { cle: 'border-style', section: '4.5', statut: 'V2', format: { type: 'choix', valeurs: ['solid', 'double'] } },

    // § 4.6 · Relief et lumière
    { cle: 'elevation-1', section: '4.6', statut: 'V2', format: OMBRE },
    { cle: 'elevation-2', section: '4.6', statut: 'V2', format: OMBRE },
    { cle: 'elevation-3', section: '4.6', statut: 'V2', format: OMBRE },
    { cle: 'shadow', section: '4.6', statut: 'V2', format: OMBRE },
    { cle: 'glow', section: '4.6', statut: 'V2', format: { type: 'halo' } },
    { cle: 'glow-strength', section: '4.6', statut: 'V2', format: { type: 'nombre', min: 0, max: 1 } },

    // § 4.7 · Transparence et verre
    { cle: 'glass-bg', section: '4.7', statut: 'V2', format: { type: 'rgba', alphaMin: 0.4, alphaMax: 0.95 } },
    { cle: 'glass-border', section: '4.7', statut: 'V2', format: { type: 'rgba', alphaMin: 0.05, alphaMax: 0.6 } },
    { cle: 'glass-blur', section: '4.7', statut: 'V2', format: px(24) },

    // § 7 · Matières
    { cle: 'texture-bg', section: '7', statut: 'V2', format: MATIERE },
    { cle: 'texture-panel', section: '7', statut: 'V2', format: MATIERE },
    { cle: 'texture-opacity', section: '7', statut: 'V2', format: { type: 'nombre', min: 0, max: 0.35 } },
];

/** Le jeton du contrat qui porte ce nom, ou `undefined` s'il n'est lu par personne. */
export function jetonDuContrat(cle: string): JetonDuContrat | undefined {
    return JETONS_DU_CONTRAT.find(j => j.cle === cle);
}

/**
 * **Les paires de contraste du § 6.**
 *
 * `minimum` refuse, `recommande` avertit. Le meneur lit son écran à un mètre,
 * dans une pièce tamisée : *des nombres, pas une impression.*
 *
 * ⛔ `text`, `muted` et `accent` se mesurent sur `bg` **et** sur `surface` : le
 * piège « page de livre » (§ 4.1) est justement de ne soigner que la page.
 */
export interface PaireDeContraste {
    avant: string;
    fond: string;
    minimum: number;
    recommande: number;
}

export const PAIRES_DU_CONTRAT: readonly PaireDeContraste[] = [
    { avant: 'text', fond: 'bg', minimum: 4.5, recommande: 7 },
    { avant: 'text', fond: 'surface', minimum: 4.5, recommande: 7 },
    { avant: 'muted', fond: 'bg', minimum: 3, recommande: 4.5 },
    { avant: 'muted', fond: 'surface', minimum: 3, recommande: 4.5 },
    { avant: 'accent', fond: 'bg', minimum: 3, recommande: 4.5 },
    { avant: 'accent-contrast', fond: 'accent', minimum: 4.5, recommande: 7 },
    { avant: 'success', fond: 'bg', minimum: 3, recommande: 4.5 },
    { avant: 'danger', fond: 'bg', minimum: 3, recommande: 4.5 },
    { avant: 'warning', fond: 'bg', minimum: 3, recommande: 4.5 },
    { avant: 'info', fond: 'bg', minimum: 3, recommande: 4.5 },
];

/**
 * Les hôtes autorisés pour les polices d'un thème (§ 3.6).
 *
 * Un fichier de thème est du code exécuté par l'interface : on n'y suit pas
 * n'importe quelle URL. La liste reste courte à dessein — l'ouvrir demandera
 * une décision, pas un oubli.
 */
export const HOTES_DE_POLICES: readonly string[] = ['fonts.googleapis.com', 'fonts.bunny.net'];

/** Les emplacements d'ornement du § 8 — la liste la plus difficile à changer du contrat. */
export const EMPLACEMENTS_D_ORNEMENT: readonly string[] = ['entete', 'coin', 'separateur', 'fond'];

/** Les tailles maximales des fichiers joints, en octets (§ 7, § 8). */
export const TAILLES_MAXIMALES = {
    ornement: 50 * 1024,
    matiereSvg: 200 * 1024,
    matiereImage: 500 * 1024,
} as const;
