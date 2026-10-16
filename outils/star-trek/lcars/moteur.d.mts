export type PosteLcars = 'commandement' | 'science' | 'ingenierie' | 'communications' | 'navigation' | 'tactique' | 'medecine';
export interface MediaLcars { type: 'image' | 'audio' | 'video'; nom: string; source: string }
export interface OfficierLcars { id: string; nom: string; postes: PosteLcars[]; affectation: number; scan: null | { id: string; poste: PosteLcars; at: number; duree: number } }
export interface CibleLcars { id: string; poste: PosteLcars; libelle: string; description: string; etat: string; rapportPrepare: string; visible: boolean }
export interface DemandeLcars { id: string; personnageId: string; affectation: number; poste: PosteLcars; cibleId: string; cibleLibelle: string; action: string; question: string; statut: string; at: number; rapport: string; resolutionAt: number | null; partageAutorise: boolean; media: MediaLcars | null }
export interface PublicationLcars { id: string; titre: string; texte: string; destinataires: string[]; sourceId: string | null; auteur: string; at: number; media: MediaLcars | null }
export interface OrdreLcars { id: string; auteurId: string; auteur: string; destinataires: string[]; texte: string; at: number; accuses: { personnageId: string; nom: string; at: number }[] }
export interface PrereglageLcars { id: string; nom: string; situation: string; niveau: string; texte: string; cibles: { id: string; poste: PosteLcars; etat: string; visible: boolean }[] }
export interface EtatLcars { version: 2; revision: number; vaisseau: { nom: string; immatriculation: string }; situation: string; alerte: { niveau: 'normal' | 'jaune' | 'rouge'; texte: string; fin: number | null; sequence: number }; effetsActifs: boolean; diffusionSonore: string | null; officiers: OfficierLcars[]; cibles: CibleLcars[]; demandes: DemandeLcars[]; publications: PublicationLcars[]; ordres: OrdreLcars[]; prereglages: PrereglageLcars[] }
export interface ContexteLcars { role: 'mj' | 'joueur'; personnageId?: string; appareilId?: string }
export interface CommandeLcars { id: string; charge: unknown }
export interface IntegrationLcars { origine: 'gmos'; medias: boolean; son: boolean; ressources?: { jeton: string; port: number; base?: string } }
export interface VueLcarsMJ extends EtatLcars { role: 'mj'; diffusionAutorisee: boolean; integration?: IntegrationLcars; personnages?: { id: string; nom: string }[] }
export interface VueLcarsJoueur { role: 'joueur'; revision: number; vaisseau: EtatLcars['vaisseau']; situation: string; alerte: EtatLcars['alerte']; effetsActifs: boolean; diffusionAutorisee: boolean; integration?: IntegrationLcars; officier: OfficierLcars; cibles: Omit<CibleLcars, 'rapportPrepare' | 'visible'>[]; demandes: DemandeLcars[]; publications: PublicationLcars[]; ordres: OrdreLcars[] }
export function creerEtat(): EtatLcars;
export function validerEtat(v: unknown): asserts v is EtatLcars;
export function validerMedia(v: unknown): asserts v is MediaLcars | null;
export function migrerEtat(v: unknown, version: number): EtatLcars;
export function arreterEffets(v: EtatLcars): EtatLcars;
export function appliquerCommande(v: EtatLcars, commande: CommandeLcars, contexte: ContexteLcars): EtatLcars;
export function vuePour(v: EtatLcars, lecteur: ContexteLcars & { role: 'mj' }): VueLcarsMJ;
export function vuePour(v: EtatLcars, lecteur: ContexteLcars): VueLcarsMJ | VueLcarsJoueur;
