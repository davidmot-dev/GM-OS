import fs from 'node:fs';
import crypto from 'node:crypto';
const dossier='output/clips/dune';
const rapport=JSON.parse(fs.readFileSync(`${dossier}/verification.json`,'utf8'));
const controle=JSON.parse(fs.readFileSync(`${dossier}/controle-video.json`,'utf8'));
if(rapport.modeRapide||!rapport.exportVideo.mp4)throw new Error('Le tournage normal est requis.');
const secondes=Math.round(controle.dureeSecondes),duree=`${Math.floor(secondes/60)} min ${String(secondes%60).padStart(2,'0')}`;
const lien='../../output/clips/dune-mecanismes-et-modules.mp4';
const manuel='documentation/User Guides/54-Jeu-Dune.md';
let t=fs.readFileSync(manuel,'utf8');
if(t.includes('## Le clip des mécanismes et du module'))throw new Error('Livraison déjà écrite.');
t=t.replace('## Lancer un test',`## Le clip des mécanismes et du module — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres, curseur et légendes françaises,
sans voix. Tests 2d20, achat et aide, Impulsion, Détermination et maximes, progression,
puis le module **Dune : conflits et Maison** : accès des personnages, fiche de Maison,
Menace de séance, cinq arènes, zones reliées, enquête d’intrigue et atouts.
Personnages fictifs de la Maison Vaëlan, dés préparés, actions dans une instance jetable.
[Repères des chapitres](../../output/clips/dune/chapitres.md).

## Lancer un test`);
fs.writeFileSync(manuel,t);
const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
t=fs.readFileSync(synthese,'utf8');
t=t.split('\n').map(l=>l.startsWith('| [Dune]')?l.replace(' (§ 182) |',` (§ 182) ; [clip des mécanismes et du module (${duree})](${lien}) livré le 06/11 (§218) |`):l).join('\n');
t=t.replace(/## Dune\r?\n/,`## Dune

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres sur le pilote et le module existants : 2d20, Impulsion, Détermination/maximes, progression, Maison, accès des personnages, cinq arènes, zones, enquête et atouts. Légendes françaises et dés préparés ; [repères et vérifications](../../output/clips/dune/README.md), registre §218. Pilote inchangé. Le refus de métadonnées Dune structurées par le schéma générique est consigné au §1bis ; ce tournage ne valide pas l’import ou le rechargement.
`);
fs.writeFileSync(synthese,t);
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';
t=fs.readFileSync(registre,'utf8');const cle="## La vue d'un coup d'œil",i=t.indexOf(cle);
if(i<0||t.includes('### 218 ·'))throw new Error('Revoir la numérotation du registre.');
const section=`### 218 · Clip Playwright — Dune, mécanismes et module — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Dune en intégrant également les modules du jeu ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM, repères et rapports dans output/clips/dune/. Huit chapitres, curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipDune.spec.ts, pilote Dune2.0.0 et Maison Vaëlan de la recette existante ; Lysa et deux autres personnages fictifs, dés préparés. Tests, achat/aide, Impulsion/Menace, maximes/Détermination, bafouer/récupérer et progression. Un seul module « Dune : conflits et Maison » porte les cinq arènes, Agent/Architecte, accès, Maison, déplacement adjacent, enquête et atouts.
- **Vérifié :** build avant essais, lint, répétition accélérée puis tournage normal réussis ; assertions sur fiches, réserves, accès et sauvegarde native du module. Douze images de scènes et dix-huit images du MP4 relues, début et fin compris ; format contrôlé par ffprobe. Manuel et synthèse liés au film.
- **Défaut distinct :** DonneesDeFicheSchema refuse _gmos_dune structuré ; constat reproduit au §1bis et dans constat-validation.json. Fixture scalaire puis suivi fictif préparé après hydratation, avant tournage. Aucun correctif source ni essai de réimport/rechargement annoncé ; les transports Hub ne sont pas rejoués.
- **Reprendre :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-dune.md). Aucun src/electron modifié, paquet installé ou profil personnel utilisé. Services locaux en profil jetable déjà autorisés. Aucun commit/push demandé pour ces clips ; Nephilim et Crimes conservés.

