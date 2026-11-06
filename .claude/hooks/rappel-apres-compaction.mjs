#!/usr/bin/env node
/**
 * **Le rappel après une compaction** — crochet `SessionStart` (source `compact`) de Claude Code,
 * posé le 2026-11-06 à la demande de David (« ok pour ton ordre », idée reprise d'ECC :
 * `strategic-compact` et son crochet d'avant compaction, réécrits pour GM-OS).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUE ÇA RÈGLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 06/11, après une compaction, l'agent a tenu pour toujours valable un « GM-OS est fermé »
 * donné avant un essai de David, et a écrit dans `src/` sans reposer la question. Le résumé de la
 * compaction garde les faits, pas leur date de péremption : *« fermé » vaut jusqu'au prochain
 * essai*, et rien ne disait qu'un essai avait eu lieu.
 *
 * Deux gestes, juste après la compaction :
 *
 * 1. **La garde oublie la réponse** (`oublierLaReponse` de `garde-gmos-tourne.mjs`) : la prochaine
 *    écriture dans `src/` ou `electron/` repose la question par la fenêtre de permission. C'est
 *    la machine qui l'applique, pas l'attention de l'agent.
 * 2. **Un rappel est réinjecté dans le contexte** : la question à reposer, la langue de David,
 *    l'état git (fichiers modifiés, commits non poussés), et où vit l'état des chantiers.
 *
 * Il ne lit et n'écrit rien d'autre : aucune donnée de David, aucun réseau, aucune commande git
 * qui écrit (`status`, `rev-parse` et `log` seulement).
 *
 * Usage : `node rappel-apres-compaction.mjs`, entrée JSON du crochet sur stdin.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { oublierLaReponse } from './garde-gmos-tourne.mjs';

/** Une commande git en lecture, ou `null` si elle échoue (pas de dépôt, pas d'amont…). */
function gitLit(racine, args) {
    try {
        return execFileSync('git', args, { cwd: racine, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return null;
    }
}

/** L'état git utile après une compaction : branche, fichiers modifiés, commits non poussés. */
export function etatGit(racine) {
    const statut = gitLit(racine, ['status', '--short']);
    const nonPousses = gitLit(racine, ['log', '--oneline', '@{u}..HEAD']);
    return {
        branche: gitLit(racine, ['rev-parse', '--abbrev-ref', 'HEAD']),
        modifies: statut === null ? null : statut.split('\n').filter(Boolean).length,
        nonPousses: nonPousses === null ? null : nonPousses.split('\n').filter(Boolean),
    };
}

/** Le texte réinjecté. Pur : l'essai le lit sans dépôt ni crochet. */
export function rappelApresCompaction({ branche, modifies, nonPousses }) {
    const lignes = [
        '⛔ RAPPEL APRÈS COMPACTION (crochet du dépôt GM-OS, 06/11/2026) :',
        '- La réponse « GM-OS est fermé » donnée avant la compaction NE VAUT PLUS : David a pu essayer '
            + "l'application entre-temps. Avant toute écriture dans src/ ou electron/, lui demander « GM-OS "
            + 'tourne-t-il ? » et attendre sa réponse. La garde a oublié la réponse et reposera la question.',
        '- Parler français à David : le résumé de la compaction est en anglais, pas lui.',
        '- Aucune commande git qui écrit sans sa demande explicite ; ne rien commiter de `Export Dirvers/`.',
        "- L'état des chantiers vit dans documentation/Planning/2026-08-23-chantiers-gares.md (section ⭐) : "
            + "vérifier dans le code avant d'annoncer qu'une chose reste à faire.",
    ];
    if (branche) lignes.push(`- Branche : ${branche}.`);
    if (modifies !== null && modifies !== undefined) {
        lignes.push(`- ${modifies} fichier(s) modifié(s) ou non suivi(s) selon \`git status\` — certains peuvent être ceux de Codex : n'y toucher qu'en connaissance de cause.`);
    }
    if (nonPousses && nonPousses.length) {
        lignes.push(`- ${nonPousses.length} commit(s) non poussé(s) : ${nonPousses.slice(0, 5).join(' ; ')}${nonPousses.length > 5 ? ' ; …' : ''}. Pousser seulement sur demande.`);
    }
    return lignes.join('\n');
}

async function lireLEntree() {
    let texte = '';
    for await (const morceau of process.stdin) texte += morceau;
    try { return JSON.parse(texte || '{}'); } catch { return {}; }
}

const memeFichier = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

if (process.argv[1] && memeFichier(process.argv[1], fileURLToPath(import.meta.url))) {
    const entree = await lireLEntree();
    // Seulement après une compaction : un démarrage ou une reprise ordinaires ne disent rien.
    if (entree.source === 'compact') {
        oublierLaReponse(entree.session_id);
        const racine = process.env.CLAUDE_PROJECT_DIR || entree.cwd || process.cwd();
        process.stdout.write(JSON.stringify({
            systemMessage: 'Rappel après compaction réinjecté ; la réponse « GM-OS fermé » est oubliée.',
            hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: rappelApresCompaction(etatGit(racine)) },
        }));
    }
}
