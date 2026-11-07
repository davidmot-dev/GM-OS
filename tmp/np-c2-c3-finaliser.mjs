import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dossier='output/verification-np-c2-c3';
const jeux=['runequest','degenesis','coc','shadowrun-anarchy'];
for(const jeu of jeux){
  const droits=JSON.parse(fs.readFileSync(`${dossier}/${jeu}-droits.json`,'utf8'));
  const reprise=JSON.parse(fs.readFileSync(`${dossier}/${jeu}-reprise.json`,'utf8'));
  if(droits.refus.length!==4||!droits.ecriturePropre||!droits.notesMJProtegees||!droits.persistanceApresRechargement)throw Error('Droits incomplets : '+jeu);
  if(Object.entries(reprise).some(([k,v])=>k!=='jeu'&&v!==true))throw Error('Reprise incomplète : '+jeu);
}
for(const jeu of ['coc','shadowrun-anarchy']){
  const v=JSON.parse(fs.readFileSync(`${dossier}/${jeu}-variantes.json`,'utf8'));
  if(!v.importVariante||!v.retourStandard||!v.personnagesConserves||v.jetsEffectues!==2||!v.persistance)throw Error('Variante incomplète : '+jeu);
}
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const fichiers=fs.readdirSync(dossier).filter(f=>/-(droits|reprise|variantes)\.json$|\.jpg$/.test(f)).sort();
if(fichiers.filter(f=>f.endsWith('.jpg')).length!==8)throw Error('Huit captures attendues.');
const bilan={date:'2026-11-03',base:'0792cb85',parcoursReussis:6,droitsEtReprises:4,variantes:2,
  capturesRelues:8,testsCibles:{fichiers:22,tests:252},typage:true,lint:true,construction:true,
  validationDavid:'ok tout est testé, commit et pousse',
  isolation:'Profils, téléchargements JSON, corpus, sauvegardes et ports de test jetables ; aucune lecture des données personnelles GM-OS.',
  tablettePhysique:'Aucune nouvelle preuve instrumentée sur matériel physique ; validation globale de David conservée séparément.',
  source:{fichier:'e2e/reprisesEtVariantesDesPilotes.spec.ts',sha256:sha('e2e/reprisesEtVariantesDesPilotes.spec.ts')},
  executions:[{selection:'GM-06',reussis:4,duree:'1.4m'},{selection:'importe la variante',reussis:2,duree:'35.3s'}],
  fichiers:fichiers.map(f=>({fichier:f,octets:fs.statSync(path.join(dossier,f)).size,sha256:sha(path.join(dossier,f))}))};
fs.writeFileSync(`${dossier}/verification.json`,JSON.stringify(bilan,null,2)+'\n');
fs.writeFileSync(`${dossier}/README.md`,`# NP-C2 / NP-C3 — preuves du 03/11/2026

Six parcours Electron passent : quatre jeux sur les droits et la reprise des PJ,
puis COC 3d6 et Shadowrun alternatif avec retour au standard. Les huit captures ont été relues.
David valide globalement : « ok tout est testé, commit et pousse ».

Chaque jeu possède un rapport droits et un rapport reprise. L'édition d'autrui
(données, narratif, PV et alias) est refusée ; une propre édition passe et les notes
MJ restent protégées. Après rechargement, les valeurs interdites restent absentes.
Le diagnostic reprend une ancienne valeur fictive par liaison explicite, télécharge
un JSON dans le profil temporaire et restaure depuis ce fichier ; notes, inventaire
et santé sont conservés, y compris après rechargement.

Les deux rapports de variantes attestent l'import/remplacement, deux lancers réels,
le retour au pilote standard et sa persistance. Shadowrun utilise une fixture créée
dans le profil jetable, sans modifier les pilotes officiels du dépôt.

Les jets du panneau du meneur sont vérifiés sur leur résultat visible : ce panneau
écrit au journal, pas dans l'historique useDiceStore réservé ici aux jets distants.
Une compétence fictive nommée est nécessaire au sélecteur Shadowrun. Le bilan Nexus
peut déjà être fermé par la navigation lors de l'activation d'une campagne : sa
fermeture explicite reste conditionnelle dans le test.

Ces trois corrections portent sur le scénario de test ; aucun défaut GM-06 trouvé.
Les premiers échecs de scénario ne sont pas comptés comme des réussites applicatives.
Les traces et journaux bruts restent sous tmp/np-c2-c3-e2e-* ; les preuves durables,
comptes et SHA-256 sont dans verification.json.

252 tests ciblés sur 22 fichiers, types, lint et construction passent. Aucun accès
aux données personnelles, installation, génération par IA ou appareil réel utilisé.
La validation humaine est celle de David ; aucune nouvelle preuve instrumentée sur
une tablette physique n'est revendiquée. Les rapports historiques restent inchangés.
`);
function modifier(f,transformer){const avant=fs.readFileSync(f,'utf8');execFileSync('C:/Users/david/AppData/Local/Python/pythoncore-3.14-64/python.exe',
  ['-I','-X','utf8','-c','import sys; from pathlib import Path; Path(sys.argv[1]).write_text(sys.stdin.read(), encoding="utf-8")',f],
  {input:transformer(avant),encoding:'utf8'});}
