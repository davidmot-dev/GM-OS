#!/usr/bin/env node
/**
 * **`npm run theme:valider -- <jeu>` — le contrat, vérifié sur un thème déposé.**
 *
 * Lit `docs/systems/<jeu>/theme/`, le passe au validateur
 * (`src/theme/validationDuTheme.ts`) et imprime le rapport **prêt à coller dans
 * ChatGPT**, pour RPG Theme Builder. Sort en erreur si le thème est refusé.
 *
 *   npm run theme:valider -- dune            le rapport d'un thème
 *   npm run theme:valider -- dune --json     le même, pour une machine
 *   npm run theme:valider -- --tous          le verdict de chaque thème du dépôt
 *
 * Voir `documentation/Architecture/Pipeline-des-themes.md`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AUCUN PAQUET : NODE LIT LE TYPESCRIPT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Node 24 exécute les `.ts` en retirant les types, et le projet s'y prête déjà
 * (`erasableSyntaxOnly`, `verbatimModuleSyntax`). Il ne sait pas, en revanche,
 * deviner l'extension d'un import : `from './jetonsDeTheme'` est l'usage du
 * dépôt, compris par Vite et pas par Node. Le crochet ci-dessous essaie `.ts`
 * quand un chemin relatif sans extension ne se résout pas — et rien d'autre.
 */

import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
    resolve(specifier, context, nextResolve) {
        try {
            return nextResolve(specifier, context);
        } catch (err) {
            const relatif = specifier.startsWith('./') || specifier.startsWith('../');
            if (relatif && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context);
            throw err;
        }
    },
});

const { validerLeTheme, rapportEnTexte } = await import('../src/theme/validationDuTheme.ts');

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SYSTEMES = path.resolve(ICI, '..', 'docs', 'systems');

/** Les fichiers qu'on lit en texte ; les autres ne comptent que par leur taille. */
const LISIBLES = new Set(['.svg', '.json', '.md', '.css']);

/** Tous les fichiers d'un dossier `theme/`, par chemin relatif séparé par `/`. */
function relever(dossier) {
    const fichiers = {};
    const parcourir = (sous) => {
        for (const e of fs.readdirSync(path.join(dossier, sous), { withFileTypes: true })) {
            const relatif = sous ? `${sous}/${e.name}` : e.name;
            const complet = path.join(dossier, relatif);
            if (e.isDirectory()) { parcourir(relatif); continue; }
            const taille = fs.statSync(complet).size;
            const lisible = LISIBLES.has(path.extname(e.name).toLowerCase()) && taille < 2 * 1024 * 1024;
            fichiers[relatif] = { taille, contenu: lisible ? fs.readFileSync(complet, 'utf-8') : undefined };
        }
    };
    parcourir('');
    return fichiers;
}

function valider(jeu) {
    const dossier = path.join(SYSTEMES, jeu, 'theme');
    const feuille = path.join(dossier, 'theme.css');
    if (!fs.existsSync(feuille)) return null;
    return validerLeTheme({
        jeu,
        css: fs.readFileSync(feuille, 'utf-8'),
        fichiers: relever(dossier),
    });
}

const args = process.argv.slice(2);
const enJson = args.includes('--json');
const tous = args.includes('--tous');
const jeu = args.find(a => !a.startsWith('--'));

if (tous) {
    const jeux = fs.readdirSync(SYSTEMES, { withFileTypes: true })
        .filter(e => e.isDirectory() && fs.existsSync(path.join(SYSTEMES, e.name, 'theme', 'theme.css')))
        .map(e => e.name);
    const rapports = jeux.map(valider);
    if (enJson) {
        console.log(JSON.stringify(rapports, null, 2));
    } else {
        for (const r of rapports) {
            console.log(`${r.accepte ? '✅ accepté' : '⛔ refusé '}  ${r.jeu.padEnd(16)} ${r.erreurs.length} erreur(s), ${r.avertissements.length} avertissement(s)`);
        }
        console.log(`\nLe rapport d'un thème : npm run theme:valider -- <jeu>`);
    }
    process.exit(rapports.every(r => r.accepte) ? 0 : 1);
}

if (!jeu) {
    console.error('Usage : npm run theme:valider -- <jeu> [--json]   ou   npm run theme:valider -- --tous');
    process.exit(2);
}

const rapport = valider(jeu);
if (!rapport) {
    console.error(`Aucun thème : docs/systems/${jeu}/theme/theme.css n'existe pas.`);
    process.exit(2);
}
console.log(enJson ? JSON.stringify(rapport, null, 2) : rapportEnTexte(rapport));
process.exit(rapport.accepte ? 0 : 1);
