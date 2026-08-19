import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18next from 'i18next';
import { gmToast } from '../../stores/useToastStore';
import { useJournalStore } from '../journal/useJournalStore';
import {
    raconterLeCombat, ajouterUnCoup, estTombe, type FaitsDArmes,
} from './logic/RecitDuCombat';
import { raconterLImpact } from './logic/RecitDeLImpact';
import type { Player, Entity, PlayerCharacter, SessionOSState } from '../session/useSessionOSStore';
import { 
    type Combatant, 
    type StatusEffect 
} from './types';
import { 
    calculateDamageImpact, 
    filterConflictingStatuses, 
    generateEffectId, 
    processStatusDurations, 
    resolveInitiativeFormula
} from './logic/CombatRules';
import { HealthInterpreter } from '../session/logic/HealthInterpreter';
import { horlogeDeDefaite } from './logic/TacheDeDefaite';
import { santeDeDepart } from './logic/SanteDuCombattant';
// `logic/trame` ne connaît que des types : l'importer ne ferme aucun cycle,
// contrairement au store de séance qui reste atteint par le global.
import { etatDeLaScene } from '../session/logic/trame';
import type { Scene } from '../../types/trame.types';
import type { HealthSystem } from '../../types/entity.types';

/**
 * L'horloge de défaite d'un nouveau combattant, quand le système en veut une.
 *
 * **Pourquoi ici plutôt qu'aux appelants.** Huit écrans ajoutent des
 * combattants — la grille des personnages, la galerie de PNJ, les favoris, le
 * panneau de rencontre — et un seul d'entre eux connaît le pilote actif. Poser
 * la question à cet endroit unique évite d'instruire les sept autres, et surtout
 * évite qu'on en oublie un : un combattant sans horloge encaisse des coups qui
 * ne comptent nulle part.
 *
 * Le pilote est lu par le global que `useSessionOSStore` installe — un import
 * direct fermerait un cycle entre les deux stores. C'est le même accès que la
 * synchronisation vers Session OS emploie déjà, et l'absence du global est
 * traitée comme un cas normal : sans pilote, pas d'horloge.
 */
function santeSelonLeSysteme(sheetData?: Record<string, unknown>): HealthSystem | undefined {
    if (!sheetData) return undefined;
    try {
        const session = (window as unknown as {
            useSessionOSStore?: { getState: () => { getActiveDriver?: () => { combat?: { tacheDeDefaite?: Parameters<typeof horlogeDeDefaite>[0] } } | undefined } };
        }).useSessionOSStore?.getState();
        const tache = session?.getActiveDriver?.()?.combat?.tacheDeDefaite;
        if (!tache) return undefined;
        return horlogeDeDefaite(tache, sheetData).sante;
    } catch {
        // Un combat ne s'interrompt pas parce qu'un pilote est mal renseigné.
        return undefined;
    }
}

