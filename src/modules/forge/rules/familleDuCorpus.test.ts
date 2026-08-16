import { describe, it, expect } from 'vitest';
import { lireNature, sourceDuGroupe } from './familleDuCorpus';
import { GROUPES, type FicheDuCorpus, type GroupeDeChamps } from './GroupesDeChamps';

/**
 * Ce que ces tests protègent : **le jeu l'emporte toujours sur sa famille.**
 *
 * Alien *modifie* Year Zero Engine — le stress, la panique et les dés de stress
 * lui appartiennent. Une famille qui prendrait le dessus produirait un pilote
 * générique et faux, ce qui est **pire qu'un pilote incomplet** : un manque se
 * voit à la revue, une valeur plausible et fausse se joue en séance sans que
 * personne ne l'ait choisie.
 *
 * Mesuré le 2026-08-14, ce que la famille apporte vraiment : le SRD YZE couvre
 * 13 des 14 sujets et porte la mécanique de poussée — le cœur du système — que
 * le corpus d'Alien n'a qu'en v1 hors canevas.
 */

const fiche = (sujet: string, contenu = 'Contenu.'): FicheDuCorpus => ({ sujet, contenu });
const groupe = (id: string) => GROUPES.find(g => g.id === id)!;

describe('le jeu passe avant sa famille', () => {
    it('les fiches du jeu sont retenues seules, même si la famille en a aussi', () => {
        const source = sourceDuGroupe(
            groupe('jet'),
            [fiche('Résolution des jets', 'Chaque six est une réussite.')],
            [fiche('Résolution des jets', 'Le socle générique dit autre chose.')],
        );
        expect(source.venuDeLaFamille).toBe(false);
        expect(source.fiches).toHaveLength(1);
        expect(source.fiches[0].contenu).toContain('Chaque six');
    });

    it('jamais un mélange des deux', () => {
        /**
         * Additionner ferait cohabiter la description générique et celle du jeu
         * dans une seule invite, et le modèle trancherait au hasard. C'est le
         * défaut du doublon de corpus, qu'on a mis des semaines à voir :
         * l'Oracle recevait les deux versions d'une même règle.
         */
        const source = sourceDuGroupe(
            groupe('jet'),
            [fiche('Résolution des jets'), fiche('Degrés de réussite et critiques')],
            [fiche('Résolution des jets'), fiche('Degrés de réussite et critiques')],
        );
        expect(source.fiches).toHaveLength(2);
    });

    it('la famille ne sert que si le jeu ne dit rien du tout', () => {
        // Le cas réel : le corpus d'Alien n'a aucune fiche v3 sur la poussée,
        // que le SRD YZE documente entièrement.
        const source = sourceDuGroupe(
            groupe('jet'),
            [fiche('Santé et blessures')], // rien pour le groupe « jet »
            [fiche('Résolution des jets', 'On relance les dés sans Écueil.')],
        );
        expect(source.venuDeLaFamille).toBe(true);
        expect(source.fiches[0].contenu).toContain('Écueil');
    });

    it('sans famille, un groupe non couvert reste vide — et c\'est une réponse', () => {
        /**
         * La Monnaie de table d'Alien est vide parce que le jeu n'a pas de
         * réserve partagée. Le SRD ne la couvre pas davantage, et c'est
         * heureux : un comblement automatique lui en aurait inventé une.
         */
        const source = sourceDuGroupe(groupe('ressources'), [fiche('Résolution des jets')], []);
        expect(source.fiches).toEqual([]);
        expect(source.venuDeLaFamille).toBe(false);
    });

    it('une famille qui ne couvre pas non plus ne fabrique rien', () => {
        const source = sourceDuGroupe(groupe('ressources'), [], [fiche('Résolution des jets')]);
        expect(source.fiches).toEqual([]);
        expect(source.venuDeLaFamille).toBe(false);
    });
});

