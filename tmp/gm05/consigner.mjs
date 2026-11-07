import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='output/verification-gm05',hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const jeux=['runequest','degenesis','coc','shadowrun-anarchy'];
const avant=JSON.parse(fs.readFileSync('tmp/gm05/avant-correction.json','utf8')),unitaire=JSON.parse(fs.readFileSync('tmp/gm05/apres-correction.json','utf8'));
assert.equal(avant.numFailedTests,8);assert.ok(unitaire.success);assert.equal(unitaire.numPassedTests,70);
const rapports=jeux.map(jeu=>{const fichier=dir+'/'+jeu+'.json',r=JSON.parse(fs.readFileSync(fichier,'utf8'));assert.ok(r.reussi&&r.secretsConservesChezLeMJ);assert.equal(r.fuites.length,0);assert.equal(r.publicsRecus,3);assert.equal(r.tablettes.length,3);assert.equal(hash('output/campagnes-tests/'+jeu+'/'+r.archive),r.sha256);return{...r,fichier,rapportSHA256:hash(fichier)};});
const captures=jeux.flatMap(j=>[360,768,1180].map(w=>{const fichier=j+'-'+w+'.jpg';return{fichier,sha256:hash(dir+'/'+fichier)};}));
const sources=['src/modules/remote/logic/caviardageDesJoueurs.ts','src/modules/remote/logic/caviardageDesJoueurs.test.ts','e2e/secretsDeSeance.spec.ts'].map(fichier=>({fichier,sha256:hash(fichier)}));
const preuve={date:'2026-11-01',lot:'NP-C1 / GM-05',autorisationFermeture:'GM-OS est fermé, tu peux corriger',correction:'gmSecrets ajouté aux clés vidées récursivement, filtre commun renderer/serveur/fenêtres publiques ; charge MJ inchangée.',avant:{passes:avant.numPassedTests,echecs:avant.numFailedTests},unitaire:{passes:unitaire.numPassedTests,echecs:unitaire.numFailedTests,fichiers:unitaire.testResults.length},build:{commande:'npm.cmd run build',reussi:true,types:true},lint:{reussi:true,fichiers:sources.map(s=>s.fichier)},applicatif:{tests:4,reussis:4,hubSimules:12,largeurs:[360,768,1180],phases:['initiale','differentielle','reconnexion'],rapports},sources,captures,capturesExaminees:true,limites:['Pas de tablette physique ni essai de David','Fenêtres publiques protégées par le même filtre ; pas de parcours visuel de projecteur','Ne purge pas une ancienne copie déjà envoyée à un appareil : redémarrer la version corrigée et reconnecter les Hub','Recette RuneQuest 2.0.0 : contrôle de confidentialité, pas validation des coups localisés 2.1.0'],isolement:'Helper e2e/lancerGmOs.ts ; profils, USERPROFILE, corpus, coffre, sauvegardes et ports jetables, réseau externe des Hub bloqué, aucun profil GM-OS personnel consulté.'};
fs.writeFileSync(dir+'/verification.json',JSON.stringify(preuve,null,2)+'\n');
fs.writeFileSync(dir+'/RAPPORT.md',`# GM-05 — correction et vérification du 01/11/2026

**Correctif livré, vérifié automatiquement ; essai de David attendu.**
Le texte des secrets de séance reste chez le MJ et devient vide dans les charges pour la table.
Le filtre commun est déjà appelé par le renderer, SyncServer et les fenêtres publiques locales.

- Régression reproduite : 8 assertions en échec avant correction, 19 autres assertions passaient.
- Après correction : **70 tests ciblés passent / 4 fichiers**, zéro échec ; lint ciblé et build/types réussis.
- **4 tests Electron passent**, RuneQuest/Degenesis/COC/Shadowrun, **12 Hub** à 360/768/1180 px.
- Pour chacun : résumé public reçu à l'ouverture, après modification et après reconnexion ; zéro marqueur secret ; quatre secrets de séance conservés dans le magasin MJ.
- Douze captures examinées, aperçu planche-hub.png ; empreintes et détails dans verification.json.

Les rapports et ZIP historiques des campagnes restent inchangés : ils décrivent les échecs
antérieurs. Aucun pilote ni archive à remplacer pour ce correctif de l'application. RuneQuest
est ici testé avec sa recette 2.0.0 : l'alignement 2.1.0 reste un lot distinct.

Redémarrer GM-OS sur la version corrigée puis reconnecter les Hub. Le correctif empêche les
nouveaux envois ; il ne prétend pas effacer une copie ou trace déjà reçue avant correction.
Tablettes physiques, essai de David et fenêtres de projection en parcours visuel restent à faire.

Autorisations : fermeture confirmée par David (« GM-OS est fermé, tu peux corriger »), essais
locaux isolés déjà autorisés pour les quatre lots. Helper jetable, appareils désactivés et
réseau externe des Hub bloqué. Le terminal restreint a été interrompu puis les essais relancés
hors bac à sable ; une première préparation de test a été corrigée pour retirer la démo active
du seul magasin temporaire. Aucun accès aux profils/corpus/sauvegardes personnels.
`);

