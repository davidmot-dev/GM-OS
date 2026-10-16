import type { ReactElement } from 'react';
import type { CommandeLcars, VueLcarsMJ, VueLcarsJoueur } from './moteur.mjs';
interface Commandes { envoyerCommande: (commande: CommandeLcars) => Promise<{ ok: true } | { ok: false; erreur: string }>; horloge?: () => number }
export function VueJoueur(props: Commandes & { vue: VueLcarsJoueur }): ReactElement;
export function PupitreMJ(props: Commandes & { vue: VueLcarsMJ }): ReactElement;
