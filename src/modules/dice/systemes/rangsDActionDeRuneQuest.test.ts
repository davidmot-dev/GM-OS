import { describe, it, expect } from 'vitest';
import { DECLARATION_PAR_DEFAUT, ordonnerLesRangs, rangDAction, report, type DeclarationDeRA } from './rangsDActionDeRuneQuest';

/** RQ-A4, 03/11/2026 : les exemples du livre de base (pages imprimées). */
const vasana = { raDex: 3, raTai: 2, dex: 11 };
const declarer = (d: Partial<DeclarationDeRA>): DeclarationDeRA => ({ ...DECLARATION_PAR_DEFAUT, ...d });

describe('le rang d’action selon l’action (p. 192-195)', () => {
    it('mêlée : le RA de l’arme de la fiche, DEX, TAI et allonge compris — Vasana, épée large 7 (p. 85)', () => {
        expect(rangDAction(declarer({ intention: 'melee', raArme: 7 }), vasana)).toMatchObject({ ra: 7, detail: '7 arme', auDelaDe12: false });
        expect(rangDAction(declarer({ intention: 'melee', raArme: 7, deplacement: 1 }), vasana).detail).toBe('7 arme + 1 déplacement');
    });

    it('mêlée sans RA d’arme : DEX + TAI, et le dit', () => {
        const r = rangDAction(declarer({ intention: 'melee' }), vasana);
        expect(r.ra).toBe(5);
        expect(r.remarques[0]).toMatch(/allonge/);
    });

    it('tir : la DEX seule, sans la TAI — son arc au RA 3 ; deux flèches au RA 3 puis 11 (p. 195)', () => {
        expect(rangDAction(declarer({ intention: 'distance', raArme: 3 }), vasana).ra).toBe(3);
        expect(rangDAction(declarer({ intention: 'distance' }), vasana).ra).toBe(3);
        expect(rangDAction(declarer({ intention: 'distance', raArme: 3, preparations: 1, ajustement: 3 }), vasana).ra).toBe(11);
    });

    it('magie spirituelle : Démoralisation (2 PM) au RA 4 ; +5 pour passer d’une arme au sort (p. 194-195)', () => {
        expect(rangDAction(declarer({ intention: 'magie-spirituelle', pm: 2 }), vasana).ra).toBe(4);
        expect(rangDAction(declarer({ intention: 'magie-spirituelle', pm: 3, armeVersSort: true }), vasana))
            .toMatchObject({ ra: 10, detail: '3 DEX + 2 PM + 5 arme → sort' });
    });

    it('magie runique : RA 1, +1 par point de renforcement au-delà du premier (p. 194)', () => {
        expect(rangDAction(declarer({ intention: 'magie-runique', pm: 1 }), vasana).ra).toBe(1);
        expect(rangDAction(declarer({ intention: 'magie-runique', pm: 3 }), vasana).ra).toBe(3);
    });

    it('sorcellerie : Damastol, RA DEX 3 et 7 PM de plus — deux rounds complets, effet au RA 5 (p. 386)', () => {
        const r = rangDAction(declarer({ intention: 'sorcellerie', pm: 7 }), { raDex: 3 });
        expect(r).toMatchObject({ ra: 29, auDelaDe12: true, seReporteDOffice: true });
        expect(report(r.ra)).toEqual({ rounds: 2, ra: 5 });
    });

    it('délais : préparer +5, surprise +3 ou +1 ; un RA sous 1 vaut 1 (p. 192-193)', () => {
        expect(rangDAction(declarer({ intention: 'melee', raArme: 4, preparations: 2, surprise: 'proche' }), vasana).ra).toBe(17);
        expect(rangDAction(declarer({ intention: 'melee', raArme: 4, surprise: 'loin' }), vasana).ra).toBe(5);
        const r = rangDAction(declarer({ intention: 'melee', raArme: 1, ajustement: -3 }), vasana);
        expect(r.ra).toBe(1);
        expect(r.remarques).toContain('Un RA sous 1 vaut 1 (p. 192).');
    });

    it('au-delà de 12 : rien ce round ; une arme attend la meneuse, un sort se poursuit (p. 194)', () => {
        const coup = rangDAction(declarer({ intention: 'melee', raArme: 9, preparations: 1 }), vasana);
        expect(coup).toMatchObject({ ra: 14, auDelaDe12: true, seReporteDOffice: false });
        expect(rangDAction(declarer({ intention: 'melee', raArme: 8, preparations: 1 }), vasana).auDelaDe12).toBe(true);
        expect(rangDAction(declarer({ intention: 'melee', raArme: 7, preparations: 1 }), vasana).auDelaDe12).toBe(false);
        expect(report(13)).toEqual({ rounds: 1, ra: 1 });
        expect(report(37)).toEqual({ rounds: 3, ra: 1 });
    });
});

describe('l’ordre du round (p. 192)', () => {
    it('le plus bas d’abord ; à égalité, la DEX la plus haute ; même DEX, simultané', () => {
        const { ordre, horsDuRound } = ordonnerLesRangs([
            { id: 'broo', nom: 'Broo', ra: 14, dex: 9 },
            { id: 'yanioth', nom: 'Yanioth', ra: 7, dex: 12 },
            { id: 'vasana', nom: 'Vasana', ra: 7, dex: 11 },
            { id: 'harmast', nom: 'Harmast', ra: 5, dex: 14 },
            { id: 'troll', nom: 'Troll', ra: 9, dex: 10 },
            { id: 'gargouille', nom: 'Gargouille', ra: 9, dex: 10 },
        ]);
        expect(ordre.map(r => r.id)).toEqual(['harmast', 'yanioth', 'vasana', 'troll', 'gargouille']);
        expect(ordre.filter(r => r.simultane).map(r => r.id)).toEqual(['troll', 'gargouille']);
        expect(horsDuRound.map(r => r.id)).toEqual(['broo']);
    });
});
