import { describe, it, expect } from 'vitest';
import { lirePersonas, ecrirePersonas, raisonLisible } from './personasDuCorpus';
import { resoudreCorpus } from '../../../../electron/corpusSysteme';

/**
 * Ce que ces tests protègent : **le fichier de personas du corpus est écrit par
 * l'application, et David le relit dans son dépôt.**
 *
 * Le défaut d'origine, relevé le 2026-08-14 : les huit personas d'Alien
 * existaient dans `docs/systems/alien/gems.json` et servaient à chaque réponse
 * de l'Oracle, mais aucun écran ne les montrait — l'éditeur du moteur de règles
 * n'affiche que l'override du pilote. On a cru le travail perdu et failli le
 * refaire.
 *
 * Maintenant qu'un écran les écrit, ce qui compte est qu'il n'écrive pas
 * n'importe quoi : un `gems.json` corrompu rendrait les huit gemmes muettes
 * pour toutes les campagnes du corpus à la fois.
 */

describe('lire ce que le corpus déclare', () => {
    it('rend les personas d\'un fichier bien formé', () => {
        const etat = lirePersonas('{"sage":"Tu es l\'assistant technique.","oracle":"Tu distilles la peur."}');
        expect(etat.present).toBe(true);
        expect(etat.erreur).toBeUndefined();
        expect(Object.keys(etat.personas)).toEqual(['sage', 'oracle']);
    });

    it('un corpus sans gems.json n\'est pas un corpus fautif', () => {
        // Les gemmes emploient alors leurs instructions par défaut : c'est un
        // état ordinaire, pas une erreur à signaler en rouge.
        expect(lirePersonas(null)).toEqual({ personas: {}, present: false });
        expect(lirePersonas('   ')).toEqual({ personas: {}, present: false });
    });

    it('un fichier illisible se signale sans faire échouer l\'écran', () => {
        /**
         * Un écran blanc interdirait de réparer le fichier. On rend l'erreur
         * pour qu'elle s'affiche, et des personas vides pour que le reste de
         * l'écran continue de fonctionner.
         */
        const etat = lirePersonas('{"sage": "il manque une accolade"');
        expect(etat.present).toBe(true);
        expect(etat.erreur).toBeTruthy();
        expect(etat.personas).toEqual({});
    });

    it('un JSON valide qui n\'est pas un objet est refusé', () => {
        expect(lirePersonas('["sage"]').erreur).toBeTruthy();
        expect(lirePersonas('"du texte"').erreur).toBeTruthy();
    });

    it('écarte ce qui n\'est pas une chaîne', () => {
        // Une zone de texte affichant un objet réécrirait « [object Object] »
        // dans le corpus à la première sauvegarde.
        const etat = lirePersonas('{"sage":"vrai","scribe":{"a":1},"bard":42,"actor":""}');
        expect(etat.personas).toEqual({ sage: 'vrai' });
    });
});

describe('écrire dans le corpus', () => {
    it('indente et trie, parce que le fichier est versionné et relu', () => {
        const texte = ecrirePersonas({ oracle: 'B', sage: 'A' });
        expect(texte).toBe('{\n  "oracle": "B",\n  "sage": "A"\n}\n');
        // Trié : un ordre qui suivrait les caprices de l'objet ferait apparaître
        // comme modifiées des personas auxquelles personne n'a touché.
        expect(texte.indexOf('oracle')).toBeLessThan(texte.indexOf('sage'));
    });

    it('retire une persona vidée au lieu de l\'écrire à blanc', () => {
        /**
         * Une chaîne vide dans `gems.json` écraserait par du vide l'instruction
         * par défaut de la gemme ; son absence la laisse jouer. La différence
         * ne se verrait qu'en séance, sur une réponse fade.
         */
        expect(ecrirePersonas({ sage: 'A', oracle: '', bard: '   ' })).toBe('{\n  "sage": "A"\n}\n');
    });

    it('ce qui est écrit se relit à l\'identique', () => {
        const personas = { sage: 'Tu es « précis ».', oracle: 'Ligne 1\nLigne 2' };
        expect(lirePersonas(ecrirePersonas(personas)).personas).toEqual(personas);
    });

    it('un corpus vidé de toutes ses personas reste un fichier valide', () => {
        expect(lirePersonas(ecrirePersonas({})).erreur).toBeUndefined();
    });
});

describe('dire pourquoi ce dossier-là', () => {
    /**
     * La raison compte autant que le chemin. Un corpus trouvé « parce que le
     * pilote le déclare » et un corpus trouvé « en rapprochant son nom » mènent
     * au même dossier aujourd'hui et divergeront le jour où l'on renommera le
     * pilote — ce qu'on a justement conseillé de faire pour Alien, dont le
     * pilote s'appelle « alien » en minuscule.
     */
    const dossiersConnus = ['alien', 'dune'];

    it('un corpus déclaré le dit', () => {
        const corpus = resoudreCorpus({ systemId: 'custom-1', corpusId: 'alien', dossiersConnus });
        expect(raisonLisible(corpus)).toContain('déclaré par le pilote');
    });

    it('un rapprochement par le nom le dit aussi — c\'est le cas fragile', () => {
        const corpus = resoudreCorpus({ systemId: 'custom-1', systemName: 'Dune', dossiersConnus });
        expect(raisonLisible(corpus)).toContain('nom affiché');
    });

    it('chaque raison a une phrase, sans jamais retomber sur un mot technique', () => {
        const raisons = [
            resoudreCorpus({ systemId: 'x', systemPath: 'systems/dune', dossiersConnus }),
            resoudreCorpus({ systemId: 'x', corpusId: 'dune', dossiersConnus }),
            resoudreCorpus({ systemId: 'x', ragPath: 'systems/dune/rules', dossiersConnus }),
            resoudreCorpus({ systemId: 'dune', dossiersConnus }),
            resoudreCorpus({ systemId: 'x', systemName: 'Alien', dossiersConnus }),
            resoudreCorpus({ systemId: 'inconnu', dossiersConnus }),
        ].map(raisonLisible);

        for (const phrase of raisons) {
            expect(phrase).not.toContain('-');
            expect(phrase.length).toBeGreaterThan(10);
        }
    });
});
