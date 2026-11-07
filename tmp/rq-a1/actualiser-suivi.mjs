import fs from 'node:fs';
import assert from 'node:assert/strict';
const p='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let t=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const remplacer=(a,b)=>{assert(t.includes(a),a);t=t.replace(a,b);};
remplacer('RuneQuest 2.1.0 côté générateur (recette encore 2.0.0)', 'RuneQuest 2.1.0 (recette initiale 2.0.0, **alignée sur 2.1.0 par RQ-A1**, § 202)');
remplacer('**RQ-A2 est maintenant livré, à essayer** après cette nouvelle correction, registre § 201.', '**RQ-A2 est validé** par David : « ok c’est bon on fait RQ-A1 ». **RQ-A1 est livré, à essayer**, registre § 202 : trois archives 2.1.0, 320 champs, 78 cas dont douze LOCAL ; preuves séparées des rapports historiques.');
remplacer('| RuneQuest | Essayer les PV de cible corrigés, aligner les campagnes sur 2.1.0, puis compléter dégâts spéciaux et rangs d’action |', '| RuneQuest | Essayer la recette 2.1.0 livrée (RQ-A1), puis compléter dégâts spéciaux et rangs d’action ; affichage des PV de cible validé |');
remplacer('- [ ] **RQ-A2 · P0 — Cible RuneQuest : livré, à essayer (01/11).**', '- [x] **RQ-A2 · P0 — Cible RuneQuest : livré et validé par David (01/11).**');
remplacer('- [ ] **RQ-A1 · P1 — Recette RuneQuest :** passer les campagnes 2.0.0 en 2.1.0 et éprouver les coups localisés à l’import.', '- [ ] **RQ-A1 · P1 — Recette RuneQuest : livré, à essayer (01/11).** Trois archives 2.1.0/320 champs, 78 cas dont douze LOCAL ; import, remplacement, coups localisés et trois Hub éprouvés en instance jetable.');
t=t.replace(/\| 🔴 P1 · RQ-A1[^\n]+/, '| 🟠 P1 · RQ-A1 — Recette alignée sur 2.1.0 | **Livré le 01/11**, registre § 202 : trois archives avec pilote 2.1.0/320 champs et sept compteurs de dégâts ; C07 bras 0/3, C08 tête −4/4 ; 21 PJ, 78 cas dont douze LOCAL ; ancien ZIP/CSV/rapports conservés à part | 96 tests passent ; pilote historique 2.0.0 conservé par Nexus puis remplacé explicitement par 2.1.0 ; imports, armure/plafond/soins, PJ/PNJ/autonome, Porter le coup, persistance et remplacement isolé de 02, trois Hub et zéro fuite éprouvés ; nouveau cahier à essayer par David. [Reprise](2026-11-01-etat-et-reprise-codex-runequest-recette-210.md) |');
t=t.replace(/\| 🟠 P0 · RQ-A2[^\n]+/, '| 🟢 P0 · RQ-A2 — PV affichés du bon combattant | **Livré et validé par David le 01/11**, registre § 201 : localisation/journal sans PV du lanceur ; nom de cible + zone + PV maximum de sa fiche, actualisés au changement de cible et de fiche ; valeur absente inconnue, zéro conservé ; détails au meneur seulement | 89 tests ciblés, lint et build/types réussis ; essai Electron et capture dans la [reprise](2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md). David : « ok c’est bon on fait RQ-A1 » ; nouvel essai d’intégration au § 202 |');
remplacer("La campagne 2.0.0 reste utilisable pour ses mécaniques d'origine.", "Le lot courant est aligné en 2.1.0 ; l'ancien lot 2.0.0 reste conservé comme historique.");
remplacer('**Reste :** essayer le nouvel affichage RQ-A2 ; les fonctions précédemment livrées sont validées par David le 01/11.', '**Reste :** essayer le nouveau cahier RQ-A1 (cas RQ-LOCAL-01 à 12 en priorité) ; RQ-A2 et les fonctions précédemment livrées sont validés par David le 01/11.');
remplacer('RuneQuest montre déjà le décalage 2.0.0/2.1.0 dans ses fichiers de recette', 'RuneQuest avait ce décalage 2.0.0/2.1.0, corrigé par RQ-A1 ; la dépendance déjà installée reste à remplacer explicitement');
remplacer('**Suite choisie par David :** NP-C1 validé ; RQ-A2 livré, nouvel essai attendu, puis preuve RuneQuest alignée (RQ-A1),', '**Suite choisie par David :** NP-C1 et RQ-A2 validés ; RQ-A1 livré, nouveau cahier à essayer,');
t=t.split('\n').map(l=>{if(!l.startsWith('| [RuneQuest]'))return l;const c=l.split('|');c[2]=' 🟢 9 · 🟠 1 · 🔴 4 ';c[4]=' RQ-A1 livré (2.1.0, 78 cas), nouvel essai attendu ; RQ-A2 et GM-05 validés ; dégâts spéciaux/RA puis dérivés/magie restent à faire ';return c.join('|');}).join('\n');
fs.writeFileSync(p,t);

