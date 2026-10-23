export interface EtatDetecteur {
  version: 4; system: 'alien'; revision: number;
  discret: DiscretAlien;
  /** Depuis la v4, `config` et `discret` gardent toute la préparation ; les anciens n'ont que `reglages`. */
  prereglages: { id: string; nom: string; reglages: Pick<EtatDetecteur['tracker'], 'intensity' | 'volume' | 'contacts' | 'proximity' | 'noise'>; config?: EtatDetecteur['config']; discret?: DiscretAlien }[];
  config: { crt: boolean; glitches: boolean };
  tracker: { power: boolean; intensity: number; volume: number; contacts: number; proximity: number; noise: number; target: 'all'; seed: number; anomalyUntil: number; positions?: {x:number;y:number}[] };
}
export interface ZoneDiscrete { id:string; nom:string; x:number; y:number; liens:string[] }
export interface PionDiscret { id:string; nom:string; zoneId:string; humain:boolean; limite:number; depense:number; mobile:boolean; detectable:boolean }
export interface EchoDiscret { zone:string; nombre:number; x:number; y:number }
export interface DiscretAlien { actif:boolean; tour:number; terrain:'interieur'|'exterieur'; energie:number; zones:ZoneDiscrete[]; pions:PionDiscret[]; porteurId:string; dernierScan:null|{tour:number;avant:number;apres:number;des:number[];echos:EchoDiscret[]} }
export type ContexteDetecteur = { role: 'mj' | 'joueur'; personnageId?: string; appareilId?: string };
export type CommandeDetecteur =
  | { id: 'mode-discret'; charge: {actif:boolean} }
  | { id: 'regler-discret'; charge: Pick<DiscretAlien,'terrain'|'energie'|'porteurId'> }
  | { id: 'zone-discrete'; charge: ZoneDiscrete }
  | { id: 'pion-discret'; charge: Omit<PionDiscret,'depense'> }
  | { id: 'deplacer-discret'; charge: {pionId:string;zoneId:string;tour:number} }
  | { id: 'examiner-discret'; charge: {pionId:string;tour:number} }
  | { id: 'tour-discret'|'scanner-discret'; charge: {tour:number} }
  | { id: 'configurer'; charge: { intensite?: number; volume?: number; contacts?: number; proximite?: number; parasites?: number; crt?: boolean; effetsParasites?: boolean } }
  | { id: 'enregistrer-prereglage'; charge: { prereglageId: string; nom: string } }
  | { id: 'rappeler-prereglage' | 'supprimer-prereglage'; charge: { prereglageId: string } }
  | { id: 'scanner'; charge: { actif: boolean } }
  | { id: 'faux-echo' | 'reinitialiser'; charge: Record<string, never> };
export function creerEtat(): EtatDetecteur;
export function validerEtat(etat: unknown): asserts etat is EtatDetecteur;
export function migrerEtat(donnees: unknown, versionDonnees: number): EtatDetecteur;
export function arreterEffets(etat: EtatDetecteur): EtatDetecteur;
export type VueDetecteur = Omit<EtatDetecteur, 'prereglages'|'discret'> & { prereglages?: EtatDetecteur['prereglages']; discret?: DiscretAlien; lectureDiscrete?: {tour:number;energie:number;scanneTour:number|null;echos:EchoDiscret[]} };
export function vuePour(etat: EtatDetecteur, lecteur: ContexteDetecteur): VueDetecteur;
export function appliquerCommande(etat: EtatDetecteur, commande: CommandeDetecteur, contexte: ContexteDetecteur): EtatDetecteur;
