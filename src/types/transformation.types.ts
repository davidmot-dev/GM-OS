/**
 * **Ce qu'un personnage transformé garde de son autre vie** (§ 268, 21/11/2026).
 *
 * David : « je voudrais pouvoir transformer un PNJ en Personnage Joueur, et
 * vice-versa ». Un PJ et un PNJ partagent l'essentiel (fiche, santé, relations),
 * mais chacun porte des champs que l'autre n'a pas : le Sac à dos et la fiche
 * HTML d'un PJ, la voix et la CA d'un PNJ. Décision de David du 21/11 :
 * **« Gardées en réserve »** — ces champs restent rangés sur le personnage,
 * invisibles de l'autre côté, et reviennent au retour. Un aller-retour ne perd
 * rien.
 *
 * Seule écriture : `session/logic/transformationDuPersonnage.ts`. Les schémas
 * de sauvegarde sont en `.passthrough()` : le champ survit au redémarrage et à
 * l'export `.gmos` sans y être nommé.
 */
import type { Entity } from './entity.types';
import type { PlayerCharacter } from './player.types';

/** Les champs d'un PJ qu'un PNJ ne porte pas. */
export const CHAMPS_PROPRES_AU_PJ = [
    'systemId', 'classRace', 'tokenUrl', 'referenceDeFiche', 'ficheId', 'donneesModifieesLe',
    'playerNotes', 'linkedDocumentIds', 'inventory', 'inventoryItems', 'hubOptions',
] as const satisfies readonly (keyof PlayerCharacter)[];

/** Les champs d'un PNJ qu'un PJ ne porte pas. */
export const CHAMPS_PROPRES_AU_PNJ = [
    'type', 'role', 'status', 'ac', 'speed', 'initiative', 'roleplayingNotes', 'linkedMapIds',
    'sourceRef', 'isVisibleByPlayers', 'vuParLesJoueurs', 'voiceProfile',
] as const satisfies readonly (keyof Entity)[];

export interface ReserveDeTransformation {
    /** Ce qu'il avait comme personnage joueur, rangé pendant qu'il est PNJ. */
    pj?: Partial<Pick<PlayerCharacter, typeof CHAMPS_PROPRES_AU_PJ[number]>> & {
        /**
         * Il n'avait pas de points de vie : un PNJ en exige (`hp`, `maxHp` à 0, inertes),
         * un PJ peut s'en passer. Sans ce drapeau, il en gagnerait au retour.
         */
        sansPointsDeVie?: true;
    };
    /** Ce qu'il avait comme PNJ, rangé pendant qu'il est personnage joueur. */
    pnj?: Partial<Pick<Entity, typeof CHAMPS_PROPRES_AU_PNJ[number]>>;
}
