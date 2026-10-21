import type { RollResult } from '../DiceEngine';
import type { RegleDeCombatAlien } from './combatAlien';
import { armeAvecProprietes } from './combatAlien';

/** Livre français p. 62–71. Les champs viennent du pilote, jamais d'un nom de jeu. */
export interface RegleDesJetsAlien {
    combat?: RegleDeCombatAlien;
    competence: string;
    competences: Record<string, CompetenceAlien>;
    equipement: { noms: string; bonus: string; degats: string; portees: string };
}
export type CompetenceAlien = 'machines' | 'endurance' | 'rapproche' | 'mobilite' | 'distance' | 'pilotage' | 'observation' | 'comtech' | 'survie' | 'commandement' | 'manipulation' | 'soins';
export type RoleAlien = 'simple' | 'attaquant' | 'defenseur';
export interface ReglagesDuJetAlien { equipement: string; outil: number; situation: number; aide: number; role: RoleAlien;
    viser?: boolean; automatique?: boolean; portee?: number; taille?: number; lumiere?: number; sansDefense?: boolean }
export const REGLAGES_ALIEN: ReglagesDuJetAlien = { equipement: '', outil: 0, situation: 0, aide: 0, role: 'simple' };
export const CLE_JET_ALIEN = '_gmos_jet_alien';
export interface EquipementAlien { id: string; nom: string; bonus: number; degats?: number; portee: string; erreur?: string;
    proprietes?: ReturnType<typeof armeAvecProprietes> }
