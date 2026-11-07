import fs from 'node:fs';
const dossier='output/clips/nephilim';
const rapport=JSON.parse(fs.readFileSync(`${dossier}/verification.json`,'utf8'));
const controle=JSON.parse(fs.readFileSync(`${dossier}/controle-video.json`,'utf8'));
if (rapport.modeRapide) throw new Error('Répétition : livraison refusée.');
const secondes=Math.round(controle.dureeSecondes), duree=`${Math.floor(secondes/60)} min ${String(secondes%60).padStart(2,'0')}`;
const manuel='documentation/User Guides/54-Jeu-Nephilim.md';
let texte=fs.readFileSync(manuel,'utf8');
texte=texte.replace('## Le jet', `## Le clip des mécanismes particuliers — 05/11/2026

[Voir le clip MP4 (${duree})](../../output/clips/nephilim-mecanismes.mp4) : huit chapitres,
curseur et légendes françaises, sans voix. Vécus/Mnémos, métamorphe, Magie/Stase/Sacrifice,
pacte de Kabbale, Alchimie, lieu et Traque, santé, Chutes et expérience.
Personnage et effets fictifs, dés préparés pour des exemples reproductibles ; vrais gestes
dans une instance jetable. [Repères des chapitres](../../output/clips/nephilim/chapitres.md).

## Le jet`);
fs.writeFileSync(manuel,texte);
const synthese='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
texte=fs.readFileSync(synthese,'utf8');
texte=texte.split('\n').map(l=>l.startsWith('| [Nephilim Légende]')?l.replace('70 cas (§ 183)', `70 cas (§ 183) ; [clip des mécanismes (${duree})](../../output/clips/nephilim-mecanismes.mp4) livré le 05/11, § 216`):l).join('\n');
texte=texte.replace('## Nephilim Légende\n', `## Nephilim Légende\n\n**Clip Playwright livré le 05/11/2026 :** [MP4 de ${duree}](../../output/clips/nephilim-mecanismes.mp4), huit chapitres sur les mécanismes propres au jeu, légendes françaises et dés préparés. Scénario en profil jetable, douze images de scènes et dix-huit images du MP4 relues ; [repères et rapport](../../output/clips/nephilim/README.md), registre § 216. Aucun changement du pilote ; l’essai sur tablette physique reste distinct.\n`);
fs.writeFileSync(synthese,texte);
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';
texte=fs.readFileSync(registre,'utf8');
const cle="## La vue d'un coup d'œil", i=texte.indexOf(cle);
if (i<0||texte.includes('### 216 ·')) throw new Error('Vérifier les numéros du registre avant livraison.');
const section=`### 216 · Clip Playwright — mécanismes de Nephilim — 05/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Nephilim ».

- **Livré :** [MP4 de ${duree}](../../output/clips/nephilim-mecanismes.mp4), H.264, 1440 × 900 ; WebM, rapport, repères et images dans output/clips/nephilim/. Curseur, surlignages et légendes françaises sans voix, inspirés des clips RuneQuest/Shadowrun.
- **Scénario :** e2e/clipNephilim.spec.ts, pilote2.0.0 existant, personnage Aster et effets fictifs ; Vécus/Mnémos, métamorphe, Magie/Stase/critique/Sacrifice, pacte, Alchimie, lieu/Conjonction/Traque, santé et Chutes/expérience. Dés préparés, vrais gestes, profil jetable ; aucun src/electron modifié, aucun paquet installé.
- **Vérifié :** build avant essais, lint propre, répétition accélérée puis tournage normal réussis ; treize assertions de fiche/réserves, douze scènes et dix-huit images du MP4 relues, début et fin compris. Manuel et synthèse liés au film. Les deux suites du manuel sont vérifiées après livraison des liens.
- **Limites et reprise :** ouvrir le MP4 ; effets de démonstration non officiels clairement nommés, pas de voix ni d’essai de tablette physique. La montée immédiate de Traque est rappelée comme choix de David, distinct de l’errata. [Reprise](2026-11-05-etat-et-reprise-codex-clip-nephilim.md).
- **Documentation corrigée :** notre remplacement global de la ligne150 avait touché l’ancien tableau de brillance ; « Lampe150 : 0 % » rétabli et validation COC reportée sur sa vraie ligne150. Aucun changement étranger inclus ; aucun commit/push demandé pour le clip.

`;
let tableau=texte.slice(i);
tableau=tableau.replace('| --- | --- | --- | --- | --- |', `| --- | --- | --- | --- | --- |\n| 152 | **Clip des mécanismes de Nephilim** | 🟢 §216 ; MP4 ${duree}, huit chapitres, tournage et images vérifiés —05/11 | Ouvrir le MP4 | Rien |`);
fs.writeFileSync(registre,texte.slice(0,i)+section+tableau);
const reprise='documentation/Planning/2026-11-05-etat-et-reprise-codex-clip-nephilim.md';
texte=fs.readFileSync(reprise,'utf8').replace('Film : `output/clips/nephilim-mecanismes.mp4` et tournage WebM.', `Film : **${duree}, H.264, 1440 × 900**, dans \`output/clips/nephilim-mecanismes.mp4\`, et tournage WebM.`)
 .replace('réussie ; tournage normal et contrôle du MP4 à consigner après export dans le rapport.', 'réussie ; tournage normal réussi, MP4 exporté sans chargement initial, douze images de scènes et dix-huit images du film relues, titres de début et de fin compris.');
fs.writeFileSync(reprise,texte);
controle.relecture='12 images de scènes et 18 images du MP4 examinées, début/fin et chaque chapitre compris.';
controle.build='npm run build : réussi avant les essais';
controle.lint='eslint e2e/clipNephilim.spec.ts : réussi';
fs.writeFileSync(`${dossier}/controle-video.json`,JSON.stringify(controle,null,2)+'\n');
fs.writeFileSync(`${dossier}/README.md`, `# Clip Nephilim — ${duree}

[Ouvrir le MP4](../nephilim-mecanismes.mp4) · [Tournage WebM](../nephilim-mecanismes.webm) · [Repères des huit chapitres](chapitres.md)

Demandé par David le05/11/2026, filmé avec Playwright dans GM-OS. H.264, 1440 × 900,
curseur et légendes françaises, sans voix ni musique. Personnage Aster et effets fictifs,
dés préparés pour montrer des exemples reproductibles. Aucun profil personnel utilisé.

Vécus et Mnémos ; métamorphe ; Magie, Stase, critique et Sacrifice ; invocation/pacte ;
Alchimie et Materiae Primae ; lieu, Conjonction et Traque ; santé et Conséquences ;
Chutes, recharge de Stase et expérience. Le récit et les décisions restent à la table.
La montée immédiate de l’Intensité de Traque est identifiée comme choix de David,
distinct de l’aube prévue dans l’errata. Pas de démonstration de tablette physique.

Scénario : e2e/clipNephilim.spec.ts ; pilote2.0.0 de output/campagnes-tests/nephilim/.
Construction et lint réussis, répétition et tournage normal réussis ; treize assertions
sur les changements réels, douze images de scènes et dix-huit images du film relues.
Rapports : verification.json (parcours/repères), controle-video.json (format/relecture).

Pour refaire : npm run build, puis npx playwright test e2e/clipNephilim.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert à répéter, jamais au film final. Aucun paquet installé,
aucun code applicatif modifié, aucun commit/push demandé pour cette livraison.
`);
console.log(duree);
