import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nexusService } from './NexusService';
import { useBestiaireStore } from '../../combat/useBestiaireStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';

/**
 * **Le bestiaire voyage avec son jeu.**
 *
 * *Demandé par David le 2026-09-03.* Partager un pilote sans ses adversaires,
 * c'est partager un livre de règles sans son bestiaire : le destinataire aurait
 * les échelles et devrait tout refabriquer.
 *
 * Ce qui se vérifie ici tient en trois points, et chacun protège d'un défaut
 * silencieux : que le bestiaire **parte** avec le bundle, qu'il **arrive** clé
 * sur le bon jeu, et qu'un bundle d'hier — qui n'en contient pas — s'importe
 * sans rien casser.
 */

const PILOTE = {
    id: 'jeu-test', name: 'Jeu de test', templateId: 'jeu-test',
    combat: { statsToTrack: [], initiativeFormula: '' },
} as never;

describe('le bestiaire dans un bundle de pilote', () => {
    beforeEach(() => {
        useBestiaireStore.setState({ gabarits: [], repartitions: {} });
        useSessionOSStore.setState({ customGameDrivers: [PILOTE], customSheetTemplates: [] } as never);
    });

    it('part avec l’export quand il y a quelque chose à emporter', () => {
        useBestiaireStore.getState().enregistrer({
            jeuId: 'jeu-test', nom: 'Sentinelle', archetypeId: 'tireur', rangId: 'elite',
            sheetData: { adresse: 5 },
        });

        const bundle = nexusService.scrapeDriverData('jeu-test');
        expect(bundle.bestiaire).toHaveLength(1);
        expect(bundle.bestiaire?.[0].nom).toBe('Sentinelle');
    });

    it('⭐ n’ajoute rien au bundle quand le bestiaire est vide', () => {
        /* Un bundle ne doit pas grossir de champs qui ne disent rien. */
        expect(nexusService.scrapeDriverData('jeu-test').bestiaire).toBeUndefined();
    });

    it('n’emporte que le bestiaire DU jeu exporté', () => {
        useBestiaireStore.getState().enregistrer({
            jeuId: 'jeu-test', nom: 'Sentinelle', archetypeId: 'tireur', rangId: 'elite', sheetData: {},
        });
        useBestiaireStore.getState().enregistrer({
            jeuId: 'un-autre-jeu', nom: 'Pillard', archetypeId: 'brute', rangId: 'pietaille', sheetData: {},
        });

        const bundle = nexusService.scrapeDriverData('jeu-test');
        expect(bundle.bestiaire?.map(g => g.nom)).toEqual(['Sentinelle']);
    });

    it('⭐ arrive clé sur le pilote importé, même si le bundle dit autre chose', () => {
        /*
          Un bundle bricoté à la main, ou un pilote renommé avant l'export,
          suffirait à rendre les gabarits invisibles : importés, puis
          introuvables — pire que pas importés du tout.
        */
        const injecter = (nexusService as unknown as {
            injectDriverState: (s: unknown) => void;
        }).injectDriverState.bind(nexusService);

        injecter({
            gameDriver: PILOTE,
            bestiaire: [{
                id: 'venu-d-ailleurs', jeuId: 'ancien-nom', nom: 'Chasseur',
                archetypeId: 'rapide', rangId: 'aguerri', sheetData: { agilite: 4 }, creeLe: 1,
            }],
        });

        const local = useBestiaireStore.getState().gabaritsDuJeu('jeu-test');
        expect(local).toHaveLength(1);
        expect(local[0].nom).toBe('Chasseur');
        /* Et il reçoit une identité locale, pas celle du bundle. */
        expect(local[0].id).not.toBe('venu-d-ailleurs');
    });

    it('réimporter deux fois ne fabrique pas de doublons', () => {
        const injecter = (nexusService as unknown as {
            injectDriverState: (s: unknown) => void;
        }).injectDriverState.bind(nexusService);

        const bundle = {
            gameDriver: PILOTE,
            bestiaire: [{
                id: 'g1', jeuId: 'jeu-test', nom: 'Chasseur',
                archetypeId: 'rapide', rangId: 'aguerri', sheetData: {}, creeLe: 1,
            }],
        };

        injecter(bundle);
        injecter(bundle);
        expect(useBestiaireStore.getState().gabaritsDuJeu('jeu-test')).toHaveLength(1);
    });

    it('⚠️ un bundle d’hier, sans bestiaire, s’importe sans rien casser', () => {
        const injecter = (nexusService as unknown as {
            injectDriverState: (s: unknown) => void;
        }).injectDriverState.bind(nexusService);

        useBestiaireStore.getState().enregistrer({
            jeuId: 'jeu-test', nom: 'Déjà là', archetypeId: 'brute', rangId: 'boss', sheetData: {},
        });

        expect(() => injecter({ gameDriver: PILOTE })).not.toThrow();
        /* Et il n'efface pas ce qui était déjà rangé. */
        expect(useBestiaireStore.getState().gabaritsDuJeu('jeu-test')).toHaveLength(1);
    });
});

vi.mock('../../../stores/useToastStore', () => ({ gmToast: vi.fn() }));
