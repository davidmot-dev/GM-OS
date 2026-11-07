import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dossier='output/clips/crimes', rapport=JSON.parse(fs.readFileSync(`${dossier}/verification.json`,'utf8'));
const controle=JSON.parse(fs.readFileSync(`${dossier}/controle-video.json`,'utf8'));
if(rapport.modeRapide||!rapport.exportVideo.mp4)throw new Error('Le tournage normal est requis.');
const secondes=Math.round(controle.dureeSecondes),duree=`${Math.floor(secondes/60)} min ${String(secondes%60).padStart(2,'0')}`;
const lien='../../output/clips/crimes-mecanismes.mp4';
const manuel='documentation/User Guides/54-Jeu-Crimes.md';
let t=fs.readFileSync(manuel,'utf8');
t=t.replace('## Le test : Potentiel GARDE Compétence',`## Le clip des mécanismes particuliers — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres, curseur et légendes françaises,
sans voix. Jet et garde choisie, dépassement, atteintes et récupération, psychologie,
dossier d’enquête, combat et munitions, contacts/fortune, création et développement.
Affaire et personnages fictifs, dés préparés, vrais gestes dans une instance jetable.
[Repères des chapitres](../../output/clips/crimes/chapitres.md).

## Le test : Potentiel GARDE Compétence`);
fs.writeFileSync(manuel,t);
const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
t=fs.readFileSync(synthese,'utf8');
t=t.split('\n').map(l=>l.startsWith('| [Crimes]')?l.replace('(registre § 157–161)',`(registre § 157–161) ; [clip des mécanismes (${duree})](${lien}) livré le06/11, §217`):l).join('\n');
t=t.replace(/## Crimes\r?\n/,`## Crimes\n\n**Clip Playwright livré le06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres sur les mécanismes propres au jeu, légendes françaises et dés préparés. Parcours en profil jetable, quinze images de scènes et dix-huit images du film relues ; [repères et rapport](../../output/clips/crimes/README.md), registre §217. Pilote inchangé ; un défaut d’aperçu après application des dégâts est consigné séparément au §1bis.\n`);
fs.writeFileSync(synthese,t);
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';
t=fs.readFileSync(registre,'utf8');const cle="## La vue d'un coup d'œil",i=t.indexOf(cle);
if(i<0||t.includes('### 217 ·'))throw new Error('Revoir la numérotation du registre.');
const section=`### 217 · Clip Playwright — mécanismes de Crimes — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Crime ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM, repères et rapports dans output/clips/crimes/. Huit chapitres, curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipCrimes.spec.ts, affaire et personnages fictifs, pilote complet retrouvé dans scratch/recette-pilotes et copié sans modification dans output/clips/crimes/pilote/. Archive étiquetée1.0.0, blocs complets présents. Garde choisie, dépassement, atteintes/repos, psychologie, indices privés puis partagés, attaque/munitions, contacts/fortune et développement.
- **Vérifié :** construction avant essais, lint propre, répétition accélérée puis tournage normal réussis ; dix-sept assertions de fiches/indices, quinze images de scènes et dix-huit images du MP4 relues, début et fin compris. Manuel et synthèse liés au film ; tests finaux du manuel consignés au rapport.
- **Défaut distinct :** après deux blessures appliquées, l’aperçu recalcule4 sur la cible diminuée, mais le reçu et la fiche gardent2, Physique3. Constat au §1bis, aucun correctif source. Le film montre le calcul avant application puis le suivi réel sur Combat-OS.
- **Reprendre :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-crimes.md). Aucun src/electron modifié, paquet installé ou profil personnel utilisé. Services locaux en profil jetable déjà autorisés. Aucun commit/push demandé pour ce clip ; les sorties Nephilim restent conservées.

`;
let tableau=t.slice(i);tableau=tableau.replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| 153 | **Clip des mécanismes de Crimes** | 🟢 §217 ; MP4 ${duree}, huit chapitres, tournage et images vérifiés —06/11 | Ouvrir le MP4 ; défaut d’aperçu distinct au §1bis | Rien pour le clip |`);
fs.writeFileSync(registre,t.slice(0,i)+section+tableau);
controle.relecture='15 images de scènes et 18 images du MP4 examinées ; début/fin et huit chapitres compris.';
controle.build='npm run build : réussi avant les essais';controle.lint='eslint e2e/clipCrimes.spec.ts : réussi';
const pilote=`${dossier}/pilote/Crime_driver_gmos_complet.gmos-driver`,octets=fs.readFileSync(pilote);
controle.pilote={origine:'scratch/recette-pilotes/Crime_driver_gmos_complet.gmos-driver',copie:pilote,versionHistorique:rapport.version,sha256:crypto.createHash('sha256').update(octets).digest('hex'),copieIdentique:octets.equals(fs.readFileSync('scratch/recette-pilotes/Crime_driver_gmos_complet.gmos-driver')),modifie:false};
controle.limites=['pas de transport Hub rejoué','aperçu des dégâts recalculé après application : §1bis, reçu et marques corrects','le seuil de fortune10 est le choix de David'];
fs.writeFileSync(`${dossier}/controle-video.json`,JSON.stringify(controle,null,2)+'\n');
const reprise='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-crimes.md';
t=fs.readFileSync(reprise,'utf8').replace('Film prévu :',`Film livré : **${duree}, H.264, 1440 × 900**,`);
t=t.replace('Le tournage normal, le format du MP4, les images et le contrôle final du manuel seront\nconsignés après export.', 'Tournage normal réussi, MP4 exporté sans chargement initial ; quinze images de scènes et dix-huit images du film relues, titres compris. Format et contrôle final du manuel consignés au rapport.');
fs.writeFileSync(reprise,t);
fs.writeFileSync(`${dossier}/README.md`,`# Clip Crimes — ${duree}

[Ouvrir le MP4](../crimes-mecanismes.mp4) · [Tournage WebM](../crimes-mecanismes.webm) · [Repères des huit chapitres](chapitres.md)

Demandé par David le06/11/2026, filmé avec Playwright dans GM-OS. H.264, 1440 × 900,
curseur et légendes françaises, sans voix ni musique. Affaire et personnages fictifs,
dés préparés pour des exemples reproductibles. Aucun profil personnel utilisé.

Jet Potentiel GARDE Compétence et spécialisation ; garde choisie ; dépassement ;
atteintes/repos ; psychologie ; dossier d’enquête et indices privés puis partagés ;
combat/munitions ; contacts/fortune ; tempérament et développement.

Scénario : e2e/clipCrimes.spec.ts ; pilote complet conservé dans pilote/ (étiquette historique1.0.0),
identique à l’archive de recette. Aucun pilote ni code applicatif modifié.
Construction et lint réussis, répétition et tournage normal réussis ; dix-sept assertions
sur les changements réels, quinze scènes et dix-huit images du MP4 relues.
Rapports : verification.json (parcours/repères), controle-video.json (format/provenance/relecture).

Un défaut d’aperçu est consigné au registre §1bis : après deux blessures appliquées,
l’aperçu recalcule4 sur le Physique diminué, alors que le reçu et les marques restent2.
Le film montre le calcul avant le coup puis le plateau avec Physique3 confirmé.
Pas de correctif source dans cette livraison vidéo. Les transports Hub ne sont pas rejoués.
Le seuil de fortune10 est présenté comme le choix de David.

Pour refaire : npm run build, puis npx playwright test e2e/clipCrimes.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun paquet installé,
aucun commit/push demandé pour cette livraison. Les sorties Nephilim sont conservées.
`);
console.log(duree);
