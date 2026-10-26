import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import {empreinte,DATE_RECETTE} from './archives-de-recette.mjs';
const dossier=path.resolve('output/campagnes-tests/dune'),lire=nom=>JSON.parse(fs.readFileSync(path.join(dossier,nom),'utf8'));
const i=lire('inventaire.json'),u=lire('verification-archives.json'),e=lire('verification-electron.json'),m=lire('verification-medias.json');
assert.ok(u.success&&u.numFailedTests===0);
assert.ok(e.importNatif&&e.remplacementIsole&&e.reload&&e.ficheHTML&&e.joueursExistantsConserves&&e.jetsRecusParMJ===3);
assert.ok(e.modulesImportes===3&&e.modulesPrives&&e.maisonHTML===3&&e.progressionsTablettes===3&&e.desirRevele&&e.atoutDeplace&&e.menaceMaison);
assert.ok(m.reussi&&m.imagesDecodees===36&&m.wavDecodes===3);assert.ok(e.anomalies.every(a=>a.cas==='GM-05'));
for(const a of i.archives){assert.equal(empreinte(fs.readFileSync(path.join(dossier,a.fichier))),a.sha256);assert.equal(e.archives.find(x=>x.fichier===a.fichier)?.sha256,a.sha256,'Rapport natif périmé');}
const fuite=e.anomalies.length>0;
fs.writeFileSync(path.join(dossier,'ANOMALIES-CONNUES.md'),`# Anomalies connues — Dune, 26/10/2026

**GM-05 : ${fuite?'ÉCHEC — secrets de séance transmis aux tablettes':'marqueur absent dans cette exécution'}.** ${e.anomalies.length} chemins contenant le marqueur fictif SECRET_MJ_DUNE_RECETTE ont été observés. Le filtre de l’application ne retire pas GameSession.gmSecrets ; défaut transversal déjà constaté sur CH/NOC/ALIEN/RdD. Aucun correctif applicatif dans ce lot. L’assertion E2E garde l’échec visible.

**Plateau Dune : confidentialité vérifiée séparément.** Désirs non révélés, zone et atout cachés absents de la projection joueur ; marqueurs privés du module absents des trames des trois Hub. Le désir de Nalia n’est révélé qu’après les deux enquêtes reportées explicitement par le MJ. Cela ne corrige pas GM-05.

Les ${i.casDeRecette} cas humains restent NON TESTÉS par David. Talents non préconfigurés pour isoler la base : vérifier le livre et les prérequis avant d’en ajouter. Atouts personnels/partagés et objets d’inventaire ne se recopient pas automatiquement. Matériel, cinq arènes jouées intégralement et toutes combinaisons de règles ne sont pas déclarés validés.
`);
fs.writeFileSync(path.join(dossier,'RAPPORT-DE-VERIFICATION.md'),`# Vérification du lot Dune — 26/10/2026

- **${u.numPassedTests} contrôles de données réussis** : trois archives Nexus, manifestes et SHA-256, 39 médias chacune, références, valeurs 4–8, défaite réelle sans PV, maximes correctement réparties selon les principes (trois maximes par PJ principal), spécialisations lisibles par la correspondance HTML, quinze nouveaux PJ pour les trois joueurs existants.
- **Trois Maisons et trois états du module validés** : cinq zones, six atouts, liens réciproques, propriétaires locaux ; reflet de la fiche de Maison identique au module. Types mineure/Grande Maison et réserves indépendants, armoiries embarquées.
- **Parcours du moteur** : désir de Nalia 4/6 après le premier succès puis révélé au second (8/6), secrets filtrés, saut sans lien refusé, tangible récupéré et temporaire retiré en nouvelle scène, cinq arènes/deux modes acceptés. Achats et récupération de principe réels sur les personnages du laboratoire ; clone valide ; trois tables Table-OS et cahier vierge.
- **Import natif Electron isolé** : trois archives, anciennes fiches/avatars de trois joueurs fictifs conservés, remplacement des deux laboratoires sans changer l’enquête ; Maison et fiches indépendantes, 18 PJ persistés dont trois sentinelles. Aucun profil personnel consulté.
- **Trois tablettes 360/768/1180 px** : trois jets finalisés reçus au meneur, trois fiches PJ HTML et trois fiches Maison ; maximes affichées et trois écritures de progression reçues du HTML. Plateau ouvert aux trois joueurs, pas de débordement horizontal de la page observé.
- **Module partagé** : Maison Vaëlan mineure, Menace fixée explicitement à 3 pour trois présents ; deux enquêtes de succès reporté par le MJ révèlent le désir de Nalia, puis Copie du registre déplacée vers elle. Ces gestes ne prétendent pas constituer deux jets aléatoires tirés. État retrouvé au rechargement, accès coupés après clôture.
- **36 SVG et trois WAV décodés hors ligne**, rendus et captures inspectés ; sons originaux synthétiques de quatre secondes, pas de média commercial ni service externe.
- **GM-05 : ${fuite?'ÉCHEC':'marqueur absent'}**, seul échec conservé à la fin de la recette Electron ; distinct de la confidentialité du module. Voir ANOMALIES-CONNUES.md.
- **${i.casDeRecette} cas humains livrés, NON TESTÉS par David.** Table-OS global, talents, appareils physiques et tous les conflits complets restent à éprouver ; aucune validation exhaustive universelle revendiquée.

## Reproduire

\`node outils/campagnes-de-recette/dune.mjs\`

\`npx vitest run --config outils/campagnes-de-recette/vitest-dune.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/dune/verification-archives.json\`

\`npm run build\` puis \`npx playwright test e2e/campagneDeRecetteDune.spec.ts\`

\`node outils/campagnes-de-recette/verifier-visuels.mjs dune\`, inspection puis \`node outils/campagnes-de-recette/emballer-dune.mjs\`.

L’emballage refuse des rapports incomplets ou portant les empreintes d’autres archives. Les dates du 25/10 dans les manifestes sont l’instant fixe commun des données de recette ; vérifications et livraison le 26/10.
`);
const zip=new AdmZip();
function ajouter(rep,prefixe=''){for(const entree of fs.readdirSync(rep,{withFileTypes:true})){const relatif=path.posix.join(prefixe,entree.name),complet=path.join(rep,entree.name);if(entree.isDirectory())ajouter(complet,relatif);else if(!relatif.endsWith('.zip'))zip.addFile(relatif,fs.readFileSync(complet));}}
ajouter(dossier);for(const e of zip.getEntries())e.header.time=new Date(DATE_RECETTE);
const cible=path.join(dossier,'Dune-Campagnes-de-recette.zip');zip.writeZip(cible);
console.log(JSON.stringify({zip:cible,fichiers:zip.getEntryCount(),octets:fs.statSync(cible).size,controles:u.numPassedTests,casManuels:i.casDeRecette,anomalieGM05:fuite}));
