/**
 * Essais des deux gardes de Claude Code — 2026-10-28.
 *
 * `node --test .claude/hooks/gardes.test.mjs` (sous Windows, `node --test` ne parcourt pas un
 * dossier) : le moteur d'essai de Node, sans Vitest ni paquet. Les gardes
 * vivent hors de `src/` et `electron/`, que la configuration de Vitest seule parcourt.
 *
 * ⚠️ *Une garde qui refuse tout ressemble à une garde qui marche* : chaque refus a ici son
 * pendant qui doit passer.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ecrituresGit, decisionGit } from './garde-git.mjs';
import { estProtege, commandeEcritDansLeCode, cibleProtegee, decisionAvant } from './garde-gmos-tourne.mjs';

const RACINE = 'C:\\Projet_David\\GM-OS-v5';
const noms = commande => ecrituresGit(commande).map(e => e.sousCommande);

test('git : les commandes qui écrivent sont reconnues, options globales comprises', () => {
    assert.deepEqual(noms('git commit -m "x"'), ['commit']);
    assert.deepEqual(noms('git -C "C:/Projet_David/GM-OS-v5" push origin production'), ['push']);
    assert.deepEqual(noms('git --no-pager -c core.pager=cat stash'), ['stash']);
    assert.deepEqual(noms('cd x && git add . && git commit -m y; git push'), ['commit', 'push']);
    assert.deepEqual(noms('git checkout -- src/App.tsx'), ['checkout']);
    assert.deepEqual(noms('git reset --hard HEAD'), ['reset']);
    assert.deepEqual(noms('git branch nouvelle'), ['branch']);
    assert.deepEqual(noms('git tag v2'), ['tag']);
    assert.deepEqual(noms('bash -c "git clean -fd"'), ['clean']);
});

test('git : les lectures passent sans fenêtre', () => {
    for (const lecture of [
        'git status', 'git diff --stat', 'git log --oneline -5', 'git show 41453319^:"Export Dirvers/x"',
        'git stash list', 'git worktree list', 'git branch', 'git branch -a --show-current', 'git tag',
        'git tag -l', 'git add documentation/', 'git -C . status -sb', 'git blame src/App.tsx',
        'npx vitest run --maxWorkers=4', 'echo digit commit',
    ]) assert.deepEqual(noms(lecture), [], lecture);
});

test('git : une commande destructrice le dit, une écriture ordinaire aussi', () => {
    assert.match(decisionGit('git stash').hookSpecificOutput.permissionDecisionReason, /détruire/);
    assert.doesNotMatch(decisionGit('git commit -m x').hookSpecificOutput.permissionDecisionReason, /détruire/);
    assert.equal(decisionGit('git commit -m x').hookSpecificOutput.permissionDecision, 'ask');
    assert.equal(decisionGit('git status'), null);
});

test('src/electron : les chemins protégés, et eux seuls', () => {
    assert.equal(estProtege(RACINE, 'C:\\Projet_David\\GM-OS-v5\\src\\App.tsx'), true);
    assert.equal(estProtege(RACINE, 'c:/projet_david/gm-os-v5/electron/main.ts'), true);
    assert.equal(estProtege(RACINE, 'src/modules/dice/x.ts'), true);
    assert.equal(estProtege(RACINE, 'documentation/Planning/src/x.md'), false);
    assert.equal(estProtege(RACINE, 'outils/barbarian/src-copie.mjs'), false);
    assert.equal(estProtege(RACINE, 'C:\\Ailleurs\\src\\x.ts'), false);
    assert.equal(estProtege(RACINE, '.claude/hooks/garde-git.mjs'), false);
});

test('src/electron : une écriture par le shell est reconnue quand elle nomme le chemin', () => {
    for (const ecriture of [
        "sed -i 's/a/b/' src/App.tsx", 'echo x > src/x.ts', 'cat <<EOF >> ./electron/main.ts',
        'Set-Content -Path src\\x.ts -Value 1', 'rm src/modules/vieux.ts',
        'cp /tmp/x.ts /c/Projet_David/GM-OS-v5/src/x.ts', 'git checkout -- electron/main.ts',
    ]) assert.equal(commandeEcritDansLeCode(ecriture), true, ecriture);
    for (const lecture of [
        'grep -rn foo src/ 2>/dev/null', 'cat src/App.tsx', 'npx tsc -b', 'npx eslint src/App.tsx',
        'echo x > documentation/src.md', 'sed -n 1,20p src/App.tsx', 'rm -rf output/src-copie',
    ]) assert.equal(commandeEcritDansLeCode(lecture), false, lecture);
});

test('src/electron : la cible de chaque outil', () => {
    assert.equal(cibleProtegee({ tool_name: 'Edit', tool_input: { file_path: `${RACINE}\\src\\App.tsx` } }, RACINE), 'src/App.tsx');
    assert.equal(cibleProtegee({ tool_name: 'NotebookEdit', tool_input: { notebook_path: 'electron/x.ipynb' } }, RACINE), 'electron/x.ipynb');
    assert.equal(cibleProtegee({ tool_name: 'Write', tool_input: { file_path: `${RACINE}\\docs\\x.md` } }, RACINE), null);
    assert.equal(cibleProtegee({ tool_name: 'Read', tool_input: { file_path: `${RACINE}\\src\\App.tsx` } }, RACINE), null);
    assert.notEqual(cibleProtegee({ tool_name: 'Bash', tool_input: { command: 'echo x > src/x.ts' } }, RACINE), null);
});

test('src/electron : Vite qui répond refuse, même après une réponse de David', () => {
    const refus = decisionAvant('src/App.tsx', { vite: true, sync: false, dejaRepondu: true });
    assert.equal(refus.hookSpecificOutput.permissionDecision, 'deny');
});

test('src/electron : la question est posée une fois, puis la réponse vaut', () => {
    assert.equal(decisionAvant('src/App.tsx', { vite: false, sync: false, dejaRepondu: false }).hookSpecificOutput.permissionDecision, 'ask');
    assert.match(decisionAvant('src/App.tsx', { vite: false, sync: true, dejaRepondu: false }).hookSpecificOutput.permissionDecisionReason, /3001/);
    assert.equal(decisionAvant('src/App.tsx', { vite: false, sync: false, dejaRepondu: true }), null);
    assert.equal(decisionAvant(null, { vite: true, sync: true, dejaRepondu: false }), null);
});
