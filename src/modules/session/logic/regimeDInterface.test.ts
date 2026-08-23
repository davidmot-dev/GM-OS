import { describe, it, expect } from 'vitest';
import { regimeDInterface, taille, tailles } from './regimeDInterface';

/**
 * Ce que ces tests protègent : **les trois décisions du plan**, pas les valeurs
 * de taille — celles-ci se corrigeront à la table, et c'est prévu.
 */
describe("le régime d'interface", () => {
    it('est celui de la table pendant une partie, celui de l\'atelier sinon', () => {
        expect(regimeDInterface('partie').aLaTable).toBe(true);
        expect(regimeDInterface('preparation').aLaTable).toBe(false);
    });

    /**
     * *« Aucune action destructive ni monopolisante près de ce qu'on touche en
     * partie. »* C'est la seule des trois règles qui protège d'un dégât réel.
     */
    it('éloigne le destructif dès qu\'on joue', () => {
        expect(regimeDInterface('partie').destructifAPortee).toBe(false);
        expect(regimeDInterface('preparation').destructifAPortee).toBe(true);
    });

    /** *« En préparation on veut choisir, en séance on veut que ce soit déjà choisi. »* */
    it('préchoisit en séance, et laisse choisir en préparation', () => {
        expect(regimeDInterface('partie').prechoisir).toBe(true);
        expect(regimeDInterface('preparation').prechoisir).toBe(false);
    });

    /**
     * **Le fait est unique.** Trois booléens indépendants auraient fini par se
     * contredire ; ils dérivent tous de `aLaTable`.
     */
    it('ne porte qu\'un seul état, dont les autres découlent', () => {
        for (const moment of ['partie', 'preparation'] as const) {
            const r = regimeDInterface(moment);
            expect(r.destructifAPortee).toBe(!r.aLaTable);
            expect(r.prechoisir).toBe(r.aLaTable);
        }
    });

    it('rappelle le moment dont il vient, sans le recalculer', () => {
        expect(regimeDInterface('partie').moment).toBe('partie');
        expect(regimeDInterface('preparation').moment).toBe('preparation');
    });
});

describe('les tailles partagées', () => {
    /**
     * **Le point de tout ce fichier** : les cinq modules doivent grandir
     * ensemble. *Une divergence de densité ne se voit qu'à la table, une fois
     * qu'il est trop tard pour la corriger.*
     */
    it('grandit à la table, pour chaque taille sans exception', () => {
        const atelier = tailles(regimeDInterface('preparation'));
        const table = tailles(regimeDInterface('partie'));
        for (const nom of Object.keys(atelier) as (keyof typeof atelier)[]) {
            expect(table[nom]).not.toBe(atelier[nom]);
        }
    });

    it('rend la même classe par les deux chemins', () => {
        const r = regimeDInterface('partie');
        expect(taille(r, 'chiffre')).toBe(tailles(r).chiffre);
    });

    it('rend des classes non vides', () => {
        for (const moment of ['partie', 'preparation'] as const) {
            for (const classe of Object.values(tailles(regimeDInterface(moment)))) {
                expect(classe.length).toBeGreaterThan(0);
            }
        }
    });
});
