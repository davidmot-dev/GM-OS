import { describe, it, expect, beforeEach } from 'vitest';
import type { Combatant } from '../types';
import { combattantAuNouveauGenre } from './genreDuCombattant';
import { useCombatStore } from '../useCombatStore';

/**
 * § 268 (21/11/2026) — un personnage transformé garde son identifiant ; le
 * combattant du plateau, qui le nomme avec son genre, change de lien et de camp.
 */

const combattant = (o: Partial<Combatant>): Combatant => ({
    id: 'cb-1', name: 'Marta', init: 3, isPlayer: false, faction: 'ally', statuses: [], sourceEntityId: 'e-marta', ...o,
} as Combatant);

describe('le combattant au nouveau genre', () => {
    it('un PNJ devenu PJ : isPlayer, lien de PJ, camp des joueurs', () => {
        expect(combattantAuNouveauGenre(combattant({}), 'e-marta', true)).toMatchObject({
            id: 'cb-1', isPlayer: true, sourcePlayerId: 'e-marta', sourceEntityId: undefined, faction: 'player',
        });
    });

    it('un PJ devenu PNJ hostile : lien de PNJ, camp ennemi', () => {
        const pj = combattant({ isPlayer: true, faction: 'player', sourcePlayerId: 'pc-rachel', sourceEntityId: undefined });
        expect(combattantAuNouveauGenre(pj, 'pc-rachel', false, 'hostile')).toMatchObject({
            isPlayer: false, sourceEntityId: 'pc-rachel', sourcePlayerId: undefined, faction: 'enemy',
        });
    });

    it('un autre combattant, ou un combattant déjà du bon genre, garde sa référence', () => {
        const autre = combattant({ sourceEntityId: 'e-autre' });
        expect(combattantAuNouveauGenre(autre, 'e-marta', true)).toBe(autre);
        const deja = combattant({ isPlayer: true, sourcePlayerId: 'e-marta', sourceEntityId: undefined });
        expect(combattantAuNouveauGenre(deja, 'e-marta', true)).toBe(deja);
    });
});

describe('changerLeGenreDuCombattant, dans le magasin du combat', () => {
    beforeEach(() => {
        useCombatStore.setState({ combatants: [combattant({}), combattant({ id: 'cb-2', name: 'Garde', sourceEntityId: 'e-garde', faction: 'enemy' })] });
    });

    it('ne réécrit que le combattant du personnage, et garde les PV', () => {
        useCombatStore.setState({ combatants: [combattant({ hp: 4, hpMax: 10 }), combattant({ id: 'cb-2', sourceEntityId: 'e-garde', faction: 'enemy' })] });
        const garde = useCombatStore.getState().combatants[1];
        useCombatStore.getState().changerLeGenreDuCombattant('e-marta', true);
        const [marta, ensuite] = useCombatStore.getState().combatants;
        expect(marta).toMatchObject({ isPlayer: true, sourcePlayerId: 'e-marta', hp: 4, hpMax: 10 });
        expect(ensuite).toBe(garde);
    });

    it('un personnage absent du plateau ne change rien', () => {
        const avant = useCombatStore.getState().combatants;
        useCombatStore.getState().changerLeGenreDuCombattant('e-absent', true);
        expect(useCombatStore.getState().combatants).toBe(avant);
    });
});
