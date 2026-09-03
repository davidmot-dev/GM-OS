import { describe, it, expect } from 'vitest';
import { nomDeGabarit, origineOuDefaut } from './promotionDuCombattant';

describe('nomDeGabarit', () => {
    it('retire le numéro d’exemplaire', () => {
        expect(nomDeGabarit('Tireur 2')).toBe('Tireur');
        expect(nomDeGabarit('Garde du corps 11')).toBe('Garde du corps');
    });

    it('laisse tranquille un nom sans numéro', () => {
        expect(nomDeGabarit('Brute (Piétaille)')).toBe('Brute (Piétaille)');
        expect(nomDeGabarit('Xénomorphe')).toBe('Xénomorphe');
    });

    it('⚠️ ne retire QUE le numéro final', () => {
        /*
          Un « Chien à deux têtes » garde ses deux têtes, et un « Réplicant
          Nexus 6 » reste un Nexus 6 s'il n'y en a qu'un — le numéro d'exemplaire
          est celui que l'atelier ajoute EN FIN de nom, precede d'une espace.
        */
        expect(nomDeGabarit('Chien à 2 têtes')).toBe('Chien à 2 têtes');
        expect(nomDeGabarit('Sentinelle Mk3')).toBe('Sentinelle Mk3');
    });

    it('ne rend jamais une chaîne vide', () => {
        /* Un combattant nommé « 3 » existerait : mieux vaut « 3 » que rien. */
        expect(nomDeGabarit('3')).toBe('3');
        expect(nomDeGabarit('  Pillard 4  ')).toBe('Pillard');
    });
});

describe('origineOuDefaut', () => {
    it('rend l’origine quand le combattant a été fabriqué', () => {
        expect(origineOuDefaut({ archetypeId: 'brute', rangId: 'boss' }))
            .toEqual({ archetypeId: 'brute', rangId: 'boss' });
    });

    it('rend un repli neutre pour un combattant ajouté à la main', () => {
        /*
          Ni archétype ni rang inventés : « quelconque » et « piétaille » ne
          pretendent rien, et le meneur les corrigera dans l'atelier s'il
          refabrique depuis ce gabarit.
        */
        expect(origineOuDefaut(undefined)).toEqual({ archetypeId: 'quelconque', rangId: 'pietaille' });
    });
});
