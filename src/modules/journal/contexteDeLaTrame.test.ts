import { describe, it, expect } from 'vitest';
import {
    decrireLesScenesOuvertes, derniersFaitsRacontes, nommerLesScenesOuvertes,
    type SceneEnContexte,
} from './contexteDeLaTrame';

/**
 * **Ce que ces tests protègent — étape 10 du § 8 du plan du 2026-08-08, la
 * dernière.**
 *
 * L'Oracle recevait la campagne, les PJ, les PNJ, les indices révélés et dix
 * événements bruts. **Aucune scène, aucun acte, aucun enjeu** — vrai le 08/08,
 * encore vrai treize jours plus tard.
 *
 * Le § 7 chiffre le bénéfice : *« scène en cours : l'embuscade de l'entrepôt —
 * les PJ cherchent le manifeste, le garde est corrompu »* est un bien meilleur
 * ancrage **pour bien moins de jetons**, ce qui compte double avec le plafond
 * RAG à 4 000.
 */

const scene = (extra: Partial<SceneEnContexte> = {}): SceneEnContexte => ({
    titre: "L'embuscade de l'entrepôt", pj: [], pnj: [], ...extra,
});

describe('décrire les scènes ouvertes', () => {
    it('l\'enjeu passe avant tout le reste', () => {
        /**
         * Le résumé est le seul champ que le meneur a écrit lui-même, et c'est
         * celui qui dit ce qui se joue. Un modèle qui ne lit que le titre
         * répond sur un lieu ; celui qui lit l'enjeu répond sur la scène.
         */
        const texte = decrireLesScenesOuvertes([scene({
            resume: 'Les PJ cherchent le manifeste, le garde est corrompu.',
            lieu: 'Entrepôt 7',
        })]);

        expect(texte.indexOf('Enjeu')).toBeLessThan(texte.indexOf('Lieu'));
        expect(texte).toContain('le garde est corrompu');
    });

    it('les champs vides ne laissent pas d\'étiquette orpheline', () => {
        // « Lieu : » sans lieu coûte des jetons pour dire qu'on ne sait rien,
        // et invite le modèle à commenter cette absence.
        const texte = decrireLesScenesOuvertes([scene()]);

        expect(texte).not.toContain('Lieu');
        expect(texte).not.toContain('PJ présents');
        expect(texte).toContain("L'embuscade de l'entrepôt");
    });

    it('DEUX scènes ouvertes est le cas normal, et les deux partent', () => {
        /**
         * Quand le groupe se sépare, deux scènes tournent en même temps — et
         * c'est précisément le moment où le meneur consulte l'Oracle. En
         * choisir une au hasard répondrait sur la moitié de la table.
         */
        const texte = decrireLesScenesOuvertes([
            scene({ titre: 'Le quai' }),
            scene({ titre: 'La salle des machines' }),
        ]);

        expect(texte).toContain('Le quai');
        expect(texte).toContain('La salle des machines');
    });

    it('sans scène ouverte, on n\'écrit rien du tout', () => {
        // Une campagne sans trame, une séance de préparation : des cas
        // ordinaires. « Aucune scène en cours » ferait dépenser des jetons pour
        // dire qu'on n'a rien à dire.
        expect(decrireLesScenesOuvertes([])).toBe('');
    });

    it('l\'acte accompagne le titre quand il est connu', () => {
        expect(decrireLesScenesOuvertes([scene({ acte: 'Acte II' })])).toContain('(Acte II)');
    });
});

describe('nommer les scènes — l\'ancrage du Cortex', () => {
    it('une ligne par scène, titre et enjeu', () => {
        // Le § 7 promet ce gain « pour quelques dizaines de jetons » : le Cortex
        // a déjà son rapport de situation, il lui manquait de savoir OÙ.
        expect(nommerLesScenesOuvertes([scene({ resume: 'Le garde est corrompu.' })]))
            .toBe("L'embuscade de l'entrepôt — Le garde est corrompu.");
    });

    it('sans enjeu, le titre suffit', () => {
        expect(nommerLesScenesOuvertes([scene()])).toBe("L'embuscade de l'entrepôt");
    });

    it('deux scènes se lisent d\'un trait', () => {
        expect(nommerLesScenesOuvertes([scene({ titre: 'A' }), scene({ titre: 'B' })]))
            .toBe('A | B');
    });
});

describe('les derniers faits racontés', () => {
    const fait = (n: number) => ({ title: `Fait ${n}`, content: `contenu ${n}` });

    it('on prend la FIN, parce que l\'ensemble curé est chronologique', () => {
        /**
         * C'est l'inverse du journal, qui empile le plus récent en tête — le
         * piège qui a fait envoyer à l'Oracle le début d'une séance sous
         * l'intitulé de sa fin, corrigé le 2026-08-20. *Le sens d'une pile ne se
         * devine pas.*
         */
        const texte = derniersFaitsRacontes([fait(1), fait(2), fait(3)], 2);

        expect(texte).toContain('Fait 3');
        expect(texte).toContain('Fait 2');
        expect(texte).not.toContain('Fait 1');
    });

    it('un contenu qui fait des paragraphes se replie sur une ligne', () => {
        // Un résumé de combat ou une vision de l'Oracle font des paragraphes.
        // Le titre porte l'essentiel ; le reste sert d'appui, pas de récit.
        const texte = derniersFaitsRacontes(
            [{ title: 'Combat', content: 'ligne un\n\nligne deux' }], 1,
        );

        expect(texte).toBe('- Combat : ligne un ligne deux');
    });

    it('un contenu très long est coupé, le titre jamais', () => {
        const texte = derniersFaitsRacontes([{ title: 'Vision', content: 'x'.repeat(600) }], 1);

        expect(texte).toContain('Vision');
        expect(texte.length).toBeLessThan(300);
    });

    it('un événement sans contenu se réduit à son titre', () => {
        expect(derniersFaitsRacontes([{ title: 'Indice révélé', content: '' }], 1))
            .toBe('- Indice révélé');
    });

    it('un récit vide rend une chaîne vide', () => {
        expect(derniersFaitsRacontes([], 8)).toBe('');
    });
});
