import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { isIgnored, parseRagIgnore, RAGIGNORE_FILENAME, type IgnoreScope } from './ragIgnore';
import {
    MAX_CONTEXT_TOKENS,
    MAX_RAW_FILE_TOKENS,
    estimateTokens,
    selectContext,
    type IndexedFile,
} from './ragSelection';

/**
 * Ce que ces tests protègent, dans l'ordre où le défaut s'est produit :
 *
 * 1. Le périmètre — avant réparation, les clauses `includes('systems')` et
 *    `('campaigns')` laissaient passer les 83 fichiers de `docs/`, donc la
 *    sélection était identique pour toutes les campagnes. En séance Dune,
 *    l'Oracle recevait des décharges Alien et zéro Dune.
 * 2. Le rang — les fiches du corpus vivent dans `rules/`, que l'ancien
 *    `.slice(0, 15)` sur l'ordre alphabétique du disque n'atteignait jamais.
 * 3. Le budget — ~93 000 tokens étaient envoyés pour un `num_ctx` de 16 384.
 */

function fiche(p: string, sujet: string, content = 'contenu de fiche'): IndexedFile {
    return { path: p, sujet, titre: sujet, content };
}

function brut(p: string, content = 'contenu brut'): IndexedFile {
    return { path: p, content };
}

const REQ = { systemId: 'alien', campaignName: 'Anges de Feu' };

describe('périmètre', () => {
    it('écarte les documents d\'un autre système', () => {
        const s = selectContext([
            fiche('systems/alien/rules/resolution-des-jets.md', 'Résolution des jets'),
            fiche('systems/blade-runner/rules/resolution-des-jets.md', 'Résolution des jets'),
        ], REQ);

        expect(s.retenus.map(r => r.path)).toEqual(['systems/alien/rules/resolution-des-jets.md']);
        expect(s.ecartes).toContainEqual({
            path: 'systems/blade-runner/rules/resolution-des-jets.md',
            raison: 'hors-perimetre',
        });
    });

    it('écarte les campagnes d\'un autre jeu', () => {
        // Le cas réel : en séance Alien, l'Oracle recevait Trinité Fatale (CoC)
        // et la Vallée du Vent Glacé (D&D).
        const s = selectContext([
            brut('campaigns/COC/Trinite Fatale.txt'),
            brut('campaigns/dnd/vallee-du-vent-glace/campaign-context.md'),
        ], REQ);

        expect(s.retenus).toHaveLength(0);
    });

    it('retient le fonds commun quel que soit le système', () => {
        const s = selectContext([brut('commun/regles-maison.md')], REQ);
        expect(s.retenus.map(r => r.provenance)).toEqual(['commun']);
    });

    it('retrouve un dossier dont le nom diffère par la casse et les accents', () => {
        const s = selectContext(
            [fiche('systems/reves de dragons/rules/gestion-fatigue.md', 'Fatigue')],
            { systemId: 'reves-de-dragons', campaignName: 'x' },
        );
        expect(s.retenus).toHaveLength(1);
    });

    it('accepte le nom affiché à défaut de l\'identifiant', () => {
        const s = selectContext(
            [fiche('systems/blade-runner/rules/sante.md', 'Santé')],
            { systemId: 'br-2049', campaignName: 'x', systemName: 'Blade Runner' },
        );
        expect(s.retenus).toHaveLength(1);
    });

    it('ne confond pas deux systèmes de préfixe commun', () => {
        // `includes` libre — le défaut d'origine — faisait matcher n'importe quoi.
        const s = selectContext(
            [fiche('systems/alien-rpg-2e/rules/x.md', 'X'), fiche('systems/alienor/rules/y.md', 'Y')],
            REQ,
        );
        // `alien-rpg-2e` partage la frontière de segment, `alienor` non.
        expect(s.retenus.map(r => r.path)).toEqual(['systems/alien-rpg-2e/rules/x.md']);
    });
});

describe('chemins déclarés sur la fiche de campagne', () => {
    it('rattache une campagne dont le dossier ne porte pas son nom', () => {
        // « Agents de Dune » sur disque : campaigns/dune/Agents_of_Dune.md.
        const entrees = [brut('campaigns/dune/Agents_of_Dune.md')];
        const req = { systemId: 'dune', campaignName: 'Agents de Dune' };

        expect(selectContext(entrees, req).retenus).toHaveLength(0);
        expect(selectContext(entrees, { ...req, campaignPath: 'campaigns/dune' }).retenus).toHaveLength(1);
    });

    it('accepte les antislashs et les barres superflues', () => {
        const s = selectContext([brut('campaigns/dune/notes.md')], {
            ...REQ, campaignPath: '\\campaigns\\dune\\',
        });
        expect(s.retenus).toHaveLength(1);
    });

    it('signale une campagne sans document plutôt que de se taire', () => {
        const s = selectContext([fiche('systems/alien/rules/x.md', 'X')], REQ);
        expect(s.avertissements.join(' ')).toContain('Chemin des Notes');
    });

    it('ne signale rien quand le chemin est renseigné', () => {
        const s = selectContext([brut('campaigns/dune/notes.md')], {
            ...REQ, campaignPath: 'campaigns/dune',
        });
        expect(s.avertissements).toEqual([]);
    });
});

