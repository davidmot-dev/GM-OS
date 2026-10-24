export type Systeme = 'communications' | 'ordinateurs' | 'moteurs' | 'detecteurs' | 'structure' | 'armement';
export type Fonction = 'commandement' | 'navigation' | 'ingenierie' | 'securite' | 'medecine' | 'science';
export type QualiteDEquipage = 'moyen' | 'competent' | 'talentueux' | 'exceptionnel';
export type Secousse = 'securite' | 'energie' | 'victimes';
export interface ArmeDeVaisseau { id: string; nom: string; type: 'energie' | 'torpille'; degats: number; portee: 'courte' | 'moyenne' | 'longue'; qualites: string[] }
export interface Breche { id: string; systeme: Systeme; intensite: number; colmatee: boolean }
export interface Vaisseau {
  id: string; nom: string; camp: 'joueurs' | 'adverse'; envergure: number;
  systemes: Record<Systeme, number>; fonctions: Record<Fonction, number>;
  bonusResistance: number; bonusBoucliers: number; qualiteEquipage: QualiteDEquipage | null;
  boucliers: number; bouclierLeves: boolean; armementEngage: boolean; energie: boolean; secoue: Secousse | null;
  armes: ArmeDeVaisseau[]; breches: Breche[]; detruit: boolean; noyau: null | 'instable' | 'stabilise' | 'ejecte';
}
export interface VaisseauVu extends Vaisseau { resistance: number; bouclierMax: number; critiques: boolean; detruits: Systeme[]; degatsDesArmes: Record<string, number> }
export interface VaisseauLointain { id: string; nom: string; camp: 'adverse'; envergure: number; detruit: boolean; secoue: boolean; bouclierPourcent: number; breches: number }
export interface TacheEtendue { id: string; nom: string; genre: 'etendue' | 'consequence'; jauge: number; coches: number; difficulte: number; obstacle: number; impact: number; avancees: number[]; visible: boolean }
export interface Defi { id: string; nom: string; taches: { id: string; nom: string; faite: boolean }[]; intervalles: null | { total: number; restants: number }; visible: boolean }
export interface EtatOperations { version: 1; system: 'star-trek'; revision: number; vaisseaux: Vaisseau[]; taches: TacheEtendue[]; defis: Defi[]; journal: string[] }
export interface VueOperations { version: 1; system: 'star-trek'; revision: number; vaisseaux: (VaisseauVu | VaisseauLointain)[]; taches: TacheEtendue[]; defis: Defi[]; journal: string[] }
export type LecteurOperations = { role: 'mj' | 'joueur'; personnageId?: string; appareilId?: string };
export type CommandeOperations =
  | { id: 'vaisseau'; charge: { vaisseau: Partial<Vaisseau> & Pick<Vaisseau, 'id' | 'nom' | 'camp' | 'envergure' | 'systemes' | 'fonctions' | 'bonusResistance' | 'bonusBoucliers' | 'qualiteEquipage' | 'armes'> } }
  | { id: 'supprimer-vaisseau'; charge: { vaisseauId: string } }
  | { id: 'etat-vaisseau'; charge: { vaisseauId: string; bouclierLeves?: boolean; armementEngage?: boolean; energie?: boolean; boucliers?: number; secoue?: Secousse | null; noyau?: Vaisseau['noyau']; detruit?: boolean } }
  | { id: 'attaque'; charge: { cibleId: string; degats: number; attaquantId?: string; armeId?: string; plus?: number; complications?: number; systeme?: Systeme; devastatrice?: boolean; perforant?: boolean; rendementEleve?: boolean; drainant?: boolean; des?: number[] } }
  | { id: 'recharger-boucliers'; charge: { vaisseauId: string; ingenierie: number; impulsion?: number } }
  | { id: 'colmater' | 'reparer'; charge: { vaisseauId: string; brecheId: string } }
  | { id: 'noyau'; charge: { vaisseauId: string; des?: number[] } }
  | { id: 'nouvelle-scene' | 'reinitialiser'; charge: Record<string, never> }
  | { id: 'tache'; charge: { tache: Partial<TacheEtendue> & Pick<TacheEtendue, 'id' | 'nom' | 'genre' | 'jauge'> } }
  | { id: 'supprimer-tache'; charge: { tacheId: string } }
  | { id: 'impact'; charge: { tacheId: string; fonction?: number; efforts?: number; complications?: number; bonus?: number; menace?: number; nom?: string } }
  | { id: 'defi'; charge: { defi: Partial<Defi> & Pick<Defi, 'id' | 'nom'> } }
  | { id: 'supprimer-defi'; charge: { defiId: string } }
  | { id: 'defi-tache'; charge: { defiId: string; tacheId: string; faite: boolean } }
  | { id: 'intervalles'; charge: { defiId: string; consommes: number } };
export const SYSTEMES: Systeme[];
export const FONCTIONS: Fonction[];
export const LIBELLES_DES_SYSTEMES: Record<Systeme, string>;
export const LIBELLES_DES_FONCTIONS: Record<Fonction, string>;
export const QUALITES: string[];
export const QUALITES_D_EQUIPAGE: Record<QualiteDEquipage, { label: string; attribut: number; fonction: number }>;
export const SECOUSSES: Record<Secousse, string>;
export function bonusDeLEchelle(valeur: number): number;
export function resistanceDe(v: Vaisseau): number;
export function bouclierMaxDe(v: Vaisseau): number;
export function degatsDeLArme(v: Vaisseau, a: ArmeDeVaisseau): number;
export function brechesDu(v: Vaisseau, systeme: Systeme): number;
export function brechesTotales(v: Vaisseau): number;
export function systemeDetruit(v: Vaisseau, systeme: Systeme): boolean;
export function degatsCritiques(v: Vaisseau): boolean;
export function systemeTouche(de: number): Systeme;
export function secousseDuDe(de: number): Secousse | null;
export function impactDe(t: TacheEtendue, c: { fonction?: number; efforts?: number; complications?: number; bonus?: number; menace?: number }): number;
export function avanceesParDefaut(jauge: number): number[];
export function creerEtat(): EtatOperations;
export function validerEtat(etat: unknown): asserts etat is EtatOperations;
export function migrerEtat(donnees: unknown, versionDonnees: number): EtatOperations;
export function arreterEffets(etat: EtatOperations): EtatOperations;
export function appliquerCommande(etat: EtatOperations, commande: CommandeOperations, lecteur: LecteurOperations): EtatOperations;
export function vuePour(etat: EtatOperations, lecteur: LecteurOperations): VueOperations;
