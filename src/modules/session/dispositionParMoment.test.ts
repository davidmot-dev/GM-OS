import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './useSessionOSStore';
import type { Campaign } from '../../types/campaign.types';

/**
 * Ce que ces tests protègent : **deux dispositions, et l'une n'écrase jamais
 * l'autre — axe N, deuxième temps.**
 *
 * *« On retrouve son atelier tel qu'on l'a laissé le samedi matin, et sa table
 * telle qu'on l'a laissée le samedi soir. »*
 *
 * Le champ était déjà persisté par campagne : le dédoubler livre l'essentiel du
 * bénéfice pour très peu de code. Encore faut-il que **le moment décide du
 * casier**, et à un seul endroit — l'écriture. Passé en argument, il y aurait
 * autant d'endroits à tenir d'accord que d'appelants, *et il n'en faut qu'un qui
 * l'oublie pour écrire la table par-dessus l'atelier.*
 */

const ATELIER = {
    activeModule: 'forge' as const, isAIPanelOpen: true, isTacticalPanelOpen: false,
    theme: 'cyberpunk' as const, themeColor: '#111111',
};
const TABLE = {
    activeModule: 'combat' as const, isAIPanelOpen: false, isTacticalPanelOpen: true,
    theme: 'cyberpunk' as const, themeColor: '#222222',
};

const campagne = (): Campaign => ({
    id: 'c-1', name: 'Test', system: 'generic', activeLocationIds: [],
} as unknown as Campaign);

describe('la disposition suit le moment', () => {
    beforeEach(() => {
        useSessionOSStore.setState({ campaigns: [campagne()], activeCampaignId: 'c-1', sessions: [] });
    });

    const lue = () => useSessionOSStore.getState().campaigns[0];

    it('écrit dans l’atelier hors séance', () => {
        useSessionOSStore.getState().updateCampaignLayout('c-1', ATELIER);
        expect(lue().layoutConfig?.activeModule).toBe('forge');
        expect(lue().layoutConfigPartie).toBeUndefined();
    });

    /** **Le cas qui justifie tout l'axe.** */
    it('n’écrase pas l’atelier quand on règle la table', () => {
        useSessionOSStore.getState().updateCampaignLayout('c-1', ATELIER);

        useSessionOSStore.setState({ sessions: [{ status: 'active' }] as never });
        useSessionOSStore.getState().updateCampaignLayout('c-1', TABLE);

        expect(lue().layoutConfigPartie?.activeModule, 'la table a été réglée').toBe('combat');
        expect(lue().layoutConfig?.activeModule, 'et l’atelier est intact').toBe('forge');
    });

    /**
     * **Un régime qui démarre nu n'est pas un second régime, c'est une perte.**
     * Le meneur ouvrirait sa séance sur un pupitre vide.
     */
    it('part de l’atelier quand la table n’a jamais été réglée', () => {
        useSessionOSStore.getState().updateCampaignLayout('c-1', ATELIER);

        useSessionOSStore.setState({ sessions: [{ status: 'active' }] as never });
        useSessionOSStore.getState().updateCampaignLayout('c-1', { isAIPanelOpen: false });

        // Le module vient de l'atelier, le panneau du réglage qu'on vient de faire.
        expect(lue().layoutConfigPartie?.activeModule).toBe('forge');
        expect(lue().layoutConfigPartie?.isAIPanelOpen).toBe(false);
        expect(lue().layoutConfig?.isAIPanelOpen, 'l’atelier n’a pas bougé').toBe(true);
    });

    /**
     * **La pause rend la main à l'atelier**, comme elle lève les plafonds — un
     * réglage fait pendant le café appartient à la préparation.
     */
    it('revient à l’atelier pendant la pause', () => {
        useSessionOSStore.setState({ sessions: [{ status: 'active', pausedAt: Date.now() }] as never });
        useSessionOSStore.getState().updateCampaignLayout('c-1', ATELIER);

        expect(lue().layoutConfig?.activeModule).toBe('forge');
        expect(lue().layoutConfigPartie).toBeUndefined();
    });
});
