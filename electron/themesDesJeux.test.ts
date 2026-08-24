import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    extraireJetons, pontVersLInterface, cheminDuTheme,
    extraireImportsDePolice, premiereFamille,
} from '../src/theme/jetonsDeTheme';

/**
 * **Les thèmes de jeu réellement présents dans le dépôt.**
 *
 * Ce fichier lit `docs/systems/<jeu>/theme/theme.css` sur le disque, jamais une
 * imitation : le jour où un thème est reforgé, ou qu'un quatrième jeu arrive,
 * c'est ici qu'on l'apprend. *Un test sur une imitation ne prouve rien du
 * disque* — la leçon du corpus, qui vit deux fichiers plus loin.
 *
 * Il est dans `electron/` et non dans `src/` parce que les tests du renderer
 * tournent avec le shim `fs` de `vite-plugin-electron-renderer`, qui ne sait
 * pas lire un fichier. La logique pure est éprouvée par
 * `src/theme/themeDuJeu.test.ts`.
 */

const SYSTEMES = path.resolve(__dirname, '..', 'docs', 'systems');

/** Les jeux qui déclarent un thème, découverts et non recopiés. */
const AVEC_THEME = fs
    .readdirSync(SYSTEMES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(jeu => fs.existsSync(path.join(SYSTEMES, jeu, 'theme', 'theme.css')));

const lire = (jeu: string) =>
    fs.readFileSync(path.join(SYSTEMES, jeu, 'theme', 'theme.css'), 'utf-8');

/**
 * Les huit variables que le pont doit alimenter pour que l'interface suive.
 * Moins que ça, et le thème du jeu ne se voit qu'à moitié.
 */
const VARIABLES_DE_LINTERFACE = [
    '--app-bg', '--app-surface', '--app-text', '--app-text-muted',
    '--app-accent', '--app-border', '--font-display', '--font-mono',
];

describe('les thèmes de jeu du dépôt', () => {
    it('il y en a au moins un — sinon ce fichier ne teste rien', () => {
        expect(AVEC_THEME.length).toBeGreaterThan(0);
    });

    /*
      **Le contrat du SDK, vérifié sur le disque.** 22 jetons et une polarité :
      c'est ce que le README du SDK exige d'un thème, et c'est ce qui permet à
      un nouveau jeu d'être ajouté en déposant un seul fichier.
    */
    it.each(AVEC_THEME)('%s déclare les 22 jetons du contrat', (jeu) => {
        const { jetons } = extraireJetons(lire(jeu));
        expect(Object.keys(jetons).length).toBeGreaterThanOrEqual(22);
    });

    /**
     * `color-scheme` n'est pas optionnel : sans lui, les `<select>` natifs, les
     * champs et les défilements d'un thème clair s'affichent en sombre. GM-OS a
     * déjà payé ce défaut une fois.
     */
    it.each(AVEC_THEME)('%s déclare sa polarité', (jeu) => {
        expect(extraireJetons(lire(jeu)).clarte).toMatch(/^(dark|light)$/);
    });

    it.each(AVEC_THEME)('%s alimente les huit variables de l’interface', (jeu) => {
        const vars = pontVersLInterface(extraireJetons(lire(jeu)).jetons);
        for (const v of VARIABLES_DE_LINTERFACE) {
            expect(vars[v], `${jeu} → ${v}`).toBeTruthy();
        }
    });

    it('le chemin calculé est celui du disque', () => {
        for (const jeu of AVEC_THEME) {
            const relatif = cheminDuTheme(`systems/${jeu}`);
            expect(fs.existsSync(path.resolve(SYSTEMES, '..', relatif)), relatif).toBe(true);
        }
    });

    /*
      **Les valeurs, pas seulement les clés.** Un thème dont toutes les
      variables vaudraient la chaîne vide passerait les contrôles ci-dessus.
    */
    it.each(AVEC_THEME)('%s donne des valeurs non vides', (jeu) => {
        const { jetons } = extraireJetons(lire(jeu));
        const vides = Object.entries(jetons).filter(([, v]) => !v.trim());
        expect(vides.map(([k]) => k)).toEqual([]);
    });

    /**
     * **Les trois premiers jeux ne se ressemblent pas, et c'est le sujet.**
     * Si deux thèmes rendaient les mêmes couleurs, le pont serait indétectable
     * en séance — on croirait qu'il marche alors qu'il ne changerait rien.
     */
    it('deux thèmes ne rendent pas le même accent', () => {
        const accents = AVEC_THEME.map(j => extraireJetons(lire(j)).jetons.accent);
        expect(new Set(accents).size).toBe(accents.length);
    });
});

/**
 * **Un thème doit APPORTER les polices qu'il déclare.**
 *
 * Signalé par David le 2026-08-24 : *« en réalité les thèmes ne changent pas la
 * police »*. Les quatre demandaient Montserrat, Oswald, Rajdhani et Barlow
 * Condensed — dont **aucune** n'est dans la liste chargée par `index.css`. La
 * variable était posée, la police jamais téléchargée, et le navigateur
 * retombait en silence sur `Arial Narrow`.
 *
 * Le remède refusé, et il faut dire pourquoi : ajouter ces quatre polices à la
 * liste globale marcherait aujourd'hui et casserait au cinquième thème, puisque
 * ça redemanderait d'éditer du code. *On ne répare pas une liste close en
 * l'allongeant.*
 */
describe('les polices des thèmes', () => {
    it.each(AVEC_THEME)('%s apporte au moins une feuille de police', (jeu) => {
        expect(extraireImportsDePolice(lire(jeu)).length).toBeGreaterThan(0);
    });

    it.each(AVEC_THEME)('%s importe bien la famille qu’il déclare', (jeu) => {
        const css = lire(jeu);
        const imports = extraireImportsDePolice(css).join(' ');
        const { jetons } = extraireJetons(css);

        for (const jeton of ['font-display', 'font-body', 'font-ui', 'font-mono']) {
            const famille = premiereFamille(jetons[jeton]);
            // Les piles génériques (`sans-serif`, `monospace`) n'ont rien à importer.
            if (!famille || !/[A-Z]/.test(famille)) continue;

            /*
              Google Fonts encode les espaces en `+`. On cherche la famille dans
              l'URL plutôt que de faire confiance au nom du fichier : c'est le
              lien entre ce que le thème DEMANDE et ce qu'il TÉLÉCHARGE, et
              c'est précisément ce lien qui manquait.
            */
            const dansLUrl = famille.replace(/\s+/g, '+');
            const generique = ['Arial', 'Helvetica', 'Georgia', 'Times', 'Courier', 'Verdana']
                .some(g => famille.startsWith(g));
            if (generique) continue;

            expect(imports, `${jeu} : ${jeton} = « ${famille} » n’est importée nulle part`)
                .toContain(dansLUrl);
        }
    });
});
