import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { VERSION_DU_CAHIER } from '../src/modules/fiches/validationDeLaFiche';

/**
 * **Le constructeur de fiches emporte des copies — elles ne doivent pas retarder.**
 *
 * Même garde que `constructeurDeThemes.test.ts`, pour l'autre constructeur :
 * *Character Sheet HTML Studio*, dans `outils/rpg-sheet-builder/`. Dans une
 * fenêtre ChatGPT il n'a pas le dépôt ; il travaille sur ses fichiers de
 * connaissance. Voir `documentation/Architecture/Flux-des-constructeurs.md`.
 */

const RACINE = path.resolve(__dirname, '..');
const PLUGIN = path.join(RACINE, 'outils', 'rpg-sheet-builder');
const REFERENCES = path.join(PLUGIN, 'skills', 'instructions', 'references');

const lire = (chemin: string) => fs.readFileSync(chemin, 'utf-8').replace(/\r\n/g, '\n');

describe('Character Sheet HTML Studio — ses copies suivent le dépôt', () => {
    it('sa fiche Alien de référence est celle du dépôt', () => {
        expect(lire(path.join(REFERENCES, 'alien_character_sheet_v2.html')), 'recopier docs/fiches/Alien/ dans le plugin')
            .toBe(lire(path.join(RACINE, 'docs', 'fiches', 'Alien', 'alien_character_sheet_v2.html')));
    });

    /* Le cahier des charges des fiches (2026-10-13) : le constructeur doit lire celui du dépôt. */
    it('sa copie du cahier des charges est celle du dépôt', () => {
        expect(lire(path.join(REFERENCES, 'Cahier-des-charges-fiche-de-personnage.md')), 'recopier documentation/Architecture/Cahier-des-charges-fiche-de-personnage.md dans le plugin')
            .toBe(lire(path.join(RACINE, 'documentation', 'Architecture', 'Cahier-des-charges-fiche-de-personnage.md')));
    });

    it('le cahier et le validateur annoncent la même version', () => {
        const cahier = lire(path.join(RACINE, 'documentation', 'Architecture', 'Cahier-des-charges-fiche-de-personnage.md'));
        expect(cahier).toContain(`**Version ${VERSION_DU_CAHIER} —`);
    });

    it('l\'index de connaissance nomme exactement les fichiers présents', () => {
        const index = JSON.parse(lire(path.join(PLUGIN, 'skills', 'instructions', 'lookup', 'knowledge-index.json'))) as {
            files: { path: string }[];
        };
        const indexes = index.files.map(f => path.basename(f.path)).sort();
        expect(indexes).toEqual(fs.readdirSync(REFERENCES).sort());
    });
});
