import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { calculationEngine } from './CalculationEngine';
import type { PlayerCharacter } from '../../../types/player.types';
import { suivrePerteDEndurance } from './fatigueDuVoyageur';
import { suivreSanteVoyageur } from './santeDuVoyageur';
import { conserverRecusDesTMR } from './recusDesTMR';

/** R0, demandé par David le 18/10/2026. Livre 2.3.1, p. 19–20, 42, 44–45, 206–208.
 * Les valeurs enregistrées restent intactes jusqu'à la reprise explicite par le meneur.
 * Le seuil de rêve est une valeur indépendante, jamais une copie forcée de RÊVE.
 */
export const HEURES_DRACONIQUES = ['Le Vaisseau', 'La Sirène', 'Le Faucon', 'La Couronne', 'Le Dragon',
    'Les Épées', 'La Lyre', 'Le Serpent', 'Le Poisson Acrobate', 'L’Araignée', 'Le Roseau', 'Le Château Dormant'];
export const CLE_REPRISE = '__rddReprise231';
export const CLE_ORIGINAUX = '__rddAvantReprise231';

export const ALIAS_DU_VOYAGEUR: Readonly<Record<string, readonly string[]>> = {
    vie: ['points_de_vie', '__rddVieCombat'], reve_pts: ['reve_base', 'points_de_reve'], reve_seuil: ['reve_pts_max'],
    tir: ['tir_comp'], beaute: ['beauter'],
    poids_kg: ['poids'], heure_naissance: ['heure_de_naissance'], enc: ['capacite_maximale'],
};

// Tables de création imprimées p. 45 : ne pas extrapoler hors de leur domaine.
const table = (variable: string, valeurs: number[], repli: string) => valeurs.reduceRight(
    (suite, valeur, i) => `${variable} == ${i + 6} ? ${valeur} : (${suite})`, repli);
export const CALCULS_DU_VOYAGEUR: Readonly<Record<string, string>> = {
    melee: 'floor((force + agilite) / 2)', tir: 'floor((vue + dexterite) / 2)',
    lancer: 'floor((floor((vue + dexterite) / 2) + force) / 2)',
    derobee: 'floor(((21 - taille) + agilite) / 2)',
    vie_max: 'ceil((taille + constitution) / 2)',
    endurance_max: 'max(taille + constitution, ceil((taille + constitution) / 2) + volonte)',
    enc: '(taille + force) / 2',
    sc: table('constitution', [2, 2, 2, 3, 3, 3, 4, 4, 4, 5], 'sc'),
    sust: table('taille', [2, 2, 2, 2, 3, 3, 3, 3, 4, 4], 'sust'),
    plus_dom: table('floor((taille + force) / 2)', [-1, -1, 0, 0, 0, 0, 1, 1, 2, 2], 'plus_dom'),
    reve_eclatement: '3 * reve_seuil',
};

export type ValeursDeVoyageur = Record<string, unknown>;
export interface CandidatDeReprise { champ: string; valeur: string | number; }
export interface ConflitDeVoyageur { champ: string; label: string; candidats: CandidatDeReprise[]; }
export interface LectureDeVoyageur {
    valeurs: ValeursDeVoyageur;
    conflits: ConflitDeVoyageur[];
    changements: { champ: string; avant: unknown; apres: unknown }[];
    avertissements: string[];
    aReprendre: boolean;
}
export const estUneFicheDeVoyageur = (fiche: Pick<SheetTemplate, 'reglesDeFiche'> | null | undefined) => fiche?.reglesDeFiche === 'rdd-231';
const present = (v: unknown) => v !== undefined && v !== null && v !== '';
const possede = (o: object, cle: string) => Object.prototype.hasOwnProperty.call(o, cle);
const normaliserTexte = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').trim().toLowerCase();
function valeurRetenue(champ: string, brut: unknown): string | number | null {
    if (!present(brut)) return null;
    if (champ === 'heure_naissance') {
        const numero = Number(brut);
        if (Number.isInteger(numero) && numero >= 1 && numero <= 12) return HEURES_DRACONIQUES[numero - 1];
        return HEURES_DRACONIQUES.find(h => normaliserTexte(h) === normaliserTexte(String(brut))) ?? String(brut);
    }
    if (champ === 'poids_kg') return String(brut);
    const n = Number(brut);
    return Number.isFinite(n) ? n : null;
}

