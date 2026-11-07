import fs from 'node:fs';
import crypto from 'node:crypto';
const dossier='output/clips/star-trek',r=JSON.parse(fs.readFileSync(`${dossier}/verification.json`,'utf8')),c=JSON.parse(fs.readFileSync(`${dossier}/controle-video.json`,'utf8'));
if(r.modeRapide||!r.exportVideo.mp4)throw new Error('Tournage normal requis.');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/star-trek-mecanismes-et-modules.mp4';
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(registre,'utf8');const cle="## La vue d'un coup d'œil",i=t.indexOf(cle);
if(i<0||t.includes('### 223 ·'))throw new Error('Revoir le numéro du registre.');
const section=`### 223 · Clip Playwright — Star Trek, LCARS et Opérations — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Star Trek en intégrant également les modules du jeu si nécessaire ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM, huit chapitres et rapports dans output/clips/star-trek/. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipStarTrek.spec.ts ; T’Vael, Rin Sol et mission fictifs, pilote 2.0.0 inchangé. Spécialisation, achat en Menace et complication ; assistant, aide native du vaisseau et Occasion parfaite ; Stress, Protection, blessure et soin confirmé ; Réputation ; deux modules.
- **LCARS :** préparation des postes Science/Médecine et accès distinct ; vrai client Hub HTTP/WebSocket, sans appBridge, intégré à une iframe de tournage. Intervention scientifique reçue dans l’état natif ; rapport privé reçu dans le client ; alerte rouge reçue. Ni faux écran ni calcul automatique de dégâts/soins dans LCARS.
- **Opérations :** vaisseaux fictifs préparés avant le titre ; dégâts appliqués après réussite annoncée à la table : 16 − Résistance4, Boucliers15 → 3, secousse et brèche. Tâche étendue : Fonction4 − obstacle1 = trois coches sur six ; défi et intervalles6 → 4.
- **Vérifié :** build, lint, répétition et tournage normal réussis ; assertions sur Impulsion/Menace, Détermination, Stress, états natifs des modules et réception Hub. Quinze scènes et dix-huit images du MP4 relues, titres compris ; format ffprobe contrôlé. Manuel et synthèse liés ; tests du manuel consignés au rapport.
- **Reste :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-star-trek.md). Sélection de mécanismes : alternance des camps, toutes les consoles LCARS, son/médias privés, import/rechargement et appareils physiques non rejoués ; jet médical et jet d’attaque spatiale supposés résolus à la table. Les essais matériels LCARS restent ouverts. Aucun code applicatif ou pilote modifié, paquet installé ou profil personnel utilisé. Services jetables déjà autorisés ; aucun commit/push demandé. Films précédents et changements étrangers conservés.

`;
const fin=t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| 159 | **Clip Star Trek et modules** | 🟢 §223 ; MP4 ${duree}, huit chapitres, LCARS/Hub et Opérations vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip ; essais physiques distincts |`);fs.writeFileSync(registre,t.slice(0,i)+section+fin);
const manuel='documentation/User Guides/54-Jeu-Star-Trek.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw new Error('Clip déjà lié.');
t=t.replace("## L'Impulsion et la Menace",`## Le clip des mécanismes et des modules — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres, légendes françaises, sans voix.
2d20, spécialisation, Menace et Impulsion ; assistance et Détermination ; Stress/blessures ; Réputation.
Les modules **LCARS — Passerelle** et **Bataille spatiale et tâches étendues** montrent affectations,
accès, intervention/réponse privée et alerte dans le vrai Hub, puis Boucliers, brèche, tâche et défi.
Équipage fictif, dés préparés et profil jetable ; Hub intégré au cadre de tournage.
[Repères des chapitres](../../output/clips/star-trek/chapitres.md). Les essais matériels restent distincts.

