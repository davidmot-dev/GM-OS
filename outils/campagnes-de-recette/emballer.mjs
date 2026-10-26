import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import AdmZip from 'adm-zip';
const dossier = path.resolve('output/campagnes-tests/cthulhu-hack');
const lire = nom => JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf8'));
const u = lire('verification-archives.json'), e = lire('verification-electron.json'), inventaire = lire('inventaire.json');
const medias = lire('verification-medias.json');
if (!medias.reussi || medias.imagesDecodees !== 35 || medias.wavDecodes !== 3) throw new Error('Contrôle des médias incomplet.');
if (!u.success || u.numFailedTests) throw new Error('Les données du pack ne passent pas leur vérification.');
if (!e.importNatif || !e.remplacementIsole || !e.reload || !e.ficheHTML || e.jetsRecusParMJ !== 3) throw new Error('Recette Electron incomplète.');
if (!e.joueursExistantsConserves || e.anciensPJConserves !== 3) throw new Error('Rattachement aux joueurs existants non vérifié.');
for (const a of inventaire.archives) {
    const b = fs.readFileSync(path.join(dossier, a.fichier));
    if (createHash('sha256').update(b).digest('hex') !== a.sha256) throw new Error(`Archive changée : ${a.fichier}`);
    if (e.archives?.find(x => x.fichier === a.fichier)?.sha256 !== a.sha256) throw new Error(`Recette Electron périmée : ${a.fichier}`);
}
const anomalie = e.anomalies.length > 0;
fs.writeFileSync(path.join(dossier, 'ANOMALIES-CONNUES.md'), anomalie
    ? '# Anomalie constatée — GM-05\n\n**Secrets de séance diffusés aux tablettes, constat du 25/10/2026.** L’import et les jets fonctionnent, mais le champ `payload.session.sessions[*].gmSecrets` reste présent dans les trames WebSocket reçues. Le marqueur fictif `SECRET_MJ_CH_RECETTE` a été observé sur les trois formats de tablette. Ce défaut appartient à l’application, pas au format de la campagne.\n\nLe filtre `src/modules/remote/logic/caviardageDesJoueurs.ts` traite `gmNotes`, `notesDuMeneur` et `gmSecretInfo`, sans retirer `gmSecrets`. Le test e2e finit donc volontairement en échec sur GM-05 ; son rapport ne doit pas être présenté comme entièrement vert. Aucun correctif de l’application n’est inclus dans cette livraison de données. Le constat figure au registre des chantiers, § 1 bis et § 178.\n\nReproduction : importer les trois archives, ouvrir une séance de l’enquête et connecter un joueur de recette. Le rapport `verification-electron.json` fournit les chemins observés sans recopier les trames. Toutes les données de ce pack sont fictives.\n'
    : '# Anomalies connues\n\nAucune fuite du marqueur secret observée dans cette exécution. Les cas manuels restent à essayer.\n');
fs.writeFileSync(path.join(dossier, 'RAPPORT-DE-VERIFICATION.md'), `# Vérification du pack — 25/10/2026\n\n- **${u.numPassedTests} contrôles de données réussis** : manifestes Nexus, sommes SHA-256 et présence des 38 médias par archive, liens internes, santé, pilote, trois joueurs existants réutilisés, 30 PJ distincts, conséquences/durées, copie/rejeu, tables Table-OS et cahier.\n- **Import natif Electron exercé** dans un profil neuf et jetable : trois archives importées, campagne sentinelle conservée, trois joueurs préexistants (p-1/p-2/p-3), leurs avatars et trois anciens PJ fictifs conservés, 30 PJ de recette ajoutés sans doublon, réimport du laboratoire sans remise à zéro de l’enquête, puis persistance au rechargement.\n- **Trois tablettes de recette : 360, 768 et 1180 px**. Trois Sauvegardes reçues par le meneur, pas de débordement horizontal, fiches HTML du jeu ouvertes.\n- **GM-05 : ${anomalie ? 'ÉCHEC — gmSecrets reçu dans les données des tablettes ; voir ANOMALIES-CONNUES.md' : 'marqueur secret absent des trames reçues'}.** Les autres contrôles ci-dessus ont abouti ; le scénario e2e ne passe pas entièrement tant que cette anomalie subsiste.\n- **${inventaire.casDeRecette} cas manuels livrés**, encore NON TESTÉS par David dans resultats.csv. Le contrôle physique des éclairages et des sorties audio, les services externes et toutes les combinaisons possibles ne sont pas déclarés validés.\n\nCommandes :\n\n\`node outils/campagnes-de-recette/cthulhu-hack.mjs\`\n\n\`npx vitest run --config outils/campagnes-de-recette/vitest.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/cthulhu-hack/verification-archives.json\`\n\n\`npx playwright test e2e/campagneDeRecetteCthulhuHack.spec.ts\`\n\n\`node outils/campagnes-de-recette/emballer.mjs\`\n`);
const zip = new AdmZip();
fs.appendFileSync(path.join(dossier, 'RAPPORT-DE-VERIFICATION.md'), '\nLes 35 SVG et trois WAV ont aussi été décodés dans Edge hors ligne, sans lecture sonore ni accès Internet. Trois rendus de documents/cartes ont été inspectés.\n');
function ajouter(repertoire, relatif = '') {
    for (const entree of fs.readdirSync(repertoire, { withFileTypes: true })) {
        const nom = path.posix.join(relatif, entree.name), complet = path.join(repertoire, entree.name);
        if (entree.isDirectory()) ajouter(complet, nom);
        else if (!nom.endsWith('.zip')) zip.addFile(nom, fs.readFileSync(complet));
    }
}
ajouter(dossier);
const cible = path.join(dossier, 'Cthulhu-Hack-Campagnes-de-recette.zip'); zip.writeZip(cible);
console.log(JSON.stringify({ zip: cible, fichiers: zip.getEntryCount(), octets: fs.statSync(cible).size, controles: u.numPassedTests, casManuels: inventaire.casDeRecette, anomalieGM05: anomalie }));
