import fs from 'node:fs';
const synthese = 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let s = fs.readFileSync(synthese, 'utf8');
for (const id of ['COC-A4', 'COC-A5', 'COC-A6']) s = s.replace(new RegExp(`^- \\[ \\] \\*\\*${id}[^\\n]+`, 'm'), ligne => `${ligne.trimEnd()} **Réalisé en 2.2.0 le 04/11, vérifications en cours, essai David restant** ([suivi](2026-11-04-coc-a4-a6.md), § 215).`);
s = s.replace(/^\| \[Chroniques Oubliées Contemporain\][^\n]+/m, '| [Chroniques Oubliées Contemporain](#chroniques-oubliées-contemporain) | 🟢 10 · 🟠 6 · 🔴 0 | **Pilote 2.2.0, 04/11 (§ 215)** : COC-A1 à COC-A6 réalisés, **essai David restant** ; A4 héroïsme hors test et Légende, A5 choc/séquelle persistants sans seconde jauge, A6 premier ensemble de cinq capacités contextuelles. Deux variantes d20/3d6 ; corpus19/19 relu, contrôles finaux en cours. Les acquis 2.0 restent validés depuis le 01/11 |');
const debut = s.indexOf('## Chroniques Oubliées Contemporain'), fin = s.indexOf('## Crimes', debut);
let coc = s.slice(debut, fin);
coc = coc.replace('manuel 2.1.0', 'manuel 2.2.0').replace('§ 214 (COC-A1/A2/A3)', '§ 214 (COC-A1/A2/A3) et § 215 (COC-A4/A5/A6)');
coc = coc.replace('pilote **2.1.0** (COC-A1/A2/A3, 04/11 ; réalisation distincte de l’essai restant par David)', 'pilote **2.2.0** (COC-A1 à COC-A6, 04/11 ; réalisation distincte de l’essai restant par David)');
coc = coc.replaceAll('COC-2.1.0-d20.gmos-driver', 'COC-2.2.0-d20.gmos-driver').replaceAll('COC-2.1.0-option-3d6.gmos-driver', 'COC-2.2.0-option-3d6.gmos-driver');
coc = coc.replace('générateur `outils/coc/ameliorer_coc.mjs`', 'générateurs `outils/coc/ameliorer_coc.mjs` puis `etendre_coc.mjs`');
coc = coc.replace('18/18 ; douze fiches corrigées, six conformes', '18/18 ; douze fiches corrigées, six conformes. **Complément du 04/11 : 19/19 relues**, fiche Santé psychique ajoutée et cinq capacités de Voies sourcées p.29, 36–37/60 ; empreinte existante conservée');
const rows = {
 'COC-A4': '| 🟠 P2 · COC-A4 — Héroïsme hors du test | **Réalisé le 04/11 en 2.2.0, à essayer par David.** Destinations Init., DEF, DM infligés/subis et mouvement ; débit unique, reçus persistants et expiration ; Légende complète jusqu’au début du prochain tour | DEF+5 conserve la base et le jet déjà lancé ; Init. du plateau ajustée ; DM15+5−RD2=18 ou DM15−5−RD2=8. Une seule échelle Héros/Blues. [Suivi](2026-11-04-coc-a4-a6.md) |',
 'COC-A5': '| 🟠 P2 · COC-A5 — Santé psychique et choc | **Réalisé le 04/11 en 2.2.0, à essayer par David.** Événement/rang, vraie VOL, durée et nature de choc confirmées, séquelle séparée, rounds persistants et soins/calmant arbitrés | Table p.77 retenue :10/15/20 et1/1–3/1–6 ; Blues conservé, aucun rejeu au rechargement. Enragé/Immobilisé/Inconscient/Ralenti influent sur tests ou DEF ; symptômes et thérapie restent à la table. [Suivi](2026-11-04-coc-a4-a6.md) |',
 'COC-A6': '| 🟠 P2 · COC-A6 — Capacités de Voies vérifiables | **Premier ensemble réalisé le 04/11 en 2.2.0, à essayer par David.** Amateur (contact/VOL), Furtif, Vigilant, Fin limier, Spécialiste ; référence explicite et rangs contigus, choix de contexte à chaque jet, aperçu/coût0/durée un test | Aucun bonus d’une case seule ni d’un nom libre. Même calcul au Hub, source et page au journal. Les autres capacités/équipements/gains de caractéristiques restent à la table. [Suivi](2026-11-04-coc-a4-a6.md) |',
};
for (const [id, row] of Object.entries(rows)) coc = coc.replace(new RegExp(`^\\| 🔴 P2 · ${id}[^\\n]+`, 'm'), row);
const cadrer = coc.indexOf('**À cadrer avant extension :**'), reste = coc.indexOf('**Reste :**', cadrer);
if (cadrer >= 0) coc = coc.slice(0, cadrer) + '**Option3d6 :** import/remplacement réel et retour au d20 déjà éprouvés le 03/11 puis sur2.1 le04/11 ; plages18/3 de base = convention GM-OS documentée. En2.2, bonus par rang1/2/3 aux rangs1/3/5, choc11/14/17 et plages3/4/6. Le+3 d’Enragé reste conservé et ajustable : le livre ne chiffre pas sa conversion.\n\n' + coc.slice(reste);
const r = coc.indexOf('**Reste :**'), temoin = coc.indexOf('**Cas témoin :**', r);
coc = coc.slice(0, r) + '**Reste :** essai de COC-A1 à COC-A6 par David. Le premier ensemble de capacités est volontairement limité aux cinq capacités nommées ; les autres, équipements et gains permanents de caractéristiques restent à la création/table. Symptômes et thérapie des séquelles, manœuvres, résistances spéciales/zone/structures, poursuites et égalités d’initiative restent au MJ.\n\n**Sujets à auditer ensuite :** autres capacités officielles et procédures de poursuite. Le héros hors test, les chocs et les capacités déjà nommées ont désormais leur parcours ; ne pas les présenter comme non commencés.\n\n' + coc.slice(temoin);
s = s.slice(0, debut) + coc + s.slice(fin);
s = s.replace('**COC relu en entier le 31/10** (§ 193 : 18 sur 18).', '**COC relu en entier le 31/10** (§ 193 : 18 sur 18), **complété le04/11 :19 sur19** (§215, santé psychique et cinq capacités, 138 tests de corpus).');
fs.writeFileSync(synthese, s);
const p53 = 'documentation/User Guides/53-Les-jeux-et-leurs-mecaniques.md';
let m = fs.readFileSync(p53, 'utf8');
m = m.replace(/^(\| 🎭 \*\*Chroniques Oubliées Contemporain\*\*[^\n]+?) \| \[Chroniques/m, '$1 ; **2.2.0** : héroïsme hors test et Légende, événements/chocs/séquelles persistants, cinq capacités de Voies contextuelles, même calcul au Hub | [Chroniques');
m = m.replace('`pnj` prépare les rôles, leurs budgets, Pulp explicite 4/12/24 et les bandes (une touche retire un membre sans DM, surnombre en conditions).', '`pnj` prépare les rôles, leurs budgets, Pulp explicite 4/12/24 et les bandes (une touche retire un membre sans DM, surnombre en conditions). `heroisme` propose Init./DEF/DM/mouvement et Légende, avec un débit et une expiration ; `psychisme` prépare l’événement de VOL, son choc et sa séquelle, avec confirmation du meneur, sans seconde jauge ; `voies` relie les rangs enregistrés à un premier ensemble officiel de capacités, choisies pour le contexte du test, source/page et aperçu visibles sur PC et Hub.');
fs.writeFileSync(p53, m);
const registre = 'documentation/Planning/2026-08-23-chantiers-gares.md';
let j = fs.readFileSync(registre, 'utf8');
if (j.includes('### 215 ·')) throw new Error('§215 existe déjà : relire avant modification.');
const section = [
 '### 215 · COC — COC-A4, COC-A5 et COC-A6 — 04/11/2026', '',
 '- **Origine :** David : « on va commencer COC-A4, COC-A5 et COC-A6 » ; à « GM-OS tourne-t-il ? », réponse « non ». Aucun commit/push demandé. Les fichiers A1/A2/A3 restent conservés et leur validation humaine reste attendue.',
 '- **Réalisé en2.2.0, essai David restant :** avantages héroïques hors test et Légende ; événements/VOL/choc/séquelle persistants et confirmés ; premier ensemble de cinq capacités de Voies, référence explicite et choix contextuel. Mêmes identifiants et anciennes clés, variantes d20/3d6.',
 '- **Sources :** livre original du NAS, p.29/36–37/60–61/77–82, tables rendues et relues. Table77 retenue face à l’exemple contradictoire78. Cumul des durées de choc présenté puis confirmé par le MJ ; +3 Enragé en3d6 non chiffré par le livre, conservé et réglable.',
 '- **Ancres :** [suivi](2026-11-04-coc-a4-a6.md), [manuel](../User%20Guides/54-Jeu-COC.md), outils/coc/etendre_coc.mjs, src/modules/dice/systemes/{avantages,psychisme,voies}DeCoc.ts, e2e/cocAventures.spec.ts. Corpus19/19 relu ; nouvelle fiche psychique, cinq capacités contextualisées.',
 '- **Pilotes :** [d20](../../Export%20Dirvers/corriges/coc/COC-2.2.0-d20.gmos-driver) ou [3d6](../../Export%20Dirvers/corriges/coc/COC-2.2.0-option-3d6.gmos-driver), avec **Remplacer** ; copies suivies output/coc-a4-a6/pilote/.',
 '- **Vérifications en cours de clôture :** tests ciblés et corpus verts, types et construction passent, lint sans erreur ; Electron confirme les calculs héros et la persistance psychique. Reste le trajet Formulaire/Hub/journal et les captures finales, puis la suite complète.',
 '- **État :** 🟠 A4/A5/A6 réalisés, à essayer par David ; A1/A2/A3 toujours orange. Synthèse10 acquis verts/6 lots orange/0 rouge.', '',
].join('\n');
j = j.replace("## La vue d'un coup d'œil", section + "\n## La vue d'un coup d'œil");
j = j.replace('| 150 | **COC', '| 151 | **COC — COC-A4/A5/A6** | 🟠 §215 ; pilote2.2.0, héros/choc/Voies réalisés, vérifications en clôture —04/11 | Réimporter2.2 avec Remplacer, essayer les trois cartes | Essai David restant |\n| 150 | **COC');
fs.writeFileSync(registre, j);
