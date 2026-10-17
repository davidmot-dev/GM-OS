import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { identiteEnVigueur, inviteAvecLIdentite } from './identiteVisuelle';

/**
 * **L'identité visuelle** — 2026-10-17 : le jeu donne le défaut, la campagne le
 * complète ou le remplace, et l'identité s'ajoute en fin d'invite.
 */
const BLADE_RUNNER = { identiteVisuelle: { style: '1980s neo-noir, rain-soaked neon', aEviter: 'cartoon style' } };

describe('l’identité en vigueur', () => {
    it('sans campagne qui en dise, celle du jeu', () => {
        expect(identiteEnVigueur(BLADE_RUNNER, {})).toEqual({ style: '1980s neo-noir, rain-soaked neon', aEviter: 'cartoon style' });
    });

    it('la campagne complète le jeu par défaut', () => {
        expect(identiteEnVigueur(BLADE_RUNNER, { identiteVisuelle: { style: 'Los Angeles 2019, Tyrell pyramids', aEviter: 'daylight' } }))
            .toEqual({ style: '1980s neo-noir, rain-soaked neon. Los Angeles 2019, Tyrell pyramids', aEviter: 'cartoon style. daylight' });
    });

    it('ou le remplace', () => {
        expect(identiteEnVigueur(BLADE_RUNNER, { identiteVisuelle: { style: 'watercolour', mode: 'remplace' } }))
            .toEqual({ style: 'watercolour', aEviter: undefined });
    });

    it('une campagne seule suffit, un jeu sans identité ne gêne pas', () => {
        expect(identiteEnVigueur({}, { identiteVisuelle: { style: 'gothic engraving' } })).toEqual({ style: 'gothic engraving', aEviter: undefined });
    });

    it('rien de déclaré, ou des blancs : aucune identité', () => {
        expect(identiteEnVigueur(undefined, undefined)).toBeNull();
        expect(identiteEnVigueur({ identiteVisuelle: { style: '   ' } }, { identiteVisuelle: { style: '' } })).toBeNull();
    });
});

describe('l’identité dans l’invite', () => {
    it('s’ajoute après le sujet', () => {
        expect(inviteAvecLIdentite('A professional RPG character portrait of Rachael.', BLADE_RUNNER.identiteVisuelle))
            .toBe('A professional RPG character portrait of Rachael. Visual identity: 1980s neo-noir, rain-soaked neon. Never include: cartoon style.');
    });

    it('sans identité, l’invite part telle quelle', () => {
        expect(inviteAvecLIdentite('A portrait.', null)).toBe('A portrait.');
    });
});

describe('l’identité de la partie, appliquée à la génération', () => {
    vi.mock('../session/logic/idbStorage', () => ({
        idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
        onPersistedStateChanged: () => () => {},
    }));
    let modules: {
        useSessionOSStore: typeof import('../session/useSessionOSStore').useSessionOSStore;
        identiteAAppliquer: typeof import('./identiteDeLaPartie').identiteAAppliquer;
        useIdentiteSuspendue: typeof import('./identiteDeLaPartie').useIdentiteSuspendue;
    };
    beforeEach(async () => {
        const session = await import('../session/useSessionOSStore');
        const partie = await import('./identiteDeLaPartie');
        modules = { useSessionOSStore: session.useSessionOSStore, identiteAAppliquer: partie.identiteAAppliquer, useIdentiteSuspendue: partie.useIdentiteSuspendue };
        modules.useSessionOSStore.setState({
            activeCampaignId: 'c',
            campaigns: [{ id: 'c', name: 'Anges de Feu', system: 'br' }],
            customGameDrivers: [{ id: 'br', name: 'Blade Runner', ...BLADE_RUNNER }],
        } as never);
    });
    afterEach(() => modules.useIdentiteSuspendue.setState({ suspendue: false }));

    it('lit le jeu de la campagne ouverte', () => {
        expect(modules.identiteAAppliquer()?.style).toBe('1980s neo-noir, rain-soaked neon');
    });

    it('suspendue par le meneur, elle ne s’applique pas', () => {
        modules.useIdentiteSuspendue.getState().suspendre(true);
        expect(modules.identiteAAppliquer()).toBeNull();
    });
});

describe('le bloc du GPT collé d’un seul tenant (2026-10-17)', () => {
    const BLOC = 'STYLE: fine ink linework, watercolor washes\nAVOID: photography, neon colors';

    it('se range en deux champs', async () => {
        const { separerLeBloc } = await import('./identiteVisuelle');
        expect(separerLeBloc(BLOC)).toEqual({ style: 'fine ink linework, watercolor washes', aEviter: 'photography, neon colors' });
        expect(separerLeBloc('STYLE: ink only')).toEqual({ style: 'ink only' });
        expect(separerLeBloc('fine ink linework')).toBeNull();
    });

    it('une identité déjà enregistrée avec le bloc entier se lit rangée', () => {
        expect(identiteEnVigueur({ identiteVisuelle: { style: BLOC } }, null))
            .toEqual({ style: 'fine ink linework, watercolor washes', aEviter: 'photography, neon colors' });
    });
});
