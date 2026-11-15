import type { ReactElement } from 'react';
import type { VueDetecteur, CommandeDetecteur } from './moteur.mjs';
export interface PropsDetecteur {
  vue: VueDetecteur;
  envoyerCommande: (commande: CommandeDetecteur) => Promise<{ ok: true } | { ok: false; erreur?: string }>;
}
/** `horloge` : heure de table reçue par l'hôte ; sans elle, l'heure de l'appareil. */
export function VueJoueur(props: PropsDetecteur & { horloge?: () => number }): ReactElement;
export function PupitreMJ(props: PropsDetecteur): ReactElement;
/** Cadence des bips en ms : intensité hors mode discret, distance de l'écho le plus proche en mode discret. */
export function cadenceDesBips(tracker: { intensity: number; positions?: { x: number; y: number }[] }): number;
/** Gain d'un bip au volume 100. */
export const GAIN_MAX_DU_BIP: number;
