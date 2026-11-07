import fs from 'node:fs';
import crypto from 'node:crypto';
const d='output/clips/degenesis',r=JSON.parse(fs.readFileSync(`${d}/verification.json`,'utf8')),c=JSON.parse(fs.readFileSync(`${d}/controle-video.json`,'utf8'));
if(r.modeRapide||!r.exportVideo.mp4)throw new Error('Tournage normal requis.');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/degenesis-mecanismes-et-outils.mp4';
const reg='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(reg,'utf8');const i=t.indexOf("## La vue d'un coup d'œil");if(i<0||t.includes('### 225 ·'))throw new Error('Vérifier le numéro du registre.');
const section=`### 225 · Clip Playwright — Degenesis — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Degenesis en intégrant également les modules du jeu si nécessaire ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM, huit chapitres et rapports dans output/clips/degenesis/. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipDegenesis.spec.ts, Falberg/Kum/Usudi fictifs, valeurs d’exercice, pilote 2.3.0 inchangé copié depuis Export Dirvers/corriges/. Aucun module indépendant Degenesis au catalogue : outils intégrés filmés.
- **Parcours :** test d’action, Égo et déclencheurs ; maxima ; combinaison, action complexe, confrontation et aide consommée ; adversaire préparé et initiative ; défense active et dégâts nets ; deux pistes de santé et pénalité des Traumatismes ; test du Germe, EX, nouveau jour ; Brûlure d’Argus, bonus d’initiative et Potentiel explicite.
- **Vérifié :** build, lint, répétition et tournage normal réussis. Assertions sur Égo actuel/maximal, aides/reports, dégâts et pistes, Sporulation permanente/EX/stimulation ; seize scènes et dix-huit images du MP4 relues, titres compris, format ffprobe contrôlé. Manuel et synthèse liés ; tests du manuel consignés au rapport.
- **Reste :** ouvrir le film. Le calculateur générique du PJ réduit les PV sans répartir les pistes Degenesis : constat distinct au §1bis ; le film utilise les commandes natives de santé. Voir aussi la [note de reprise](2026-11-06-etat-et-reprise-codex-clip-degenesis.md). Sélection de mécanismes, pas une recette exhaustive : autres défenses/propriétés, exposition, tous les Chakras, chirurgie, fiche HTML, import/rechargement et Hub non rejoués. La jauge Sporulation11/10 est préparée avant le titre ; les nouveaux tests du Germe après l’Argus restent à résoudre. Aucun code applicatif ou pilote modifié, paquet installé ou profil personnel utilisé. Services jetables déjà autorisés ; aucun commit/push demandé. Films précédents et changements étrangers conservés.

`;
const fin=t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| 161 | **Clip Degenesis** | 🟢 §225 ; MP4 ${duree}, huit chapitres, pilote2.3.0 et outils intégrés vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip |`);fs.writeFileSync(reg,t.slice(0,i)+section+fin);
const manuel='documentation/User Guides/54-Jeu-Degenesis.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw new Error('Clip déjà lié.');
t=t.replace("## Le test d'action",`## Le clip des mécanismes — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres avec légendes françaises, sans voix.
Test d’action et Égo ; maxima ; jets liés ; round ; attaque et défense ; santé à deux pistes ;
Sporulation/EX ; Brûlure et Potentiel. Les outils sont intégrés à la fiche et à Combat-OS :
aucun module indépendant Degenesis au catalogue actuel. Personnages fictifs, valeurs d’exercice,
dés préparés et profil jetable ; pilote2.3.0 inchangé, aucun réimport nécessaire pour ce film.
[Repères des chapitres](../../output/clips/degenesis/chapitres.md).

