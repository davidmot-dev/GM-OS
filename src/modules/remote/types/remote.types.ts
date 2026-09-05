import { type DrawingPath, type Point, type WhiteboardTool } from '../../whiteboard/useWhiteboardStore';
export type { DrawingPath, Point, WhiteboardTool };

import type { HealthSystem } from '../../../types/entity.types';
export type { HealthSystem };

/**
 * **Un seul type de santé, celui que le MJ produit.**
 *
 * Il y en avait deux. Celui-ci déclarait `'clock'` au singulier avec
 * `{ segments, maxSegments }`, quand `HealthInterpreter` produit `'clocks'` avec
 * `{ filled, segments }` ; et `'wounds'` portait un `currentLevel` textuel là où
 * le MJ écrit `{ levels, currentIndex }`. Deux des trois modèles affichés sur la
 * tablette ne pouvaient donc rien montrer — **sans erreur, sans trace**, parce
 * qu'un `type` qui ne correspond à rien ne rend simplement aucune branche.
 *
 * Le remède est structurel et vaut au-delà d'ici : *une asymétrie entre celui
 * qui écrit et celui qui lit est indétectable par construction tant qu'ils ne
 * partagent pas le type.* C'est déjà la règle de `corpusSysteme.ts` pour les
 * corpus ; c'en est l'application au transport.
 */
export interface RemoteCombatant {
    id: string;
    name: string;
    /**
     * Facultatifs comme sur le combattant du MJ, et pour la même raison : tous
     * les jeux ne comptent pas la santé en points. Les déclarer obligatoires ici
     * pendant qu'ils sont facultatifs là-bas recréerait exactement l'écart que
     * ce fichier vient de refermer.
     */
    hp?: number;
    hpMax?: number;
    init: number;
    isPlayer: boolean;
    healthSystem?: HealthSystem;
}

export interface RemoteSound {
    id: string;
    title: string;
    active: boolean;
}

export interface RemoteMoment {
    id: string;
    name: string;
}

export interface RemoteUniversalPad {
    id: string;
    type: 'music' | 'sound' | 'image' | 'ambient';
    label: string;
    sublabel?: string;
    color?: string;
    imageUrl?: string;
    isActive?: boolean;
}

import { type DiceConfig } from '../../../types/drivers';
import type { RemoteLectureDuMeneur } from '../segmentDeLecture';
import type { SessionMessage } from '../../../types/session.types';
import type { RollRecord } from '../hooks/useRemoteSync';

/**
 * **Ce qui joue en ce moment, pour la ligne d'état de la télécommande.**
 *
 * La tablette ne le savait pas : le flux portait les *pads* — ce qu'on peut
 * déclencher — et jamais l'état de lecture. Un meneur devait donc changer
 * d'onglet pour savoir si une musique tournait. *Une surface de contrôle qui ne
 * dit pas ce qui est en cours oblige à deviner ou à regarder l'écran du PC,
 * c'est-à-dire à cesser de s'en servir.*
 */
export interface RemoteLecture {
    /** Le morceau en cours sur l'une des deux platines, ou `null`. */
    musique: string | null;
    /** Le thème d'ambiance chargé, ou `null` s'il a été composé à la main. */
    ambiance: string | null;
    /** Combien de pistes d'ambiance jouent — vrai même sans thème nommé. */
    pistesDAmbiance: number;
}

/**
 * **Ce que les plafonds ont écarté.**
 *
 * La grille de pads est bornée — cinq morceaux, huit ambiances, douze images —
 * et elle tronquait **en silence** : un meneur avec trente favoris en voyait
 * douze sans qu'un mot le dise. *Une liste tronquée sans le dire se lit comme
 * une liste complète, et on cherche longtemps ce qui n'y est pas.*
 */
export interface RemoteComptesDePads {
    music: { montres: number; total: number };
    ambient: { montres: number; total: number };
    image: { montres: number; total: number };
}

