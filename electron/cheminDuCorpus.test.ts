import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { corpusVise, nomDeLaQuarantaine } from './cheminDuCorpus';
import { grouperLeCorpus } from './groupesDuCorpus';
import { parseRagIgnore, isIgnored } from './ragIgnore';

const DOCS = path.resolve('/tmp/gmos-docs');

/**
 * **La barrière d'abord.** Le chemin vient du rendu, et ce qui est au bout n'est
 * pas une écriture de fichier : c'est un déménagement de dossier. Chacun des cas
 * refusés ci-dessous décrit une purge qui aurait emporté autre chose que sa
 * cible.
 */
describe('quel dossier une purge a le droit de toucher', () => {
    it('accepte le corpus d’un système et celui d’une campagne', () => {
        expect(corpusVise(DOCS, 'systems/alien')).toEqual({
            absolu: path.join(DOCS, 'systems', 'alien'),
            relatif: 'systems/alien',
            genre: 'systeme',
        });
        expect(corpusVise(DOCS, 'campaigns/le-secret-de-milo')?.genre).toBe('campagne');
    });

    it('accepte un dossier dont le nom porte des espaces', () => {
        // `reves de dragons` existe sous ce nom : le refuser rendrait son
        // corpus impurgeable, et c'est l'un des plus reforgés.
        expect(corpusVise(DOCS, 'systems/reves de dragons')?.relatif)
            .toBe('systems/reves de dragons');
    });

    it('refuse la racine des systèmes elle-même', () => {
        // Un seul segment : ce serait « tous les jeux », pas « ce jeu ».
        expect(corpusVise(DOCS, 'systems')).toBeNull();
    });

    it('refuse un sous-dossier du corpus', () => {
        // Trois segments. `strictementSous` l'accepterait, et la purge
        // prendrait alors `rules/` pour un corpus entier.
        expect(corpusVise(DOCS, 'systems/alien/rules')).toBeNull();
    });

    it('refuse une racine qui n’est pas un corpus', () => {
        expect(corpusVise(DOCS, 'fiches/Alien')).toBeNull();
        expect(corpusVise(DOCS, 'ui/theme')).toBeNull();
    });

    it('refuse la traversée', () => {
        expect(corpusVise(DOCS, 'systems/..')).toBeNull();
        expect(corpusVise(DOCS, '../systems/alien')).toBeNull();
        expect(corpusVise(DOCS, 'systems/../../secret')).toBeNull();
    });

    it('refuse un nom vide ou impossible sous Windows', () => {
        expect(corpusVise(DOCS, 'systems/')).toBeNull();
        expect(corpusVise(DOCS, 'systems/a:b')).toBeNull();
    });
});

describe('le nom du dossier de quarantaine', () => {
    it('date d’abord, pour que le tri soit chronologique', () => {
        const nom = nomDeLaQuarantaine('Rêves de Dragons', new Date(2026, 8, 18, 22, 14, 7));
        expect(nom).toBe('2026-09-18-221407-reves-de-dragons');
    });

    it('ne rend jamais un nom vide', () => {
        expect(nomDeLaQuarantaine('«»', new Date(2026, 0, 1))).toBe('2026-01-01-000000-sans-nom');
    });
});

/**
 * **Les lots.** Ce qui se refabrique est coché, ce que le meneur a apporté ne
 * l'est pas. Le repli attrape l'inconnu, et il est décoché — *l'inconnu se
 * penche du côté qui ne détruit pas.*
 */
describe('ce qu’un corpus de système contient, rangé en lots', () => {
    const corpus = grouperLeCorpus([
        { chemin: 'rules/degats.md', octets: 100 },
        { chemin: 'rules/panique.md', octets: 200 },
        { chemin: 'personas/la-voix-du-jeu.md', octets: 50 },
        { chemin: 'gems.json', octets: 10 },
        { chemin: 'index/ALIEN_Index.md', octets: 400 },
        { chemin: 'theme/theme.css', octets: 30 },
        { chemin: 'Alien_le_jeu_de_role.pdf', octets: 9000 },
        { chemin: '_source_extracted.txt', octets: 8000 },
    ], 'systeme');

    const lot = (cle: string) => corpus.find(g => g.cle === cle);

    it('coche ce que la Forge refabrique', () => {
        expect(lot('regles')?.fichiers).toEqual(['rules/degats.md', 'rules/panique.md']);
        expect(lot('regles')?.octets).toBe(300);
        expect(lot('regles')?.parDefaut).toBe(true);
        expect(lot('personas')?.parDefaut).toBe(true);
        expect(lot('gemmes')?.parDefaut).toBe(true);
    });

    it('décoche ce que le meneur a apporté', () => {
        // L'index paginé et le thème coûtent des heures et ne se reforgent pas.
        expect(lot('index')?.parDefaut).toBe(false);
        expect(lot('theme')?.parDefaut).toBe(false);
    });

    it('met le manuel source dans un lot à part, décoché', () => {
        const source = lot('source');
        expect(source?.parDefaut).toBe(false);
        expect(source?.fichiers).toEqual(['Alien_le_jeu_de_role.pdf', '_source_extracted.txt']);
    });

    it('ne rend aucun lot vide', () => {
        // Un lot à zéro fichier ferait croire qu'il reste quelque chose à décider.
        expect(grouperLeCorpus([], 'systeme')).toEqual([]);
        expect(corpus.every(g => g.fichiers.length > 0)).toBe(true);
    });

    it('lit le dernier le plus dangereux', () => {
        expect(corpus[corpus.length - 1]?.cle).toBe('source');
    });
});

