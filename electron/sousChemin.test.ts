import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { strictementSous, sousOuEgal } from './sousChemin';

/**
 * **La comparaison de chemins, et les trois cas qui ont motivé le module.**
 *
 * Les six gardes de `RAGEngine` et les deux d'`obsidian_bridge` comparaient des
 * chaînes (`fullPath.startsWith(root)`) là où il fallait comparer des chemins.
 * Ces tests fixent ce que « dans la racine » veut dire, pour que la question ne
 * reçoive plus quatre réponses différentes selon le fichier.
 */

const racine = path.resolve('/tmp/gmos/docs');

describe('le dossier voisin — le cas qui a rendu les gardes fausses', () => {
    /*
      `C:\Coffre-prive` face au coffre `C:\Coffre`, ou `docs-prive` face à
      `docs` : le préfixe correspond et le dossier n'a rien à voir. C'est
      exactement ce que `startsWith` laissait passer.
    */
    it('refuse un voisin dont le nom commence par celui de la racine', () => {
        const voisin = path.resolve('/tmp/gmos/docs-prive/secret.md');
        expect(strictementSous(voisin, racine)).toBe(false);
        expect(sousOuEgal(voisin, racine)).toBe(false);
    });

    it('accepte un vrai enfant, si profond soit-il', () => {
        const enfant = path.join(racine, 'systems', 'dune', 'rules', 'fiche.md');
        expect(strictementSous(enfant, racine)).toBe(true);
        expect(sousOuEgal(enfant, racine)).toBe(true);
    });
});

describe('la traversée par ..', () => {
    it('refuse un chemin qui remonte hors de la racine', () => {
        const dehors = path.join(racine, '..', '..', 'secrets.md');
        expect(strictementSous(dehors, racine)).toBe(false);
        expect(sousOuEgal(dehors, racine)).toBe(false);
    });

    it('accepte un détour par .. qui retombe dans la racine', () => {
        const detour = path.join(racine, 'systems', '..', 'fiche.md');
        expect(strictementSous(detour, racine)).toBe(true);
    });

    /*
      Un fichier peut légitimement s'appeler `..notes`. Comparer le premier
      SEGMENT à `..` — et non le début de la chaîne — est ce qui l'autorise.
    */
    it('accepte un fichier dont le nom commence par deux points', () => {
        expect(strictementSous(path.join(racine, '..notes.md'), racine)).toBe(true);
    });
});

describe('la racine elle-même — le point où les deux versions justes divergeaient', () => {
    it('sousOuEgal l’accepte : autoriser une racine et tout son contenu', () => {
        expect(sousOuEgal(racine, racine)).toBe(true);
    });

    it('strictementSous la refuse : un dossier n’est pas un fichier à servir', () => {
        expect(strictementSous(racine, racine)).toBe(false);
    });
});

describe('les deux sens, pour détecter que deux arbres se recouvrent', () => {
    it('reconnaît le parent comme recouvrant son enfant', () => {
        const parent = path.resolve('/tmp/gmos');
        expect(sousOuEgal(racine, parent)).toBe(true);
        expect(sousOuEgal(parent, racine)).toBe(false);
    });
});

describe.runIf(process.platform === 'win32')('sur Windows, la casse ne distingue pas deux dossiers', () => {
    it('accepte un enfant écrit dans une autre casse que sa racine', () => {
        expect(strictementSous('C:\\GMOS\\Docs\\fiche.md', 'C:\\gmos\\docs')).toBe(true);
    });
});
