import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventoryItem, SessionFeedback, SessionMessage } from '../../session/store/types';

const magasin = vi.hoisted(() => ({
    players: [{ id: 'joueur', characters: [{ id: 'nel', sheetData: { secret: 'gardé', force: 8 } }] }],
    updateCharacter: vi.fn(), updateCharacterNarrative: vi.fn(),
    submitSessionFeedback: vi.fn(), addSessionMessage: vi.fn(), sendDirectMessage: vi.fn(),
    requestItemTransfer: vi.fn(), approveItemTransfer: vi.fn(), rejectItemTransfer: vi.fn(),
    removeInventoryItem: vi.fn(), updateCharacterHP: vi.fn(), addRemoteNotification: vi.fn(),
    remoteUpdateCharacterSheetData: vi.fn(), remoteUpdateCharacterNarrative: vi.fn(),
}));
vi.mock('../../session/useSessionOSStore', () => ({ useSessionOSStore: { getState: () => magasin } }));
const { sessionActions } = await import('./sessionActions');
const contexte = { activeCampaignId: 'campagne', sync: vi.fn() };
const objet: InventoryItem = {
    id: 'lampe', name: 'Lampe', type: 'other', rarity: 'common', weight: 0.5, quantity: 2,
    description: '', value: 0, properties: { allumee: false, charge: 0, detail: { couleur: 'rouge' } },
};
const retour: SessionFeedback = {
    characterId: 'nel', characterName: 'Nel', funRating: 4, storyRating: 3,
    combatRating: 5, notes: '', timestamp: 1000,
};
const message: SessionMessage = {
    id: 'm1', fromId: 'nel', fromName: 'Nel', toId: 'GM', toName: 'MJ',
    content: 'Je regarde la porte.', timestamp: 1000, isRead: false,
};
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('la fiche reçue de la tablette', () => {
    it('fusionne les champs, conserve les autres données et ne renvoie pas la demande', () => {
        const diffuser = vi.spyOn(window, 'dispatchEvent');
        sessionActions['remote:session:update-character-sheet-data']({
            playerId: 'joueur', characterId: 'nel',
            updates: { sheetData: { force: 0, nouveau: false }, description: '', inventoryItems: [objet] },
        }, contexte);
        expect(magasin.updateCharacter).toHaveBeenCalledWith('joueur', 'nel', {
            sheetData: { secret: 'gardé', force: 0, nouveau: false }, description: '', inventoryItems: [objet],
        });
        expect(magasin.remoteUpdateCharacterSheetData).not.toHaveBeenCalled();
        expect(diffuser).not.toHaveBeenCalled();
        expect(magasin.players[0].characters[0].sheetData.force).toBe(8);
    });

    it('TRV-A3 (27/11) : la DEX d’un Voyageur changée sur la tablette arrive avec son MD, son total et son maximum', () => {
        const avant = { players: magasin.players, campaigns: (magasin as Record<string, unknown>).campaigns, customGameDrivers: (magasin as Record<string, unknown>).customGameDrivers };
        Object.assign(magasin, {
            players: [{ id: 'joueur', characters: [{ id: 'kathya', systemId: 'trav', sheetData: {
                endurance: 7, force: 6, dexterite: 8, endurance_max: 7, force_max: 6, dexterite_max: 8,
                dexterite_md: 0, endurance_md: 0, force_md: 0, sante_physique: 21,
            } }] }],
            campaigns: [],
            customGameDrivers: [{ id: 'trav', name: 'Traveller', templateId: 'tpl-t', jet: { traveller: { md: { dexterite: 'dexterite_md' } } }, combat: {
                physiqueTraveller: { mecanique: 'traveller', endurance: 'endurance', force: 'force', dexterite: 'dexterite',
                    maximum: { endurance: 'endurance_max', force: 'force_max', dexterite: 'dexterite_max' } },
                statsToTrack: [{ fieldId: 'sante_physique', isMainHP: true }],
            } }],
        });
        try {
            sessionActions['session:update-character-sheet-data']({ playerId: 'joueur', characterId: 'kathya', updates: { sheetData: { dexterite: 9 } } }, contexte);
            expect(magasin.updateCharacter).toHaveBeenCalledWith('joueur', 'kathya', {
                sheetData: expect.objectContaining({ dexterite: 9, dexterite_md: 1, dexterite_max: 9, sante_physique: 22 }),
            });
        } finally {
            Object.assign(magasin, avant);
        }
    });

    it('accepte un inventaire vidé et des textes effacés', () => {
        sessionActions['session:update-character-sheet-data']({
            playerId: 'joueur', characterId: 'nel', updates: { inventoryItems: [], playerNotes: '', inventory: '' },
        }, contexte);
        expect(magasin.updateCharacter).toHaveBeenCalledWith('joueur', 'nel', {
            inventoryItems: [], playerNotes: '', inventory: '', sheetData: { secret: 'gardé', force: 8 },
        });
    });

    it.each([{ sheetData: [] }, { description: 4 }, { inventoryItems: [null] }, { inventoryItems: [{ ...objet, quantity: '2' }] }])(
        'refuse entièrement une mise à jour mal formée (%j)', updates => {
            sessionActions['session:update-character-sheet-data']({ playerId: 'joueur', characterId: 'nel', updates }, contexte);
            expect(magasin.updateCharacter).not.toHaveBeenCalled();
        },
    );

    it('ignore un personnage absent', () => {
        sessionActions['session:update-character-sheet-data']({
            playerId: 'joueur', characterId: 'absent', updates: { description: 'texte' },
        }, contexte);
        expect(magasin.updateCharacter).not.toHaveBeenCalled();
    });

    it('limite la narration aux champs narratifs, sans écraser les PV par un champ supplémentaire', () => {
        const diffuser = vi.spyOn(window, 'dispatchEvent');
        sessionActions['remote:session:update-character-narrative']({
            playerId: 'joueur', characterId: 'nel',
            updates: { description: '', playerNotes: 'note', linkedDocumentIds: [], hp: 99 },
        }, contexte);
        expect(magasin.updateCharacterNarrative).toHaveBeenCalledWith('joueur', 'nel', {
            description: '', playerNotes: 'note', linkedDocumentIds: [],
        });
        expect(magasin.remoteUpdateCharacterNarrative).not.toHaveBeenCalled();
        expect(diffuser).not.toHaveBeenCalled();
    });

    it('refuse une liste de documents contenant autre chose que des identifiants', () => {
        sessionActions['session:update-character-narrative']({
            playerId: 'joueur', characterId: 'nel', updates: { linkedDocumentIds: [7] },
        }, contexte);
        expect(magasin.updateCharacterNarrative).not.toHaveBeenCalled();
    });
});

