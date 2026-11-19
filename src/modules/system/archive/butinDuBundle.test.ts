import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nexusService } from './NexusService';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { LootGenerator } from '../../session/logic/LootGenerator';
import type { GameDriver } from '../../../types/drivers';

/**
 * **Les tables de butin reliées au catalogue voyagent avec leur pilote** — registre
 * § 264, T7 (19/11/2026), critère C7. Une ligne « Objet du catalogue » ne porte que
 * l'identifiant de son objet (décision de David : « Lien vivant ») : si le catalogue
 * ou ce lien se perdaient à l'export, la table réimportée ne donnerait plus que des
 * avertissements. Sur le modèle de `bestiaireDuBundle.test.ts`.
 */
const PILOTE = {
    id: 'alien-test', name: 'Alien de test', templateId: 'tpl-alien-test',
    combat: { statsToTrack: [], initiativeFormula: '' },
    catalogue: { colonnes: {}, objets: [
        { id: 'm4a3', famille: 'arme', nom: 'Pistolet M4A3', categorie: 'Pistolets', valeurs: {}, cout: '200 $' },
    ] },
    lootTables: [{ id: 'casier', name: "Casier d'armurerie", rollMode: 'weighted', rolls: '1', entries: [
        { name: 'Pistolet M4A3', type: 'catalogue', weight: 1, minAmount: '1', metadata: { catalogueId: 'm4a3', rarity: 'common' } },
    ] }],
} as unknown as GameDriver;

const injecter = (etat: unknown) => (nexusService as unknown as { injectDriverState: (s: unknown) => void })
    .injectDriverState.bind(nexusService)(etat);

describe('le butin relié au catalogue dans un bundle de pilote (C7)', () => {
    beforeEach(() => {
        useSessionOSStore.setState({ customGameDrivers: [PILOTE], customSheetTemplates: [] } as never);
    });

    it('part avec l’export : la table, sa ligne « Objet du catalogue » et le catalogue', () => {
        const bundle = nexusService.scrapeDriverData('alien-test');
        expect(bundle.gameDriver.lootTables?.[0].entries[0]).toMatchObject({ type: 'catalogue', metadata: { catalogueId: 'm4a3' } });
        expect(bundle.gameDriver.catalogue?.objets.map(o => o.id)).toEqual(['m4a3']);
    });

    it('revient intact après l’archive et l’import « Remplacer », et la table tire encore l’objet relié', () => {
        // L'archive `.gmos-driver` porte le pilote en JSON : on fait le même aller-retour.
        const archive = JSON.parse(JSON.stringify(nexusService.scrapeDriverData('alien-test')));
        useSessionOSStore.setState({ customGameDrivers: [] } as never);
        injecter(archive);

        const revenu = useSessionOSStore.getState().customGameDrivers.find(d => d.id === 'alien-test')!;
        expect(revenu.lootTables).toEqual(PILOTE.lootTables);
        expect(revenu.catalogue).toEqual(PILOTE.catalogue);

        const { objets, avertissements } = LootGenerator.generateFromTable(revenu.lootTables![0], revenu.lootTables!, { catalogue: revenu.catalogue });
        expect(avertissements).toEqual([]);
        expect(objets[0]).toMatchObject({ name: 'Pistolet M4A3', value: 200, properties: { catalogueId: 'm4a3' } });
    });
});

vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));
