import type { InventoryItem, SessionFeedback, SessionMessage } from '../../session/store/types';
import type { SessionOSStore } from '../../session/store';

/** Les données reçues restent inconnues jusqu'à leur lecture ; aucun store dans ce module. */
export const estObjet = (valeur: unknown): valeur is Record<string, unknown> =>
    valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur);

const nombreFini = (valeur: unknown): valeur is number =>
    typeof valeur === 'number' && Number.isFinite(valeur);
const texteFacultatif = (valeur: unknown) => valeur === undefined || typeof valeur === 'string';

export type NarrationDistante = Parameters<SessionOSStore['updateCharacterNarrative']>[2];
export type FicheDistante = Parameters<SessionOSStore['remoteUpdateCharacterSheetData']>[2];

export function estObjetInventaire(valeur: unknown): valeur is InventoryItem {
    return estObjet(valeur)
        && ['id', 'name', 'type', 'rarity', 'description'].every(champ => typeof valeur[champ] === 'string')
        && nombreFini(valeur.weight) && nombreFini(valeur.quantity)
        && (valeur.value === undefined || nombreFini(valeur.value))
        && estObjet(valeur.properties)
        && Object.values(valeur.properties).every(propriete =>
            propriete === null || typeof propriete === 'string' || typeof propriete === 'boolean'
            || nombreFini(propriete) || typeof propriete === 'object');
}

export function estNarrationDistante(valeur: unknown): valeur is NarrationDistante {
    return estObjet(valeur)
        && ['description', 'gmNotes', 'playerNotes', 'inventory'].every(champ => texteFacultatif(valeur[champ]))
        && (valeur.linkedDocumentIds === undefined || (Array.isArray(valeur.linkedDocumentIds)
            && valeur.linkedDocumentIds.every(id => typeof id === 'string')));
}

export function estFicheDistante(valeur: unknown): valeur is FicheDistante {
    return estObjet(valeur)
        && ['description', 'playerNotes', 'inventory'].every(champ => texteFacultatif(valeur[champ]))
        && (valeur.sheetData === undefined || estObjet(valeur.sheetData))
        && (valeur.inventoryItems === undefined || (Array.isArray(valeur.inventoryItems)
            && valeur.inventoryItems.every(estObjetInventaire)));
}

export function estRetourDeSeance(valeur: unknown): valeur is SessionFeedback {
    return estObjet(valeur)
        && ['characterId', 'characterName', 'notes'].every(champ => typeof valeur[champ] === 'string')
        && ['funRating', 'storyRating', 'combatRating', 'timestamp'].every(champ => nombreFini(valeur[champ]));
}

export function estMessageDeSeance(valeur: unknown): valeur is SessionMessage {
    return estObjet(valeur)
        && ['id', 'fromId', 'fromName', 'toId', 'toName', 'content'].every(champ => typeof valeur[champ] === 'string')
        && nombreFini(valeur.timestamp) && typeof valeur.isRead === 'boolean';
}

export function estMiseAJourDePersonnage<T>(
    valeur: unknown, lire: (updates: unknown) => updates is T,
): valeur is { playerId: string; characterId: string; updates: T } {
    return estObjet(valeur) && typeof valeur.playerId === 'string'
        && typeof valeur.characterId === 'string' && lire(valeur.updates);
}
