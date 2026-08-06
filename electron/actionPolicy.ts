import type { ClientRole } from './SyncServer';

/**
 * Politique d'autorisation des actions reçues du réseau.
 *
 * Le point 3 a réglé qui peut **recevoir** le flux non caviardé, le point 7 quels
 * types d'actions **existent**. Il manquait le croisement : qui a le droit de
 * déclencher quoi. Sans lui, une tablette non appairée peut effacer le tableau
 * blanc en pleine scène ou faire avancer l'initiative.
 *
 * Le contrôle vit dans le process principal parce que lui seul connaît le rôle
 * réel d'une socket, établi à l'appairage. Le renderer ne voit qu'un message.
 */

/**
 * Ce qu'un client non privilégié a le droit d'émettre.
 *
 * Cette liste correspond exactement à ce que le Tablet Hub envoie aujourd'hui
 * (voir useHubSync). Refus par défaut pour tout le reste : les dés, le son, le
 * combat, le storyboard, les pads et le tableau blanc viennent de la
 * télécommande MJ, qui est appairée.
 */
export const PLAYER_ALLOWED_ACTIONS: ReadonlySet<string> = new Set([
    'session:send-message',
    'session:request-item-transfer',
    'session:remove-inventory-item',
    'session:submit-feedback',
    // Envoyée par le Tablet Hub juste après son enregistrement (useHubSync).
    // Elle ne demande que la rediffusion d'un état auquel le client a déjà
    // droit, caviardé selon son rôle : aucun gain de privilège.
    'remote:request-sync',
]);

/** Rôles qui peuvent tout déclencher — ceux qui ont présenté le secret d'appairage. */
const PRIVILEGED_ROLES: ReadonlySet<string> = new Set(['gm', 'remote']);

export function isPrivilegedRole(role: string | undefined): boolean {
    return !!role && PRIVILEGED_ROLES.has(role);
}

/**
 * Champ du payload désignant le personnage sur lequel porte l'action.
 *
 * Un joueur légitime ne doit pouvoir agir que sur le sien : sans ce contrôle,
 * il peut vider l'inventaire d'un autre ou parler en son nom.
 */
const OWNERSHIP_FIELD: Record<string, string> = {
    'session:remove-inventory-item': 'characterId',
    'session:request-item-transfer': 'fromCharId',
    'session:send-message': 'fromId',
};

export type DenialReason = 'role' | 'ownership';

export interface PolicyVerdict {
    allowed: boolean;
    reason?: DenialReason;
    /** Détail journalisable côté MJ ; jamais renvoyé à l'émetteur. */
    detail?: string;
}

const ALLOWED: PolicyVerdict = { allowed: true };

/**
 * Décide si un client peut déclencher une action.
 *
 * @param characterId Personnage associé au client dans le registre de session,
 *                    ou undefined s'il n'en a pas choisi.
 */
export function evaluateAction(
    type: string,
    payload: unknown,
    role: ClientRole | undefined,
    characterId: string | undefined
): PolicyVerdict {
    // Un rôle privilégié a présenté le secret d'appairage : c'est le MJ, ou sa
    // télécommande. Il agit légitimement sur n'importe quel personnage.
    if (isPrivilegedRole(role)) return ALLOWED;

    if (!PLAYER_ALLOWED_ACTIONS.has(type)) {
        return { allowed: false, reason: 'role', detail: `'${type}' est réservé aux rôles appairés` };
    }

    const field = OWNERSHIP_FIELD[type];
    if (!field) return ALLOWED;

    const target = (payload as Record<string, unknown> | null | undefined)?.[field];

    // Champ absent ou non textuel : rien à comparer, on laisse passer plutôt que
    // de casser une action dont le payload évoluerait.
    if (typeof target !== 'string' || target === '') return ALLOWED;

    // 'GM' n'est pas un personnage mais le destinataire ou l'émetteur MJ.
    if (target === 'GM') return ALLOWED;

    if (!characterId) {
        return {
            allowed: false,
            reason: 'ownership',
            detail: `client sans personnage tentant d'agir sur '${target}'`,
        };
    }

    if (target !== characterId) {
        return {
            allowed: false,
            reason: 'ownership',
            detail: `personnage '${characterId}' tentant d'agir sur '${target}'`,
        };
    }

    return ALLOWED;
}
