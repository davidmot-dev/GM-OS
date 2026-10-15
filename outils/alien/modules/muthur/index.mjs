/** À enregistrer explicitement dans le futur hôte ; ce fichier ne lance aucun service. */
import manifeste from './manifeste.json' with { type: 'json' };
import * as moteur from './moteur.mjs';
import { VueJoueur, PupitreMJ } from './vues.mjs';

export { manifeste, moteur, VueJoueur, PupitreMJ };
export { videoAlerteUrl } from './medias.mjs';
export const feuilleDeStyle = new URL('./style.css', import.meta.url).href;
