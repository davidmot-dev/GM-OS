export type Camp = 'joueurs' | 'adverse';
export type Portee = 'contact' | 'courte' | 'moyenne' | 'longue' | 'extreme';
export type NomDuPoste = 'capitaine' | 'senseurs' | 'pilote' | 'artilleur' | 'ingenieur';
export type Competence = 'MACHINES LOURDES' | 'COMTECH';
export interface Poste { personnageId: string; nom: string; base: number; stress: number; talent: boolean; synthetique: boolean }
export interface ArmeDefinie { id: string; nom: string; sorte: 'offensive' | 'contremesure'; bonus: number; degats: number; portee: Portee; particules?: boolean; perceArmure?: boolean; munitions?: number }
export interface ArmeDuVaisseau { id: string; arme: string; munitions: number | null }
export interface Avarie { id: string; gravite: 'mineure' | 'majeure'; code: number; restants: Competence[]; etat: 'active' | 'temporaire'; armeId?: string }
export interface Vaisseau {
  id: string; nom: string; modele: string; camp: Camp; signature: number; propulseurs: number; coque: number; protection: number;
  degats: number; armes: ArmeDuVaisseau[]; transpondeur: boolean; ombilic: boolean; senseursCoupes: boolean; moteursCoupes: boolean;
  avaries: Avarie[]; horsService: boolean; detruit: boolean; postes: Record<NomDuPoste, Poste>;
}
export interface Ordre { action: string; cibleId?: string; armeId?: string; avarieId?: string; ampleur?: 1 | 2; competence?: Competence; coupe?: 'aucun' | 'senseurs' | 'moteurs' | 'les-deux' }
export interface LigneDuJournal { tour: number; phase: number; texte: string; prive: boolean }
export interface JetEnAttente { vaisseauId: string; poste: NomDuPoste; ordre: Ordre; jet: { base: number[]; stress: number[] }; modificateur: number; force: boolean; peutForcer: boolean }
export interface Combat {
  tour: number; phase: 1 | 2 | 3 | 4; etape: 'ordres' | 'resolution'; engages: string[]; distance: number; distanceDebutTour: number; croise: boolean;
  velocites: Record<Camp, number>; initiative: Record<string, number>; ordres: Record<string, Ordre>; resolus: string[];
  verrous: Record<string, string[]>; dejaVerrouilles: Record<string, string[]>; faireLeMort: Record<string, number>; evasion: Record<string, number>;
  rallumeSenseurs: Record<string, true>; rallumeMoteurs: Record<string, true>; rallumage: Record<string, { tour: number; n: number }>;
  amarres: [string, string][]; sas: [string, string][]; surcharges: Record<string, number>; actionsPerdues: Record<string, true>;
  enAttente: JetEnAttente | null; journal: LigneDuJournal[];
}
/** v2 : les vaisseaux et leurs équipages sous un nom ; la remise à zéro les garde. */
export interface PrereglageCombatSpatial { id: string; nom: string; vaisseaux: Vaisseau[] }
export interface EtatCombatSpatial { version: 2; system: 'alien'; revision: number; vaisseaux: Vaisseau[]; combat: Combat | null; prereglages: PrereglageCombatSpatial[] }

export interface AvarieVue extends Avarie { nom: string; texte: string; reparation: Competence[]; effet?: string; armeNom?: string }
export interface ArmeVue extends ArmeDuVaisseau, Omit<ArmeDefinie, 'id' | 'munitions'> {}
export interface VaisseauVu extends Omit<Vaisseau, 'avaries' | 'armes'> { signatureEffective: number; propulseursEffectifs: number; avaries: AvarieVue[]; armes: ArmeVue[] }
export interface ContactVu { id: string; camp: 'adverse'; nom: string; modele: string; identifie: boolean; horsService: boolean; detruit: boolean }
export interface CombatVu extends Partial<Combat> { tour: number; phase: 1 | 2 | 3 | 4; etape: 'ordres' | 'resolution'; engages: string[]; distance: number; croise: boolean;
  velocites: Record<Camp, number>; initiative: Record<string, number>; ordres: Record<string, Ordre>; resolus: string[]; journal: LigneDuJournal[];
  enAttente: JetEnAttente | null; portee: Portee | null; ordreDInitiative: string[]; prochain: string | null }
export interface VueCombatSpatial { version: 2; system: 'alien'; revision: number; vaisseaux: (VaisseauVu | ContactVu)[]; combat: CombatVu | null;
  /** Au meneur : le nom des préréglages. */ prereglages?: { id: string; nom: string }[];
  /** Au meneur : les personnages de la séance. */ personnages?: { id: string; nom: string }[];
  /** Au joueur : son personnage. */ moi?: string }

export type CommandeCombatSpatial =
  | { id: 'vaisseau'; charge: { vaisseauId?: string; nom: string; modele: string; camp: Camp; signature: number; propulseurs: number; coque: number; protection: number; armes: string[]; transpondeur: boolean; ombilic: boolean } }
  | { id: 'supprimer-vaisseau'; charge: { vaisseauId: string } }
  | { id: 'poste'; charge: { vaisseauId: string; poste: NomDuPoste } & Poste }
  | { id: 'etat-vaisseau'; charge: { vaisseauId: string; degats?: number; transpondeur?: boolean; senseursCoupes?: boolean; moteursCoupes?: boolean; retirerAvarie?: string; armeId?: string; munitions?: number } }
  | { id: 'demarrer-combat'; charge: { vaisseaux: string[]; distance: number; velociteJoueurs: number; velociteAdverse: number } }
  | { id: 'reveler' | 'phase-suivante' | 'terminer-combat' | 'forcer' | 'valider' | 'reinitialiser'; charge: Record<string, never> }
  | { id: 'enregistrer-prereglage'; charge: { prereglageId: string; nom: string } }
  | { id: 'rappeler-prereglage' | 'supprimer-prereglage'; charge: { prereglageId: string } }
  | { id: 'relancer-avarie'; charge: { vaisseauId: string; avarieId: string } }
  | { id: 'ordonner'; charge: { vaisseauId: string } & Ordre }
  | { id: 'mes-des'; charge: { vaisseauId: string; poste: NomDuPoste; base: number; stress: number } }
  | { id: 'resoudre'; charge: { vaisseauId: string } };
export type LecteurCombatSpatial = { role: 'mj' | 'joueur'; personnageId?: string };

export function creerEtat(): EtatCombatSpatial;
export function validerEtat(etat: unknown, version?: number): asserts etat is EtatCombatSpatial;
export function migrerEtat(donnees: unknown, version: number): EtatCombatSpatial;
export function arreterEffets(etat: EtatCombatSpatial): EtatCombatSpatial;
export function appliquerCommande(etat: EtatCombatSpatial, commande: CommandeCombatSpatial, lecteur: LecteurCombatSpatial): EtatCombatSpatial;
export function vuePour(etat: EtatCombatSpatial, lecteur: LecteurCombatSpatial, contexte?: { personnages: { id: string; nom: string }[] }): VueCombatSpatial;
export function composerLaReserve(base: number, stress: number, modificateur: number): { base: number; stress: number };
export function signatureEffective(v: Vaisseau): number;
export function propulseursEffectifs(v: Vaisseau): number;
export function ordreDInitiative(etat: EtatCombatSpatial): string[];
export function prochainAResoudre(etat: EtatCombatSpatial): string | null;
export function porteeDuCombat(c: Combat): Portee | null;