const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';let s=fs.readFileSync(synthese,'utf8').replaceAll('\r\n','\n');
assert.ok(!s.includes('**GM-05 corrigé le 01/11/2026'));
s=s.replace('## Résumé et plan d’action à cocher — les quatre nouveaux pilotes','## Résumé et plan d’action à cocher — les quatre nouveaux pilotes\n\n**GM-05 corrigé le 01/11/2026 — livré, à essayer par David.** 70 tests ciblés et quatre tests\nElectron passent : douze Hub simulés sans fuite, résumés publics reçus et secrets conservés\nchez le MJ, y compris après reconnexion. [Bilan](2026-11-01-correction-gm05.md), registre § 200.\nLes échecs GM-05 des anciennes recettes restent des constats historiques avant ce correctif.');
s=s.replace('- [ ] **NP-C1 · P0 — GM-05 :** empêcher les secrets de séance d’arriver aux Hub ; refaire les quatre contrôles de confidentialité.','- [ ] **NP-C1 · P0 — GM-05 : livré, à essayer (01/11).** Filtre corrigé ; quatre contrôles applicatifs passent sur douze Hub. Cocher après l’essai de David.');
s=s.split('\n').map(l=>{
 if(l.startsWith('| 🔴 P0 · NP-C1 —'))return '| 🟠 P0 · NP-C1 — Secrets de séance / GM-05 | **Corrigé le 01/11**, § 200 : gmSecrets vidé par le filtre commun, état privé MJ conservé. Les quatre rapports de recette en échec décrivent la version précédente | 70 tests ciblés, build/types et lint passent ; quatre tests Electron sur douze Hub passent, synchronisation initiale/différentielle/reconnexion, résumés publics reçus et zéro fuite. Essai de David/tablette physique attendu ; les archives historiques ne sont pas réécrites |';
 if(['RuneQuest','Degenesis','Chroniques Oubliées Contemporain','Shadowrun Anarchy'].some(n=>l.startsWith('| ['+n+']')))return l.replaceAll('GM-05 commun','GM-05 corrigé, essai attendu').replace('GM-05 et essai de David attendus','GM-05 corrigé ; essai de David attendu');
 return l;
}).join('\n');
s=s.replace('conservent le défaut GM-05. Ne pas relire « rien ne reste » comme une clôture de ces nouveaux cas.','conservent le constat historique GM-05 ; le correctif du 01/11 est vérifié séparément au § 200.\nNe pas relire « rien ne reste » comme une clôture des nouveaux cas encore ouverts.');
s=s.replace('**Ordre conseillé :** NP-C1, preuve RuneQuest alignée (RQ-A1) et information de cible (RQ-A2),','**Suite conseillée :** essai de David sur NP-C1 livré, puis preuve RuneQuest alignée (RQ-A1) et information de cible (RQ-A2),');
fs.writeFileSync(synthese,s);

