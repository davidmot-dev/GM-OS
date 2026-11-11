import { describe, it, expect } from 'vitest';
import { destinatairesDuMeneur } from './destinatairesDuMeneur';
import type { Player, SessionMessage } from '../store/types';

/**
 * Ce que ces essais protègent : David, 11/11/2026, « je ne vois pas tous les
 * joueurs » dans le Centre de liaison — seuls les joueurs en ligne et ceux qui
 * avaient écrit y figuraient.
 */

const pj = (id: string, name: string, campaignId = 'camp') => ({ id, name, campaignId });
const joueur = (id: string, isOnline: boolean, ...characters: ReturnType<typeof pj>[]) =>
    ({ id, realName: id, isOnline, characters }) as unknown as Player;
const message = (fromId: string, fromName: string, toId: string, toName: string) =>
    ({ id: `${fromId}-${toId}`, fromId, fromName, toId, toName, content: '…', timestamp: 1, isRead: true }) as SessionMessage;

describe('destinatairesDuMeneur', () => {
    it('tous les personnages de la campagne active, en ligne ou non, triés par nom', () => {
        const players = [
            joueur('j1', true, pj('pj-zoe', 'Zoé')),
            joueur('j2', false, pj('pj-ana', 'Ana'), pj('pj-ailleurs', 'Ailleurs', 'autre-campagne')),
        ];
        expect(destinatairesDuMeneur(players, [], 'camp')).toEqual([
            { id: 'pj-ana', name: 'Ana', enLigne: false },
            { id: 'pj-zoe', name: 'Zoé', enLigne: true },
        ]);
    });

    it('le fil ajoute qui a écrit et à qui le meneur a écrit, sans le meneur ni le canal global', () => {
        const fil = [
            message('pj-bob', 'Bob', 'GM', 'Maître du Jeu'),
            message('GM', 'Maître du Jeu', 'pj-cyd', 'Cyd'),
            message('GM', 'Maître du Jeu', 'all', 'Tous les joueurs'),
        ];
        expect(destinatairesDuMeneur([], fil, 'camp').map(d => d.id)).toEqual(['pj-bob', 'pj-cyd']);
    });

    it('un personnage de la campagne garde son nom et son état, même présent dans le fil', () => {
        const players = [joueur('j1', true, pj('pj-ana', 'Ana'))];
        expect(destinatairesDuMeneur(players, [message('pj-ana', 'ancien nom', 'GM', 'MJ')], 'camp'))
            .toEqual([{ id: 'pj-ana', name: 'Ana', enLigne: true }]);
    });
});