/** Lecture pure : aucun magasin, aucun accès au disque, aucune mutation du personnage. */
export function lireFicheDeVoyageur(fiche: SheetTemplate, donnees: ValeursDeVoyageur = {}, choix: ValeursDeVoyageur = {}): LectureDeVoyageur {
    if (!estUneFicheDeVoyageur(fiche)) return { valeurs: donnees, conflits: [], changements: [], avertissements: [], aReprendre: false };
    const champs = fiche.sections.flatMap(s => s.fields);
    const valeurs: ValeursDeVoyageur = { ...Object.fromEntries(champs.map(c => [c.id, c.defaultValue])), ...donnees };
    const aReprendre = donnees[CLE_REPRISE] !== 1;
    const conflits: ConflitDeVoyageur[] = [];
    if (aReprendre && !present(donnees.reve_seuil) && !present(donnees.reve_pts_max)) valeurs.reve_seuil = valeurs.reve;
    if (aReprendre && !present(donnees.points_de_chance)) valeurs.points_de_chance = valeurs.chance;
    if (aReprendre) for (const [champ, anciens] of Object.entries(ALIAS_DU_VOYAGEUR)) {
        const candidats = [champ, ...anciens].filter(cle => present(donnees[cle])).map(cle => ({ champ: cle, valeur: valeurRetenue(champ, donnees[cle]) }))
            .filter((c): c is CandidatDeReprise => c.valeur !== null);
        if (possede(choix, champ)) {
            const retenue = valeurRetenue(champ, choix[champ]);
            if (retenue !== null && (champ !== 'heure_naissance' || HEURES_DRACONIQUES.includes(String(retenue)))) valeurs[champ] = retenue;
            else conflits.push({ champ, label: champs.find(c => c.id === champ)?.label ?? champ, candidats });
        } else if (candidats.length) {
            valeurs[champ] = candidats[0].valeur;
            if (!CALCULS_DU_VOYAGEUR[champ] && (new Set(candidats.map(c => String(c.valeur))).size > 1
                || (champ === 'heure_naissance' && !HEURES_DRACONIQUES.includes(String(candidats[0].valeur))))) {
                conflits.push({ champ, label: champs.find(c => c.id === champ)?.label ?? champ, candidats });
            }
        }
    }
    // Les caractéristiques sont les seules entrées des calculs : les points de vie
    // actuels, même diminués par une blessure, ne réduisent jamais la valeur de départ.
    const avertissements: string[] = [];
    const entrees = ['taille', 'constitution', 'force', 'agilite', 'vue', 'dexterite', 'volonte', 'reve_seuil'];
    for (const cle of entrees) {
        if (!present(valeurs[cle]) || !Number.isFinite(Number(valeurs[cle]))) avertissements.push(`« ${cle} » doit contenir un nombre pour recalculer la fiche.`);
        else valeurs[cle] = Number(valeurs[cle]);
    }
    if (calculDeVoyageurHorsTable('sc', valeurs)) avertissements.push('SC : hors de la table de création (Constitution 6–15), valeur précédente conservée.');
    if (calculDeVoyageurHorsTable('sust', valeurs)) avertissements.push('Sustentation : hors de la table de création (Taille 6–15), valeur précédente conservée.');
    if (calculDeVoyageurHorsTable('plus_dom', valeurs)) avertissements.push('Bonus dommages : hors de la table de création (moyenne 6–15), valeur précédente conservée.');
    const calculable = entrees.every(c => present(valeurs[c]) && Number.isFinite(Number(valeurs[c])));
    if (calculable) for (const [champ, formule] of Object.entries(CALCULS_DU_VOYAGEUR)) {
        if (calculDeVoyageurHorsTable(champ, valeurs)) continue;
        const contexte = Object.fromEntries(Object.entries(valeurs).filter(([,v]) => present(v) && Number.isFinite(Number(v))).map(([k,v]) => [k, Number(v)]));
        const calcule = calculationEngine.evaluate(formule, contexte);
        if (Number.isFinite(calcule)) valeurs[champ] = calcule;
    }
    const changements = Object.keys(CALCULS_DU_VOYAGEUR).filter(c => present(donnees[c]) && Number(donnees[c]) !== valeurs[c])
        .map(champ => ({ champ, avant: donnees[champ], apres: valeurs[champ] }));
    return { valeurs, conflits, changements, avertissements, aReprendre };
}