export interface RemoteSyncData {
    sounds: RemoteSound[];
    moments: RemoteMoment[];
    masterVolume: number;
    combat: {
        combatants: RemoteCombatant[];
        currentTurnIdx: number;
        round: number;
    };
    notes: { 
        public: string; 
        private: string; 
    };
    whiteboard: {
        paths: DrawingPath[];
        activePath: DrawingPath | null;
        laserPointer: Point | null;
        backgroundMode: 'dark' | 'light';
        currentTool: WhiteboardTool;
        currentColor: string;
        currentWidth: number;
    };
    universalPads: RemoteUniversalPad[];
    /** Combien de pads chaque famille a produits, et combien ont été montrés. */
    comptesDePads?: RemoteComptesDePads;
    /** Ce qui joue en ce moment, pour la ligne d'état. */
    lecture?: RemoteLecture;
    /**
     * **Le fil de messages avec les joueurs.**
     *
     * Il n'arrivait pas jusqu'ici : le meneur voyait ses messages dans le
     * cockpit, la tablette n'en savait rien. Les **cinquante derniers**, parce
     * que *l'historique complet grossirait la charge à chaque diffusion* — la
     * raison qui écarte déjà l'historique des demandes de carte.
     */
    messages?: SessionMessage[];
    /**
     * **Ce que le meneur lit pendant qu'il joue** : la trame, le wiki, les
     * indices. Demandé par David le 2026-09-05 — l'onglet Notes ne portait que
     * deux champs de texte libre, et tout le reste vivait sur l'écran du PC.
     */
    lectureDuMeneur?: RemoteLectureDuMeneur;
    /**
     * **Le dernier jet du meneur.**
     *
     * ⚠️ Il **arrivait déjà** — le synchroniseur l'envoie depuis toujours — et
     * il n'était simplement pas déclaré ici. Pendant ce temps la tablette
     * guettait un message `dice:result` que **personne n'émet**, si bien que
     * son écran de résultat, cent vingt-cinq lignes, ne s'est jamais affiché.
     *
     * *Un destinataire sans expéditeur ne lève aucune erreur : il attend.*
     */
    dice?: {
        lastRoll: RollRecord | null;
        isDiceProjected: boolean;
        projectionTrigger: number;
    };
    /**
     * L'horloge du meneur.
     *
     * ⚠️ Ces champs **arrivaient déjà** — `useRemoteSync` recopie tout le
     * message —, ils n'étaient simplement pas déclarés ici, donc invisibles pour
     * qui lit le type. *Un transport qui porte plus que son contrat est un
     * transport dont personne ne sait ce qu'il porte.*
     */
    clock?: {
        timerRemaining: number;
        timerIsRunning: boolean;
    };
    session?: {
        /**
         * ⛔ **Déclaré et jamais envoyé.** Le synchroniseur envoie
         * `activeCampaignId` ; ce champ-ci n'a jamais été rempli, et personne
         * ne le lisait — ce qui est la seule raison pour laquelle ça n'a rien
         * cassé. *Troisième occurrence du même écart dans ce fichier, après les
         * trois champs du tableau blanc et le segment des dés.*
         *
         * Conservé le temps de vérifier qu'aucune tablette ancienne ne s'y fie,
         * et marqué facultatif pour que le type cesse de mentir.
         */
        campaignId?: string;
        /** La campagne ouverte chez le meneur — **c'est celui-ci qui arrive**. */
        activeCampaignId?: string | null;
        /**
         * Les joueurs et leurs personnages. Ils arrivaient déjà ; ils n'étaient
         * pas déclarés. Le strict nécessaire est typé ici — *déclarer tout ce
         * que le meneur envoie ferait de ce fichier une copie de son magasin.*
         */
        players?: {
            id: string;
            name?: string;
            characters?: { id: string; name: string; campaignId?: string }[];
        }[];
        activeDiceConfig: DiceConfig | null;
        /**
         * Ce jeu lance-t-il des **dés échelonnés** ?
         *
         * Envoyé comme une réponse et non comme une question : `dice.engine` ne
         * suffit pas à la poser — un pilote peut déclarer `jet.desEchelonnes` et
         * un moteur qui dit autre chose. Le meneur tranche, la tablette obéit.
         */
        desEchelonnes?: boolean;
    };
}

export type RemoteActionType = 
    | 'remote:register' 
    | 'remote:pad:trigger' 
    | 'remote:dice:roll' 
    | 'remote:dice:clear'
    | 'remote:sound:trigger' 
    | 'remote:sound:volume' 
    | 'remote:sound:stop-all'
    | 'remote:combat:next' 
    | 'remote:combat:hp' 
    | 'remote:story:trigger'
    | 'whiteboard:add-path'
    | 'whiteboard:set-active-path'
    | 'whiteboard:set-laser-pointer'
    | 'whiteboard:clear'
    | 'whiteboard:undo'
    | 'whiteboard:redo'
    | 'whiteboard:set-background'
    | 'whiteboard:set-tool'
    | 'whiteboard:set-color'
    | 'whiteboard:set-width'
    | 'session:update-character-narrative'
    /** Ce que la fiche HTML d'un joueur impose : champs du gabarit, notes, inventaire. */
    | 'session:update-character-sheet-data'
    | 'session:send-message'
    /** Le meneur parle depuis sa tablette — inscrit chez lui **et** diffusé aux joueurs. */
    | 'remote:session:gm-message'
    /*
      **Le coffre Obsidian, en question/réponse.** Il ne peut pas voyager dans la
      diffusion périodique : plus de deux mille notes, et la diffusion part
      jusqu'à deux fois par seconde. La tablette demande, le meneur répond — et
      **seulement aux tablettes de meneur**.
    */
    | 'remote:obsidian:lister'
    | 'remote:obsidian:lire';

export interface RemoteAction {
    type: RemoteActionType;
    payload: unknown;
}
