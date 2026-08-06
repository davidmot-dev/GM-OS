import { describe, it, expect } from 'vitest';
import { isDeepEqual, getDifferentialPayload } from './syncUtils';

describe('isDeepEqual — primitives', () => {
    it('compare les valeurs simples', () => {
        expect(isDeepEqual(1, 1)).toBe(true);
        expect(isDeepEqual('a', 'a')).toBe(true);
        expect(isDeepEqual(true, true)).toBe(true);
        expect(isDeepEqual(null, null)).toBe(true);
        expect(isDeepEqual(undefined, undefined)).toBe(true);
    });

    it('distingue les valeurs différentes', () => {
        expect(isDeepEqual(1, 2)).toBe(false);
        expect(isDeepEqual('a', 'b')).toBe(false);
        expect(isDeepEqual(null, undefined)).toBe(false);
        expect(isDeepEqual(0, '0')).toBe(false);
        expect(isDeepEqual(null, {})).toBe(false);
    });
});

describe('isDeepEqual — structures', () => {
    it('compare en profondeur des objets équivalents', () => {
        expect(isDeepEqual({ a: 1, b: { c: [1, 2] } }, { a: 1, b: { c: [1, 2] } })).toBe(true);
    });

    it('ignore l\'ordre des clés', () => {
        expect(isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('détecte une valeur imbriquée différente', () => {
        expect(isDeepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it('détecte une clé en trop ou en moins', () => {
        expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(isDeepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('compare les tableaux élément par élément', () => {
        expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(isDeepEqual([1, 2, 3], [1, 3, 2])).toBe(false);
        expect(isDeepEqual([], [])).toBe(true);
    });

    it('compare les dates par leur instant', () => {
        expect(isDeepEqual(new Date('2026-08-06'), new Date('2026-08-06'))).toBe(true);
        expect(isDeepEqual(new Date('2026-08-06'), new Date('2026-08-07'))).toBe(false);
    });

    it('ne confond pas un tableau et un objet de mêmes clés', () => {
        // Object.keys(['x']) vaut ['0'], comme Object.keys({ 0: 'x' }) : sans
        // garde explicite, ces deux valeurs passaient pour égales et un champ
        // passant de {} à [] n'était jamais diffusé.
        expect(isDeepEqual(['x'], { 0: 'x' })).toBe(false);
        expect(isDeepEqual([], {})).toBe(false);
    });
});

describe('getDifferentialPayload', () => {
    it('ne retourne que les segments modifiés', () => {
        const previous = { combat: { round: 1 }, notes: { public: 'a' } };
        const current = { combat: { round: 2 }, notes: { public: 'a' } };

        expect(getDifferentialPayload(current, previous)).toEqual({ combat: { round: 2 } });
    });

    it('retourne un objet vide quand rien n\'a changé', () => {
        const state = { combat: { round: 1 }, notes: { public: 'a' } };

        expect(getDifferentialPayload(state, { ...state })).toEqual({});
    });

    it('inclut un segment apparu', () => {
        expect(getDifferentialPayload({ dice: { lastRoll: 4 } }, {})).toEqual({ dice: { lastRoll: 4 } });
    });

    it('retourne tout quand l\'état précédent est vide', () => {
        const current = { a: 1, b: 2 };
        expect(getDifferentialPayload(current, {})).toEqual(current);
    });

    it('compare au premier niveau seulement', () => {
        // Propriété structurante : le segment entier repart dès qu'un seul de ses
        // champs bouge. C'est ce qui rend coûteux un segment monolithique.
        const previous = { session: { campaigns: ['a'], entities: ['lourd'] } };
        const current = { session: { campaigns: ['b'], entities: ['lourd'] } };

        expect(getDifferentialPayload(current, previous)).toEqual({
            session: { campaigns: ['b'], entities: ['lourd'] },
        });
    });

    it('ne signale pas la disparition d\'un segment', () => {
        // Limite connue : seules les clés de `current` sont parcourues. Un segment
        // retiré ne produit aucune entrée, donc le destinataire garde l'ancienne
        // valeur. Aucun segment n'est retiré en pratique aujourd'hui.
        const previous = { combat: { round: 1 }, notes: { public: 'a' } };
        const current = { combat: { round: 1 } };

        expect(getDifferentialPayload(current, previous)).toEqual({});
    });

    it('ne modifie aucun des deux états', () => {
        const previous = { a: { n: 1 } };
        const current = { a: { n: 2 } };
        const previousCopy = structuredClone(previous);
        const currentCopy = structuredClone(current);

        getDifferentialPayload(current, previous);

        expect(previous).toEqual(previousCopy);
        expect(current).toEqual(currentCopy);
    });

    it('descend d\'un niveau dans les segments demandés', () => {
        const previous = { session: { campaigns: ['a'], entities: ['lourd'] } };
        const current = { session: { campaigns: ['b'], entities: ['lourd'] } };

        expect(getDifferentialPayload(current, previous, { deepSegments: ['session'] }))
            .toEqual({ session: { campaigns: ['b'] } });
    });

    it('omet le segment profond quand aucun de ses champs ne bouge', () => {
        const state = { session: { campaigns: ['a'], entities: ['x'] } };

        expect(getDifferentialPayload({ ...state }, { ...state }, { deepSegments: ['session'] })).toEqual({});
    });

    it('ne descend que dans les segments listés', () => {
        const previous = { session: { a: 1 }, combat: { round: 1 } };
        const current = { session: { a: 2 }, combat: { round: 2, extra: 'x' } };

        expect(getDifferentialPayload(current, previous, { deepSegments: ['session'] }))
            .toEqual({ session: { a: 2 }, combat: { round: 2, extra: 'x' } });
    });

    it('renvoie le segment entier si le précédent n\'est pas un objet', () => {
        const current = { session: { a: 1 } };

        expect(getDifferentialPayload(current, {}, { deepSegments: ['session'] }))
            .toEqual({ session: { a: 1 } });
    });

    it('renvoie le segment entier quand seul un champ a disparu', () => {
        // Le diff fin ne saurait pas exprimer une suppression : mieux vaut tout
        // renvoyer que de laisser le destinataire sur une valeur périmée.
        const previous = { session: { a: 1, obsolete: 2 } };
        const current = { session: { a: 1 } };

        expect(getDifferentialPayload(current, previous, { deepSegments: ['session'] }))
            .toEqual({ session: { a: 1 } });
    });

    it('ne descend pas dans un tableau', () => {
        const previous = { session: ['a'] };
        const current = { session: ['b'] };

        expect(getDifferentialPayload(current, previous, { deepSegments: ['session'] }))
            .toEqual({ session: ['b'] });
    });

    it('conserve le comportement d\'origine sans options', () => {
        const previous = { session: { a: 1, b: 2 } };
        const current = { session: { a: 9, b: 2 } };

        expect(getDifferentialPayload(current, previous)).toEqual({ session: { a: 9, b: 2 } });
    });

    it('partage la référence des segments retournés', () => {
        // Le diff n'est pas une copie : muter le résultat muterait l'état courant.
        const current = { a: { n: 1 } };
        const diff = getDifferentialPayload(current, {});

        expect(diff.a).toBe(current.a);
    });
});
