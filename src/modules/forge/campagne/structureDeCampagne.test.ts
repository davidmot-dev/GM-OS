import { describe, it, expect } from 'vitest';
import { lireLaStructure, retirerLaNumerotation } from './structureDeCampagne';

/**
 * Ce que ces tests protègent : **le titre exact des actes**.
 *
 * C'est la réponse la plus lourde de conséquences de tout l'atelier — elle
 * borne les onze requêtes suivantes. Un titre déformé et elles portent sur une
 * partie que le livre ne connaît pas ; un acte manqué et ses PNJ comme ses
 * scènes ne seront jamais demandés.
 *
 * **Le carnet rend la même demande sous des formes qu'on n'attend pas.** C'est
 * la leçon la plus chère du corpus de règles, rencontrée quatre fois : hors
 * catégories en liste numérotée, titres entre accents graves, tableaux sans
 * barres extérieures, et numérotation en toutes lettres — cette dernière a fait
 * passer six sujets sur quatorze en hors canevas **avec leur vraie réponse**,
 * pendant que l'écran affichait « le carnet n'a rien rendu ».
 */

describe('retirerLaNumerotation', () => {
    it('retire les numéros en chiffres', () => {
        expect(retirerLaNumerotation('1. Le Sable et le Sang')).toBe('Le Sable et le Sang');
        expect(retirerLaNumerotation('12) La Maison Divisée')).toBe('La Maison Divisée');
    });

    it('retire les numéros EN TOUTES LETTRES', () => {
        // Relevé sur la charge réelle du 2026-08-14, le SRD Year Zero Engine :
        // « un. Résolution des jets ». On ne retirait que les chiffres.
        expect(retirerLaNumerotation('un. Le Sable et le Sang')).toBe('Le Sable et le Sang');
        expect(retirerLaNumerotation('Deuxième. La Maison Divisée')).toBe('La Maison Divisée');
    });

    it('NE retire PAS « Acte I », qui est le titre', () => {
        /**
         * C'est le piège de cette fonction. « Acte I — La Chute » est le titre
         * que le livre écrit, et c'est lui qui doit repartir vers le carnet.
         * On ne coupe que ce qui a la forme d'une puce : un mot-nombre suivi
         * d'un point ou d'une parenthèse.
         */
        expect(retirerLaNumerotation('Acte I — La Chute de Carthag')).toBe('Acte I — La Chute de Carthag');
        expect(retirerLaNumerotation('Chapitre 3 : Le Désert')).toBe('Chapitre 3 : Le Désert');
    });

    it('ne coupe pas un mot ordinaire suivi d\'un point', () => {
        expect(retirerLaNumerotation('Arrakis. Le désert')).toBe('Arrakis. Le désert');
    });
});

describe('lireLaStructure — les trois formes que le carnet emploie', () => {
    it('lit un tableau bordé', () => {
        const actes = lireLaStructure(`
| Ordre | Titre exact | Enjeu | Sections |
| --- | --- | --- | --- |
| 1 | Acte I — Le Sable et le Sang | Les agents arrivent sur Arrakis. | \`L'Arrivée\`, \`Carthag\` |
| 2 | Acte II — La Maison Divisée | La trahison éclate. | \`La Trahison\` |
`);
        expect(actes).toHaveLength(2);
        expect(actes[0].titre).toBe('Acte I — Le Sable et le Sang');
        expect(actes[0].enjeu).toBe('Les agents arrivent sur Arrakis.');
        expect(actes[0].sections).toEqual(["L'Arrivée", 'Carthag']);
        expect(actes[1].ordre).toBe(1);
    });

    it('lit un tableau SANS barres extérieures', () => {
        // Le carnet a rendu les inventaires d'Alien et de Blade Runner ainsi,
        // pendant qu'il rendait celui de Dune en liste numérotée. On exigeait
        // une barre en tête : treize sujets ressortaient « non lus » alors
        // qu'ils portaient un « oui » franc.
        const actes = lireLaStructure(`
Ordre | Titre exact | Enjeu | Sections
1 | Acte I — Le Sable | Ils arrivent. | L'Arrivée
2 | Acte II — La Chute | Tout brûle. | La Chute
`);
        expect(actes.map(a => a.titre)).toEqual(['Acte I — Le Sable', 'Acte II — La Chute']);
    });

    it('lit une liste numérotée', () => {
        const actes = lireLaStructure(`
Voici la structure de la campagne :

1. Acte I — Le Sable et le Sang
2. Acte II — La Maison Divisée
`);
        expect(actes.map(a => a.titre)).toEqual([
            'Acte I — Le Sable et le Sang',
            'Acte II — La Maison Divisée',
        ]);
    });

    it('en liste, ne coupe PAS le titre sur son tiret', () => {
        /**
         * Dans un tableau, les colonnes tranchent. Dans une liste plate, rien ne
         * distingue un tiret de titre d'un tiret de séparation — et **un titre
         * faux coûte infiniment plus qu'un enjeu manquant** : l'enjeu se retape
         * en dix secondes, le titre se paie en dix appels au carnet.
         */
        const actes = lireLaStructure('1. Acte I — La Chute de Carthag');
        expect(actes[0].titre).toBe('Acte I — La Chute de Carthag');
        expect(actes[0].enjeu).toBe('');
    });
});

describe('lireLaStructure — ce qu\'elle refuse de faire', () => {
    it('ignore la ligne d\'en-tête et les séparateurs', () => {
        const actes = lireLaStructure(`
| Ordre | Titre exact | Enjeu | Sections |
|-------|-------------|-------|----------|
| 1 | Acte unique | Tout. | — |
`);
        expect(actes).toHaveLength(1);
        expect(actes[0].titre).toBe('Acte unique');
        expect(actes[0].sections, '« — » n\'est pas une section').toEqual([]);
    });

    it('ne prend pas une phrase de prose pour un tableau', () => {
        // Sans barres extérieures on exige trois cellules : une phrase qui
        // contient une seule barre n'est pas une ligne de tableau.
        expect(lireLaStructure('La campagne se joue en trois actes | c\'est écrit page 12')).toEqual([]);
    });

    it('dédoublonne les titres répétés', () => {
        // Deux actes de même titre produiraient deux fiches au même slug, et la
        // seconde effacerait la première sans un mot.
        const actes = lireLaStructure(`
1. Acte I — Le Sable
2. Acte I — Le Sable
3. Acte II — La Chute
`);
        expect(actes.map(a => a.titre)).toEqual(['Acte I — Le Sable', 'Acte II — La Chute']);
    });

    it('renumérote sur l\'ordre d\'apparition, pas sur ce que le carnet écrit', () => {
        // Il numérote parfois à partir de zéro, saute une ligne, ou renumérote
        // après un titre intercalaire. Ce qui compte est l'ordre d'apparition.
        const actes = lireLaStructure(`
| 7 | Acte tardif | . | . |
| 3 | Acte précoce | . | . |
`);
        expect(actes.map(a => a.ordre)).toEqual([0, 1]);
        expect(actes[0].titre).toBe('Acte tardif');
    });

    it('une réponse illisible rend une liste vide, jamais une exception', () => {
        // C'est un résultat, pas une panne : l'atelier montre la réponse brute
        // et le meneur tranche. Lever aurait perdu la requête.
        expect(lireLaStructure('Je n\'ai pas trouvé de découpage dans les sources.')).toEqual([]);
        expect(lireLaStructure('')).toEqual([]);
    });
});
