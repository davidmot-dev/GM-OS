import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import {
    chargerIndex,
    clef,
    creerResolveur,
    distance,
    extraireEntrees,
    pagesInvraisemblables,
    plageDePages,
    sectionsCitees,
} from './bookIndex';

/**
 * Ce que ces tests protègent : la capacité à vérifier une citation.
 *
 * Les pages rendues par NotebookLM sont fausses (neuf fiches Dune sur dix-sept
 * citaient au-delà de la dernière page du livre). Les gabarits v3 demandent
 * donc des titres de section, et c'est ce résolveur qui les transforme en
 * pages. S'il se dégrade en silence, on retombe dans la citation invérifiable.
 */

const DOCS = path.join(__dirname, '..', 'docs');

describe('clef de comparaison', () => {
    it('ignore accents et casse', () => {
        expect(clef('Difficulté')).toBe(clef('DIFFICULTE'));
    });

    it('absorbe les titres éclatés lettre à lettre', () => {
        // Défaut d'extraction réel chez Blade Runner.
        expect(clef('E T TO M B E N T L E S A N G E S')).toBe(clef('ET TOMBENT LES ANGES'));
    });

    it('absorbe la ponctuation et les points de conduite', () => {
        expect(clef('Aperçu du livre de base........')).toBe(clef('aperçu du livre de base'));
    });
});

describe('distance bornée', () => {
    it('mesure une ligature perdue à un caractère', () => {
        // « conflit » -> « confit » et « difficulté » -> « diffculté » : le fi/fl saute.
        expect(distance(clef('conflit'), clef('confit'), 2)).toBe(1);
        expect(distance(clef('difficulté'), clef('diffculté'), 2)).toBe(1);
    });

    it('abandonne au-delà du plafond au lieu de finir le calcul', () => {
        expect(distance('abcdefgh', 'zzzzzzzz', 2)).toBe(3);
    });
});

describe('extraction des entrées', () => {
    it('lit la forme en cellule « TITRE<br>PAGE »', () => {
        expect(extraireEntrees(['|FORCER LE TEST<br>60|'])).toEqual([{ titre: 'FORCER LE TEST', page: 60 }]);
    });

    it('lit la table à deux colonnes', () => {
        expect(extraireEntrees(['|**SOUVENIR CLÉ**|**030**|'])).toEqual([{ titre: 'SOUVENIR CLÉ', page: 30 }]);
    });

    it('lit les points de conduite', () => {
        expect(extraireEntrees(['Aperçu du livre de base...................4']))
            .toEqual([{ titre: 'Aperçu du livre de base', page: 4 }]);
    });

    it('rejette ce qui n\'est pas une page', () => {
        // Une « page » à quatre chiffres est un index de carnet, pas une page.
        expect(extraireEntrees(['Résolution des jets.........1587'])).toEqual([]);
        expect(extraireEntrees(['|12<br>34|'])).toEqual([]);
    });
});

describe('résolution', () => {
    const livre = {
        systeme: 'test',
        sources: ['fictif'],
        entrees: [
            { titre: 'Forcer le test', page: 60 },
            { titre: 'Niveau de Stress', page: 61 },
            { titre: 'Zones de confit', page: 164 },
            { titre: 'Forcer le test', page: 200 },
        ],
    };
    const r = creerResolveur(livre);

    it('résout un titre exact', () => {
        const res = r.resoudre('Forcer le test');
        expect(res.statut).toBe('exact');
        expect(res.page).toBe(60);
    });

    it('garde la première occurrence d\'un titre en double', () => {
        // Une section commence là où elle apparaît d'abord.
        expect(r.resoudre('FORCER LE TEST').page).toBe(60);
    });

    it('rattrape une ligature perdue dans l\'index', () => {
        // L'index dit « confit », la fiche dit « conflit ».
        const res = r.resoudre('Zones de conflit');
        expect(res.statut).toBe('approche');
        expect(res.page).toBe(164);
        expect(res.score).toBeGreaterThan(0.85);
    });

    it('déclare introuvable ce qui ne ressemble à rien', () => {
        const res = r.resoudre('Création de personnage');
        expect(res.statut).toBe('introuvable');
        expect(res.page).toBeUndefined();
    });

    it('ne résout pas un titre vide', () => {
        expect(r.resoudre('   ').statut).toBe('introuvable');
    });
});

