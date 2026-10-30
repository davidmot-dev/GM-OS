#!/usr/bin/env node
/**
 * **Garde git — aucune commande git qui écrit sans l'accord de David.**
 *
 * Hook `PreToolUse` de Claude Code (Bash et PowerShell), posé le 2026-10-28 à la demande de
 * David (« ok fais l'ensemble », après la proposition de transformer les interdits ⛔ de
 * `AGENTS.md` en gardes que la machine applique).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUE ÇA RÈGLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `AGENTS.md` interdit `commit`, `push`, `stash`, `checkout`, `reset`, `rebase`, `worktree`,
 * `clean` sans demande explicite. *Une première version de la sauvegarde automatique exécutait
 * `git stash` et `git checkout` dans ce dépôt, et a vidé l'application.* Jusqu'ici, la règle ne
 * tenait qu'à l'attention de l'agent ; une règle qui tient à l'attention finit par céder.
 *
 * ⭐ **La garde ne refuse pas : elle DEMANDE.** David commande lui-même des commits et des
 * envois ; la fenêtre de permission est l'endroit où il le confirme. Elle rend la commande
 * impossible à passer sans lui, sans la rendre impossible tout court.
 *
 * ⚠️ **Elle lit le texte de la commande, pas son effet.** Un script qui lance git lui-même lui
 * échappe ; une commande qui *cite* `git commit` dans une chaîne la déclenche pour rien. Le
 * second défaut coûte une fenêtre de trop, le premier est une limite connue — d'où la consigne
 * d'`AGENTS.md`, que cette garde double sans la remplacer.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Ce qui peut détruire du travail non commité : la leçon de la sauvegarde automatique. */
const DESTRUCTRICES = new Set(['stash', 'checkout', 'switch', 'restore', 'reset', 'rebase', 'worktree', 'clean', 'rm']);

/** Ce qui écrit l'historique, les références ou le dépôt distant. */
const ECRITURES = new Set([
    'commit', 'push', 'pull', 'merge', 'cherry-pick', 'revert', 'am', 'apply', 'mv',
    'tag', 'branch', 'update-ref', 'filter-branch', 'filter-repo', 'gc', 'prune', 'notes', 'replace',
]);

/** Les formes de lecture de sous-commandes qui, autrement, écrivent. */
function estUneLecture(sousCommande, args) {
    const mots = args.trim().split(/\s+/).filter(Boolean);
    switch (sousCommande) {
        case 'stash': return ['list', 'show'].includes(mots[0]);
        case 'worktree': return mots[0] === 'list';
        case 'notes': return mots.length === 0 || ['list', 'show'].includes(mots[0]);
        /* `git branch` seul ou avec ses options d'affichage liste ; un nom nu en crée une. */
        case 'branch': return mots.every(m => /^(-a|-r|-v|-vv|--all|--remotes|--list|--show-current|--contains|--merged|--no-merged|--format=.*|--sort=.*|--color.*|--no-color)$/.test(m));
        case 'tag': return mots.length === 0 || /^(-l|--list|-n\d*)$/.test(mots[0]);
        default: return false;
    }
}

/*
  `git`, ses options globales (`-C <dossier>`, `-c clé=valeur`, `--no-pager`…), puis la
  sous-commande et ses arguments jusqu'au prochain séparateur de commandes.
*/
const MOTIF_GIT = /(?:^|[\s;&|(`'"{])git(?:\.exe)?((?:\s+(?:-C|-c|--git-dir|--work-tree|--namespace)\s+(?:"[^"]*"|'[^']*'|\S+)|\s+--?[\w-]+(?:=\S+)?)*)\s+([a-z][a-z-]*)([^;&|\n]*)/gi;

/**
 * Les commandes git de `commande` qui écrivent, dans leur ordre d'apparition.
 * @returns {{ sousCommande: string, destructrice: boolean }[]}
 */
export function ecrituresGit(commande) {
    const trouvees = [];
    for (const [, , brute, args] of String(commande ?? '').matchAll(MOTIF_GIT)) {
        const sousCommande = brute.toLowerCase();
        const destructrice = DESTRUCTRICES.has(sousCommande);
        if (!destructrice && !ECRITURES.has(sousCommande)) continue;
        if (estUneLecture(sousCommande, args)) continue;
        trouvees.push({ sousCommande, destructrice });
    }
    return trouvees;
}

/** La réponse du hook, ou `null` quand la commande n'écrit rien avec git. */
export function decisionGit(commande) {
    const ecritures = ecrituresGit(commande);
    if (ecritures.length === 0) return null;
    const noms = [...new Set(ecritures.map(e => `git ${e.sousCommande}`))].join(', ');
    const destructrice = ecritures.some(e => e.destructrice);
    const raison = destructrice
        ? `⛔ ${noms} peut détruire du travail non commité : la première sauvegarde automatique a vidé GM-OS par git stash et git checkout. AGENTS.md l'interdit sans demande explicite de David. N'accepte que si tu l'as demandé.`
        : `⛔ ${noms} écrit dans le dépôt. AGENTS.md : aucune commande git qui écrit sans demande explicite de David. N'accepte que si tu l'as demandé.`;
    return {
        hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: raison,
        },
    };
}

async function lireLEntree() {
    let texte = '';
    for await (const morceau of process.stdin) texte += morceau;
    return texte ? JSON.parse(texte) : {};
}

/* Sous Windows, `argv[1]` mêle `/` et `\` et la casse du lecteur varie : une comparaison brute
   échouerait et la garde se tairait sans rien dire. */
const memeFichier = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

if (process.argv[1] && memeFichier(process.argv[1], fileURLToPath(import.meta.url))) {
    try {
        const entree = await lireLEntree();
        const decision = decisionGit(entree.tool_input?.command);
        if (decision) process.stdout.write(JSON.stringify(decision));
    } catch (erreur) {
        /* Une garde qui plante ne doit pas bloquer tout le shell ; elle le dit, et l'appel suit
           le parcours de permission ordinaire. */
        process.stderr.write(`garde-git : ${erreur.message}\n`);
    }
}
