import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 07/10/2026, David : « corrige le lint global ». Parcourir toute la racine
// entre dans les profils Chrome et échoue sur des entrées locales invalides.
// Git fournit les sources suivies ET nouvelles, sans visiter ces artefacts.
try {
    const options = process.argv.slice(2);
    if (options.some(option => option !== '--fix')) throw new Error('Usage : npm run lint [-- --fix]');
    const liste = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
        cwd: racine, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
    });
    const fichiers = [...new Set(liste.split('\0'))].filter(fichier =>
        /\.(?:[cm]?js|tsx?)$/i.test(fichier) && fs.existsSync(path.join(racine, fichier)));
    const eslint = new ESLint({ cwd: racine, warnIgnored: false, fix: options.includes('--fix') });
    const resultats = await eslint.lintFiles(fichiers);
    if (options.includes('--fix')) await ESLint.outputFixes(resultats);
    const formateur = await eslint.loadFormatter('stylish');
    const rapport = formateur.format(resultats);
    if (rapport) process.stdout.write(rapport + '\n');
    const erreurs = resultats.reduce((total, r) => total + r.errorCount, 0);
    const avertissements = resultats.reduce((total, r) => total + r.warningCount, 0);
    console.log(`Lint global : ${resultats.length} fichiers, ${erreurs} erreur(s), ${avertissements} avertissement(s).`);
    process.exitCode = erreurs ? 1 : 0;
} catch (erreur) {
    console.error(erreur);
    process.exitCode = 2;
}
