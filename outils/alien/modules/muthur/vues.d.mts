import type { ReactElement } from 'react';
import type { CommandeMuthur, VueMuthurMJ, VueMuthurJoueur } from './moteur.mjs';

export type ResultatCommandeMuthur = { ok: true } | { ok: false; erreur: string };
export type EnvoyerCommandeMuthur = (commande: CommandeMuthur) => Promise<ResultatCommandeMuthur>;
export function VueJoueur(props: { vue: VueMuthurJoueur; envoyerCommande: EnvoyerCommandeMuthur }): ReactElement;
export function PupitreMJ(props: { vue: VueMuthurMJ; envoyerCommande: EnvoyerCommandeMuthur }): ReactElement;
