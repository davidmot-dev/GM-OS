import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAppliquerLaCampagneForgee, type CampagneForgee } from './crossDomainHelpers';
import type { SessionOSStore } from '../store/index';

vi.mock('../../../stores/useToastStore', () => ({
    gmToast: vi.fn(),
}));

/**
 * Ce que ces tests protègent : **écrire une campagne forgée n'efface rien**.
 *
 * C'est le § 6.4 du plan du 2026-08-15, et sa raison tient en une phrase : *si
 * retravailler une campagne efface le travail de la semaine précédente, le
 * meneur cessera de retravailler.* Le défaut serait muet — une campagne écrasée
 * a l'aspect exact d'une campagne neuve.
 */
describe('handleAppliquerLaCampagneForgee', () => {
    let mockState: SessionOSStore;
    let mockSet: ReturnType<typeof vi.fn>;
    let mockGet: ReturnType<typeof vi.fn>;

    const vide = (): CampagneForgee => ({
        campaignId: 'c-1',
        actes: [], scenes: [], entities: [], atlasMaps: [], wikiEntries: [], clues: [],
        liensSurExistants: [],
    });

    const appliquer = (ecriture: CampagneForgee) =>
        handleAppliquerLaCampagneForgee(
            mockSet as unknown as Parameters<typeof handleAppliquerLaCampagneForgee>[0],
            mockGet as unknown as () => SessionOSStore,
            ecriture,
        );

    beforeEach(() => {
        vi.clearAllMocks();
        mockState = {
            campaigns: [], entities: [], atlasMaps: [], wikiEntries: [],
            actes: [], scenes: [], clues: [], activeCampaignId: null,
        } as unknown as SessionOSStore;
        mockSet = vi.fn((updateFn: Partial<SessionOSStore> | ((state: SessionOSStore) => Partial<SessionOSStore>)) => {
            const updates = typeof updateFn === 'function' ? updateFn(mockState) : updateFn;
            mockState = { ...mockState, ...updates } as SessionOSStore;
        });
        mockGet = vi.fn(() => mockState);
    });

    it('crée la campagne et son contenu quand elle n\'existe pas', () => {
        appliquer({
            ...vide(),
            campagne: { creee: true, champs: { name: 'Le secret de Milo', system: 'cthulhu-hack', synopsis: 'Venise.' } },
            actes: [{ id: 'a-1', campaignId: 'c-1', ordre: 1, titre: 'Acte I', resume: '' }],
            scenes: [{ id: 's-1', campaignId: 'c-1', acteId: 'a-1', ordre: 1, titre: 'Le bal', resume: '', origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0 }],
        });

        expect(mockState.campaigns).toHaveLength(1);
        expect(mockState.campaigns[0].name).toBe('Le secret de Milo');
        expect(mockState.actes).toHaveLength(1);
        expect(mockState.scenes).toHaveLength(1);
        expect(mockState.activeCampaignId).toBe('c-1');
    });

    it('ne réécrit pas un synopsis que le meneur a retravaillé', () => {
        mockState.campaigns = [{
            id: 'c-1', name: 'Le secret de Milo', system: 'cthulhu-hack',
            synopsis: 'Ce que David a écrit lui-même.', description: '', activeLocationIds: [],
        }] as unknown as SessionOSStore['campaigns'];

        appliquer({
            ...vide(),
            campagne: { creee: false, champs: { name: 'Le secret de Milo', synopsis: 'Ce que le modèle propose.', description: 'Un pitch.' } },
        });

        expect(mockState.campaigns[0].synopsis).toBe('Ce que David a écrit lui-même.');
        // Un champ VIDE, lui, se remplit : c'est un manque, pas un choix.
        expect(mockState.campaigns[0].description).toBe('Un pitch.');
    });

    it('ajoute les liens aux personnages existants sans effacer les leurs', () => {
        mockState.entities = [{
            id: 'e-ancien', name: 'Milo', campaignId: 'c-1',
            relations: [{ targetId: 'e-autre', targetType: 'npc', type: 'ally', description: 'posé à la main' }],
        }] as unknown as SessionOSStore['entities'];

        appliquer({
            ...vide(),
            liensSurExistants: [{
                entityId: 'e-ancien',
                relation: { targetId: 'e-neuf', targetType: 'npc', type: 'rival', description: 'venu de la Forge' },
            }],
        });

        const milo = mockState.entities.find(e => e.id === 'e-ancien')!;
        expect(milo.relations).toHaveLength(2);
        expect(milo.relations!.map(r => r.type)).toEqual(['ally', 'rival']);
    });
});
