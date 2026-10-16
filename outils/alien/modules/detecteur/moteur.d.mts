export interface EtatDetecteur {
  version: 2; system: 'alien'; revision: number;
  prereglages: { id: string; nom: string; reglages: Pick<EtatDetecteur['tracker'], 'intensity' | 'volume' | 'contacts' | 'proximity' | 'noise'> }[];
  config: { crt: boolean; glitches: boolean };
  tracker: { power: boolean; intensity: number; volume: number; contacts: number; proximity: number; noise: number; target: 'all'; seed: number; anomalyUntil: number };
}
export type ContexteDetecteur = { role: 'mj' | 'joueur'; personnageId?: string; appareilId?: string };
export type CommandeDetecteur =
  | { id: 'configurer'; charge: { intensite?: number; volume?: number; contacts?: number; proximite?: number; parasites?: number; crt?: boolean; effetsParasites?: boolean } }
  | { id: 'enregistrer-prereglage'; charge: { prereglageId: string; nom: string } }
  | { id: 'rappeler-prereglage' | 'supprimer-prereglage'; charge: { prereglageId: string } }
  | { id: 'scanner'; charge: { actif: boolean } }
  | { id: 'faux-echo'; charge: Record<string, never> };
export function creerEtat(): EtatDetecteur;
export function validerEtat(etat: unknown): asserts etat is EtatDetecteur;
export function migrerEtat(donnees: unknown, versionDonnees: number): EtatDetecteur;
export function arreterEffets(etat: EtatDetecteur): EtatDetecteur;
export type VueDetecteur = Omit<EtatDetecteur, 'prereglages'> & { prereglages?: EtatDetecteur['prereglages'] };
export function vuePour(etat: EtatDetecteur, lecteur: ContexteDetecteur): VueDetecteur;
export function appliquerCommande(etat: EtatDetecteur, commande: CommandeDetecteur, contexte: ContexteDetecteur): EtatDetecteur;