const plan='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
modifier(plan,t=>{
  t=t.replace(/^- \[ \] \*\*NP-C2[^\n]*$/m,'- [x] **NP-C2 · P1 — Anciennes fiches : livré et validé par David le 03/11.** Diagnostic, aperçu, correspondances explicites, export JSON et restauration protégée ; valeurs, notes et PV conservés. Quatre parcours applicatifs passent.');
  t=t.replace(/^- \[ \] \*\*NP-C3[^\n]*$/m,'- [x] **NP-C3 · P1 — Droits et variantes : éprouvés et validés par David le 03/11.** Refus d’éditer autrui sur les quatre jeux et persistance ; COC 3d6 et Shadowrun alternatif importés, jets et retour au standard vérifiés.');
  t=t.replaceAll('NP-C2 livré, NP-C3 préparé, recette applicative à terminer (03/11)','NP-C2/NP-C3 livrés, six parcours applicatifs et validation de David (03/11)');
  t=t.replaceAll('Tests structurels verts ; six essais applicatifs de reprise, droits et variantes préparés mais non exécutés, démarrage local en attente d’autorisation.','252 tests ciblés et six parcours Electron passent ; huit captures relues. **Validation globale de David le 03/11 : « ok tout est testé, commit et pousse »**.');
  t=t.replace(/^\| 🟠 P1 · NP-C2[^\n]*$/m,'| 🟢 P1 · NP-C2 — Anciennes fiches et versions | **Livré et validé par David le 03/11.** Référence sur les nouveaux PJ, diagnostic sans version historique inventée ; correspondances explicites et aperçu. Nexus signale une dépendance différente conservée, même à version identique | Export JSON et restauration protégée ; anciennes clés, notes et santé conservées. **252 tests ciblés, quatre reprises dans Electron avec téléchargement, restauration et rechargement** ; captures relues. [Suivi](2026-11-03-np-c2-c3-reprises-droits-variantes.md) |');
  t=t.replace(/^\| 🟠 P1 · NP-C3[^\n]*$/m,'| 🟢 P1 · NP-C3 — Droits et variantes | **Éprouvé et validé par David le 03/11.** Quatre jeux sur la vraie porte WebSocket : refus d’autrui, propres éditions autorisées, notes MJ protégées et persistance. Aucun bug GM-06 trouvé | Deux parcours supplémentaires : COC 3d6 et Shadowrun alternatif, remplacement/import, jets, retour standard et rechargement ; personnages conservés. Six parcours verts au total et huit captures relues. Validation humaine globale de David ; aucune nouvelle preuve instrumentée de tablette physique. [Suivi](2026-11-03-np-c2-c3-reprises-droits-variantes.md) |');
  t=t.replace('Le diagnostic de reprise est réalisé, les essais applicatifs sont préparés et attendent leur autorisation locale ; choisir ensuite un autre lot restant,','**NP-C2 et NP-C3 livrés, éprouvés et validés le 03/11** ; choisir ensuite un autre lot restant,');
  return t;
});
const guide='documentation/User Guides/';
for(const jeu of ['RuneQuest','Degenesis','COC','Shadowrun-Anarchy']) modifier(guide+`54-Jeu-${jeu}.md`,t=>t.replace('Tests structurels vérifiés ; recette applicative et essai de David encore à faire.',`252 tests ciblés et six parcours Electron passent le 03/11 ; huit captures relues.
Validation globale de David : « ok tout est testé, commit et pousse ».`));
modifier(guide+'53-Les-jeux-et-leurs-mecaniques.md',t=>t.replace('Les essais\napplicatifs des droits et des variantes COC 3d6/Shadowrun alternatif sont préparés, non encore exécutés.','Les six essais\napplicatifs des droits, reprises et variantes COC 3d6/Shadowrun alternatif passent le 03/11 ;\nvalidation globale de David reçue le même jour.'));
modifier(guide+'63-Fiche-de-personnage-HTML.md',t=>t.replace('*NP-C2 : réalisation et tests structurels vérifiés le 03/11/2026 ; essais applicatifs et essai\nde David encore à faire. Aucune campagne personnelle ouverte.*','![Le diagnostic et le retour arrière après une reprise de PJ RuneQuest fictif](captures/fiche-diagnostic-reprise.jpg)\n\n*NP-C2 vérifié le 03/11/2026 : tests structurels et quatre reprises réelles avec restauration\npassent ; huit captures relues sur l’ensemble NP-C2/NP-C3. Validation globale de David :\n« ok tout est testé, commit et pousse ». Aucune campagne personnelle ouverte.*'));
fs.copyFileSync(`${dossier}/runequest-reprise.jpg`,guide+'captures/fiche-diagnostic-reprise.jpg');
fs.copyFileSync(`${dossier}/coc-variante.jpg`,guide+'captures/jeu-coc-3d6.jpg');
fs.copyFileSync(`${dossier}/shadowrun-anarchy-variante.jpg`,guide+'captures/jeu-shadowrun-alternatif.jpg');
modifier(guide+'54-Jeu-COC.md',t=>t.replace("## L'option du 3d6\n", "## L'option du 3d6\n\n![Un jet 3d6 après import et remplacement explicite du pilote](captures/jeu-coc-3d6.jpg)\n\nImport 3d6, lancer et retour au d20 éprouvés le 03/11 ; les personnages et leurs valeurs restent conservés.\n"));
modifier(guide+'54-Jeu-Shadowrun-Anarchy.md',t=>t.replace("## Ce qui n'est pas automatisé",`## L'option de risque alternative

![Les dés spéciaux du risque alternatif après import d’une variante de pilote](captures/jeu-shadowrun-alternatif.jpg)

Une variante de pilote activant la règle de risque alternative affiche les dés spéciaux
à la place des dés de risque (p. 72). L'import avec **Remplacer**, le lancer et le retour
au standard ont été éprouvés le 03/11 sur une copie jetable du pilote ; aucune variante
officielle ajoutée au dépôt. Les personnages et leurs valeurs restent conservés.

## Ce qui n'est pas automatisé`));
modifier('documentation/Planning/2026-08-23-chantiers-gares.md',t=>{
  t=t.replace('**NP-C3 préparé :** six parcours Electron','**NP-C3 éprouvé :** six parcours Electron');
  t=t.replace('protection des notes MJ, persistance et captures. Aucun bug GM-06 confirmé à ce stade.','protection des notes MJ, persistance et captures. Six parcours passent, huit captures relues ; aucun bug GM-06 trouvé.');
  t=t.replace('réussie ; Playwright recense six tests sans les exécuter.','réussie ; six tests Playwright passent (quatre droits/reprises et deux variantes).');
  t=t.replace('- **Reste :** accord demandé pour les services locaux en instance jetable, puis recette\n  applicative et relecture des images ; essai de David et tablette physique NON TESTÉS.\n  Aucun profil personnel lu, installation ou Git d’écriture.', '- **Reste :** aucun développement ou essai NP-C2/NP-C3 en attente ; validation globale de David le 03/11 : « ok tout est testé, commit et pousse ». Aucune nouvelle preuve instrumentée de tablette physique. Aucun profil personnel lu ni installation.');
  t=t.replace('- **Reste :** accord demandé pour les services locaux en instance jetable, puis recette\n  applicative et relecture des images ; essai de David et tablette physique NON TESTÉS.\n  Aucun profil personnel lu, installation ou Git d\'écriture.', '- **Reste :** aucun développement ou essai NP-C2/NP-C3 en attente ; validation globale de David le 03/11 : « ok tout est testé, commit et pousse ». Aucune nouvelle preuve instrumentée de tablette physique. Aucun profil personnel lu ni installation.');
  return t.replace(/^\| 140 \| \*\*NP-C2[^\n]*$/m,'| 140 | **NP-C2 / NP-C3 — fiches, droits, variantes** | 🟢 § 204 ; livré, 252 tests ciblés et six parcours Electron verts ; huit captures relues, validé par David — 03/11 | Commit et push demandés ; puis choisir un autre lot | Rien pour NP-C2/NP-C3 ; aucune nouvelle preuve instrumentée de tablette physique |');
});
modifier('documentation/Planning/2026-11-03-np-c2-c3-reprises-droits-variantes.md',t=>{
  t=t.replace(/## État vérifié[\s\S]*?## NP-C2 — ce qui est réalisé/,`## État vérifié

**NP-C2 et NP-C3 livrés, éprouvés et validés par David le 03/11/2026 :**
« ok tout est testé, commit et pousse ». Autorisation explicite des essais isolés reçue,
y compris Electron hors bac à sable ; **six parcours passent**, huit captures relues.
Aucun défaut GM-06 trouvé. Aucune fiche personnelle lue ou convertie.

## NP-C2 — ce qui est réalisé`);
  t=t.replaceAll('- [ ] Parcours réel','- [x] Parcours réel').replaceAll('- [ ] Captures du panneau','- [x] Captures du panneau').replaceAll('- [ ] Essai de David','- [x] Essai de David');
  t=t.replace('## NP-C3 — parcours préparés','## NP-C3 — parcours éprouvés');
  for(const debut of ['Sur chaque jeu','Autoriser l’édition','Autoriser l\'édition','COC :','Shadowrun :','Lire les captures'])t=t.replace('- [ ] '+debut,'- [x] '+debut);
  t=t.replace('- [ ] Cas humains et tablette physique : **NON TESTÉS**.','- [x] Validation humaine globale de David reçue le 03/11. Aucune nouvelle preuve instrumentée sur tablette physique revendiquée.');
  t=t.replace('- [x] Six tests recensés par Playwright, sans lancement de l\'application :','- [x] Six tests exécutés dans les instances jetables autorisées :');
  t=t.replace('- `npx playwright test e2e/reprisesEtVariantesDesPilotes.spec.ts --list --reporter=list` :\n  **six tests**, syntaxe et découverte vérifiées. Cela **ne vaut pas exécution**.','- Playwright : **quatre parcours droits/reprise verts (1,4 min)**, puis **deux parcours de variantes verts (35,3 s)** ; dernières images et rapports vérifiés.');
  t=t.replace(/## Premier geste de reprise[\s\S]*/,`## Clôture et reproduction

Les six essais sont autorisés et exécutés. David a demandé le commit et le push le 03/11.
Les droits passent par la vraie porte WebSocket et les données survivent au rechargement ;
les reprises téléchargent un JSON dans le profil jetable, le relisent et restaurent les champs.
Les deux variantes lancent réellement et reviennent au standard sans modifier les PJ.

Les corrections de scénario ont rendu conditionnelle la fermeture du bilan Nexus déjà
fermé par la navigation, nommé la compétence fictive Shadowrun et vérifié le résultat visible
du panneau MJ (il consigne au journal, pas dans useDiceStore). Aucun correctif applicatif
supplémentaire n'a été nécessaire. Les premiers échecs ne sont pas annoncés comme verts.

Preuves durables : [rapport](../../output/verification-np-c2-c3/README.md) et
[inventaire SHA-256](../../output/verification-np-c2-c3/verification.json). Huit captures relues,
dont trois reprises dans le manuel. Pour reproduire, construire puis exécuter le seul fichier :

\x60\x60\x60powershell
npm run build
npx playwright test e2e/reprisesEtVariantesDesPilotes.spec.ts --reporter=list
\x60\x60\x60

Le helper isole USERPROFILE, APPDATA, corpus, sauvegardes, téléchargements, coffre et appareils.
Aucune donnée personnelle lue, aucune installation. Les guides 10/12 de l'autre agent restent
hors de cette livraison. Les rapports historiques sont préservés. Aucun autre lot de pilote
n'est engagé automatiquement par cette clôture.
`);
  return t;
});
modifier('documentation/Planning/2026-11-03-etat-et-reprise-codex-np-c2-c3.md',t=>{
  t=t.replace(/NP-C3 : politique existante[\s\S]*?## Pièges et coexistence/,`NP-C3 : politique existante éprouvée par six parcours Electron : quatre jeux sur les droits,
reprise/export/restauration et persistance, puis COC 3d6 et Shadowrun alternatif avec retour
au standard. Aucun bug GM-06 trouvé ; huit captures relues, trois reprises au manuel.

**252 tests ciblés verts sur 22 fichiers**, types, lint et construction finale valides ;
**six parcours applicatifs verts**. Autorisation explicite reçue, instances jetables seulement.
David valide le 03/11 : « ok tout est testé, commit et pousse ». [Suivi et checklist](2026-11-03-np-c2-c3-reprises-droits-variantes.md),
registre § 204, synthèse et manuels 53, 54 des quatre jeux, 63 et 90 actualisés.

## Reprendre

Pas de développement NP-C2/NP-C3 en attente. Commit et push demandés par David ; le push
lance sa validation complète, résultat communiqué après l'envoi. Choisir ensuite le lot
suivant dans la synthèse. La validation humaine globale ne constitue pas une nouvelle preuve
instrumentée sur tablette physique. [Preuves durables](../../output/verification-np-c2-c3/README.md).

## Pièges et coexistence`);
  return t.replace('Pas d’installation ni de Git\nd’écriture pour ce chantier.','Pas d’installation ; Git d’écriture demandé par David le 03/11.').replace('Pas d\'installation ni de Git\nd\'écriture pour ce chantier.','Pas d’installation ; Git d’écriture demandé par David le 03/11.');
});
console.log(JSON.stringify({parcours:6,rapports:10,capturesRelues:8,preuves:dossier}));