describe('ce qu’une campagne contient', () => {
    it('range ses fiches et laisse ses notes décochées', () => {
        const corpus = grouperLeCorpus([
            { chemin: 'fiches/le-maire.md', octets: 10 },
            { chemin: 'drafts/le-maire.md', octets: 10 },
            { chemin: 'mes-notes.md', octets: 10 },
        ], 'campagne');

        expect(corpus.find(g => g.cle === 'fiches')?.parDefaut).toBe(true);
        expect(corpus.find(g => g.cle === 'brouillons')?.parDefaut).toBe(true);
        expect(corpus.find(g => g.cle === 'source')?.parDefaut).toBe(false);
    });

    it('ne prend pas un FICHIER nommé comme un dossier de lot', () => {
        // `fiches` sans barre oblique est un fichier à la racine, pas le dossier
        // des fiches forgées. Le confondre cocherait d'avance un document du
        // meneur.
        const corpus = grouperLeCorpus([{ chemin: 'fiches', octets: 1 }], 'campagne');
        expect(corpus).toHaveLength(1);
        expect(corpus[0].cle).toBe('source');
    });
});

/**
 * ⛔ **La quarantaine vit sous `docs/`, donc l'Oracle la verrait.**
 *
 * Une fiche « effacée » qui continue d'être citée serait pire que la pollution
 * qu'on vient corriger : on aurait déplacé le problème, littéralement. D'où le
 * `.ragignore` posé à la racine des purges **avant** le premier déplacement.
 *
 * ⚠️ **Cette garantie a été affirmée avant d'être éprouvée**, et pendant une
 * journée elle n'a reposé que sur une lecture de la grammaire des motifs. Elle
 * est vérifiée ici sur les **vrais chemins** qu'a produits la première purge
 * réelle, le 2026-09-18 à 19 h 22 : 21 fiches de « Hadley Hope ».
 */
describe('le .ragignore de la quarantaine', () => {
    /** Exactement ce qu'écrit `purgeDesCorpus` à la racine des purges. */
    const portee = [{ base: '_purges', rules: parseRagIgnore([
        "# Ce qui est ici a été retiré d'un corpus : l'Oracle ne doit plus le citer.",
        '# Les fichiers restent lisibles et déplaçables à la main.',
        '**',
        '',
    ].join('\n')) }];

    it('exclut tout ce qui est rangé dessous, à n’importe quelle profondeur', () => {
        const vrais = [
            '_purges/2026-09-18-192245-hadley-hope/campaigns/hadley-hope/fiches/pitch-et-ton.md',
            '_purges/2026-09-18-192245-hadley-hope/campaigns/hadley-hope/fiches/lieux-majeurs.md',
            '_purges/2026-09-18-192245-hadley-hope/systems/alien/rules/degats.md',
            '_purges/quelque-chose-a-la-racine.md',
        ];
        for (const chemin of vrais) {
            expect(isIgnored(chemin, portee), chemin).not.toBeNull();
        }
    });

    it('et ne touche à RIEN en dehors', () => {
        // La garde ne vaut que si elle s'arrête à la porte : un `.ragignore` qui
        // déborderait éteindrait l'Oracle sur le corpus vivant.
        expect(isIgnored('campaigns/anges-de-feu/fiches/pitch.md', portee)).toBeNull();
        expect(isIgnored('systems/alien/rules/degats.md', portee)).toBeNull();
        expect(isIgnored('_purgestion/faux-ami.md', portee)).toBeNull();
    });
});