describe('rang', () => {
    it('fait passer une fiche du corpus devant un extrait brut du même système', () => {
        const s = selectContext([
            brut('systems/alien/core_mechanics.md'),
            fiche('systems/alien/rules/resolution-des-jets.md', 'Résolution des jets'),
        ], REQ);

        expect(s.retenus[0].path).toBe('systems/alien/rules/resolution-des-jets.md');
        expect(s.retenus[0].provenance).toBe('fiche');
    });

    it('ne compte pas comme fiche un document sans frontmatter sujet', () => {
        // `guide-synthese-regles-alien.md` est un artefact v1, sans frontmatter
        // et truffé d'index internes NotebookLM : il ne doit pas primer.
        const s = selectContext([brut('systems/alien/rules/guide-synthese-regles-alien.md')], REQ);
        expect(s.retenus[0].provenance).toBe('systeme');
    });

    it('trie les fiches d\'un même rang par la question posée', () => {
        const s = selectContext([
            fiche('systems/alien/rules/initiative-et-tour.md', 'Initiative et tour'),
            fiche('systems/alien/rules/sante-et-blessures.md', 'Santé et blessures'),
            fiche('systems/alien/rules/resolution-des-jets.md', 'Résolution des jets'),
        ], { ...REQ, query: 'comment se résolvent les jets de dés ?' });

        expect(s.retenus[0].path).toBe('systems/alien/rules/resolution-des-jets.md');
    });

    it('sans question, reste déterministe', () => {
        const entrees = [
            fiche('systems/alien/rules/b.md', 'B'),
            fiche('systems/alien/rules/a.md', 'A'),
        ];
        // Un contexte qui change d'un appel à l'autre invalide le KV-cache.
        expect(selectContext(entrees, REQ).context).toBe(selectContext(entrees, REQ).context);
        expect(selectContext(entrees, REQ).retenus[0].path).toBe('systems/alien/rules/a.md');
    });

    it('ne laisse pas la question renverser l\'écart entre rangs', () => {
        const s = selectContext([
            brut('systems/alien/core_mechanics.md', 'jets dés réserve stress panique difficulté'),
            fiche('systems/alien/rules/initiative-et-tour.md', 'Initiative et tour'),
        ], { ...REQ, query: 'jets dés réserve stress panique difficulté' });

        expect(s.retenus[0].provenance).toBe('fiche');
    });
});

