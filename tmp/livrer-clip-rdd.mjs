import fs from 'node:fs';
import crypto from 'node:crypto';
const dossier='output/clips/rdd',r=JSON.parse(fs.readFileSync(`${dossier}/verification.json`,'utf8')),c=JSON.parse(fs.readFileSync(`${dossier}/controle-video.json`,'utf8'));
if(r.modeRapide||!r.exportVideo.mp4)throw new Error('Tournage normal requis.');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/reve-de-dragon-mecanismes-et-tmr.mp4';
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(registre,'utf8');const cle="## La vue d'un coup d'œil",i=t.indexOf(cle);
if(i<0||t.includes('### 221 ·'))throw new Error('Revoir le numéro du registre.');
const section=`### 221 · Clip Playwright — Rêve de Dragon et TMR — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Rêves de Dragon en intégrant également les modules du jeu », puis « continue ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM, huit chapitres et rapports dans output/clips/rdd/. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipReveDeDragon.spec.ts, pilote2.0.0 inchangé, Nitouche et un Groin fictifs. Table de résolution et degrés, fatigue/entraînement, sept phases de Combat-OS, Château Dormant/potion/famine ; puis le module rdd-tmr : accès, carte officielle, montée, trajet G4–H4–I4–J4, rencontre préparée/révélée et maîtrise sur la fiche, sort en réserve, note et journal.
- **Raccord TMR :** chaque trajet est prévisualisé puis payé sur la vraie fiche ; assertions sur rêve et fatigue après confirmation. Le module conserve position et notes, sans réserve parallèle. Le sort est payé dans Haut-Rêve avant la note sur la carte ; la sortie conserve le demi-rêve à J4.
- **Vérifié :** build complet, lint, répétition et tournage normal réussis ; assertions sur compteurs de fiche et état natif du module. Treize scènes et dix-huit images du MP4 relues, titres compris ; format contrôlé par ffprobe. Manuel et synthèse liés au film ; contrôles du manuel consignés au rapport.
- **Limites et reprise :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-rdd.md). Sélection de mécanismes, pas une recette exhaustive : transport Hub, rechargement et tablettes physiques non rejoués. Aucun code applicatif/pilote modifié, paquet installé ou profil personnel utilisé. Services jetables déjà autorisés ; aucun commit/push demandé. Films précédents et chantiers étrangers conservés.

`;
let fin=t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| 157 | **Clip Rêve de Dragon et TMR** | 🟢 §221 ; MP4 ${duree}, huit chapitres, tournage et images vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip |`);
fs.writeFileSync(registre,t.slice(0,i)+section+fin);
const manuel='documentation/User Guides/54-Jeu-Reves-de-Dragons.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes et du module TMR'))throw new Error('Clip déjà lié.');
t=t.replace('## La fiche du Voyageur — reprise et calculs',`## Le clip des mécanismes et du module TMR — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres avec légendes françaises, sans voix.
Table de résolution, fatigue/entraînement, phases du round, Château Dormant et Haut-Rêve,
avec le module **Terres Médianes du Rêve** : accès, carte, montée et déplacements,
débit réel sur la fiche, rencontre et maîtrise, sort en réserve, notes et journal.
Nitouche et son adversaire sont fictifs ; profil jetable et dés préparés.
[Repères des chapitres](../../output/clips/rdd/chapitres.md).

## La fiche du Voyageur — reprise et calculs`);fs.writeFileSync(manuel,t);
const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synthese,'utf8');
t=t.split('\n').map(l=>l.startsWith('| [Rêve de Dragon]')?l.replace(' (§ 181) |',` (§ 181) ; [clip des mécanismes et TMR (${duree})](${lien}) livré le 06/11 (§221) |`):l).join('\n');
t=t.replace(/## Rêve de Dragon\r?\n/,`## Rêve de Dragon

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres : résolution, fatigue/entraînement, sept phases, Château Dormant, module TMR avec raccord des coûts, rencontre/maîtrise et sort en réserve. Légendes françaises et dés préparés ; [repères et vérifications](../../output/clips/rdd/README.md), registre §221. Treize scènes et dix-huit images du MP4 relues. Pilote inchangé ; les essais de ce clip ne remplacent pas la recette exhaustive ou les essais humains.
`);fs.writeFileSync(synthese,t);
c.relecture='13 images de scènes et 18 images du MP4 examinées ; titres et huit chapitres compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipReveDeDragon.spec.ts : réussi';
const pilote='output/campagnes-tests/reve-de-dragon/Reve-de-Dragon-2.0.0.gmos-driver';c.pilote={archive:pilote,version:r.version,sha256:crypto.createHash('sha256').update(fs.readFileSync(pilote)).digest('hex'),modifie:false};
c.limites=['Sélection de mécanismes ; pas de recette exhaustive','pas de transport Hub, rechargement ou tablette physique rejoué','fiche fictive préparée avant le titre, dés et saisies de dés préparés'];fs.writeFileSync(`${dossier}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-rdd.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario e2e/clipReveDeDragon.spec.ts,',`[MP4 livré de ${duree}](${lien}), H.264, 1440 × 900. Scénario e2e/clipReveDeDragon.spec.ts,`);
t=t.replace(/Finir la répétition[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; treize scènes et dix-huit
images du MP4 relues. Format, provenance et repères dans output/clips/rdd/ ; manuel et
synthèse liés, registre §221. Pour refaire : npm run build puis
npx playwright test e2e/clipReveDeDragon.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_RDD changent
sortie et archive. Services locaux jetables déjà autorisés ; aucun commit/push demandé.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${dossier}/README.md`,`# Clip Rêve de Dragon et TMR — ${duree}

[Ouvrir le MP4](../reve-de-dragon-mecanismes-et-tmr.mp4) · [Tournage WebM](../reve-de-dragon-mecanismes-et-tmr.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur et
légendes françaises, sans voix ni musique. Nitouche et son adversaire sont fictifs ;
dés préparés et résultats de dés de table saisis pour rendre les exemples reproductibles.

Table de résolution et degrés du d100 ; fatigue et entraînement ; sept phases de Combat-OS ;
Château Dormant, potion et famine. Le module Terres Médianes du Rêve montre accès, carte,
montée et trajet G4–H4–I4–J4. Le raccord inscrit rêve/fatigue sur la vraie fiche après aperçu.
Une rencontre publiée bloque le déplacement, puis se résout sur la fiche Haut-Rêve.
Tympan d’Hypnos est payé et placé en réserve dans le livret avant d’être noté sur la carte.
Le carnet n’a pas de réserve parallèle ; la sortie conserve le demi-rêve et son journal.

Sélection de mécanismes : la santé complète, les recours, l’astrologie et le calendrier
ne font pas partie de ce parcours. Transport Hub, rechargement et matériel physique
ne sont pas rejoués. Les arbitrages narratifs restent au gardien.

Scénario : e2e/clipReveDeDragon.spec.ts ; pilote2.0.0 existant dans output/campagnes-tests/reve-de-dragon/,
inchangé. Build, lint, répétition et tournage normal réussis ; assertions sur effets réels,
treize scènes et dix-huit images du film relues. Rapports : verification.json, controle-video.json.
Aucun profil personnel utilisé, paquet installé ou code applicatif modifié.

Pour refaire : npm run build puis npx playwright test e2e/clipReveDeDragon.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun commit/push demandé ;
films Nephilim, Crimes, Dune et NOC conservés.
`);console.log(duree);
