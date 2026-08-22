import { describe, it, expect } from 'vitest';
import { etatDeRelecture, marquerCommeRelue } from './marqueDeRelecture';

/**
 * Ce que ces tests protègent : **marquer une fiche relue ne touche que cette
 * ligne**.
 *
 * Le marqueur `relu:` était écrit par trois endroits et lu par personne — 194
 * fiches le portaient le 2026-08-22. Lui donner un lecteur suppose de pouvoir
 * le changer, et *on ne réécrit pas un fichier depuis ce qu'un seul écran en
 * connaît* : c'est la leçon du trousseau de clés.
 */

const fiche = [
    '---',
    'sujet: Résolution des jets',
    'systeme: star-trek',
    'sources: "livre_de_base.pdf"',
    'relu: false',
    '---',
    '',
    '# Résolution des jets',
    '',
    'Le corps de la fiche, qui ne doit pas bouger.',
    '',
].join('\n');

describe('l’état déclaré', () => {
    it('distingue relue, non relue, et sans marque', () => {
        expect(etatDeRelecture(true)).toBe('relue');
        expect(etatDeRelecture(false)).toBe('non-relue');
        expect(etatDeRelecture(undefined)).toBe('sans-marque');
    });

    /**
     * **`sans-marque` n'est pas `non-relue`.** Un extrait brut, une décharge,
     * une note du meneur n'ont jamais prétendu être des fiches : les afficher
     * comme non relues ferait crier l'écran sur des documents qui n'ont rien à
     * se reprocher. *L'absence n'est pas un zéro.*
     */
    it('ne transforme pas une absence en reproche', () => {
        expect(etatDeRelecture(undefined)).not.toBe('non-relue');
    });
});

describe('marquer comme relue', () => {
    it('bascule la ligne, et rien d’autre', () => {
        const apres = marquerCommeRelue(fiche)!;

        expect(apres).toContain('relu: true');
        expect(apres).not.toContain('relu: false');
        expect(apres, 'le sujet survit').toContain('sujet: Résolution des jets');
        expect(apres, 'les sources survivent').toContain('sources: "livre_de_base.pdf"');
        expect(apres, 'le corps survit').toContain('Le corps de la fiche, qui ne doit pas bouger.');
        expect(apres.split('\n').length, 'aucune ligne ajoutée ni perdue')
            .toBe(fiche.split('\n').length);
    });

    /**
     * **Un appelant qui reçoit `null` n'écrit pas.** Réécrire un fichier
     * identique à lui-même en change la date de modification, et fait donc
     * mentir l'index du RAG sur ce qui a bougé.
     */
    it('ne rend rien quand il n’y a rien à faire', () => {
        expect(marquerCommeRelue(fiche.replace('relu: false', 'relu: true'))).toBeNull();
        expect(marquerCommeRelue('# Une note sans frontmatter')).toBeNull();
        expect(marquerCommeRelue(fiche.replace('relu: false\n', ''))).toBeNull();
    });

    /**
     * **On remplace dans le frontmatter, pas dans le document.** Une fiche peut
     * contenir « relu: false » dans son corps — en citant une règle de revue,
     * par exemple. Borner la substitution à la tête empêche d'aller réécrire
     * une phrase que quelqu'un a écrite exprès.
     */
    it('ne réécrit pas une occurrence du corps de la fiche', () => {
        const piegeuse = fiche.replace(
            'Le corps de la fiche, qui ne doit pas bouger.',
            'Une fiche neuve porte `relu: false` tant que personne ne l’a lue.',
        );
        const apres = marquerCommeRelue(piegeuse)!;

        expect(apres, 'la tête bascule').toContain('relu: true');
        expect(apres, 'le corps est intact').toContain('porte `relu: false` tant que personne');
    });
});