describe('budget', () => {
    const gros = (p: string, tokens: number, sujet?: string) => {
        const contenu = 'x'.repeat(Math.ceil(tokens * 3.5));
        return sujet ? fiche(p, sujet, contenu) : brut(p, contenu);
    };

    it('tient le plafond global', () => {
        const s = selectContext(
            Array.from({ length: 20 }, (_, i) => gros(`systems/alien/brut-${i}.md`, 1000)),
            REQ,
        );
        expect(s.totalTokens).toBeLessThanOrEqual(MAX_CONTEXT_TOKENS);
        expect(s.ecartes.some(e => e.raison === 'budget')).toBe(true);
    });

    it('empêche une décharge d\'avaler le budget à elle seule', () => {
        const s = selectContext([gros('systems/alien/_source.txt', 14_000)], REQ);
        expect(s.retenus[0].tronque).toBe(true);
        expect(s.retenus[0].tokens).toBeLessThanOrEqual(MAX_RAW_FILE_TOKENS);
    });

    it('laisse passer une fiche entière, même au-dessus du plafond par fichier', () => {
        // Le plafond par fichier ne vise que les décharges.
        const s = selectContext([gros('systems/alien/rules/x.md', 2_300, 'Dégâts')], REQ);
        expect(s.retenus[0].tronque).toBe(false);
        expect(s.retenus[0].tokens).toBeGreaterThan(MAX_RAW_FILE_TOKENS);
    });

    it('ne tronque jamais une fiche : elle passe entière ou cède la place', () => {
        const s = selectContext([
            gros('systems/alien/rules/a.md', 3_500, 'Dégâts'),
            gros('systems/alien/rules/b.md', 3_000, 'Santé'),
            gros('systems/alien/rules/c.md', 400, 'Portées'),
        ], REQ);

        expect(s.retenus.some(r => r.tronque)).toBe(false);
        // La première tient ; la deuxième non et cède la place à la troisième.
        expect(s.retenus.map(r => r.path)).toEqual([
            'systems/alien/rules/a.md',
            'systems/alien/rules/c.md',
        ]);
        expect(s.ecartes).toContainEqual({ path: 'systems/alien/rules/b.md', raison: 'budget' });
    });

    it('respecte un plafond passé en argument', () => {
        const s = selectContext([gros('systems/alien/a.md', 900), gros('systems/alien/b.md', 900)], {
            ...REQ, maxTokens: 1000,
        });
        expect(s.totalTokens).toBeLessThanOrEqual(1000);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Non-régression sur le corpus réel (point 7 de l'axe B)
// ─────────────────────────────────────────────────────────────────────────────

const DOCS = path.join(__dirname, '..', 'docs');

/** Reproduit `RAGEngine.getAllFiles` : marche du disque honorant les `.ragignore`. */
function indexer(): IndexedFile[] {
    const out: IndexedFile[] = [];

    const marcher = (dir: string, scopes: IgnoreScope[]) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        let portees = scopes;
        if (entries.some(e => e.isFile() && e.name === RAGIGNORE_FILENAME)) {
            const base = path.relative(DOCS, dir).replace(/\\/g, '/');
            const contenu = fs.readFileSync(path.join(dir, RAGIGNORE_FILENAME), 'utf-8');
            portees = [...scopes, { base, rules: parseRagIgnore(contenu) }];
        }

        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            const rel = path.relative(DOCS, full).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                if (!isIgnored(rel, portees, true)) marcher(full, portees);
                continue;
            }
            const ext = path.extname(entry.name).toLowerCase();
            if (!['.md', '.txt', '.jsonl'].includes(ext)) continue; // PDF hors test : pas de parseur ici
            if (isIgnored(rel, portees, false)) continue;

            const content = fs.readFileSync(full, 'utf-8');
            const sujet = /^---\r?\n[\s\S]*?^sujet\s*:\s*(.+)$/m.exec(content.slice(0, 2000));
            out.push({ path: rel, content, sujet: sujet?.[1].trim() });
        }
    };

    marcher(DOCS, []);
    return out;
}

describe('corpus réel', () => {
    const index = indexer();

    it('exclut les quatre copies du livre ALIEN', () => {
        const chemins = index.map(f => f.path);
        for (const decharge of [
            'systems/alien/_source_extracted.txt',
            'systems/alien/full_book_by_pdf_page.md',
            'systems/alien/Alien_le_jeu_de_rôle.txt',
            'systems/alien/alien_rag_base_partial.md',
        ]) {
            expect(chemins, `${decharge} devrait être exclu de l'index`).not.toContain(decharge);
        }
    });

    it('garde les fiches d\'Alien et ne compte pas le guide v1 parmi elles', () => {
        const rules = index.filter(f => f.path.startsWith('systems/alien/rules/'));
        const fiches = rules.filter(f => f.sujet);

        // 18 fichiers dans `rules/`, mais 17 fiches : `guide-synthese-regles-alien.md`
        // est un artefact v1, sans frontmatter et citant des index internes
        // NotebookLM au lieu des pages. Le plan comptait 18 — il comptait le guide.
        expect(rules.length).toBe(18);
        expect(fiches.length).toBe(17);
        expect(rules.filter(f => !f.sujet).map(f => f.path))
            .toEqual(['systems/alien/rules/guide-synthese-regles-alien.md']);
    });

    it.each(['alien', 'blade-runner', 'noc', 'reves de dragons'])(
        '« %s » : le contexte tient sous le plafond et ne contient que ce système',
        (systemId) => {
            const s = selectContext(index, { systemId, campaignName: 'sans campagne' });

            expect(s.totalTokens).toBeLessThanOrEqual(MAX_CONTEXT_TOKENS);
            expect(s.retenus.length).toBeGreaterThan(0);

            for (const r of s.retenus) {
                if (r.provenance === 'commun') continue;
                expect(r.path.toLowerCase(), 'un document étranger au système actif est passé')
                    .toContain(systemId.toLowerCase());
            }
        },
    );

    it.each(['alien', 'blade-runner'])(
        '« %s » : une question de règle ramène des fiches du corpus',
        (systemId) => {
            const s = selectContext(index, {
                systemId,
                campaignName: 'sans campagne',
                query: 'combien de dés je lance pour un jet de compétence ?',
            });
            // Le défaut d'origine : zéro fiche sur quinze fichiers envoyés.
            expect(s.retenus.filter(r => r.provenance === 'fiche').length).toBeGreaterThan(0);
            expect(s.retenus[0].provenance).toBe('fiche');
        },
    );

    it('divise par plus de dix le contexte envoyé', () => {
        // Mesuré au 2026-08-09 sur le docs/ réel : l'ancien filtre envoyait
        // ~93 000 tokens (15 fichiers pris dans l'ordre alphabétique).
        const s = selectContext(index, { systemId: 'alien', campaignName: 'Anges de Feu' });
        expect(estimateTokens(s.context)).toBeLessThan(93_000 / 10);
    });
});
