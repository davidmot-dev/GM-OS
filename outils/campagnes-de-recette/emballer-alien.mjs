import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { empreinte, DATE_RECETTE } from './archives-de-recette.mjs';
const dossier = path.resolve('output/campagnes-tests/alien');
const lire = nom => JSON.parse(fs.readFileSync(path.join(dossier,nom),'utf8'));
const i=lire('inventaire.json'),u=lire('verification-archives.json'),e=lire('verification-electron.json'),m=lire('verification-medias.json');
assert.ok(u.success&&u.numFailedTests===0);
assert.ok(e.importNatif&&e.remplacementIsole&&e.reload&&e.ficheHTML&&e.joueursExistantsConserves);
assert.ok(e.modulesImportes===9&&e.modulesPrives&&e.parcoursModulesTablettes===9&&e.scanM314&&e.objectifPriveRemis&&e.ordreSpatialRecu&&e.jetsRecusParMJ===3);
assert.ok(m.reussi&&m.imagesDecodees===36&&m.wavDecodes===3);
for(const a of i.archives){assert.equal(empreinte(fs.readFileSync(path.join(dossier,a.fichier))),a.sha256);assert.equal(e.archives.find(x=>x.fichier===a.fichier)?.sha256,a.sha256,'Rapport Electron périmé');}
const fuite=e.anomalies.length>0;
fs.writeFileSync(path.join(dossier,'ANOMALIES-CONNUES.md'),`# Anomalies connues — ALIEN, 26/10/2026

**GM-05 : ${fuite?'ÉCHEC — secrets de séance transmis aux tablettes':'marqueur absent dans cette exécution'}.** ${e.anomalies.length} chemins observés avec SECRET_MJ_ALIEN_RECETTE. Le filtre de l’application ne retire pas GameSession.gmSecrets. Défaut transversal déjà constaté sur les lots Cthulhu Hack et NOC, sans correctif applicatif dans ces données. Le scénario E2E conserve son assertion en échec.

**Confidentialité des modules : vérifiée séparément.** Le marqueur privé du dossier administrateur et des pions cachés n’a pas été reçu par l’équipage ; les objectifs d’un autre personnage n’ont pas été reçus. Les modules conservent leurs contrôles d’accès propres. Ce résultat ne masque pas GM-05.

Les rapports ne recopient pas les trames. Les ${i.casDeRecette} cas manuels restent à essayer par David ; aucune validation matérielle de ses appareils n’est revendiquée.
`);
fs.writeFileSync(path.join(dossier,'RAPPORT-DE-VERIFICATION.md'),`# Vérification du lot ALIEN — 26/10/2026

- **${u.numPassedTests} contrôles de données réussis** : manifestes, SHA-256 et 39 médias par archive, liens, Santé/Force, Paniques préparées par le moteur, joueurs existants et 15 PJ distincts ; validation réelle des trois modules, objectifs privés, parcours M314 trois Tours, spatial préparé/engagé, clone, tables et cahier.
- **Import natif Electron** dans un profil/corpus/sauvegardes/ports jetables : trois archives, neuf états de modules, anciens profils/avatars et trois anciens PJ fictifs conservés. Remplacement des laboratoires sans modifier la fiche ni le terminal de l’enquête.
- **Trois tablettes : 360/768/1180 px**, pour Eli/Thomas, Mara/Marie, Samir/Lucas. Trois jets reçus par Maman et trois fiches HTML ouvertes.
- **Neuf ouvertures de modules sur le vrai Hub** : les trois instruments pour les trois joueurs. READ mission fonctionne ; un objectif privé remis à Eli ; scan M314 donnant Gaine de maintenance, un écho ; Vautour présenté comme contact non identifié ; ordre de verrouillage d’Iskra reçu depuis Eli. Pas de débordement horizontal observé.
- **Données privées des modules filtrées** : absence du marqueur SECRET_MODULE_ALIEN et des objectifs d’autrui dans les messages reçus. Après fermeture du contexte de séance, accès fermés ; dialogues et préparation retrouvés après rechargement. 18 PJ persistés, dont trois sentinelles fictives.
- **36 SVG et trois WAV décodés hors ligne**. Rendus de trois assets et captures des pupitres/Hub inspectés ; quatre secondes par WAV synthétique. Aucun film ou son commercial copié.
- **GM-05 : ${fuite?'ÉCHEC':'marqueur absent'}**, à distinguer des contrôles de modules réussis. Voir ANOMALIES-CONNUES.md.
- **${i.casDeRecette} cas manuels livrés, NON TESTÉS par David** ; jeu complet, périphériques physiques, toutes combinaisons de règles et services externes ne sont pas déclarés validés.

## Reproduire

\`node outils/campagnes-de-recette/alien.mjs\`

\`npx vitest run --config outils/campagnes-de-recette/vitest-alien.config.mts --maxWorkers=4 --reporter=json --outputFile=output/campagnes-tests/alien/verification-archives.json\`

\`npm run build\` puis \`npx playwright test e2e/campagneDeRecetteAlien.spec.ts\`

\`node outils/campagnes-de-recette/verifier-visuels.mjs alien\` puis \`node outils/campagnes-de-recette/emballer-alien.mjs\`

L’emballage refuse des rapports incomplets ou portant les empreintes d’anciennes archives.
`);
const zip=new AdmZip();
function ajouter(rep,prefixe=''){for(const entree of fs.readdirSync(rep,{withFileTypes:true})){const relatif=path.posix.join(prefixe,entree.name),complet=path.join(rep,entree.name);if(entree.isDirectory())ajouter(complet,relatif);else if(!relatif.endsWith('.zip'))zip.addFile(relatif,fs.readFileSync(complet));}}
ajouter(dossier);for(const e of zip.getEntries())e.header.time=new Date(DATE_RECETTE);
const cible=path.join(dossier,'Alien-Campagnes-de-recette.zip');zip.writeZip(cible);
console.log(JSON.stringify({zip:cible,fichiers:zip.getEntryCount(),octets:fs.statSync(cible).size,controles:u.numPassedTests,casManuels:i.casDeRecette,anomalieGM05:fuite}));
