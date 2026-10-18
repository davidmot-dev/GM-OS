import type { ReferenceDeModuleDuJeu } from './types';

export interface CommandeDeModule { id: string; charge: unknown }
export type ResultatDeModule = { ok: true } | { ok: false; erreur: string };
export interface InstanceSauvegardee { versionDonnees: number; donnees: unknown }
export interface SauvegardeDesModules { version: 1; campagnes: Record<string, Record<string, InstanceSauvegardee>> }
export interface ContexteDesModules {
    campagneId: string | null;
    seanceId: string | null;
    pilote: { id: string; name: string; corpusId?: string; ragPath?: string; modulesDuJeu?: ReferenceDeModuleDuJeu[] } | null;
    systemPath?: string;
    personnages: { id: string; nom: string }[];
}
export interface CarteDeModule { id: string; libelle: string; revision: number; ouverture?: number; vue: unknown }
export interface VueDesModulesJoueur {
    campagneId: string | null; personnageId: string | null; contexte: number; revision: number; modules: CarteDeModule[];
    /** Heure du poste MJ au moment de la projection ; absente des anciens serveurs. */
    instantServeur?: number;
}
/** Projection éphémère reçue : l'horloge locale monotone ne traverse jamais le réseau. */
export interface VueDesModulesJoueurRecue extends VueDesModulesJoueur {
    horloge?: () => number;
}
export interface VueDesModulesMJ {
    campagneId: string | null; contexte: number; revision: number;
    modules: (CarteDeModule & { acces: string[]; diffusionSonore?: boolean; appareilDeDiffusion?: string | null })[];
    appareils?: { id: string; libelle: string; personnageId: string }[];
    sauvegarde?: SauvegardeDesModules;
    erreur?: string;
    indisponibles?: { id: string; raison: string }[];
}
export interface RequeteDeModule {
    requeteId: string; campagneId: string; moduleId: string; contexte: number; commande: CommandeDeModule;
}
/** Réservé au raccord des fiches du poste MJ ; aucune route WebSocket joueur. */
export interface AccuseFicheDeModule {
    campagneId: string; moduleId: string; contexte: number; personnageId: string; transactionId: string;
    appliquee: boolean; sortieForcee: boolean; detail: string;
}
export interface PontDesModules {
    contexte: (contexte: ContexteDesModules) => Promise<ResultatDeModule>;
    lire: () => Promise<VueDesModulesMJ>;
    commander: (requete: RequeteDeModule) => Promise<ResultatDeModule>;
    acquitterFiche: (accuse: AccuseFicheDeModule) => Promise<ResultatDeModule>;
    autoriser: (demande: { campagneId: string; moduleId: string; personnages: string[]; contexte: number }) => Promise<ResultatDeModule>;
    toutCouper: (demande: { campagneId: string; contexte: number }) => Promise<ResultatDeModule>;
    choisirDiffusion: (demande: { campagneId: string; moduleId: string; appareilId: string; contexte: number }) => Promise<ResultatDeModule>;
    importer: (sauvegarde: SauvegardeDesModules) => Promise<ResultatDeModule>;
    surChangement: (rappel: (vue: VueDesModulesMJ) => void) => () => void;
}
export const identifiantDeTable = (id: unknown): id is string => typeof id === 'string'
    && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id) && id !== 'prototype' && !Object.hasOwn(Object.prototype, id);
export function objetSimple(valeur: unknown): valeur is Record<string, unknown> {
    return !!valeur && typeof valeur === 'object' && !Array.isArray(valeur)
        && [Object.prototype, null].includes(Object.getPrototypeOf(valeur));
}
/** Le moteur valide ensuite ses données ; les modules inconnus traversent sans exécution. */
export function validerSauvegardeDesModules(valeur: unknown): asserts valeur is SauvegardeDesModules {
    const refuser = () => { throw new Error('Sauvegarde des modules illisible. Rien n’a été remplacé.'); };
    if (!objetSimple(valeur) || valeur.version !== 1 || Object.keys(valeur).some(k => !['version', 'campagnes'].includes(k)) || !objetSimple(valeur.campagnes)) return refuser();
    if (Object.keys(valeur.campagnes).length > 1000 || JSON.stringify(valeur).length > 32 * 1024 * 1024) return refuser();
    for (const [campagne, modules] of Object.entries(valeur.campagnes)) {
        if (!identifiantDeTable(campagne) || !objetSimple(modules) || Object.keys(modules).length > 32) return refuser();
        for (const [id, instance] of Object.entries(modules)) {
            if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || id.length > 80 || !objetSimple(instance)
                || Object.keys(instance).some(k => !['versionDonnees', 'donnees'].includes(k))
                || !Number.isSafeInteger(instance.versionDonnees) || Number(instance.versionDonnees) < 1 || !Object.hasOwn(instance, 'donnees')) return refuser();
        }
    }
}
