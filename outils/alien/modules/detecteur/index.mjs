/** Entrée de référence ; ne lance aucun service. */
import manifeste from './manifeste.json' with { type: 'json' };
import * as moteur from './moteur.mjs';
export { manifeste, moteur };
export { VueJoueur, PupitreMJ } from './vues.mjs';
export const feuilleDeStyle = new URL('./style.css', import.meta.url).href;
