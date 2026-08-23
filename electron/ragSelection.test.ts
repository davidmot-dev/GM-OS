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
        /*
          **Les deux documents doivent passer le seuil de pertinence**, sinon le
          test ne mesure plus ce qu'il croit. Sa version d'origine opposait une
          décharge truffée des mots de la question à une fiche « Initiative et
          tour » qui n'en portait **aucun** : depuis le 2026-08-23, cette fiche
          n'est plus candidate du tout, et le test tombait en annonçant un
          renversement de rang qui n'avait pas eu lieu. *Une fixture qui cesse
          d'illustrer son invariant accuse le mauvais coupable.*

          Ici la fiche porte un mot dans son CORPS et la décharge les porte tous :
          l'écart de rang — 100 contre 40 — reste hors d'atteinte, et c'est tout
          ce qu'on veut prouver.
        */
        const s = selectContext([
            brut('systems/alien/core_mechanics.md', 'jets dés réserve stress panique difficulté'),
            fiche('systems/alien/rules/initiative-et-tour.md', 'Initiative et tour', 'le tour et les jets'),
        ], { ...REQ, query: 'jets dés réserve stress panique difficulté' });

        expect(s.retenus[0].provenance).toBe('fiche');
    });

    it('écarte un document sans un seul mot de la question', () => {
        /*
          **Le seuil de pertinence, mesuré le 2026-08-23.** Sans lui, tout
          document du périmètre devenait candidat et le budget seul tranchait :
          une fiche sans aucun rapport occupait ses 1 450 tokens comme une autre.
          C'est aussi ce qui rendait l'état `rien` inatteignable — il y avait
          toujours au moins une source.
        */
        const s = selectContext([
            fiche('systems/alien/rules/stress.md', 'Stress et panique', 'la jauge de stress monte'),
            fiche('systems/alien/rules/vaisseaux.md', 'Vaisseaux', 'coques et moteurs'),
        ], { ...REQ, query: 'comment fonctionne le stress ?' });

        expect(s.retenus.map(r => r.path)).toEqual(['systems/alien/rules/stress.md']);
        expect(s.ecartes).toContainEqual({ path: 'systems/alien/rules/vaisseaux.md', raison: 'hors-sujet' });
    });

    it('ne juge personne hors sujet quand la question n\'a aucun mot porteur', () => {
        /*
          **La garde du seuil.** « Comment fait-on ? » ne laisse que des mots
          sans portée — `comment` et `fait` sont dans la liste, `on` est trop
          court : le bonus vaut alors zéro pour tout le monde, et appliquer
          le seuil viderait la sélection au lieu de la trier. *Une liste vide
          dirait qu'on a cherché et rien trouvé, alors qu'on n'a pas su chercher.*
        */
        const s = selectContext([
            fiche('systems/alien/rules/stress.md', 'Stress et panique'),
            fiche('systems/alien/rules/vaisseaux.md', 'Vaisseaux'),
        ], { ...REQ, query: 'comment fait-on ?' });

        expect(s.retenus).toHaveLength(2);
        expect(s.ecartes.some(e => e.raison === 'hors-sujet')).toBe(false);
    });

    it('compte les mots ACCENTUÉS du corps, qui étaient invisibles', () => {
        /*
          **Le défaut du 2026-08-23, et il coûtait cher.** `motsDeRecherche`
          déplie la question par `slug` — « réussite » devient `reussite` — mais
          le corps n'était que passé en minuscules. `corps.includes('reussite')`
          ne trouvait donc jamais « réussite ». Le mot est employé vingt-trois
          fois dans une seule fiche de Rêves de Dragons et le moteur en voyait
          zéro ; il est invisible dans treize des vingt-et-une fiches.

          **Dégradation à l'identique du code d'origine** : remettre
          `file.content.toLowerCase()` fait tomber ce test, et lui seul.
        */
        const s = selectContext([
            fiche('systems/alien/rules/a.md', 'Alpha', 'la réussite se mesure ici'),
        ], { ...REQ, query: 'comment juger une réussite ?' });

        expect(s.retenus).toHaveLength(1);
    });

    it('ne prend pas un mot pour un autre dont il est le début', () => {
        /*
          **La comparaison portait sur des sous-chaînes** : `includes('jets')`
          répondait vrai pour « objets ». Même défaut que la recherche dans le
          livre, payé le 2026-08-22, où « le rêve » renvoyait vers *Acrève*.
        */
        const s = selectContext([
            fiche('systems/alien/rules/a.md', 'Alpha', 'un inventaire d\'objets et de projets'),
        ], { ...REQ, query: 'comment lancer les jets ?' });

        expect(s.retenus).toHaveLength(0);
    });

    it('départage deux fiches par le nombre d\'occurrences', () => {
        /*
          **Avant, c'était l'ordre alphabétique du chemin qui tranchait.** Le
          bonus de corps ne comptait pas les occurrences : une fiche qui emploie
          le mot vingt fois valait exactement celle qui l'emploie une.
        */
        /*
          **Le document qui traite du sujet est nommé pour PERDRE le départage
          alphabétique.** Le premier jet l'appelait `a-en-traite.md` : il gagnait
          déjà sans compter une seule occurrence, et la dégradation à l'identique
          n'a fait tomber aucun test. *Une fixture qui donne raison au correctif
          pour une autre raison que le correctif ne prouve rien.*
        */
        const s = selectContext([
            fiche('systems/alien/rules/a-effleure.md', 'Alpha', 'on parle une fois de stress'),
            fiche('systems/alien/rules/z-en-traite.md', 'Zoulou', 'stress, stress et encore stress'),
        ], { ...REQ, query: 'comment fonctionne le stress ?' });

        expect(s.retenus[0].path).toBe('systems/alien/rules/z-en-traite.md');
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

    it('interdit à un moins bon de doubler un meilleur refusé faute de place', () => {
        /*
          **Le défaut mesuré le 2026-08-23 : le budget tranchait sur la TAILLE.**
          La boucle est gloutonne et ordonnée par score ; quand une fiche ne
          tenait plus, elle était écartée **et la boucle continuait**, laissant un
          document moins bien classé se glisser derrière elle. 13 des 31
          documents retenus à 4 000 en venaient — 42 %.

          Ici la seconde fiche (112) ne tient pas dans ce qui reste, et la note de
          campagne (63) tiendrait. Elle ne doit pas passer : *elle n'aurait pas
          gagné sur sa pertinence, elle aurait gagné sur son poids.* Le budget
          reste donc partiellement inemployé, et c'est voulu.
        */
        const s = selectContext([
            gros('systems/alien/rules/stress-a.md', 2_000, 'Stress un'),
            gros('systems/alien/rules/stress-b.md', 2_000, 'Stress deux'),
            brut('campaigns/anges-de-feu/notes.md', 'une note qui parle de stress'),
        ], { ...REQ, query: 'comment fonctionne le stress ?', maxTokens: 3_000 });

        expect(s.retenus.map(r => r.path)).toEqual(['systems/alien/rules/stress-a.md']);
        expect(s.ecartes).toContainEqual({ path: 'systems/alien/rules/stress-b.md', raison: 'budget' });
        expect(s.ecartes).toContainEqual({
            path: 'campaigns/anges-de-feu/notes.md', raison: 'double-par-le-rang',
        });
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

    it('deux fiches ne peuvent pas revendiquer le même sujet', () => {
        /**
         * **Ce test remplace un compte figé, et voici pourquoi.**
         *
         * Il affirmait « 18 fichiers, 17 fiches » pour Alien. Un corpus se
         * reforge : le nombre a bougé dès la première soirée de travail, et un
         * test qui échoue *parce qu'on avance* n'apprend rien — on prend
         * l'habitude de le recaler sans le lire, ce qui est pire que de ne pas
         * l'avoir.
         *
         * Ce qui mérite d'être tenu n'est pas le nombre mais l'unicité. Une
         * reforge produit des fiches v3 aux slugs neufs à côté des v1 qu'elles
         * remplacent : `initiative-et-tour.md` et
         * `initiative-et-deroulement-du-tour.md` portent alors le même `sujet`,
         * et l'Oracle reçoit **les deux** — dont la v1, qui cite des pages
         * fabriquées. Rien ne le signale : deux fiches valides, un classement
         * qui les retient toutes les deux, une réponse confiante.
         *
         * *Le journal des lacunes attrape ce qui manque ; rien n'attrape ce qui
         * est en double.* Ceci s'en charge.
         */
        const parSujet = new Map<string, string[]>();
        for (const f of index) {
            if (!f.sujet) continue;
            const m = /^systems\/([^/]+)\/rules\//.exec(f.path);
            if (!m) continue;
            const cle = `${m[1]} :: ${f.sujet.replace(/^["']|["']$/g, '').toLowerCase()}`;
            parSujet.set(cle, [...(parSujet.get(cle) ?? []), f.path]);
        }

        /**
         * **Trois exemptions, datées du 2026-08-11, et d'une autre nature.**
         *
         * Ici les deux moitiés sont des v1 : NOC et Rêves de Dragons n'ont
         * jamais été reforgés, donc aucune ne remplace l'autre et en archiver
         * une perdrait du contenu qui n'existe nulle part ailleurs.
         *
         * Ce sont des fiches bel et bien distinctes — la jauge de Fiel et sa
         * diminution, la mécanique de lancement et « provoquer le destin » —
         * rabattues sur le même sujet de canevas par le bug du mot répété
         * corrigé par `bafd65b` : « Dégâts et types de dégâts » portant deux
         * fois « dégâts », un libellé pouvait gagner sur un mot commun sur neuf.
         * Le correctif ne répare pas les fichiers déjà écrits.
         *
         * Elles disparaîtront à la reforge de ces deux systèmes. En attendant,
         * les nommer une par une vaut mieux que de désarmer le test : tout
         * doublon **nouveau** échoue encore.
         */
        const EXEMPTIONS_V1_JUMELLES = [
            'noc :: monnaie de table',
            'noc :: résolution des jets',
            'reves de dragons :: éthylisme (jet, degrés et malus)',
        ];

        const doublons = [...parSujet.entries()]
            .filter(([, chemins]) => chemins.length > 1)
            .filter(([cle]) => !EXEMPTIONS_V1_JUMELLES.includes(cle))
            .map(([cle, chemins]) => `${cle} → ${chemins.join(' + ')}`);

        expect(doublons, 'des fiches font doublon : la v1 et sa remplaçante v3 coexistent').toEqual([]);
    });

    it('le guide de synthèse d\'Alien reste le seul fichier sans sujet', () => {
        // `guide-synthese-regles-alien.md` est un artefact v1 sans frontmatter,
        // citant des index internes NotebookLM au lieu des pages. Il n'est pas
        // compté comme fiche, et c'est délibéré — voir l'exemption plus bas.
        const rules = index.filter(f => f.path.startsWith('systems/alien/rules/'));
        expect(rules.length, 'Alien devrait avoir des fiches').toBeGreaterThan(0);
        expect(rules.filter(f => !f.sujet).map(f => f.path))
            .toEqual(['systems/alien/rules/guide-synthese-regles-alien.md']);
    });

    it('toute fiche de rules/ porte un sujet, sauf les exemptions documentées', () => {
        /**
         * Le frontmatter `sujet:` n'est pas décoratif : c'est lui qui fait passer
         * une fiche devant les extraits bruts du même système. Sans lui, une fiche
         * soignée pèse autant qu'une décharge — c'est ce qui laissait onze fiches
         * de NOC et de Rêves de Dragons invisibles au classement.
         *
         * Exemption unique et volontaire : le guide de synthèse d'Alien est un
         * digest de 14 Ko couvrant tous les sujets à la fois. Lui donner un sujet
         * le ferait concourir avec les fiches et avaler le budget à lui seul.
         */
        const EXEMPTIONS = ['systems/alien/rules/guide-synthese-regles-alien.md'];

        const sansSujet = index
            .filter(f => /^systems\/[^/]+\/rules\/.+\.md$/.test(f.path) && !f.sujet)
            .map(f => f.path)
            .sort();

        expect(sansSujet).toEqual(EXEMPTIONS);
    });

    it('chaque système pourvu de fiches en a au moins une exploitable', () => {
        const parSysteme = new Map<string, number>();
        for (const f of index) {
            const m = /^systems\/([^/]+)\/rules\//.exec(f.path);
            if (!m) continue;
            parSysteme.set(m[1], (parSysteme.get(m[1]) ?? 0) + (f.sujet ? 1 : 0));
        }

        expect(parSysteme.size).toBeGreaterThan(0);
        for (const [systeme, fiches] of parSysteme) {
            expect(fiches, `« ${systeme} » n'a aucune fiche portant un sujet`).toBeGreaterThan(0);
        }
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
