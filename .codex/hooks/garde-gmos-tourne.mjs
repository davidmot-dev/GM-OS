#!/usr/bin/env node
/**
 * **Garde « GM-OS tourne-t-il ? » — rien ne s'écrit dans `src/` ou `electron/` sans elle.**
 *
 * Hook de Claude Code, posé le 2026-10-28 à la demande de David (« ok fais l'ensemble », après la
 * proposition de transformer les interdits ⛔ d'`AGENTS.md` en gardes que la machine applique).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUE ÇA RÈGLE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le rechargement à chaud de `npm run dev` a fait **perdre ses campagnes à David, deux fois**. La
 * règle d'`AGENTS.md` — demander « GM-OS tourne-t-il ? » et attendre la réponse avant toute
 * modification de `src/` ou `electron/` — ne tenait qu'à l'attention de l'agent.
 *
 * ⭐ **Trois cas, lus sur les ports** (`vite.config.ts`, `electron/portsDeGmOs.ts`) :
 *
 * - **Vite répond sur 5173** (`strictPort`) : GM-OS tourne en développement, et c'est exactement
 *   lui que le rechargement à chaud frappe. **Refus**, sans appel : David doit le fermer.
 * - **Le SyncServer répond sur 3001**, sans Vite : une instance construite est ouverte. Elle ne
 *   se recharge pas, mais David seul sait ce qu'il en fait : **demande**.
 * - **Rien ne répond** : **demande**, une fois par session — la question d'`AGENTS.md`, posée par
 *   la fenêtre de permission. La réponse vaut jusqu'à ce que Vite réapparaisse (*« fermé » vaut
 *   jusqu'au prochain essai*) ou trois heures au plus.
 *
 * `npm run repetition` lance `dist/` sur 4200/4201, sans Vite : une instance jetable, que cette
 * garde laisse en paix.
 *
 * ⚠️ **Limites connues.** Les ports ne disent pas tout : un GM-OS lancé sur d'autres ports passe
 * pour fermé. Une écriture par le shell n'est reconnue que si la commande nomme le chemin
 * (`sed -i … src/…`, `> src/…`, `Set-Content src/…`) ; un script qui écrit lui-même dans `src/`
 * lui échappe. La garde double la consigne d'`AGENTS.md`, elle ne la remplace pas.
 *
 * Usage : `node garde-gmos-tourne.mjs` en `PreToolUse`, `node garde-gmos-tourne.mjs --apres` en
 * `PostToolUse` (c'est l'écriture effectivement passée qui inscrit la réponse de David).
 */

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PORT_VITE = 5173;
export const PORT_SYNC = 3001;
const DUREE_DE_LA_REPONSE_MS = 3 * 60 * 60 * 1000;
const DOSSIER_DES_REPONSES = path.join(os.tmpdir(), 'gmos-gardes');

const OUTILS_D_EDITION = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const SHELLS = new Set(['Bash', 'PowerShell']);

/** Le chemin relatif au dépôt, avec des `/`, ou `null` hors du dépôt. */
function cheminDansLeDepot(racine, fichier) {
    const relatif = path.relative(path.resolve(racine), path.resolve(racine, fichier)).replaceAll('\\', '/');
    return relatif.startsWith('..') || path.isAbsolute(relatif) ? null : relatif;
}

/** Vrai pour un fichier de `src/` ou d'`electron/` (Windows : casse indifférente). */
export function estProtege(racine, fichier) {
    const relatif = cheminDansLeDepot(racine, fichier);
    return relatif !== null && /^(src|electron)\//i.test(relatif);
}

/* Un chemin de `src/` ou `electron/` : nu, relatif (`./src/`) ou sous la racine du dépôt, qu'elle
   s'écrive `C:\Projet_David\GM-OS-v5\` ou, sous Git Bash, `/c/Projet_David/GM-OS-v5/`. */
const CHEMIN_PROTEGE = String.raw`(?:\.[\\/])?(?:[^\s"']*?GM-OS-v5[\\/])?(?:src|electron)[\\/]`;
const REDIRECTION_VERS_LE_CODE = new RegExp(String.raw`>{1,2}\s*["']?` + CHEMIN_PROTEGE, 'i');
const MENTION_DU_CODE = new RegExp(String.raw`(?:^|[\s"'=(>])` + CHEMIN_PROTEGE, 'i');
const ECRIVAINS = /\bsed\s+(?:-\w+\s+)*-i|\bperl\s+-\w*i|\btee\b|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|Rename-Item|New-Item|\brm\s|\bmv\s|\bcp\s|\btouch\s|writeFile|write_text|\bgit\s+(?:apply|checkout|restore)\b/i;

/** Vrai quand une commande de shell écrit, selon toute apparence, dans `src/` ou `electron/`. */
export function commandeEcritDansLeCode(commande) {
    const texte = String(commande ?? '');
    if (REDIRECTION_VERS_LE_CODE.test(texte)) return true;
    return ECRIVAINS.test(texte) && MENTION_DU_CODE.test(texte);
}

