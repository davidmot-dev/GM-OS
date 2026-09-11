import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { lireLesGuides, FAMILLES_DU_MANUEL, DOSSIER_DU_MANUEL } from './guidesDuManuel';

/**
 * **Le manuel se lit depuis le dépôt, tel qu'il est.**
 *
 * Ces tests portent sur les **vrais guides**, pas sur un dossier fabriqué : le
 * manuel est une donnée du dépôt, et ce qu'on veut garder c'est qu'il reste
 * lisible par l'application quand quelqu'un le réorganise.
 *
 * *Un test sur un faux dossier aurait vérifié que je sais lire un dossier ; il
 * n'aurait rien dit du jour où un guide perd son titre ou son numéro.*
 */

const RACINE = path.resolve(__dirname, '..');

describe('la lecture du manuel', () => {
    it('trouve les guides du dépôt', async () => {
        const guides = await lireLesGuides(RACINE);
        expect(guides.length, 'le dossier du manuel doit être lisible').toBeGreaterThan(40);
    });

    it('ne rend que du markdown', async () => {
        const guides = await lireLesGuides(RACINE);
        /* Le dossier contient aussi les captures d'écran des guides. */
        for (const g of guides) expect(g.nom).toMatch(/\.md$/);
    });

    it('donne à chacun un titre non vide', async () => {
        const guides = await lireLesGuides(RACINE);
        const sansTitre = guides.filter(g => g.titre.trim() === '');
        expect(sansTitre.map(g => g.nom), 'un guide sans titre ne serait pas cliquable').toEqual([]);
    });

    /*
      L'ordre des numéros EST l'ordre de lecture voulu — l'index du manuel
      l'énonce : « le dossier se lit donc dans le même ordre que cet index ».
      Le rendre trié évite que chaque écran invente le sien.
    */
    it('les rend dans l’ordre des numéros', async () => {
        const guides = await lireLesGuides(RACINE);
        const noms = guides.map(g => g.nom);
        expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, 'fr')));
    });

    it('range chaque guide dans une famille connue', async () => {
        const guides = await lireLesGuides(RACINE);
        for (const g of guides) {
            expect(FAMILLES_DU_MANUEL[g.famille], `famille inconnue pour ${g.nom}`).toBeDefined();
        }
    });

    it('porte le contenu entier, pas seulement l’en-tête', async () => {
        const guides = await lireLesGuides(RACINE);
        const cockpit = guides.find(g => g.nom.includes('Session-OS'));
        expect(cockpit, 'le guide du cockpit doit exister').toBeDefined();
        expect(cockpit!.contenu.length, 'la recherche porte sur le corps').toBeGreaterThan(2000);
    });

    /*
      Une installation sans son manuel doit démarrer quand même : l'absence du
      dossier est un fait à afficher, pas une exception à propager.
    */
    it('rend une liste vide plutôt que de lever, si le dossier manque', async () => {
        const guides = await lireLesGuides(path.join(RACINE, 'nulle-part-du-tout'));
        expect(guides).toEqual([]);
    });

    it('vise bien le dossier du manuel', () => {
        expect(DOSSIER_DU_MANUEL).toContain('User Guides');
    });
});

describe('la forme du manuel reste utilisable par le navigateur', () => {
    /*
      ⛔ **`formeDuManuel.ts` ne doit importer NI node NI electron.**

      L'écran d'aide en tire les familles et le nom du dossier, et il tourne dans
      le navigateur. Les prendre dans `guidesDuManuel.ts` y ferait entrer
      `fs-extra` par la porte des imports.

      Le bundle survivait — Vite élaguait les imports inutilisés — mais *une
      correction qui ne tient que par l'élagage d'un outil est une correction
      qu'on casse sans le voir*. Le jour où ce fichier gagne un import de node,
      l'écran d'aide cesse de se construire et le message parle de `graceful-fs`.
    */
    it('n’importe rien du tout', () => {
        const source = fs.readFileSync(new URL('./formeDuManuel.ts', import.meta.url), 'utf-8');
        const imports = [...source.matchAll(/^import\s.*$/gm)].map(m => m[0]);
        expect(imports, 'la forme du manuel doit rester sans dépendance').toEqual([]);
    });

    it('donne le dossier en barres obliques, pour l’URL gmos://', () => {
        /* Il sert aussi à construire une URL `gmos://` : un antislash n'y a rien
           à faire, et `path.join` en aurait mis un sur Windows. */
        expect(DOSSIER_DU_MANUEL).not.toContain('\\');
    });
});
