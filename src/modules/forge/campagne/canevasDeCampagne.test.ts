import { describe, it, expect } from 'vitest';
import {
    CANEVAS_DE_CAMPAGNE, CLEFS_DE_CAMPAGNE, SUJETS_PAR_ACTE, CLEF_DES_REGLES_PROPRES,
    clefCanoniqueDeCampagne, enonceDuSujet, slugFicheDeCampagne,
} from './canevasDeCampagne';
import { clefCanonique } from '../rules/canevas';

/**
 * Ce que ces tests protègent : **le canevas de campagne ne se confond pas avec
 * celui des règles**, et le rabattage reste aussi prudent pour l'un que pour
 * l'autre.
 *
 * Le rapprochement approximatif a déjà coûté cher une fois. Le 2026-08-10, sur
 * Blade Runner, « Différence mécanique Humains vs Réplicants (Jets forcés &
 * Dégâts/Stress) » était rabattu sur « Dégâts et types de dégâts » sur un seul
 * mot commun : la fiche changeait de slug et **écrasait la vraie fiche Dégâts**.
 * David l'a reforgée sept fois sans jamais la voir aboutir.
 */

describe('le canevas de campagne', () => {
    it('n\'a aucun sujet de règles, sauf celui qui ne nourrit aucun pilote', () => {
        /**
         * Décision de David : *« dans une campagne tu ne dois pas extraire les
         * règles. »* Le pilote appartient au JEU ; une règle propre à un module
         * qui y entrerait contaminerait toutes les autres campagnes du même jeu.
         */
        const clefsDeRegles = ['Résolution des jets', 'Initiative et déroulement du tour', 'Santé et blessures'];
        for (const clef of clefsDeRegles) {
            expect(CLEFS_DE_CAMPAGNE, `« ${clef} » relève du jeu, pas de la campagne`).not.toContain(clef);
        }
        expect(CLEFS_DE_CAMPAGNE).toContain(CLEF_DES_REGLES_PROPRES);
    });

    it('la structure en actes précède les sujets qui en dépendent', () => {
        // Sa réponse découpe les deux sujets `parActe` : la demander après
        // obligerait à relancer le carnet sur ce qu'on aurait déjà lu.
        const rangDeLaStructure = CLEFS_DE_CAMPAGNE.indexOf('Structure en actes');
        for (const sujet of SUJETS_PAR_ACTE) {
            expect(CLEFS_DE_CAMPAGNE.indexOf(sujet.clef)).toBeGreaterThan(rangDeLaStructure);
        }
    });

    it('deux sujets se demandent acte par acte, et ce sont les énumérations', () => {
        expect(SUJETS_PAR_ACTE.map(s => s.clef)).toEqual(['Personnages non joueurs', 'Scènes prévues']);
    });

    it('aucune clé n\'est en double', () => {
        // Deux clés identiques feraient écrire deux fiches au même slug — la
        // seconde effacerait la première, sans un mot.
        expect(new Set(CLEFS_DE_CAMPAGNE).size).toBe(CLEFS_DE_CAMPAGNE.length);
    });

    it('aucun slug n\'est en double non plus', () => {
        const slugs = CLEFS_DE_CAMPAGNE.map(c => slugFicheDeCampagne(c));
        expect(new Set(slugs).size).toBe(slugs.length);
    });
});

describe('clefCanoniqueDeCampagne', () => {
    it('reconnaît la clé rendue telle quelle', () => {
        expect(clefCanoniqueDeCampagne('Lieux majeurs')).toBe('Lieux majeurs');
    });

    it('rattrape une reformulation du carnet', () => {
        expect(clefCanoniqueDeCampagne('Les factions et organisations en présence'))
            .toBe('Factions et organisations');
    });

    it('rend null sur un sujet hors canevas plutôt que de forcer', () => {
        /**
         * *« Ne jamais forcer un rattachement : une fiche rangée sous un mauvais
         * sujet est pire qu'une fiche hors canevas, puisqu'elle fausse la
         * comparaison au lieu de simplement s'en abstenir. »*
         */
        expect(clefCanoniqueDeCampagne('Le bestiaire des créatures du désert')).toBeNull();
        expect(clefCanoniqueDeCampagne('')).toBeNull();
    });

    it('les deux canevas restent étanches', () => {
        // Un sujet de règles ne doit pas trouver de place dans le canevas de
        // campagne, ni l'inverse : les fiches iraient dans le mauvais corpus.
        expect(clefCanoniqueDeCampagne('Initiative et déroulement du tour')).toBeNull();
        expect(clefCanonique('Structure en actes')).toBeNull();
        expect(clefCanonique('Secrets et révélations')).toBeNull();
    });
});

describe('enonceDuSujet — la borne par acte', () => {
    const pnj = CANEVAS_DE_CAMPAGNE.find(s => s.clef === 'Personnages non joueurs')!;
    const lieux = CANEVAS_DE_CAMPAGNE.find(s => s.clef === 'Lieux majeurs')!;

    it('borne le sujet à l\'acte demandé, en le nommant', () => {
        // Sans cette borne, le carnet répond sur toute la campagne : on paierait
        // dix fois le même appel pour dix réponses identiques, et le second axe
        // de découpage n'existerait que sur le papier.
        const enonce = enonceDuSujet(pnj, 'Acte I — La Chute de Carthag');
        expect(enonce).toContain('Acte I — La Chute de Carthag');
        expect(enonce).toContain('Ignore le reste de la campagne');
    });

    it('un sujet qui n\'est pas par acte ignore l\'acte fourni', () => {
        expect(enonceDuSujet(lieux, 'Acte I')).toBe(lieux.enonce);
    });

    it('un sujet par acte sans acte reste son énoncé nu', () => {
        // L'atelier ne doit pas pouvoir envoyer « UNIQUEMENT pour la partie
        // intitulée « undefined » ».
        expect(enonceDuSujet(pnj)).toBe(pnj.enonce);
    });
});

describe('slugFicheDeCampagne', () => {
    it('range une fiche par acte sous un nom qui dit lequel', () => {
        expect(slugFicheDeCampagne('Personnages non joueurs', 'Acte I — La Chute'))
            .toBe('personnages-non-joueurs--acte-i-la-chute');
    });

    it('deux actes différents ne se marchent pas dessus', () => {
        const a = slugFicheDeCampagne('Scènes prévues', 'Acte I');
        const b = slugFicheDeCampagne('Scènes prévues', 'Acte II');
        expect(a).not.toBe(b);
    });

    it('sans acte, c\'est la convention des fiches de règles', () => {
        expect(slugFicheDeCampagne('Lieux majeurs')).toBe('lieux-majeurs');
    });
});
