import { describe, it, expect } from 'vitest';
import { chercherUnEffet, nu, type EffetCherchable } from './rechercheDEffet';

/**
 * **Ce que la recherche doit trouver — et ce qu'elle ne doit pas ramener.**
 *
 * Chaque cas garde une décision prise en remplaçant la liste déroulante de
 * cinquante entrées par un écran de recherche.
 */

const CATALOGUE: EffetCherchable[] = [
    { valeur: 'torche', nom: 'Torche qui faiblit' },
    { valeur: 'aurore', nom: 'Aurore Boréale' },
    { valeur: 'aube-doree', nom: 'Aube dorée' },
    { valeur: 'stores', nom: 'Stores' },
    { valeur: 'police', nom: 'Police' },
    { valeur: 'variante:v-1', nom: 'Bleue de nuit', origine: 'Torche qui faiblit' },
    { valeur: 'variante:v-2', nom: 'Stores tamisés', origine: 'Stores' },
];

const noms = (r: EffetCherchable[]) => r.map(e => e.nom);

describe('chercher un effet', () => {
    it('rend tout quand on n’a rien tapé', () => {
        // L'écran doit pouvoir s'ouvrir sur le catalogue entier, sans cas à part.
        expect(chercherUnEffet(CATALOGUE, '')).toHaveLength(CATALOGUE.length);
        expect(chercherUnEffet(CATALOGUE, '   ')).toHaveLength(CATALOGUE.length);
    });

    it('trouve par le nom affiché', () => {
        expect(noms(chercherUnEffet(CATALOGUE, 'police'))).toEqual(['Police']);
    });

    /**
     * ⚠️ **Sans accent.** Personne ne va chercher la touche de l'accent aigu au
     * milieu d'une partie — c'est déjà la règle de l'Oracle sur le mot cherché.
     */
    it('ignore les accents et la casse', () => {
        expect(noms(chercherUnEffet(CATALOGUE, 'boreale'))).toEqual(['Aurore Boréale']);
        expect(noms(chercherUnEffet(CATALOGUE, 'AUBE DOREE'))).toEqual(['Aube dorée']);
    });

    it('trouve aussi par l’identifiant technique, celui du guide', () => {
        expect(noms(chercherUnEffet(CATALOGUE, 'aube-doree'))).toEqual(['Aube dorée']);
    });

    /**
     * ⭐ **Le cas qui compte le plus.** Une ambiance porte le nom que le meneur
     * lui a donné — « Bleue de nuit » ne contient pas « torche ». Sans la
     * recherche sur l'origine, *la copie se perdrait derrière son propre nom*,
     * et c'est exactement le défaut qui a motivé cet écran.
     */
    it('ramène une ambiance quand on cherche l’effet dont elle descend', () => {
        expect(noms(chercherUnEffet(CATALOGUE, 'torche')))
            .toEqual(['Torche qui faiblit', 'Bleue de nuit']);
    });

    it('accepte plusieurs mots, dans n’importe quel ordre', () => {
        expect(noms(chercherUnEffet(CATALOGUE, 'stores tamises'))).toEqual(['Stores tamisés']);
        expect(noms(chercherUnEffet(CATALOGUE, 'tamises stores'))).toEqual(['Stores tamisés']);
    });

    it('ne ramène rien plutôt que n’importe quoi', () => {
        expect(chercherUnEffet(CATALOGUE, 'licorne')).toEqual([]);
    });

    it('garde l’ordre reçu — c’est celui des catégories de l’écran', () => {
        const r = chercherUnEffet(CATALOGUE, 's');
        expect(r.map(e => e.valeur)).toEqual(
            CATALOGUE.filter(e => r.includes(e)).map(e => e.valeur),
        );
    });
});

describe('la forme comparée', () => {
    it('déshabille les accents, la casse et les bords', () => {
        expect(nu('  Aurore Boréale ')).toBe('aurore boreale');
        expect(nu('Crépuscule')).toBe('crepuscule');
    });
});
