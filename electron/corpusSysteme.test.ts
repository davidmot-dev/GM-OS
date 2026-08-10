import { describe, it, expect } from 'vitest';
import {
    resoudreCorpus,
    cheminDesFiches,
    cheminDesPersonas,
    cheminDeLIndex,
    slug,
    memeIdentite,
    normaliseChemin,
} from './corpusSysteme';

/** Les dossiers réellement présents sous `docs/systems/` au 2026-08-10. */
const DOSSIERS = [
    'alien', 'blade-runner', 'coc7', 'cthulhu hack',
    'dnd-5e', 'dune', 'nephilim', 'noc', 'reves de dragons',
];

describe('slug et memeIdentite', () => {
    it('réduit un nom affiché à une clé comparable', () => {
        expect(slug("Dune : Aventures dans l'Imperium")).toBe('dune-aventures-dans-l-imperium');
        expect(slug('Cthulhu Hack')).toBe('cthulhu-hack');
    });

    it('rapproche par préfixe suivi d\'une frontière, jamais par inclusion libre', () => {
        expect(memeIdentite('dune', 'dune-aventures-dans-l-imperium')).toBe(true);
        expect(memeIdentite('dnd', 'dnd-5e')).toBe(true);
        // Sans la frontière, « noc » attraperait « nocturne » et tout le reste.
        expect(memeIdentite('noc', 'nocturne')).toBe(false);
        expect(memeIdentite('alien', 'blade-runner')).toBe(false);
    });
});

describe('normaliseChemin', () => {
    it('unifie les séparateurs et retire le docs/ de tête', () => {
        expect(normaliseChemin('\\Systems\\Dune\\')).toBe('systems/dune');
        expect(normaliseChemin('docs/systems/dune')).toBe('systems/dune');
    });
});

