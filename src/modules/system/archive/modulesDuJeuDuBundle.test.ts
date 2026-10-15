import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { nexusService } from './NexusService';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { GameDriver } from '../../../types/drivers';
import type { NexusDriverState } from './nexus.types';

vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));
const pilote: GameDriver = { id: 'custom-alien-test', name: 'Alien', author: 'Test', version: '1.0', description: '', emoji: '', templateId: 'alien', dice: { engine: 'standard', defaultDice: '1d6', logic: 'sum' }, combat: { statsToTrack: [], initiativeFormula: '' } };
const pontInitial = window.appBridge;
let archive: { manifestJson: string; stateJson: string };
beforeEach(() => {
    useSessionOSStore.setState({ customGameDrivers: [], customSheetTemplates: [], campaigns: [] });
    window.appBridge = { ...pontInitial, nexus: {
        selectExportPath: vi.fn(async () => 'test.gmos-driver'),
        selectImportFile: vi.fn(async () => 'test.gmos-driver'),
        exportBundle: vi.fn(async (_id: string, _path: string, stateJson: string, manifestJson: string) => {
            archive = { stateJson, manifestJson }; return { success: true, missingAssets: [] };
        }),
        importBundle: vi.fn(async () => ({ success: true, ...archive })),
    } } as unknown as Window['appBridge'];
});
afterEach(() => { window.appBridge = pontInitial; });

describe('les références de modules dans les bundles et le store', () => {
    it.each([undefined, [], [{ id: 'alien-muthur' }, { id: 'futur-module', libelle: 'Outil futur' }]].map(refs => ({ refs })))('fait un aller-retour export/import sans changer $refs', async ({ refs }) => {
        const original = refs === undefined ? pilote : { ...pilote, modulesDuJeu: refs };
        useSessionOSStore.getState().saveGameDriver(original);
        expect((await nexusService.exportDriverBundle(pilote.id)).success).toBe(true);
        const exporte = JSON.parse(archive.stateJson) as NexusDriverState;
        expect(exporte.gameDriver).toEqual(original);
        useSessionOSStore.setState({ customGameDrivers: [] });
        expect((await nexusService.importBundle()).success).toBe(true);
        expect(useSessionOSStore.getState().customGameDrivers).toEqual([original]);
    });
    it('refuse une déclaration privée avant toute injection de pilote ou média', async () => {
        useSessionOSStore.getState().saveGameDriver(pilote);
        await nexusService.exportDriverBundle(pilote.id);
        const donnees = JSON.parse(archive.stateJson);
        donnees.gameDriver.modulesDuJeu = [{ id: 'alien-muthur', config: { motDePasse: 'SECRET' } }];
        archive.stateJson = JSON.stringify(donnees);
        const avant = useSessionOSStore.getState().customGameDrivers;
        expect((await nexusService.importBundle()).success).toBe(false);
        expect(useSessionOSStore.getState().customGameDrivers).toBe(avant);
    });
    it('le store refuse une mauvaise référence sans modifier le pilote', () => {
        useSessionOSStore.getState().saveGameDriver(pilote);
        expect(() => useSessionOSStore.getState().updateGameDriver(pilote.id, { modulesDuJeu: [{ id: '../script.js' }] })).toThrow();
        expect(useSessionOSStore.getState().customGameDrivers).toEqual([pilote]);
    });
});
