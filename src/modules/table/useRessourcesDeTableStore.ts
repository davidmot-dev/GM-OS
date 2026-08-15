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
 * **Les réserves atteignent la tablette depuis le 2026-08-15.** Ce paragraphe
 * disait l'inverse jusque-là, et c'était vrai : l'état ne vivait que dans la
 * fenêtre du meneur. David l'a tranché — *« permet juste aux joueurs d'avoir une
 * vue sur l'Impulsion et de la gérer »* — et il a raison sur le fond : chez
 * Dune, l'Impulsion est **commune aux joueurs** et se dépense par décision
 * collective. Une réserve partagée que le groupe ne voit pas n'est pas
 * partagée ; c'est la réserve du MJ, qu'il annonce à voix haute.
 *
 * Le chemin n'est **pas** celui de `windowTransport` : les réserves voyagent
 * dans le bloc `session` de la diffusion réseau (`useNexusSynchronizer`), et le
 * geste d'un joueur revient par l'action `table:ajuster`. Le MJ reste **seul à
 * faire autorité** — il rejoue la règle avec les mêmes fonctions pures et
 * rediffuse —, ce qui respecte la leçon du 2026-08-07 sur la persistance
 * partagée sans priver la table de sa monnaie.
 */
interface RessourcesDeTableState {
    /** `campaignId` → valeur de chaque réserve. */
    reserves: Record<string, EtatDesRessources>;

    /** L'état d'une campagne, complété par les valeurs de départ manquantes. */
    etatDe: (campaignId: string, ressources: RessourceDeTable[]) => EtatDesRessources;
    /** La valeur d'une réserve, ou son départ si elle n'a jamais bougé. */
    valeur: (campaignId: string, ressources: RessourceDeTable[], id: string) => number;

    /**
     * `motif` explique le mouvement au journal — « Jet : Combat + Devoir ».
     *
     * Facultatif partout, parce qu'un ajustement à la main n'en a pas ; mais
     * un mouvement causé par un jet doit le dire, sans quoi une Impulsion qui
     * passe de quatre à un ne veut plus rien dire à la relecture.
     */
    depenser: (campaignId: string, ressources: RessourceDeTable[], id: string, montant: number, motif?: string) => ResultatDeMouvement;
    gagner: (campaignId: string, ressources: RessourceDeTable[], id: string, montant: number, motif?: string) => ResultatDeMouvement;
    fixer: (campaignId: string, ressources: RessourceDeTable[], id: string, valeur: number, motif?: string) => ResultatDeMouvement;
    /** L'érosion de fin de scène, déclenchée par le meneur — lui seul sait qu'une scène s'achève. */
    finDeScene: (campaignId: string, ressources: RessourceDeTable[]) => ResultatDeMouvement;
    /** Remet les réserves d'une campagne à leur valeur de départ. */
    reinitialiser: (campaignId: string, ressources: RessourceDeTable[]) => void;
    /**
     * Le geste d'un joueur, depuis sa tablette.
     *
     * **Il s'applique ici ET part chez le meneur.** Localement d'abord, pour
     * que le joueur voie sa réserve bouger sans attendre l'aller-retour ; la
     * diffusion du MJ écrasera ensuite avec la valeur qui fait autorité. C'est
     * le schéma déjà tenu par `remoteUpdateCharacterNarrative`.
     *
     * `delta` négatif dépense, positif crédite. Le MJ rejoue la même règle avec
     * les mêmes fonctions — report sur épuisement et plafond compris —, donc
     * une divergence entre les deux se corrige d'elle-même à la diffusion
     * suivante.
     */
    ajusterDepuisLaTablette: (campaignId: string, ressources: RessourceDeTable[], id: string, delta: number, motif?: string) => ResultatDeMouvement;
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

