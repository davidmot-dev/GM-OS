import { describe, it, expect } from 'vitest';
import {
    gabaritInventaireDeCampagne, gabaritStructureDeCampagne,
    gabaritFicheDeCampagne, toutesLesInvites,
} from './gabaritsDeCampagne';
import { CANEVAS_DE_CAMPAGNE, SUJETS_PAR_ACTE } from './canevasDeCampagne';

/**
 * Ce que ces tests protègent : **les trois lignes qui portent tout le reste**.
 *
 * Elles sont les mêmes que côté règles, parce que les trois défauts qu'elles
 * corrigent n'ont rien à voir avec le sujet traité : l'interdiction d'inventer
 * (sans elle un sujet absent produit du générique plausible), l'obligation de
 * rendre une fiche même sur un sujet non couvert (sans elle l'absence est
 * invisible, et *invisible vaut faux*), et les symboles en toutes lettres (la v1
 * d'Alien y a perdu quarante-neuf symboles de réussite rendus en glyphes).
 *
 * *Le levier est l'invite, pas le modèle* — mesuré le 2026-08-14 : les groupes
 * dont on a corrigé l'énoncé ont cessé de se tromper, les autres ont recopié
 * leur erreur au caractère près.
 */

const tousLesGabarits = () => [
    gabaritInventaireDeCampagne(),
    gabaritStructureDeCampagne(),
    ...CANEVAS_DE_CAMPAGNE.map(s => gabaritFicheDeCampagne(s)),
];

