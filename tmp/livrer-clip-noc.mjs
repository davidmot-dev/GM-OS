import fs from 'node:fs';
import crypto from 'node:crypto';
const dossier='output/clips/noc',r=JSON.parse(fs.readFileSync(`${dossier}/verification.json`,'utf8')),c=JSON.parse(fs.readFileSync(`${dossier}/controle-video.json`,'utf8'));
if(r.modeRapide||!r.exportVideo.mp4)throw new Error('Tournage normal requis.');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/noc-mecanismes-et-outils.mp4';
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(registre,'utf8');const cle="## La vue d'un coup d'œil",i=t.indexOf(cle);
if(i<0||t.includes('### 219 ·'))throw new Error('Revoir le numéro du registre.');
const section=`### 219 · Clip Playwright — NOC et outils de Cabale — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de NOC en intégrant également les modules du jeu ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM, huit chapitres et rapports dans output/clips/noc/. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipNoc.spec.ts, pilote NOC2.0.0 existant, trois Héros fictifs des Veilleurs du Palier. Talent/Domaine, test sans dé, 10 facultatif, Fiel/Menace ; réserves personnelles et apports de Cabale ; effets du Fiel ; pistes/Séquelles ; Extase et Soupçon au repos ; fiche de Cabale et grande Faveur ; Rouage hostile, début de séance et nouveau scénario.
- **Modules :** aucun adaptateur indépendant NOC dans le catalogue actuel. Le film le constate et montre les outils propres au pilote, aux fiches, à Session-OS et à Dice-OS. Aucun module inventé ou ajouté ; les transports Hub ne sont pas rejoués.
- **Vérifié :** build complet, lint, répétition accélérée et tournage normal réussis ; assertions sur fiches, Cabale, Faveurs et réserves de table. Treize images de scènes et dix-huit images du MP4 relues, titres compris ; format contrôlé par ffprobe. Manuel/synthèse liés au film ; tests du manuel consignés au rapport.
- **Reprendre :** ouvrir le MP4 ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-noc.md). Aucun code applicatif ni pilote modifié, aucun paquet installé ou profil personnel utilisé. Services jetables déjà autorisés. Aucun commit/push demandé pour les clips ; films précédents et changements étrangers conservés.

`;
let fin=t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| 155 | **Clip NOC et outils de Cabale** | 🟢 §219 ; MP4 ${duree}, huit chapitres, tournage et images vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip |`);
fs.writeFileSync(registre,t.slice(0,i)+section+fin);
const manuel='documentation/User Guides/54-Jeu-NOC.md';t=fs.readFileSync(manuel,'utf8');
if(t.includes('## Le clip des mécanismes et outils'))throw new Error('Clip déjà lié.');
t=t.replace('## Le Fiel et la Menace — le bandeau des réserves',`## Le clip des mécanismes et outils — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres avec légendes françaises, sans voix.
Talent/Domaine, destin, réserves du Héros et de la Cabale, Fiel/Menace, périls et Séquelles,
Extase/Soupçon au repos, Réseau et Faveurs, Rouage hostile et recharge du scénario.
NOC ne propose actuellement aucun module indépendant dans « Modules du jeu » : ce sont
ses outils intégrés aux fiches, à Session-OS et à Dice-OS qui sont montrés.
Personnages fictifs, profil jetable et dés préparés. [Repères](../../output/clips/noc/chapitres.md).

## Le Fiel et la Menace — le bandeau des réserves`);fs.writeFileSync(manuel,t);
const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synthese,'utf8');
t=t.split('\n').map(l=>l.startsWith('| [NOC]')?l.replace(' (§ 179) |',` (§ 179) ; [clip des mécanismes et outils (${duree})](${lien}) livré le 06/11 (§219) |`):l).join('\n');
t=t.replace(/## NOC\r?\n/,`## NOC

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres sur destin, Fiel/Menace, réserves, Cabale, Séquelles, repos/entraide, Faveurs et Rouage hostile. Légendes françaises, dés préparés ; [repères et vérifications](../../output/clips/noc/README.md), registre §219. Aucun module indépendant NOC dans le catalogue actuel : les outils intégrés sont filmés. Treize scènes et dix-huit images du MP4 relues ; pilote inchangé, pas de transport Hub rejoué.
`);fs.writeFileSync(synthese,t);
c.relecture='13 images de scènes et 18 images du MP4 examinées ; titres et huit chapitres compris.';
c.build='npm run build : réussi avant essais, après écriture concurrente du test bestiaire';c.lint='eslint e2e/clipNoc.spec.ts : réussi';
const pilote='output/campagnes-tests/noc/NOC-2.0.0.gmos-driver';c.pilote={archive:pilote,version:r.version,sha256:crypto.createHash('sha256').update(fs.readFileSync(pilote)).digest('hex'),modifie:false};
c.limites=['Aucun module indépendant NOC au catalogue ; outils du pilote et des fiches filmés','pas de transport Hub ou import/rechargement rejoué','fiches fictives préparées avant le titre, dés préparés'];fs.writeFileSync(`${dossier}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-noc.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario `e2e/clipNoc.spec.ts`,',`[MP4 livré de ${duree}](${lien}), H.264, 1440 × 900. Scénario e2e/clipNoc.spec.ts,`);
t=t.replace(/Terminer la répétition[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis. Treize scènes et dix-huit
images du MP4 relues, titres compris ; format contrôlé. Manuel, synthèse et registre liés.
Pour refaire : npm run build puis npx playwright test e2e/clipNoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_NOC changent
sortie et archive. Services locaux jetables déjà autorisés. Aucun commit/push demandé.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${dossier}/README.md`,`# Clip NOC — ${duree}

[Ouvrir le MP4](../noc-mecanismes-et-outils.mp4) · [Tournage WebM](../noc-mecanismes-et-outils.webm) · [Huit chapitres](chapitres.md)

Demandé et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur et légendes
françaises, sans voix ni musique. Trois Héros fictifs des Veilleurs du Palier et dés préparés.

Talent/Domaine et test sans dé ; 10 facultatif, Fiel et Menace ; Vécu/Espoir/Singularité ;
apports de Cabale ; effets du Fiel ; piste HTML et Séquelle ; Extase donnée à un allié,
Soupçon réparti avant repos ; fiche de Cabale, grande Faveur de plusieurs Contacts ;
Rouage hostile avec bénéficiaire désigné ; début de séance et nouveau scénario.

NOC n’a pas de module indépendant dans le catalogue actuel. Le film montre ce constat
et les outils intégrés au pilote, aux fiches, à Session-OS et à Dice-OS. Aucune fonction
supplémentaire inventée. Les décisions de la Loi restent explicites.

Pilote NOC2.0.0 existant dans output/campagnes-tests/noc/, inchangé. Fiches HTML fictives
créées dans la bibliothèque du profil jetable avant le titre. Aucun profil personnel utilisé,
aucun paquet installé ou code applicatif modifié. Transport Hub et import/rechargement
ne sont pas rejoués. Les films Nephilim, Crimes et Dune sont conservés.

Build, lint, répétition et tournage normal réussis ; assertions sur les effets réels,
treize scènes et dix-huit images du MP4 relues. Rapports : verification.json et controle-video.json.
Pour refaire : npm run build puis npx playwright test e2e/clipNoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun commit/push demandé.
`);console.log(duree);