const entier = (v: unknown) => Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0;
export function equipementsAlien(regle: RegleDesJetsAlien, fiche: Record<string, unknown>): EquipementAlien[] {
    const lignes = (champ: string) => String(fiche[champ] ?? '').split(/\r?\n/);
    const noms = lignes(regle.equipement.noms), bonus = lignes(regle.equipement.bonus), degats = lignes(regle.equipement.degats), portees = lignes(regle.equipement.portees);
    return noms.flatMap((nom, i) => !nom.trim() ? [] : [{ id: String(i), nom: nom.trim(), bonus: entier(bonus[i]),
        degats: degats[i]?.trim() && /^\d+$/.test(degats[i].trim()) ? Number(degats[i]) : undefined,
        portee: portees[i]?.trim() ?? '',
        proprietes: regle.combat ? armeAvecProprietes(lignes(regle.combat.proprietesArmes)[i] ?? '') : undefined,
        erreur: bonus[i]?.trim() && !/^[+-]?\d+$/.test(bonus[i].trim()) ? `Bonus de ${nom.trim()} : saisir un entier signé sur la ligne ${i + 1}.` : undefined }]);
}
export function composerLesDesAlien(base: number, stress: number, reglages: ReglagesDuJetAlien, bonus = 0, tremblement = 0) {
    const aide = Math.min(3, Math.max(0, entier(reglages.aide)));
    const modification = entier(bonus) + entier(reglages.outil) + entier(reglages.situation) + aide + tremblement;
    const modifie = Math.max(0, entier(base)) + modification;
    return { base: Math.max(0, modifie), stress: Math.max(0, entier(stress) + Math.min(0, modifie)), modification, aide };
}
export interface EclatAlien { id: string; label: string; rappel: string; repetable?: boolean }
const E = (id: string, label: string, rappel: string, repetable = false): EclatAlien => ({ id, label, rappel, repetable });
const bonus = E('bonus', 'Préparer le prochain test', '+1 dé à un test ultérieur lié ; à reporter lors de ce test.');
const dispense = E('dispense', 'Maîtriser cette situation', 'Pas de nouveau test dans une situation exactement semblable, selon Maman.');
const rapide = E('rapide', 'Finir deux fois plus vite', 'Le temps nécessaire est divisé par deux.');
const impression = E('impression', 'Impressionner', 'Maman détermine la personne et les suites.');
const aider = E('aider', 'Donner une réussite à un autre PJ', 'Choisir un PJ dans la même situation, avec Maman.');
const degat = E('degat', 'Dégâts +1', 'Ajouter un dégât à cette attaque avant protection ; application séparée.', true);
const initiative = E('initiative', 'Échanger les initiatives', 'Échange avec la cible à partir du prochain Round ; pas de retour à l’ancienne initiative.');
const desarmer = E('desarmer', 'Désarmer', 'Choisir l’objet ou l’arme lâché avec Maman.');
export function eclatsDeLaCompetence(competence: CompetenceAlien | undefined): EclatAlien[] {
    switch (competence) {
        case 'machines': return [bonus, dispense, rapide, E('hs', 'Mettre hors service', 'La machine est définitivement hors service.'), E('discret', 'Agir discrètement', 'L’intervention ne se fait pas remarquer.'), impression];
        case 'endurance': return [aider, bonus, dispense, impression];
        case 'mobilite': case 'survie': return [aider, bonus, impression];
        case 'rapproche': return [degat, initiative, desarmer, E('terre', 'Mettre à terre', 'La cible tombe à terre.'), E('saisir', 'Saisir la cible', 'Humain ou synthétique seulement ; Combat rapproché opposé pour se libérer, ou fin si vous êtes Brisé ou lâchez prise.')];
        case 'distance': return [degat, E('clouer', 'Clouer sur place', 'La cible doit immédiatement tester sa Panique ; Maman désigne la cible et demande le test.'), initiative, desarmer, E('repousser', 'Faire reculer ou tomber', 'Maman valide le déplacement et ses conséquences.')];
        case 'pilotage': return [bonus, impression];
        case 'observation': return [E('cible', 'Suis-je pris pour cible ?', 'Maman répond.'), E('nombre', 'D’autres menaces sont-elles proches ?', 'Maman répond.'), E('passage', 'Comment passer ou s’échapper ?', 'Maman indique un passage ou une issue discrète.')];
        case 'comtech': return [bonus, dispense, rapide, E('info', 'Obtenir une information inattendue', 'Maman choisit l’information.'), E('traces', 'Couvrir ses traces', 'L’intervention ne laisse pas de traces.'), impression];
        case 'manipulation': return [E('gratuit', 'Aucune contrepartie', 'L’adversaire obéit sans demander de compensation.'), E('davantage', 'Obtenir davantage', 'Maman choisit ce qui est accordé en plus.'), E('allie', 'Obtenir une aide future', 'L’adversaire impressionné aidera ultérieurement ; détails fixés par Maman.')];
        default: return []; // Commandement et Soins utilisent chaque réussite directement (p. 71).
    }
}
export interface JetAlien {
    automatique?: boolean; chargeurAVider?: boolean; resolu?: boolean;
    version: 1; id: string; competence?: CompetenceAlien; nomCompetence: string; role: RoleAlien;
    composition: string; equipement?: EquipementAlien; reussites: number; paniqueEnAttente: boolean;
    annule: boolean; defense?: number; eclats: { id: string; label: string; rappel: string; cible?: string }[];
}
export function lireLeJetAlien(fiche: Record<string, unknown>): JetAlien | undefined {
    const v = fiche[CLE_JET_ALIEN] as JetAlien | undefined;
    return v?.version === 1 && typeof v.id === 'string' && Array.isArray(v.eclats) ? v : undefined;
}
export function budgetDesEclats(jet: JetAlien): number {
    if (jet.paniqueEnAttente || jet.annule || jet.role === 'defenseur' || (jet.role === 'attaquant' && jet.defense === undefined)) return 0;
    return Math.max(0, jet.reussites - (jet.defense ?? 0) - 1 - jet.eclats.length);
}
export function depenserUnEclat(jet: JetAlien, id: string, cible?: string): JetAlien {
    const e = eclatsDeLaCompetence(jet.competence).find(e => e.id === id);
    if (!e || budgetDesEclats(jet) < 1 || (!e.repetable && jet.eclats.some(x => x.id === id && x.cible === cible))) return jet;
    return { ...jet, eclats: [...jet.eclats, { id: e.id, label: e.label, rappel: e.rappel, ...(cible ? { cible } : {}) }] };
}
export function ajouterUneCibleSecondaire(jet: JetAlien, nom: string): JetAlien {
    const cible = nom.trim();
    if (!jet.automatique || jet.competence !== 'distance' || !cible || budgetDesEclats(jet) < 1 || jet.eclats.some(e => e.id === 'cible-secondaire' && e.cible === cible)) return jet;
    return { ...jet, eclats: [...jet.eclats, { id: 'cible-secondaire', cible, label: `Cible secondaire : ${cible}`, rappel: 'Un six affecté : dégâts de base de l’arme ; cible à Courte portée de la cible initiale, validée par Maman.' }] };
}
export function actualiserLeJetAlien(jet: JetAlien, resultat: RollResult, paniqueEnAttente = false, annule = false): JetAlien {
    return { ...jet, reussites: resultat.successes ?? 0, paniqueEnAttente, annule };
}
/** Une égalité échoue pour l'attaquant. Les dés restent ceux réellement lancés. */
export function resultatDuJetAlien(resultat: RollResult, jet: JetAlien): RollResult {
    if (jet.paniqueEnAttente || jet.role === 'defenseur' || (jet.role === 'attaquant' && jet.defense === undefined)) {
        return { ...resultat, tagSuccess: undefined, degre: undefined,
            totalDisplay: `${resultat.totalDisplay} — ${jet.paniqueEnAttente ? 'Panique à résoudre' : jet.role === 'defenseur' ? 'réussites de défense à transmettre' : 'opposition à résoudre'}` };
    }
    const nettes = jet.annule ? 0 : Math.max(0, jet.reussites - (jet.defense ?? 0));
    return { ...resultat, successes: nettes, total: nettes, tagSuccess: nettes > 0, degre: nettes > 0 ? 'reussite-normale' : 'echec-normal',
        totalDisplay: `${jet.reussites} réussite(s)${jet.defense === undefined ? '' : ` − ${jet.defense} défense = ${nettes} nette(s)`}${jet.annule ? ' — action annulée par la Panique' : ''}` };
}
