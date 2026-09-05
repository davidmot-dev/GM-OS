import { describe, it, expect } from 'vitest';
import { chroniquesParType, CATEGORIES } from './chroniquesParType';
import type { RemoteFicheDeWiki } from './segmentDeLecture';

/**
 * **Les Chroniques rangées par type.**
 *
 * Demandé par David le 2026-09-05. La liste était plate, et la catégorie
 * n'existait que comme pastille — *une information qu'on affiche sans s'en
 * servir pour ranger fait travailler l'œil à la place du code.*
 */

const fiche = (id: string, titre: string, categorie: string): RemoteFicheDeWiki =>
    ({ id, titre, categorie: categorie as RemoteFicheDeWiki['categorie'], contenu: '', tags: [] });

describe('l’ordre des groupes', () => {
    it('suit la table, et non l’alphabet', () => {
        /* Du plus consulté en séance au moins consulté : on cherche un PNJ dix
           fois par soirée, une rumeur deux fois par campagne. */
        const groupes = chroniquesParType([
            fiche('1', 'Une rumeur', 'rumor'),
            fiche('2', 'Un PNJ', 'npc'),
            fiche('3', 'Un lieu', 'location'),
        ]);

        expect(groupes.map(g => g.titre)).toEqual(['PNJ', 'Lieu', 'Rumeur']);
    });

    it('trie les fiches par titre à l’intérieur d’un groupe', () => {
        const groupes = chroniquesParType([
            fiche('1', 'Zoé', 'npc'), fiche('2', 'Alia', 'npc'), fiche('3', 'Élodie', 'npc'),
        ]);

        /* `localeCompare` : sans lui, « Élodie » passerait après « Zoé ». */
        expect(groupes[0].fiches.map(f => f.titre)).toEqual(['Alia', 'Élodie', 'Zoé']);
    });
});

describe('ce qui ne paraît pas, et ce qui ne disparaît pas', () => {
    it('une catégorie vide ne fait pas d’en-tête', () => {
        /* Un en-tête suivi de rien apprend au regard à sauter les en-têtes. */
        const groupes = chroniquesParType([fiche('1', 'Un PNJ', 'npc')]);

        expect(groupes).toHaveLength(1);
        expect(groupes[0].titre).toBe('PNJ');
    });

    it('UNE CATÉGORIE INCONNUE tombe à la fin — elle ne disparaît pas', () => {
        /*
          Un wiki plus ancien que la table, ou un type ajouté ailleurs : *une
          fiche qu'on n'affiche pas est une fiche qu'on croit effacée.*
        */
        const groupes = chroniquesParType([
            fiche('1', 'Un PNJ', 'npc'),
            fiche('2', 'Un truc', 'categorie-inventee'),
        ]);

        expect(groupes.map(g => g.titre)).toEqual(['PNJ', 'Non classées']);
        expect(groupes[1].fiches.map(f => f.titre)).toEqual(['Un truc']);
    });

    it('range aussi les inconnues par titre', () => {
        const groupes = chroniquesParType([
            fiche('1', 'Zed', 'xx'), fiche('2', 'Abel', 'yy'),
        ]);
        expect(groupes[0].fiches.map(f => f.titre)).toEqual(['Abel', 'Zed']);
    });

    it('ne perd aucune fiche, quelle que soit sa catégorie', () => {
        const entrees = [
            fiche('1', 'A', 'npc'), fiche('2', 'B', 'rumor'),
            fiche('3', 'C', 'inconnue'), fiche('4', 'D', 'other'),
        ];

        const total = chroniquesParType(entrees).reduce((n, g) => n + g.fiches.length, 0);

        expect(total).toBe(entrees.length);
    });

    it('rend une liste vide sur un wiki vide', () => {
        expect(chroniquesParType([])).toEqual([]);
    });
});

describe('la table des catégories', () => {
    it('ne contient aucun doublon — deux libellés pour une clé rangeraient deux fois', () => {
        const cles = CATEGORIES.map(([c]) => c);
        expect(new Set(cles).size).toBe(cles.length);
    });

    it('couvre les huit types du wiki', () => {
        expect(CATEGORIES.length).toBe(8);
    });
});
