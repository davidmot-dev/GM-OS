import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Le manuel des jeux suit ce que les pilotes savent faire** — demandé par
 * David le 2026-10-13 : *« il faudra tenir à jour ce manuel lorsque de nouveaux
 * drivers apparaîtront ou seront améliorés »*.
 *
 * Les pilotes de David ne sont pas dans le dépôt : on ne peut pas exiger une
 * page par pilote. Ce qu'on peut garder, c'est que **chaque mécanique que le code
 * sait porter soit expliquée** dans `53-Les-jeux-et-leurs-mecaniques.md`. Les
 * champs se lisent dans les types eux-mêmes : une mécanique ajoutée au code sans
 * sa ligne dans le manuel fait échouer ce test. *Une fonctionnalité invisible
 * coûte plus qu'une absence.*
 *
 * Dans `electron/` pour lire le disque (même raison que `fichesDuDepot.test.ts`).
 */

const RACINE = path.resolve(__dirname, '..');
const GUIDES = path.join(RACINE, 'documentation', 'User Guides');
const ACCUEIL = path.join(GUIDES, '53-Les-jeux-et-leurs-mecaniques.md');
const lire = (...p: string[]) => fs.readFileSync(path.join(RACINE, ...p), 'utf8');

/** Le corps d'une interface exportée — ou d'un bloc d'objet qui en fait partie. */
function corps(source: string, debut: string): string {
    const i = source.indexOf(debut);
    expect(i, `« ${debut} » introuvable`).toBeGreaterThan(-1);
    const ouvre = source.indexOf('{', i);
    let profondeur = 0;
    for (let j = ouvre; j < source.length; j++) {
        if (source[j] === '{') profondeur++;
        if (source[j] === '}' && --profondeur === 0) return source.slice(ouvre + 1, j);
    }
    throw new Error(`« ${debut} » n'est pas refermée`);
}

/** Les champs déclarés au premier niveau, à l'indentation donnée. */
const champs = (bloc: string, indentation: number) =>
    [...bloc.matchAll(new RegExp(`^ {${indentation}}(\\w+)\\??:`, 'gm'))].map(m => m[1]);

const PILOTES = lire('src', 'types', 'drivers.ts');
const RESERVES = lire('src', 'modules', 'table', 'RessourcesDeTable.ts');
const JET = lire('src', 'modules', 'dice', 'DescripteurDeJet.ts');

/**
 * **Ce qui ne s'explique pas au meneur**, et pourquoi. Un champ s'ajoute ici
 * sciemment, jamais pour faire taire le test.
 */
const HORS_DU_MANUEL: Record<string, string> = {
    id: 'un identifiant', name: 'le nom affiché', label: 'le nom affiché', libelle: 'le nom affiché',
    author: 'une métadonnée', version: 'une métadonnée', description: 'un texte libre', emoji: 'une icône',
    banniere: "l'image d'en-tête", dice: 'le moteur du pupitre, décrit dans le guide Dice-OS',
    ragPath: 'hérité, remplacé par corpusId', corpusId: 'le dossier du corpus, invisible au meneur',
    defaultNotebookUrl: "le carnet NotebookLM, décrit dans le guide de l'Oracle",
    depart: 'la valeur de départ, évidente', min: 'le plancher, évident',
    gabaritDeLaFiche: "l'identifiant de la fiche HTML, nommé dans la page",
    horsDuBandeau: 'interne : les réserves dérivées de la Cabale',
};

const MECANIQUES = {
    'GameDriver': champs(corps(PILOTES, 'export interface GameDriver'), 4),
    'GameDriver.combat': champs(corps(corps(PILOTES, 'export interface GameDriver'), 'combat: {'), 8),
    'FicheDeGroupe': champs(corps(PILOTES, 'export interface FicheDeGroupe'), 4),
    'ApportDuGroupe': champs(corps(PILOTES, 'export interface ApportDuGroupe'), 4),
    'RessourceDeTable': champs(corps(RESERVES, 'export interface RessourceDeTable'), 4),
    'DescripteurDeJet': champs(corps(JET, 'export interface DescripteurDeJet'), 4),
};

describe('le manuel des jeux', () => {
    const accueil = fs.readFileSync(ACCUEIL, 'utf8');

    it('lit bien les types — sinon ce fichier ne garde rien', () => {
        expect(MECANIQUES.GameDriver).toContain('ressourcesDeTable');
        expect(MECANIQUES['GameDriver.combat']).toContain('tacheDeDefaite');
        expect(MECANIQUES.RessourceDeTable).toContain('debordement');
        expect(MECANIQUES.DescripteurDeJet).toContain('reserve');
        expect(MECANIQUES.ApportDuGroupe).toContain('epuisement');
    });

    it.each(Object.entries(MECANIQUES))('explique chaque mécanique de %s', (_type, liste) => {
        const muettes = liste.filter(c => !HORS_DU_MANUEL[c] && !accueil.includes(`\`${c}\``));
        expect(muettes, 'mécanique sans ligne dans 53-Les-jeux-et-leurs-mecaniques.md').toEqual([]);
    });

    /* Au premier niveau, comme tous les guides : l'aide intégrée ne lit pas les sous-dossiers. */
    const pages = fs.readdirSync(GUIDES).filter(n => /^54-Jeu-.+\.md$/.test(n));

    it('a une page par jeu, et chacune est reliée depuis l’accueil', () => {
        expect(pages.length).toBeGreaterThan(0);
        expect(pages.filter(p => !accueil.includes(`./${p}`))).toEqual([]);
    });

    it.each(pages)('%s dit quel pilote elle décrit, et quand', (page) => {
        expect(fs.readFileSync(path.join(GUIDES, page), 'utf8')).toMatch(/\*\*Pilote décrit :\*\* .+, exporté le \d{4}-\d{2}-\d{2}/);
    });

    it('ne montre aucune image absente', () => {
        const manquantes = [ACCUEIL, ...pages.map(p => path.join(GUIDES, p))].flatMap(fichier =>
            [...fs.readFileSync(fichier, 'utf8').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]
                .map(m => path.join(path.dirname(fichier), decodeURI(m[1])))
                .filter(image => !fs.existsSync(image)));
        expect(manquantes).toEqual([]);
    });

    it('est rangé dans l’index des guides', () => {
        expect(fs.readFileSync(path.join(GUIDES, '00-Index-des-guides.md'), 'utf8'))
            .toContain('53-Les-jeux-et-leurs-mecaniques.md');
    });
});
