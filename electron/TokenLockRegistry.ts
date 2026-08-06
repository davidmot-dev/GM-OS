/**
 * Suivi des verrous de jetons, côté process principal.
 *
 * **Ce que ce registre ne fait pas.** Il n'arbitre pas l'octroi. `requestLock`
 * est appelé synchronement depuis `handlePointerDown`, et son résultat conditionne
 * le `stopPropagation()` qui suit : après un aller-retour IPC, l'événement aurait
 * déjà atteint le canvas de brouillard en dessous. L'octroi reste donc local et
 * optimiste dans chaque renderer, comme avant.
 *
 * **Ce qu'il apporte.** Le process principal est le seul point qui voit les
 * fenêtres disparaître. Il peut donc libérer les verrous d'une fenêtre fermée —
 * la seule partie du problème qui exige réellement une vue globale. Sans lui, un
 * Player Hub fermé en plein glisser-déposer immobilisait le jeton jusqu'à
 * l'expiration de cinq secondes ; le renderer, lui, ne peut pas distinguer une
 * fenêtre fermée d'une fenêtre lente.
 *
 * L'expiration de cinq secondes reste en place côté renderer, en filet.
 */

/** Verrou observé : qui le détient, et sous quelle identité côté renderer. */
export interface HeldLock {
    /** Identifiant du `webContents` détenteur, pour la libération à la fermeture. */
    windowId: number;
    /**
     * Identifiant d'instance du renderer, tel qu'il voyage dans l'enveloppe.
     * Réutilisé à la libération : les renderers filtrent les messages portant
     * leur propre `senderId`, et celui d'une fenêtre fermée n'appartient plus à
     * personne — le déverrouillage atteint donc bien tout le monde.
     */
    senderId: string;
}

export interface ReleasedLock extends HeldLock {
    tokenId: string;
}

export const LOCK_MESSAGE_TYPE = 'map:lock';
export const UNLOCK_MESSAGE_TYPE = 'map:unlock';

export class TokenLockRegistry {
    private locks = new Map<string, HeldLock>();

    /**
     * Observe un message relayé. Les types autres que verrou/déverrouillage sont
     * ignorés — ce registre est un spectateur du flux, pas un filtre.
     */
    observe(windowId: number, rawMessage: unknown): void {
        if (typeof rawMessage !== 'string') return;

        let message: { type?: unknown; payload?: unknown; senderId?: unknown };
        try {
            message = JSON.parse(rawMessage);
        } catch {
            return;
        }

        if (!message || typeof message !== 'object') return;

        const tokenId = (message.payload as { tokenId?: unknown } | undefined)?.tokenId;
        if (typeof tokenId !== 'string' || tokenId === '') return;

        if (message.type === LOCK_MESSAGE_TYPE) {
            // Un verrou déjà détenu est réattribué au dernier demandeur : le
            // registre reflète ce que les renderers ont décidé, il ne les arbitre pas.
            this.locks.set(tokenId, {
                windowId,
                senderId: typeof message.senderId === 'string' ? message.senderId : '',
            });
            return;
        }

        if (message.type === UNLOCK_MESSAGE_TYPE) {
            this.locks.delete(tokenId);
        }
    }

    /**
     * Retire et retourne tous les verrous détenus par une fenêtre.
     * Appelé quand elle se ferme.
     */
    releaseForWindow(windowId: number): ReleasedLock[] {
        const released: ReleasedLock[] = [];

        for (const [tokenId, held] of this.locks) {
            if (held.windowId === windowId) released.push({ tokenId, ...held });
        }

        for (const lock of released) this.locks.delete(lock.tokenId);

        return released;
    }

    /** Nombre de verrous suivis. Sert aux tests et au diagnostic. */
    get size(): number {
        return this.locks.size;
    }
}

/**
 * Construit le message de déverrouillage à diffuser pour un verrou libéré.
 *
 * L'enveloppe est identique à celle qu'aurait émise le renderer détenteur — même
 * type, même forme de payload, même `senderId` — pour que la réception ne
 * distingue pas un déverrouillage d'origine d'un déverrouillage de nettoyage.
 */
export function buildUnlockMessage(lock: ReleasedLock): string {
    return JSON.stringify({
        type: UNLOCK_MESSAGE_TYPE,
        payload: { tokenId: lock.tokenId },
        senderId: lock.senderId,
    });
}
