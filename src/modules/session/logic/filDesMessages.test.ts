import { describe, it, expect } from 'vitest';
import { ajouterAuFil } from './filDesMessages';
import type { SessionMessage } from '../../../types/session.types';

const msg = (id: string, campaignId?: string): SessionMessage => ({
    id, fromId: 'alice', fromName: 'Alice', toId: 'bob', toName: 'Bob',
    content: id, timestamp: 1, isRead: false, campaignId,
});

describe('ajouterAuFil — le fil de campagne du meneur', () => {
    it('ajoute sans doublon', () => {
        const fil = ajouterAuFil([], msg('m1', 'c-1'), 'c-1');
        expect(ajouterAuFil(fil, msg('m1', 'c-1'), 'c-1')).toBe(fil);
    });

    it('range dans la campagne du meneur un message arrivé sans campagne', () => {
        expect(ajouterAuFil([], msg('m1'), 'c-1')[0].campaignId).toBe('c-1');
        expect(ajouterAuFil([], msg('m1', 'c-2'), 'c-1')[0].campaignId, 'la campagne de l’expéditeur fait foi').toBe('c-2');
    });

    it('⛔ le plafond est PAR CAMPAGNE : un fil chargé n’efface pas celui d’une autre', () => {
        let fil = [msg('ancien-c2', 'c-2')];
        for (let i = 0; i < 5; i++) fil = ajouterAuFil(fil, msg(`c1-${i}`, 'c-1'), 'c-1', 3);
        expect(fil.map(m => m.id)).toEqual(['ancien-c2', 'c1-2', 'c1-3', 'c1-4']);
    });
});
