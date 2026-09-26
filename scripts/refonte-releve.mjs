#!/usr/bin/env node
/**
 * **`npm run refonte:releve` — T0.4, le relevé chiffré de la refonte.**
 *
 * Compte, lieu par lieu, les couleurs de la palette Tailwind brute qui restent
 * dans `src/`, et l'emploi des jetons de châssis (`app-*`). C'est contre le
 * relevé de départ, consigné dans le plan de la refonte, qu'on mesurera la fin.
 *
 * Le comptage vit dans `src/theme/releveDesCouleurs.ts`, partagé avec la garde
 * `electron/couleursBrutes.test.ts`. Même crochet de résolution que
 * `theme-valider.mjs` : Node lit le TypeScript, aucun paquet.
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

const { compterLesCouleursBrutes, lieuDuFichier, fichierCompte } = await import('../src/theme/releveDesCouleurs.ts');

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const JETON_DE_CHASSIS = /(?<![\w-])[a-z-]+-app-(?:bg|surface|border|text|accent)(?:\/\d{1,3})?(?![\w-])/g;

const brutes = new Map();
const chassis = new Map();
let fichiers = 0;

const parcourir = (dossier) => {
    for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
        const complet = path.join(dossier, e.name);
        if (e.isDirectory()) { parcourir(complet); continue; }
        const relatif = path.relative(SRC, complet).split(path.sep).join('/');
        if (!fichierCompte(relatif)) continue;
        fichiers++;
        const texte = fs.readFileSync(complet, 'utf-8');
        const lieu = lieuDuFichier(relatif);
        const n = compterLesCouleursBrutes(texte);
        const c = texte.match(JETON_DE_CHASSIS)?.length ?? 0;
        if (n) brutes.set(lieu, (brutes.get(lieu) ?? 0) + n);
        if (c) chassis.set(lieu, (chassis.get(lieu) ?? 0) + c);
    }
};
parcourir(SRC);

const somme = (m) => [...m.values()].reduce((a, b) => a + b, 0);
const lieux = [...new Set([...brutes.keys(), ...chassis.keys()])]
    .sort((a, b) => (brutes.get(b) ?? 0) - (brutes.get(a) ?? 0));

console.log(`Relevé de la refonte — ${new Date().toISOString().slice(0, 10)} — ${fichiers} fichiers de src/ (essais exclus)\n`);
console.log('| Lieu | Couleurs brutes | Jetons de châssis |');
console.log('| --- | ---: | ---: |');
for (const l of lieux) console.log(`| \`${l}\` | ${brutes.get(l) ?? 0} | ${chassis.get(l) ?? 0} |`);
console.log(`| **Total** | **${somme(brutes)}** | **${somme(chassis)}** |`);
