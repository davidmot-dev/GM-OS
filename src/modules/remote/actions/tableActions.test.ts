import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tableActions } from './tableActions';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import type { RessourceDeTable } from '../../table/RessourcesDeTable';
import type { GameDriver } from '../../../types/drivers';

/**
 * Ce que ces tests protègent : **un joueur ne fait bouger que ce que le pilote
 * lui confie**.
 *
 * `electron/actionPolicy.ts` laisse passer `table:ajuster` parce que la réserve
 * commune se manipule par décision collective — c'est une règle de Dune, pas un
 * confort d'interface. Mais cette politique ne connaît ni les pilotes ni les
 * réserves qu'ils déclarent : sans le contrôle testé ici, le même message
 * ferait monter la **Menace du meneur**, qui est publique et intouchable.
 */

const IMPULSION: RessourceDeTable = {
    id: 'impulsion', label: 'Impulsion', proprietaire: 'joueurs',
    depart: 3, min: 0, max: 6,
};
const MENACE: RessourceDeTable = {
    id: 'menace', label: 'Menace', proprietaire: 'meneur',
    depart: 2, min: 0, visibleAuxJoueurs: true,
};

const CAMPAGNE = 'c-test';
const ctx = { activeCampaignId: CAMPAGNE, sync: () => {} };

const ajuster = tableActions['table:ajuster'];

function poserLeJeu(ressources: RessourceDeTable[]) {
    useSessionOSStore.setState({
        campaigns: [{ id: CAMPAGNE, name: 'Table', system: 'jeu-test', activeLocationIds: [] }],
        customGameDrivers: [{
            id: 'jeu-test', name: 'Jeu de test', emoji: '🎲',
            templateId: 'tpl', ressourcesDeTable: ressources,
        } as unknown as GameDriver],
    } as never);
    useRessourcesDeTableStore.setState({ reserves: {} });
}

const valeur = (id: string, ressources: RessourceDeTable[]) =>
    useRessourcesDeTableStore.getState().valeur(CAMPAGNE, ressources, id);

describe('un joueur ajuste une réserve depuis sa tablette', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        poserLeJeu([IMPULSION, MENACE]);
    });

    it('dépense sur la réserve commune', () => {
        ajuster({ ressourceId: 'impulsion', delta: -1 }, ctx);
        expect(valeur('impulsion', [IMPULSION, MENACE])).toBe(2);
    });

    it('crédite la réserve commune', () => {
        ajuster({ ressourceId: 'impulsion', delta: 2 }, ctx);
        expect(valeur('impulsion', [IMPULSION, MENACE])).toBe(5);
    });

    it('refuse la réserve du meneur, même déclarée visible', () => {
        // La voir n'est pas y toucher : c'est de la regarder monter qui fait
        // pression, et la faire monter soi-même n'aurait aucun sens.
        ajuster({ ressourceId: 'menace', delta: 5 }, ctx);
        expect(valeur('menace', [IMPULSION, MENACE])).toBe(2);
    });

    it('refuse une réserve que ce jeu ne déclare pas', () => {
        ajuster({ ressourceId: 'momentum', delta: -3 }, ctx);
        expect(useRessourcesDeTableStore.getState().reserves[CAMPAGNE]).toBeUndefined();
    });

    it('applique le report sur épuisement comme pour le meneur', () => {
        /**
         * *La règle ne change pas selon qui l'applique.* À zéro d'Impulsion,
         * ce qu'on ne peut pas payer alimente la Menace — c'est la règle que
         * rien d'autre ne saurait exprimer, et elle vaut aussi quand c'est un
         * joueur qui dépense.
         */
        const avecReport = [{ ...IMPULSION, depart: 1, reportSurEpuisement: 'menace' }, MENACE];
        poserLeJeu(avecReport);

        ajuster({ ressourceId: 'impulsion', delta: -3 }, ctx);

        expect(valeur('impulsion', avecReport), 'la réserve tombe au plancher').toBe(0);
        expect(valeur('menace', avecReport), 'les 2 points manquants partent chez le meneur').toBe(4);
    });

    it('ignore un message inexploitable plutôt que de deviner', () => {
        ajuster({ ressourceId: 'impulsion' }, ctx);
        ajuster({ delta: -1 }, ctx);
        ajuster({ ressourceId: 'impulsion', delta: 0 }, ctx);
        ajuster({ ressourceId: 'impulsion', delta: Number.NaN }, ctx);

        expect(useRessourcesDeTableStore.getState().reserves[CAMPAGNE]).toBeUndefined();
    });
});
