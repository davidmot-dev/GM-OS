import type { Entity } from '../../../types/entity.types';
import type { ProfilVocal } from '../types';

/**
 * **Un personnage tel que Voice-OS a besoin de le connaître.**
 *
 * Trois chemins donnaient une voix à un PNJ, et aucun ne parlait la même langue :
 *
 * - le bouton de NPC-OS, qui passait une entité `NPCEntity` (`gmNotes`,
 *   `fields`) au profilage par IA ;
 * - la case « Sync PNJ », qui passait une entité de campagne (`description`,
 *   `roleplayingNotes`) à une recherche de mots-clés ;
 * - et la galerie de campagne, qui ne passait rien du tout, faute de bouton.
 *
 * Deux types différents pour la même idée, c'est la garantie que l'un des deux
 * dira un jour autre chose que l'autre — et c'est déjà arrivé : le PNJ de NPC-OS
 * pouvait garder sa voix, celui de la galerie la voyait recalculée puis écrasée
 * à chaque bascule de sélection.
 *
 * **`gmSecretInfo` n'entre pas dans les traits, et c'est délibéré.** Ce que le
 * modèle reçoit part chez le fournisseur actif, qui peut être distant. Les notes
 * de roleplay décrivent comment un personnage parle — c'est exactement la
 * question posée ; ses secrets ne servent pas à régler une hauteur de voix.
 */
export interface PersonnageAVoix {
    id: string;
    name: string;
    /** Ce qui décrit comment il parle — lu par l'IA et par les mots-clés. */
    notes: string;
    /** Les traits nommés, tels qu'ils seront énumérés au modèle. */
    traits: Record<string, string>;
    /** Sa voix déjà réglée, si elle a été enregistrée. */
    voiceProfile?: ProfilVocal;
}

/** Un PNJ de la galerie de campagne (`useSessionOSStore.entities`). */
export function depuisUnPnjDeCampagne(entite: Entity): PersonnageAVoix {
    return {
        id: entite.id,
        name: entite.name,
        notes: [entite.roleplayingNotes, entite.description].filter(Boolean).join('\n'),
        traits: {
            type: entite.type,
            role: entite.role,
            ...(entite.faction ? { faction: entite.faction } : {}),
        },
        voiceProfile: entite.voiceProfile,
    };
}

/** Un PNJ de NPC-OS (`useNPCStore.savedEntities`). */
export function depuisUnPnjDeNpcOs(entite: {
    id: string;
    name: string;
    gmNotes?: string;
    fields?: Record<string, string>;
    voiceProfile?: ProfilVocal;
}): PersonnageAVoix {
    return {
        id: entite.id,
        name: entite.name,
        notes: entite.gmNotes || '',
        traits: entite.fields || {},
        voiceProfile: entite.voiceProfile,
    };
}

/** Tout ce qu'on donne à lire, en un seul texte — pour les mots-clés. */
export function texteDuPersonnage(personnage: PersonnageAVoix): string {
    return [
        personnage.name,
        personnage.notes,
        ...Object.values(personnage.traits),
    ].filter(Boolean).join(' ').toLowerCase();
}
