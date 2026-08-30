import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Le chemin de sortie de GM-OS — deux travaux, un seul délai.**
 *
 * `main.ts` ne s'instancie pas en test : il tient l'objet `app` d'Electron. Ces
 * contrôles lisent donc le source, comme ceux de `sourisDesJoueurs`, parce que
 * ce qu'il faut garder ici est une **propriété de construction**.
 *
 * *Signalé par David le 2026-08-30 : « quand je ferme l'application, le Ulanzi
 * ne reprend pas sa routine ».* La restitution vivait dans un nettoyage d'effet
 * React, et **fermer une fenêtre Electron ne démonte pas l'arbre React** : elle
 * n'était jamais appelée. Elle rejoint donc le rail de la sauvegarde de sortie,
 * le seul endroit où le rendu est encore vivant *et* attendu.
 */

const sansCommentaires = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const MAIN = sansCommentaires(
    fs.readFileSync(path.resolve(__dirname, 'main.ts'), 'utf-8'));
const PRELOAD = sansCommentaires(
    fs.readFileSync(path.resolve(__dirname, 'preload.ts'), 'utf-8'));

/** Le corps de la fonction qui retient la fermeture. */
const RAIL = (() => {
    const debut = MAIN.indexOf('function sauvegarderAvantDeSortir');
    expect(debut, 'la fonction de sortie existe toujours').toBeGreaterThan(-1);
    return MAIN.slice(debut, MAIN.indexOf('ipcMain.handle', debut));
})();

describe('la sortie prévient les deux travaux', () => {
    it('demande la sauvegarde ET la restitution de l’afficheur', () => {
        expect(RAIL).toMatch(/send\('backup:before-quit'\)/);
        expect(RAIL, 'sans quoi le defaut du 30/08 revient').toMatch(/send\('ulanzi:before-quit'\)/);
    });

    it('attend les deux réponses avant de repartir', () => {
        expect(RAIL).toMatch(/backup:before-quit-done/);
        expect(RAIL).toMatch(/ulanzi:before-quit-done/);
        // On ne repart que lorsque la liste des attendus est vide : compter les
        // réponses est ce qui distingue « les deux ont fini » de « l'un des deux ».
        expect(RAIL).toMatch(/attendus\.size === 0/);
    });

    /**
     * **Le filet dur reste unique.** Il doit fermer GM-OS quoi qu'il arrive —
     * une application qui refuse de quitter serait un défaut plus grave que
     * celui qu'on répare.
     */
    it('garde un seul délai de sécurité, et il ferme quand même', () => {
        expect(RAIL.match(/setTimeout\(finir, \d+\)/g)).toHaveLength(1);
    });
});

/**
 * **Un seul mécanisme retient la fermeture.** Deux `preventDefault` posés côte à
 * côte sur les portes de sortie finiraient par produire une application qui ne
 * se ferme plus : chacun attendrait l'autre. Les deux portes — la croix et le
 * bouton Quitter — doivent donc mener à la **même** fonction.
 */
describe('les portes de sortie', () => {
    it('ne retiennent la fermeture que par le rail commun', () => {
        // On consomme le `;` de `preventDefault()` lui-même, puis on lit
        // l'instruction suivante : c'est elle qui doit mener au rail commun.
        const retenues = MAIN.match(/event\.preventDefault\(\);[\s\S]{0,120}?;/g) ?? [];
        expect(retenues.length, 'les deux portes sont gardées').toBe(2);
        for (const bloc of retenues) {
            expect(bloc).toMatch(/sauvegarderAvantDeSortir/);
        }
    });

    it('pose le drapeau avant de demander quoi que ce soit', () => {
        // Un échec, une exception ou un rendu muet ne doivent pas empêcher la
        // tentative de sortie suivante de passer.
        expect(RAIL.indexOf('sortieDejaTraitee = true'))
            .toBeLessThan(RAIL.indexOf('webContents.send'));
    });
});

describe('le pont vers le rendu', () => {
    it('expose l’abonnement et la réponse de l’afficheur', () => {
        const bloc = PRELOAD.slice(PRELOAD.indexOf('ulanzi: {'));
        expect(bloc).toMatch(/ipcRenderer\.on\('ulanzi:before-quit'/);
        expect(bloc).toMatch(/ipcRenderer\.send\('ulanzi:before-quit-done'\)/);
    });
});
