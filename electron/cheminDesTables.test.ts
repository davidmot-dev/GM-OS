import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { racineDesTables, cheminDUnUnivers, cheminDUneTable } from './cheminDesTables';

/**
 * **Un chemin qui vient du renderer ne se croit pas sur parole.**
 *
 * ⛔ **Les trois lecteurs de Table-OS le croyaient**, et joignaient `universe` et
 * `tableName` tels quels. Une fuite en lecture tant que rien n'écrivait ; le
 * jour où l'Atelier a reçu le droit d'écrire, la même forme serait devenue un
 * moyen d'écraser n'importe quel fichier du dépôt.
 */

const RACINE = path.resolve('C:/app');
const TABLES = racineDesTables(RACINE);

describe('cheminDUnUnivers', () => {
    it('accepte un univers ordinaire', () => {
        expect(cheminDUnUnivers(RACINE, 'Alien')).toBe(path.join(TABLES, 'Alien'));
    });

    it('accepte un nom avec une espace, comme « Blade Runner »', () => {
        expect(cheminDUnUnivers(RACINE, 'Blade Runner')).toBe(path.join(TABLES, 'Blade Runner'));
    });

    it('rogne les espaces autour', () => {
        expect(cheminDUnUnivers(RACINE, '  Alien  ')).toBe(path.join(TABLES, 'Alien'));
    });

    it.each([
        ['une traversée', '..'],
        ['une traversée composée', '../../secret'],
        ['un chemin absolu', 'C:/Windows'],
        ['un séparateur', 'Alien/enfant'],
        ['un antislash', 'Alien\\enfant'],
        ['le vide', ''],
        ['des espaces seuls', '   '],
        ['un point', '.'],
        ['un octet nul', 'Alien\0'],
        ['deux-points', 'C:'],
    ])('refuse %s', (_cas, univers) => {
        expect(cheminDUnUnivers(RACINE, univers)).toBeNull();
    });
});

describe('cheminDUneTable', () => {
    it('compose le fichier et pose l’extension', () => {
        expect(cheminDUneTable(RACINE, 'Alien', 'panique'))
            .toBe(path.join(TABLES, 'Alien', 'panique.json'));
    });

    /** *Un nom qui porte déjà l'extension donnerait « table.json.json »* — et le
        meneur ne verrait pas sa table revenir dans la liste. */
    it('ne double pas l’extension', () => {
        expect(cheminDUneTable(RACINE, 'Alien', 'panique.json'))
            .toBe(path.join(TABLES, 'Alien', 'panique.json'));
    });

    it.each([
        ['une traversée dans le nom', 'Alien', '../../../secret'],
        ['une traversée dans l’univers', '..', 'panique'],
        ['un séparateur dans le nom', 'Alien', 'sous/panique'],
        ['un nom vide', 'Alien', ''],
        ['un nom qui n’est QUE l’extension', 'Alien', '.json'],
        ['un caractère interdit', 'Alien', 'pani*que'],
    ])('refuse %s', (_cas, univers, nom) => {
        expect(cheminDUneTable(RACINE, univers, nom)).toBeNull();
    });

    /**
     * ⛔ **La garde qui compte.** Sans confinement, ce nom remonte jusqu'au
     * `package.json` du dépôt — en lecture c'est une fuite, en écriture c'est
     * l'application qu'on remplace.
     */
    it('ne laisse pas atteindre un fichier du dépôt', () => {
        expect(cheminDUneTable(RACINE, 'Alien', '../../../package')).toBeNull();
        expect(cheminDUnUnivers(RACINE, '../..')).toBeNull();
    });
});