describe('les invariants de tous les gabarits', () => {
    it('interdisent toujours d\'inventer', () => {
        for (const g of tousLesGabarits()) {
            expect(g.toLowerCase()).toMatch(/n'invente rien|ne complète jamais|plutôt que de compléter/);
        }
    });

    it('interdisent explicitement les numéros de page, et demandent des titres', () => {
        /**
         * Les pages rendues par le carnet sont **fabriquées** : neuf fiches Dune
         * sur dix-sept citaient au-delà de la dernière page du livre. Un titre,
         * lui, est littéralement dans le texte, et `electron/bookIndex.ts` le
         * résout en page localement.
         *
         * Ce test a trouvé le trou qu'il cherchait : le gabarit de structure se
         * contentait de demander des titres sans interdire les pages. Une
         * consigne absente n'est pas une consigne implicite.
         */
        for (const g of tousLesGabarits()) {
            expect(g).toMatch(/Aucun numéro de page|JAMAIS de numéro de page/i);
            expect(g).toMatch(/TITRES? EXACTS?/i);
        }
    });

    it('ne demandent jamais d\'enregistrer dans le studio', () => {
        // La consigne détourne le livrable vers le studio du carnet et ne
        // renvoie qu'un compte rendu en prose. À travers MCP, la réponse est
        // tout ce qu'on reçoit.
        for (const g of tousLesGabarits()) {
            expect(g).not.toMatch(/studio/i);
        }
    });

    it('écartent les règles du jeu, qui n\'appartiennent pas à la campagne', () => {
        for (const g of tousLesGabarits()) {
            expect(g).toMatch(/N'aborde PAS les RÈGLES/);
            expect(g).toMatch(/AUCUNE caractéristique chiffrée/);
        }
    });
});

describe('gabaritInventaireDeCampagne', () => {
    it('pose les dix sujets du canevas, numérotés', () => {
        const g = gabaritInventaireDeCampagne();
        for (const sujet of CANEVAS_DE_CAMPAGNE) {
            expect(g, `« ${sujet.clef} » doit être posé`).toContain(sujet.enonce);
        }
        expect(g).toContain(`${CANEVAS_DE_CAMPAGNE.length}\nsujets`);
    });

    it('exige du concret, avec le contre-exemple sous les yeux', () => {
        // « La campagne comporte plusieurs factions » est une réponse inutile.
        // Montrer ce qu'on ne veut pas vaut mieux que le décrire.
        expect(gabaritInventaireDeCampagne()).toContain('est une réponse inutile');
    });

    it('demande de dire ce qui n\'est pas couvert', () => {
        expect(gabaritInventaireDeCampagne()).toContain('non couvert par les');
    });
});

describe('gabaritStructureDeCampagne', () => {
    it('exige le titre TEL QUE LE LIVRE L\'ÉCRIT', () => {
        /**
         * C'est ce titre qui bornera les requêtes par acte : une variante le
         * rendrait introuvable, et les deux sujets `parActe` repartiraient sur
         * toute la campagne — dix appels pour dix réponses identiques.
         */
        const g = gabaritStructureDeCampagne();
        expect(g).toContain("TEL QUE LE LIVRE L'ÉCRIT");
        expect(g).toContain('sans le traduire');
    });

    it('n\'impose pas notre vocabulaire au livre', () => {
        // Un module qui parle de « chapitres » ne doit pas être forcé de dire
        // « actes » : le modèle reformulerait au lieu de recopier.
        expect(gabaritStructureDeCampagne()).toMatch(/actes, chapitres, épisodes/);
    });

    it('accepte qu\'une campagne ne soit pas découpée', () => {
        expect(gabaritStructureDeCampagne()).toContain("si la campagne n'est pas\ndécoupée");
    });
});

describe('gabaritFicheDeCampagne', () => {
    const pnj = SUJETS_PAR_ACTE[0];
    const lieux = CANEVAS_DE_CAMPAGNE.find(s => s.clef === 'Lieux majeurs')!;

    it('borne un sujet par acte, et nomme l\'acte dans le titre et le contenu', () => {
        const g = gabaritFicheDeCampagne(pnj, 'Acte I — La Chute de Carthag');
        expect(g).toContain('« Personnages non joueurs — Acte I — La Chute de Carthag »');
        expect(g).toContain('- partie : Acte I — La Chute de Carthag');
        expect(g).toContain('Ignore le reste de la campagne');
    });

    it('un sujet hors acte ne porte pas de ligne « partie »', () => {
        expect(gabaritFicheDeCampagne(lieux)).not.toContain('- partie :');
    });

    it('exige l\'exhaustivité, et le dit avec un exemple chiffré', () => {
        /**
         * La leçon du groupe `fiche` de la Forge Système, payée en réel le
         * 2026-08-13 : dérivée d'Alien, elle a rendu « Attributs » et
         * « Compétences » **vides l'une comme l'autre**, parce que la cible
         * réclamait nommément les jauges et se taisait sur le reste. *Le modèle
         * fait ce qu'on lui montre.*
         */
        const g = gabaritFicheDeCampagne(lieux);
        expect(g).toContain('ÉNUMÈRE TOUT');
        expect(g).toContain('douze personnages, la fiche en porte douze');
    });

    it('impose de rendre une fiche même sur un sujet absent', () => {
        // Sans cela, l'absence est invisible — et invisible vaut faux.
        const g = gabaritFicheDeCampagne(lieux);
        expect(g).toContain('couverture : absente');
        expect(g).toContain('Ne renvoie JAMAIS une réponse vide');
    });

    it('demande de garder les noms propres à l\'identique', () => {
        // Ce sont eux qui relient les fiches entre elles ; une variante
        // orthographique casse le lien sans que rien ne le signale.
        expect(gabaritFicheDeCampagne(lieux)).toContain('NOMS PROPRES exactement');
    });
});

describe('toutesLesInvites — l\'ordre réel de l\'atelier', () => {
    it('commence par l\'inventaire puis la structure', () => {
        const titres = toutesLesInvites().map(i => i.titre);
        expect(titres[0]).toBe('1. Inventaire');
        expect(titres[1]).toBe('2. Structure en actes');
    });

    it('n\'énumère aucun sujet par acte tant que les actes sont inconnus', () => {
        // C'est l'état réel de l'atelier avant son deuxième appel : les sujets
        // par acte existent, mais rien ne peut encore les border.
        const titres = toutesLesInvites().map(i => i.titre);
        for (const sujet of SUJETS_PAR_ACTE) {
            expect(titres).not.toContain(sujet.clef);
        }
    });

    it('développe un appel par acte une fois la structure connue', () => {
        const titres = toutesLesInvites(['Acte I', 'Acte II']).map(i => i.titre);
        expect(titres).toContain('Personnages non joueurs — Acte I');
        expect(titres).toContain('Personnages non joueurs — Acte II');
        expect(titres).toContain('Scènes prévues — Acte II');
    });

    it('la structure n\'est pas demandée deux fois', () => {
        // Elle a son gabarit propre : ce n'est pas une fiche.
        const titres = toutesLesInvites(['Acte I']).map(i => i.titre);
        expect(titres.filter(t => t.includes('Structure en actes'))).toHaveLength(1);
    });

    it('compte juste : huit fiches simples, plus deux par acte', () => {
        const sansActe = CANEVAS_DE_CAMPAGNE.filter(s => !s.parActe && s.clef !== 'Structure en actes').length;
        const invites = toutesLesInvites(['A', 'B', 'C']);
        expect(invites).toHaveLength(2 + sansActe + SUJETS_PAR_ACTE.length * 3);
    });
});
