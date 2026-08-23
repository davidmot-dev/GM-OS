/**
 * SONDE — que coûte et que rapporte un plafond RAG plus haut ?
 *
 * Mesure hors modèle : `selectContext` est pure, donc ce qui ENTRE dans le
 * prompt se calcule exactement, sans Ollama et sans attendre.
 *
 * Ce qu'on cherche : à budget plus large, les fiches qui entrent en plus
 * sont-elles PERTINENTES ? Le score le dit — 100 tout rond = fiche du système
 * sans un seul mot commun avec la question. Un budget qui n'achète que des
 * scores à 100 achète du bruit et le paie en prefill.
 */
import { describe, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectContext, estimateTokens, type IndexedFile, type RagRequest } from './ragSelection';
import { RAGIGNORE_FILENAME, isIgnored, parseRagIgnore, type IgnoreScope } from './ragIgnore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(__dirname, '..', 'docs');

function indexer(): IndexedFile[] {
    const out: IndexedFile[] = [];
    const marcher = (dir: string, scopes: IgnoreScope[]) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let portees = scopes;
        if (entries.some(e => e.isFile() && e.name === RAGIGNORE_FILENAME)) {
            const base = path.relative(DOCS, dir).replace(/\\/g, '/');
            portees = [...scopes, { base, rules: parseRagIgnore(fs.readFileSync(path.join(dir, RAGIGNORE_FILENAME), 'utf-8')) }];
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            const rel = path.relative(DOCS, full).replace(/\\/g, '/');
            if (entry.isDirectory()) {
                if (!isIgnored(rel, portees, true)) marcher(full, portees);
                continue;
            }
            if (!['.md', '.txt', '.jsonl'].includes(path.extname(entry.name).toLowerCase())) continue;
            if (isIgnored(rel, portees, false)) continue;
            const content = fs.readFileSync(full, 'utf-8');
            const tete = content.slice(0, 2000);
            const sujet = /^---\r?\n[\s\S]*?^sujet\s*:\s*(.+)$/m.exec(tete);
            const titre = /^#\s+(.+)$/m.exec(tete);
            out.push({ path: rel, content, sujet: sujet?.[1].trim(), titre: titre?.[1].trim() });
        }
    };
    marcher(DOCS, []);
    return out;
}

/** Rang de base d'une fiche du systeme actif (RANG.fiche, non exporte). Un score
 *  egal a ce nombre = aucun mot de la question dans le sujet, le titre ni le corps. */
const FICHE_SANS_LE_MOINDRE_RAPPORT = 100;

const BUDGETS = [4000, 6000, 8000, 10000, 12000];

/** Questions réelles : celles du protocole de reprise et celles qui ont servi à déboguer. */
const CAS: Array<{ systeme: string; campagne: string; question: string }> = [
    { systeme: 'reves de dragons', campagne: 'Le secret de Milo', question: "quelles sont les règles de l'éthylisme ?" },
    { systeme: 'reves de dragons', campagne: 'Le secret de Milo', question: 'peut-on parer avec sa monture ?' },
    { systeme: 'reves de dragons', campagne: 'Le secret de Milo', question: 'comment gérer la noyade ?' },
    { systeme: 'reves de dragons', campagne: 'Le secret de Milo', question: 'comment se calculent les dégâts de chute ?' },
    { systeme: 'reves de dragons', campagne: 'Le secret de Milo', question: 'comment se résolvent les jets ?' },
    { systeme: 'alien', campagne: 'Hadley Hope', question: 'comment fonctionne le stress ?' },
    { systeme: 'alien', campagne: 'Hadley Hope', question: 'combien de temps dure une panique ?' },
    { systeme: 'blade-runner', campagne: 'Anges de feu', question: 'comment se déroule un interrogatoire ?' },
    { systeme: 'cthulhu hack', campagne: 'A la claire fontaine', question: 'comment marchent les sauvegardes ?' },
    { systeme: 'dune', campagne: 'Dune', question: "comment fonctionne le duel de lames ?" },
];

/**
 * **Sous interrupteur, et c'est deliberé.** Une sonde n'affirme rien : elle
 * mesure et imprime. La laisser courir avec la suite ajouterait trois lignes
 * vertes qui ne gardent rien — et *un controle qui ne controle rien est pire
 * qu'un controle absent*, parce qu'il se compte.
 *
 *     SONDE=1 npx vitest run --project electron electron/sondePlafondRag.test.ts --reporter=verbose
 */
const SOUS_INTERRUPTEUR = !!process.env.SONDE;

