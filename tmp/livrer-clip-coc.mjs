import fs from 'node:fs';
import crypto from 'node:crypto';
const d='output/clips/coc',v=JSON.parse(fs.readFileSync(`${d}/verification.json`)),c=JSON.parse(fs.readFileSync(`${d}/controle-video.json`));
if(v.modeRapide||!v.exportVideo.mp4||c.imagesExtraites.length!==22||!(v.tablette.touchersRecus>7))throw Error('Tournage normal, tactile et contrôle requis');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/coc-mecanismes-et-tablette.mp4';
const reg='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(reg,'utf8');const i=t.indexOf("## La vue d'un coup d'œil");if(i<0||/### \d+ · Clip Playwright — COC et joueur tactile/.test(t))throw Error('Registre à vérifier');
const n=Math.max(...[...t.slice(0,i).matchAll(/^### (\d+) ·/gm)].map(m=>Number(m[1])))+1,m=Math.max(...[...t.slice(i).split('\n').slice(0,190).join('\n').matchAll(/^\| (\d+) \|/gm)].map(m=>Number(m[1])))+1;
const parcours='test d20, conditions et dés bonus/malus ; héros après test et DEF héroïque consommée ; Voie de Furtivité référencée et rang acquis ; choc de rang2, Enragé, Fascination et Blues conservé ; Figurant Pulp et bande ; critique fixe, RD et conséquence de santé ; joueur tactile sur le Hub ; réception MJ et fiche HTML synchronisée';
const limites='Sélection de mécanismes, sans recette exhaustive : variante3d6, tous les états/Voies, Légende, poursuites, soins et thérapie, import/rechargement non rejoués. Valeurs et dés d’exercice préparés. Le résultat de CON du guetteur est renseigné comme joué à la table. Aucun appareil physique utilisé.';
const tablette=`Vrai Hub HTTP/WebSocket dans un navigateur Edge jetable, contexte mobile/tactile, écran768×1024 sans appBridge ; ${v.tablette.touchersRecus} événements touchstart reçus. Choix de Furtif, jet reçu au MJ, héros11→10, puis échelle9 enregistrée depuis la fiche HTML et reçue chez le meneur. Le cadre de tournage affiche les réceptions après assertions sur les magasins réels ; aucune fausse interface Hub.`;
const section=`### ${n} · Clip Playwright — COC et joueur tactile — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de COC en intégrant également les modules du jeu si nécessaire, est-ce que tu peux simuler les gestes d'un joueurs sur une tablette ? ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440×900 ; WebM monté, [huit chapitres](../../output/clips/coc/chapitres.md), rapports et tournages bruts. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Parcours :** ${parcours}. Scénario e2e/clipCoc.spec.ts ; pilote2.2.0 d20 inchangé copié depuis Export Dirvers/corriges/coc/. Aucun module indépendant COC au catalogue : outils intégrés filmés.
- **Tablette :** ${tablette}
- **Vérifié :** build, lint, répétition et tournage normal réussis ; assertions sur héros/DEF, Voies, choc/Blues, bande, DM/RD et santé, historique/journal et fiche côté MJ. Seize scènes et vingt-deux images du MP4 relues, titres et deux raccords compris ; ffprobe contrôlé. Tests du manuel au rapport. Montage reproductible : outils/clips/monter_clip_coc.mjs.
- **Reste :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-coc.md). ${limites} Aucun code applicatif ou pilote modifié, paquet installé ou profil personnel utilisé. Services locaux jetables déjà autorisés ; aucun commit/push demandé. Clips précédents et changements étrangers conservés.

`;
fs.writeFileSync(reg,t.slice(0,i)+section+t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| ${m} | **Clip COC et joueur tactile** | 🟢 §${n} ; MP4 ${duree}, huit chapitres et vrai Hub tactile → MJ vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip ; appareils physiques non essayés |`));
const manuel='documentation/User Guides/54-Jeu-COC.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw Error('Clip déjà lié');t=t.replace(/## Le test\r?\n/,`## Le clip des mécanismes et du joueur sur tablette — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres, légendes françaises, sans voix.
Test, héroïsme, Voies, choc psychique, PNJ/bandes, dégâts et santé, puis le vrai Hub joueur
avec des touchers simulés par Playwright : choix de Furtif, jet, héros et édition de la fiche HTML.
Les jets et modifications sont vérifiés côté MJ. Écran émulé768×1024, sans tablette physique.
Aucun module indépendant COC au catalogue actuel ; les outils intégrés sont filmés.
Personnages fictifs, valeurs d’exercice et dés préparés ; pilote2.2.0 d20 inchangé.
[Repères des chapitres](../../output/clips/coc/chapitres.md).

## Le test
`);fs.writeFileSync(manuel,t);
const synth='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synth,'utf8');t=t.split('\n').map(l=>l.startsWith('| [Chroniques Oubliées Contemporain]')?l.replace(/\s*\|$/,` ; [clip avec joueur tactile (${duree})](${lien}) livré le 06/11 (§${n}) |`):l).join('\n');t=t.replace(/## Chroniques Oubliées Contemporain\r?\n/,`## Chroniques Oubliées Contemporain

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres : ${parcours}. Pilote2.2.0 d20 inchangé ; aucun module indépendant dédié au catalogue. ${tablette} [Repères et vérifications](../../output/clips/coc/README.md), registre §${n}. Seize scènes et vingt-deux images du film relues, dont les deux raccords MJ/tablette. ${limites}
`);fs.writeFileSync(synth,t);
c.relecture='16 scènes et 22 images du MP4 examinées ; titres, huit chapitres et deux raccords MJ/tablette compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipCoc.spec.ts outils/clips/monter_clip_coc.mjs : réussi';c.tablette=v.tablette;c.montage=v.exportVideo.montage;c.registre=n;c.limites=limites;
const archive=`${d}/pilote/COC-2.2.0-d20.gmos-driver`,origine='Export Dirvers/corriges/coc/COC-2.2.0-d20.gmos-driver',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hash(archive)!==hash(origine))throw Error('Pilote modifié');c.pilote={archive,origine,version:v.version,sha256:hash(archive),modifie:false};fs.writeFileSync(`${d}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-coc.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario `e2e/',`[MP4 livré de ${duree}](${lien}), H.264, 1440×900. Scénario \`e2e/`).replace('Seize scènes prévues.','Seize scènes filmées.');t=t.replace(/Finir la répétition,[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et vingt-deux images
du film relues, y compris ses deux raccords. ${v.tablette.touchersRecus} touchstart relevés dans le vrai Hub,
jet/héros/édition HTML reçus côté MJ. Manuel, synthèse et registre §${n} liés.
Pour refaire : npm run build puis npx playwright test e2e/clipCoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_COC changent sortie/archive.
Services locaux jetables déjà autorisés ; aucun code applicatif modifié ou commit/push demandé.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${d}/README.md`,`# Clip COC et joueur tactile — ${duree}

[MP4](../coc-mecanismes-et-tablette.mp4) · [WebM monté](../coc-mecanismes-et-tablette.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Amelia Steele, Victor Marlowe et
leurs adversaires sont fictifs, avec des valeurs d’exercice et dés préparés dans un profil jetable.

${parcours}.

${tablette}

Le catalogue ne contient aucun module indépendant dédié à COC. Les outils de la fiche,
Combat-OS, Dice-OS et du Hub sont filmés. Pilote2.2.0 d20 copié à l’identique dans pilote/
depuis Export Dirvers/corriges/coc/ ; aucun réimport nécessaire pour le film.

${limites}

Build, lint, répétition et tournage normal réussis ; assertions sur les fiches et les échanges ;
seize scènes et vingt-deux images du MP4 relues, raccords compris. Rapports : verification.json
et controle-video.json. Les deux tournages bruts et montage.json sont conservés ici.
Aucun profil personnel, paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipCoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter les bruts : node outils/clips/monter_clip_coc.mjs output/clips/coc/tournage-mj.webm output/clips/coc/tournage-tablette.webm output/clips output/clips/coc/montage.json.
`);console.log(JSON.stringify({duree,registre:n,ligne:m,touchers:v.tablette.touchersRecus}));
