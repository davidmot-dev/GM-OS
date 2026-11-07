import fs from 'node:fs';
import assert from 'node:assert/strict';
const p='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let t=fs.readFileSync(p,'utf8');
t=t.replace('**RQ-A1 est livré, à essayer**','**RQ-A1 est livré et validé par David**')
 .replace('- [ ] **RQ-A1 · P1 — Recette RuneQuest : livré, à essayer (01/11).**','- [x] **RQ-A1 · P1 — Recette RuneQuest : livré et validé par David (01/11).**')
 .replace('Essayer la recette 2.1.0 livrée (RQ-A1), puis compléter dégâts spéciaux et rangs d’action ; affichage des PV de cible validé','Recette 2.1.0 et affichage des PV de cible validés ; compléter dégâts spéciaux et rangs d’action')
 .replace('| 🟠 P1 · RQ-A1 —','| 🟢 P1 · RQ-A1 —')
 .replace('nouveau cahier à essayer par David.', 'validation de David le 01/11 : « ok c’est bien, c’est testé. Commit et pousse ». [Confirmation](../../output/campagnes-tests/runequest/VALIDATION-DAVID.md).')
 .replace('**Reste :** essayer le nouveau cahier RQ-A1 (cas RQ-LOCAL-01 à 12 en priorité) ; RQ-A2 et les fonctions précédemment livrées sont validés par David le 01/11.', '**Reste :** RQ-A3 à RQ-A6 ; RQ-A1, RQ-A2 et les fonctions précédemment livrées sont validés par David le 01/11. Le cahier et le CSV initiaux restent vierges faute de résultats détaillés par cas ; validation globale consignée séparément.')
 .replace('NP-C1 et RQ-A2 validés ; RQ-A1 livré, nouveau cahier à essayer,','NP-C1, RQ-A2 et RQ-A1 validés ; choisir ensuite un lot restant,');
t=t.split('\n').map(l=>l.startsWith('| [RuneQuest]')?l.replace('🟢 9 · 🟠 1 · 🔴 4','🟢 10 · 🟠 0 · 🔴 4').replace('RQ-A1 livré (2.1.0, 78 cas), nouvel essai attendu ; RQ-A2 et GM-05 validés','RQ-A1 (2.1.0, 78 cas), RQ-A2 et GM-05 validés par David le 01/11'):l).join('\n');
assert(t.includes('- [x] **RQ-A1'));fs.writeFileSync(p,t);
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';let r=fs.readFileSync(registre,'utf8');
r=r.replace('- **Reste :** essai humain RQ-A1, case vide/orange ; importer explicitement le pilote 2.1.0 avec Remplacer, puis le seul laboratoire voulu si 01 est déjà joué.', '- **Validation de David le 01/11 :** « ok c’est bien, c’est testé. Commit et pousse ». RQ-A1 coché/vert, publication Git demandée ; [confirmation](../../output/campagnes-tests/runequest/VALIDATION-DAVID.md). Aucun résultat individuel inventé, cahier/CSV initiaux et ZIP inchangés. RQ-A3 à A6 restent à faire.')
 .replace('| § 202 ; RQ-A1 livré, 96 tests, E2E et trois Hub passent, 78 cas — 01/11 | Remplacer explicitement le pilote puis importer le seul laboratoire voulu ; cas RQ-LOCAL | Nouvel essai de David ; historique 2.0.0 conservé |','| § 202 ; RQ-A1 livré et validé par David, 96 tests, E2E et trois Hub passent, 78 cas — 01/11 | RQ-A1 coché ; commit et push demandés | Aucun pour RQ-A1 ; historique 2.0.0 conservé |')
 .replace('GM-05/RQ-A2 validés ; RQ-A1 livré au § 202','GM-05/RQ-A2/RQ-A1 validés ; choisir un lot restant');
fs.writeFileSync(registre,r);
const reprise='documentation/Planning/2026-11-01-etat-et-reprise-codex-runequest-recette-210.md';let h=fs.readFileSync(reprise,'utf8');const i=h.indexOf('\n');
h=h.slice(0,i)+'\n\n> **Validation et publication demandées le 01/11 :** David : « ok c’est bien, c’est testé. Commit et pousse ». RQ-A1 coché/vert ; le texte ci-dessous conserve l’état de livraison initial. Confirmation sous output/campagnes-tests/runequest/VALIDATION-DAVID.md ; état Git dans la note de publication du jour.'+h.slice(i);
fs.writeFileSync(reprise,h);
console.log('RQ-A1 validé/coché, indicateurs et registre actualisés ; ZIP/CSV conservés.');
