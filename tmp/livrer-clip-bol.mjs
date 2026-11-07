import fs from 'node:fs';
import crypto from 'node:crypto';
const d='output/clips/bol',v=JSON.parse(fs.readFileSync(`${d}/verification.json`)),c=JSON.parse(fs.readFileSync(`${d}/controle-video.json`));
if(v.modeRapide||c.imagesExtraites.length!==20||!(v.tablette.touchersRecus>5)||v.chapitres.length!==7)throw Error('Film normal, tactile et contrôle requis');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/barbarians-of-lemuria-mecanismes-et-tablette.mp4';
const reg='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(reg,'utf8');const i=t.indexOf("## La vue d'un coup d'œil");if(i<0||/### \d+ · Clip Playwright — Barbarians of Lemuria/.test(t))throw Error('Registre à vérifier');
const n=Math.max(...[...t.slice(0,i).matchAll(/^### (\d+) ·/gm)].map(m=>Number(m[1])))+1,m=Math.max(...[...t.slice(i).split('\n').slice(0,200).join('\n').matchAll(/^\| (\d+) \|/gm)].map(m=>Number(m[1])))+1;
const parcours='carrière et difficulté, annulation des bonus/malus et choix des deux meilleurs ou pires dés ; succès héroïque acheté sans promotion au légendaire ; double six héroïque puis légendaire ; Faveur divine gardant le second jet même moins bon, échec critique choisi et point accordé une fois ; réussite simple quand seul un double six pouvait réussir ; ordre de réaction ; attaque et héroïsme depuis le vrai Hub tactile ; fiche HTML et réception MJ';
const limites='Démonstration ciblée, sans combat complet ni recette exhaustive : magie, foi, alchimie, dégâts/armure, usages narratifs de l’héroïsme, récupération et progression ne sont pas rejoués. Personnage et dés d’exercice préparés. La Vitalité à 11 est saisie manuellement ; aucun calcul de dégâts revendiqué. Aucun appareil physique utilisé.';
const tablette=`Vrai Hub HTTP/WebSocket dans Edge jetable, contexte mobile/tactile 768×1024 sans appBridge ; ${v.tablette.touchersRecus} touchstart relevés dans le client principal. Attaque Agilité1 + Mêlée2 − Défense1 : dés5+4, total11 reçu chez le MJ ; héroïsme3→2 ; fiche HTML Barbare/héroïsme2 et Vitalité11 reçue côté MJ. Touchers par tap(), saisies et sélections par contrôles HTML ; aucun clavier tactile natif filmé. Deux raccords MJ/tablette contrôlés.`;
const section=`### ${n} · Clip Playwright — Barbarians of Lemuria et joueur tactile — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Barbarian of Lemuria en intégrant également les modules du jeu si nécessaire, est-ce que tu peux simuler les gestes d'un joueurs sur une tablette ? ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440×900 ; WebM monté, [sept chapitres](../../output/clips/bol/chapitres.md), tournages bruts et rapports. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Parcours :** ${parcours}. Scénario e2e/clipBol.spec.ts ; pilote 2.0.0 inchangé copié depuis Export Dirvers/corriges/. Aucun module indépendant dédié au catalogue : outils intégrés du panneau, de la fiche HTML et de Dice-OS.
- **Tablette :** ${tablette}
- **Vérifié :** build, lint, répétition et tournage normal ; assertions sur bonus/malus, héroïsme, doubles, Faveur divine, réaction, événements tactiles et synchronisation réelle. Seize scènes et vingt images du MP4 relues, titres et deux raccords compris ; ffprobe contrôlé. Montage reproductible : outils/clips/monter_clip_bol.mjs.
- **Reste :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-bol.md). ${limites} Aucun code applicatif ou pilote modifié, paquet installé ou profil personnel utilisé. Services locaux jetables déjà autorisés ; aucun commit/push demandé. Clips précédents et changements étrangers conservés.

`;
fs.writeFileSync(reg,t.slice(0,i)+section+t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| ${m} | **Clip Barbarians of Lemuria et joueur tactile** | 🟢 § ${n} ; MP4 ${duree}, sept chapitres et vrai Hub → MJ vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip ; appareils physiques non essayés |`));
const manuel='documentation/User Guides/54-Jeu-Barbarians-of-Lemuria.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw Error('Clip déjà lié');t=t.replace(/## Le jet d'action\r?\n/,`## Le clip des mécanismes et du joueur sur tablette — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : sept chapitres, légendes françaises, sans voix.
Carrières, difficulté, bonus/malus, héroïsme, doubles six/un et réaction, puis le vrai Hub :
touchers Playwright, attaque reçue par le MJ, succès héroïque et fiche HTML synchronisée.
Écran tactile émulé 768×1024 ; personnages fictifs, dés d’exercice préparés, pilote 2.0.0
inchangé. La Vitalité à 11 est saisie manuellement. Aucun module indépendant dédié au
catalogue actuel : les outils intégrés sont filmés.
[Repères des chapitres](../../output/clips/bol/chapitres.md).

## Le jet d'action
`);fs.writeFileSync(manuel,t);
const synth='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synth,'utf8');t=t.split('\n').map(l=>l.startsWith('| [Barbarians of Lemuria]')?l.replace(/\s*\|$/,` ; [clip avec joueur tactile (${duree})](${lien}) livré le 06/11 (§ ${n}) |`):l).join('\n');t=t.replace(/## Barbarians of Lemuria\r?\n/,`## Barbarians of Lemuria

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), sept chapitres : ${parcours}. Pilote 2.0.0 inchangé, aucun module indépendant dédié au catalogue. ${tablette} [Repères et vérifications](../../output/clips/bol/README.md), registre § ${n}. Seize scènes et vingt images du film relues. ${limites}
`);fs.writeFileSync(synth,t);
c.relecture='16 scènes et 20 images du MP4 examinées ; titres, sept chapitres et deux raccords MJ/tablette compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipBol.spec.ts outils/clips/monter_clip_bol.mjs : réussi';c.tablette=v.tablette;c.montage=v.exportVideo.montage;c.registre=n;c.limites=limites;
const archive=`${d}/pilote/BOL-2.0.0.gmos-driver`,origine='Export Dirvers/corriges/BOL_driver_gmos_2.0.0.gmos-driver',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hash(archive)!==hash(origine))throw Error('Pilote modifié');c.pilote={archive,origine,version:v.version,sha256:hash(archive),modifie:false};fs.writeFileSync(`${d}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-bol.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario `e2e/',`[MP4 livré de ${duree}](${lien}), H.264, 1440×900. Scénario \`e2e/`).replace('Seize scènes prévues.','Seize scènes filmées.');t=t.replace(/Finir la répétition[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et vingt
images relues, titres et deux raccords compris. ${v.tablette.touchersRecus} touchstart relevés ; attaque,
héroïsme et saisie de Vitalité HTML reçus côté MJ. Manuel, synthèse et registre § ${n} liés.
Pour refaire : npm run build puis npx playwright test e2e/clipBol.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_BOL changent sortie/archive.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${d}/README.md`,`# Clip Barbarians of Lemuria et joueur tactile — ${duree}

[MP4](../barbarians-of-lemuria-mecanismes-et-tablette.mp4) · [WebM monté](../barbarians-of-lemuria-mecanismes-et-tablette.webm) · [Sept chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Krongar de Valgard et son
aventure sont fictifs, dans un profil jetable avec des dés d’exercice préparés.

${parcours}.

${tablette}

Aucun module indépendant dédié à BoL dans le catalogue actuel : panneau du jeu, fiche
HTML et Dice-OS sont filmés. Pilote 2.0.0 copié à l’identique dans pilote/ depuis
Export Dirvers/corriges/. Aucun réimport nécessaire pour ce film.

${limites}

Build, lint, répétition et tournage normal réussis ; assertions sur les fiches et
les échanges ; seize scènes et vingt images du MP4 relues, raccords compris.
Rapports : verification.json et controle-video.json. Les deux tournages bruts et
montage.json sont conservés ici. Aucun profil personnel, paquet installé ou code
applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipBol.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter : node outils/clips/monter_clip_bol.mjs output/clips/bol/tournage-mj.webm output/clips/bol/tournage-tablette.webm output/clips output/clips/bol/montage.json.
`);console.log(JSON.stringify({duree,registre:n,ligne:m,touchers:v.tablette.touchersRecus}));
