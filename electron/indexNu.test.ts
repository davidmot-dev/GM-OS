import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { chargerIndex, creerResolveur, extraireEntrees, extraireIndexNu } from './bookIndex';

const DOCS = path.resolve(process.cwd(), 'docs');

/**
 * **L'index alphabétique nu — la cinquième forme, et la seule qui puisse mentir.**
 *
 * Relevé par David le 2026-08-21 : l'index de Rêves de Dragons, 977 lignes
 * déposées dans `index/`, rendait **zéro entrée**. Son convertisseur écrit
 * `Maladie 18, 25, 91 -94` — aucun balisage, un seul espace — et l'application
 * lui répondait *« aucun index chargé, déposez le sommaire et l'index du
 * livre »*, c'est-à-dire de refaire ce qu'il venait de faire.
 *
 * Les quatre formes d'origine exigent chacune un balisage — un `<br>`, une barre
 * de table, trois points de conduite — qu'un texte ordinaire ne porte pas.
 * Celle-ci n'exige qu'un espace, ce que la moindre phrase contient : **c'est
 * elle qui pourrait transformer un livre entier en index**, et ce fichier existe
 * pour tenir ses garde-fous.
 */

describe('ce que le repli refuse', () => {
    it('une phrase qui cite un nombre n\'est pas une entrée d\'index', () => {
        expect(extraireIndexNu(['Le xénomorphe attaque avec 3 dés supplémentaires.'])).toEqual([]);
    });

    it('il faut une SUITE de pages, pas un nombre isolé', () => {
        // La virgule ou la plage est la signature d'une pagination. Sans elle,
        // « quelque chose 12 » est une phrase où un nombre est tombé.
        expect(extraireIndexNu(['Marche 80'])).toEqual([]);
        expect(extraireIndexNu(['Marche 80, 88'])).toEqual([{ titre: 'Marche', page: 80 }]);
        expect(extraireIndexNu(['Marche 80 -88'])).toEqual([{ titre: 'Marche', page: 80 }]);
    });

    it('un sommaire en pavé continu ne devient pas un titre de cent caractères', () => {
        /**
         * Le vrai pavé de Rêves de Dragons : titres et numéros s'enchaînent sans
         * structure. Le plafond de six mots écarte le candidat trop long au lieu
         * d'en faire un titre — et la règle glisse jusqu'au titre court qui
         * précède réellement le nombre.
         */
        const pave = 'Les caractéristiques 16 Taille Apparence Constitution Force Agilité '
            + 'Dextérité Perception Vue Ouïe Odorat-Goût Volonté Intellect Empathie Rêve Chance '
            + 'Mêlée Tir Lancer Dérobée Les compétences 21, 24';

        for (const e of extraireIndexNu([pave])) {
            expect(e.titre.split(/\s+/).length, e.titre).toBeLessThanOrEqual(6);
            expect(e.titre.length, e.titre).toBeLessThanOrEqual(60);
        }
    });

    it('une parenthèse orpheline trahit un fragment de colonne voisine', () => {
        // « Mariol 408 - 409 (ill.), 418 (ill.) » débordait sur le nombre de la
        // colonne d'à côté et donnait « ill.) » pour titre.
        expect(extraireIndexNu(['Mariol 408 - 409 (ill.), 418 (ill.)']).map(e => e.titre))
            .not.toContain('ill.)');
        // Une parenthèse équilibrée, elle, fait partie du titre.
        expect(extraireIndexNu(['Manœuvres (navigation) 326, 340']).map(e => e.titre))
            .toContain('Manœuvres (navigation)');
    });

    it('un titre qui porte un chiffre n\'est pas un titre', () => {
        expect(extraireIndexNu(['Les 3 Âges 12, 15']).map(e => e.titre)).not.toContain('Les 3 Âges');
    });

    it('une préposition seule n\'est pas un titre', () => {
        // « Chapitre 3 sur 12 » laissait passer « sur » devant le 12 : trois
        // lettres suffisaient. Une entrée réelle d'index porte un substantif.
        expect(extraireIndexNu(['Chapitre 3 sur 12, 15']).map(e => e.titre)).not.toContain('sur');
    });
});

