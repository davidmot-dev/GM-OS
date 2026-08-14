import { describe, it, expect } from 'vitest';
import { fichesSupplantees, sujetDuFrontmatter } from './fichesSupplantees';

/**
 * Ce que ces tests protègent : **on déplace des fichiers du dépôt de David.**
 *
 * Le défaut d'origine est réel et mesuré — une reforge produit un slug neuf,
 * l'ancienne fiche reste, et l'Oracle reçoit les deux versions du même sujet.
 * Huit doublons trouvés dans quatre systèmes le 2026-08-11, trois encore
 * présents le 2026-08-14.
 *
 * Mais le remède touche au disque à chaque publication. Les tests d'abstention
 * comptent donc plus que ceux d'archivage : archiver une fiche qu'il fallait
 * garder se voit des jours plus tard, quand l'Oracle cesse de citer une règle
 * sans que personne ne comprenne pourquoi.
 */

describe('ce qu\'une publication supplante', () => {
    it('la même fiche sous un slug neuf — le cas exact de la reforge', () => {
        const presentes = [
            { nom: 'initiative-et-tour.md', sujet: 'Initiative et déroulement du tour' },
            { nom: 'resolution-des-jets.md', sujet: 'Résolution des jets' },
        ];
        expect(fichesSupplantees(
            'Initiative et déroulement du tour',
            'initiative-et-deroulement-du-tour.md',
            presentes,
        )).toEqual(['initiative-et-tour.md']);
    });

    it('rattache par le sujet normalisé, accents et casse compris', () => {
        // C'est déjà la règle de `fichesDuGroupe`, et la seule qui survive à une
        // reforge : le slug est justement ce qui change.
        const presentes = [{ nom: 'ancien.md', sujet: 'DEGRES DE REUSSITE ET CRITIQUES' }];
        expect(fichesSupplantees('Degrés de réussite et critiques', 'neuf.md', presentes))
            .toEqual(['ancien.md']);
    });

    it('plusieurs reliquats du même sujet partent ensemble', () => {
        // Le cas de NOC : deux fiches pour « Résolution des jets », plus la
        // troisième qu'on publie.
        const presentes = [
            { nom: 'mecanique-lancement-des-destin.md', sujet: 'Résolution des jets' },
            { nom: 'provoquer-le-destin.md', sujet: 'Résolution des jets' },
        ];
        expect(fichesSupplantees('Résolution des jets', 'resolution-des-jets.md', presentes))
            .toHaveLength(2);
    });
});

describe('ce qu\'on refuse de déplacer', () => {
    it('le fichier qu\'on vient d\'écrire n\'est pas son propre doublon', () => {
        // Une reforge qui retombe sur le même slug écrase — c'est le
        // comportement voulu. L'archiver reviendrait à supprimer ce qu'on publie.
        const presentes = [{ nom: 'resolution-des-jets.md', sujet: 'Résolution des jets' }];
        expect(fichesSupplantees('Résolution des jets', 'resolution-des-jets.md', presentes))
            .toEqual([]);
    });

    it('une fiche sans sujet reste où elle est', () => {
        /**
         * L'inventaire des mécaniques est dans ce cas. L'archiver couperait la
         * reprise à froid d'une série : il est relu depuis le disque plutôt que
         * repayé au carnet, soixante-douze secondes à chaque fois.
         */
        const presentes = [{ nom: 'inventaire-des-mecaniques.md', sujet: null }];
        expect(fichesSupplantees('Résolution des jets', 'neuf.md', presentes)).toEqual([]);
    });

    it('deux sujets voisins mais distincts restent deux fiches', () => {
        // Aucun rapprochement flou ici : il appartient à `fichesDuGroupe`, où
        // une erreur ne coûte qu'une fiche mal rangée. Ici elle déplacerait un
        // fichier.
        const presentes = [
            { nom: 'sante-et-blessures.md', sujet: 'Santé et blessures' },
            { nom: 'degats.md', sujet: 'Dégâts et types de dégâts' },
        ];
        expect(fichesSupplantees('Dégâts et types de dégâts', 'degats-et-types.md', presentes))
            .toEqual(['degats.md']);
    });

    it('un sujet vide ne supplante rien', () => {
        const presentes = [{ nom: 'a.md', sujet: 'Résolution des jets' }];
        expect(fichesSupplantees('', 'neuf.md', presentes)).toEqual([]);
        expect(fichesSupplantees('   ', 'neuf.md', presentes)).toEqual([]);
    });
});

describe('lire le sujet d\'un frontmatter', () => {
    it('le lit tel que les fiches l\'écrivent', () => {
        expect(sujetDuFrontmatter('---\nsujet: Résolution des jets\nsysteme: alien\n---\n# Titre'))
            .toBe('Résolution des jets');
    });

    it('retire les guillemets que le carnet ajoute parfois', () => {
        expect(sujetDuFrontmatter('---\nsujet: "Monnaie de table"\n---')).toBe('Monnaie de table');
    });

    it('un frontmatter cassé rend null, et la fiche reste en place', () => {
        // Le doute penche toujours du côté de ne rien déplacer.
        expect(sujetDuFrontmatter('# Une fiche sans frontmatter')).toBeNull();
        expect(sujetDuFrontmatter('---\nsujet:\n---')).toBeNull();
        expect(sujetDuFrontmatter('')).toBeNull();
    });

    it('ne confond pas « sujet: » avec un mot en milieu de ligne', () => {
        expect(sujetDuFrontmatter('Le sujet: de cette phrase n\'est pas un frontmatter.')).toBeNull();
    });
});
