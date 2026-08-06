/**
 * Choix du transport pour la synchronisation entre fenêtres locales.
 *
 * Deux chemins coexistent pendant la bascule (chantier « unification du
 * transport », voir `documentation/Planning/2026-08-05-architecture-review-hardening.md`) :
 *
 * - le `BroadcastChannel` historique, de renderer à renderer ;
 * - le relais du process principal (`electron/WindowRelay.ts`), qui deviendra
 *   le seul chemin.
 *
 * La bascule se fait **flux par flux** plutôt qu'en une fois : `RELAYED_TYPES`
 * énumère ce qui est déjà passé de l'autre côté. Tant qu'un type n'y figure pas,
 * il emprunte l'ancien chemin, inchangé.
 */

/** Enveloppe commune aux deux transports. */
export interface WindowMessage {
    type: string;
    payload?: unknown;
    senderId: string;
}

/**
 * Flux déjà relayés par le process principal.
 *
 * **Condition d'entrée dans cette liste :** le payload doit survivre à un
 * aller-retour JSON. Le `BroadcastChannel` utilise le clone structuré, qui
 * préserve `Map`, `Set`, `Date` et les clés valant explicitement `undefined` ;
 * `JSON` ne préserve rien de tout cela. Un flux qui transporterait l'un de ces
 * types doit être adapté avant d'être ajouté ici, pas ajouté puis débogué.
 *
 * **Comment le vérifier sans relire chaque champ :** un store persisté par
 * Zustand `persist` passe par `createJSONStorage`, donc son état subit déjà
 * l'aller-retour JSON à chaque sauvegarde. Si le payload diffusé est inclus dans
 * le `partialize` du store, sa compatibilité est acquise — une valeur qui n'y
 * survivrait pas serait déjà corrompue en persistance.
 *
 * - `clock` : persisté (`useClockStore`).
 * - `combat` : le `partialize` de `useCombatStore` est exactement les quatre
 *   champs diffusés.
 * - `map:lock` / `map:unlock` : le payload est `{ tokenId: string }`. Ce ne sont
 *   pas des flux d'état — ils ne viennent d'aucun store — mais un seul champ
 *   textuel ne pose évidemment pas de question de compatibilité.
 * - `map` : **le critère du `partialize` ne s'applique pas ici.** Les champs
 *   `projected*` sont explicitement exclus de la persistance de `useMapStore`
 *   (« Projections are NOT persisted to avoid massive performance drops »). Ils
 *   ont donc été vérifiés un par un : `projectedTokens` et `projectedDangerZones`
 *   dérivent de `tokens` et `dangerZones`, eux persistés ; `projectedFogDataUrl`
 *   est `string | null` ; `MapPing` et `MagicEffect` n'ont que des primitives.
 *   Aucun `Date`, `Map` ni `Set` dans `modules/map/types.ts`.
 * - `whiteboard` : `paths` est dans le `partialize` de `useWhiteboardStore`. Les
 *   champs volatils qu'il exclut sont soit du même type (`activePath` est un
 *   `DrawingPath`, comme les éléments de `paths`), soit des primitives.
 */
export const RELAYED_TYPES: ReadonlySet<string> = new Set([
    'clock',
    'combat',
    'map',
    'map:lock',
    'map:unlock',
    'whiteboard',
]);

/** Le relais du process principal est-il joignable depuis cette fenêtre ? */
export function isRelayAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.appBridge?.relay;
}

/**
 * Transport à deux chemins, choisi par type de message.
 *
 * Hors Electron — tablette en PWA, navigateur de développement — le relais
 * n'existe pas et tout retombe sur le `BroadcastChannel`.
 */
export class WindowTransport {
    private channel: BroadcastChannel;
    private detachRelay: (() => void) | null = null;
    private onMessage: (message: WindowMessage) => void;

    constructor(channelName: string, onMessage: (message: WindowMessage) => void) {
        this.onMessage = onMessage;
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = (event: MessageEvent) => {
            const message = event.data as WindowMessage | undefined;
            if (message && typeof message.type === 'string') this.onMessage(message);
        };

        const relay = typeof window !== 'undefined' ? window.appBridge?.relay : undefined;
        if (relay) {
            this.detachRelay = relay.onMessage((raw) => {
                const message = parseRelayMessage(raw);
                if (message) this.onMessage(message);
            });
        }
    }

    /**
     * Émet un message. Le transport est choisi par le type.
     *
     * Le relais ne renvoyant jamais rien à l'émetteur, un message relayé ne peut
     * pas revenir en écho — le filtrage par `senderId` reste néanmoins en place
     * côté réception, puisqu'il sert toujours à l'ancien chemin.
     */
    publish(message: WindowMessage): void {
        const relay = typeof window !== 'undefined' ? window.appBridge?.relay : undefined;

        if (relay && RELAYED_TYPES.has(message.type)) {
            // Sérialisé ici, et pas par le process principal : c'est la
            // condition de performance mesurée le 2026-08-06. Voir
            // electron/WindowRelay.ts.
            relay.publish(JSON.stringify(message));
            return;
        }

        this.channel.postMessage(message);
    }

    /** Ferme les deux chemins. Utilisé par les tests ; l'app vit avec un service unique. */
    close(): void {
        this.detachRelay?.();
        this.detachRelay = null;
        this.channel.onmessage = null;
        this.channel.close();
    }
}

/**
 * Décode un message venu du relais.
 *
 * Un JSON illisible est ignoré plutôt que propagé : il ferait lever la boucle de
 * réception, et un message perdu vaut mieux qu'une fenêtre qui cesse d'écouter.
 */
export function parseRelayMessage(raw: unknown): WindowMessage | null {
    if (typeof raw !== 'string') return null;

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') return null;

        const message = parsed as WindowMessage;
        if (typeof message.type !== 'string') return null;

        return message;
    } catch {
        return null;
    }
}