describe.runIf(SOUS_INTERRUPTEUR)('SONDE plafond RAG', () => {
    const index = indexer();

    it('mesure ce que chaque palier achète', () => {
        const lignes: string[] = [];
        lignes.push(`index : ${index.length} documents, dont ${index.filter(f => f.sujet).length} fiches`);
        lignes.push('');

        for (const cas of CAS) {
            const req: RagRequest = {
                systemId: cas.systeme,
                systemName: cas.systeme,
                campaignName: cas.campagne,
                query: cas.question,
            };
            lignes.push(`━━ ${cas.systeme} — « ${cas.question} »`);

            let precedents = new Set<string>();
            for (const budget of BUDGETS) {
                const s = selectContext(index, { ...req, maxTokens: budget });
                const noms = new Set(s.retenus.map(r => r.path));
                const neufs = s.retenus.filter(r => !precedents.has(r.path));
                const enBudget = s.ecartes.filter(e => e.raison === 'budget').length;

                const detail = neufs.length === 0
                    ? '—'
                    : neufs.map(r => `${r.path.split('/').pop()} [${r.score}${r.score === FICHE_SANS_LE_MOINDRE_RAPPORT ? ' ⚠bruit' : ''}]`).join(', ');

                lignes.push(
                    `  ${String(budget).padStart(5)} : ${String(s.retenus.length).padStart(2)} doc, `
                    + `${String(s.totalTokens).padStart(5)} tok utilisés, ${String(enBudget).padStart(2)} écartés  |  + ${detail}`,
                );
                precedents = noms;
            }
            lignes.push('');
        }
        console.log('\n' + lignes.join('\n'));
    });

    it('mesure le poids des fiches, par système', () => {
        const parSysteme = new Map<string, number[]>();
        for (const f of index) {
            if (!f.sujet) continue;
            const seg = f.path.split('/');
            if (seg[0] !== 'systems') continue;
            const sys = seg[1];
            if (!parSysteme.has(sys)) parSysteme.set(sys, []);
            parSysteme.get(sys)!.push(estimateTokens(f.content));
        }
        const lignes = ['système                 fiches   médiane    max   somme   tiennent à 4000 / 8000'];
        for (const [sys, tailles] of [...parSysteme].sort()) {
            const tri = [...tailles].sort((a, b) => a - b);
            const med = tri[Math.floor(tri.length / 2)];
            const somme = tri.reduce((a, b) => a + b, 0);
            const tiennent = (budget: number) => {
                let t = 0, n = 0;
                for (const x of tri) { if (t + x > budget) break; t += x; n++; }
                return n;
            };
            lignes.push(
                `${sys.padEnd(22)} ${String(tailles.length).padStart(5)} ${String(med).padStart(9)} `
                + `${String(tri[tri.length - 1]).padStart(6)} ${String(somme).padStart(7)}   ${tiennent(4000)} / ${tiennent(8000)}`,
            );
        }
        console.log('\n' + lignes.join('\n'));
    });
    it('mesure la composition de ce qui entre, et les sauts de file', () => {
        const lignes: string[] = [];
        lignes.push('budget | fiches PERTINENTES | fiches muettes | hors-fiches | sauts de file | ejections');
        const parBudget = new Map<number, { pert: number; muet: number; autre: number; sauts: number; ejec: number }>();
        for (const b of BUDGETS) parBudget.set(b, { pert: 0, muet: 0, autre: 0, sauts: 0, ejec: 0 });

        for (const cas of CAS) {
            const req: RagRequest = {
                systemId: cas.systeme, systemName: cas.systeme,
                campaignName: cas.campagne, query: cas.question,
            };
            let precedent: Set<string> | null = null;
            for (const budget of BUDGETS) {
                const s2 = selectContext(index, { ...req, maxTokens: budget });
                const acc = parBudget.get(budget)!;

                for (const r of s2.retenus) {
                    if (r.provenance !== 'fiche') acc.autre++;
                    else if (r.score > FICHE_SANS_LE_MOINDRE_RAPPORT) acc.pert++;
                    else acc.muet++;
                }

                // Saut de file : un document retenu alors qu'un MEILLEUR score a
                // ete ecarte faute de place. Le budget n'a pas tranche sur la
                // pertinence, il a tranche sur la taille.
                const ecartesBudget = new Set(s2.ecartes.filter(e => e.raison === 'budget').map(e => e.path));
                const scores = new Map<string, number>();
                for (const r of s2.retenus) scores.set(r.path, r.score);
                const meilleurEcarte = Math.max(0, ...[...ecartesBudget].map(p => {
                    const f = index.find(x => x.path === p);
                    if (!f) return 0;
                    const t = selectContext([f], { ...req, maxTokens: 99999 }).retenus[0];
                    return t ? t.score : 0;
                }));
                for (const r of s2.retenus) if (r.score < meilleurEcarte) acc.sauts++;

                if (precedent) for (const p2 of precedent) if (!scores.has(p2)) acc.ejec++;
                precedent = new Set(s2.retenus.map(r => r.path));
            }
        }

        for (const b of BUDGETS) {
            const a = parBudget.get(b)!;
            lignes.push(
                `${String(b).padStart(6)} | ${String(a.pert).padStart(17)} | ${String(a.muet).padStart(14)} `
                + `| ${String(a.autre).padStart(11)} | ${String(a.sauts).padStart(13)} | ${String(a.ejec).padStart(9)}`,
            );
        }
        lignes.push('');
        lignes.push(`(cumul sur ${CAS.length} questions reelles ; « ejections » = documents presents au palier`);
        lignes.push(' precedent et DISPARUS a celui-ci — un plafond plus haut qui retire une fiche)');
        console.log(String.fromCharCode(10) + lignes.join(String.fromCharCode(10)));
    });
});
