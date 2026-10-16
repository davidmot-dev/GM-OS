import type { ReactElement } from 'react';
import type { VueDetecteur, CommandeDetecteur } from './moteur.mjs';
export interface PropsDetecteur {
  vue: VueDetecteur;
  envoyerCommande: (commande: CommandeDetecteur) => Promise<{ ok: true } | { ok: false; erreur?: string }>;
}
export function VueJoueur(props: PropsDetecteur): ReactElement;
export function PupitreMJ(props: PropsDetecteur): ReactElement;
