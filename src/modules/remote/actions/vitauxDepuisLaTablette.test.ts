import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayerCharacter } from '../../../types/player.types';

const { updateCharacterHP, addRemoteNotification, personnage } = vi.hoisted(() => ({
    updateCharacterHP: vi.fn(), addRemoteNotification: vi.fn(),
    personnage: { id: 'nel', name: 'Nel', hp: 9, maxHp: 12 } as PlayerCharacter,
}));
vi.mock('../../session/useSessionOSStore', () => ({
    useSessionOSStore: { getState: () => ({
        players: [{ id: 'joueur', realName: 'Joueur', characters: [personnage] }],
        updateCharacterHP, addRemoteNotification,
    }) },
}));
const { sessionActions } = await import('./sessionActions');
const contexte = { activeCampaignId: 'varn', sync: vi.fn() };
const appliquer = (hp: unknown, characterId = 'nel') => sessionActions['session:update-character-vitals']!({ playerId: 'joueur', characterId, updates: { hp } }, contexte);
beforeEach(() => { vi.clearAllMocks(); personnage.healthSystem = undefined; });

describe('les PV de la tablette rejoignent le meneur', () => {
    it('écrit la jauge et avertit le meneur sans rediffuser la demande', () => {
        const dispatch = vi.spyOn(window, 'dispatchEvent');
        appliquer(8);
        expect(updateCharacterHP).toHaveBeenCalledWith('joueur', 'nel', 8);
        expect(addRemoteNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'vitals_update', characterId: 'nel' }));
        expect(dispatch).not.toHaveBeenCalled();
        dispatch.mockRestore();
    });
    it.each([-100, 100])('borne la valeur %s à la jauge du personnage', hp => {
        appliquer(hp);
        expect(updateCharacterHP).toHaveBeenCalledWith('joueur', 'nel', hp < 0 ? 0 : 12);
    });
    it.each([NaN, Infinity, '8', undefined])('refuse une valeur mal formée (%s)', hp => {
        appliquer(hp);
        expect(updateCharacterHP).not.toHaveBeenCalled();
        expect(addRemoteNotification).not.toHaveBeenCalled();
    });
    it('ne crée pas une jauge dans un système de santé à états', () => {
        personnage.healthSystem = { type: 'wounds', state: 'healthy', data: { levels: ['Bien', 'Blessé'], currentLevel: 0 }, badges: [] };
        appliquer(8);
        expect(updateCharacterHP).not.toHaveBeenCalled();
    });
    it('ignore un personnage inconnu', () => {
        appliquer(8, 'inconnu');
        expect(updateCharacterHP).not.toHaveBeenCalled();
    });
});
