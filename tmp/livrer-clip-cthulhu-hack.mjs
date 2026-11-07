import fs from 'node:fs';
import crypto from 'node:crypto';
const d='output/clips/cthulhu-hack',v=JSON.parse(fs.readFileSync(`${d}/verification.json`)),c=JSON.parse(fs.readFileSync(`${d}/controle-video.json`));
if(v.modeRapide||!v.exportVideo.mp4||c.imagesExtraites.length!==18)throw Error('Tournage normal et contrôle requis');
const secondes=Math.round(c.dureeSecondes),duree=`${Math.floor(secondes/60)} min ${String(secondes%60).padStart(2,'0')}`,lien='../../output/clips/cthulhu-hack-mecanismes-et-outils.mp4';
const reg='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(reg,'utf8');
const i=t.indexOf("## La vue d'un coup d'œil");if(i<0||t.includes('### Clip Cthulhu Hack')||/### \d+ · Clip Playwright — Cthulhu Hack/.test(t))throw Error('Registre à vérifier');
const n=Math.max(...[...t.slice(0,i).matchAll(/^### (\d+) ·/gm)].map(m=>Number(m[1])))+1;
const m=Math.max(...[...t.slice(i).split('\n').slice(0,180).join('\n').matchAll(/^\| (\d+) \|/gm)].map(m=>Number(m[1])))+1;
const parcours='Sauvegardes et Avantage/Désavantage ; Fortune joueur/MJ ; enquête et dés d’usure ; Matériel, armure et PA restaurés par la Fortune ; déclin mental et Choc ; effets et Moments ; Hors Jeu standard, pertes permanentes et récupération ; variante Pulp ; les trois tables de Table-OS';
const limites='Sélection de mécanismes, sans recette exhaustive : tous les Chocs/Folies, soins spéciaux, épuisement mental définitif, sorts, fiche HTML, import/rechargement et transports Hub non rejoués. Le tirage libre dans Table-OS est une référence, sans ajout d’effet à la fiche. Indice et conséquences narratives sont joués par le MJ.';
const section=`### ${n} · Clip Playwright — Cthulhu Hack — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Cthulhu Hack en intégrant également les modules du jeu si nécessaire ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM et [huit chapitres](../../output/clips/cthulhu-hack/chapitres.md). Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipCthulhuHack.spec.ts ; Edith Marsh et Nora Vale fictives, valeurs d’exercice et dés préparés, pilote1.1.0 inchangé copié depuis la campagne de recette. Aucun module indépendant Cthulhu Hack au catalogue : outils intégrés de la fiche, de Dice-OS, Combat-OS et Table-OS filmés.
- **Parcours :** ${parcours}.
- **Vérifié :** build, lint, répétition et tournage normal réussis ; assertions sur la Fortune, les dés/PA, la Santé mentale, les Moments et le Hors Jeu. Seize scènes et dix-huit images du MP4 relues, titres compris ; ffprobe vérifié. Tests du manuel dans le rapport.
- **Reste :** ouvrir le film ; [note de reprise](2026-11-06-etat-et-reprise-codex-clip-cthulhu-hack.md). ${limites} Aucun code applicatif ou pilote modifié, paquet installé ou profil personnel utilisé. Services locaux jetables déjà autorisés ; aucun commit/push demandé. Films précédents et changements étrangers conservés.

`;
fs.writeFileSync(reg,t.slice(0,i)+section+t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| ${m} | **Clip Cthulhu Hack** | 🟢 §${n} ; MP4 ${duree}, huit chapitres et outils intégrés vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip |`));
const manuel='documentation/User Guides/54-Jeu-Cthulhu-Hack.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw Error('Clip déjà lié');
t=t.replace('## La Sauvegarde',`## Le clip des mécanismes — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres, légendes françaises, sans voix.
Sauvegarde, Fortune joueur/MJ, enquête et Matériel, armure, Santé mentale et Choc,
durée des effets, Hors Jeu et variante Pulp, puis tables du jeu.
Les outils sont intégrés à la fiche, Dice-OS, Combat-OS et Table-OS ; aucun module indépendant
Cthulhu Hack au catalogue actuel. Personnages fictifs, valeurs d’exercice et dés préparés ;
pilote1.1.0 inchangé, aucun réimport nécessaire pour ce film.
[Repères des chapitres](../../output/clips/cthulhu-hack/chapitres.md).

## La Sauvegarde`);fs.writeFileSync(manuel,t);
const synth='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synth,'utf8');
t=t.split('\n').map(l=>l.startsWith('| [Cthulhu Hack]')?l.replace(' (§ 178) |',` (§ 178) ; [clip des mécanismes (${duree})](${lien}) livré le 06/11 (§${n}) |`):l).join('\n');
t=t.replace(/## Cthulhu Hack\r?\n/,`## Cthulhu Hack

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres sur le pilote1.1.0 : ${parcours}. Aucun module indépendant au catalogue ; outils intégrés filmés. Légendes françaises et dés préparés ; [repères et vérifications](../../output/clips/cthulhu-hack/README.md), registre §${n}. Seize scènes et dix-huit images du MP4 relues. Pilote inchangé. ${limites}
`);fs.writeFileSync(synth,t);
c.relecture='16 scènes et 18 images du MP4 examinées ; titres et huit chapitres compris.';
c.build='npm run build : tsc et trois builds Vite terminés avant essais';c.lint='eslint e2e/clipCthulhuHack.spec.ts : réussi';
const archive=`${d}/pilote/Cthulhu-Hack-1.1.0.gmos-driver`,origine='output/campagnes-tests/cthulhu-hack/Cthulhu-Hack-1.1.0.gmos-driver';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hash(archive)!==hash(origine))throw Error('Pilote modifié');
c.pilote={archive,origine,version:v.version,sha256:hash(archive),modifie:false};c.limites=limites;c.registre=n;fs.writeFileSync(`${d}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-cthulhu-hack.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario `e2e/',`[MP4 livré de ${duree}](${lien}), H.264, 1440 × 900. Scénario \`e2e/`).replace('Seize scènes prévues.','Seize scènes filmées.');
t=t.replace(/Finir la répétition,[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; seize scènes et dix-huit images
du film relues. Manuel, synthèse et registre §${n} liés ; rapports et repères dans output/clips/cthulhu-hack/.
Pour refaire : npm run build puis npx playwright test e2e/clipCthulhuHack.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 pour répéter ; GMOS_SORTIE_CLIP et GMOS_PILOTE_CTHULHU_HACK changent sortie/archive.
Services locaux jetables déjà autorisés ; aucun code applicatif modifié ou commit/push demandé.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${d}/README.md`,`# Clip Cthulhu Hack — ${duree}

[MP4](../cthulhu-hack-mecanismes-et-outils.mp4) · [WebM](../cthulhu-hack-mecanismes-et-outils.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Edith Marsh et Nora Vale fictives,
valeurs d’exercice et dés préparés dans un profil jetable ; aucun personnage novice revendiqué.

${parcours}.

Le catalogue ne contient aucun module indépendant Cthulhu Hack : les outils intégrés de la
fiche, Dice-OS, Combat-OS et Table-OS sont filmés. Pilote1.1.0 copié à l’identique dans pilote/
depuis la campagne de recette ; aucun réimport nécessaire pour ce clip.

${limites}

Build, lint, répétition et tournage normal réussis ; assertions sur les fiches et états ;
seize scènes et dix-huit images du MP4 relues. Rapports : verification.json et controle-video.json.
Aucun profil personnel, paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipCthulhuHack.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
`);console.log(JSON.stringify({duree,registre:n,ligne:m}));
