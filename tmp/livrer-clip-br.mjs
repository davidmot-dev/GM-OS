import fs from 'node:fs';
import crypto from 'node:crypto';
const d='output/clips/blade-runner',v=JSON.parse(fs.readFileSync(`${d}/verification.json`)),c=JSON.parse(fs.readFileSync(`${d}/controle-video.json`));
if(v.modeRapide||c.imagesExtraites.length!==22||!(v.tablette.touchersRecus>5)||v.chapitres.length!==8)throw Error('Film normal, tactile et contrôle requis');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/blade-runner-mecanismes-et-tablette.mp4';
const reg='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(reg,'utf8');const i=t.indexOf("## La vue d'un coup d'œil");if(i<0||/### \d+ · Clip Playwright — Blade Runner/.test(t))throw Error('Registre à vérifier');
const n=Math.max(...[...t.slice(0,i).matchAll(/^### (\d+) ·/gm)].map(m=>Number(m[1])))+1,m=Math.max(...[...t.slice(i).split('\n').slice(0,200).join('\n').matchAll(/^\| (\d+) \|/gm)].map(m=>Number(m[1])))+1;
const parcours="D10/D8, seuils de six et dix, soutien apportant son dé ; forçage humain avec relance volontaire d’une réussite, deux forçages du réplicant et crâne payé une seule fois ; souvenir clé consommé pour la séance ; stress subi puis objet fétiche ; blessure mortelle préparée, sauvegarde, stabilisations Round→Quart→hors de danger, soins et guérison en cours ; échange des cartes3/7 et protection2D8 ; test et forçage mental depuis le vrai Hub tactile ; Humanité HTML et réception MJ";
const limites="Exercices ciblés, sans combat complet ni recette exhaustive : les effets critiques de stress/Brisé, mort, premiers secours, main secourable, récupération, poursuites, fin de guérison et progression ne sont pas rejoués. Plaie mortelle et cartes3/7 préparées avant le générique ; dés d’exercice choisis. Humanité à4 saisie manuellement, sans bilan de fin de session. Le compteur de PV générique reste à8 malgré la Santé à7 : constat de raccord séparé. Aucun appareil physique utilisé. Le rechargement/import du suivi de blessure n’est pas testé : la semence refuse ce JSON structuré, posé après chargement pour le tournage (constat hors périmètre consigné au registre).";
const tablette=`Vrai Hub HTTP/WebSocket dans Edge jetable, contexte mobile/tactile 768×1024 sans appBridge ; ${v.tablette.touchersRecus} touchstart relevés dans le client principal. Le test mental et son forçage sont reçus chez le MJ ; Sang-froid5→4, Santé7 conservée ; Humanité4 saisie dans la fiche HTML et reçue côté MJ. Touchers par tap(), sélections HTML ; aucun clavier tactile natif filmé. Deux raccords MJ/tablette contrôlés.`;
const section=`### ${n} · Clip Playwright — Blade Runner et joueur tactile — 07/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Blade Runner en intégrant également les modules du jeu si nécessaire, est-ce que tu peux simuler les gestes d'un joueurs sur une tablette ? ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440×900 ; WebM monté, [huit chapitres](../../output/clips/blade-runner/chapitres.md), tournages bruts et rapports. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Parcours :** ${parcours}. Scénario e2e/clipBladeRunner.spec.ts ; pilote 2.0.0 inchangé copié depuis le fichier de recette de scratch/recette-br/. Aucun module indépendant dédié au catalogue : outils intégrés du panneau, de la fiche HTML et de Dice-OS.
- **Tablette :** ${tablette}
- **Vérifié :** build, lint, répétition et tournage normal ; assertions sur réussites, forçages, coûts, usages de séance, stress, blessures, cartes, protection et échanges tactiles réels. Dix-huit scènes et vingt-deux images du MP4 relues, titres et deux raccords compris ; ffprobe contrôlé. Montage reproductible : outils/clips/monter_clip_blade_runner.mjs.
- **Reste :** ouvrir le film ; [note de reprise](2026-11-07-etat-et-reprise-codex-clip-blade-runner.md). ${limites} Aucun code applicatif ou pilote modifié, paquet installé ou profil personnel utilisé. Services locaux jetables déjà autorisés ; aucun commit/push demandé. Clips précédents et changements étrangers conservés.

`;
fs.writeFileSync(reg,t.slice(0,i)+section+t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| ${m} | **Clip Blade Runner et joueur tactile** | 🟢 § ${n} ; MP4 ${duree}, huit chapitres et vrai Hub → MJ vérifiés —07/11 | Ouvrir le MP4 | Rien pour le clip ; appareils physiques non essayés |`));
const manuel='documentation/User Guides/54-Jeu-Blade-Runner.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw Error('Clip déjà lié');t=t.replace('## Le jet — les dés échelonnés',`## Le clip des mécanismes et du joueur sur tablette — 07/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres, légendes françaises, sans voix.
Dés échelonnés, soutien, forçage humain/réplicant, souvenir clé, stress, objet fétiche,
blessures, initiative et protection, puis le vrai Hub tactile : test mental, Sang-froid
et Humanité HTML reçus côté MJ. Écran émulé 768×1024 ; personnages fictifs, blessure et
dés d’exercice préparés, pilote 2.0.0 inchangé. Aucun module indépendant dédié au
catalogue actuel : les outils intégrés sont filmés.
[Repères des chapitres](../../output/clips/blade-runner/chapitres.md).

## Le jet — les dés échelonnés
`);fs.writeFileSync(manuel,t);
const synth='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synth,'utf8');t=t.split('\n').map(l=>l.startsWith('| [Blade Runner]')?l.replace(/\s*\|$/,` ; [clip avec joueur tactile (${duree})](${lien}) livré le 07/11 (§ ${n}) |`):l).join('\n');t=t.replace('## Blade Runner',`## Blade Runner

**Clip Playwright livré le 07/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres : ${parcours}. Pilote 2.0.0 inchangé, aucun module indépendant dédié au catalogue. ${tablette} [Repères et vérifications](../../output/clips/blade-runner/README.md), registre § ${n}. Dix-huit scènes et vingt-deux images du film relues. ${limites}
`);fs.writeFileSync(synth,t);
c.relecture='18 scènes et 22 images du MP4 examinées ; titres, huit chapitres et deux raccords MJ/tablette compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipBladeRunner.spec.ts outils/clips/monter_clip_blade_runner.mjs : réussi';c.tablette=v.tablette;c.montage=v.exportVideo.montage;c.registre=n;c.limites=limites;
const archive=`${d}/pilote/BR-2.0.0.gmos-driver`,origine='scratch/recette-br/BladeRunner_driver_gmos_finir.gmos-driver',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hash(archive)!==hash(origine))throw Error('Pilote modifié');c.pilote={archive,origine,version:v.version,sha256:hash(archive),modifie:false};fs.writeFileSync(`${d}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-07-etat-et-reprise-codex-clip-blade-runner.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario `e2e/',`[MP4 livré de ${duree}](${lien}), H.264, 1440×900. Scénario \`e2e/`).replace('Dix-huit scènes prévues.','Dix-huit scènes filmées.');t=t.replace(/Finir la répétition[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; dix-huit scènes et vingt-deux
images relues, titres et deux raccords compris. ${v.tablette.touchersRecus} touchstart relevés ; test mental,
forçage, coût et saisie d’Humanité HTML reçus côté MJ. Manuel, synthèse et registre § ${n} liés.
Pour refaire : npm run build puis npx playwright test e2e/clipBladeRunner.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_BR changent sortie/archive.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${d}/README.md`,`# Clip Blade Runner et joueur tactile — ${duree}

[MP4](../blade-runner-mecanismes-et-tablette.mp4) · [WebM monté](../blade-runner-mecanismes-et-tablette.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 07/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Agent Kessler et son
aventure sont fictifs, dans un profil jetable avec des dés d’exercice préparés.

${parcours}.

${tablette}

Aucun module indépendant dédié à Blade Runner dans le catalogue actuel : panneau du jeu, fiche
HTML et Dice-OS sont filmés. Pilote 2.0.0 copié à l’identique dans pilote/ depuis
scratch/recette-br/. Aucun réimport nécessaire pour ce film.

${limites}

Build, lint, répétition et tournage normal réussis ; assertions sur les fiches et
les échanges ; dix-huit scènes et vingt-deux images du MP4 relues, raccords compris.
Rapports : verification.json et controle-video.json. Les deux tournages bruts et
montage.json sont conservés ici. Aucun profil personnel, paquet installé ou code
applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipBladeRunner.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter : node outils/clips/monter_clip_blade_runner.mjs output/clips/blade-runner/tournage-mj.webm output/clips/blade-runner/tournage-tablette.webm output/clips output/clips/blade-runner/montage.json.
`);console.log(JSON.stringify({duree,registre:n,ligne:m,touchers:v.tablette.touchersRecus}));
