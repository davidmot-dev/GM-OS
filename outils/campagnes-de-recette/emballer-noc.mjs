import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { empreinte, DATE_RECETTE } from './archives-de-recette.mjs';
const dossier = path.resolve('output/campagnes-tests/noc');
const lire = nom => JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf8'));
const inventaire = lire('inventaire.json'), u = lire('verification-archives.json'), e = lire('verification-electron.json'), m = lire('verification-medias.json');
assert.ok(u.success && u.numFailedTests === 0);
assert.ok(e.importNatif && e.remplacementIsole && e.reload && e.ficheHTML && e.joueursExistantsConserves);
assert.ok(e.rechargeCabale && e.cabaleHTML && e.cabalesImportees === 3 && e.faveursTablettes === 3 && e.pistesPJTablettes === 3 && e.jetsRecusParMJ === 3);
assert.ok(m.reussi && m.imagesDecodees === 36 && m.wavDecodes === 3);
for (const a of inventaire.archives) {
    assert.equal(empreinte(fs.readFileSync(path.join(dossier, a.fichier))), a.sha256);
    assert.equal(e.archives.find(x => x.fichier === a.fichier)?.sha256, a.sha256, 'Rapport Electron périmé');
}
const fuite = e.anomalies.length > 0;
fs.writeFileSync(path.join(dossier, 'ANOMALIES-CONNUES.md'), `# Anomalies connues — NOC, 25/10/2026

**GM-05 : ${fuite ? 'ÉCHEC, secrets de séance transmis aux tablettes' : 'marqueur absent dans cette exécution'}.** ${e.anomalies.length} chemins observés avec le marqueur fictif SECRET_MJ_NOC_RECETTE. Le filtre de l’application ne retire pas GameSession.gmSecrets des données envoyées aux joueurs. Ce défaut déjà découvert lors de la recette Cthulhu Hack est transversal ; aucun correctif applicatif n’est inclus dans les données NOC.

Le rapport verification-electron.json ne conserve que les chemins des champs concernés, pas les trames. Les autres contrôles d’import, joueurs, Cabale, recharge, Faveurs, fiches, jets et persistance ont abouti. Le scénario E2E reste volontairement en échec tant que GM-05 subsiste. Les ${inventaire.casDeRecette} essais manuels restent à effectuer par David. Aucune donnée de ce lot ne provient d’une vraie séance.
`);
fs.writeFileSync(path.join(dossier, 'RAPPORT-DE-VERIFICATION.md'), `# Vérification du lot NOC — 25/10/2026

- **${u.numPassedTests} contrôles de données réussis** : manifestes Nexus, SHA-256 et 39 médias par archive, liens, santé en dix cases sans PV, pilote, trois joueurs existants, 18 PJ distincts, Cabales complètes, réserves dérivées, Contacts/Faveurs, seuils, entraide, clone/rejeu, tables et cahier.
- **Import natif Electron** en profil/corpus/sauvegardes jetables : trois campagnes et leurs Cabales ; anciens profils/avatars et trois anciens PJ fictifs conservés. Remplacement du laboratoire sans toucher à l’enquête ; rechargement conservant 21 PJ (18 nouveaux et trois sentinelles fictives).
- **Cabale essayée** : feuille HTML, nom, Contacts ; Nouveau scénario du laboratoire recharge pistes 3/2/2, Contacts 2/2/2, Technique et Capital 3, Menace 0 ; périls 2/1/1/2 conservés et autre Cabale intacte.
- **Trois vrais parcours tablette** : Thomas/Soren 360 px, Marie/Daria 768 px, Lucas/Naël 1180 px. Trois jets reçus par la Loi ; trois pistes Vécu modifiées dans la fiche HTML ; trois petites Faveurs dépensées depuis la Cabale ; pas de débordement horizontal.
- **36 SVG et trois WAV décodés dans Edge hors ligne** ; trois rendus d’assets inspectés. Audio synthétique quatre secondes, sans lecture sonore. Sorties physiques des appareils non validées.
- **GM-05 : ${fuite ? 'ÉCHEC' : 'marqueur absent'}**. Lire ANOMALIES-CONNUES.md. Ne pas déclarer l’E2E entièrement vert.
- **${inventaire.casDeRecette} cas manuels livrés, NON TESTÉS par David**. Le CSV reste vierge de verdicts humains.

## Reproduire

\`node outils/campagnes-de-recette/noc.mjs\`

\`npx vitest run --config outils/campagnes-de-recette/vitest-noc.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/noc/verification-archives.json\`

\`npm run build\` puis \`npx playwright test e2e/campagneDeRecetteNoc.spec.ts\`

\`node outils/campagnes-de-recette/verifier-visuels.mjs noc\` puis \`node outils/campagnes-de-recette/emballer-noc.mjs\`

L’emballage refuse des rapports incomplets ou portant les empreintes d’anciennes archives.
`);
const zip = new AdmZip();
function ajouter(repertoire, prefixe = '') {
    for (const entree of fs.readdirSync(repertoire, { withFileTypes: true })) {
        const relatif = path.posix.join(prefixe, entree.name), complet = path.join(repertoire, entree.name);
        if (entree.isDirectory()) ajouter(complet, relatif);
        else if (!relatif.endsWith('.zip')) zip.addFile(relatif, fs.readFileSync(complet));
    }
}
ajouter(dossier);
for (const entree of zip.getEntries()) entree.header.time = new Date(DATE_RECETTE);
const cible = path.join(dossier, 'NOC-Campagnes-de-recette.zip'); zip.writeZip(cible);
console.log(JSON.stringify({ zip: cible, fichiers: zip.getEntryCount(), octets: fs.statSync(cible).size, controles: u.numPassedTests, casManuels: inventaire.casDeRecette, anomalieGM05: fuite }));