const registre='documentation/Planning/2026-08-23-chantiers-gares.md';let r=fs.readFileSync(registre,'utf8').replaceAll('\r\n','\n');
assert.ok(!r.includes('### 200 ·'));
r=r.replace('### 1 bis · ⚠️ Constaté, pas encore traité','### 1 bis · ⚠️ Constaté, pas encore traité\n\n**GM-05 — corrigé le 01/11/2026, livré à essayer (§ 200).** Le filtre commun vide désormais\nles secrets de séance ; quatre tests applicatifs passent sur douze Hub (initial/différentiel/\nreconnexion), les résumés publics restent reçus et les secrets du MJ intacts. Les reproductions\nci-dessous sont conservées comme historique avant correction, pas comme état du code corrigé.');
const ajout=`### 200 · Corriger GM-05 — secrets de séance conservés chez le MJ — 01/11/2026

David : « ok commence le point 1 corriger la fuite des secrets », puis « GM-OS est fermé, tu peux corriger ».

- **Livré** : gmSecrets ajouté à la liste récursive des champs vidés dans
  src/modules/remote/logic/caviardageDesJoueurs.ts. Fonction déjà utilisée dans les trois
  sorties renderer/serveur/fenêtres publiques ; aucune modification du pilote ni des données.
- **Régression et vérification** : huit assertions rouges avant correction ; **70 tests / quatre
  fichiers passent** après, lint ciblé et build/types réussis. **Quatre tests Electron passent**
  (e2e/secretsDeSeance.spec.ts), douze Hub 360/768/1180 : zéro marqueur secret en initial,
  différentiel et reconnexion, résumés publics reçus, secrets conservés sur le MJ.
  Douze captures examinées ; rapports/empreintes sous output/verification-gm05/.
- **Isolement** : autorisations d'essais des quatre jeux conservées ; profils, corpus, coffre,
  sauvegardes et ports jetables, appareils désactivés ; aucun accès aux données personnelles.
  Première préparation du test corrigée pour retirer la démo active du magasin temporaire.
- **Reste** : redémarrer la version corrigée et reconnecter les Hub, essai de David et tablette
  physique. La case NP-C1 reste vide avec « livré, à essayer », conformément à sa consigne.
  Les anciens ZIP/rapports restent intacts ; le correctif ne retire pas une copie déjà reçue
  avant correction. Aucun commit demandé. [Bilan](2026-11-01-correction-gm05.md).

`;
r=r.replace("## La vue d'un coup d'œil",ajout+"## La vue d'un coup d'œil");
r=r.replace('| 135 |','| 136 | **GM-05 — secrets de séance** | § 200 ; filtre corrigé, 70 tests ciblés et quatre E2E passent, douze Hub sans fuite — 01/11 | Redémarrer la version corrigée, reconnecter et essayer | Essai de David et tablette physique ; anciens rapports conservés |\n| 135 |');
fs.writeFileSync(registre,r);
const manuel='documentation/User Guides/62-Tablette-des-joueurs-reglages-fins.md';let m=fs.readFileSync(manuel,'utf8');
const phrase='Faites défiler pour lire un résumé long.';assert.ok(m.includes(phrase));
m=m.replace(phrase,phrase+'\n\nLes **Chroniques de séance** transmettent le résumé public. Les secrets de séance restent\nchez le meneur et ne sont pas envoyés aux Hub joueurs. Après une mise à jour de GM-OS,\nreconnectez les Hub pour recevoir la nouvelle synchronisation.');fs.writeFileSync(manuel,m);
console.log(JSON.stringify({testsUnitaires:70,testsApplicatifs:4,hub:12,fuites:0,captures:12}));
