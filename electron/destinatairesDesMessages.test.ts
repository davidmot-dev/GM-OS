import { describe, it, expect } from 'vitest';
import {
    estEntreJoueurs, filDuLecteur, lecteurDuRole, messagePourLeLecteur, type MessageAchemine,
} from './destinatairesDesMessages';

/*
  Le 11/10, première séance jouée : les messages entre joueurs disparaissaient.
  Le 12/10, la lecture du code a trouvé pire — chaque tablette recevait TOUS les
  messages privés et ne les cachait qu'à l'affichage.
*/
const msg = (fromId: string, toId: string | undefined, extra: Partial<MessageAchemine> = {}): MessageAchemine =>
    ({ fromId, toId, campaignId: 'c-1', timestamp: 1, ...extra });

const ALICE = { role: 'joueur' as const, characterId: 'alice' };
const BOB = { role: 'joueur' as const, characterId: 'bob' };
const CARL = { role: 'joueur' as const, characterId: 'carl' };
const MENEUR = { role: 'meneur' as const };

describe('destinatairesDesMessages — qui lit quoi', () => {
    it('un message de joueur à joueur ne va qu’aux deux joueurs', () => {
        const m = msg('alice', 'bob');
        expect(messagePourLeLecteur(m, ALICE)).toBe(true);
        expect(messagePourLeLecteur(m, BOB)).toBe(true);
        expect(messagePourLeLecteur(m, CARL), 'Carl lit ce qu’Alice dit à Bob').toBe(false);
    });

    it('⛔ le meneur ne voit pas ce que deux joueurs se disent (gardés mais cachés, 12/10)', () => {
        expect(estEntreJoueurs(msg('alice', 'bob'))).toBe(true);
        expect(messagePourLeLecteur(msg('alice', 'bob'), MENEUR)).toBe(false);
    });

    it('un message privé du meneur ne va qu’à son destinataire et au meneur', () => {
        const m = msg('GM', 'alice');
        expect(messagePourLeLecteur(m, ALICE)).toBe(true);
        expect(messagePourLeLecteur(m, BOB), 'Bob lit ce que le meneur dit à Alice').toBe(false);
        expect(messagePourLeLecteur(m, MENEUR)).toBe(true);
    });

    it('un message au meneur ne va qu’à son auteur et au meneur', () => {
        const m = msg('alice', 'GM');
        expect(messagePourLeLecteur(m, ALICE)).toBe(true);
        expect(messagePourLeLecteur(m, BOB)).toBe(false);
        expect(messagePourLeLecteur(m, MENEUR)).toBe(true);
    });

    it('un message à tous va à tout le monde — `all` comme sans destinataire', () => {
        for (const m of [msg('alice', 'all'), msg('GM', 'all'), msg('alice', undefined)]) {
            expect(messagePourLeLecteur(m, BOB)).toBe(true);
            expect(messagePourLeLecteur(m, MENEUR)).toBe(true);
        }
    });

    it('un écran sans personnage ne reçoit que les messages à tous', () => {
        const ecran = { role: 'joueur' as const };
        expect(messagePourLeLecteur(msg('alice', 'all'), ecran)).toBe(true);
        expect(messagePourLeLecteur(msg('GM', 'alice'), ecran)).toBe(false);
    });

    it('les rôles appairés sont le meneur ; les autres sont des joueurs', () => {
        expect(lecteurDuRole('gm')).toEqual(MENEUR);
        expect(lecteurDuRole('remote')).toEqual(MENEUR);
        expect(lecteurDuRole('hub', 'alice')).toEqual(ALICE);
        expect(lecteurDuRole('player', 'bob')).toEqual(BOB);
        expect(lecteurDuRole(undefined)).toEqual({ role: 'joueur', characterId: undefined });
    });
});

describe('filDuLecteur — le fil rendu à une tablette', () => {
    const fil = [
        msg('alice', 'bob', { timestamp: 3 }),
        msg('GM', 'alice', { timestamp: 1 }),
        msg('carl', 'all', { timestamp: 2 }),
        msg('GM', 'alice', { timestamp: 4, campaignId: 'c-2' }),
        msg('GM', 'alice', { timestamp: 5, campaignId: undefined }),
    ];

    it('rend les siens seulement, de la campagne demandée, dans l’ordre', () => {
        expect(filDuLecteur(fil, 'c-1', ALICE).map(m => m.timestamp)).toEqual([1, 2, 3]);
        expect(filDuLecteur(fil, 'c-1', CARL).map(m => m.timestamp)).toEqual([2]);
        expect(filDuLecteur(fil, 'c-1', MENEUR).map(m => m.timestamp)).toEqual([1, 2]);
    });

    it('ne rend rien sans campagne, ni un message qui n’en porte pas', () => {
        expect(filDuLecteur(fil, null, ALICE)).toEqual([]);
        expect(filDuLecteur(fil, 'c-1', ALICE).some(m => m.campaignId === undefined)).toBe(false);
    });

    it('ne garde que les derniers', () => {
        expect(filDuLecteur(fil, 'c-1', ALICE, 2).map(m => m.timestamp)).toEqual([2, 3]);
    });
});
