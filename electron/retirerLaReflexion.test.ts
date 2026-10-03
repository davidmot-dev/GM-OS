import { describe, it, expect } from 'vitest';
import { retirerLaReflexion, filtreDeReflexion } from './retirerLaReflexion';

describe('une réponse entière, sans sa réflexion (2026-10-03)', () => {
    it('retire le bloc et les blancs qui le suivent', () => {
        expect(retirerLaReflexion('<think> The user asks…</think>\n\nMcCoy est au quai 9.')).toBe('McCoy est au quai 9.');
    });
    it('laisse intacte une réponse sans réflexion', () => {
        expect(retirerLaReflexion('Rien à retirer.\n')).toBe('Rien à retirer.\n');
    });
    it('un bloc jamais refermé (coupé par num_predict) ne laisse rien de lui', () => {
        expect(retirerLaReflexion('<think> The user asks, and asks')).toBe('');
    });
    it('une balise fermante orpheline : la réflexion commençait avant', () => {
        expect(retirerLaReflexion('je réfléchis…</think> La réponse.')).toBe('La réponse.');
    });
});

/** Fait passer un texte par le filtre, découpé en morceaux de `n` caractères. */
function enFlux(texte: string, n: number): string {
    const f = filtreDeReflexion();
    let sortie = '';
    for (let i = 0; i < texte.length; i += n) sortie += f.pousser(texte.slice(i, i + n));
    return sortie + f.finir();
}

describe('le même retrait, morceau par morceau', () => {
    const REPONSE = '<think> The user asks: "ou est Mccoy". Let me think.</think>\n\nMcCoy se cache au quai 9.';

    it.each([1, 2, 3, 5, 7, 64])('quel que soit le découpage (%i)', (n) => {
        expect(enFlux(REPONSE, n)).toBe('McCoy se cache au quai 9.');
    });

    it('ce qui précède la réflexion sort tel quel', () => {
        expect(enFlux('Bonjour <think>hum</think> le monde', 3)).toBe('Bonjour le monde');
    });

    it('un « < » qui n’ouvre pas de balise finit par sortir', () => {
        expect(enFlux('3 < 5 et <b>gras</b>', 2)).toBe('3 < 5 et <b>gras</b>');
    });

    it('une réflexion jamais refermée ne sort jamais', () => {
        expect(enFlux('<think> pas de fin', 4)).toBe('');
    });
});
