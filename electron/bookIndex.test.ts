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
    verifierLesCitations,
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

    it('lit une page mise en gras par le convertisseur', () => {
        /**
         * Relevé le 2026-08-10 sur `Blade Runner_Index.md` : le convertisseur
         * met les pages en gras, et la règle ne tolérait le gras qu'autour du
         * titre. Quarante-six entrées tombaient dans le vide — sans que rien ne
         * le signale, un index pauvre et un index mal lu s'affichant pareil.
         */
        expect(extraireEntrees(['**Agripper**<br>**068**'])).toEqual([{ titre: 'Agripper', page: 68 }]);
    });

    it('apparie une colonne de titres avec la colonne de pages qui la suit', () => {
        /**
         * La forme que prend un index imprimé sur plusieurs colonnes une fois
         * converti en Markdown : les titres d'une colonne tombent dans une
         * cellule, leurs pages dans la cellule voisine, chacun à son rang.
         * Ligne réelle du fichier Blade Runner — 281 paires que les règles
         * ligne à ligne ne voyaient pas.
         */
        const ligne = '|**Cafés connectés**<br>**Catégories de portées**|**206**<br>**064**<br>|';
        expect(extraireEntrees([ligne])).toEqual([
            { titre: 'Cafés connectés', page: 206 },
            { titre: 'Catégories de portées', page: 64 },
        ]);
    });

    it('refuse d\'apparier deux colonnes qui ne s\'alignent pas', () => {
        // Une entrée d'index fausse est pire qu'une entrée absente : elle donne
        // une page à un titre qui n'est pas là. Sans alignement, on se tait.
        expect(extraireEntrees(['|**Un titre**<br>**Un autre**|**042**|'])).toEqual([]);
    });

    it('ne rend pas deux fois la même paire quand deux règles la voient', () => {
        // Les règles se recouvrent volontairement — chacune rattrape ce que les
        // autres laissent. Le doublon est un artefact de cette redondance, pas
        // une information de l'index.
        expect(extraireEntrees(['|**SOUVENIR CLÉ**|**030**|'])).toEqual([{ titre: 'SOUVENIR CLÉ', page: 30 }]);
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
        ignores: [],
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

    it('chaque livre rend un index exploitable, pas seulement Dune', () => {
        /**
         * **Le rendement se protège par un plancher, sinon sa perte est
         * invisible.** Le 2026-08-10, Blade Runner rendait 63 titres uniques
         * contre 539 pour Dune, et la conclusion qui s'imposait était « son
         * index est pauvre ». Il ne l'était pas : deux formes du convertisseur
         * n'étaient pas lues — pages en gras, colonnes appariées. Un index mal
         * lu et un index pauvre s'affichent exactement pareil, et c'est la
         * fiche qui prend le blâme au moment de la revue.
         *
         * Les seuils sont sous les valeurs relevées après correction
         * (539 / 298 / 357) : ils attrapent un effondrement, pas une variation.
         */
        const plancher: Record<string, number> = { dune: 450, 'blade-runner': 250, alien: 300 };
        for (const systeme of SYSTEMES) {
            const taille = creerResolveur(chargerIndex(DOCS, systeme)).taille;
            expect(taille, `${systeme} : ${taille} titres uniques`).toBeGreaterThan(plancher[systeme]);
        }
    });

    it('Blade Runner sépare son sommaire de son index alphabétique', () => {
        /**
         * Convention retenue avec David : `<Livre>_TOC.md` pour le sommaire,
         * `<Livre>_Index.md` pour l'index alphabétique. **Il faut les deux** —
         * l'alphabétique donne des résolutions que le sommaire ne donne pas, et
         * inversement. Les garder dans un seul fichier ne perdait aucune
         * entrée, mais rendait impossible de dire lequel des deux manquait.
         */
        const sources = chargerIndex(DOCS, 'blade-runner').sources;
        expect(sources.some(s => s.endsWith('_TOC.md'))).toBe(true);
        expect(sources.some(s => s.endsWith('_Index.md'))).toBe(true);
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
        ignores: [],
        entrees: [{ titre: 'Début', page: 1 }, { titre: 'Fin', page: 329 }],
    };

    it('signale une page au-delà de la pagination attestée', () => {
        expect(pagesInvraisemblables('La règle dit ceci (p. 149) et cela (p. 1279).', livre)).toEqual([1279]);
    });

    it('ne signale rien quand tout tient dans la plage', () => {
        expect(pagesInvraisemblables('Voir p. 149, p. 236-238.', livre)).toEqual([]);
    });

    it('reste muet sans index', () => {
        const vide = { systeme: 'x', sources: [], entrees: [], ignores: [] };
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

// ─────────────────────────────────────────────────────────────────────────────
// La vérification telle que la revue la présente
// ─────────────────────────────────────────────────────────────────────────────

describe('verifierLesCitations', () => {
    /**
     * Ce que ces tests protègent : **la vérification est une étape du flux**.
     *
     * Le résolveur existait depuis le 2026-08-09 et n'avait aucun appelant en
     * production. Une vérification qu'il faut lancer à la main n'est pas une
     * vérification, c'est une intention : elle tourne maintenant dans la revue,
     * avant que la fiche n'entre dans `rules/` et ne devienne citable.
     */

    it('distingue « pas d\'index » de « aucune section résolue »', () => {
        /**
         * La distinction qui compte. Sans elle, un corpus sans index et une
         * fiche aux titres inventés rendent le même verdict — et l'écran accuse
         * la fiche d'un manque qui n'est pas le sien. Une mesure impossible
         * n'est pas une mesure mauvaise.
         */
        const sansIndex = { systeme: 'x', sources: [], entrees: [], ignores: [] };
        const v = verifierLesCitations(sansIndex, '---\nsections: « Forcer le test »\n---\n');

        expect(v.indexDisponible).toBe(false);
        expect(v.resolutions).toEqual([]);
        expect(v.plage).toBeNull();
    });

    it('résout les sections d\'une fiche réelle contre l\'index réel', () => {
        // Vérifié sur la charge, jamais sur un exemple écrit pour l'occasion :
        // c'est la règle tirée du correctif « Feyd-Rautha ».
        const fiche = fs.readFileSync(
            path.join(DOCS, 'systems', 'dune', 'rules', 'resolution-des-jets.md'),
            'utf8',
        );
        const v = verifierLesCitations(chargerIndex(DOCS, 'dune'), fiche);

        expect(v.indexDisponible).toBe(true);
        expect(v.sources.length).toBeGreaterThan(0);
        expect(v.resolutions.length, 'la fiche ne cite aucune section').toBeGreaterThan(0);
        expect(v.resolutions.some(r => r.statut !== 'introuvable')).toBe(true);
        expect(v.plage!.max).toBeLessThan(400);
    });

    it('remonte les pages citées au-delà du livre', () => {
        const contaminee = '---\nsections: « Agir »\n---\n\nLa règle dit ceci (p. 1279).';
        const v = verifierLesCitations(chargerIndex(DOCS, 'dune'), contaminee);

        expect(v.pagesDouteuses).toContain(1279);
    });

    it('ne signale rien quand la fiche ne cite aucune page en clair', () => {
        // Les gabarits v3 interdisent les pages : le cas normal est le silence.
        const fiche = '---\nsections: « Agir »\n---\n\nLe texte ne cite aucune page.';
        expect(verifierLesCitations(chargerIndex(DOCS, 'dune'), fiche).pagesDouteuses).toEqual([]);
    });

    it('rend une vérification exploitable pour Blade Runner et Alien aussi', () => {
        // Les trois corpus ont un index : le contrôle doit valoir pour les trois,
        // sinon il n'aiderait que là où le travail est déjà fait.
        for (const systeme of ['blade-runner', 'alien']) {
            const v = verifierLesCitations(chargerIndex(DOCS, systeme), '---\nsections: « X »\n---\n');
            expect(v.indexDisponible, `${systeme} sans index`).toBe(true);
            expect(v.plage, `${systeme} sans pagination`).not.toBeNull();
        }
    });
});