            /**
             * Consigne un mouvement au journal de séance.
             *
             * **Demandé par David le 2026-08-15** : *« tu logs dans le journal
             * toutes les variations des jauges communes avec le jet »*. Le
             * « avec le jet » est l'essentiel : une Impulsion qui passe de
             * quatre à un ne veut rien dire sans ce qui l'a dépensée, et c'est
             * précisément ce qu'on se demande en relisant une séance.
             *
             * **Écrit ici et nulle part ailleurs.** Cinq chemins font bouger une
             * réserve — le meneur, le panneau de jet, l'alternance d'initiative,
             * la fin de scène, la tablette d'un joueur — et tous passent par
             * `appliquer`. Les instrumenter un par un aurait garanti qu'un
             * sixième, ajouté plus tard, se taise sans que personne ne le
             * remarque.
             *
             * Le journal est facultatif : sur la tablette d'un joueur, il
             * n'existe pas. On ne fait alors rien plutôt que d'échouer.
             */
            const consigner = (
                resultat: ResultatDeMouvement,
                ressources: RessourceDeTable[],
                motif?: string,
            ) => {
                if (resultat.mouvements.length === 0) return;
                if (typeof window === 'undefined') return;

                const journal = (window as unknown as {
                    useJournalStore?: { getState: () => { isRecording?: boolean; addEvent: (e: unknown) => void } };
                }).useJournalStore?.getState();
                if (!journal?.isRecording) return;

                const nomDe = (id: string) => ressources.find(r => r.id === id)?.label ?? id;
                const dits = resultat.mouvements.map(m => {
                    const valeur = resultat.etat[m.ressourceId];
                    const signe = m.delta > 0 ? `+${m.delta}` : `${m.delta}`;
                    return `${nomDe(m.ressourceId)} ${signe} → ${valeur}`;
                });

                journal.addEvent({
                    type: 'SYSTEM',
                    title: motif ? `Réserves — ${motif}` : 'Réserves de table',
                    // Le plafond qui refuse un gain se consigne aussi : un joueur
                    // qui en gagne trois et n'en voit arriver qu'un doit pouvoir
                    // le retrouver après coup, pas seulement au moment du toast.
                    content: [...dits, ...resultat.avertissements].join('\n'),
                    metadata: { mouvements: resultat.mouvements, motif },
                });
            };

            const appliquer = (
                campaignId: string,
                resultat: ResultatDeMouvement,
                ressources: RessourceDeTable[],
                motif?: string,
            ): ResultatDeMouvement => {
                set(state => ({ reserves: { ...state.reserves, [campaignId]: resultat.etat } }));
                consigner(resultat, ressources, motif);
                return resultat;
            };

            return {
                reserves: {},

                etatDe: lire,

                valeur: (campaignId, ressources, id) => valeurDe(ressources, lire(campaignId, ressources), id),

                depenser: (campaignId, ressources, id, montant, motif) =>
                    appliquer(campaignId, depenserPur(ressources, lire(campaignId, ressources), id, montant), ressources, motif),

                gagner: (campaignId, ressources, id, montant, motif) =>
                    appliquer(campaignId, gagnerPur(ressources, lire(campaignId, ressources), id, montant), ressources, motif),

                fixer: (campaignId, ressources, id, valeur, motif) =>
                    appliquer(campaignId, fixerPur(ressources, lire(campaignId, ressources), id, valeur), ressources, motif ?? 'ajustement manuel'),

                finDeScene: (campaignId, ressources) =>
                    appliquer(campaignId, finDeScenePur(ressources, lire(campaignId, ressources)), ressources, 'fin de scène'),

                reinitialiser: (campaignId, ressources) => {
                    set(state => ({ reserves: { ...state.reserves, [campaignId]: etatInitial(ressources) } }));
                },

                ajusterDepuisLaTablette: (campaignId, ressources, id, delta, motif) => {
                    if (!delta) return { etat: {}, mouvements: [], perdu: 0, avertissements: [] };
                    const etat = lire(campaignId, ressources);
                    const resultat = appliquer(campaignId, delta < 0
                        ? depenserPur(ressources, etat, id, -delta)
                        : gagnerPur(ressources, etat, id, delta),
                        ressources, motif ?? 'depuis la tablette');

                    if (typeof window === 'undefined') return resultat;
                    const pont = (window as unknown as {
                        appBridge?: { remote?: { broadcastToTablets?: (t: string, p: unknown) => void } };
                    }).appBridge;

                    // Deux chemins, comme partout ailleurs : le pont Electron
                    // quand il existe, l'événement capté par `useHubSync` sinon
                    // — c'est le cas de la tablette en PWA, qui n'a pas de pont.
                    if (pont?.remote?.broadcastToTablets) {
                        pont.remote.broadcastToTablets('table:ajuster', { ressourceId: id, delta });
                    } else {
                        window.dispatchEvent(new CustomEvent('table:ajuster', {
                            detail: { ressourceId: id, delta, motif },
                        }));
                    }
                    return resultat;
                },
            };
        },
        {
            name: 'gmos-ressources-de-table',
            partialize: state => ({ reserves: state.reserves }),
        },
    ),
);

/*
  **Exposé sur `window` comme les huit autres stores que la tablette applique.**
  `useHubSync` les atteint tous par `getStore(nom)` et n'en importe aucun : il
  vit dans le même code que le Hub embarqué comme que la PWA distante, où tous
  les modules ne sont pas chargés. Un store absent y rend `null`, et la branche
  correspondante ne fait rien — c'est ce qui permet à ce fichier d'ignorer ce
  qui n'est pas là plutôt que d'échouer à l'import.
*/
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useRessourcesDeTableStore = useRessourcesDeTableStore;
}
