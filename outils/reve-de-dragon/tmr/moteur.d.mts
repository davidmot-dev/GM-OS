export interface DemandeTMR { operationId: string; etape: number; action: 'monter' | 'avancer' | 'rester' | 'descendre'; cible: string; rythme: 'normal' | 'accelere' }
export interface NoteTMR { id: string; type: 'reserve' | 'queue' | 'souffle'; nom: string; caseId: string | null; texte: string }
export interface EcritureTMR { id: string; demande: DemandeTMR; empreinte: string; compteRendu: string; interrompue: boolean }
export interface VoyageurTMR { id: string; nom: string; position: string | null; present: boolean; rythme: 'normal' | 'accelere'; etape: number; demande: DemandeTMR | null; preparation: string; rencontre: string; notes: NoteTMR[]; journal: {operationId: string; etape: number; texte: string}[]; ecriture: EcritureTMR | null }
export interface EtatTMR { version: 2; voyageurs: VoyageurTMR[] }
export interface LecteurTMR { role: 'mj' | 'joueur'; personnageId?: string }
export interface ContexteTMR { personnages: {id: string; nom: string}[] }
export interface VueTMRMJ { role: 'mj'; voyageurs: VoyageurTMR[]; personnages: ContexteTMR['personnages'] }
export interface VueTMRJoueur { role: 'joueur'; voyageur: Omit<VoyageurTMR, 'preparation' | 'ecriture'> & {ecritureEnCours: boolean} }
export function creerEtat(): EtatTMR;
export function validerEtat(e: unknown): asserts e is EtatTMR;
export function migrerEtat(e: unknown, version: number): EtatTMR;
export function preparerContexte(e: unknown, personnages: ContexteTMR['personnages']): EtatTMR;
export function preparerLecteur(e: unknown, id: string, nom: string): EtatTMR;
export function arreterEffets(e: unknown): EtatTMR;
export function vuePour(e: unknown, lecteur: LecteurTMR, contexte?: ContexteTMR): VueTMRMJ | VueTMRJoueur;
export function appliquerCommande(e: unknown, commande: {id: string; charge: unknown}, lecteur: LecteurTMR, contexte?: ContexteTMR): EtatTMR;
export function consequences(d: DemandeTMR): {reve: number; fatigue: number; rencontre: boolean; humide: boolean};
export function terminerEcriture(e: unknown, personnageId: string, transactionId: string, appliquee: boolean, sortieForcee: boolean, detail: string): EtatTMR;