`;
let tableau=t.slice(i);tableau=tableau.replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| 154 | **Clip Dune : mécanismes et module** | 🟢 §218 ; MP4 ${duree}, huit chapitres, tournage et images vérifiés —06/11 | Ouvrir le MP4 ; schéma générique distinct au §1bis | Rien pour le clip |`);
fs.writeFileSync(registre,t.slice(0,i)+section+tableau);
controle.relecture='12 images de scènes et 18 images du MP4 examinées ; début/fin et huit chapitres compris.';
controle.build='npm run build : réussi avant les essais';controle.lint='eslint e2e/clipDune.spec.ts : réussi';
const pilote='output/campagnes-tests/dune/Dune-2.0.0.gmos-driver';
controle.pilote={archive:pilote,version:rapport.version,sha256:crypto.createHash('sha256').update(fs.readFileSync(pilote)).digest('hex'),modifie:false};
controle.limites=['pas de transport Hub rejoué','pas de validation import/rechargement : refus _gmos_dune structuré au schéma générique, §1bis','le plateau initial et le suivi fictif sont préparés avant tournage ; les gestes montrés sont natifs'];
fs.writeFileSync(`${dossier}/controle-video.json`,JSON.stringify(controle,null,2)+'\n');
const reprise='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-dune.md';
t=fs.readFileSync(reprise,'utf8').replace('Film prévu :',`Film livré : **${duree}, H.264, 1440 × 900**,`);
t=t.replace(/## Vérifié et à terminer[\s\S]*?## Ne pas repayer/,`## Reprendre

Ouvrir le MP4. Build et lint réussis, répétition puis tournage normal réussis. Douze scènes
et dix-huit images du film relues, début et fin compris. Assertions de fiches, réserves,
accès des trois personnages et état natif du module. Repères, format et provenance dans
output/clips/dune/. Manuel et synthèse reliés ; contrôles finaux consignés au rapport.
Les essais de cette session ne valident pas import/rechargement ou transport Hub.

Pour refaire : npm run build, puis npx playwright test e2e/clipDune.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert à la répétition ; GMOS_SORTIE_CLIP et GMOS_PILOTE_DUNE changent
sortie et archive. Services locaux et essais jetables déjà autorisés ; aucun profil personnel
ni sauvegarde de David utilisés. Aucun commit/push demandé ; Nephilim/Crimes conservés.

## Ne pas repayer`);
fs.writeFileSync(reprise,t);
fs.writeFileSync(`${dossier}/README.md`,`# Clip Dune — ${duree}

[Ouvrir le MP4](../dune-mecanismes-et-modules.mp4) · [Tournage WebM](../dune-mecanismes-et-modules.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026 dans GM-OS. H.264, 1440 × 900,
curseur et légendes françaises, sans voix ni musique. Fiction de la Maison Vaëlan,
trois personnages fictifs, dés préparés pour rendre les exemples reproductibles.

Compétence + Principe, spécialisation, achat en Menace et aide ; Impulsion normale/bonus,
complication, dépenses et reliquat ; Détermination et maximes, bafouer puis récupérer ;
gain et acquisition de progression. Le module natif « Dune : conflits et Maison » montre
accès des personnages, fiche de Maison et Menace de séance, cinq arènes, Agent/Architecte,
liaisons et déplacements des atouts, deux tests d’enquête pour découvrir un désir,
neutralisation/destruction et changement de scène. Les décisions narratives restent au MJ.

Scénario : e2e/clipDune.spec.ts. Pilote2.0.0 existant dans output/campagnes-tests/dune/,
inchangé. Un seul module couvre les cinq arènes. Plateau et suivi fictifs préparés avant
le film ; les clics filmés exécutent les commandes natives.

Construction, lint, répétition et tournage normal réussis ; assertions sur les effets réels,
douze scènes et dix-huit images du MP4 relues. Rapports : verification.json (parcours et repères),
controle-video.json (format, provenance et relecture), constat-validation.json (défaut distinct).

DonneesDeFicheSchema refuse actuellement _gmos_dune structuré : constat au registre §1bis.
La semence du tournage est scalaire ; le suivi est préparé après hydratation uniquement
dans ce profil fictif. Import/rechargement et transports Hub ne sont pas validés par ce clip.
Aucun correctif applicatif, paquet installé ou profil personnel utilisé.

Pour refaire : npm run build, puis npx playwright test e2e/clipDune.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun commit/push demandé
pour cette livraison. Les films Nephilim et Crimes sont conservés.
`);
console.log(duree);