const registre='documentation/Planning/2026-08-23-chantiers-gares.md';
let r=fs.readFileSync(registre,'utf8').replaceAll('\r\n','\n');
// Le § 186 est le chantier des gardes, sans lien avec cette recette.
const debut186=r.indexOf('### 186 ·'),fin186=r.indexOf('### 187 ·');
assert(debut186>0&&fin186>debut186);
let garde=r.slice(debut186,fin186).replace(/\n> \*\*Suivi du 01\/11 :\*\*[^\n]+\n/,'');
r=r.slice(0,debut186)+garde+r.slice(fin186);
r=r.split('\n').map(l=>{if(!l.startsWith('| 122 |'))return l;const c=l.split('|');c[c.length-2]=' Rien ';return c.join('|');}).join('\n');
const d=r.indexOf('### 201 ·'),f=r.indexOf("## La vue d'un coup d'œil",d);
assert(d>0&&f>d&&!r.includes('### 202 ·'));
let rq=r.slice(d,f);
rq=rq.replace('- **Reste :** nouvel essai de David pour cette correction (case RQ-A2 vide). RQ-A1 reste séparé : les archives de recette demeurent 2.0.0.', '- **Validation de David le 01/11 :** « ok c’est bon on fait RQ-A1 ». RQ-A2 coché/vert ; recette alignée séparément au § 202.');
r=r.slice(0,d)+rq+r.slice(f);
const nouveau=`### 202 · RQ-A1 — campagnes RuneQuest alignées sur 2.1.0 — 01/11/2026

David : « ok c'est bon on fait RQ-A1 » ; validation de RQ-A2 consignée au § 201.

- **Livré :** trois archives 2.1.0, gabarit 320 champs, 21 PJ aux mêmes IDs pour les trois joueurs ; maxima et dégâts locaux séparés, C07/C08 corrigés ; 78 cas humains dont douze LOCAL, nouveau CSV vierge. Ancien ZIP, pilote, CSV et rapports 2.0.0 conservés à part, hors du ZIP courant.
- **Vérifié :** 96 tests, lint et build/types passent ; un E2E Electron : ancien pilote conservé par Nexus puis remplacé explicitement, trois imports, sentinelles, PJ/PNJ/autonome, armure/plafond/soins, Porter le coup, persistance, remise à zéro de 02 sans changer note/blessure de 01 ; trois Hub, HTML/PM, zéro marqueur secret. Plugin structurel, 39 médias décodés, neuf rendus et sept captures examinés ; rapports liés aux SHA, refus d’un rapport périmé testé sur une copie jetable, ZIP rouvert.
- **Sources/isolement :** export 2.1.0 et export des joueurs absents : pilote reconstruit par le générateur versionné depuis l'historique et relevé minimal autorisé réutilisé, absence signalée en provenance. Essais isolés/hors bac à sable déjà autorisés, aucun accès personnel, aucun src/ ou electron/ modifié par ce lot, aucun paquet ni Git d’écriture.
- **Reste :** essai humain RQ-A1, case vide/orange ; importer explicitement le pilote 2.1.0 avec Remplacer, puis le seul laboratoire voulu si 01 est déjà joué. [Reprise et livraison](2026-11-01-etat-et-reprise-codex-runequest-recette-210.md).

`;
r=r.replace("## La vue d'un coup d'œil",nouveau+"## La vue d'un coup d'œil");
r=r.replace('| 137 | **RuneQuest — PV de cible** | § 201 ; RQ-A2 livré, 89 tests ciblés, lint et build/types passent — 01/11 | Localiser, changer de cible et vérifier ses PV maximum | Nouvel essai de David ; recette 2.1.0 séparée (RQ-A1) |', '| 138 | **RuneQuest — recette 2.1.0** | § 202 ; RQ-A1 livré, 96 tests, E2E et trois Hub passent, 78 cas — 01/11 | Remplacer explicitement le pilote puis importer le seul laboratoire voulu ; cas RQ-LOCAL | Nouvel essai de David ; historique 2.0.0 conservé |\n| 137 | **RuneQuest — PV de cible** | § 201 ; RQ-A2 livré et validé par David — 01/11 ; 89 tests, lint, build et E2E passent | RQ-A2 coché ; suite RQ-A1 au § 202 | Aucun pour ce correctif |');
r=r.replace('| GM-05 validé ; RQ-A2 livré au § 201, puis RQ-A1 |', '| GM-05/RQ-A2 validés ; RQ-A1 livré au § 202 |');
fs.writeFileSync(registre,r);

for(const nom of ['2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md','2026-10-30-etat-et-reprise-codex-campagnes-runequest.md']){
    const f='documentation/Planning/'+nom;let contenu=fs.readFileSync(f,'utf8');const i=contenu.indexOf('\n');
    contenu=contenu.slice(0,i)+'\n\n> **Suivi du 01/11 :** RQ-A2 validé par David ; RQ-A1 livré en 2.1.0/320 champs, 78 cas. Le texte ci-dessous conserve son état de livraison initial ; [reprise courante](2026-11-01-etat-et-reprise-codex-runequest-recette-210.md).'+contenu.slice(i);
    fs.writeFileSync(f,contenu);
}
console.log('RQ-A2 validé ; RQ-A1 livré, à essayer ; synthèse et registre actualisés.');
