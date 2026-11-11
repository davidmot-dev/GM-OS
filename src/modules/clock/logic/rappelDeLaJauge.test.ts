import { describe, it, expect } from 'vitest';
import { aUnRappel, rappelRegle, rappelsEnAttente, rearmerLesRappels, texteDuRappel, LONGUEUR_DU_RAPPEL, type RappelDeJauge } from './rappelDeLaJauge';
import type { SensDeLaJauge } from './sensDeLaJauge';

type Jauge = { id: string; name: string; totalSegments: number; filledSegments: number; sens?: SensDeLaJauge; rappel?: RappelDeJauge };

/**
 * Ce que ces essais protègent (lot 2, `2026-11-11-rappel-de-jet-du.md`, T1 ;
 * C1, C2, C3) : au bout de la jauge — dans les deux sens —, le rappel attend le
 * meneur, une fois par passage, et se réarme quand la jauge en repart.
 */

const jauge = (filledSegments: number, extra: Partial<Jauge> = {}): Jauge => ({
    id: 'air', name: 'Air respirable', totalSegments: 6, filledSegments, ...extra,
});
const RAPPEL = { texte: "Jet d'Endurance, tout le monde" };

describe('rappelsEnAttente', () => {
    it('au plein pour une jauge qui monte, au vide pour une qui s’épuise', () => {
        expect(rappelsEnAttente([jauge(6, { rappel: RAPPEL })])).toEqual([
            { jaugeId: 'air', nom: 'Air respirable', texte: RAPPEL.texte, bout: 'plein' },
        ]);
        expect(rappelsEnAttente([jauge(5, { rappel: RAPPEL })])).toEqual([]);
        expect(rappelsEnAttente([jauge(0, { rappel: RAPPEL, sens: 'epuisement' })])[0].bout).toBe('vide');
        expect(rappelsEnAttente([jauge(6, { rappel: RAPPEL, sens: 'epuisement' })])).toEqual([]);
    });

    it('traité, il n’attend plus ; sans texte, il n’existe pas ; une jauge d’hier ne change rien', () => {
        expect(rappelsEnAttente([jauge(6, { rappel: { ...RAPPEL, traite: true } })])).toEqual([]);
        expect(rappelsEnAttente([jauge(6, { rappel: { texte: '   ' } })])).toEqual([]);
        expect(rappelsEnAttente([jauge(6)])).toEqual([]);
        expect(rappelsEnAttente(undefined)).toEqual([]);
    });

    it('une jauge sans segment n’a pas de bout', () => {
        expect(rappelsEnAttente([{ ...jauge(0, { rappel: RAPPEL }), totalSegments: 0 }])).toEqual([]);
    });
});

describe('rearmerLesRappels — une fois par passage', () => {
    it('réarme un rappel traité dont la jauge a quitté le bout', () => {
        const [j] = rearmerLesRappels([jauge(5, { rappel: { ...RAPPEL, traite: true } })]);
        expect(j.rappel).toEqual(RAPPEL);
    });

    it('ne réarme pas tant que la jauge reste au bout', () => {
        const [j] = rearmerLesRappels([jauge(6, { rappel: { ...RAPPEL, traite: true } })]);
        expect(j.rappel).toEqual({ ...RAPPEL, traite: true });
    });

    it('⛔ rend le même tableau quand rien ne change (l’abonnement bouclerait)', () => {
        const tensions = [jauge(6, { rappel: { ...RAPPEL, traite: true } }), jauge(3, { rappel: RAPPEL }), jauge(2)];
        expect(rearmerLesRappels(tensions)).toBe(tensions);
    });
});

describe('le texte du rappel', () => {
    it('rogné et borné ; vide = pas de rappel', () => {
        expect(texteDuRappel('  Jet  ')).toBe('Jet');
        expect(texteDuRappel('x'.repeat(500))).toHaveLength(LONGUEUR_DU_RAPPEL);
        expect(texteDuRappel(null)).toBe('');
        expect(aUnRappel({ rappel: { texte: '' } })).toBe(false);
        expect(aUnRappel({})).toBe(false);
    });

    it('régler : un texte vide efface ; changer le texte ne rouvre pas un passage traité', () => {
        expect(rappelRegle(RAPPEL, '  ')).toBeUndefined();
        expect(rappelRegle(undefined, ' Jet ')).toEqual({ texte: 'Jet' });
        expect(rappelRegle({ ...RAPPEL, traite: true }, 'Autre')).toEqual({ texte: 'Autre', traite: true });
    });
});
