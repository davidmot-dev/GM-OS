import fs from 'node:fs';
const cheminSynthese = 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let s = fs.readFileSync(cheminSynthese, 'utf8');
for (const id of ['COC-A1', 'COC-A2', 'COC-A3']) s = s.replace(new RegExp(`^- \\[ \\] \\*\\*${id}[^\\n]+`, 'm'), ligne => `${ligne.trimEnd()} **Livré le 04/11 en 2.1.0, à essayer par David** ([suivi](2026-11-04-coc-a1-a3.md), § 214).`);
s = s.replace(/^\| \[Chroniques Oubliées Contemporain\][^\n]+/m, '| [Chroniques Oubliées Contemporain](#chroniques-oubliées-contemporain) | 🟢 10 · 🟠 3 · 🔴 3 | **Pilote 2.1.0, 04/11 (§ 214)** : COC-A1/A2/A3 réalisés, essais automatisés et Electron en cours de clôture ; DM/critique/FOR/RD, santé persistante et DEF effective, rôles/Pulp/bandes. **À essayer par David**. Acquis 2.0 du 31/10 conservés ; fonctions initiales validées le 01/11. COC-A4/A5/A6 restent proposés |');
const debut = s.indexOf('## Chroniques Oubliées Contemporain'), fin = s.indexOf('## Crimes', debut);
let coc = s.slice(debut, fin);
coc = coc.replace('pilote **2.0.0**', 'pilote **2.1.0** (COC-A1/A2/A3, 04/11 ; réalisation distincte de l’essai restant par David)');
coc = coc.replace('(`Export Dirvers/corriges/coc/COC_driver_gmos_finir.gmos-driver`, variante au 3d6 par\n`outils/coc/finir_coc.py --3d6`)', '([d20](../../Export%20Dirvers/corriges/coc/COC-2.1.0-d20.gmos-driver), [option 3d6](../../Export%20Dirvers/corriges/coc/COC-2.1.0-option-3d6.gmos-driver), générateur `outils/coc/ameliorer_coc.mjs`)');
const rows = {
 'COC-A1': '| 🟠 P1 · COC-A1 — De l\'arme aux dommages | **Réalisé le 04/11, pilote 2.1.0 ; à essayer par David.** DM repris depuis l’arme du jet, type explicite, FOR contact/lancer/mains nues, critique fixe ; cible et RD unique, coup verrouillé | Cas du livre : d8=7 +8 critique =15 ; RD2 →13. Résistances spéciales, zones et structures restent des arbitrages du MJ. [Suivi et preuves](2026-11-04-coc-a1-a3.md) |',
 'COC-A2': '| 🟠 P1 · COC-A2 — États de santé jusqu\'au tour suivant | **Réalisé le 04/11, pilote 2.1.0 ; à essayer par David.** DEF effective séparée de sa base, demandes CON confirmées, action perdue, préparation physique, déplacement et durées, coma et mort explicites ; suivi persistant | 10 cases : −3DEF, CON10 ; perte d’action consommée une fois, rechargement sans rejeu. Tour suivant compte les durées ; hors combat, temps confirmé par le MJ. [Suivi](2026-11-04-coc-a1-a3.md) |',
 'COC-A3': '| 🟠 P1 · COC-A3 — PNJ par rôle et bandes | **Réalisé le 04/11, pilote 2.1.0 ; à essayer par David.** Préparation du rôle, choix de caractéristiques et budget Pro/Expert, DEF/Init, Pulp explicite, critiques interdits aux figurants/seconds ; bandes sur Galerie et plateau autonome | Standard20 ; Pulp4/12/24, seuils6/12/18/24 du premier rôle ; bande3 : +5 sans autre condition, une touche retire un membre sans DM. Capacités appliquées selon leur contexte ; aucun profil imposé aux PJ. [Suivi](2026-11-04-coc-a1-a3.md) |',
};
for (const [id, row] of Object.entries(rows)) coc = coc.replace(new RegExp(`^\\| 🔴 P1 · ${id}[^\\n]+`, 'm'), row);
coc = coc.replace('**À cadrer avant extension :** la variante 3d6 existe déjà. Son import/remplacement réel\nreste à essayer ;', '**Option déjà éprouvée le 03/11 :** la variante 3d6 existe déjà, son import/remplacement réel et le retour au d20 ont été testés ;');
const reste = coc.indexOf('**Reste :**'), temoin = coc.indexOf('**Cas témoin :**', reste);
coc = coc.slice(0, reste) + '**Reste :** essai de COC-A1/A2/A3 par David ; COC-A4 (héroïsme hors test), COC-A5 (choc), COC-A6 (capacités de Voies vérifiables). Les fonctions initiales 2.0 ont été validées le 01/11. À la table : manœuvres, contexte des capacités PNJ, résistances spéciales, zones et structures, poursuites et égalités d’initiative.\n\n**Sujets à auditer :** avantages du héros hors du test, conditions de poursuite, santé psychique et capacités officielles de Voies. Les DM et les échelles PNJ ont désormais leur parcours COC-A1/A3 ; ne pas les remettre dans les développements non commencés.\n\n' + coc.slice(temoin);
s = s.slice(0, debut) + coc + s.slice(fin);
fs.writeFileSync(cheminSynthese, s);
const chemin53 = 'documentation/User Guides/53-Les-jeux-et-leurs-mecaniques.md';
let m = fs.readFileSync(chemin53, 'utf8');
m = m.replace(/^(\| 🎭 \*\*Chroniques Oubliées Contemporain\*\*[^\n]+?) \| \[Chroniques/m, '$1 ; **COC-A1/A2/A3 (2.1.0)** : DM de l’arme, FOR et critique fixe, cible et RD unique ; DEF effective et conséquences confirmées, action perdue et durées persistantes ; rôles PNJ, Pulp explicite et bandes sans DM | [Chroniques');
m = m.replace(/^(\| \*\*d20 \+ caractéristique contre la difficulté\*\* \(`coc`\)[^\n]+?) Voir le \[guide COC\]/m, '$1 `dommages` ajoute les DM de l’arme, la FOR et le critique fixe puis transfère le coup à une cible, RD retirée une fois ; `suivi` affiche la DEF effective et propose les conséquences CON/action perdue/inconscience, persistantes et confirmées par le meneur ; `pnj` prépare les rôles, leurs budgets, Pulp explicite 4/12/24 et les bandes (une touche retire un membre sans DM, surnombre en conditions). Voir le [guide COC]');
fs.writeFileSync(chemin53, m);
const cheminRegistre = 'documentation/Planning/2026-08-23-chantiers-gares.md';
let r = fs.readFileSync(cheminRegistre, 'utf8');
const section = `## 214 · COC — COC-A1, COC-A2 et COC-A3 (04/11/2026)

- **Origine :** David : « on va commencer COC-A1, COC-A2 et COC-A3 », « GM-OS est fermé », puis « continue ». Pas de commit/push demandé pour ce lot. Essais avec services locaux autorisés dans des profils jetables.
- **Réalisé, essai David restant :** pilote **2.1.0**, DM de l’arme avec type/FOR/critique fixe et RD unique, DEF effective et suivi des conséquences confirmées, rôles PNJ/Pulp explicite et bandes. Identifiants et anciennes clés conservés. Les capacités PNJ restent appliquées selon leur contexte ; COC-A4/A5/A6 ne sont pas réalisés ici.
- **Source :** livre original du NAS, lecture directe des p. 71–73, 88–92, 108–111 ; tables p. 72/108/110 rendues et relues. La référence locale de trois pages n’est pas le livre complet.
- **Ancres :** [suivi détaillé](2026-11-04-coc-a1-a3.md), [reprise](2026-11-04-etat-et-reprise-codex-coc.md), [manuel](../User%20Guides/54-Jeu-COC.md), outils/coc/ameliorer_coc.mjs, src/modules/combat/coc.ts, e2e/cocAvance.spec.ts.
- **Pilotes à réimporter :** [d20](../../Export%20Dirvers/corriges/coc/COC-2.1.0-d20.gmos-driver) ou [3d6](../../Export%20Dirvers/corriges/coc/COC-2.1.0-option-3d6.gmos-driver), avec **Remplacer**. Copies suivies dans output/coc-a1-a3/pilote/.
- **Vérifications :** types et construction passent ; lint zéro erreur (un avertissement préexistant). Tests ciblés passent ; suite complète et fin des parcours Electron/captures en cours. Le parcours a détecté et fait corriger le compteur de cases des PNJ de Galerie. Résultats finaux à consigner au suivi avant livraison.
- **État :** 🟠 réalisé, validation de David attendue. Synthèse : dix acquis conservés, trois lots orange et trois propositions rouges.

`;
if (r.includes('## 214 ·')) throw new Error('Section 214 déjà présente : relire avant modification.');
r = r.replace("## La vue d'un coup d'œil", section + "## La vue d'un coup d'œil");
r = r.replace('| 149 | **Clip', '| 150 | **COC — COC-A1/A2/A3** | 🟠 § 214 ; pilote 2.1.0, réalisation terminée, contrôles en clôture — 04/11 | Réimporter d20 ou 3d6 avec Remplacer, essayer dégâts/santé/rôles | Essai David restant |\n| 149 | **Clip');
fs.writeFileSync(cheminRegistre, r);