## L'Impulsion et la Menace`);fs.writeFileSync(manuel,t);
const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synthese,'utf8');
t=t.split('\n').map(l=>l.startsWith('| [Star Trek Adventures]')?l.replace('**essai de David validé le 24/10** |',`**essai de David validé le 24/10** ; [clip des mécanismes et modules (${duree})](${lien}) livré le 06/11 (§223) |`):l).join('\n');
t=t.replace(/## Star Trek Adventures\r?\n/,`## Star Trek Adventures

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres sur 2d20/spécialisation, Menace et Impulsion, assistance/aide du vaisseau/Détermination, Stress et blessures, Réputation, puis LCARS (postes, accès, intervention/réponse privée et alerte dans le vrai Hub) et Opérations (Boucliers, brèche, tâche étendue et défi). Légendes françaises et dés préparés ; [repères et vérifications](../../output/clips/star-trek/README.md), registre §223. Quinze scènes et dix-huit images du MP4 relues. Pilote inchangé ; sélection de mécanismes, sans recette exhaustive, son ou appareil physique. Les essais matériels LCARS restent à faire.
`);fs.writeFileSync(synthese,t);
c.relecture='15 images de scènes et 18 images du MP4 examinées ; titres et huit chapitres compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipStarTrek.spec.ts : réussi';
const pilote=`${dossier}/pilote/Star-Trek-2.0.0.gmos-driver`;c.pilote={archive:pilote,origine:'scratch/recette-pilotes/ST_driver_gmos_finir.gmos-driver',version:r.version,sha256:crypto.createHash('sha256').update(fs.readFileSync(pilote)).digest('hex'),modifie:false};
c.hub='Vrai client HTTP/WebSocket dans iframe de tournage, sans appBridge ; aucun appareil physique.';
c.limites=['Sélection de mécanismes ; pas de recette exhaustive','Alternance, toutes les consoles, son, médias privés et import/rechargement non rejoués','Jets médical et spatial supposés résolus à la table avant confirmation','Fiction et vaisseaux préparés avant le titre ; dés préparés'];fs.writeFileSync(`${dossier}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-star-trek.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario e2e/clipStarTrek.spec.ts,',`[MP4 livré de ${duree}](${lien}), H.264, 1440 × 900. Scénario e2e/clipStarTrek.spec.ts,`);
t=t.replace(/Finir la répétition,[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; quinze scènes et dix-huit
images du film relues. Rapports, provenance et repères dans output/clips/star-trek/ ; manuel,
synthèse et registre §223 mis à jour. Pour refaire : npm run build puis
npx playwright test e2e/clipStarTrek.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_STAR_TREK changent
sortie et archive. Services locaux déjà autorisés ; aucun commit/push demandé.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${dossier}/README.md`,`# Clip Star Trek — ${duree}

[Ouvrir le MP4](../star-trek-mecanismes-et-modules.mp4) · [WebM](../star-trek-mecanismes-et-modules.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur,
surlignages et légendes françaises, sans voix ni musique. T’Vael, Rin Sol, mission et
vaisseaux sont fictifs ; dés préparés pour rendre les exemples reproductibles.

2d20, spécialisation, Impulsion et paiement choisi en Menace ; complication repoussée ;
assistant, aide du vaisseau et Occasion parfaite ; Stress, Protection, blessure et soin
confirmé ; Réputation et Gloire. Le module LCARS montre affectations et accès distincts,
intervention scientifique, réponse privée reçue et alerte rouge. C’est le vrai Hub HTTP/WebSocket,
sans appBridge, dans une iframe du cadre de tournage. La préparation de fiction et les
vaisseaux ont été installés par les commandes natives avant le titre.

Le module Opérations applique les dégâts après une réussite supposée résolue à la table :
16 − Résistance4, Boucliers15 → 3, secousse et brèche. La tâche étendue coche Fonction4
moins obstacle1 ; le défi passe de six à quatre intervalles après une tâche.

Sélection de mécanismes : toutes les consoles LCARS, l’alternance des camps, le son,
les médias privés, l’import/rechargement et les appareils physiques ne sont pas rejoués.
Les jets médical et d’attaque spatiale sont supposés résolus à la table avant confirmation.
LCARS ne calcule ni jet, dégât ni soin. Les essais matériels restent distincts.

Scénario : e2e/clipStarTrek.spec.ts ; pilote 2.0.0 existant copié à l’identique dans pilote/.
Build, lint, répétition et tournage normal réussis ; assertions sur les fiches, réserves,
états natifs des modules et réception Hub. Quinze scènes et dix-huit images du MP4 relues.
Rapports : verification.json et controle-video.json. Aucun profil personnel utilisé,
paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipStarTrek.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
`);console.log(duree);
