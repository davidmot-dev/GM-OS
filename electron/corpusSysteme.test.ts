import { describe, it, expect } from 'vitest';
import {
    resoudreCorpus,
    cheminDesFiches,
    cheminDesBrouillons,
    cheminDesPersonas,
    cheminDeLIndex,
    slug,
    memeIdentite,
    normaliseChemin,
    corpusPourNouveauSysteme,
    sousDossiersDuCorpus,
    corpusOrphelins,
    deplierLigatures,
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

    it('range le brouillon sous la même racine, à part des fiches', () => {
        // Un brouillon n'est pas une fiche : il n'a franchi aucune revue, et il
        // est exclu de l'index de l'Oracle par le `.ragignore` de `docs/`.
        expect(cheminDesBrouillons(corpus)).toBe('systems/dune/drafts');
        expect(cheminDesBrouillons(corpus)).not.toBe(cheminDesFiches(corpus));
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

// ─────────────────────────────────────────────────────────────────────────────
// Le corpus d'un système neuf
// ─────────────────────────────────────────────────────────────────────────────

describe('corpus d\'un système neuf', () => {
    /**
     * Ce que ces tests protègent : **la Forge Système cesse de créer des pilotes
     * sans corpus**. Elle fabriquait `custom-${Date.now()}` et rien autour ; la
     * résolution passait sa vie à reboucher ce trou par déduction, et le jour où
     * la déduction échouait — un `catch {}` sur un chemin inexistant — personne
     * n'en savait rien.
     */

    it('rejoint le corpus existant que le nom désigne, au lieu d\'en créer un jumeau', () => {
        // Le slug du nom complet serait `dune-aventures-dans-l-imperium` : un
        // dossier neuf, vide, à côté du corpus réel qui contient les 17 fiches.
        const corpus = corpusPourNouveauSysteme("Dune : Aventures dans l'Imperium", DOSSIERS);

        expect(corpus.id).toBe('dune');
        expect(corpus.racine).toBe('systems/dune');
        expect(corpus.aCreer, 'un corpus rejoint n\'est pas un corpus à créer').toBe(false);
    });

    it('crée un dossier pour un jeu qu\'on documente en premier', () => {
        const corpus = corpusPourNouveauSysteme('Vaesen', DOSSIERS);

        expect(corpus.id).toBe('vaesen');
        expect(corpus.aCreer).toBe(true);
    });

    it('ne rapproche pas deux jeux par un préfixe qui n\'en est pas un', () => {
        // « Alienor » n'est pas « Alien » : sans cette frontière, un jeu neuf
        // hériterait du corpus d'un autre, et le premier document écrit
        // contaminerait un corpus déjà vérifié.
        const corpus = corpusPourNouveauSysteme('Alienor et les Cathares', DOSSIERS);

        expect(corpus.id).not.toBe('alien');
        expect(corpus.aCreer).toBe(true);
    });

    it('sans inventaire, ne prétend pas savoir si le dossier existe', () => {
        /**
         * `ai:list-systems` vit dans le processus principal : sur une
         * application rechargée à chaud, la poignée manque et la liste est vide.
         * Annoncer « dossier neuf » sur cette base serait un mensonge — et
         * `aCreer` déclenche la création. On préfère ne rien affirmer.
         */
        const corpus = corpusPourNouveauSysteme("Dune : Aventures dans l'Imperium", []);

        expect(corpus.aCreer).toBe(false);
    });

    it('donne les trois dossiers qu\'un corpus doit posséder', () => {
        const corpus = corpusPourNouveauSysteme('Vaesen', DOSSIERS);

        expect(sousDossiersDuCorpus(corpus)).toEqual([
            'systems/vaesen/rules',
            'systems/vaesen/index',
            'systems/vaesen/personas',
        ]);
    });

    it('les dossiers créés sont exactement ceux que la lecture ira chercher', () => {
        // C'est le seul contrat qui compte : créer ailleurs que là où on lit
        // est indétectable par construction — ça marche jusqu'au jour où ça
        // écrit à côté.
        const corpus = corpusPourNouveauSysteme('Vaesen', DOSSIERS);
        const crees = sousDossiersDuCorpus(corpus);

        expect(crees).toContain(cheminDesFiches(corpus));
        expect(crees).toContain(cheminDeLIndex(corpus));
        // `gems.json` est un fichier, pas un dossier : il vit dans la racine et
        // c'est `personas/` qui reçoit la fiche de voix.
        expect(cheminDesPersonas(corpus)).toBe('systems/vaesen/gems.json');
    });
});

describe('corpus orphelins', () => {
    /**
     * L'autre moitié du défaut, et la plus silencieuse. Alien a un corpus
     * complet — 17 fichiers, index, huit personas — et aucun pilote : il
     * n'apparaît donc dans aucun sélecteur de système. On ne remarque pas
     * l'absence de ce qu'on n'a jamais listé.
     */

    it('trouve le corpus qu\'aucun système ne réclame', () => {
        const systemes = [
            { systemId: 'custom-1', systemName: "Dune : Aventures dans l'Imperium" },
            { systemId: 'custom-2', systemName: 'Blade Runner' },
        ];
        expect(corpusOrphelins(['alien', 'blade-runner', 'dune'], systemes)).toEqual(['alien']);
    });

    it('reconnaît un corpus réclamé par déclaration autant que par nom', () => {
        // `corpusId` est le chemin voulu ; le nom affiché n'est qu'un repli. Les
        // deux doivent compter, sinon un pilote bien configuré passerait pour
        // absent et on proposerait de créer son doublon.
        const systemes = [
            { systemId: 'custom-1', systemName: 'Un nom qui ne dit rien', corpusId: 'alien' },
            { systemId: 'custom-2', systemName: 'Blade Runner' },
        ];
        expect(corpusOrphelins(['alien', 'blade-runner'], systemes)).toEqual([]);
    });

    it('rend tout le disque quand aucun système n\'est déclaré', () => {
        expect(corpusOrphelins(['alien', 'dune'], [])).toEqual(['alien', 'dune']);
    });

    it('ne rend rien quand le disque est vide ou illisible', () => {
        // Sans inventaire, il n'y a pas d'orphelin : il n'y a pas d'information.
        expect(corpusOrphelins([], [{ systemId: 'custom-1', systemName: 'Dune' }])).toEqual([]);
    });

    it('ne compte pas un pilote sans corpus comme réclamant un dossier réel', () => {
        // Un pilote `custom-<horodatage>` sans nom reconnaissable retombe sur
        // `systems/custom-…`, qui n'est pas un dossier du disque : il ne doit
        // donc dédouaner aucun corpus.
        const systemes = [{ systemId: 'custom-1754832910445', systemName: 'Mon Jeu Maison' }];
        expect(corpusOrphelins(['alien', 'dune'], systemes)).toEqual(['alien', 'dune']);
    });
});

describe('ligatures', () => {
    /**
     * Relevé en réel le 2026-08-10 : la fiche « Manœuvres des Mentats » du
     * corpus Dune s'est écrite dans `man-uvres-des-mentats.md`. `NFD` sépare les
     * accents de leur lettre, mais `œ` n'est pas une lettre accentuée — c'est un
     * caractère à part entière, que NFD laisse intact et que le filtre
     * `[^a-z0-9]` supprime ensuite purement et simplement.
     *
     * Le nom d'un fichier n'a pas à être beau, mais il doit être **retrouvable** :
     * c'est lui que l'atelier compare pour savoir si une fiche existe déjà.
     */
    it('déplie « œ » au lieu de l\'effacer', () => {
        expect(slug('Manœuvres des Mentats')).toBe('manoeuvres-des-mentats');
        expect(deplierLigatures('Cœur')).toBe('Coeur');
    });

    it('déplie « æ » et « ß »', () => {
        expect(slug('Ex æquo')).toBe('ex-aequo');
        expect(deplierLigatures('Straße')).toBe('Strasse');
    });

    it('déplie les ligatures typographiques des PDF', () => {
        // « ﬁ » et « ﬂ » viennent des extractions PDF et cassent la comparaison
        // de titres autant que le « œ » cassait les noms de fichier.
        expect(deplierLigatures('conﬂit')).toBe('conflit');
        expect(deplierLigatures('difﬁculté')).toBe('difficulté');
    });

    it('ne touche pas à ce qui n\'est pas une ligature', () => {
        expect(slug("Dune : Aventures dans l'Imperium")).toBe('dune-aventures-dans-l-imperium');
        expect(deplierLigatures('Blade Runner')).toBe('Blade Runner');
    });
});