/** Le fichier protégé que l'appel d'outil va écrire, ou `null`. */
export function cibleProtegee(entree, racine) {
    const outil = entree.tool_name;
    const params = entree.tool_input ?? {};
    if (OUTILS_D_EDITION.has(outil)) {
        const fichier = params.file_path ?? params.notebook_path;
        return fichier && estProtege(racine, fichier) ? cheminDansLeDepot(racine, fichier) : null;
    }
    if (SHELLS.has(outil) && commandeEcritDansLeCode(params.command)) return 'src/ ou electron/ (par le shell)';
    return null;
}

/** Vrai si quelque chose écoute sur `port` en local. */
export function ecoute(port, delaiMs = 400) {
    return new Promise(resoudre => {
        const prise = net.connect({ host: '127.0.0.1', port });
        const finir = reponse => { prise.destroy(); resoudre(reponse); };
        prise.setTimeout(delaiMs, () => finir(false));
        prise.once('connect', () => finir(true));
        prise.once('error', () => finir(false));
    });
}

const fichierDeReponse = session => path.join(DOSSIER_DES_REPONSES, `${String(session ?? 'sans-session').replace(/[^\w-]/g, '_')}.ferme`);

export function reponseEncoreValable(session, maintenant = Date.now()) {
    try {
        return maintenant - fs.statSync(fichierDeReponse(session)).mtimeMs < DUREE_DE_LA_REPONSE_MS;
    } catch {
        return false;
    }
}

function inscrireLaReponse(session) {
    fs.mkdirSync(DOSSIER_DES_REPONSES, { recursive: true });
    fs.writeFileSync(fichierDeReponse(session), new Date().toISOString());
}

function oublierLaReponse(session) {
    fs.rmSync(fichierDeReponse(session), { force: true });
}

const reponse = (permissionDecision, permissionDecisionReason) => ({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason },
});

/**
 * La décision avant l'appel, ou `null` pour laisser le parcours de permission ordinaire.
 * `etat` : `{ vite, sync, dejaRepondu }`, lu par l'appelant (les essais le fabriquent).
 */
export function decisionAvant(cible, etat) {
    if (!cible) return null;
    if (etat.vite) {
        return reponse('deny', `⛔ GM-OS tourne en développement (Vite répond sur ${PORT_VITE}) : écrire dans ${cible} déclencherait le rechargement à chaud, qui a déjà fait perdre ses campagnes à David deux fois. Ne modifie rien : demande à David de fermer GM-OS, attends sa réponse, puis réessaie.`);
    }
    if (etat.dejaRepondu) return null;
    const ouvert = etat.sync
        ? `Une instance construite semble ouverte (le SyncServer répond sur ${PORT_SYNC}).`
        : `Ni Vite (${PORT_VITE}) ni le SyncServer (${PORT_SYNC}) ne répondent.`;
    return reponse('ask', `⛔ GM-OS tourne-t-il ? Première écriture dans src/ ou electron/ de cette session (${cible}). ${ouvert} Accepte seulement si GM-OS est fermé : ta réponse vaut jusqu'au prochain lancement de Vite.`);
}

async function lireLEntree() {
    let texte = '';
    for await (const morceau of process.stdin) texte += morceau;
    return texte ? JSON.parse(texte) : {};
}

const memeFichier = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

if (process.argv[1] && memeFichier(process.argv[1], fileURLToPath(import.meta.url))) {
    const apres = process.argv.includes('--apres');
    let entree = {};
    try {
        entree = await lireLEntree();
        const racine = process.env.CLAUDE_PROJECT_DIR || entree.cwd || process.cwd();
        const cible = cibleProtegee(entree, racine);
        if (cible && apres) {
            /* L'écriture est passée : la fenêtre a été acceptée, ou la réponse valait encore. */
            inscrireLaReponse(entree.session_id);
        } else if (cible) {
            const [vite, sync] = await Promise.all([ecoute(PORT_VITE), ecoute(PORT_SYNC)]);
            if (vite) oublierLaReponse(entree.session_id);
            const decision = decisionAvant(cible, { vite, sync, dejaRepondu: reponseEncoreValable(entree.session_id) });
            if (decision) process.stdout.write(JSON.stringify(decision));
        }
    } catch (erreur) {
        /* Dans le doute, avant l'écriture : demander. Une garde qui plante ne doit pas laisser passer
           en silence, ni bloquer tout le shell. */
        process.stderr.write(`garde-gmos-tourne : ${erreur.message}\n`);
        if (!apres && OUTILS_D_EDITION.has(entree.tool_name)) {
            process.stdout.write(JSON.stringify(reponse('ask', `⛔ La garde « GM-OS tourne-t-il ? » a échoué (${erreur.message}). Accepte seulement si GM-OS est fermé.`)));
        }
    }
}
