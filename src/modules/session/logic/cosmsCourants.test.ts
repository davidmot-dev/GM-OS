import { describe, it, expect } from 'vitest';
import { cosmsDesIds, idsDesCosmsCourants, loiEnVigueur, tailleDeLaMain } from './cosmsCourants';
import type { CosmDuJeu } from '../../../types/drivers';
import type { Scene } from '../../../types/trame.types';

/**
 * Le cosm courant de Torg (2026-10-14) : celui de la scène en cours, sinon celui
 * de la campagne ; deux en zone mixte, et les Lois des deux s'appliquent.
 */
const NIL: CosmDuJeu = { id: 'nil', nom: 'Empire du Nil', lois: [{ nom: "Loi de l'Héroïsme", texte: '…', mecanique: 'heroisme' }] };
const ORRORSH: CosmDuJeu = { id: 'orrorsh', nom: 'Orrorsh', lois: [{ nom: 'Loi de la Peur', texte: '…' }, { nom: 'Loi de la Persévérance', texte: '…', mecanique: 'perseverance' }] };
const COSMS = [NIL, ORRORSH];

const scene = (id: string, cosms: string[] | undefined, enCours: boolean, campaignId = 'c'): Scene => ({
    id, campaignId, acteId: 'a', ordre: 0, titre: id, resume: '', origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0,
    cosms, passages: enCours ? [{ debut: '2026-10-14T10:00:00Z' }] : [],
} as unknown as Scene);

describe('le cosm courant', () => {
    const campagne = { id: 'c', cosmsParDefaut: ['nil'] };

    it('celui de la scène en cours, quand elle en déclare un', () => {
        expect(idsDesCosmsCourants(campagne, [scene('s1', ['orrorsh'], true)])).toEqual(['orrorsh']);
    });
    it('sinon celui de la campagne', () => {
        expect(idsDesCosmsCourants(campagne, [scene('s1', undefined, true), scene('s2', ['orrorsh'], false)])).toEqual(['nil']);
    });
    it('une scène d’une autre campagne ne compte pas', () => {
        expect(idsDesCosmsCourants(campagne, [scene('s1', ['orrorsh'], true, 'autre')])).toEqual(['nil']);
    });
    it('sans campagne, aucun', () => {
        expect(idsDesCosmsCourants(undefined, [])).toEqual([]);
    });
    it('un identifiant que le pilote ne connaît pas est ignoré', () => {
        expect(cosmsDesIds(COSMS, ['inconnu', 'orrorsh']).map(c => c.id)).toEqual(['orrorsh']);
    });
});

describe('les Lois en vigueur', () => {
    it('zone mixte : les Lois des deux cosms s’appliquent', () => {
        const mixte = cosmsDesIds(COSMS, ['orrorsh', 'nil']);
        expect(loiEnVigueur(mixte, 'heroisme')?.nom).toBe("Loi de l'Héroïsme");
        expect(loiEnVigueur(mixte, 'perseverance')?.nom).toBe('Loi de la Persévérance');
        expect(loiEnVigueur(mixte, 'magie')).toBeUndefined();
    });
    it('Loi de l’Héroïsme : la main passe de 4 à 5', () => {
        expect(tailleDeLaMain(4, [NIL])).toBe(5);
        expect(tailleDeLaMain(4, [ORRORSH])).toBe(4);
    });
});
