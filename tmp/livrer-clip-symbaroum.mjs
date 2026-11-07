import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dossier='output/clips/symbaroum',r=JSON.parse(fs.readFileSync(`${dossier}/verification.json`,'utf8')),c=JSON.parse(fs.readFileSync(`${dossier}/controle-video.json`,'utf8'));
if(r.modeRapide||!r.exportVideo.mp4)throw new Error('Tournage normal requis.');
const sec=Math.round(c.dureeSecondes),duree=`${Math.floor(sec/60)} min ${String(sec%60).padStart(2,'0')}`,lien='../../output/clips/symbaroum-mecanismes-et-outils.mp4';
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';let t=fs.readFileSync(registre,'utf8');const cle="## La vue d'un coup d'œil",i=t.indexOf(cle);
if(i<0||t.includes('### 222 ·'))throw new Error('Revoir le numéro du registre.');
const section=`### 222 · Clip Playwright — Symbaroum — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Symbaroum en intégrant également les modules du jeu si nécessaire ».

- **Livré :** [MP4 de ${duree}](${lien}), H.264, 1440 × 900 ; WebM, huit chapitres et rapports dans output/clips/symbaroum/. Curseur, surlignages et légendes françaises, sans voix ni musique.
- **Scénario :** e2e/clipSymbaroum.spec.ts, Éléna des Brumes fictive, pilote 2.0.0 inchangé. Opposition au seuil ; Avantage tactique et dégâts ; Défense et protection ; agonie, Test de mort et soins ; Corruption, seuil et Stigmate ; fin de scène ; dérivées et progression ; bourse et voyage ; attaque parfaite optionnelle.
- **Modules :** aucun module indépendant Symbaroum dans src/modules/modulesDuJeu/catalogue.ts. Les outils intégrés à la fiche sont filmés, sans inventer de module. Archive existante retrouvée dans scratch/recette-pilotes/, copiée à l’identique dans output/clips/symbaroum/pilote/ ; pas de réimport requis pour ce clip.
- **Vérifié :** build, lint, répétition et tournage normal réussis ; assertions sur Endurance, Corruption, Expérience et bourse. Treize scènes et dix-huit images du MP4 relues, titres compris ; format contrôlé par ffprobe. Manuel, synthèse et [note de reprise](2026-11-06-etat-et-reprise-codex-clip-symbaroum.md) liés ; tests du manuel consignés au rapport.
- **Reste :** ouvrir le film. Jauge générique du cockpit restée à 10/10 après les soins sur la fiche : constat distinct au §1bis et capture dans constats/, sans correctif dans le film. Sélection de mécanismes, pas une recette exhaustive : toutes les options, Talents, création HTML, import/rechargement, Hub et tablettes physiques non rejoués. Aucun code applicatif ou pilote modifié, paquet installé ou profil personnel utilisé. Services jetables déjà autorisés ; aucun commit/push demandé. Autres films et travaux étrangers conservés.

`;
const fin=t.slice(i).replace('| --- | --- | --- | --- | --- |',`| --- | --- | --- | --- | --- |\n| 158 | **Clip Symbaroum** | 🟢 §222 ; MP4 ${duree}, huit chapitres, tournage et images vérifiés —06/11 | Ouvrir le MP4 | Rien pour le clip |`);
fs.writeFileSync(registre,t.slice(0,i)+section+fin);
const manuel='documentation/User Guides/54-Jeu-Symbaroum.md';t=fs.readFileSync(manuel,'utf8');if(t.includes('## Le clip des mécanismes'))throw new Error('Clip déjà lié.');
t=t.replace('## Le test',`## Le clip des mécanismes — 06/11/2026

[Voir le clip MP4 (${duree})](${lien}) : huit chapitres avec légendes françaises, sans voix.
Opposition et Avantage tactique ; attaque et Défense avec leurs dégâts ; agonie et soins ;
Corruption et Stigmates ; fin de scène ; progression ; bourse et voyage ; attaques parfaites optionnelles.
Il n’existe pas de module indépendant Symbaroum dans le catalogue actuel : ces outils sont intégrés à la fiche.
Éléna est fictive, les dés préparés et le profil jetable. Le pilote 2.0.0 reste inchangé.
[Repères des chapitres](../../output/clips/symbaroum/chapitres.md).

## Le test`);fs.writeFileSync(manuel,t);
const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';t=fs.readFileSync(synthese,'utf8');
t=t.split('\n').map(l=>l.startsWith('| [Symbaroum]')?l.replace('pilote 2.0.0 |',`pilote 2.0.0 ; [clip des mécanismes (${duree})](${lien}) livré le 06/11 (§222) |`):l).join('\n');
t=t.replace(/## Symbaroum\r?\n/,`## Symbaroum

**Clip Playwright livré le 06/11/2026 :** [MP4 de ${duree}](${lien}), huit chapitres : seuil et opposition, Avantage et dégâts, Défense/agonie/soins, Corruption/Stigmates, fin de scène, progression, bourse/voyage et attaque parfaite optionnelle. Outils intégrés à la fiche ; aucun module indépendant Symbaroum au catalogue actuel. Légendes françaises, dés préparés ; [repères et vérifications](../../output/clips/symbaroum/README.md), registre §222. Treize scènes et dix-huit images du MP4 relues. Pilote inchangé ; ces essais ne remplacent pas une recette exhaustive ou l’essai de David.

**Constat distinct du clip (06/11) :** après dégâts et soins sur la fiche (Endurance 10 → 6 → 0 → 3), la jauge générique du cockpit reste à 10/10 dans le profil fictif. Raccord à examiner séparément ; preuve et ancres au registre §1bis. Le film reste sur la fiche pour les séquences suivantes, sans correctif applicatif.
`);fs.writeFileSync(synthese,t);
c.relecture='13 images de scènes et 18 images du MP4 examinées ; titres et huit chapitres compris.';c.build='npm run build : réussi avant essais';c.lint='eslint e2e/clipSymbaroum.spec.ts : réussi';
c.constatHorsLot={description:'Après dégâts puis soins, Endurance3 sur la fiche mais hp10 au cockpit dans le profil fictif.',preuve:'constats/cockpit-jauge.jpg',suivi:'registre §1bis',corrige:false};
const pilote=`${dossier}/pilote/Symbaroum-2.0.0.gmos-driver`;c.pilote={archive:pilote,origine:'scratch/recette-pilotes/Symbaroum_driver_gmos_finir.gmos-driver',version:r.version,sha256:crypto.createHash('sha256').update(fs.readFileSync(pilote)).digest('hex'),modifie:false};
c.limites=['Sélection de mécanismes ; pas de recette exhaustive','Toutes les options, Talents, création HTML, import/rechargement, Hub et tablettes physiques non rejoués','Personnage fictif préparé avant le titre ; dés préparés'];fs.writeFileSync(`${dossier}/controle-video.json`,JSON.stringify(c,null,2)+'\n');
const note='documentation/Planning/2026-11-06-etat-et-reprise-codex-clip-symbaroum.md';t=fs.readFileSync(note,'utf8').replace('## Produit en cours','## Produit livré').replace('Scénario e2e/clipSymbaroum.spec.ts,',`[MP4 livré de ${duree}](${lien}), H.264, 1440 × 900. Scénario e2e/clipSymbaroum.spec.ts,`);
t=t.replace(/Finir la répétition,[\s\S]*?## Ne pas repayer/,`Ouvrir le MP4. Build, lint, répétition et tournage normal réussis ; treize scènes et dix-huit
images du film relues. Rapports, provenance et repères dans output/clips/symbaroum/ ; manuel,
synthèse et registre §222 mis à jour. Pour refaire : npm run build puis
npx playwright test e2e/clipSymbaroum.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions ; GMOS_SORTIE_CLIP et GMOS_PILOTE_SYMBAROUM changent
sortie et archive. Services locaux déjà autorisés ; aucun commit/push demandé.

## Ne pas repayer`);fs.writeFileSync(note,t);
fs.writeFileSync(`${dossier}/README.md`,`# Clip Symbaroum — ${duree}

[Ouvrir le MP4](../symbaroum-mecanismes-et-outils.mp4) · [Tournage WebM](../symbaroum-mecanismes-et-outils.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur et
légendes françaises, sans voix ni musique. Éléna est fictive ; dés préparés pour rendre
les exemples reproductibles, fiche préparée avant le titre dans un profil jetable.

Un d20 sous l’attribut modifié par opposition et situation ; Avantage tactique (+2 et +1D4) ;
dégâts du joueur et protection fixe du PNJ, puis Défense du joueur et protection lancée.
Endurance, agonie, Test de mort qui continue, soins ; Corruption temporaire/permanente,
seuil et Stigmate ; fin de scène confirmée ; valeurs dérivées, création à 80 et rang Adepte ;
paiement en trois monnaies, voyage dans Davokar et guérison ; attaque parfaite optionnelle.

Aucun module indépendant Symbaroum dans src/modules/modulesDuJeu/catalogue.ts : les outils
filmés sont intégrés à la fiche. Pilote 2.0.0 existant copié à l’identique dans pilote/ depuis
scratch/recette-pilotes/. Aucun réimport nécessaire pour ce clip.

Sélection de mécanismes : les autres options, les effets libres des Talents, la création
HTML, l’import/rechargement, le Hub et les tablettes physiques ne sont pas rejoués.
Le meneur garde les arbitrages et le suivi manuel du PNJ après les dégâts.

Constat hors du film, consigné au registre §1bis : la jauge générique du cockpit garde
10/10 après blessures et soins (Endurance3 sur la fiche) dans le profil fictif.
Preuve : constats/cockpit-jauge.jpg. Aucun correctif dans ce lot ; la prise finale
reste sur la fiche pour Corruption et fin de scène.

Scénario : e2e/clipSymbaroum.spec.ts. Build, lint, répétition et tournage normal réussis ;
assertions sur les effets réels, treize scènes et dix-huit images du film relues.
Rapports : verification.json et controle-video.json. Aucun profil personnel utilisé,
paquet installé ou code applicatif modifié. Aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipSymbaroum.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
`);
console.log(duree);
