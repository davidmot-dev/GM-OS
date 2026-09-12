import { describe, it, expect } from 'vitest';
import {
    resumeDuMoment, traceDuMoment, effetsManques, effetsJoues,
    type RapportDuMoment,
} from './rapportDuMoment';

/**
 * **La trace d'une séquence — l'incident du 2026-09-12.**
 *
 * ⛔ Une séquence de storyboard s'est jouée à moitié en séance, et le journal de
 * l'application ne porte **rien** : ni `error`, ni `warn`, la dernière ligne de
 * ce niveau datant du 5 septembre. *Un incident qui ne laisse aucune trace ne se
 * diagnostique pas, il se re-subit.*
 */

const rapport = (effets: RapportDuMoment['effets']): RapportDuMoment =>
    ({ moment: 'Le sas s’ouvre', effets });

describe('ce qui a manqué', () => {
    it('rien à dire quand tout ce qui était demandé a eu lieu', () => {
        expect(resumeDuMoment(rapport([
            { nom: 'Musique', sort: 'joue' },
            { nom: 'Image', sort: 'joue' },
        ]))).toBeNull();
    });

    /*
      ⚠️ **Ce qui n'est pas demandé n'est pas un manque.** Un moment sans musique
      n'a pas raté sa musique. Sans cette distinction, chaque moment crierait —
      et *un avertissement qui crie tout le temps ne se lit plus.*
    */
    it('un effet non demandé n’est pas un manque', () => {
        expect(resumeDuMoment(rapport([
            { nom: 'Musique', sort: 'non-demande' },
            { nom: 'Image', sort: 'non-demande' },
        ]))).toBeNull();
    });

    /*
      ⛔ **Les noms, jamais un compte.** « 2 effets ont échoué » ne dit pas quoi
      regarder ; « Image : introuvable » envoie à la médiathèque.
    */
    it('nomme chaque effet manqué', () => {
        const resume = resumeDuMoment(rapport([
            { nom: 'Image', sort: 'introuvable', cherche: 'm-42' },
            { nom: 'Lumières', sort: 'module-absent' },
            { nom: 'Musique', sort: 'joue' },
        ]));

        expect(resume).toContain('Image');
        expect(resume).toContain('Lumières');
        expect(resume, 'un effet joué n’a rien à faire dans une alerte').not.toContain('Musique');
    });

    /*
      ⭐ **LA DISTINCTION QUI DÉCIDE DE LA RÉPARATION.** « Introuvable » dit que
      la donnée du meneur a bougé ; « module non chargé » dit que le code n'était
      pas là. Les deux produisent le même silence à la table, et se réparent à
      l'opposé — *un diagnostic qui ne les sépare pas ne sert à rien.*
    */
    it('dit LAQUELLE des deux causes, en clair', () => {
        const resume = resumeDuMoment(rapport([
            { nom: 'Image', sort: 'introuvable', cherche: 'm-42' },
            { nom: 'Lumières', sort: 'module-absent' },
        ]))!;

        expect(resume).toMatch(/Image : introuvable/);
        expect(resume).toMatch(/Lumières : module non chargé/);
    });

    /* L'identifiant cherché suit, parce que c'est avec lui qu'on retrouve la
       donnée disparue. */
    it('et porte l’identifiant cherché quand il y en a un', () => {
        expect(resumeDuMoment(rapport([
            { nom: 'Musique', sort: 'introuvable', cherche: 'pad-7' },
        ]))).toContain('pad-7');
    });

    it('le nom du moment est dans le message', () => {
        expect(resumeDuMoment(rapport([{ nom: 'Image', sort: 'introuvable' }])))
            .toContain('Le sas s’ouvre');
    });
});

describe('le tri', () => {
    const mixte = rapport([
        { nom: 'Musique', sort: 'joue' },
        { nom: 'Image', sort: 'introuvable' },
        { nom: 'Lumières', sort: 'module-absent' },
        { nom: 'Carte', sort: 'non-demande' },
    ]);

    it('sépare ce qui a manqué', () => {
        expect(effetsManques(mixte).map(e => e.nom)).toEqual(['Image', 'Lumières']);
    });

    it('et ce qui a eu lieu', () => {
        expect(effetsJoues(mixte).map(e => e.nom)).toEqual(['Musique']);
    });
});

describe('la trace du journal', () => {
    /*
      ⚠️ **Elle part TOUJOURS, même quand tout va bien.** *Une trace qui n'existe
      que les mauvais jours ne permet pas de comparer* : quand la séquence
      suivante rate, on veut pouvoir regarder ce qu'a fait la précédente.
    */
    it('dit le sort de chaque effet demandé', () => {
        const trace = traceDuMoment(rapport([
            { nom: 'Musique', sort: 'joue' },
            { nom: 'Image', sort: 'introuvable' },
        ]));

        expect(trace).toContain('Musique=joue');
        expect(trace).toContain('Image=introuvable');
    });

    it('tait ce qui n’était pas demandé', () => {
        const trace = traceDuMoment(rapport([
            { nom: 'Musique', sort: 'joue' },
            { nom: 'Carte', sort: 'non-demande' },
        ]));

        expect(trace).not.toContain('Carte');
    });

    /* Un moment qui ne demande rien est un cas normal — il ne doit pas produire
       une ligne trompeuse. */
    it('un moment sans aucun effet le dit clairement', () => {
        expect(traceDuMoment(rapport([]))).toContain('aucun effet');
    });
});
