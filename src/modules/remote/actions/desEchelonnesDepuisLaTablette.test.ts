import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **Les dés échelonnés lancés depuis une tablette.**
 *
 * *Demandé par David le 2026-09-03, juste après le même défaut au pupitre du
 * meneur.* La tablette ne lisait que `dice.engine` : un pilote Blade Runner qui
 * déclare `jet.desEchelonnes` sans corriger son moteur y lançait la réserve de
 * d6 de Year Zero — **des réussites plausibles, jamais plus de six, et le dé à
 * douze faces nulle part.**
 *
 * Ce que ces essais gardent :
 *
 * 1. la poignée voyage en **lettres**, et c'est chez le meneur qu'elle devient
 *    des faces — *un écran qui enverrait « 12 » imposerait sa lecture de la
 *    règle* ;
 * 2. l'avantage et le désavantage y obéissent au livre, comme partout ailleurs ;
 * 3. **le jet est résolu par le pilote de la campagne**, celui du meneur : la
 *    tablette demande, elle ne tranche pas.
 */

vi.mock('../../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));

/* Le ducking referme un cycle d'imports dès qu'un test entre par le magasin de
   session ; il n'a rien à voir avec la taille des dés. */
vi.mock('../../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { diceActions, rollManually } = await import('./diceActions');
const { useSessionOSStore } = await import('../../session/useSessionOSStore');
const { useDiceStore } = await import('../../../stores/useDiceStore');

/**
 * Le pilote tel qu'il sort de la Forge quand elle se trompe : il **décrit** des
 * dés échelonnés, et son moteur dit `yze`. C'est le cas que David a à la table.
 */
const PILOTE_QUI_SE_CONTREDIT = {
    id: 'br-test',
    name: 'Blade Runner',
    dice: { defaultDice: '2d6', logic: 'count-success', engine: 'yze' },
    jet: {
        sens: 'sup-ou-egal',
        desEchelonnes: {
            echelle: 'yze-lettres',
            composantes: [
                { id: 'attribut', label: 'Attribut', champs: ['agilite'] },
                { id: 'competence', label: 'Compétence', champs: ['tir'] },
            ],
        },
    },
};

const ouvrirLaCampagneAvec = (pilote: unknown) => {
    useSessionOSStore.setState({
        activeCampaignId: 'c-1',
        campaigns: [{ id: 'c-1', name: 'Los Angeles', system: 'br-test' }],
        customGameDrivers: [pilote],
    } as never);
};

/** Ce que la tablette envoie quand le joueur touche « Lancer Système ». */
const lancerDepuisLaTablette = (
    attribut: string, competence: string,
    extra: Record<string, unknown> = {},
) => diceActions['remote:dice:roll']({
    count: 1, modifier: 0, target: 10, gearCount: 0,
    mode: 'yze-echelonne', useSystem: true,
    niveauxEchelonnes: [
        { label: 'Attribut', lettre: attribut },
        { label: 'Compétence', lettre: competence },
    ],
    ...extra,
}, { activeCampaignId: 'c-1', sync: () => {} });

const facesLancees = () => (useDiceStore.getState().lastRoll?.rolls ?? []).map(r => r.sides);

beforeEach(() => {
    useDiceStore.setState({ lastRoll: null, history: [] } as never);
    useSessionOSStore.setState({ activeCampaignId: null, campaigns: [], customGameDrivers: [] } as never);
});

describe('un jet échelonné parti d’une tablette', () => {
    it('lance les dés des lettres, et non la réserve de d6 du pilote', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);

        lancerDepuisLaTablette('A', 'A');

        expect(facesLancees()).toEqual([12, 12]);
    });

    /** « Ajout d'un troisième dé de base identique au plus faible des deux. » */
    it('applique l’avantage chez le meneur, pas sur la tablette', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);

        lancerDepuisLaTablette('A', 'C', { modificateurEchelonne: 'avantage' });

        expect(facesLancees()).toEqual([12, 8, 8]);
    });

    /** « Retrait du dé de base le plus faible » : il n'en reste qu'un. */
    it('applique le désavantage', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);

        lancerDepuisLaTablette('A', 'C', { modificateurEchelonne: 'desavantage' });

        expect(facesLancees()).toEqual([12]);
    });

    /**
     * Le dé d'équipement est compté **à part** : ses 1 usent le matériel, ils ne
     * relèvent pas de la poussée. Il ne doit donc jamais entrer dans la poignée
     * de base — ni s'y faire oublier.
     */
    it('ajoute le dé d’équipement comme dé secondaire', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);

        lancerDepuisLaTablette('A', 'C', { equipementEchelonne: 'B' });

        expect(facesLancees()).toEqual([12, 8, 10]);
        expect(useDiceStore.getState().lastRoll?.rolls.map(r => r.source))
            .toEqual(['base', 'base', 'gear']);
    });

    /** Ce que le meneur relit dans l'historique quand le jet vient d'ailleurs. */
    it('écrit la poignée dans le titre', () => {
        ouvrirLaCampagneAvec(PILOTE_QUI_SE_CONTREDIT);

        lancerDepuisLaTablette('A', 'B', { title: undefined });

        expect(useDiceStore.getState().lastRoll?.title).toContain('D12 + D10');
    });
});

describe('le mode manuel de la tablette', () => {
    /**
     * *Une liste de noms recopiée à la main dérive le jour où un nom s'ajoute.*
     * `yze-echelonne` manquait au `switch` : il tombait dans le `default` et
     * lançait des dés ordinaires, sans que rien ne le dise.
     */
    it('connaît les dés échelonnés', () => {
        const r = rollManually('yze-echelonne', 20, 2, 0, 10, {
            niveauxEchelonnes: [
                { label: 'Attribut', lettre: 'A' },
                { label: 'Compétence', lettre: 'C' },
            ],
        } as never, 'over');

        expect(r.rolls.map(d => d.sides)).toEqual([12, 8]);
    });

    /** Sans lettres, on retombe sur le plus petit dé : **jamais un dé inventé.** */
    it('ne devine aucune taille quand la charge n’en porte pas', () => {
        const r = rollManually('yze-echelonne', 20, 2, 0, 10, {} as never, 'over');

        expect(r.rolls.map(d => d.sides)).toEqual([6, 6]);
    });
});