/** Reprise explicite : l'intégralité des anciennes données est conservée une fois. */
export function reprendreFicheDeVoyageur(fiche: SheetTemplate, donnees: ValeursDeVoyageur, choix: ValeursDeVoyageur = {}): ValeursDeVoyageur {
    const lecture = lireFicheDeVoyageur(fiche, donnees, choix);
    if (!estUneFicheDeVoyageur(fiche)) return donnees;
    if (lecture.conflits.length) throw new Error('Choisir les valeurs à reprendre avant de recalculer.');
    if (lecture.avertissements.some(a => a.includes('doit contenir'))) throw new Error(lecture.avertissements.join(' '));
    return { ...lecture.valeurs, [CLE_REPRISE]: 1, [CLE_ORIGINAUX]: donnees[CLE_ORIGINAUX] ?? structuredClone(donnees) };
}

/** Au-delà des tables imprimées de création, la saisie manuelle reste possible. */
export function calculDeVoyageurHorsTable(champ: string, valeurs: ValeursDeVoyageur): boolean {
    const entree = champ === 'sc' ? Number(valeurs.constitution) : champ === 'sust' ? Number(valeurs.taille)
        : champ === 'plus_dom' ? Math.floor((Number(valeurs.taille) + Number(valeurs.force)) / 2) : null;
    return entree !== null && (!Number.isInteger(entree) || entree < 6 || entree > 15);
}

/** Une fiche reprise garde ses calculs à jour pour les jets, la tablette et le combat,
 * y compris lorsqu'une écriture vient d'un autre écran que l'éditeur de fiche.
 */
export function actualiserPersonnageDeVoyageur<T extends Pick<PlayerCharacter, 'hp' | 'maxHp'> & Partial<Pick<PlayerCharacter, 'templateId' | 'sheetData'>>>(
    personnage: T, fiches: readonly SheetTemplate[], precedent?: T,
): T {
    if (precedent?.sheetData) personnage = { ...personnage, sheetData: conserverRecusDesTMR(precedent.sheetData, personnage.sheetData ?? {}) };
    const fiche = fiches.find(f => f.id === personnage.templateId);
    if (!fiche || !estUneFicheDeVoyageur(fiche) || personnage.sheetData?.[CLE_REPRISE] !== 1) return personnage;
    const lecture = lireFicheDeVoyageur(fiche, personnage.sheetData);
    if (lecture.avertissements.some(a => a.includes('doit contenir'))) return personnage;
    const valeurs = precedent ? suivreSanteVoyageur(precedent.sheetData ?? {}, suivrePerteDEndurance(precedent.sheetData ?? {}, lecture.valeurs)) : lecture.valeurs;
    return { ...personnage, sheetData: valeurs,
        ...(Number.isFinite(Number(valeurs.vie)) ? {hp: Number(valeurs.vie)} : {}),
        maxHp: Number(lecture.valeurs.vie_max) };
}
