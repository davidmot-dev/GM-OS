import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Le constructeur de thèmes emporte des copies — elles ne doivent pas retarder.**
 *
 * `outils/rpg-theme-builder/` est le plugin *RPG Theme Builder* (exporté de
 * ChatGPT, chargeable par Codex). Dans une fenêtre ChatGPT, il n'a pas le
 * dépôt : il travaille sur **ses copies** du cahier des charges, du socle et
 * des thèmes de référence. Une copie qui retarde d'une version, c'est un
 * constructeur qui applique l'ancien contrat **avec toute l'assurance du
 * nouveau** — et rien ne le signalerait.
 *
 * ⛔ **Pourquoi c'est déjà arrivé une fois** : ses premiers modèles étaient NOC
 * et Star Trek, deux thèmes sous les seuils de contraste, et une ancienne
 * feuille qui écrivait `--rpg-accent2`. *Un modèle qui lit deux conventions
 * choisit au hasard.*
 *
 * Les fins de ligne sont normalisées : Git les convertit sous Windows, et une
 * différence de `\r` n'est pas une différence de contenu.
 */

const RACINE = path.resolve(__dirname, '..');
const PLUGIN = path.join(RACINE, 'outils', 'rpg-theme-builder');
const REFERENCES = path.join(PLUGIN, 'skills', 'instructions', 'references');

const lire = (chemin: string) => fs.readFileSync(chemin, 'utf-8').replace(/\r\n/g, '\n');

/** Chaque copie du plugin, et l'original du dépôt qu'elle doit refléter. */
const COPIES: [string, string][] = [
    ['Cahier-des-charges-theme-de-jeu.md', 'documentation/Architecture/Cahier-des-charges-theme-de-jeu.md'],
    ['rpg-core.css', 'docs/ui/rpg-theme-sdk/rpg-core.css'],
    ['alien.css', 'docs/systems/alien/theme/theme.css'],
    ['blade-runner.css', 'docs/systems/blade-runner/theme/theme.css'],
];

describe('RPG Theme Builder — ses copies suivent le dépôt', () => {
    it.each(COPIES)('%s est identique à %s', (copie, original) => {
        expect(lire(path.join(REFERENCES, copie)), `recopier ${original} dans le plugin`)
            .toBe(lire(path.join(RACINE, original)));
    });

    it('l\'index de connaissance nomme exactement les fichiers présents', () => {
        const index = JSON.parse(lire(path.join(PLUGIN, 'skills', 'instructions', 'lookup', 'knowledge-index.json'))) as {
            files: { path: string }[];
        };
        const indexes = index.files.map(f => path.basename(f.path)).sort();
        const presents = fs.readdirSync(REFERENCES).sort();
        expect(indexes).toEqual(presents);
    });

    it('les deux manifestes annoncent la même version', () => {
        const version = (fichier: string) => (JSON.parse(lire(path.join(PLUGIN, fichier))) as { version: string }).version;
        expect(version('.codex-plugin/plugin.json')).toBe(version('plugin.json'));
    });

    it('le skill désigne le cahier des charges comme source de vérité', () => {
        const skill = lire(path.join(PLUGIN, 'skills', 'instructions', 'SKILL.md'));
        expect(skill).toMatch(/Cahier-des-charges-theme-de-jeu\.md/);
        expect(skill).toMatch(/SOURCE DE\s+VÉRITÉ/);
    });
});
