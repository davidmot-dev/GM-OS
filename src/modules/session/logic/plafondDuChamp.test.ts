import { describe, it, expect } from 'vitest';
import { plafondDuChamp } from './plafondDuChamp';

/** **La Stase plafonnée au Ka dominant** — Nephilim, lot C, 2026-10-18. */
const CHAMPS = [
    { id: 'stasis_degree', type: 'number' as const },
    { id: 'ka_dominant_degre', type: 'formula' as const, formula: 'KA' },
    { id: 'ka_fire', type: 'number' as const },
];
const lire = (valeurs: Record<string, unknown>) => (id: string) => valeurs[id];

describe('le plafond lu sur un autre champ', () => {
    it('une formule : le degré du Ka dominant', () => {
        expect(plafondDuChamp({ maxSur: 'ka_dominant_degre' }, CHAMPS, lire({}), () => 5)).toBe(5);
    });

    it('un nombre de la fiche, même écrit en texte', () => {
        expect(plafondDuChamp({ maxSur: 'ka_fire' }, CHAMPS, lire({ ka_fire: '4' }), () => 0)).toBe(4);
    });

    it('sans plafond déclaré, ou un champ visé absent : pas de borne', () => {
        expect(plafondDuChamp({}, CHAMPS, lire({}), () => 5)).toBeUndefined();
        expect(plafondDuChamp({ maxSur: 'ka_inconnu' }, CHAMPS, lire({}), () => 5)).toBeUndefined();
    });

    it('un plafond nul — le Ka dominant pas encore choisi — ne borne pas', () => {
        expect(plafondDuChamp({ maxSur: 'ka_dominant_degre' }, CHAMPS, lire({}), () => 0)).toBeUndefined();
    });

    it('une valeur illisible ne borne pas à zéro', () => {
        expect(plafondDuChamp({ maxSur: 'ka_fire' }, CHAMPS, lire({ ka_fire: '' }), () => 0)).toBeUndefined();
        expect(plafondDuChamp({ maxSur: 'ka_fire' }, CHAMPS, lire({ ka_fire: 'beaucoup' }), () => 0)).toBeUndefined();
    });
});
