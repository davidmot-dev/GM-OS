#!/usr/bin/env node
/**
 * **Brancher git sur les hooks versionnés du dépôt.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE PROBLÈME QUE ÇA RÈGLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `.git/hooks/` **n'est pas versionné**. Le hook de pre-push — qui lance toute
 * la validation avant chaque envoi — y a vécu seul jusqu'au 2026-09-12 : un
 * clone frais n'en héritait pas, personne ne pouvait le relire, et rien ne
 * signalait son absence. *Un contrôle invisible est un contrôle qu'on croit
 * avoir.* Demande de David, le jour où il m'a vu en installer un second de la
 * même façon.
 *
 * ⭐ **La solution est `core.hooksPath`**, et non une copie. Git lit alors les
 * hooks **directement** dans `scripts/hooks/` : ils se versionnent, se relisent
 * et se corrigent comme le reste du code. *Copier les aurait fait vivre à deux
 * endroits — et le jour où les deux divergent, on ne sait plus lequel s'exécute.*
 *
 * ⚠️ `core.hooksPath` est une configuration **locale** : git n'accepte pas
 * qu'un dépôt cloné impose ses hooks, et c'est une protection, pas un oubli.
 * D'où ce script, appelé par le `prepare` de npm — donc par `npm install`.
 *
 * ⛔ **Il ne doit JAMAIS faire échouer `npm install`.** Hors dépôt git, sans
 * git installé, dans un conteneur de build : il se tait et rend la main. *Un
 * script de confort qui casse l'installation coûte plus qu'il ne rapporte.*
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
/** Relatif : `core.hooksPath` est résolu depuis la racine du dépôt. */
const DOSSIER = 'scripts/hooks';

function git(...args) {
    return spawnSync('git', args, { cwd: RACINE, encoding: 'utf-8' });
}

function principal() {
    if (!fs.existsSync(path.join(RACINE, DOSSIER))) return;

    const dansUnDepot = git('rev-parse', '--is-inside-work-tree');
    if (dansUnDepot.error || dansUnDepot.status !== 0) return;

    const actuel = git('config', '--get', 'core.hooksPath').stdout?.trim();
    if (actuel === DOSSIER) return;

    const pose = git('config', 'core.hooksPath', DOSSIER);
    if (pose.status !== 0) return;

    /*
      Les hooks doivent être exécutables. Sous Windows, git les lance par sh et
      le bit n'existe pas — `chmod` y est sans effet, ce qui est exactement ce
      qu'on veut : une seule ligne pour les deux mondes.
    */
    for (const nom of fs.readdirSync(path.join(RACINE, DOSSIER))) {
        try {
            fs.chmodSync(path.join(RACINE, DOSSIER, nom), 0o755);
        } catch { /* système de fichiers sans permissions : sans conséquence */ }
    }

    console.log(`[hooks] git lit désormais ses hooks dans ${DOSSIER}/`);
}

try {
    principal();
} catch {
    /* Voir l'en-tête : ce script ne casse jamais une installation. */
}
