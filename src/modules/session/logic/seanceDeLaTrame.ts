import type { GameSession } from '../../../types/session.types';

/**
 * La séance dont le graphe de la trame signale les scènes prévues.
 *
 * **Le graphe vit au niveau de la campagne**, une séance n'y est pas ouverte :
 * il faut donc en choisir une. La séance en cours d'abord — c'est celle qu'on
 * joue —, sinon la prochaine planifiée, la plus petite par son numéro. Une
 * séance close ne prévoit plus rien : elle ne compte jamais.
 *
 * ⚠️ **`activeSessionId` seul ne suffit pas** : il survit à la fin de séance.
 * D'où le double test, comme dans `CampaignCockpit`.
 */
export function seanceDeReferenceDeLaTrame(
    sessions: readonly GameSession[],
    campagne: { id: string; activeSessionId?: string } | undefined,
): GameSession | undefined {
    if (!campagne) return undefined;
    const siennes = sessions.filter(s => s.campaignId === campagne.id);
    return siennes.find(s => s.id === campagne.activeSessionId && s.status === 'active')
        ?? siennes.find(s => s.status === 'active')
        ?? siennes.filter(s => s.status === 'planned').sort((a, b) => a.number - b.number)[0];
}