/** Le pilote actif, lu par le global — un import direct fermerait un cycle. */
function piloteActif(): { combat?: { santeDeDepart?: string } } | undefined {
    try {
        return (window as unknown as {
            useSessionOSStore?: { getState: () => { getActiveDriver?: () => { combat?: { santeDeDepart?: string } } | undefined } };
        }).useSessionOSStore?.getState()?.getActiveDriver?.() ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * Un combat qui démarre alors qu'aucune scène ne tourne en ouvre une.
 *
 * **La condition de déclenchement a une histoire.** Le type `OrigineDeScene`
 * annonçait depuis le 2026-08-08 une scène « née d'un combat lancé sans scène
 * active » — et le marqueur `improvisée` est resté **inatteignable** jusqu'ici :
 * aucun appelant ne passait `'improvisee'`, parce que « scène active » n'existait
 * pas. Le parcours réel arrivé le 2026-08-17 lui donne enfin son sens.
 *
 * **Trois garde-fous, et chacun évite une scène fantôme :**
 *
 * 1. *Une séance doit être active.* Il n'existe aucun « lancement de combat »
 *    dans ce store — un combat commence quand le premier combattant arrive sur
 *    un plateau vide. Sans cette condition, **préparer le combat de la semaine
 *    prochaine un dimanche après-midi créerait une scène** dans la campagne.
 * 2. *Aucune scène ne doit tourner.* Si le groupe est déjà quelque part, le
 *    combat s'y déroule ; en ouvrir une seconde dédoublerait le lieu.
 * 3. *La séance doit annoncer un acte.* Sans lui, la scène n'aurait nulle part
 *    où se ranger, et deviner l'acte la rangerait au mauvais endroit sans un mot.
 */
function rattacherLeCombatQuiDemarre(rattacher: (sceneId: string) => void): void {
    try {
        const s = magasinDeSeance();
        const campaignId = s?.activeCampaignId;
        if (!s || !campaignId) return;

        const seance = (s.sessions ?? [])
            .find(x => x.campaignId === campaignId && x.status === 'active');
        if (!seance) return;

        const ouvertes = (s.scenes ?? [])
            .filter(sc => sc.campaignId === campaignId && etatDeLaScene(sc) === 'en-cours');

        // UNE scène : aucune ambiguïté, on s'y rattache et ses PJ entrent.
        if (ouvertes.length === 1) {
            rattacher(ouvertes[0].id);
            return;
        }

        /*
          PLUSIEURS : on ne choisit pas à la place du meneur. Le combat reste
          non rattaché et **l'écran le demande** — un combat rangé dans la
          mauvaise scène fausserait le résumé sans jamais se signaler, et c'est
          exactement la classe de défaut qu'on passe nos journées à retirer.
        */
        if (ouvertes.length > 1) return;

        // AUCUNE : la scène improvisée, qui existe pour ce cas précis.
        if (!seance.acteId) return;
        const id = s.creerSceneImprovisee?.(seance.acteId, 'Combat improvisé', seance.id);
        if (id) rattacher(id);
    } catch {
        // Un combat ne s'interrompt pas parce que la trame est mal en point.
    }
}

/** Le magasin de séance, lu par le global — un import direct fermerait un cycle. */
function magasinDeSeance() {
    try {
        return (window as unknown as {
            useSessionOSStore?: { getState: () => {
                activeCampaignId?: string | null;
                sessions?: { id: string; campaignId: string; status: string; acteId?: string }[];
                scenes?: Scene[];
                players?: { characters?: { id: string; name: string; campaignId?: string | null; portraitUrl?: string }[] }[];
                creerSceneImprovisee?: (acteId: string, titre: string, seanceId?: string) => string;
            } };
        }).useSessionOSStore?.getState();
    } catch {
        return undefined;
    }
}

/** Les personnages joueurs qu'une scène déclare présents. */
function personnagesDeLaScene(sceneId: string): { id: string; name: string; portraitUrl?: string }[] {
    const s = magasinDeSeance();
    const scene = (s?.scenes ?? []).find(x => x.id === sceneId);
    if (!s || !scene) return [];
    const ids = new Set(scene.personnagesIds ?? []);
    return (s.players ?? [])
        .flatMap(p => p.characters ?? [])
        .filter(c => ids.has(c.id))
        .map(c => ({ id: c.id, name: c.name, portraitUrl: c.portraitUrl }));
}

/** L'état de table qu'une bascule de scène doit emporter et rendre. */
interface EtatDeLaCarte {
    mapUrl: string | null;
    mapName: string | null;
    isVideo: boolean;
    tokens: unknown[];
}

/** Le magasin de cartes, lu par le global — un import direct fermerait un cycle. */
function magasinDeCartes() {
    try {
        return (window as unknown as {
            useMapStore?: { getState: () => {
                mapUrl: string | null; mapName: string | null; isVideo: boolean; tokens: unknown[];
                setMap?: (url: string | null, isVideo?: boolean, name?: string) => void;
            } & Record<string, unknown> };
        }).useMapStore?.getState();
    } catch {
        return undefined;
    }
}

/** Ce que la table montre en ce moment — carte et pions. */
function releverLaCarte(): EtatDeLaCarte | undefined {
    const m = magasinDeCartes();
    if (!m) return undefined;
    return { mapUrl: m.mapUrl, mapName: m.mapName, isVideo: m.isVideo, tokens: m.tokens ?? [] };
}

/**
 * Repose la carte et les pions d'une scène.
 *
 * **Les tokens sont écrits directement, sans passer par `addToken`** : ce
 * dernier attribue un identifiant neuf, et un pion qui change d'identité à
 * chaque bascule perdrait ses liens vers son combattant.
 */
function reposerLaCarte(carte: EtatDeLaCarte | undefined): void {
    const m = magasinDeCartes();
    if (!m || !carte) return;
    try {
        m.setMap?.(carte.mapUrl, carte.isVideo, carte.mapName ?? 'Sans titre');
        (window as unknown as {
            useMapStore?: { setState: (p: Record<string, unknown>) => void };
        }).useMapStore?.setState({ tokens: carte.tokens });
    } catch {
        // Une carte qui ne se repose pas ne doit pas empêcher le combat de
        // repartir : le meneur la remettra à la main.
    }
}

/**
 * La fiche d'un combattant, retrouvée depuis sa source.
 *
 * Plusieurs écrans n'envoient que `sourcePlayerId` ou `sourceEntityId` — c'est
 * suffisant pour eux, et il serait absurde de leur demander de connaître le
 * pilote. Sans cette résolution, tout ce qui se lit **sur la fiche** (le seuil
 * de la tâche de défaite, la santé de départ) n'avait rien à lire.
 */
function ficheDuCombattant(c: { sourcePlayerId?: string; sourceEntityId?: string }): Combatant['sheetData'] {
    try {
        const session = (window as unknown as {
            useSessionOSStore?: { getState: () => {
                players?: { characters?: { id: string; sheetData?: Combatant['sheetData'] }[] }[];
                entities?: { id: string; sheetData?: Combatant['sheetData'] }[];
            } };
        }).useSessionOSStore?.getState();
        if (!session) return undefined;

        if (c.sourcePlayerId) {
            const perso = (session.players ?? [])
                .flatMap(p => p.characters ?? [])
                .find(p => p.id === c.sourcePlayerId);
            if (perso?.sheetData) return perso.sheetData;
        }
        if (c.sourceEntityId) {
            return (session.entities ?? []).find(e => e.id === c.sourceEntityId)?.sheetData;
        }
        return undefined;
    } catch {
        // Un combat ne s'interrompt pas parce qu'une fiche est introuvable.
        return undefined;
    }
}

/**
 * Les points de vie de départ, quand le pilote dit où les lire.
 *
 * **N'écrase jamais une valeur déjà fournie** : un combattant qu'on ajoute avec
 * ses points de vie courants les garde, sinon rejoindre un combat en cours
 * remettrait tout le monde à neuf. La formule ne sert qu'à **naître**.
 */
function pointsDeVieDeDepart(
    c: { hp?: number; hpMax?: number },
    fiche: Combatant['sheetData'],
): { hp?: number; hpMax?: number } {
    if (typeof c.hp === 'number' && typeof c.hpMax === 'number') return {};
    if (!fiche) return {};

    const formule = piloteActif()?.combat?.santeDeDepart;
    const depart = santeDeDepart(formule, champ => {
        const entree = Object.entries(fiche).find(([k]) => k.toLowerCase() === champ.toLowerCase());
        const valeur = entree ? Number(entree[1]) : NaN;
        return Number.isFinite(valeur) ? valeur : undefined;
    });

    return depart === null ? {} : { hp: c.hp ?? depart, hpMax: c.hpMax ?? depart };
}

// Re-export pour compatibilité descendante
export type { Combatant, StatusEffect };
export { STATUS_CONFLICT_MAP, COMBAT_AUTO_STATUS_RULES } from './logic/CombatRules';

/**
 * Interface d'état globale pour le Combat-OS.
 * Gère le cycle de vie d'un combat, de l'initiative au résumé final.
 */
interface CombatState {
    /** Liste des combattants actifs sur le plateau */
    combatants: Combatant[];
    /**
     * La scène à laquelle ce combat appartient.
     *
     * **Sans elle, un combat n'entre dans aucun résumé de séance** — c'est le
     * constat de David du 2026-08-17 : le journal saura dire qu'un combat a eu
     * lieu, jamais *où*, ni avec qui. Le rattachement se fait au premier
     * combattant posé sur un plateau vide, et **seulement quand il n'y a pas
     * d'ambiguïté** : une scène en cours, on s'y rattache ; aucune, on en
     * improvise une ; plusieurs, on laisse `null` et **l'écran demande**.
     */
    sceneId: string | null;
    /**
     * Les combats mis de côté, par scène.
     *
     * **Un meneur ne joue pas deux combats à la fois — il alterne.** C'est la
     * question tranchée avec David le 2026-08-17 : plutôt que rendre le combat
     * multiple (48 fichiers le lisent, tous supposant une instance unique), on
     * gare le plateau courant sous sa scène et on restaure celui de la scène
     * qu'on rejoint. Le groupe séparé se joue donc en alternant, ce qui est ce
     * qui se passe réellement à la table.
     *
     * **La carte et ses tokens sont garés avec le combat.** Demande de David :
     * changer de scène sans retenir *où se trouve chaque token* rendrait le
     * retour inutile — on retrouverait les combattants et plus le terrain. La
     * position d'un pion est l'état le plus coûteux à reconstituer de mémoire.
     *
     * Le brouillard n'y est pas, et c'est délibéré : `useMapStore` l'exclut déjà
     * de sa persistance et le range dans IndexedDB par carte. Le recopier ici en
     * dupliquerait des images entières à chaque bascule.
     */
    combatsGares: Record<string, {
        combatants: Combatant[];
        currentTurnIdx: number;
        round: number;
        carte?: { mapUrl: string | null; mapName: string | null; isVideo: boolean; tokens: unknown[] };
        /**
         * Ce combat garé a déjà son récit au journal.
         *
         * Voyage avec le plateau, et non à côté : un drapeau global serait faux
         * dès la première bascule — soit il resterait levé et le combat de la
         * scène suivante ne s'écrirait jamais, soit il retomberait et revenir
         * sur un combat déjà raconté le raconterait deux fois.
         */
        dejaConsigne?: boolean;
        /**
         * Ce que ce plateau-là a encaissé.
         *
         * Même raison de voyager avec lui : les coups pris dans le hangar ne
         * doivent pas apparaître dans le récit du combat de la cave.
         */
        faitsDArmes?: Record<string, FaitsDArmes>;
    }>;
    /** Index du combattant dont c'est le tour */
    currentTurnIdx: number;
    /** Numéro du round actuel */
    round: number;
    /** Indique si le tracker de combat est projeté sur le Player Hub */
    isCombatProjected: boolean;
    /** État de synchronisation avec les terminaux distants */
    isRemoteSyncing?: boolean;

    // --- Actions --- //

    // CRUD
    /** Ajoute un nouveau participant au combat */
    addCombatant: (combatant: Omit<Combatant, 'id'>) => void;
    /** Retire un participant du combat */
    removeCombatant: (id: string) => void;
    /** Met à jour les données d'un combattant */
    updateCombatant: (id: string, updates: Partial<Combatant>) => void;
    /** Vide la liste complète des combattants et génère un rapport dans le Journal */
    clearCombatants: () => void;
    /**
     * Écrit au journal le récit du combat en cours — **une seule fois**.
     *
     * C'est le seul événement de combat de nature `chronique`, donc le seul que
     * le résumé par IA reçoive. Il n'était produit que par `clearCombatants`,
     * derrière le bouton rouge de réinitialisation : terminer un combat par le
     * bouton « Fin de combat » n'en laissait aucune trace narrative.
     */
    consignerLeCombat: () => void;
    /**
     * Le combat courant a déjà son récit au journal.
     *
     * Évite le doublon quand le meneur termine son combat puis vide le plateau.
     * Retombe à `false` quand le plateau repart à zéro.
     */
    dejaConsigne: boolean;
    /**
     * Ce que chaque combattant a encaissé pendant CE combat, par identifiant.
     *
     * **Décision de David du 2026-08-18** : le détail des coups ne doit pas
     * entrer dans le résumé, mais le récit du combat doit en tenir compte pour
     * raconter quelque chose d'intéressant. On agrège donc au fil de l'eau —
     * quatre nombres par combattant — au lieu d'envoyer trente lignes de trace
     * au modèle.
     */
    faitsDArmes: Record<string, FaitsDArmes>;
    /**
     * Compte un coup au crédit du combattant visé.
     *
     * **Accepte l'identifiant du combattant ou celui de sa fiche** — entité de
     * la Galerie ou personnage joueur. Les dégâts arrivent par deux chemins qui
     * ne désignent pas leur cible de la même façon : le pupitre du tracker
     * (`applyDamage`, identifiant de combattant) et le panneau de santé de
     * Session-OS (`handleApplyImpact`, identifiant de fiche). Une seule porte
     * d'entrée évite d'avoir à choisir laquelle des deux compte vraiment.
     *
     * Un coup porté hors combat ne compte pour personne, et c'est sans effet.
     */
    noterUnCoup: (cibleId: string, impact: { value: number; isRecovery?: boolean }) => void;

    /**
     * Le plateau apprend ce que la fiche vient de subir.
     *
     * **Le retour qui manquait, trouvé le 2026-08-19 en relisant une vraie
     * séance.** `syncCombatantToSession` pousse le combattant *vers* la fiche,
     * et rien ne faisait le chemin inverse : le panneau de santé de Session-OS
     * soignait un personnage sans que le plateau l'apprenne. Deux conséquences,
     * toutes deux vues dans le journal du 19/08 :
     *
     * - **Le récit de fin de combat mentait sur l'état de chacun**, puisqu'il
     *   lit le plateau : « AL SIMPSON 8/10 » quand le fil disait 0/10.
     * - **Les soins étaient annulés.** Le prochain `syncCombatantToSession` —
     *   un statut posé, le bouton « Sync HP », ou « Fin de combat » — réécrivait
     *   les points de vie périmés du plateau par-dessus la fiche. D'où trois
     *   `Récupère **1** — 1/4` d'affilée, sur un personnage qui ne remontait
     *   jamais.
     *
     * *Une synchronisation à sens unique entre deux copies d'une même donnée
     * n'est pas une synchronisation : c'est un écrasement périodique.*
     *
     * Ne resynchronise rien en retour, délibérément : la fiche est déjà à jour,
     * c'est elle qui appelle, et repartir vers elle fermerait la boucle.
     */
    refleterLaFiche: (
        cibleId: string,
        sante: { hp?: number; healthSystem?: HealthSystem },
    ) => void;

    // Initiative
    /** Définit manuellement l'initiative d'un combattant */
    setInitiative: (id: string, init: number) => void;
    /** Trie la liste par initiative */
    sortInitiative: (ascending?: boolean) => void;
    /** Lance l'initiative automatique pour tous les combattants via DiceEngine ou formules */
    rollAutoInitiative: (params: { diceMax?: number; formula?: string; resolver?: (name: string, combatant: Combatant) => number; sortOrder?: 'asc' | 'desc'; cards?: number }) => void;
    /** Réordonne manuellement les combattants (ex: via Drag & Drop) */
    reorderCombatants: (startIndex: number, endIndex: number) => void;

    // Turns
    /** Passe au tour suivant et réduit la durée des effets d'état */
    nextTurn: () => void;
    /** Revient au tour précédent */
    prevTurn: () => void;
    /**
     * Désigne directement le combattant actif.
     *
     * Ce que `nextTurn` ne sait pas faire : il avance d'un cran dans une liste
     * triée. Quand l'ordre d'action n'est pas un classement — l'alternance de
     * Dune, où le camp actif choisit son intervenant — c'est le seul geste qui
     * ait un sens.
     */
    setCurrentTurnTo: (combatantId: string) => void;
    /** Réinitialise les rounds et les initiatives sans vider la liste */
    resetCombat: () => void;

    // Statuses
    /** Ajoute un effet d'état à un combattant (gère les conflits automatiques) */
    addStatus: (combatantId: string, status: Omit<StatusEffect, 'id'>) => void;
    /** Retire un effet d'état spécifique */
    removeStatus: (combatantId: string, statusId: string) => void;
    /** Active/Désactive la projection sur le Player Hub */
    setIsCombatProjected: (projected: boolean) => void;

    // Sync
    /** Synchronise les PV actuels des combattants vers Session-OS (Persistance) */
    syncCombatantHPToSession: () => void;
    /** Synchronise un combattant spécifique vers Session-OS */
    syncCombatantToSession: (id: string) => void;
    /** Propage les états critiques (mort, etc.) vers Session-OS */
    propagateStatusToSession: () => void;
    /** Envoie l'état actuel du combat vers les écrans distants via le Bridge */
    broadcastSync: () => void;
    
    // Damage/Heal
    /** Applique des dégâts ou des soins à un groupe de cibles (gère résistances/vulnérabilités) */
    applyDamage: (amount: number, type: string, targetIds: string[]) => void;
    /** Définit la cible prioritaire d'un participant */
    setTarget: (combatantId: string, targetId: string | null) => void;
    
    // Snapshot System
    /** Restaure l'état du combat à partir d'un snapshot de session */
    applySnapshot: (snapshot: { combatants: Combatant[]; currentTurnIdx: number; round: number }) => void;
    /** Réinitialise complètement le store */
    reset: () => void;

    /* ---- Le combat et sa scène, depuis le 2026-08-17 -------------------- */

    /**
     * Rattache le combat courant à une scène, et y fait entrer ses personnages.
     *
     * Les PJ de la scène rejoignent le plateau **s'ils n'y sont pas déjà** :
     * c'est la moitié du geste, puisque la scène sait qui est présent et que le
     * meneur vient de les y placer.
     */
    rattacherLeCombat: (sceneId: string) => void;
    /**
     * Gare le plateau courant sous sa scène, et restaure celui de la scène visée.
     *
     * Un plateau vide est un état légitime — la scène rejointe n'a pas encore eu
     * de combat. On ne fabrique rien.
     */
    basculerVersLaScene: (sceneId: string) => void;
}

export const useCombatStore = create<CombatState>()(
    persist(
        (set, get) => ({
            combatants: [],
            currentTurnIdx: 0,
            round: 1,
            isCombatProjected: true,
            sceneId: null,
            combatsGares: {},
            dejaConsigne: false,
            faitsDArmes: {},

            noterUnCoup: (cibleId, impact) => {
                const cible = get().combatants.find(c =>
                    c.id === cibleId || c.sourceEntityId === cibleId || c.sourcePlayerId === cibleId);
                if (!cible) return;

                set((state) => ({
                    faitsDArmes: {
                        ...state.faitsDArmes,
                        [cible.id]: ajouterUnCoup(state.faitsDArmes[cible.id], impact),
                    },
                }));
            },

            refleterLaFiche: (cibleId, sante) => {
                // Même triple correspondance que `noterUnCoup` : les deux
                // chemins ne désignent pas leur cible de la même façon.
                const cible = get().combatants.find(c =>
                    c.id === cibleId || c.sourceEntityId === cibleId || c.sourcePlayerId === cibleId);
                if (!cible) return;

                set((state) => ({
                    combatants: state.combatants.map(c => c.id === cible.id
                        ? {
                            ...c,
                            // Une fiche sans jauge ne doit pas inventer un `0`
                            // sur le plateau : chaque moitié ne s'écrit que si
                            // elle existe.
                            ...(typeof sante.hp === 'number' ? { hp: sante.hp } : {}),
                            ...(sante.healthSystem ? { healthSystem: sante.healthSystem } : {}),
                        }
                        : c),
                }));
            },

            rattacherLeCombat: (sceneId) => {
                set({ sceneId });
                /*
                  **Les PJ de la scène entrent sur le plateau.** La scène sait
                  qui est présent — le meneur vient de le poser —, et le lui
                  redemander combattant par combattant serait lui faire saisir
                  deux fois la même chose. On n'ajoute que les absents : un
                  personnage déjà engagé garde ses points de vie et son
                  initiative.
                */
                const perso = personnagesDeLaScene(sceneId);
                const dejaLa = new Set(get().combatants.map(c => c.sourcePlayerId).filter(Boolean));
                for (const pj of perso) {
                    if (dejaLa.has(pj.id)) continue;
                    /*
                      **Pas de cast ici, et c'est délibéré.** La première version
                      écrivait `as unknown as Omit<Combatant, 'id'>` sur un objet
                      qui disait `initiative` au lieu d'`init`, `portraitUrl` au
                      lieu d'`avatar`, et **oubliait `statuses`** — d'où le
                      « Cannot read properties of undefined (reading 'length') »
                      de `CombatCard`, tombé en séance chez David le 2026-08-17.

                      Le compilateur savait. *Un cast qui force n'est pas un
                      raccourci : c'est une vérification qu'on éteint, et elle
                      s'éteint exactement là où on se trompe.*
                    */
                    get().addCombatant({
                        name: pj.name,
                        init: 0,
                        isPlayer: true,
                        faction: 'player',
                        statuses: [],
                        sourcePlayerId: pj.id,
                        avatar: pj.portraitUrl,
                    });
                }
            },

            basculerVersLaScene: (sceneId) => {
                const { sceneId: courante, combatants, currentTurnIdx, round, combatsGares, dejaConsigne, faitsDArmes } = get();
                if (courante === sceneId) return;

                /*
                  On gare avant de restaurer, sinon le plateau courant serait
                  écrasé par celui qu'on rejoint et perdu sans un mot. Un plateau
                  vide sans scène n'a rien à garer.
                */
                const gares = { ...combatsGares };
                if (courante) {
                    // Le « déjà raconté » et les compteurs de coups se garent AVEC
                    // leur plateau : ce sont des faits de ce combat-là, pas de la
                    // session.
                    gares[courante] = {
                        combatants, currentTurnIdx, round, carte: releverLaCarte(),
                        dejaConsigne, faitsDArmes,
                    };
                }

                const repris = gares[sceneId];
                set({
                    sceneId,
                    combatants: repris?.combatants ?? [],
                    currentTurnIdx: repris?.currentTurnIdx ?? 0,
                    round: repris?.round ?? 1,
                    combatsGares: gares,
                    dejaConsigne: repris?.dejaConsigne ?? false,
                    faitsDArmes: repris?.faitsDArmes ?? {},
                });
                // Un plateau jamais joué n'a pas de carte à reposer : on laisse
                // celle qui est là plutôt que de vider l'écran de la table.
                reposerLaCarte(repris?.carte);
                get().broadcastSync();
            },

            applySnapshot: (snapshot) => {
                set({
                    combatants: snapshot.combatants,
                    currentTurnIdx: snapshot.currentTurnIdx,
                    round: snapshot.round
                });
                get().broadcastSync();
            },

            reset: () => {
                set({
                    combatants: [],
                    currentTurnIdx: 0,
                    round: 1,
                    // Un plateau vide n'appartient à aucune scène : garder le
                    // rattachement ferait entrer le combat SUIVANT dans le
                    // résumé de la scène précédente.
                    sceneId: null,
                });
                get().broadcastSync();
            },

            broadcastSync: async () => {
                if (typeof window === 'undefined') return;
                const bridge = (window as any).appBridge;
                if (!bridge?.remote?.sendSync) return;
                
                const { combatants, currentTurnIdx, round, isCombatProjected } = get();
                const { resolveToSendableUrl } = await import('../../utils/mediaResolver');

                const resolvedCombatants = (await Promise.all(
                    combatants.map(async (c) => ({
                        ...c,
                        avatar: await resolveToSendableUrl(c.avatar)
                    }))
                )).filter(c => c.isPlayer || !c.statuses.some(s => {
                    const n = s.name.toLowerCase();
                    return n === 'invisible' || n === 'invisibilité' || n === 'caché' || n === 'hidden';
                }));
                
                bridge.remote.sendSync({
                    combat: { combatants: resolvedCombatants, currentTurnIdx, round, isCombatProjected }
                });
            },

            addCombatant: (combatant) => {
                /*
                  **La fiche du combattant, retrouvée si l'écran ne l'a pas
                  passée.** Huit écrans ajoutent des combattants ; un seul
                  connaît le pilote, et plusieurs ne transmettent que
                  `sourcePlayerId`. `CharacterGrid` est dans ce cas : il envoie
                  `hp` et `maxHp` sans `sheetData`, si bien que la tâche de
                  défaite de Dune — qui lit le seuil **sur la fiche** — n'avait
                  rien à lire pour un personnage joueur.

                  On complète ici plutôt que d'instruire huit appelants : c'est
                  la règle déjà tenue pour `healthSystem`.
                */
                const fiche = combatant.sheetData ?? ficheDuCombattant(combatant);

                /*
                  **Un combat commence quand le premier combattant arrive sur un
                  plateau vide** — il n'existe aucun autre signal dans ce store,
                  ni `startCombat` ni `isCombatActive`. C'est donc ici, et
                  seulement à ce moment-là, qu'une scène peut naître du combat.
                */
                const premierDuCombat = get().combatants.length === 0;

                set((state) => ({
                    combatants: [...state.combatants, {
                        ...combatant,
                        id: generateEffectId(),
                        faction: combatant.faction || (combatant.isPlayer ? 'player' : 'enemy'),
                        /*
                          **Le seul endroit qui garantisse l'invariant.** Huit
                          écrans ajoutent des combattants et `CombatCard` lit
                          `statuses.length` sans se protéger — à raison : un
                          combattant sans liste d'états est malformé, et rendre
                          le lecteur tolérant masquerait la prochaine
                          occurrence au lieu de la montrer. On complète donc au
                          goulot, comme pour `sheetData` et `healthSystem`.
                        */
                        statuses: combatant.statuses ?? [],
                        sheetData: fiche,
                        healthSystem: combatant.healthSystem ?? santeSelonLeSysteme(fiche),
                        // La santé de départ vient de la fiche quand le pilote
                        // dit où la lire. Sans formule, ou sans fiche, on garde
                        // ce que l'appelant a fourni : *on ne fait pas payer une
                        // nouveauté à l'existant.*
                        ...pointsDeVieDeDepart(combatant, fiche),
                    }]
                }));
                // Le rattachement suit l'ajout, jamais l'inverse : il peut lui
                // aussi ajouter des combattants (les PJ de la scène), et le
                // faire avant aurait rendu `premierDuCombat` faux.
                if (premierDuCombat && !get().sceneId) {
                    rattacherLeCombatQuiDemarre(id => get().rattacherLeCombat(id));
                }
                get().broadcastSync();
            },

            removeCombatant: (id) => {
                set((state) => {
                    const newCombatants = state.combatants.filter(c => c.id !== id);
                    let newIdx = state.currentTurnIdx;
                    const removedIdx = state.combatants.findIndex(c => c.id === id);
                    if (removedIdx < newIdx) {
                        newIdx = Math.max(0, newIdx - 1);
                    } else if (newIdx >= newCombatants.length) {
                        newIdx = 0;
                    }
                    return { combatants: newCombatants, currentTurnIdx: newIdx };
                });
                get().broadcastSync();
            },

            updateCombatant: (id, updates) => {
                set((state) => ({
                    combatants: state.combatants.map(c => c.id === id ? { ...c, ...updates } : c)
                }));
                get().syncCombatantToSession(id);
                get().broadcastSync();
            },

            /*
              **Le récit du combat, écrit une fois, par quelque porte qu'on sorte.**

              Il ne vivait que dans `clearCombatants` — c'est-à-dire derrière le
              bouton rouge **« Reset Combat »** et sa demande de confirmation
              « voulez-vous vraiment vider la liste des combattants ? ». Le bouton
              qui s'appelle **« Fin de combat »**, lui, exportait un événement de
              chronologie et ne touchait pas au journal.

              Conséquence exacte du défaut signalé par David le 2026-08-18 —
              *« les données de combat ne sont pas prises en compte dans le
              résumé »* : ce résumé de fin est **le seul événement de combat de
              nature `chronique`**, donc le seul que `generateAISummary` laisse
              passer. Terminer ses combats par le bouton qui dit « fin de
              combat » revenait à n'en jamais rien raconter au modèle.

              *Un artefact narratif accroché à l'action destructrice plutôt qu'à
              l'action d'achèvement n'est produit que par ceux qui détruisent.*

              `dejaConsigne` garde l'écriture unique : le meneur qui termine son
              combat **puis** vide le plateau ne doit pas obtenir deux récits du
              même combat.
            */
            consignerLeCombat: () => {
                const { combatants, round, sceneId, dejaConsigne, faitsDArmes } = get();
                if (combatants.length === 0 || dejaConsigne) return;

                const scene = sceneId
                    ? (magasinDeSeance()?.scenes ?? []).find(s => s.id === sceneId)
                    : undefined;

                const casualities = combatants.filter(estTombe);

                useJournalStore.getState().addEvent({
                    type: 'COMBAT',
                    /* Le seul événement de combat qui raconte : ce qui s'est
                       passé, qui est tombé, qui a survécu, et ce que chacun a
                       encaissé pour en arriver là. Son type est mécanique, sa
                       nature ne l'est pas. */
                    nature: 'chronique',
                    title: scene ? `Combat : ${scene.titre}` : 'Combat : Résumé de fin',
                    content: raconterLeCombat({
                        titreDeScene: scene?.titre,
                        round,
                        combattants: combatants,
                        faits: faitsDArmes,
                    }),
                    /*
                      **La scène est un champ de premier ordre, pas une entrée
                      de `metadata`.** Le § 9 du plan du 2026-08-08 l'exige, et
                      elle y voyageait depuis le 2026-08-17 : dette contractée
                      en même temps que le rattachement. Ce qui reste dans
                      `metadata` est bien accessoire — des compteurs qu'on relit
                      à l'oeil ; le lien vers la scène, lui, est structurel.
                    */
                    sceneId: sceneId ?? undefined,
                    metadata: {
                        round,
                        totalCombatants: combatants.length,
                        casualitiesCount: casualities.length,
                    }
                });

                set({ dejaConsigne: true });
            },

            clearCombatants: () => {
                // Vider sans avoir terminé reste une fin de combat : on consigne
                // avant de perdre le plateau, et la garde évite le doublon quand
                // « Fin de combat » vient d'être pressé.
                get().consignerLeCombat();

                const { sceneId } = get();

                /*
                  Le combat est fini : il ne reste pas garé. Sans ce nettoyage,
                  revenir à cette scène ressusciterait les morts d'un combat déjà
                  résumé au journal.
                */
                const gares = { ...get().combatsGares };
                if (sceneId) delete gares[sceneId];

                // Le plateau repart à zéro, donc le prochain combat est à écrire
                // et ses compteurs repartent vides.
                set({
                    combatants: [], currentTurnIdx: 0, round: 1, sceneId: null,
                    combatsGares: gares, dejaConsigne: false, faitsDArmes: {},
                });
                get().broadcastSync();
            },

            setInitiative: (id, init) => {
                set((state) => ({
                    combatants: state.combatants.map(c => c.id === id ? { ...c, init } : c)
                }));
                get().broadcastSync();
            },

            sortInitiative: (ascending = false) => {
                set((state) => {
                    const sorted = [...state.combatants].sort((a, b) => ascending ? a.init - b.init : b.init - a.init);
                    return { combatants: sorted, currentTurnIdx: 0 };
                });
                get().broadcastSync();
            },

            rollAutoInitiative: ({ diceMax = 20, formula, resolver, sortOrder = 'desc', cards }) => {
                set((state) => {
                    const combatants = state.combatants;
                    if (combatants.length === 0) {
                        gmToast("Aucun combattant dans la liste !", "warning");
                        return state;
                    }

                    const newCombatants = combatants.map(c => ({ ...c }));
                    let cardPool: number[] = [];
                    if (cards && cards > 0) {
                        cardPool = Array.from({ length: cards }, (_, i) => i + 1);
                        for (let i = cardPool.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
                        }
                    }

                    let cardIdx = 0;
                    newCombatants.forEach(c => {
                        let rolled = 0;
                        if (cardPool.length > 0) {
                            if (cardIdx < cardPool.length) rolled = cardPool[cardIdx++];
                            else rolled = Math.floor(Math.random() * (cards || 10)) + 1;
                        } else if (formula) {
                            rolled = resolveInitiativeFormula({
                                formula,
                                combatant: c,
                                resolver,
                                diceMax
                            });
                        } else {
                            rolled = Math.floor(Math.random() * diceMax) + 1;
                        }
                        c.init = Number.isNaN(rolled) ? 0 : rolled;
                    });

                    newCombatants.sort((a, b) => sortOrder === 'desc' ? b.init - a.init : a.init - b.init);
                    gmToast(`Initiative système lancée (${sortOrder === 'desc' ? 'Décroissant' : 'Croissant'})`, "success");
                    
                    useJournalStore.getState().addEvent({
                        type: 'COMBAT',
                        title: 'Combat : Initiative',
                        content: `Round ${state.round} - L'initiative a été tirée pour ${newCombatants.length} combattants.`,
                        sceneId: state.sceneId ?? undefined,
                        metadata: { round: state.round, count: newCombatants.length }
                    });

                    return { combatants: newCombatants, currentTurnIdx: 0 };
                });
                get().broadcastSync();
            },

            reorderCombatants: (startIndex, endIndex) => {
                set((state) => {
                    const result = Array.from(state.combatants);
                    const [removed] = result.splice(startIndex, 1);
                    result.splice(endIndex, 0, removed);
                    return { combatants: result };
                });
                get().broadcastSync();
            },

            nextTurn: () => {
                set((state) => {
                    if (state.combatants.length === 0) return state;
                    let nextIdx = state.currentTurnIdx + 1;
                    let nextRound = state.round;
                    if (nextIdx >= state.combatants.length) {
                        nextIdx = 0;
                        nextRound++;
                    }
                    const newCombatants = state.combatants.map((c, i) => {
                        if (i === nextIdx) {
                            return {
                                ...c,
                                statuses: processStatusDurations(c.statuses)
                            };
                        }
                        return c;
                    });
                    const activeCombatant = newCombatants[nextIdx];
                    if (activeCombatant && typeof window !== 'undefined') {
                        const bridge = (window as any).appBridge;
                        if (bridge && bridge.highlightMapToken) {
                            bridge.highlightMapToken(activeCombatant.name);
                        }
                    }
                    
                    const newState = { currentTurnIdx: nextIdx, round: nextRound, combatants: newCombatants };
                    return newState;
                });
                get().broadcastSync();
            },

            setCurrentTurnTo: (combatantId) => {
                set((state) => {
                    const idx = state.combatants.findIndex(c => c.id === combatantId);
                    if (idx < 0) return state;
                    // Même traitement des durées que `nextTurn` : un effet doit
                    // décroître parce qu'un tour commence, pas parce qu'on a
                    // cliqué sur un bouton plutôt qu'un autre.
                    const newCombatants = state.combatants.map((c, i) =>
                        i === idx ? { ...c, statuses: processStatusDurations(c.statuses) } : c
                    );
                    const actif = newCombatants[idx];
                    if (actif && typeof window !== 'undefined') {
                        const bridge = (window as any).appBridge;
                        if (bridge && bridge.highlightMapToken) {
                            bridge.highlightMapToken(actif.name);
                        }
                    }
                    return { currentTurnIdx: idx, combatants: newCombatants };
                });
                get().broadcastSync();
            },

            prevTurn: () => {
                set((state) => {
                    if (state.combatants.length === 0) return state;
                    let prevIdx = state.currentTurnIdx - 1;
                    let prevRound = state.round;
                    if (prevIdx < 0) {
                        prevIdx = state.combatants.length - 1;
                        prevRound = Math.max(1, prevRound - 1);
                    }
                    const activeCombatant = state.combatants[prevIdx];
                    if (activeCombatant && typeof window !== 'undefined') {
                        const bridge = (window as any).appBridge;
                        if (bridge && bridge.highlightMapToken) {
                            bridge.highlightMapToken(activeCombatant.name);
                        }
                    }
                    return { currentTurnIdx: prevIdx, round: prevRound };
                });
                get().broadcastSync();
            },

            resetCombat: () => {
                set((state) => ({
                    currentTurnIdx: 0,
                    round: 1,
                    combatants: state.combatants.map(c => ({ ...c, init: 0 }))
                }));
                get().broadcastSync();
            },

            addStatus: (combatantId, status) => {
                set((state) => {
                    return {
                        combatants: state.combatants.map(c => {
                            if (c.id === combatantId) {
                                const filteredStatuses = filterConflictingStatuses(c.statuses, status.name);
                                return {
                                    ...c,
                                    statuses: [...filteredStatuses, { ...status, id: generateEffectId() }]
                                };
                            }
                            return c;
                        })
                    };
                });
                get().syncCombatantToSession(combatantId);
                get().broadcastSync();
            },

            removeStatus: (combatantId, statusId) => {
                set((state) => ({
                    combatants: state.combatants.map(c => {
                        if (c.id === combatantId) {
                            return { ...c, statuses: c.statuses.filter(s => s.id !== statusId) };
                        }
                        return c;
                    })
                }));
                get().syncCombatantToSession(combatantId);
                get().broadcastSync();
            },

            setIsCombatProjected: (projected: boolean) => {
                set({ isCombatProjected: projected });
                get().broadcastSync();
            },

            syncCombatantToSession: (id: string) => {
                const combatant = get().combatants.find(c => c.id === id);
                if (!combatant) return;

                const sessionStore = (window as unknown as { useSessionOSStore?: { getState: () => SessionOSState } }).useSessionOSStore?.getState();
                if (!sessionStore) return;

                // 1. Sync HP — seulement s'il y a des PV à synchroniser. Sans
                //    jauge, écrire un 0 dans la fiche inventerait une blessure.
                const pv = combatant.hp;
                if (combatant.isPlayer && combatant.sourcePlayerId) {
                    if (typeof pv === 'number') {
                        sessionStore.players.forEach((p: Player) => {
                            const char = p.characters.find((char: PlayerCharacter) => char.id === combatant.sourcePlayerId);
                            if (char) sessionStore.updateCharacterHP(p.id, char.id, pv);
                        });
                    }
                } else if (!combatant.isPlayer && combatant.sourceEntityId) {
                    if (typeof pv === 'number' && typeof sessionStore.updateEntityHP === 'function') {
                        sessionStore.updateEntityHP(combatant.sourceEntityId, pv);
                    }
                    
                    // 2. Sync Narrative & Status
                    const isMort = combatant.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀');
                    const entityUpdates: Partial<Entity> = {
                        status: isMort ? 'dead' : 'alive',
                        roleplayingNotes: combatant.roleplayingNotes,
                        gmSecretInfo: combatant.gmSecretInfo
                    };
                    
                    if (typeof sessionStore.updateEntity === 'function') {
                        sessionStore.updateEntity(combatant.sourceEntityId, entityUpdates);
                    }
                }
            },

            syncCombatantHPToSession: () => {
                const { combatants } = get();
                combatants.forEach(c => get().syncCombatantToSession(c.id));
            },

            propagateStatusToSession: () => {
                const { combatants } = get();
                const sessionStore = (window as unknown as { useSessionOSStore?: { getState: () => SessionOSState } }).useSessionOSStore?.getState();
                if (!sessionStore) return;
                combatants.forEach(c => {
                    const isMort = c.statuses.some(s => s.name.toLowerCase() === 'mort' || s.icon === '💀');
                    if (isMort && !c.isPlayer && c.sourceEntityId) {
                        if (typeof sessionStore.updateEntity === 'function') {
                            sessionStore.updateEntity(c.sourceEntityId, { status: 'dead' });
                            gmToast(`${c.name} marqué comme MORT dans la Galerie.`, "info");
                            useJournalStore.getState().addEvent({
                                type: 'NPC',
                                title: `Décès : ${c.name}`,
                                content: `Le PNJ **${c.name}** a été marqué comme **MORT** suite au combat (Combat-OS).`,
                                sceneId: get().sceneId ?? undefined,
                                metadata: { entityId: c.sourceEntityId }
                            });
                        }
                    }
                });
            },

            applyDamage: (amount, type, targetIds) => {
                const coupsPortes: [string, number][] = [];
                set((state) => {
                    const newCombatants = state.combatants.map(c => {
                        if (!targetIds.includes(c.id)) return c;

                        // Calcul pur des conséquences (Moteur de règles)
                        const { finalAmount, newHp, statusToAdd } = calculateDamageImpact({ amount, type, target: c });

                        let newStatuses = [...c.statuses];
                        if (statusToAdd) {
                            const filtered = filterConflictingStatuses(newStatuses, statusToAdd.name);
                            newStatuses = [...filtered, { ...statusToAdd, id: generateEffectId() }];
                        }

                        /**
                         * **Le système de santé suit enfin les dégâts.**
                         *
                         * `HealthInterpreter` sait remplir une horloge, cocher une
                         * case, descendre un palier de blessure — cinq modèles,
                         * purs et testés. Rien ne l'appelait ici : on n'écrivait
                         * que `hp`, si bien qu'un combattant à horloges encaissait
                         * des coups sans que son horloge ne bouge. Le modèle
                         * existait, il n'était pas branché.
                         *
                         * Les résistances ont déjà été appliquées ci-dessus, par
                         * les listes du combattant. On ne transmet donc pas le
                         * `type` : `processResistances` les rejouerait depuis les
                         * étiquettes de la fiche de santé, et un coup de feu
                         * résisté serait divisé deux fois.
                         */
                        const healthSystem = c.healthSystem
                            ? HealthInterpreter.calculateNextState(c.healthSystem, {
                                value: Math.abs(finalAmount),
                                isRecovery: finalAmount < 0,
                            })
                            : c.healthSystem;

                        /*
                          Le coup est compté APRÈS résistances : c'est ce que le
                          combattant a réellement pris, et c'est ce nombre-là que
                          le récit de fin de combat doit annoncer.
                        */
                        coupsPortes.push([c.id, finalAmount]);

                        return { ...c, hp: newHp, healthSystem, statuses: newStatuses };
                    });
                    return { combatants: newCombatants };
                });

                // Hors du calcul d'état : `noterUnCoup` écrit lui-même dans le
                // store, et le faire pendant une mise à jour reviendrait à muter
                // pendant qu'on se met à jour.
                coupsPortes.forEach(([id, valeur]) => get().noterUnCoup(id, { value: valeur }));

                /*
                  **Le pupitre écrit sa trace, lui aussi.**

                  Il ne l'écrivait pas : seul le panneau de santé de Session-OS
                  consignait ses impacts. Le fil du 19/08 le montre en creux —
                  AL SIMPSON y passe de 9/10 à 2/10 sans une seule ligne entre
                  les deux, et les compteurs du récit voyaient des coups dont le
                  journal n'avait aucune trace. *Deux chemins vers la même
                  donnée, un seul qui la raconte.*

                  Écrit après le `set` : la ligne dit l'état d'arrivée, il faut
                  donc relire le combattant une fois le coup appliqué.
                */
                coupsPortes.forEach(([id, valeur]) => {
                    const c = get().combatants.find(x => x.id === id);
                    if (!c) return;
                    const soin = valeur < 0;
                    useJournalStore.getState().addEvent({
                        type: 'COMBAT',
                        title: i18next.t('modules:session.events.impact_title', { name: c.name }),
                        // Le type de dégâts ne se dit que sur une blessure : « Récupère
                        // 2 (balistique) » n'aurait aucun sens.
                        content: raconterLImpact(
                            { value: Math.abs(valeur), isRecovery: soin, ...(soin ? {} : { type }) },
                            c,
                        ),
                        sceneId: get().sceneId ?? undefined,
                    });
                });

                // Synchronisation différée pour la stabilité
                targetIds.forEach(id => get().syncCombatantToSession(id));
                get().broadcastSync();
            },

            setTarget: (combatantId, targetId) => {
                set((state) => ({
                    combatants: state.combatants.map(c => 
                        c.id === combatantId ? { ...c, targetId: targetId || undefined } : c
                    )
                }));
                get().broadcastSync();
            }
        }),
        {
            name: 'gmos-combat-storage',
            /*
              **Réparer ce qui est DÉJÀ écrit.**

              Le 2026-08-17, un combattant sans `statuses` est parti en
              stockage — `CombatCard` lit `statuses.length` et l'écran plantait
              **au démarrage**, avant même qu'on puisse vider le combat. Poser
              l'invariant dans `addCombatant` protège les suivants ; il
              n'atteint pas ce qui est déjà sur le disque. *Une garantie posée
              en écriture ne dit rien des données écrites avant elle.*

              On répare donc à la lecture, plateau courant **et combats garés** —
              ces derniers portent des combattants de la même origine, et un
              plateau repris planterait exactement pareil.

              On ne rend pas `CombatCard` tolérant pour autant : un combattant
              sans liste d'états reste malformé, et masquer le symptôme au
              lecteur cacherait la prochaine occurrence au lieu de la montrer.
            */
            merge: (persiste, courant) => {
                const p = (persiste ?? {}) as Partial<CombatState>;
                const reparer = (liste: Combatant[] | undefined) =>
                    (liste ?? []).map(c => ({ ...c, statuses: c.statuses ?? [] }));

                return {
                    ...courant,
                    ...p,
                    combatants: reparer(p.combatants),
                    combatsGares: Object.fromEntries(
                        Object.entries(p.combatsGares ?? {}).map(([sceneId, gare]) => [
                            sceneId,
                            { ...gare, combatants: reparer(gare?.combatants) },
                        ]),
                    ),
                };
            },
            partialize: (state) => ({
                combatants: state.combatants,
                round: state.round,
                currentTurnIdx: state.currentTurnIdx,
                isCombatProjected: state.isCombatProjected,
                // Le rattachement et les combats garés survivent au
                // rechargement : un combat qu'on reprend le lendemain doit
                // retrouver sa scène, sinon il n'entrera dans aucun résumé.
                sceneId: state.sceneId,
                combatsGares: state.combatsGares,
                // Sinon un rechargement en pleine séance rendrait racontable un
                // combat déjà raconté, et effacerait ce qu'il a coûté.
                dejaConsigne: state.dejaConsigne,
                faitsDArmes: state.faitsDArmes,
            })
        }
    )
);

// Export for cross-store access (safe window cast)
if (typeof window !== 'undefined') {
    (window as unknown as { useCombatStore: typeof useCombatStore }).useCombatStore = useCombatStore;
}
