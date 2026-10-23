import { describe, it, expect } from 'vitest';
import { apresLeGain, indicesAPortee, indicesPourLeLecteur, nouvelleAffaire, peutGagner, pointsDuJet, revelerA } from './pointsDEnquete';
import type { Clue } from '../../../types/chronicle.types';

/**
 * **Les points d'enquête** — Crimes, C5, livre p. 436–440. Les exemples sont
 * ceux du livre : Joseph Gueslin, Fouineur, et la larve de bombyx.
 */
const STYLES = [
    { id: 'limier', label: 'Limier', niveau: 'limier', points: 'compteur_limier' },
    { id: 'fouineur', label: 'Fouineur', niveau: 'fouineur', points: 'compteur_fouineur' },
    { id: 'conde', label: 'Condé', niveau: 'conde', points: 'compteur_conde' },
];
const gueslin = { id: 'gueslin', nom: 'Joseph Gueslin', fiche: { fouineur: 2, compteur_fouineur: 2, limier: 0, compteur_limier: 0, conde: 0 } };
const rachel = { id: 'rachel', nom: 'Rachel Attar', fiche: { limier: 2, compteur_limier: 3 } };
const larve: Clue = {
    id: 'larve', campaignId: 'c', title: 'La larve de bombyx', content: 'Dans la gorge.', isRevealed: false,
    seuilsDEnquete: [{ style: 'limier', points: 3 }, { style: 'fouineur', points: 4 }],
    gainsDEnquete: [{ style: 'limier', points: 1 }],
};

describe('gagner des points', () => {
    it('1 pour un succès, 2 à deux réussites, −1 sur un échec critique, rien sur un échec (p. 436)', () => {
        expect(pointsDuJet('reussite', 1)).toBe(1);
        expect(pointsDuJet('reussite-mitigee', 1)).toBe(1);
        expect(pointsDuJet('reussite', 2)).toBe(2);
        expect(pointsDuJet('echec', 0)).toBe(0);
        expect(pointsDuJet('echec-critique', 0)).toBe(-1);
    });

    it('seulement dans un style qu’on possède (p. 437) ; jamais sous zéro', () => {
        expect(peutGagner(gueslin.fiche, STYLES[1])).toBe(true);
        expect(peutGagner(gueslin.fiche, STYLES[2])).toBe(false);
        expect(apresLeGain(gueslin.fiche, STYLES[1], 1)).toBe(3);
        expect(apresLeGain({ compteur_limier: 0 }, STYLES[0], -1)).toBe(0);
    });

    it('« Nouvelle affaire » ramène les points au niveau du style', () => {
        expect(nouvelleAffaire({ fouineur: 2, compteur_fouineur: 7, limier: 1, compteur_limier: 4 }, STYLES))
            .toEqual({ compteur_limier: 1, compteur_fouineur: 2, compteur_conde: 0 });
    });
});

describe('les indices à portée', () => {
    it('la larve : Rachel l’atteint par Limier 3, Gueslin pas encore par Fouineur 4', () => {
        const portee = indicesAPortee([larve], [gueslin, rachel], STYLES);
        expect(portee.map(p => [p.enqueteur.id, p.seuil.style.id, p.seuil.atteints])).toEqual([['rachel', 'limier', 3]]);
    });

    it('un indice révélé, déjà connu ou sans seuil n’y figure pas', () => {
        expect(indicesAPortee([{ ...larve, isRevealed: true }], [rachel], STYLES)).toEqual([]);
        expect(indicesAPortee([{ ...larve, connuDe: ['rachel'] }], [rachel], STYLES)).toEqual([]);
        expect(indicesAPortee([{ ...larve, seuilsDEnquete: [] }], [rachel], STYLES)).toEqual([]);
    });

    it('révélé à Rachel seule : elle le connaît, l’origine est notée, son gain écrit', () => {
        const r = revelerA(larve, rachel, STYLES, 'limier', 42);
        expect(r.indice).toEqual({ connuDe: ['rachel'], trouvePar: { personnageId: 'rachel', nom: 'Rachel Attar', style: 'limier', quand: 42 } });
        expect(r.ecrits).toEqual({ compteur_limier: 4 });
        // Gueslin ne possède pas Limier : il n'y gagnerait rien, et on le dit.
        expect(revelerA(larve, gueslin, STYLES).dits).toEqual(['Limier : Joseph Gueslin ne possède pas ce style, il n\'y gagne rien.']);
    });
});

describe('ce que chaque tablette reçoit', () => {
    const indices = [
        { id: 'public', isRevealed: true },
        { id: 'a-rachel', isRevealed: false, connuDe: ['rachel'] },
        { id: 'secret', isRevealed: false },
    ];
    it('la tablette de Rachel : le public et le sien ; celle de Gueslin : le public', () => {
        expect(indicesPourLeLecteur(indices, 'rachel').map(c => c.id)).toEqual(['public', 'a-rachel']);
        expect(indicesPourLeLecteur(indices, 'gueslin').map(c => c.id)).toEqual(['public']);
    });
    it('une fenêtre publique : le public seul ; à l’émission, le privé reste pour le serveur', () => {
        expect(indicesPourLeLecteur(indices, null).map(c => c.id)).toEqual(['public']);
        expect(indicesPourLeLecteur(indices).map(c => c.id)).toEqual(['public', 'a-rachel']);
    });
});
