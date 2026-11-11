import type { Player, PlayerCharacter, SessionMessage } from '../store/types';

/**
 * **À qui le meneur peut écrire, dans le Centre de liaison** — 11/11/2026.
 *
 * *David, capture à l'appui : « je ne vois pas tous les joueurs ».* La liste ne
 * gardait que les personnages des joueurs **en ligne**, plus ceux qui avaient
 * écrit ; un joueur hors ligne qui n'avait rien dit — même à qui l'on venait de
 * demander un jet — n'y était pas. Or un message à un absent n'est pas perdu :
 * le fil le rend à sa tablette quand elle se reconnecte.
 *
 * Donc : **tous les personnages de la campagne active**, en ligne ou non, puis
 * ceux du fil (qui a écrit, à qui le meneur a écrit), triés par nom.
 */
export interface DestinataireDuMeneur {
    id: string;
    name: string;
    enLigne: boolean;
}

/** Les adresses du fil qui ne sont pas un personnage. */
const PAS_UN_PERSONNAGE = new Set(['GM', 'all']);

export function destinatairesDuMeneur(
    players: readonly Player[],
    messages: readonly SessionMessage[],
    activeCampaignId: string | null | undefined,
): DestinataireDuMeneur[] {
    const parId = new Map<string, DestinataireDuMeneur>();
    for (const p of players) {
        for (const c of (p.characters ?? []) as PlayerCharacter[]) {
            if (c.campaignId !== activeCampaignId) continue;
            parId.set(c.id, { id: c.id, name: c.name, enLigne: !!p.isOnline });
        }
    }
    const ajouter = (id: string | undefined, name: string | undefined) => {
        if (!id || PAS_UN_PERSONNAGE.has(id) || parId.has(id)) return;
        parId.set(id, { id, name: name || id, enLigne: false });
    };
    for (const m of messages) {
        if (m.fromId !== 'GM') ajouter(m.fromId, m.fromName);
        else ajouter(m.toId, m.toName);
    }
    return [...parId.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
