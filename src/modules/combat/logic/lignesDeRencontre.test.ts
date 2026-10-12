import { describe, it, expect } from 'vitest';
import { avecLeNombre, libelleDeLaLigne, ligneDeLArchetype, ligneDuGabarit, resumeDeLaRencontre } from './lignesDeRencontre';
import type { GabaritDAdversaire } from '../useBestiaireStore';

const gabarit: GabaritDAdversaire = {
    id: 'g-1', jeuId: 'jeu', nom: 'Agent de Wallace', archetypeId: 'tireur', rangId: 'aguerri', sheetData: {}, creeLe: 1,
};

describe('lignesDeRencontre', () => {
    it('propose le nombre du rang, comme l’Atelier : quatre piétailles, deux aguerris', () => {
        expect(ligneDeLArchetype('brute')).toMatchObject({ nombre: 4 });
        expect(ligneDuGabarit(gabarit)).toMatchObject({ nombre: 2, nom: 'Agent de Wallace', archetypeId: 'tireur', rangId: 'aguerri' });
    });

    it('borne le nombre entre 1 et 20, et ne touche pas un PNJ', () => {
        const l = ligneDeLArchetype('brute');
        expect(avecLeNombre(l, 0)).toMatchObject({ nombre: 1 });
        expect(avecLeNombre(l, 99)).toMatchObject({ nombre: 20 });
        expect(avecLeNombre(l, Number.NaN)).toMatchObject({ nombre: 1 });
        const pnj = { genre: 'entite' as const, entiteId: 'x' };
        expect(avecLeNombre(pnj, 5)).toBe(pnj);
    });

    it('se lit « 3 × Nom », et un PNJ disparu se dit', () => {
        const nom = (id: string) => (id === 'luv' ? 'Luv' : undefined);
        expect(libelleDeLaLigne(avecLeNombre(ligneDuGabarit(gabarit), 3), nom)).toBe('3 × Agent de Wallace');
        expect(libelleDeLaLigne({ genre: 'entite', entiteId: 'luv' }, nom)).toBe('Luv');
        expect(libelleDeLaLigne({ genre: 'entite', entiteId: 'efface' }, nom)).toBe('PNJ disparu');
        expect(resumeDeLaRencontre({ lignes: [ligneDeLArchetype('brute', 'boss'), { genre: 'entite', entiteId: 'luv' }] }, nom))
            .toBe('Brute, Luv');
    });
});
