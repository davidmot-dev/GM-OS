import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { isIgnored, parseRagIgnore, type IgnoreScope } from './ragIgnore';

/**
 * `.ragignore` retire des documents de l'index de l'Oracle sans les retirer
 * du disque ni de l'application. Ces tests verrouillent la sémantique des
 * motifs, parce qu'une exclusion trop large est silencieuse par nature : un
 * document absent du prompt ne produit aucun message.
 */

function scope(base: string, contenu: string): IgnoreScope {
    return { base, rules: parseRagIgnore(contenu) };
}

describe('parseRagIgnore', () => {
    it('ignore les lignes vides et les commentaires', () => {
        expect(parseRagIgnore('# commentaire\n\n   \nfoo.md')).toHaveLength(1);
    });

    it('reconnaît la négation et le suffixe de dossier', () => {
        const [exclusion, reprise, dossier] = parseRagIgnore('*.md\n!garder.md\nraw/');
        expect(exclusion.negated).toBe(false);
        expect(reprise.negated).toBe(true);
        expect(dossier.dirOnly).toBe(true);
    });
});

describe('isIgnored', () => {
    const scopes = [scope('systems/alien', '_source_extracted.txt\n*.pdf\nraw/')];

    it('exclut un fichier nommé explicitement', () => {
        expect(isIgnored('systems/alien/_source_extracted.txt', scopes)).not.toBeNull();
    });

    it('laisse passer ce qui n\'est pas visé', () => {
        expect(isIgnored('systems/alien/rules/resolution-des-jets.md', scopes)).toBeNull();
    });

    it('ne déborde pas sur un autre système', () => {
        // La portée d'un `.ragignore` s'arrête à son sous-arbre.
        expect(isIgnored('systems/dune/_source_extracted.txt', scopes)).toBeNull();
    });

    it('applique un joker sans traverser les dossiers', () => {
        expect(isIgnored('systems/alien/livre.pdf', scopes)).not.toBeNull();
        // `*.pdf` sans '/' vise le nom de base à toute profondeur.
        expect(isIgnored('systems/alien/rules/annexe.pdf', scopes)).not.toBeNull();
    });

    it('n\'applique un motif de dossier qu\'aux dossiers', () => {
        expect(isIgnored('systems/alien/raw', scopes, true)).not.toBeNull();
        expect(isIgnored('systems/alien/raw', scopes, false)).toBeNull();
    });

    it('exclut ce qui est sous un dossier exclu', () => {
        expect(isIgnored('systems/alien/raw/page-12.md', scopes)).not.toBeNull();
    });

    it('ancre un motif qui contient une barre', () => {
        const ancre = [scope('campaigns/coc7', 'Aux Portes/scenario.pdf')];
        expect(isIgnored('campaigns/coc7/Aux Portes/scenario.pdf', ancre)).not.toBeNull();
        expect(isIgnored('campaigns/coc7/ailleurs/scenario.pdf', ancre)).toBeNull();
    });

    it('laisse la dernière règle applicable l\'emporter', () => {
        const reprise = [scope('systems/alien', '*.md\n!rules/resolution-des-jets.md')];
        expect(isIgnored('systems/alien/brut.md', reprise)).not.toBeNull();
        expect(isIgnored('systems/alien/rules/resolution-des-jets.md', reprise)).toBeNull();
    });

    it('donne le dernier mot au fichier le plus profond', () => {
        // Un `.ragignore` de sous-dossier doit pouvoir rattraper une exclusion
        // écrite à la racine, quel que soit l'ordre de découverte.
        const empiles = [
            scope('systems/alien/rules', '!*.md'),
            scope('systems/alien', '*.md'),
        ];
        expect(isIgnored('systems/alien/rules/resolution-des-jets.md', empiles)).toBeNull();
        expect(isIgnored('systems/alien/brut.md', empiles)).not.toBeNull();
    });

    it('est insensible à la casse, comme le système de fichiers', () => {
        const casse = [scope('systems/alien', 'Alien_Le_Jeu.txt')];
        expect(isIgnored('systems/alien/alien_le_jeu.txt', casse)).not.toBeNull();
    });
});

describe('brouillons de la Forge', () => {
    /**
     * Une fiche revenue du carnet s'écrit dans `drafts/` avant toute revue, pour
     * qu'une génération d'une à deux minutes ne soit jamais perdue. Elle n'a
     * donc franchi aucun contrôle : la citer en séance donnerait autorité à ce
     * qui n'en a pas encore, exactement ce que la revue avant écriture empêche.
     */
    const portees = () => [{
        base: '',
        rules: parseRagIgnore(
            fs.readFileSync(path.join(__dirname, '..', 'docs', '.ragignore'), 'utf-8'),
        ),
    }];

    it('exclut les brouillons de tous les systèmes', () => {
        expect(isIgnored('systems/dune/drafts', portees(), true)).not.toBeNull();
        expect(isIgnored('systems/dune/drafts/poursuites.md', portees(), false)).not.toBeNull();
        expect(isIgnored('systems/alien/drafts/sante-et-blessures.md', portees(), false)).not.toBeNull();
    });

    it('laisse passer les fiches publiées', () => {
        expect(isIgnored('systems/dune/rules/poursuites.md', portees(), false)).toBeNull();
    });
});

describe('archive du corpus v1 de Dune', () => {
    /**
     * Le corpus v1 est archivé dans `rules-v1/` en attendant sa régénération.
     * Il ne peut pas rester dans l'index : la v1 nomme `fiche-poursuites.md`
     * là où la v3 nomme `poursuites.md`, donc **aucune fiche v1 ne sera
     * écrasée** — les deux versions se retrouveraient côte à côte, et l'Oracle
     * aurait deux fiches par sujet en concurrence, l'ancienne citant des pages
     * qui n'existent pas dans le livre.
     *
     * Ce test lit le `.ragignore` réel. Sans lui, une réécriture du fichier
     * ferait rentrer l'archive dans l'index **sans le moindre message** : c'est
     * exactement le mode de défaillance que ce module est censé prévenir.
     */
    const DUNE = 'systems/dune';
    const portees = () => [{
        base: DUNE,
        rules: parseRagIgnore(
            fs.readFileSync(path.join(__dirname, '..', 'docs', DUNE, '.ragignore'), 'utf-8'),
        ),
    }];

    it('exclut le dossier d\'archive et ce qu\'il contient', () => {
        expect(isIgnored(`${DUNE}/rules-v1`, portees(), true)).not.toBeNull();
        expect(isIgnored(`${DUNE}/rules-v1/fiche-poursuites.md`, portees(), false)).not.toBeNull();
    });

    it('laisse passer les fiches v3 à venir et l\'index du livre', () => {
        // Une exclusion trop large se paierait par un corpus régénéré invisible.
        expect(isIgnored(`${DUNE}/rules/poursuites.md`, portees(), false)).toBeNull();
        expect(isIgnored(`${DUNE}/index/Dune_Index.md`, portees(), false)).toBeNull();
    });

    it('l\'archive est bien là où le .ragignore la croit', () => {
        const archive = path.join(__dirname, '..', 'docs', DUNE, 'rules-v1');
        expect(fs.existsSync(archive)).toBe(true);
        expect(fs.readdirSync(archive).filter(n => n.endsWith('.md')).length).toBe(18);
    });
});
