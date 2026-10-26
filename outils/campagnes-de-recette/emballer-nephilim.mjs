import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import {empreinte,DATE_RECETTE} from './archives-de-recette.mjs';
const dossier=path.resolve('output/campagnes-tests/nephilim'),lire=nom=>JSON.parse(fs.readFileSync(path.join(dossier,nom),'utf8'));
const i=lire('inventaire.json'),u=lire('verification-archives.json'),e=lire('verification-electron.json'),m=lire('verification-medias.json');
assert.ok(u.success&&u.numFailedTests===0);
assert.ok(e.importNatif&&e.remplacementIsole&&e.reload&&e.ficheHTML&&e.joueursExistantsConserves&&e.jetsRecusParMJ===3);
assert.ok(e.modulesSpecifiques===0&&e.sapiencesTablettes===3&&e.traqueDebordee);
assert.ok(m.reussi&&m.imagesDecodees===36&&m.wavDecodes===3);assert.ok(e.anomalies.every(a=>a.cas==='GM-05'));
for(const a of i.archives){assert.equal(empreinte(fs.readFileSync(path.join(dossier,a.fichier))),a.sha256);assert.equal(e.archives.find(x=>x.fichier===a.fichier)?.sha256,a.sha256,'Rapport natif périmé');}
const fuite=e.anomalies.length>0;
fs.writeFileSync(path.join(dossier,'ANOMALIES-CONNUES.md'),`# Anomalies connues — Nephilim, 26/10/2026

**GM-05 : ${fuite?'ÉCHEC — secrets de séance transmis aux tablettes':'marqueur absent dans cette exécution'}.** ${e.anomalies.length} chemins contenant le marqueur fictif SECRET_MJ_NEPHILIM_RECETTE ont été observés. Le filtre de l’application ne retire pas GameSession.gmSecrets ; défaut transversal déjà constaté sur les cinq autres lots. Aucun correctif applicatif dans ce lot. L’assertion E2E garde l’échec visible. Les rapports enregistrent les chemins, sans recopier les trames complètes.

Les ${i.casDeRecette} cas humains restent NON TESTÉS par David. Profils avancés et trois pouvoirs originaux portant RECETTE : aucune revendication de création novice ou de catalogue officiel. Les six cases physiques génériques de Combat-OS ne représentent pas toute la carte Santé native : utiliser cette carte pour les valeurs d’absorption, bonus du Ka-Terre et santé magique. Les contextes occultes se règlent manuellement au bandeau ; un déplacement Atlas ne les applique pas.

Aucun module de jeu spécifique compatible Nephilim dans le catalogue actuel. Cartes natives et outils transversaux préparés ; appareils physiques et toutes combinaisons du livre restent à éprouver.
`);
fs.writeFileSync(path.join(dossier,'RAPPORT-DE-VERIFICATION.md'),`# Vérification du lot Nephilim — 26/10/2026

- **${u.numPassedTests} contrôles de données réussis** : trois archives Nexus, manifestes/SHA-256 et 39 médias chacune ; références des scènes, indices et relations ; fiches typées, santé en cases sans PV ; quinze nouveaux PJ pour les trois joueurs existants. Vécus passés reliés aux époques du référentiel, sept pages HTML présentes et huit propositions de contextes.
- **Parcours du moteur sur les personnages livrés** : conséquences physiques et magiques retirées au Vécu avant le Ka, quatre interdits du Khaïba, alertes des Chutes 8/10, mise en jeu déjà utilisée refusée, Sacrifice insuffisant et Œuvre rouge refusée avec construct blanc. Consommation réelle des Materiae Eau 8 → 6, conservation sur critique, double Lune 4 avec manque 3. Stase, cible, progression et options d’encaissement ; clone, trois tables Table-OS et cahier vierge.
- **Import natif Electron isolé** : trois archives, anciennes fiches/avatars de trois joueurs fictifs conservés, remplacement du laboratoire Santé/Chutes sans changer l’enquête ; 18 PJ persistés dont trois sentinelles. Aucun profil personnel consulté.
- **Trois tablettes 360/768/1180 px** : trois jets reçus au meneur, trois fiches HTML, identité Nephilim et Simulacre lus, trois écritures de Sapience 14/15/16 reçues puis persistées. Quatre ajouts explicites de Traque depuis les tablettes font passer 1 à 0 et l’Intensité de 1 à 2 au seuil RK 5 ; état retrouvé au rechargement. Ces ajouts ne sont pas des jetons facturés automatiquement aux jets.
- **36 SVG et trois WAV décodés hors ligne**, rendus et captures inspectés ; sons originaux synthétiques de quatre secondes. Aucune nouvelle extension de jeu nécessaire ; cartes natives et outils existants utilisés.
- **GM-05 : ${fuite?'ÉCHEC':'marqueur absent'}**, seul échec conservé à la fin de la recette Electron. Voir ANOMALIES-CONNUES.md.
- **${i.casDeRecette} cas humains livrés, NON TESTÉS par David.** Les sept pages entièrement éditées, les trois Sciences occultes jouées intégralement, les tables globales importées et les appareils physiques restent une recette humaine.

## Reproduire

1. node outils/campagnes-de-recette/nephilim.mjs
2. npx vitest run --config outils/campagnes-de-recette/vitest-nephilim.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/nephilim/verification-archives.json
3. npm run build puis npx playwright test e2e/campagneDeRecetteNephilim.spec.ts
4. node outils/campagnes-de-recette/verifier-visuels.mjs nephilim ; inspecter les rendus.
5. node outils/campagnes-de-recette/emballer-nephilim.mjs

L’emballage refuse des rapports incomplets ou portant les empreintes d’autres archives. Les dates du 25/10 dans les manifestes sont l’instant fixe commun des données de recette ; vérifications et livraison le 26/10.
`);
const zip=new AdmZip();
function ajouter(rep,prefixe=''){for(const entree of fs.readdirSync(rep,{withFileTypes:true})){const relatif=path.posix.join(prefixe,entree.name),complet=path.join(rep,entree.name);if(entree.isDirectory())ajouter(complet,relatif);else if(!relatif.endsWith('.zip'))zip.addFile(relatif,fs.readFileSync(complet));}}
ajouter(dossier);for(const e of zip.getEntries())e.header.time=new Date(DATE_RECETTE);
const cible=path.join(dossier,'Nephilim-Campagnes-de-recette.zip');zip.writeZip(cible);
console.log(JSON.stringify({zip:cible,fichiers:zip.getEntryCount(),octets:fs.statSync(cible).size,controles:u.numPassedTests,casManuels:i.casDeRecette,anomalieGM05:fuite}));
