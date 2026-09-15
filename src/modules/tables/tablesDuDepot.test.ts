import { describe, it, expect } from 'vitest';
import { controlerLaTable, laTableEstFautive } from './logic/formeDeLaTable';
import type { TableData } from './types';

/**
 * **Aucune table livrée ne se comporte mal en silence.**
 *
 * ⛔ **Deux le faisaient jusqu'au 2026-09-15**, et personne ne pouvait le voir :
 * `Alien/blessures_critiques.json` et `Alien/avaries_mineures_vaisseaux.json`
 * déclaraient `1d66` au lieu de `d66`. 45 % et 33 % de leurs jets ne tombaient
 * sur aucune entrée — et `resolveEntry` rend alors la plus proche, *sans le
 * dire*. Un 17 sur les blessures critiques rendait l'entrée 66, la pire du jeu.
 *
 * ⭐ **C'est le genre de défaut qui ne se trouve qu'en comptant.** Les bornes se
 * suivent, chaque entrée est plausible, et il faut tenir la liste des valeurs du
 * dé dans sa tête pour voir ce qui manque. *Aucune relecture n'y arrive ; un
 * balayage y arrive en une seconde.*
 *
 * ⚠️ **Elle ne juge que ce qui casse.** Une table sans nom, un titre vide, une
 * quantité de butin illisible sont des `doute` : ils se voient dans l'Atelier,
 * ils ne bloquent pas le dépôt. *Une garde qui refuse ce qui marche finit par
 * être contournée.*
 */

/*
  Les fichiers du dépôt, lus tels quels. `node:fs` n'existe pas dans le projet de
  tests `renderer` — c'est `import.meta.glob` qui va les chercher, et il porte
  jusque hors de `src/` parce que sa racine est celle du projet.
*/
const fichiers = import.meta.glob('/databases/tables/**/*.json', {
    eager: true,
    import: 'default',
}) as Record<string, TableData>;

describe('les tables livrées avec GM-OS', () => {
    it('la garde voit bien quelque chose', () => {
        // Une garde qui ne trouve aucun fichier passe pour de bonnes raisons.
        expect(Object.keys(fichiers).length, 'plus aucune table dans databases/').toBeGreaterThan(40);
    });

    it('ont toutes un nom, un dé et des entrées', () => {
        const informes = Object.entries(fichiers)
            .filter(([, t]) => !t?.dice || !Array.isArray(t?.entries))
            .map(([chemin]) => chemin);

        expect(informes, 'ces fichiers ne sont pas des tables').toEqual([]);
    });

    it('ne se comportent mal sur aucun tirage', () => {
        const fautives = Object.entries(fichiers)
            .filter(([, t]) => laTableEstFautive(t))
            .map(([chemin, t]) => `${chemin}\n      ${controlerLaTable(t)
                .filter(c => c.gravite === 'faute')
                .map(c => c.message)
                .join('\n      ')}`);

        expect(fautives, [
            'Ces tables ont des jets qui ne tombent sur aucune entrée, ou une formule',
            'que le moteur ne lit pas comme vous croyez. Le meneur ne verra ni erreur',
            'ni avertissement : il lira à voix haute une entrée plausible et fausse.',
        ].join(' ')).toEqual([]);
    });

    /**
     * ⭐ **Le dé juxtaposé n'avait jamais servi.** Les deux seules tables qui
     * l'essayaient l'écrivaient mal, et la fonctionnalité — documentée dans le
     * guide 40 — n'avait donc jamais fonctionné une seule fois. *Une garde qui
     * ne trouve qu'un cas d'usage valide vaut mieux qu'une documentation qui en
     * promet un.*
     */
    it('celles qui annoncent un dé juxtaposé l’écrivent sans nombre devant', () => {
        const mauvaises = Object.entries(fichiers)
            .filter(([, t]) => /^\d+d([468])\1+$/.test((t.dice ?? '').toLowerCase().trim()))
            .map(([chemin, t]) => `${chemin} (« ${t.dice} »)`);

        expect(mauvaises, [
            'Un dé juxtaposé s’écrit « d66 », jamais « 1d66 » : avec un nombre devant,',
            'le moteur lit un dé ordinaire à 66 faces et les deux tiers des jets',
            'tombent dans le vide.',
        ].join(' ')).toEqual([]);
    });
});