describe('ce qu\'un corpus déclare de lui-même', () => {
    it('lit une famille et son moteur', () => {
        expect(lireNature('{"nature":"famille","moteur":"yze"}'))
            .toEqual({ nature: 'famille', moteur: 'yze' });
    });

    it('un corpus sans déclaration est un jeu — on ne fait pas payer la nouveauté à l\'existant', () => {
        // Neuf des dix corpus de David n'ont aucun `corpus.json`, et ils n'ont
        // pas à en acquérir un pour continuer de fonctionner.
        expect(lireNature(null)).toBeNull();
        expect(lireNature('')).toBeNull();
        expect(lireNature('   ')).toBeNull();
    });

    it('un fichier illisible ou incohérent ne fait rien croire', () => {
        expect(lireNature('{ pas du json')).toBeNull();
        expect(lireNature('{"nature":"socle"}')).toBeNull();
        expect(lireNature('["famille"]')).toBeNull();
    });

    it('une famille sans moteur reste une famille', () => {
        expect(lireNature('{"nature":"famille"}')).toEqual({ nature: 'famille', moteur: undefined });
        expect(lireNature('{"nature":"famille","moteur":"  "}')?.moteur).toBeUndefined();
    });
});

/**
 * Ce que ces tests protègent : **une lacune est une réponse, pas une invitation
 * à combler**.
 *
 * Relevé sur la dérivation de Cthulhu Hack du 2026-08-16. `monnaie-de-table.md`
 * portait `couverture: absente` — le jeu n'a pas de réserve commune — et le
 * pilote est ressorti avec une réserve « Fortune », qui est une ressource
 * PERSONNELLE du personnage. La fiche disait qu'il n'y avait rien ; servie au
 * modèle, elle l'a invité à produire quelque chose quand même.
 *
 * Et le comblement depuis la famille aurait aggravé le cas : le socle décrit
 * peut-être une monnaie de table, mais l'y prendre inventerait au jeu une
 * mécanique qu'il n'a pas.
 */
describe('un sujet déclaré non couvert', () => {
    const groupe = { id: 'ressources', label: 'Monnaie de table', sujets: ['Monnaie de table'] } as GroupeDeChamps;

    it('ne nourrit pas son groupe', () => {
        const source = sourceDuGroupe(groupe, [
            { sujet: 'Monnaie de table', contenu: "Le jeu n'a pas de réserve partagée.", couverture: 'absente' },
        ]);

        expect(source.fiches).toEqual([]);
        expect(source.declareNonCouvert).toBe(true);
    });

    it('ne se comble PAS depuis la famille', () => {
        // Le socle en décrit une ; le jeu dit qu'il n'en a pas. Le jeu l'emporte.
        const source = sourceDuGroupe(
            groupe,
            [{ sujet: 'Monnaie de table', contenu: 'aucune', couverture: 'absente' }],
            [{ sujet: 'Monnaie de table', contenu: 'Le socle décrit une réserve de Momentum.' }],
        );

        expect(source.fiches).toEqual([]);
        expect(source.venuDeLaFamille).toBe(false);
    });

    it('laisse le SILENCE se combler depuis la famille', () => {
        // Ne rien dire et dire « il n'y a rien » sont deux réponses différentes.
        const source = sourceDuGroupe(
            groupe,
            [{ sujet: 'Résolution des jets', contenu: 'autre chose' }],
            [{ sujet: 'Monnaie de table', contenu: 'Le socle décrit une réserve de Momentum.' }],
        );

        expect(source.fiches).toHaveLength(1);
        expect(source.venuDeLaFamille).toBe(true);
    });

    it("ne retient qu'« absente » : « partielle » reste une matière utile", () => {
        const source = sourceDuGroupe(groupe, [
            { sujet: 'Monnaie de table', contenu: 'Une réserve de Fortune, mal décrite.', couverture: 'partielle' },
        ]);

        expect(source.fiches).toHaveLength(1);
        expect(source.declareNonCouvert).toBeUndefined();
    });
});
