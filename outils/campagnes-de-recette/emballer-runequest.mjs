import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import {empreinte} from './archives-de-recette.mjs';

const dossier=path.resolve('output/campagnes-tests/runequest');
const lire=nom=>JSON.parse(fs.readFileSync(path.join(dossier,nom),'utf8'));
const i=lire('inventaire.json'),u=lire('verification-archives.json'),m=lire('verification-medias.json'),v=lire('verification-contexte.json'),p=lire('verification-plugin.json');
const e=fs.existsSync(path.join(dossier,'verification-electron.json'))?lire('verification-electron.json'):null;
assert.ok(u.success&&u.numFailedTests===0&&u.numPassedTests>0,'Contrôles de données incomplets');
assert.ok(m.reussi&&m.capturesExaminees&&m.imagesDecodees===36&&m.wavDecodes===3,'Revue médias incomplète');
if(e){
 assert.ok(e.importNatif&&e.remplacementIsole&&e.reload&&e.ficheHTML&&e.joueursExistantsConserves);
 assert.ok(e.jetsRecusParMJ===3&&e.pmTablettes===3&&e.localisationsTablettes===3&&e.modulesSpecifiques===0);
 assert.ok(e.anomalies.every(a=>a.cas==='GM-05'),'Anomalie applicative non traitée par le rapport');
 const qa=lire('verification-captures-electron.json');assert.ok(qa.capturesExaminees&&qa.captures.length===4);
 assert.equal(qa.rapportElectronSHA256,empreinte(fs.readFileSync(path.join(dossier,'verification-electron.json'))),'Revue Electron périmée');
 assert.equal(qa.sourceE2ESHA256,empreinte(fs.readFileSync('e2e/campagneDeRecetteRuneQuest.spec.ts')),'Source E2E modifiée après revue');
 for(const capture of qa.captures)assert.equal(capture.sha256,empreinte(fs.readFileSync(path.join(dossier,capture.fichier))),'Capture modifiée après revue');
}
for(const a of i.archives){
 assert.equal(empreinte(fs.readFileSync(path.join(dossier,a.fichier))),a.sha256);
 for(const [nom,r]of [['tests',v],['médias',m],...(e?[['Electron',e]]:[])])assert.equal(r.archives.find(x=>x.fichier===a.fichier)?.sha256,a.sha256,'Rapport périmé : '+nom);
 const r=p.rapports.find(x=>x.fichier===a.fichier);assert.ok(r?.valid);assert.equal(r.sha256,a.sha256);
}
const fuite=!!e?.anomalies.length;
const ecrire=(nom,texte)=>fs.writeFileSync(path.join(dossier,nom),texte.trimEnd()+'\n');
const guide=fs.readFileSync(path.join(dossier,'LIRE-MOI.md'),'utf8').replace(/\n<!-- verification-du-lot -->[\s\S]*?<!-- fin-verification-du-lot -->\n/,'\n');
const avertissement=fuite?'**GM-05 confirmé : des secrets de séance sont transmis aux Hub joueurs.** Import, fiches et persistance vérifiés en instance jetable ; le contrôle de confidentialité reste en échec. Lire ANOMALIES-CONNUES.md avant une utilisation avec des joueurs réels.':e?'Import et parcours Hub vérifiés en instance jetable ; les cas humains restent à essayer.':'Lot préparé ; import réel et Hub non vérifiés.';
ecrire('LIRE-MOI.md',guide.replace(/^(# [^\n]+)\n/,'$1\n\n<!-- verification-du-lot -->\n'+avertissement+'\n<!-- fin-verification-du-lot -->\n'));
ecrire('ANOMALIES-CONNUES.md',`# RuneQuest — anomalies et limites, 30/10/2026

**GM-05 : ${e?(fuite?'ÉCHEC — marqueur de secret reçu sur les Hub joueurs':'marqueur absent de cette exécution'):'NON VÉRIFIÉ — essai applicatif non exécuté'}.** ${e?`${e.anomalies.length} chemins relevés dans verification-electron.json. Marqueurs fictifs uniquement, sans trames complètes. L’assertion finale E2E conserve tout échec ; aucun correctif du code applicatif dans ce lot.`:'Ne pas confondre les contrôles de données avec un import réel ou une vérification des droits.'}

Les ${i.casDeRecette} cas humains restent **NON TESTÉS par David**. Les profils avancés ont des valeurs choisies ; aucune création novice par budget n’est revendiquée. Les exercices runiques et de sorcellerie RECETTE sont abstraits et ne prétendent pas décrire un sort officiel.

Les coûts magiques, blessures locales, conséquences d’inconscience/mort, RA d’arme, progression, INT libre et paires de Runes restent à arbitrer et saisir à la table. Le panneau teste les aptitudes et affiche les localisations ; il ne prend pas ces décisions à la place du meneur. Aucun module RuneQuest spécifique compatible n’est disponible.

Les appareils physiques, les quatre pages intégralement éditées, la partie complète et l’import des trois tables globales restent à éprouver. Les fichiers Table-OS sont livrés séparément ; leur format a été lu par le parseur réel.
`);
ecrire('RAPPORT-DE-VERIFICATION.md',`# Vérification des campagnes RuneQuest — 30/10/2026

État : **${e?(fuite?'IMPORTÉ ET ÉPROUVÉ EN INSTANCE ISOLÉE, avec anomalie GM-05':'IMPORTÉ ET ÉPROUVÉ EN INSTANCE ISOLÉE'):'PRÉPARÉ — import applicatif NON EXÉCUTÉ'}**.

- ${u.numPassedTests} contrôles automatisés réussis : archives réellement livrées, validateurs Nexus/pilote, 313 champs de fiche, types, références, santé réelle, 21 nouveaux PJ et trois joueurs autorisés. Fonctions réelles RuneQuest : cinq niveaux de D100, seuils 3/56/120/140, modificateurs, caractéristique, résistance, opposition et localisations. Les coûts magiques ne sont pas automatisés par ce pilote.
- Utilitaire du plugin : trois archives valides selon son contrôle Nexus structurel partiel ; 39 médias par archive. Les SHA-256 des rapports concordent avec les fichiers livrés.
- Médias : 36 SVG et trois WAV de quatre secondes décodés hors ligne ; neuf rendus inspectés. Plans et cartouches documentaires originaux, signaux synthétiques.
- ${e?'Import natif des trois archives et remplacement isolé du laboratoire 02 ; trois anciens PJ sentinelles, noms et avatars conservés. Rechargement : 24 PJ persistés dont 21 de ce lot, et notes de 01 conservées.':'Import natif, remplacement, tablettes et persistance : NON EXÉCUTÉS.'}
- Lancement Electron : échec graphique dans le bac à sable (code −1073741515). Après un premier refus de la revue automatique, David a explicitement autorisé la relance hors bac à sable. Le temporaire placé dans le dépôt a ensuite été refusé par la garde de sauvegardes ; le lanceur conserve donc son temporaire système hors installation, ses profils/corpus/sauvegardes jetables et ses contrôles d’isolation. Détails dans verification-lancement.json.
- ${e?'Trois Hub simulés à 360/768/1180 px : trois jets reçus par le MJ, trois localisations avec lecture des PV, trois fiches HTML liées ; nom, FOR, nom et pourcentage de l’arme principale contrôlés. PM écrits à 8/9/10 et retrouvés après rechargement. Captures examinées.':'Parcours E2E sous e2e/campagneDeRecetteRuneQuest.spec.ts ; consulter le diagnostic de lancement pour son état réel.'}
- GM-05 : ${e?(fuite?'ÉCHEC conservé dans le test et le rapport':'aucun marqueur reçu dans cette exécution'):'NON VÉRIFIÉ'}. Voir ANOMALIES-CONNUES.md.
- **${i.casDeRecette} cas humains NON TESTÉS**, CSV vierge. Aucun essai matériel ni partie complète annoncé.

La compilation npm.cmd run build (dont tsc -b) a réussi le 30/10/2026. Les avertissements de taille/imports Vite ne sont pas des erreurs de compilation. Aucune modification de src/, electron/, du pilote fourni ou des données personnelles.

Sources : pilote RuneQuest 2.0.0 et gabarit 313 champs de l’export corrigé, 17 fichiers de règles relus, manuel et correspondance runequest-fr. Empreintes détaillées dans provenance.json. Date fixe de génération : 2026-10-30T12:00:00.000Z. Ce rapport distingue l’exécution automatique de la recette humaine.
`);
const reproduction=path.join(dossier,'reproduction');fs.mkdirSync(reproduction,{recursive:true});
for(const nom of ['runequest.mjs','runequest-scenario.mjs','runequest-recette.mjs','runequest-visuels.mjs','runequest.test.ts','vitest-runequest.config.mts','emballer-runequest.mjs','archives-de-recette.mjs','charger-typescript.mjs']){
 const source=path.join('outils/campagnes-de-recette',nom);if(fs.existsSync(source))fs.copyFileSync(source,path.join(reproduction,nom));
}
fs.copyFileSync('e2e/campagneDeRecetteRuneQuest.spec.ts',path.join(reproduction,'campagneDeRecetteRuneQuest.spec.ts'));
ecrire('reproduction/LIRE-MOI.md','Sources à replacer à leurs chemins indiqués dans REPRODUIRE.md, au sein du dépôt GM-OS avec ses dépendances déjà installées. Elles utilisent les types/fonctions réels et le relevé joueurs autorisé du dépôt. Aucun ancien contenu de campagne ou export personnel n’est inclus. Ce dossier n’est pas un exécutable autonome.');
const zip=new AdmZip();
function ajouter(rep,prefixe=''){for(const x of fs.readdirSync(rep,{withFileTypes:true})){const relatif=path.posix.join(prefixe,x.name),complet=path.join(rep,x.name);if(x.isDirectory())ajouter(complet,relatif);else if(!relatif.endsWith('.zip'))zip.addFile(relatif,fs.readFileSync(complet));}}
ajouter(dossier);for(const entree of zip.getEntries())entree.header.time=new Date('2026-10-30T12:00:00.000Z');
const cible=path.join(dossier,'RuneQuest-Campagnes-de-recette.zip');zip.writeZip(cible);
const controle=new AdmZip(cible);for(const a of i.archives)assert.equal(empreinte(controle.readFile(a.fichier)),a.sha256);
console.log(JSON.stringify({zip:cible,octets:fs.statSync(cible).size,fichiers:controle.getEntryCount(),tests:u.numPassedTests,casHumains:i.casDeRecette,importNatif:!!e,anomalieGM05:fuite,sha256:empreinte(fs.readFileSync(cible))},null,2));
