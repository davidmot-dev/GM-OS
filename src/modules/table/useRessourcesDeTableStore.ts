import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    etatInitial,
    valeurDe,
    depenser as depenserPur,
    gagner as gagnerPur,
    fixer as fixerPur,
    finDeScene as finDeScenePur,
    type EtatDesRessources,
    type RessourceDeTable,
    type ResultatDeMouvement,
} from './RessourcesDeTable';

/**
 * L'état des réserves de table, campagne par campagne.
 *
 * **Pourquoi par campagne.** Une réserve appartient à une table qui joue une
 * chronique donnée. Un seul jeu de valeurs pour toute l'application aurait fait
 * hériter à « Agents de Dune » l'Impulsion laissée par une autre partie — et
 * personne ne l'aurait vu, puisqu'un nombre plausible ne se signale pas.
 *
 * **Ce que le store ne fait pas** : il n'arbitre rien. Tout le calcul est dans
 * `RessourcesDeTable.ts`, pur et testé ; ici on ne fait qu'appliquer et
 * persister. Le résultat est **rendu à l'appelant** avec ses avertissements,
 * pour que l'écran puisse dire ce qui s'est passé plutôt que de le taire.
 *
 * **Pas de diffusion vers les écrans secondaires pour l'instant.** Ce serait un
 * nouveau flux dans `windowTransport`, la liste du relais et les types distants
 * — un chantier à part. L'état vit donc dans la fenêtre MJ, seule à écrire,
 * comme l'exige la leçon du 2026-08-07 sur la persistance partagée.
 */
interface RessourcesDeTableState {
    /** `campaignId` → valeur de chaque réserve. */
    reserves: Record<string, EtatDesRessources>;

    /** L'état d'une campagne, complété par les valeurs de départ manquantes. */
    etatDe: (campaignId: string, ressources: RessourceDeTable[]) => EtatDesRessources;
    /** La valeur d'une réserve, ou son départ si elle n'a jamais bougé. */
    valeur: (campaignId: string, ressources: RessourceDeTable[], id: string) => number;

    depenser: (campaignId: string, ressources: RessourceDeTable[], id: string, montant: number) => ResultatDeMouvement;
    gagner: (campaignId: string, ressources: RessourceDeTable[], id: string, montant: number) => ResultatDeMouvement;
    fixer: (campaignId: string, ressources: RessourceDeTable[], id: string, valeur: number) => ResultatDeMouvement;
    /** L'érosion de fin de scène, déclenchée par le meneur — lui seul sait qu'une scène s'achève. */
    finDeScene: (campaignId: string, ressources: RessourceDeTable[]) => ResultatDeMouvement;
    /** Remet les réserves d'une campagne à leur valeur de départ. */
    reinitialiser: (campaignId: string, ressources: RessourceDeTable[]) => void;
}

export const useRessourcesDeTableStore = create<RessourcesDeTableState>()(
    persist(
        (set, get) => {
            /**
             * L'état courant, complété.
             *
             * Une réserve ajoutée au pilote après le début d'une chronique n'est
             * pas dans l'état persisté. La compléter par son départ évite le
             * zéro silencieux — une Menace à zéro qui n'a jamais été dépensée.
             */
            const lire = (campaignId: string, ressources: RessourceDeTable[]): EtatDesRessources => ({
                ...etatInitial(ressources),
                ...(get().reserves[campaignId] ?? {}),
            });

            const appliquer = (campaignId: string, resultat: ResultatDeMouvement): ResultatDeMouvement => {
                set(state => ({ reserves: { ...state.reserves, [campaignId]: resultat.etat } }));
                return resultat;
            };

            return {
                reserves: {},

                etatDe: lire,

                valeur: (campaignId, ressources, id) => valeurDe(ressources, lire(campaignId, ressources), id),

                depenser: (campaignId, ressources, id, montant) =>
                    appliquer(campaignId, depenserPur(ressources, lire(campaignId, ressources), id, montant)),

                gagner: (campaignId, ressources, id, montant) =>
                    appliquer(campaignId, gagnerPur(ressources, lire(campaignId, ressources), id, montant)),

                fixer: (campaignId, ressources, id, valeur) =>
                    appliquer(campaignId, fixerPur(ressources, lire(campaignId, ressources), id, valeur)),

                finDeScene: (campaignId, ressources) =>
                    appliquer(campaignId, finDeScenePur(ressources, lire(campaignId, ressources))),

                reinitialiser: (campaignId, ressources) => {
                    set(state => ({ reserves: { ...state.reserves, [campaignId]: etatInitial(ressources) } }));
                },
            };
        },
        {
            name: 'gmos-ressources-de-table',
            partialize: state => ({ reserves: state.reserves }),
        },
    ),
);
