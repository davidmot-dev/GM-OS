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
    /*
      **La fiche du joueur, remplie sur sa tablette.**

      *Trouvé le 2026-08-29 en répondant à la question de David : « quand je fais
      une mise à jour sur la fiche HTML de la tablette, comment cela se
      répercute-t-il dans GM-OS ? »* La réponse était : pas du tout. Trois
      maillons manquaient d'un coup — l'écoute côté tablette, et cette
      autorisation-ci. Le joueur voyait pourtant sa saisie chez lui : *le chemin
      s'arrête avant le moteur, et rien ne se plaint.*

      `update-character-narrative` était dans le même cas depuis toujours : la
      description et les notes saisies sur une **vraie** tablette n'atteignaient
      pas le meneur. Le Player Hub s'en tirait par le pont Electron, ce qui rendait
      le défaut invisible tant qu'on essayait depuis la même machine.

      Les deux portent un `characterId` : le contrôle de propriété ci-dessous
      empêche un joueur d'écrire dans la fiche d'un autre.
    */
    'session:update-character-sheet-data',
    'session:update-character-narrative',
    // Envoyée par le Tablet Hub juste après son enregistrement (useHubSync).
    // Elle ne demande que la rediffusion d'un état auquel le client a déjà
    // droit, caviardé selon son rôle : aucun gain de privilège.
    'remote:request-sync',
    /*
      **La réserve commune se manipule par décision collective, et c'est une
      règle du jeu.** Chez Dune, l'Impulsion appartient aux joueurs : ils la
      dépensent à la table, sans passer par le meneur. La leur refuser ici
      reviendrait à décider que le meneur arbitre une réserve dont le livre dit
      qu'elle ne lui appartient pas.

      **Le contrôle fin n'est pas ici et ne peut pas y être.** Cette politique
      ne connaît ni les pilotes ni les réserves qu'ils déclarent. C'est
      `tableActions` qui vérifie que la réserve visée est bien déclarée
      manipulable par les joueurs — sans quoi un client ferait monter la Menace
      du meneur, qui est publique mais intouchable. Même partage que pour
      `stripProjectionTarget` : le rôle en amont, le champ en aval.
    */
    'table:ajuster',
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
    // Sans ces deux lignes, un joueur remplirait la fiche d'un autre depuis sa
    // propre tablette — et la fiche fait foi, donc GM-OS le croirait.
    'session:update-character-sheet-data': 'characterId',
    'session:update-character-narrative': 'characterId',
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
