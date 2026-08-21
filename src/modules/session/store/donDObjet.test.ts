import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSessionOSStore } from './index';
import { useJournalStore } from '../../journal/useJournalStore';
import { leRecitAResumer, preparerLaRevue } from '../../journal/curation';
import type { InventoryItem } from '../../../types/player.types';

/**
 * **Un objet qui change de mains passe par trois portes, et elles doivent dire
 * la même chose.**
 *
 * `NPCCard.handleGive` depuis une entité NPC-OS, `approveItemTransfer` d'un PJ à
 * l'autre, et `assignLootToCharacter` depuis le butin de séance. La troisième
 * n'écrivait rien au journal — elle ne remplissait que `lootHistory`, lu par son
 * seul écran —, si bien que le même geste était consigné deux fois sur trois.
 *
 * **Et il s'écrit en `trace`. Décision de David du 2026-08-21** : le fil doit
 * pouvoir rendre un don d'objet, mais il n'entre pas dans le résumé. C'est ce
 * que le second bloc tient, et c'est la partie qui se casserait sans bruit — un
 * don passé en `chronique` ne produit ni erreur ni vide, seulement un résumé qui
 * fait l'inventaire.
 */

const journal = () => useJournalStore.getState();
const magasin = () => useSessionOSStore.getState();

const objet = (nom: string, quantite = 1): InventoryItem => ({
    id: `it-${nom}`, name: nom, type: 'weapon', rarity: 'rare',
    weight: 2, quantity: quantite, description: '', properties: {},
});

beforeEach(() => {
    journal().clearJournal();
    journal().startJournal({ id: 'c1', nom: 'Hadley Hope' }, 'Séance 1');
    useSessionOSStore.setState({
        players: [{
            id: 'p1', realName: 'David', avatarUrl: '', isOnline: true,
            characters: [{
                id: 'pc1', name: 'Brucelin', classRace: '', portraitUrl: '',
                inventoryItems: [], hp: 10, maxHp: 10,
                campaignId: 'c1', templateId: 'generic', sheetData: {},
            }],
        }],
        lootPool: [], lootHistory: [],
    });
    // Les slices atteignent le journal par le global — un import direct
    // fermerait un cycle entre les deux stores.
    (window as unknown as { useJournalStore?: unknown }).useJournalStore = useJournalStore;
});

afterEach(() => { vi.restoreAllMocks(); });

describe('attribuer un objet du butin se consigne au journal', () => {
    it('l\'événement existe, et il nomme l\'objet comme son destinataire', () => {
        magasin().addLootToPool([objet('Épée de Sang')]);
        magasin().assignLootToCharacter('it-Épée de Sang', 'p1', 'pc1');

        const ecrits = journal().journals[0].events;
        const don = ecrits.find(e => e.title.includes('Épée de Sang'));

        expect(don).toBeDefined();
        expect(don!.content).toContain('Brucelin');
    });

    it('la quantité ne se dit que si elle apprend quelque chose', () => {
        magasin().addLootToPool([objet('Ration'), objet('Carreau', 12)]);
        magasin().assignLootToCharacter('it-Ration', 'p1', 'pc1');
        magasin().assignLootToCharacter('it-Carreau', 'p1', 'pc1');

        const ecrits = journal().journals[0].events;
        const seule = ecrits.find(e => e.title.includes('Ration'))!;
        const douze = ecrits.find(e => e.title.includes('Carreau'))!;

        expect(seule.content).not.toContain('×');
        expect(douze.content).toContain('×12');
    });

    it('et l\'objet arrive quand même dans l\'inventaire — consigner n\'a rien changé', () => {
        magasin().addLootToPool([objet('Épée de Sang')]);
        magasin().assignLootToCharacter('it-Épée de Sang', 'p1', 'pc1');

        const perso = magasin().players[0].characters[0] as unknown as {
            inventoryItems: { name: string }[];
        };
        expect(perso.inventoryItems.map(i => i.name)).toContain('Épée de Sang');
        expect(magasin().lootPool).toHaveLength(0);
        expect(magasin().lootHistory).toHaveLength(1);
    });
});

describe('un don d\'objet n\'entre pas dans le résumé — décision du 2026-08-21', () => {
    it('il est écarté du récit à résumer', () => {
        magasin().addLootToPool([objet('Épée de Sang')]);
        magasin().assignLootToCharacter('it-Épée de Sang', 'p1', 'pc1');
        // Un fait de fiction, pour que le récit ne soit pas vide par accident :
        // un test qui passe sur une liste vide ne prouve rien.
        journal().addEvent({ type: 'NOTE', title: 'Indice révélé', content: 'La lettre.' });

        const evenements = journal().journals[0].events;
        const recit = leRecitAResumer(preparerLaRevue(evenements, [], [], 'c1'));

        expect(recit.map(e => e.title)).toContain('Indice révélé');
        expect(recit.some(e => e.title.includes('Épée de Sang'))).toBe(false);
    });

    it('mais il reste visible dans le fil — écarter du résumé n\'est pas taire', () => {
        magasin().addLootToPool([objet('Épée de Sang')]);
        magasin().assignLootToCharacter('it-Épée de Sang', 'p1', 'pc1');

        expect(journal().journals[0].events.some(e => e.title.includes('Épée de Sang'))).toBe(true);
    });
});
