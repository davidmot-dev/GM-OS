import { describe, it, expect } from 'vitest';
import { seuilDeDefaite, progressionDeLAttaque, horlogeDeDefaite, type TacheDeDefaite } from './TacheDeDefaite';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';

/**
 * Valeurs tirées de `docs/systems/dune/rules/sante-et-blessures.md`, fiche v3.
 */
const DUNE: TacheDeDefaite = {
    sectionDuSeuil: 'competences',
    champParDefaut: 'combat',
    seuil: { min: 4, max: 8 },
    progressionDeBase: 2,
    qualiteMax: 4,
    label: 'Défaite',
};

/** Une fiche de personnage telle que l'éditeur la tient. */
const PAUL = { combat: 6, discipline: 7, mobilite: 5, determination: 1 };

describe('le seuil vient de la fiche, pas du pilote', () => {
    it('vaut la compétence défensive de la cible', () => {
        // « Seuil de la tâche de défaite : égal à la valeur de la compétence
        // défensive de la cible, de quatre à huit. »
        expect(seuilDeDefaite(DUNE, PAUL).valeur).toBe(6);
        expect(seuilDeDefaite(DUNE, PAUL).champ).toBe('combat');
    });

    it('le meneur peut retenir une autre compétence', () => {
        // Se défendre d'une joute verbale n'est pas se défendre d'une lame.
        expect(seuilDeDefaite(DUNE, PAUL, 'discipline').valeur).toBe(7);
    });

    it('un champ absent ne bloque pas le combat, il avertit', () => {
        /**
         * La même règle que pour les jets : une erreur de configuration ne doit
         * pas empêcher une action en pleine partie. On retombe sur le minimum
         * et on dit pourquoi — l'inverse du zéro silencieux.
         */
        const r = seuilDeDefaite(DUNE, PAUL, 'escrime-mentat');
        expect(r.valeur).toBe(4);
        expect(r.avertissements[0]).toContain('escrime-mentat');
    });

    it('une fiche aberrante est ramenée dans les bornes', () => {
        const r = seuilDeDefaite(DUNE, { combat: 40 });
        expect(r.valeur).toBe(8);
        expect(r.avertissements[0]).toContain('entre 4 et 8');
    });
});

describe('la progression d\'une attaque', () => {
    it('vaut deux points plus la qualité de l\'atout', () => {
        // « Progression de base : deux points. Modificateur : plus la valeur de
        // qualité de l'atout offensif, de zéro à quatre. »
        expect(progressionDeLAttaque(DUNE, 0)).toBe(2);
        expect(progressionDeLAttaque(DUNE, 3)).toBe(5);
        expect(progressionDeLAttaque(DUNE)).toBe(2);
    });

    it('la qualité reste dans son échelle', () => {
        expect(progressionDeLAttaque(DUNE, 9)).toBe(6);
        expect(progressionDeLAttaque(DUNE, -4)).toBe(2);
    });
});

describe('l\'horloge de défaite — le mur qui tombe', () => {
    it('ses segments viennent de la fiche, pas du six codé en dur', () => {
        /**
         * `HealthInterpreter.createDefault('clocks')` rendait six segments pour
         * tout le monde. Le seuil de Dune vaut la compétence défensive : un
         * duelliste médiocre tombe en deux coups, un maître en quatre.
         */
        expect(HealthInterpreter.createDefault('clocks').data.segments).toBe(6);
        expect(horlogeDeDefaite(DUNE, PAUL).sante.data.segments).toBe(6);
        expect(horlogeDeDefaite(DUNE, { combat: 4 }).sante.data.segments).toBe(4);
        expect(horlogeDeDefaite(DUNE, { combat: 8 }).sante.data.segments).toBe(8);
    });

    it('elle démarre vide et intacte', () => {
        const { sante } = horlogeDeDefaite(DUNE, PAUL);
        expect(sante.data.filled).toBe(0);
        expect(sante.state).toBe('healthy');
    });

    it('elle garde le champ qui a produit le seuil, pour pouvoir l\'afficher', () => {
        expect(horlogeDeDefaite(DUNE, PAUL, 'discipline').sante.data.champDuSeuil).toBe('discipline');
    });

    it('deux attaques ordinaires suffisent contre une défense rudimentaire', () => {
        /**
         * Le bout en bout : l'horloge vient d'ici, `HealthInterpreter` la
         * remplit. Deux points par attaque, seuil quatre — le second coup met
         * la cible hors de combat.
         */
        const { sante } = horlogeDeDefaite(DUNE, { combat: 4 });
        const progression = progressionDeLAttaque(DUNE, 0);

        const apresUn = HealthInterpreter.calculateNextState(sante, { value: progression });
        expect(apresUn.data.filled).toBe(2);
        expect(apresUn.state).not.toBe('dead');

        const apresDeux = HealthInterpreter.calculateNextState(apresUn, { value: progression });
        expect(apresDeux.data.filled).toBe(4);
        expect(apresDeux.state, 'le seuil atteint met la cible hors de scène').toBe('dead');
    });

    it('un atout dévastateur abat un maître en deux coups aussi', () => {
        // Seuil 8, progression 2 + 4 = 6 : deux coups font 12, soit au-delà.
        const { sante } = horlogeDeDefaite(DUNE, { combat: 8 });
        const progression = progressionDeLAttaque(DUNE, 4);
        expect(progression).toBe(6);

        const apresUn = HealthInterpreter.calculateNextState(sante, { value: progression });
        expect(apresUn.state).not.toBe('dead');
        expect(HealthInterpreter.calculateNextState(apresUn, { value: progression }).state).toBe('dead');
    });
});