describe('sections citées par une fiche', () => {
    it('lit le champ sections du frontmatter', () => {
        const fiche = `---\nsujet: Résolution des jets\nsections: « Forcer le test » ; « Niveau de Stress »\n---\n\n# X`;
        expect(sectionsCitees(fiche)).toEqual(['Forcer le test', 'Niveau de Stress']);
    });

    it('rend une liste vide sans frontmatter ni champ', () => {
        expect(sectionsCitees('# Pas de frontmatter')).toEqual([]);
        expect(sectionsCitees('---\nsujet: X\n---\n')).toEqual([]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Index réels
// ─────────────────────────────────────────────────────────────────────────────

describe('index réels', () => {
    const SYSTEMES = ['alien', 'blade-runner', 'dune'] as const;

    it.each(SYSTEMES)('« %s » : l\'index se charge et contient des entrées', (systeme) => {
        const livre = chargerIndex(DOCS, systeme);
        expect(livre.sources.length, 'aucun fichier d\'index exploitable').toBeGreaterThan(0);
        expect(livre.entrees.length).toBeGreaterThan(20);
    });

    it.each(SYSTEMES)('« %s » : toutes les pages sont plausibles', (systeme) => {
        const livre = chargerIndex(DOCS, systeme);
        for (const e of livre.entrees) {
            expect(e.page, `${e.titre} -> ${e.page}`).toBeGreaterThan(0);
            expect(e.page).toBeLessThan(1000);
        }
    });

    it('Dune tire sa table des matières d\'un fichier dédié', () => {
        /**
         * Le `.docx` fut d'abord la seule source du sommaire de Dune — la
         * conversion Markdown d'origine n'en donnait rien. David a depuis
         * produit un `Dune_TOC.md` qui rend les mêmes 614 paires **en mieux** :
         * il décode les entités HTML que Word laissait brutes (« Artillerie
         * &amp;… ») et ne perd pas d'initiale (« ener une partIe »).
         *
         * Le `.docx` est donc sorti de `index/` vers `index/_sources/`, où le
         * chargeur ne le lit plus : il n'apportait que 614 doublons. Ce qui doit
         * tenir n'est pas la provenance mais le **rendement**.
         */
        const livre = chargerIndex(DOCS, 'dune');
        expect(livre.entrees.length).toBeGreaterThan(400);
        expect(livre.sources.some(s => s.endsWith('_TOC.md'))).toBe(true);
    });

    it('ignore les sources brutes rangées en sous-dossier', () => {
        // `index/_sources/` garde les documents d'origine sans les charger deux
        // fois : un sous-dossier n'a pas d'extension, le chargeur passe.
        const livre = chargerIndex(DOCS, 'dune');
        expect(livre.sources.some(s => s.endsWith('.docx'))).toBe(false);
    });

    it.each(SYSTEMES)('« %s » : le résolveur retrouve ses propres entrées', (systeme) => {
        const livre = chargerIndex(DOCS, systeme);
        const r = creerResolveur(livre);
        // Contrôle de cohérence : toute entrée de l'index doit se résoudre.
        for (const e of livre.entrees.slice(0, 40)) {
            expect(r.resoudre(e.titre).statut, `${e.titre} irrésolu`).not.toBe('introuvable');
        }
    });

    it('n\'invente pas de correspondance pour un titre étranger', () => {
        const r = creerResolveur(chargerIndex(DOCS, 'alien'));
        const res = r.resoudre('Règles de conduite du Bene Gesserit sur Arrakis');
        expect(res.statut).toBe('introuvable');
    });

    it('Dune atteste une pagination qui s\'arrête bien avant les pages citées', () => {
        // Le constat qui a fait marquer tout le corpus « pages_fiables: false ».
        const plage = plageDePages(chargerIndex(DOCS, 'dune'))!;
        expect(plage.max).toBeLessThan(400);
        expect(plage.max).toBeGreaterThan(200);
    });
});

describe('contrôle de vraisemblance des pages', () => {
    const livre = {
        systeme: 'test',
        sources: ['fictif'],
        entrees: [{ titre: 'Début', page: 1 }, { titre: 'Fin', page: 329 }],
    };

    it('signale une page au-delà de la pagination attestée', () => {
        expect(pagesInvraisemblables('La règle dit ceci (p. 149) et cela (p. 1279).', livre)).toEqual([1279]);
    });

    it('ne signale rien quand tout tient dans la plage', () => {
        expect(pagesInvraisemblables('Voir p. 149, p. 236-238.', livre)).toEqual([]);
    });

    it('reste muet sans index', () => {
        const vide = { systeme: 'x', sources: [], entrees: [] };
        expect(pagesInvraisemblables('p. 9999', vide)).toEqual([]);
    });

    it('trouve les fiches Dune contaminées sur le corpus réel', () => {
        /**
         * Le corpus v1 de Dune est archivé dans `rules-v1/` depuis le
         * 2026-08-10, hors de l'index de l'Oracle, en attendant sa régénération
         * en v3 (voir `docs/systems/dune/.ragignore`). Les fiches ont déménagé,
         * le contrôle les suit : c'est **sur elles** qu'il a été calibré, et ce
         * sont elles que la régénération devra faire disparaître.
         */
        const dune = chargerIndex(DOCS, 'dune');
        const dir = path.join(DOCS, 'systems', 'dune', 'rules-v1');
        const atteintes = fs.readdirSync(dir)
            .filter(n => n.endsWith('.md'))
            .filter(n => pagesInvraisemblables(fs.readFileSync(path.join(dir, n), 'utf8'), dune).length > 0);

        // Neuf fiches relevées le 2026-08-09. Le contrôle doit continuer de les voir.
        expect(atteintes.length).toBeGreaterThanOrEqual(9);
    });
});
