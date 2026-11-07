import fs from 'node:fs';
import crypto from 'node:crypto';
const d='output/clips/alien',v=JSON.parse(fs.readFileSync(`${d}/verification.json`)),c=JSON.parse(fs.readFileSync(`${d}/controle-video.json`));
if(v.modeRapide||c.imagesExtraites.length!==28||!(v.tablette.touchersRecus>10)||v.modules.length!==3)throw Error('Film normal et contrôle requis');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/alien-mecanismes-modules-et-tablette.mp4';
const reg='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(reg,'utf8');const i=t.indexOf("## La vue d'un coup d'œil");if(i<0||/### \d+ · Clip Playwright — Alien et joueur tactile/.test(t))throw Error('Registre à vérifier');
const n=Math.max(...[...t.slice(0,i).matchAll(/^### (\d+) ·/gm)].map(m=>Number(m[1])))+1,m=Math.max(...[...t.slice(i).split('\n').slice(0,195).join('\n').matchAll(/^\| (\d+) \|/gm)].map(m=>Number(m[1])))+1;
const parcours='réserve de base et Stress, forçage et Point de Récit en mode Cinéma ; Panique provisoire puis Figé10 annulant l’action ; Air8 testé à six dés et ramené à6 ; Conestoga du catalogue, poste Senseurs et ordres secrets ; M314 raccordé au plan privé et batterie ; vrai Hub tactile, test et question /M ; réponse privée du MJ ; lecture des échos et ordre spatial du joueur ; révélation et historique MJ';
const limites='Démonstration ciblée : pas de recette exhaustive du pilote, ni combat spatial complet (arrêt après révélation), ni blessures/soins, xénomorphes, équipement/catalogue, fin d’acte ou progression complète. Personnages et dés du panneau préparés ; test de batterie M314 aléatoire. Aucun appareil physique utilisé.';
const tablette=`Vrai Hub HTTP/WebSocket dans Edge jetable, contexte mobile/tactile 768×1024 sans appBridge ; ${v.tablette.touchersRecus} événements touchstart reçus. Test reçu au MJ, question /M reçue, réponse du meneur lue, écho sans noms privés et ordre de verrouillage reçu côté MJ. Touchers par tap(), saisies et choix par contrôles HTML ; pas de clavier tactile natif filmé. Deux séquences tactiles alternent avec le pupitre MJ ; quatre raccords contrôlés.`;
const section=`### ${n} · Clip Playwright — Alien et joueur tactile — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Alien en intégrant également les modules du jeu si nécessaire, est-ce que tu peux simuler les gestes d'un joueurs sur une tablette ? ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440×900 ; WebM monté, [neuf chapitres](../../output/clips/alien/chapitres.md), tournages bruts et rapports. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Parcours :** ${parcours}. Scénario e2e/clipAlien.spec.ts ; pilote1.9.0 copié sans modification depuis l’export de David, aucun réimport nécessaire. Les trois modules réels sont intégrés : MU/TH/UR6000, Détecteur de mouvement, Combat spatial.
- **Tablette :** ${tablette}
- **Vérifié :** build, lint, répétition et tournage normal ; assertions sur Stress/Récit/Panique/Air, trois modules, événements tactiles et échanges réels. Dix-huit scènes et vingt-huit images du MP4 relues, titres et quatre raccords compris ; ffprobe contrôlé. Montage reproductible : outils/clips/monter_clip_alien.mjs.
- **Reste :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-alien.md). ${limites} Aucun code applicatif/pilote modifié ou profil personnel utilisé. Services locaux jetables déjà autorisés, aucun paquet installé ni commit/push demandé. Clips précédents et changements étrangers conservés.

`;
fs.writeFileSync(reg,t.slice(0,i)+section+t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| ${m} | **Clip Alien et joueur tactile** | 🟢 §${n} ; MP4 ${duree}, neuf chapitres, trois modules et vrai Hub → MJ vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip ; appareils physiques non essayés |`));
const manuel='documentation/User Guides/54-Jeu-Alien.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw Error('Clip déjà lié');const intro='Le moteur Year Zero : une réserve de d6, et des **dés de Stress** qui font monter la peur.';if(!t.includes(intro))throw Error('Introduction du manuel manquante');t=t.replace(intro,`${intro}

## Le clip des mécanismes, des modules et du joueur sur tablette — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : neuf chapitres, légendes françaises, sans voix.
Forçage, Point de Récit en mode Cinéma, Panique, réserve d’Air, puis les trois modules réels :
MU/TH/UR6000, détecteur M314 et Combat spatial. Le joueur utilise le vrai Hub avec des
touchers Playwright : test, question privée, réponse reçue, échos et ordre de verrouillage.
Le MJ répond, révèle les ordres et retrouve le test reçu. Écran tactile émulé768×1024,
sans tablette physique. Personnages fictifs, dés du panneau préparés, scan M314 aléatoire ;
pilote1.9.0 inchangé. Le combat spatial s’arrête après la révélation des ordres.
[Repères des chapitres](../../output/clips/alien/chapitres.md).
`);fs.writeFileSync(manuel,t);
const synth='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synth,'utf8');t=t.split('\n').map(l=>l.startsWith('| [Alien]')?l.replace(/\s*\|$/,` ; [clip des trois modules et du joueur tactile (${duree})](${lien}) livré le 06/11 (§${n}) |`):l).join('\n');t=t.replace(/## Alien\r?\n/,`## Alien

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), neuf chapitres : ${parcours}. Pilote1.9.0 inchangé ; les trois modules réels sont filmés. ${tablette} [Repères et vérifications](../../output/clips/alien/README.md), registre §${n}. Dix-huit scènes et vingt-huit images du film relues. ${limites}
`);fs.writeFileSync(synth,t);
c.relecture='18 scènes et 28 images du MP4 examinées ; titres, neuf chapitres et quatre raccords MJ/tablette compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipAlien.spec.ts outils/clips/monter_clip_alien.mjs : réussi';c.tablette=v.tablette;c.montage=v.exportVideo.montage;c.registre=n;c.limites=limites;
const archive=`${d}/pilote/ALIEN-1.9.0.gmos-driver`,origine='Export Dirvers/Alien_driver_gmos_1793655035463.gmos-driver',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hash(archive)!==hash(origine))throw Error('Pilote modifié');c.pilote={archive,origine,version:v.version,sha256:hash(archive),modifie:false};fs.writeFileSync(`${d}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-alien.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario `e2e/',`[MP4 livré de ${duree}](${lien}), H.264, 1440×900. Scénario \`e2e/`).replace('Dix-huit scènes prévues.','Dix-huit scènes filmées.');t=t.replace(/Terminer la répétition,[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; dix-huit scènes et vingt-huit
images du film relues, y compris les quatre raccords. ${v.tablette.touchersRecus} touchstart relevés ; test,
question/réponse, échos et ordre spatial échangés par les vrais clients. Manuel, synthèse
et registre §${n} liés. Les 36 tests du manuel sont consignés au rapport de contrôle.
Pour refaire : npm run build puis npx playwright test e2e/clipAlien.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_ALIEN changent sortie/archive.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${d}/README.md`,`# Clip Alien, trois modules et joueur tactile — ${duree}

[MP4](../alien-mecanismes-modules-et-tablette.mp4) · [WebM monté](../alien-mecanismes-modules-et-tablette.webm) · [Neuf chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Nel Varga, son équipage et
la scène du Montero sont fictifs, dans un profil jetable avec des dés du panneau préparés.

${parcours}.

${tablette}

Les trois modules du pilote sont réellement raccordés au Hub. Le plan et ses pions,
le Montero et son poste sont préparés avant le générique ; les Marines, le combat et
l’ordre adverse sont mis en place via commandes natives hors gestes commentés.
Le Conestoga, les accès, le scan, les tests, la question/réponse, l’ordre du joueur
et la révélation passent par leurs écrans réels. Le M314 conserve son hasard natif.

${limites}

Pilote1.9.0 copié à l’identique dans pilote/ depuis l’export Alien fourni par David.
Aucun réimport nécessaire pour ce film. Build, lint, répétition et tournage normal réussis ;
assertions sur les fiches et les échanges ; dix-huit scènes et vingt-huit images du MP4
relues, raccords compris. Rapports : verification.json et controle-video.json.
Les deux tournages bruts et montage.json sont conservés ici.
Aucun profil personnel, paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipAlien.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter : node outils/clips/monter_clip_alien.mjs output/clips/alien/tournage-mj.webm output/clips/alien/tournage-tablette.webm output/clips output/clips/alien/montage.json.
`);console.log(JSON.stringify({duree,registre:n,ligne:m,touchers:v.tablette.touchersRecus}));
