/**
 * Relais de messages entre les fenêtres locales, hébergé par le process principal.
 *
 * Il remplace progressivement le `BroadcastChannel` de `CrossWindowEventService`
 * (voir `documentation/Planning/2026-08-05-architecture-review-hardening.md`,
 * chantier « unification du transport »).
 *
 * Deux propriétés justifient le déplacement :
 *
 * - **La suppression d'écho est structurelle.** Le relais ne renvoie jamais un
 *   message à son émetteur. Le filtrage par `senderId` côté renderer, et les
 *   gardes anti-boucle qui l'accompagnent, n'ont plus de raison d'être sur les
 *   flux relayés.
 * - **Le process principal est le seul point qui voit toutes les fenêtres**, donc
 *   le seul qui puisse arbitrer — l'autorisation par rôle du point 9 pourra s'y
 *   appliquer, ce que le `BroadcastChannel` ne permettait pas.
 *
 * **Le message est une chaîne, jamais un objet.** La mesure du 2026-08-06
 * (`scripts/ipc-bench/`) a montré que le coût de la sérialisation d'Electron suit
 * le nombre de nœuds d'objet traversés : 106 Ko de tracés du tableau blanc, soit
 * 4 882 nœuds, coûtaient +19 ms par rapport au `BroadcastChannel`, quand les mêmes
 * 106 Ko en une seule chaîne n'en coûtaient que +0,1. Transmettre du JSON déjà
 * sérialisé annule l'écart et le renverse. C'est une contrainte du transport, pas
 * un détail d'implémentation.
 */

import { evaluateRelay, type RelayRole } from './relayPolicy';

export const RELAY_PUBLISH_CHANNEL = 'relay:publish';
export const RELAY_MESSAGE_CHANNEL = 'relay:message';

/** Ce que le relais a besoin de savoir d'une fenêtre destinataire. */
export interface RelayTarget {
    /** Identifiant du `webContents`, comparé à celui de l'émetteur. */
    id: number;
    isDestroyed(): boolean;
    send(channel: string, message: string, senderRole: RelayRole): void;
}

/**
 * Diffuse un message à toutes les fenêtres sauf celle qui l'a émis.
 *
 * Le rôle de l'émetteur accompagne le message, en argument séparé plutôt que
 * dans la charge : il est ainsi établi par le process principal, hors de portée
 * de l'émetteur, et n'oblige personne à ouvrir le JSON pour le lire.
 *
 * @returns le nombre de fenêtres effectivement servies.
 */
export function relayToOthers(
    targets: RelayTarget[],
    senderId: number,
    message: string,
    senderRole: RelayRole = 'gm',
): number {
    let delivered = 0;

    for (const target of targets) {
        // Ne jamais renvoyer à l'émetteur : c'est ce qui rend la suppression
        // d'écho gratuite plutôt que reconstruite dans chaque renderer.
        if (target.id === senderId) continue;

        // Une fenêtre fermée entre-temps ferait lever `send()`. Une fenêtre
        // disparue ne doit pas empêcher les autres d'être servies.
        if (target.isDestroyed()) continue;

        try {
            target.send(RELAY_MESSAGE_CHANNEL, message, senderRole);
            delivered += 1;
        } catch {
            // Fenêtre détruite entre le test et l'envoi : sans conséquence.
        }
    }

    return delivered;
}

/** Ce que le relais attend d'`ipcMain`, réduit à ce qu'il utilise. */
export interface RelayIpc {
    on(
        channel: string,
        listener: (event: { sender: { id: number } }, type: unknown, message: unknown) => void,
    ): unknown;
}

/** De quoi le relais a besoin pour arbitrer, fourni par `electron/main.ts`. */
export interface RelayPolicyHooks {
    /** Rôle de la fenêtre émettrice, déduit de son `webContents.id`. */
    resolveRole(senderId: number): RelayRole;
    /** Refus journalisé. Voir `electron/auditLog.ts`. */
    onDenied?(role: RelayRole, type: string, detail: string): void;
}

/**
 * Branche le relais sur l'IPC.
 *
 * `listTargets` est réévalué à chaque message plutôt que capturé une fois : les
 * fenêtres du Player Hub et du projecteur vont et viennent, et un registre tenu
 * à la main se désynchroniserait.
 *
 * Le type voyage en argument séparé du corps sérialisé : la politique peut
 * ainsi arbitrer sans ouvrir le JSON, ce qui coûterait sur le flux le plus
 * chaud exactement ce que le passage à la chaîne avait fait gagner.
 */
export function installWindowRelay(
    ipc: RelayIpc,
    listTargets: () => RelayTarget[],
    policy: RelayPolicyHooks,
): void {
    ipc.on(RELAY_PUBLISH_CHANNEL, (event, type, message) => {
        // Le contrat est une chaîne. Un renderer qui enverrait un objet
        // contournerait la raison d'être du relais — on refuse plutôt que de
        // sérialiser à sa place, qui masquerait la régression de performance.
        if (typeof message !== 'string' || typeof type !== 'string') return;

        // Le contrôle précède TOUTE la logique de diffusion. Contrôler après
        // aurait laissé passer les messages usurpés : c'était le piège du
        // point 9.
        const role = policy.resolveRole(event.sender.id);
        const verdict = evaluateRelay(role, type);
        if (!verdict.allowed) {
            policy.onDenied?.(role, type, verdict.detail ?? '');
            return;
        }

        relayToOthers(listTargets(), event.sender.id, message, role);
    });
}
