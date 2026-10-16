import { create } from 'zustand';
import type { VueDesModulesJoueurRecue, VueDesModulesMJ, CommandeDeModule, ResultatDeModule, SauvegardeDesModules } from './protocole';

const horsConnexion = async (): Promise<ResultatDeModule> => ({ ok: false, erreur: 'Module déconnecté.' });
export const useModulesDuJeuJoueur = create<{
    vue: VueDesModulesJoueurRecue | null;
    commander: (moduleId: string, commande: CommandeDeModule) => Promise<ResultatDeModule>;
}>(() => ({ vue: null, commander: horsConnexion }));
export const useModulesDuJeuMJ = create<{
    vue: VueDesModulesMJ | null; erreur: string | null; sauvegarde?: SauvegardeDesModules;
}>(() => ({ vue: null, erreur: null }));
export function recevoirModulesMJ(vue: VueDesModulesMJ) {
    const ancienne = useModulesDuJeuMJ.getState().vue;
    if (ancienne && vue.revision < ancienne.revision) return;
    useModulesDuJeuMJ.setState({ vue, erreur: vue.erreur ?? null, sauvegarde: vue.sauvegarde });
}
export async function importerLesModules(sauvegarde: SauvegardeDesModules) {
    const pont = window.appBridge?.modulesDuJeu;
    if (!pont) throw new Error('La restauration des modules exige le poste MJ de GM-OS.');
    const resultat = await pont.importer(sauvegarde);
    if (!resultat.ok) throw new Error(resultat.erreur);
    recevoirModulesMJ(await pont.lire());
}
