import type { TonDeJauge } from './Jauge';

/** Le ton d'une jauge, indépendant du composant et de son rafraîchissement. */
export function tonAutomatique(fraction: number): Exclude<TonDeJauge, 'auto'> {
    if (fraction < 0.25) return 'danger';
    if (fraction < 0.5) return 'alerte';
    return 'succes';
}
