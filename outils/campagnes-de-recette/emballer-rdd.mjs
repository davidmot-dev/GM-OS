import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { empreinte, DATE_RECETTE } from './archives-de-recette.mjs';
const dossier=path.resolve('output/campagnes-tests/reve-de-dragon'),lire=nom=>JSON.parse(fs.readFileSync(path.join(dossier,nom),'utf8'));
const i=lire('inventaire.json'),u=lire('verification-archives.json'),e=lire('verification-electron.json'),m=lire('verification-medias.json');
assert.ok(u.success&&u.numFailedTests===0);
assert.ok(e.importNatif&&e.remplacementIsole&&e.reload&&e.ficheHTML&&e.joueursExistantsConserves&&e.jetsRecusParMJ===3);
assert.ok(e.modulesImportes===3&&e.modulesPrives&&e.monteesPayees===3&&e.deplacementPaye&&e.rencontrePrivee&&e.carteOfficielle&&e.recusPersistes===2);
assert.ok(m.reussi&&m.imagesDecodees===36&&m.wavDecodes===3);
assert.ok(e.anomalies.every(a=>a.cas==='GM-05'));
for(const a of i.archives){assert.equal(empreinte(fs.readFileSync(path.join(dossier,a.fichier))),a.sha256);assert.equal(e.archives.find(x=>x.fichier===a.fichier)?.sha256,a.sha256,'Rapport Electron périmé');}
const fuite=e.anomalies.length>0;
fs.writeFileSync(path.join(dossier,'ANOMALIES-CONNUES.md'),`# Anomalies connues — Rêve de Dragon, 26/10/2026

**GM-05 : ${fuite?'ÉCHEC — secrets de séance transmis aux tablettes':'marqueur absent dans cette exécution'}.** ${e.anomalies.length} chemins observés avec SECRET_MJ_RDD_RECETTE. Le filtre de l’application ne retire pas GameSession.gmSecrets. Défaut transversal déjà constaté sur Cthulhu Hack, NOC et ALIEN ; aucun correctif applicatif dans ces données. L’assertion E2E garde cet échec visible.

**Module TMR : confidentialité vérifiée séparément** : aucune préparation SECRET_MODULE_RDD ni demi-rêve d’un autre PJ reçu par le joueur. Carte et fiche ne dupliquent pas les réserves ; le débit réel passe par le raccord GM-OS avec reçu durable.

Les ${i.casDeRecette} cas manuels restent NON TESTÉS par David. Le rapport ne revendique ni essai de ses appareils physiques ni couverture de toutes les combinaisons des règles.
`);
fs.writeFileSync(path.join(dossier,'RAPPORT-DE-VERIFICATION.md'),`# Vérification du lot Rêve de Dragon — 26/10/2026

- **${u.numPassedTests} contrôles de données réussis** : trois archives Nexus, manifestes/SHA-256, médias embarqués, références, valeurs R0 recalculées, santé R2 réelle (blessures et coma), quinze nouveaux PJ et trois joueurs existants. Trois états rdd-tmr validés par le moteur, demi-rêves privés et remappage de clone.
- **14 tables Table-OS** : lecture par le vrai parseur ; les **1400 résultats d100** comparés au moteur, sans trou ni chevauchement, avec noms et forces. Ce contrôle porte sur les fichiers fournis ; l’import manuel des tables dans l’univers global de David reste à faire.
- **Carte officielle existante** : 189 cases, G4/H4 voisins, image 900 × 1000 vérifiée dans le vrai Hub ; référence SHA-256 vérifiée sur l’asset embarqué par GM-OS. Aucun exemplaire du livre ou de la carte recopié dans le paquet.
- **Import Electron natif isolé** : trois campagnes plus une sentinelle ; profils, avatars et trois anciens PJ fictifs conservés. Remplacement du laboratoire puis persistance de l’enquête vérifiés, 18 PJ au rechargement dont trois sentinelles.
- **Trois tablettes 360/768/1180 px** : choix des bons PJ, trois jets reçus au meneur, trois fiches HTML ouvertes, trois modules TMR ouverts et carte officielle décodée. Pas de débordement horizontal de la page observé ; la carte possède son défilement propre.
- **Trois montées réellement payées** : rêve 12 → 11, fatigue 0 → 1 pour chacun. Liseron se déplace ensuite de G4 à H4 : rêve 11, fatigue 2 ; deux reçus durables conservés au rechargement, sans nouveau débit. Une rencontre publiée au seul Liseron, terminée explicitement avant le déplacement. Préparations privées et demi-rêves d’autrui filtrés ; accès fermés après la séance.
- **36 SVG et trois WAV décodés hors ligne**, trois rendus et captures du module inspectés ; sons originaux synthétiques de quatre secondes. Storyboard et lumières sont des données préparées ; aucune validation de lampe réelle revendiquée.
- **GM-05 : ${fuite?'ÉCHEC':'marqueur absent'}**, à distinguer des contrôles TMR réussis. Voir ANOMALIES-CONNUES.md.
- **${i.casDeRecette} essais humains livrés, NON TESTÉS par David.** Les rapports automatiques ne valident pas à sa place toutes les mécaniques ni la campagne jouée.

## Reproduire

\`node outils/campagnes-de-recette/rdd.mjs\`

\`npx vitest run --config outils/campagnes-de-recette/vitest-rdd.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/reve-de-dragon/verification-archives.json\`

\`npm run build\` puis \`npx playwright test e2e/campagneDeRecetteRdd.spec.ts\`

\`node outils/campagnes-de-recette/verifier-visuels.mjs reve-de-dragon\`, inspection puis \`node outils/campagnes-de-recette/emballer-rdd.mjs\`.

L’emballage refuse les rapports incomplets ou les empreintes d’une autre génération.
`);
const zip=new AdmZip();
function ajouter(rep,prefixe=''){for(const entree of fs.readdirSync(rep,{withFileTypes:true})){const relatif=path.posix.join(prefixe,entree.name),complet=path.join(rep,entree.name);if(entree.isDirectory())ajouter(complet,relatif);else if(!relatif.endsWith('.zip'))zip.addFile(relatif,fs.readFileSync(complet));}}
ajouter(dossier);for(const e of zip.getEntries())e.header.time=new Date(DATE_RECETTE);
const cible=path.join(dossier,'Reve-de-Dragon-Campagnes-de-recette.zip');zip.writeZip(cible);
console.log(JSON.stringify({zip:cible,fichiers:zip.getEntryCount(),octets:fs.statSync(cible).size,controles:u.numPassedTests,casManuels:i.casDeRecette,anomalieGM05:fuite}));
