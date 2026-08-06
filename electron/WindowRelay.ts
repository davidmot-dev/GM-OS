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

export const RELAY_PUBLISH_CHANNEL = 'relay:publish';
export const RELAY_MESSAGE_CHANNEL = 'relay:message';

/** Ce que le relais a besoin de savoir d'une fenêtre destinataire. */
export interface RelayTarget {
    /** Identifiant du `webContents`, comparé à celui de l'émetteur. */
    id: number;
    isDestroyed(): boolean;
    send(channel: string, message: string): void;
}

/**
 * Diffuse un message à toutes les fenêtres sauf celle qui l'a émis.
 *
 * @returns le nombre de fenêtres effectivement servies.
 */
export function relayToOthers(targets: RelayTarget[], senderId: number, message: string): number {
    let delivered = 0;

    for (const target of targets) {
        // Ne jamais renvoyer à l'émetteur : c'est ce qui rend la suppression
        // d'écho gratuite plutôt que reconstruite dans chaque renderer.
        if (target.id === senderId) continue;

        // Une fenêtre fermée entre-temps ferait lever `send()`. Une fenêtre
        // disparue ne doit pas empêcher les autres d'être servies.
        if (target.isDestroyed()) continue;

        try {
            target.send(RELAY_MESSAGE_CHANNEL, message);
            delivered += 1;
        } catch {
            // Fenêtre détruite entre le test et l'envoi : sans conséquence.
        }
    }

    return delivered;
}

/** Ce que le relais attend d'`ipcMain`, réduit à ce qu'il utilise. */
export interface RelayIpc {
    on(channel: string, listener: (event: { sender: { id: number } }, message: unknown) => void): unknown;
}

/**
 * Branche le relais sur l'IPC.
 *
 * `listTargets` est réévalué à chaque message plutôt que capturé une fois : les
 * fenêtres du Player Hub et du projecteur vont et viennent, et un registre tenu
 * à la main se désynchroniserait.
 */
export function installWindowRelay(ipc: RelayIpc, listTargets: () => RelayTarget[]): void {
    ipc.on(RELAY_PUBLISH_CHANNEL, (event, message) => {
        // Le contrat est une chaîne. Un renderer qui enverrait un objet
        // contournerait la raison d'être du relais — on refuse plutôt que de
        // sérialiser à sa place, qui masquerait la régression de performance.
        if (typeof message !== 'string') return;

        relayToOthers(listTargets(), event.sender.id, message);
    });
}
