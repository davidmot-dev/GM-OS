#!/usr/bin/env node
/**
 * **`npm run fiche:valider -- <Jeu>` — le cahier des charges, vérifié sur une fiche déposée.**
 *
 * Lit les fiches HTML de `docs/fiches/<Jeu>/`, les passe au validateur
 * (`src/modules/fiches/validationDeLaFiche.ts`) avec les gabarits intégrés au
 * moteur et les correspondances de `docs/systems/<jeu>/fiche/`, et imprime le
 * rapport **prêt à coller dans ChatGPT**, pour Character Sheet HTML Studio. Sort
 * en erreur si une fiche est refusée.
 *
 *   npm run fiche:valider -- NOC              le rapport des fiches d'un dossier
 *   npm run fiche:valider -- chemin/fiche.html   le rapport d'un fichier précis
 *   npm run fiche:valider -- NOC --json       le même, pour une machine
 *   npm run fiche:valider -- --tous           le verdict de chaque fiche du dépôt
 *
 * Voir `documentation/Architecture/Cahier-des-charges-fiche-de-personnage.md`.
 * Même crochet que `theme-valider.mjs` : Node lit le TypeScript, et on l'aide
 * seulement à deviner l'extension `.ts` des imports relatifs.
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

const { validerLaFiche, rapportEnTexte, gabaritsDuMoteur } = await import('../src/modules/fiches/validationDeLaFiche.ts');
const { lireLaCorrespondance, FICHIERS_DE_CORRESPONDANCE } = await import('../src/modules/fiches/correspondanceDeFiche.ts');

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(ICI, '..', 'docs');
const FICHES = path.join(DOCS, 'fiches');
const SYSTEMES = path.join(DOCS, 'systems');
const MOTEUR = path.join(FICHES, 'Character_Sheet_Manager.html');

const lire = (chemin) => fs.readFileSync(chemin, 'utf8');
const relatif = (chemin) => path.relative(path.resolve(ICI, '..'), chemin).split(path.sep).join('/');

const MOTEURS = fs.existsSync(MOTEUR) ? gabaritsDuMoteur(lire(MOTEUR)) : [];

/**
 * Toutes les correspondances déposées — celle des personnages et celle de la
 * fiche de groupe : la fiche est rattachée par l'identifiant de son gabarit.
 */
const CORRESPONDANCES = fs.readdirSync(SYSTEMES, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => FICHIERS_DE_CORRESPONDANCE.map(nom => path.join(SYSTEMES, e.name, 'fiche', nom)))
    .filter(chemin => fs.existsSync(chemin))
    .map(chemin => ({ chemin: relatif(chemin), table: lireLaCorrespondance(lire(chemin), relatif(chemin)) }))
    .filter(c => c.table);

/** Les fiches HTML d'un dossier de `docs/fiches/`, le moteur exclu. */
function fichesDu(dossier) {
    return fs.readdirSync(dossier)
        .filter(n => n.toLowerCase().endsWith('.html'))
        .map(n => path.join(dossier, n));
}

function valider(chemin) {
    return validerLaFiche({
        fiche: relatif(chemin),
        html: lire(chemin),
        gabaritsDuMoteur: MOTEURS,
        correspondances: CORRESPONDANCES,
    });
}

const args = process.argv.slice(2);
const enJson = args.includes('--json');
const tous = args.includes('--tous');
const cible = args.filter(a => !a.startsWith('--')).join(' ');

let chemins;
if (tous) {
    chemins = fs.readdirSync(FICHES, { withFileTypes: true })
        .filter(e => e.isDirectory() && !e.name.startsWith('_'))
        .flatMap(e => fichesDu(path.join(FICHES, e.name)));
} else if (cible && fs.existsSync(cible) && fs.statSync(cible).isFile()) {
    chemins = [path.resolve(cible)];
} else if (cible) {
    const dossier = fs.readdirSync(FICHES, { withFileTypes: true })
        .find(e => e.isDirectory() && e.name.toLowerCase() === cible.toLowerCase());
    if (!dossier) {
        console.error(`Aucun dossier « ${cible} » dans docs/fiches/. Présents : ${fs.readdirSync(FICHES, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).join(', ')}`);
        process.exit(2);
    }
    chemins = fichesDu(path.join(FICHES, dossier.name));
} else {
    console.error('Usage : npm run fiche:valider -- <Jeu> [--json]   ou   npm run fiche:valider -- --tous');
    process.exit(2);
}

if (chemins.length === 0) {
    console.error('Aucune fiche HTML trouvée.');
    process.exit(2);
}

const rapports = chemins.map(valider);
if (enJson) {
    console.log(JSON.stringify(rapports, null, 2));
} else if (tous) {
    for (const r of rapports) {
        console.log(`${r.accepte ? '✅ acceptée' : '⛔ refusée '}  ${r.fiche}\n             ${r.erreurs.length} erreur(s), ${r.avertissements.length} avertissement(s) · gabarit ${r.gabarit ?? '—'}`);
    }
    console.log(`\nLe rapport d'une fiche : npm run fiche:valider -- <Jeu>`);
} else {
    console.log(rapports.map(rapportEnTexte).join('\n---\n\n'));
}
process.exit(rapports.every(r => r.accepte) ? 0 : 1);
