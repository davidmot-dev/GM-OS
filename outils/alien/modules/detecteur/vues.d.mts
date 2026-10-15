import type { ReactElement } from 'react';
import type { EtatDetecteur, CommandeDetecteur } from './moteur.mjs';
export interface PropsDetecteur {
  vue: EtatDetecteur;
  envoyerCommande: (commande: CommandeDetecteur) => Promise<{ ok: true } | { ok: false; erreur?: string }>;
}
export function VueJoueur(props: PropsDetecteur): ReactElement;
export function PupitreMJ(props: PropsDetecteur): ReactElement;
