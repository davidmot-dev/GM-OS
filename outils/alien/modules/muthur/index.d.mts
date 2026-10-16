export { VueJoueur, PupitreMJ } from './vues.mjs';
export * as moteur from './moteur.mjs';
export const feuilleDeStyle: string;
export const videoAlerteUrl: string;
export const manifeste: {
  versionContrat: 1;
  id: 'alien-muthur';
  libelle: string;
  description: string;
  version: string;
  versionDonnees: 3;
  corpusCompatibles: string[];
  commandes: Array<{ id: string; roles: Array<'mj' | 'joueur'> }>;
};