## Le test d'action`);fs.writeFileSync(manuel,t);
const synth='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synth,'utf8');t=t.split('\n').map(l=>l.startsWith('| [Degenesis]')?l.replace('**Fonctions livrées validées par David le 01/11.** |',`**Fonctions livrées validées par David le 01/11.** ; [clip des mécanismes (${duree})](${lien}) livré le 06/11 (§225) |`):l).join('\n');
t=t.replace(/## Degenesis\r?\n/,`## Degenesis

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres sur le pilote2.3.0 : action/Égo, maxima, combinaison/action complexe/confrontation/aide, round, attaque/défense/dégâts nets, deux pistes et Traumatismes, Sporulation/EX, Brûlure/Potentiel. Aucun module indépendant au catalogue ; outils intégrés filmés. Légendes françaises et dés préparés ; [repères et vérifications](../../output/clips/degenesis/README.md), registre §225. Constat distinct du tournage : le calculateur générique réduit les PV du PJ sans répartir ses pistes Degenesis (registre §1bis) ; le film passe par les commandes natives de santé. Seize scènes et dix-huit images du MP4 relues. Pilote inchangé ; sélection de mécanismes, sans recette exhaustive ou Hub rejoué. Les nouveaux tests du Germe après l’Argus sont laissés à la table.
`);fs.writeFileSync(synth,t);
c.relecture='16 scènes et 18 images du MP4 examinées ; titres et huit chapitres compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipDegenesis.spec.ts : réussi';
c.constatHorsLot={description:'Calculateur générique PJ : PV réduits, pistes Degenesis inchangées.',preuve:'constats/calculateur-pj.json',suivi:'registre §1bis',corrige:false};
const pilote=`${d}/pilote/Degenesis-2.3.0.gmos-driver`;c.pilote={archive:pilote,origine:'Export Dirvers/corriges/Degenesis_driver_gmos_finir.gmos-driver',version:r.version,sha256:crypto.createHash('sha256').update(fs.readFileSync(pilote)).digest('hex'),modifie:false};
c.limites=['Sélection de mécanismes, pas une recette exhaustive','Exposition, tous les Chakras, chirurgie, autres défenses/propriétés, fiche HTML et import/rechargement non rejoués','Hub et appareils physiques non rejoués','Sporulation11/10 préparée avant le titre ; nouveaux tests du Germe après Argus laissés à la table','Dés et valeurs d’exercice préparés, sans création novice revendiquée'];fs.writeFileSync(`${d}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-degenesis.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Seize scènes prévues.','Seize scènes filmées.').replace('Scénario e2e/clipDegenesis.spec.ts,',`[MP4 livré de ${duree}](${lien}), H.264, 1440 × 900. Scénario e2e/clipDegenesis.spec.ts,`);
t=t.replace(/Finir la répétition,[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et dix-huit images
du film relues. Rapports et repères dans output/clips/degenesis/ ; manuel/synthèse/registre §225 liés.
Pour refaire : npm run build puis npx playwright test e2e/clipDegenesis.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_DEGENESIS changent sortie/archive.
Services jetables déjà autorisés ; aucun code applicatif modifié, aucun commit/push demandé.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${d}/README.md`,`# Clip Degenesis — ${duree}

[MP4](../degenesis-mecanismes-et-outils.mp4) · [WebM](../degenesis-mecanismes-et-outils.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Falberg, Kum et Usudi sont fictifs,
avec des valeurs d’exercice et dés préparés dans un profil jetable, sans création novice revendiquée.

Test d’action à4+ et déclencheurs ; Égo payé et maxima sans remplissage ; combinaison,
action complexe, confrontation et aide à usage unique ; adversaire autonome préparé ;
initiative et actions ; défense active, une seule armure et dégâts nets ; deux pistes,
Traumatismes et dés perdus ; Germe, EX, nouveau jour ; Argus et Potentiel choisi.
Le catalogue actuel ne contient aucun module indépendant Degenesis : les outils intégrés
de la fiche et de Combat-OS sont filmés. Pilote2.3.0 copié à l’identique dans pilote/ depuis
Export Dirvers/corriges/ ; aucun réimport nécessaire pour le clip.

Sélection de mécanismes : les autres défenses/propriétés, l’exposition, tous les Chakras,
la chirurgie, la fiche HTML, l’import/rechargement et le Hub ne sont pas rejoués. La condition
Sporulation11/10 est préparée avant le titre ; les nouveaux tests du Germe après l’Argus
restent à résoudre. Les durées et effets narratifs sont arbitrés à la table.

Constat distinct : le calculateur générique du PJ réduit les PV sans répartir les pistes
Degenesis. Preuves dans constats/, suivi au registre §1bis ; aucun correctif applicatif dans
ce lot. Le clip utilise les commandes natives de santé qui répartissent bien les blessures.

Scénario : e2e/clipDegenesis.spec.ts. Build, lint, répétition et tournage normal réussis ;
assertions sur les fiches, aides/reports et états du plateau ; seize scènes et dix-huit images
du MP4 relues. Rapports : verification.json et controle-video.json. Aucun profil personnel,
paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipDegenesis.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
`);console.log(duree);
