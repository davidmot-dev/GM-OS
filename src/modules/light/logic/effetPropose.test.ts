import { describe, it, expect } from 'vitest';
import {
    etapesDeLaProposition, aleaDeLaProposition, nomDeLEffetPropose,
    justificationDeLaProposition, ETAPES_MAXIMUM, SCHEMA_DE_L_EFFET,
} from './effetPropose';
import { DUREE_MINIMALE_MS, DUREE_MAXIMALE_MS } from './effetDAtelier';

/**
 * Ce que ces essais protègent : **un effet inventé par un modèle ne peut ni
 * emballer le pont, ni se faire passer pour ce que le meneur a demandé.**
 *
 * ⛔ C'est la même leçon que l'ambiance composée du 19/09, appliquée à une
 * donnée plus fragile : *un modèle qui invente ne lève aucune erreur, il rend
 * des nombres plausibles et faux.* Une durée de 20 ms ne paraît pas fausse à
 * la lecture — elle noie un pont qui tient dix commandes par seconde.
 */

const propose = (etapes: unknown[], reste: Record<string, unknown> = {}) =>
    ({ nom: 'Orage lointain', justification: 'Deux éclairs, puis l’attente.', alea: 20, etapes, ...reste }) as never;

describe('les étapes qu’on garde', () => {
    it('garde une suite jouable telle qu’elle a été proposée', () => {
        const etapes = etapesDeLaProposition(propose([
            { couleur: '#FFFFFF', brillance: 100, duree: 120, fondu: 0 },
            { couleur: '#102040', brillance: 15, duree: 18000, fondu: 3000 },
        ]));

        expect(etapes).toHaveLength(2);
        expect(etapes[0].couleur).toBe('#ffffff');
        expect(etapes[1].fondu).toBe(3000);
    });

    /**
     * ⛔ **Le choix qui sépare ce contrôle de `etapeBornee`.** Une saisie
     * humaine mal tapée devient blanche : le meneur le voit et corrige. Un
     * blanc glissé par un modèle au milieu d'un orage passerait pour une
     * intention. *Une étape manquante se voit ; une étape fausse se croit.*
     */
    it('JETTE une étape dont la couleur n’est pas un hexadécimal', () => {
        const etapes = etapesDeLaProposition(propose([
            { couleur: 'bleu nuit', brillance: 40, duree: 500, fondu: 0 },
            { couleur: '#102040', brillance: 15, duree: 900, fondu: 0 },
        ]));

        expect(etapes, 'une couleur inventée a été repeinte au lieu d’être jetée').toHaveLength(1);
        expect(etapes[0].couleur).toBe('#102040');
    });

    it('accepte la forme courte et la rend longue', () => {
        expect(etapesDeLaProposition(propose([
            { couleur: '#0af', brillance: 50, duree: 400, fondu: 0 },
        ]))[0].couleur).toBe('#00aaff');
    });

    /** ⛔ Le seul défaut de cette liste qui ne se verrait pas à l'écran. */
    it('remonte une durée sous le plancher du pont', () => {
        expect(etapesDeLaProposition(propose([
            { couleur: '#ffffff', brillance: 100, duree: 20, fondu: 0 },
        ]))[0].duree).toBe(DUREE_MINIMALE_MS);
    });

    it('donne le plancher à une étape sans durée, jamais zéro', () => {
        expect(etapesDeLaProposition(propose([
            { couleur: '#ffffff', brillance: 100, fondu: 0 },
        ]))[0].duree).toBe(DUREE_MINIMALE_MS);
    });

    it('ramène un fondu plus long que son étape', () => {
        expect(etapesDeLaProposition(propose([
            { couleur: '#ffffff', brillance: 60, duree: 800, fondu: 5000 },
        ]))[0].fondu).toBe(800);
    });

    it('borne une durée démesurée', () => {
        expect(etapesDeLaProposition(propose([
            { couleur: '#ffffff', brillance: 60, duree: 900000, fondu: 0 },
        ]))[0].duree).toBe(DUREE_MAXIMALE_MS);
    });

    /** *Un effet qu'on ne peut plus retoucher n'est plus un effet d'atelier.* */
    it('coupe une suite trop longue pour être relue', () => {
        const vingt = Array.from({ length: 20 }, () => (
            { couleur: '#ffffff', brillance: 50, duree: 300, fondu: 0 }
        ));

        expect(etapesDeLaProposition(propose(vingt))).toHaveLength(ETAPES_MAXIMUM);
    });

    it('rend une liste vide quand rien n’est utilisable', () => {
        expect(etapesDeLaProposition(propose([{ couleur: 'rouge', brillance: 50 }]))).toEqual([]);
        expect(etapesDeLaProposition(propose([]))).toEqual([]);
        expect(etapesDeLaProposition(null)).toEqual([]);
    });
});

describe('le désordre proposé', () => {
    it('est gardé quand il est jouable', () => {
        expect(aleaDeLaProposition(propose([], { alea: 35 }))).toBe(35);
    });

    /**
     * ⚠️ **Absent, il vaut 25 et non zéro** — *une boucle parfaitement
     * régulière ressemble à une machine, pas à une flamme.*
     */
    it('vaut 25 quand le modèle l’oublie', () => {
        expect(aleaDeLaProposition(propose([], { alea: undefined }))).toBe(25);
        expect(aleaDeLaProposition(propose([], { alea: 'beaucoup' }))).toBe(25);
    });

    it('est borné dans les deux sens', () => {
        expect(aleaDeLaProposition(propose([], { alea: 400 }))).toBe(100);
        expect(aleaDeLaProposition(propose([], { alea: -12 }))).toBe(0);
    });
});

describe('le nom et la phrase', () => {
    it('garde le nom proposé, sans ses guillemets', () => {
        expect(nomDeLEffetPropose('« Orage lointain »', 'Nouvel effet')).toBe('Orage lointain');
    });

    it('retombe sur le nom actuel quand le modèle n’en rend pas', () => {
        expect(nomDeLEffetPropose(undefined, 'Nouvel effet')).toBe('Nouvel effet');
        expect(nomDeLEffetPropose('   ', 'Nouvel effet')).toBe('Nouvel effet');
    });

    /** Une tuile en porte quelques mots : un nom-phrase déborde partout. */
    it('coupe un nom qui est devenu une phrase', () => {
        expect(nomDeLEffetPropose('un orage qui gronde au loin derrière les collines', 'X'))
            .toBe('un orage qui gronde au');
    });

    it('rend une phrase vide plutôt qu’un objet bizarre', () => {
        expect(justificationDeLaProposition(propose([], { justification: 42 }))).toBe('');
    });
});

describe('le schéma imposé au décodeur', () => {
    /** *La forme est garantie par le schéma ; le contenu par tout ce qui précède.* */
    it('exige les quatre nombres d’une étape', () => {
        expect(SCHEMA_DE_L_EFFET.properties.etapes.items.required)
            .toEqual(['couleur', 'brillance', 'duree', 'fondu']);
    });

    it('exige le désordre au premier niveau', () => {
        expect(SCHEMA_DE_L_EFFET.required).toContain('alea');
    });
});
