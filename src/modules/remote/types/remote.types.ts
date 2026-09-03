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
    session?: {
        campaignId: string;
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
    | 'session:send-message';

export interface RemoteAction {
    type: RemoteActionType;
    payload: unknown;
}
