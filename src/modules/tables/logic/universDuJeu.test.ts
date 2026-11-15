import { describe, it, expect } from 'vitest';
import { universDuJeu, universCites, nomCompare } from './universDuJeu';

/**
 * **Le dossier de tables du jeu actif** (registre § 256, T4). Les cas viennent du relevé du
 * 15/11/2026 : noms et citations des dix-neuf pilotes de David, face aux dossiers de
 * `databases/tables/`.
 */
const DOSSIERS = ['Alien', 'Blade Runner', 'Cthulhu Hack', 'cyberpunk', 'Dune', 'generique', 'MedFan', 'NOC', 'Reves de Dragon'];

describe('universDuJeu', () => {
    it('suit les tables que le pilote cite, même quand son nom ne ressemble pas au dossier', () => {
        const alien = {
            name: 'ALIEN, le jeu de rôle', corpusId: 'alien',
            combat: { panique: { table: { univers: 'Alien', table: 'test_de_panique' } } },
            bestiaire: [{ attaques: { table: { univers: 'Alien', table: 'attaques_xenomorphe_rodeur' } } }],
        };
        expect(universDuJeu(alien, DOSSIERS)).toBe('Alien');
    });

    it('prend le dossier le plus cité, et ignore un dossier cité qui n’existe pas', () => {
        const pilote = {
            name: 'Mélange',
            a: { univers: 'generique', table: 'x' },
            b: [{ univers: 'NOC', table: 'y' }, { univers: 'NOC', table: 'z' }],
            c: { univers: 'Disparu', table: 'w' },
        };
        expect(universDuJeu(pilote, DOSSIERS)).toBe('NOC');
        expect(universCites(pilote).get('Disparu')).toBe(1);
    });

    it('retrouve le dossier par le nom, sans accents, sans casse ni pluriel', () => {
        expect(universDuJeu({ name: 'Rêve de Dragon', corpusId: 'reves de dragons' }, DOSSIERS)).toBe('Reves de Dragon');
        expect(universDuJeu({ name: 'Dune', corpusId: 'dune' }, DOSSIERS)).toBe('Dune');
        expect(universDuJeu({ name: 'NOC', corpusId: 'noc' }, DOSSIERS)).toBe('NOC');
    });

    it('lit la tête du nom avant « : » ou « , »', () => {
        expect(universDuJeu({ name: 'Blade Runner: Le Jeu de Rôle', corpusId: 'blade-runner' }, DOSSIERS)).toBe('Blade Runner');
    });

    it('ne devine rien quand aucun indice ne tient — ni le dossier générique', () => {
        expect(universDuJeu({ name: 'Symbaroum', corpusId: 'symbaroum' }, DOSSIERS)).toBeNull();
        expect(universDuJeu({ name: 'Générique', corpusId: 'generique' }, DOSSIERS)).toBeNull();
        expect(universDuJeu(null, DOSSIERS)).toBeNull();
        expect(universDuJeu({ name: 'Dune' }, [])).toBeNull();
    });

    it('ne boucle pas sur un pilote qui se référence lui-même', () => {
        const pilote: Record<string, unknown> & { name: string } = { name: 'Boucle', t: { univers: 'Dune', table: 'a' } };
        pilote.moi = pilote;
        expect(universDuJeu(pilote, DOSSIERS)).toBe('Dune');
    });

    it('compare les noms en forme réduite', () => {
        expect(nomCompare('Rêves-de_Dragons')).toBe('reve de dragon');
        expect(nomCompare('  Cthulhu   Hack ')).toBe('cthulhu hack');
    });
});
