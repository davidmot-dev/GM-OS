import type { ReactElement } from 'react';
import type { VueDetecteur, CommandeDetecteur } from './moteur.mjs';
export interface PropsDetecteur {
  vue: VueDetecteur;
  envoyerCommande: (commande: CommandeDetecteur) => Promise<{ ok: true } | { ok: false; erreur?: string }>;
}
/** `horloge` : heure de table reçue par l'hôte ; sans elle, l'heure de l'appareil. */
export function VueJoueur(props: PropsDetecteur & { horloge?: () => number }): ReactElement;
export function PupitreMJ(props: PropsDetecteur): ReactElement;
