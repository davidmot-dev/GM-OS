/**
 * **Le socle de l'interface** — refonte, phase 3, 2026-09-30.
 *
 * Les seuls composants qui connaissent la forme, le relief, la matière et les
 * ornements — et qui les lisent dans le thème. Plan :
 * `documentation/Planning/2026-09-30-refonte-phase-3.md`.
 */
export { Ornement, CoinsOrnes, type Angle } from './Ornement';
export { Panneau, type NiveauDePanneau, type PanneauProps } from './Panneau';
export { Bouton, type VarianteDeBouton, type BoutonProps } from './Bouton';
export { Tuile, type TuileProps } from './Tuile';
export { Jauge, tonAutomatique, type TonDeJauge, type JaugeProps } from './Jauge';
export { Etiquette, type TonDEtiquette, type EtiquetteProps } from './Etiquette';
export { EnTeteDeModule, type EnTeteDeModuleProps } from './EnTeteDeModule';
export { GabaritDeModule, Separateur, type GabaritDeModuleProps } from './GabaritDeModule';
