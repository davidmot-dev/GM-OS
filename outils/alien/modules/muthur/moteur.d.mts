export interface MessageMuthur {
  id: string;
  kind: 'input' | 'system' | 'success' | 'error' | 'mother';
  content: string;
  at: number;
}
export interface OperateurMuthur {
  id: string;
  name: string;
  access: 'crew' | 'code' | 'admin';
  unlocked: string[];
  messages: MessageMuthur[];
  request: { id: string; type: 'hack' | 'message'; at: number } | null;
  cue: { id: string; type: 'hack'; success: boolean; at: number; duration: number } | null;
}
export interface DossierMuthur {
  id: string;
  title: string;
  access: 'crew' | 'code' | 'admin';
  code: string;
  body: string;
}
export interface ProtocoleMuthur {
  id: string; nom: string; code: string; message: string;
  effet: 'message' | 'ouvrir-portes' | 'fermer-portes' | 'autodestruction' | 'annuler-autodestruction';
  minutes: number; actif: boolean; portee: 'operateur' | 'equipage';
}
export interface EtatMuthur {
  version: 2;
  system: 'alien';
  revision: number;
  config: { vessel: string; status: string; adminPassword: string; crt: boolean; glitches: boolean };
  documents: DossierMuthur[];
  players: Record<string, OperateurMuthur>;
  countdown: { endAt: number } | null;
  protocoles: ProtocoleMuthur[];
  portes: 'inconnues' | 'ouvertes' | 'fermees';
  autodestruction: { id: string; startedAt: number; message: string } | null;
  diffusionAlarme: string | null;
}
export type VueMuthurMJ = EtatMuthur & { diffusionAutorisee: boolean };
export interface VueMuthurJoueur {
  version: 2;
  system: 'alien';
  revision: number;
  config: Pick<EtatMuthur['config'], 'vessel' | 'crt' | 'glitches'>;
  documents: Omit<DossierMuthur, 'code'>[];
  player: OperateurMuthur;
  countdown: { endAt: number } | null;
  portes: EtatMuthur['portes'];
  autodestruction: EtatMuthur['autodestruction'];
  diffusionAutorisee: boolean;
}
export type ContexteMuthur = ({ role: 'mj'; personnageId?: string } | { role: 'joueur'; personnageId: string }) & { appareilId?: string };
export type CommandeMuthur =
  | { id: 'saisir'; charge: { texte: string; personnageId?: string } }
  | { id: 'choisir-diffusion'; charge: { actif: boolean } }
  | { id: 'enregistrer-protocole'; charge: { protocole: ProtocoleMuthur } }
  | { id: 'supprimer-protocole'; charge: { protocoleId: string } }
  | { id: 'preparer-operateur'; charge: { personnageId: string; nom: string } }
  | { id: 'configurer'; charge: { vaisseau?: string; statut?: string; motDePasse?: string; crt?: boolean; parasites?: boolean } }
  | { id: 'creer-dossier'; charge: { dossierId: string; titre: string; contenu: string; acces: 'equipage' | 'code' | 'administrateur'; code: string } }
  | { id: 'modifier-dossier'; charge: { dossierId: string; titre?: string; contenu?: string; acces?: 'equipage' | 'code' | 'administrateur'; code?: string } }
  | { id: 'repondre'; charge: { personnageId: string; texte: string } }
  | { id: 'arbitrer-piratage'; charge: { personnageId: string; reussite: boolean } }
  | { id: 'revoquer'; charge: { personnageId: string } }
  | { id: 'compte-a-rebours'; charge: { minutes: number | null } }
  | { id: 'reinitialiser'; charge: Record<string, never> };
export function creerEtat(): EtatMuthur;
export function validerEtat(etat: unknown): asserts etat is EtatMuthur;
export function migrerEtat(donnees: unknown, versionDonnees: number): EtatMuthur;
export function appliquerCommande(etat: EtatMuthur, commande: CommandeMuthur, contexte: ContexteMuthur): EtatMuthur;
export function vuePour(etat: EtatMuthur, lecteur: { role: 'mj'; appareilId?: string }): VueMuthurMJ;
export function vuePour(etat: EtatMuthur, lecteur: { role: 'joueur'; personnageId: string; appareilId?: string }): VueMuthurJoueur;
export function vuePour(etat: EtatMuthur, lecteur: ContexteMuthur): VueMuthurMJ | VueMuthurJoueur;
export function arreterEffets(etat: EtatMuthur): EtatMuthur;