describe('ce que le repli accepte', () => {
    it('l\'entrée d\'index nue, avec ses plages et ses virgules', () => {
        const lignes = [
            'Maladie 18, 25, 91 -94, 105 -106 , 204, 281,',
            '    - Points de rêve 27, 50, 87, 102, 147',
            'Maladresse 81, 82, 84, 126 , 146 Manœuvres (navigation) 326, 340',
        ];

        const parTitre = Object.fromEntries(extraireIndexNu(lignes).map(e => [e.titre, e.page]));
        expect(parTitre).toMatchObject({
            'Maladie': 18,
            'Points de rêve': 27,
            'Maladresse': 81,
            // Deux colonnes tombées sur une même ligne : la seconde entrée
            // compte autant que la première.
            'Manœuvres (navigation)': 326,
        });
    });

    it('la même page ne se compte qu\'une fois', () => {
        expect(extraireIndexNu(['Marche 80, 88', 'Marche 80, 88'])).toHaveLength(1);
    });
});

/**
 * **La mesure qui décide, et elle porte sur les vrais livres.**
 *
 * Le repli ne doit rien changer aux corpus qui marchent, et débloquer celui qui
 * ne marchait pas. Ces chiffres sont ceux relevés le 2026-08-21 ; ils sont là
 * pour qu'une régression se voie, pas pour être jolis.
 */
describe('la cinquième forme ne dégrade aucun corpus', () => {
    it.each([
        ['alien', 379],
        ['blade-runner', 325],
        ['dune', 702],
    ])('« %s » rend toujours ses %i entrées balisées', (systeme, attendu) => {
        expect(chargerIndex(DOCS, systeme as string).entrees.length).toBe(attendu);
    });

    it('Rêves de Dragons passe de rien à un index utilisable', () => {
        const livre = chargerIndex(DOCS, 'reves de dragons');

        // 217 le 2026-08-21, contre 0 avant le repli. Les quatre formes balisées
        // n'en tirent toujours RIEN : c'est lui qui travaille, et lui seul.
        expect(livre.entrees.length).toBe(217);
        expect(livre.sources).toContain('Reve_de_Dragon_2.3.1-485-498.md');
    });

    it('et ses entrées se résolvent vraiment', () => {
        /**
         * Le compte ne prouve rien à lui seul : un index de 217 fragments
         * illisibles aurait le même. Ce qui compte est qu'un titre cité par une
         * fiche retrouve sa page.
         */
        const resolveur = creerResolveur(chargerIndex(DOCS, 'reves de dragons'));

        for (const [titre, page] of [['Initiative', 120], ['Maladresse', 81], ['Éthylisme', 51]] as const) {
            const r = resolveur.resoudre(titre);
            expect(r.statut, titre).toBe('exact');
            expect(r.page, titre).toBe(page);
        }
    });

    it('le seuil de densité a de la marge : aucun livre n\'atteint la moitié', () => {
        /**
         * Ce qui rend le repli sûr n'est pas sa finesse, c'est ce seuil. On
         * mesure donc ce qu'il aurait laissé passer sur les fichiers des trois
         * corpus sains — 9 au plus, pour un seuil de 40.
         */
        const sains = [
            ['alien', 'ALIEN_Index.md'],
            ['blade-runner', 'Blade Runner_Index.md'],
            ['dune', 'Dune_TOC.md'],
        ] as const;

        for (const [systeme, fichier] of sains) {
            const chemin = path.join(DOCS, 'systems', systeme, 'index', fichier);
            const lignes = fs.readFileSync(chemin, 'utf8').split(/\r?\n/);
            expect(extraireEntrees(lignes).length, fichier).toBeGreaterThan(0);
            expect(extraireIndexNu(lignes).length, `${fichier} — bruit du repli`).toBeLessThan(20);
        }
    });
});

describe('un dossier illisible ne se dit plus comme un dossier vide', () => {
    it('les fichiers dont rien n\'a pu être tiré sont nommés', () => {
        // Le livre complet d'Alien vit dans `index/` sans être un index : il ne
        // contribue rien, et il faut pouvoir le dire.
        expect(chargerIndex(DOCS, 'alien').ignores).toContain('ALIEN_le_jeu_de_rôle.docx');
    });

    it('un corpus sans dossier index n\'ignore rien — il n\'a rien vu', () => {
        const livre = chargerIndex(DOCS, 'systeme-qui-nexiste-pas');

        expect(livre.entrees).toEqual([]);
        expect(livre.ignores).toEqual([]);
    });
});