describe('les transferts et les retours de séance', () => {
    it('transmet un objet complet en conservant ses propriétés et ses valeurs nulles', () => {
        sessionActions['remote:session:request-item-transfer']({ fromCharId: 'nel', toCharId: 'alia', item: objet }, contexte);
        expect(magasin.requestItemTransfer).toHaveBeenCalledWith('nel', 'alia', objet);
    });

    it.each([{ ...objet, weight: Infinity }, { ...objet, properties: [] }, { ...objet, name: null }])(
        'refuse un objet invalide au lieu de créer une demande inutilisable (%j)', item => {
            sessionActions['session:request-item-transfer']({ fromCharId: 'nel', toCharId: 'alia', item }, contexte);
            expect(magasin.requestItemTransfer).not.toHaveBeenCalled();
        },
    );

    it('fait parvenir le retour à la bonne séance sans le rediffuser', () => {
        const diffuser = vi.spyOn(window, 'dispatchEvent');
        sessionActions['remote:session:submit-feedback']({ sessionId: 'seance', feedback: retour }, contexte);
        expect(magasin.submitSessionFeedback).toHaveBeenCalledWith('seance', retour);
        expect(diffuser).not.toHaveBeenCalled();
    });

    it('refuse une note non numérique', () => {
        sessionActions['session:submit-feedback']({ sessionId: 'seance', feedback: { ...retour, funRating: '4' } }, contexte);
        expect(magasin.submitSessionFeedback).not.toHaveBeenCalled();
    });

    it('conserve les commandes d’approbation, refus et retrait', () => {
        sessionActions['remote:session:approve-item-transfer']({ requestId: 'tr-1' }, contexte);
        sessionActions['session:reject-item-transfer']({ requestId: 'tr-2' }, contexte);
        sessionActions['remote:session:remove-inventory-item']({ playerId: 'joueur', characterId: 'nel', itemId: 'lampe' }, contexte);
        expect(magasin.approveItemTransfer).toHaveBeenCalledWith('tr-1');
        expect(magasin.rejectItemTransfer).toHaveBeenCalledWith('tr-2');
        expect(magasin.removeInventoryItem).toHaveBeenCalledWith('joueur', 'nel', 'lampe');
    });
});

describe('les messages et les entrées inutilisables', () => {
    it('inscrit un message complet sans le renvoyer comme message du meneur', () => {
        sessionActions['session:receive-message'](message, contexte);
        expect(magasin.addSessionMessage).toHaveBeenCalledWith(message);
        expect(magasin.sendDirectMessage).not.toHaveBeenCalled();
    });

    it.each([{ id: 'm1', content: 'incomplet' }, { ...message, timestamp: NaN }, { ...message, isRead: 'false' }])(
        'refuse un message qui casserait le fil de séance (%j)', payload => {
            sessionActions['session:receive-message'](payload, contexte);
            expect(magasin.addSessionMessage).not.toHaveBeenCalled();
        },
    );

    it.each([null, undefined, [], 42, 'texte', {}, { playerId: 42, characterId: 'nel', updates: {} }])(
        'ne fait rien et ne lève pas sur une entrée incohérente (%j)', payload => {
            for (const action of Object.values(sessionActions)) expect(() => action(payload, contexte)).not.toThrow();
            for (const valeur of Object.values(magasin)) {
                if (typeof valeur === 'function') expect(valeur).not.toHaveBeenCalled();
            }
        },
    );
});