describe('resoudreCorpus', () => {
    it('le « Chemin des Règles » de la campagne l\'emporte sur tout', () => {
        // Déclaré à la main, donc souverain — c'est déjà la règle côté lecture.
        const corpus = resoudreCorpus({
            systemId: 'custom-1754832910445',
            systemName: 'Dune : Aventures dans l\'Imperium',
            systemPath: 'systems/dune',
            corpusId: 'autre-chose',
            dossiersConnus: DOSSIERS,
        });
        expect(corpus.racine).toBe('systems/dune');
        expect(corpus.raison).toBe('chemin-de-campagne');
        expect(corpus.aCreer).toBe(false);
    });

    it('signale la contradiction entre chemin declare et nom du systeme', () => {
        /**
         * Le cas reel du 2026-08-10 : « Chemin des Regles » a `systems/blade-runner`
         * sur une campagne dont le pilote s'appelle « Dune : Aventures dans
         * l'Imperium ». Le declare l'emporte — il est explicite — mais treize
         * fiches Dune partiraient dans le corpus d'un autre jeu sans un mot.
         */
        const corpus = resoudreCorpus({
            systemId: 'custom-1',
            systemName: "Dune : Aventures dans l'Imperium",
            systemPath: 'systems/blade-runner',
            dossiersConnus: DOSSIERS,
        });
        expect(corpus.racine).toBe('systems/blade-runner');
        expect(corpus.contradiction).toBe('dune');
    });

    it('ne crie pas a la contradiction quand tout concorde', () => {
        const corpus = resoudreCorpus({
            systemId: 'custom-1',
            systemName: "Dune : Aventures dans l'Imperium",
            systemPath: 'systems/dune',
            dossiersConnus: DOSSIERS,
        });
        expect(corpus.contradiction).toBeUndefined();
    });

    it('se tait quand le nom ne designe aucun dossier reel', () => {
        // Un systeme inedit n'a rien a contredire.
        const corpus = resoudreCorpus({
            systemId: 'custom-1',
            systemName: 'Mon Jeu Maison',
            systemPath: 'systems/maison',
            dossiersConnus: DOSSIERS,
        });
        expect(corpus.contradiction).toBeUndefined();
    });

    it('retient ensuite le corpus déclaré par le pilote', () => {
        const corpus = resoudreCorpus({
            systemId: 'custom-1', corpusId: 'dune', dossiersConnus: DOSSIERS,
        });
        expect(corpus.racine).toBe('systems/dune');
        expect(corpus.raison).toBe('corpus-declare');
    });

    it('déduit la racine d\'un ragPath hérité, qui vise les fiches', () => {
        const corpus = resoudreCorpus({
            systemId: 'custom-1', ragPath: 'systems/dune/rules', dossiersConnus: DOSSIERS,
        });
        expect(corpus.racine).toBe('systems/dune');
        expect(corpus.raison).toBe('chemin-rag-herite');
    });

    it('traite un ragPath non conforme comme une racine, faute de mieux', () => {
        /**
         * `ragPath` était documenté comme visant `<racine>/rules`. Une valeur qui
         * ne finit pas par `/rules` ne décrit plus une racine de corpus : l'index
         * et les personas n'y sont de toute façon pas. On la prend pour racine —
         * c'est la lecture la moins surprenante — et c'est une raison de plus de
         * migrer vers `corpusId`.
         */
        const corpus = resoudreCorpus({ systemId: 'x', ragPath: 'systems/maison/regles' });
        expect(corpus.racine).toBe('systems/maison/regles');
        expect(cheminDesFiches(corpus)).toBe('systems/maison/regles/rules');
    });

    it('retient l\'identifiant quand il nomme un dossier réel', () => {
        const corpus = resoudreCorpus({ systemId: 'alien', dossiersConnus: DOSSIERS });
        expect(corpus.racine).toBe('systems/alien');
        expect(corpus.raison).toBe('identifiant');
    });

    it('rattrape par le nom affiché — le cas réel de Dune', () => {
        /**
         * La Forge fabrique les identifiants avec `custom-${Date.now()}` : le nom
         * du pilote n'y laisse aucune trace. La lecture retrouvait déjà le bon
         * dossier par ce repli ; c'est son absence côté écriture qui a laissé les
         * personas de Dune inertes depuis leur création.
         */
        const corpus = resoudreCorpus({
            systemId: 'custom-1754832910445',
            systemName: "Dune : Aventures dans l'Imperium",
            dossiersConnus: DOSSIERS,
        });
        expect(corpus.racine).toBe('systems/dune');
        expect(corpus.id).toBe('dune');
        expect(corpus.raison).toBe('nom-affiche');
        expect(corpus.aCreer).toBe(false);
    });

    it('rattrape un dossier dont le nom porte des espaces', () => {
        const corpus = resoudreCorpus({
            systemId: 'custom-2', systemName: 'Cthulhu Hack', dossiersConnus: DOSSIERS,
        });
        expect(corpus.racine).toBe('systems/cthulhu hack');
        expect(corpus.raison).toBe('nom-affiche');
    });

    it('annonce un dossier à créer plutôt que d\'échouer', () => {
        // Il faut toujours un endroit où écrire ; ce qui compte est de le dire.
        const corpus = resoudreCorpus({
            systemId: 'custom-3', systemName: 'Mon Jeu Maison', dossiersConnus: DOSSIERS,
        });
        expect(corpus.racine).toBe('systems/custom-3');
        expect(corpus.raison).toBe('defaut');
        expect(corpus.aCreer).toBe(true);
    });

    it('ne prétend pas savoir ce qui existe quand la liste est absente', () => {
        // Sans inventaire des dossiers, `aCreer` serait une affirmation gratuite.
        const corpus = resoudreCorpus({ systemId: 'dune' });
        expect(corpus.racine).toBe('systems/dune');
        expect(corpus.aCreer).toBe(false);
    });

    it('ne rapproche pas deux systèmes différents par accident', () => {
        const corpus = resoudreCorpus({
            systemId: 'custom-4', systemName: 'Alienor et les Cathares', dossiersConnus: DOSSIERS,
        });
        // « alienor » n'est pas « alien » : la frontière de préfixe l'interdit.
        expect(corpus.raison).toBe('defaut');
    });

    it('tolère un chemin déclaré avec antislashs ou barre finale', () => {
        const corpus = resoudreCorpus({ systemId: 'x', systemPath: '\\systems\\dune\\' });
        expect(corpus.racine).toBe('systems/dune');
        expect(corpus.id).toBe('dune');
    });
});

describe('chemins dérivés', () => {
    const corpus = resoudreCorpus({
        systemId: 'custom-1', systemName: "Dune : Aventures dans l'Imperium", dossiersConnus: DOSSIERS,
    });

    it('range les trois artefacts sous la même racine', () => {
        // C'est tout l'enjeu : les fiches, les personas et l'index doivent
        // tomber dans le même dossier, sinon le résolveur cherche un index
        // qui n'est pas là et l'Oracle lit des personas qui n'existent pas.
        expect(cheminDesFiches(corpus)).toBe('systems/dune/rules');
        expect(cheminDesPersonas(corpus)).toBe('systems/dune/gems.json');
        expect(cheminDeLIndex(corpus)).toBe('systems/dune/index');
    });

    it('vise le chemin exact que lit AIService', () => {
        expect(cheminDesPersonas(corpus)).toBe(`systems/${corpus.id}/gems.json`);
    });
});
