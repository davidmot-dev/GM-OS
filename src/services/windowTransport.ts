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
 * `clock` a été vérifié : tous les champs de son payload sont requis et de types
 * primitifs ou tableaux d'objets plats.
 */
export const RELAYED_TYPES: ReadonlySet<string> = new Set(['clock']);

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
