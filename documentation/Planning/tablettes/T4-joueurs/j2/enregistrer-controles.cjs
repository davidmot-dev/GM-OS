const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const lireLog = fichier => {
    const bytes = fs.readFileSync(fichier);
    return bytes.toString(bytes[0] === 255 && bytes[1] === 254 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, '');
};
const reussites = fichier => [...lireLog(fichier).matchAll(/(\d+) passed\b/g)].at(-1)?.[1] * 1;
const attendu = (fichier, nombre) => { if (reussites(fichier) !== nombre) throw new Error('Resultat inattendu : ' + fichier); };
attendu('.tmp-j2-e2e-final.log', 28);
attendu('.tmp-j2-regression.log', 59);
attendu('.tmp-j2-final-cible.log', 22);
attendu('.tmp-j2-manuel.log', 7);
attendu('.tmp-j2-unit-rejeu.log', 4);
const unites = JSON.parse(fs.readFileSync('.tmp-j2-unit.json', 'utf8'));
const echecs = unites.testResults.flatMap(f => f.assertionResults.filter(t => t.status === 'failed').map(t => ({ fichier: f.name.replaceAll('\\', '/'), test: t.fullName })));
if (unites.numFailedTests !== 1 || echecs.length !== 1 || !echecs[0].fichier.endsWith('/src/components/echapFermeLesSurcouches.test.ts')) throw new Error('Echec unitaire inattendu');
const lint = JSON.parse(fs.readFileSync(path.join(__dirname, 'lint-compare.json'), 'utf8'));
if (lint.nouveaux) throw new Error('Nouveau diagnostic lint');
const galerie = JSON.parse(fs.readFileSync(path.join(__dirname, 'galerie-controles.json'), 'utf8'));
if (galerie.vues !== 104 || galerie.erreurs.length) throw new Error('Galerie incomplete');
const sha256 = fichier => crypto.createHash('sha256').update(fs.readFileSync(fichier)).digest('hex');
const empreinte = fichier => ({ source: fichier.replaceAll('\\', '/'), sha256: sha256(fichier) });
const captures = fs.readdirSync(__dirname).filter(f => f.endsWith('.png')).sort().map(f => empreinte(path.join(__dirname, f)));
if (captures.length !== 104) throw new Error('Nombre de captures J2 inattendu');
const manuel = ['archives', 'pnj', 'lieux', 'messages', 'notes', 'feedback'].map(n => empreinte('documentation/User Guides/captures/tablette-des-joueurs-' + n + '.jpg'));
const controles = {
    date: '2026-10-06', lot: 'T4/J2 joueurs',
    autorisation: "David a teste J1 et demande J2, puis confirme que GM-OS est ferme.",
    commandes: { types: 'npx.cmd tsc -b', construction: 'npm.cmd run build', unites: 'npx.cmd vitest run --maxWorkers=4', e2e: 'npx.cmd playwright test ... --reporter=list' },
    construction: { code: 0, types: 0 },
    unites: { premierPassage: { total: unites.numTotalTests, reussis: unites.numPassedTests, echecs, ignores: unites.numPendingTests },
        rejeuCible: { fichier: 'src/components/echapFermeLesSurcouches.test.ts', reussis: 4, code: 0 },
        validesApresRejeu: unites.numPassedTests + 1, ignores: unites.numPendingTests },
    e2e: { j2PremierRejeuVert: 28, regressionJoueurs: 59, dernierRejeuApresExclusiviteDesPanneaux: { j2: 13, t0: 9, total: 22 },
        scenariosDistinctsValidesApresRejeu: 88, echecsAttendus: 0, manuel: 7 },
    lint: { fichiers: lint.fichiers.length, nouveaux: lint.nouveaux },
    sources: lint.fichiers.map(f => empreinte(f.fichier)),
    captures: { nombre: captures.length, regardees: true, fichiers: captures },
    galerie: { vues: galerie.vues, erreurs: galerie.erreurs, regardee: true },
    manuel: { nombre: manuel.length, regardees: true, fichiers: manuel },
    limites: ['Alertes generiques testees via leur etat local, sans validation de transport reseau.', 'Vrais appareils, clavier Safari et mises en veille : T6.', 'Essai de David requis avant M1.'],
    commit: false, push: false,
};
fs.writeFileSync(path.join(__dirname, 'controles-integration.json'), JSON.stringify(controles, null, 2));
console.log('Controles J2 enregistres : 88 scenarios, 6774 tests valides apres rejeu, 104 PNG et 6 JPEG.');
