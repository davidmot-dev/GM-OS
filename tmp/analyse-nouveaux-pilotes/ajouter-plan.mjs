import fs from 'node:fs';
import assert from 'node:assert/strict';
const fichier='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let texte=fs.readFileSync(fichier,'utf8').replaceAll('\r\n','\n');
const titre='## Résumé et plan d’action à cocher — les quatre nouveaux pilotes';
assert.ok(!texte.includes(titre),'Le plan existe déjà : préserver les cases remplies.');
const plan=`${titre}

**Plan du 01/11/2026, à remplir par David.** Les quatre pilotes ont déjà leurs jets,
leur santé centrale et leur fiche HTML reliée. Le travail proposé concerne surtout
les suites de combat, les ressources et les procédures encore manuelles.

| Jeu | Résumé du travail restant |
| --- | --- |
| RuneQuest | Aligner les campagnes sur 2.1.0, afficher les PV de la bonne cible, puis compléter dégâts spéciaux et rangs d’action |
| Degenesis | Relier l’Égo de l’initiative à la première action, puis aider défense, armure et contamination |
| COC Contemporain 2 | Relier l’arme aux dégâts, appliquer les conséquences des blessures et distinguer les rôles des PNJ |
| Shadowrun Anarchy | Suivre le drain et ses soins, préparer la Matrice, puis fiabiliser Anarchy et réserves collectives |
| Commun | Corriger GM-05, sécuriser la reprise des anciennes fiches et compléter les essais de droits/variantes |

**Mode d’emploi :** remplacer [ ] par [x] quand le lot est réalisé **et essayé par David**.
S’il est livré mais encore à essayer, laisser la case vide et écrire « livré, à essayer » à côté.
Les identifiants renvoient aux constats et critères détaillés dans les sections des jeux et
dans « Améliorations communes ». Les cases ne remplacent pas leurs indicateurs d’avancement.

**Jeu à travailler en premier après les urgences :** ____________________
**Prochain lot choisi :** ____________________
**Date / notes de suivi :** ____________________

### 1. Corriger les urgences et remettre la recette à niveau

- [ ] **NP-C1 · P0 — GM-05 :** empêcher les secrets de séance d’arriver aux Hub ; refaire les quatre contrôles de confidentialité.
- [ ] **RQ-A2 · P0 — Cible RuneQuest :** afficher les PV de zone du combattant visé, sans reprendre ceux du lanceur.
- [ ] **RQ-A1 · P1 — Recette RuneQuest :** passer les campagnes 2.0.0 en 2.1.0 et éprouver les coups localisés à l’import.

### 2. Sécuriser les reprises et les essais communs

- [ ] **NP-C2 · P1 — Anciennes fiches :** proposer un diagnostic et un aperçu de conversion, avec conservation des valeurs et retour arrière.
- [ ] **NP-C3 · P1 — Droits et variantes :** vérifier le refus d’éditer le PJ d’autrui, puis les imports COC 3d6 et Shadowrun alternatif.

### 3. Compléter RuneQuest

- [ ] **RQ-A3 · P1 — Dégâts :** relier arme, spéciale/critique, parade et armure au coup localisé.
- [ ] **RQ-A4 · P1 — Rangs d’action :** distinguer mêlée, tir et magie ; gérer délais, égalités et limite de 12.
- [ ] **RQ-A5 · P2 — Dérivés :** proposer PV, zones, bonus de dégâts et ENC calculés, sans effacer les blessures existantes.
- [ ] **RQ-A6 · P2 — Magie et progression :** suivre coûts PM/PR, culte utilisé, inspiration et expérience, avec validation du MJ.

### 4. Compléter Degenesis

- [ ] **DEG-A1 · P1 — Égo du round :** payer une seule fois à l’initiative, reporter le bonus à la première action puis l’épuiser.
- [ ] **DEG-A2 · P1 — Combat :** préparer défense, armure et dégâts nets ; suivre l’action utilisée pour une défense active.
- [ ] **DEG-A3 · P2 — Maxima :** calculer Égo et Sporulation selon la branche choisie, avec explication du calcul.
- [ ] **DEG-A4 · P2 — Jets liés :** assister coopération, combinaisons et confrontations, sans compter deux fois les déclencheurs.
- [ ] **DEG-A5 · P2 — Contamination :** séparer permanent et temporaire ; suivre Brûlure et Potentiels explicitement sélectionnés.
- [ ] **DEG-A6 · P2 — Adversaires :** donner aux adversaires autonomes les deux pistes et l’Égo, comme aux PNJ avec fiche.

### 5. Compléter COC Contemporain 2

- [ ] **COC-A1 · P1 — Dégâts :** lancer les DM de l’arme, appliquer FOR et bonus critique, puis retirer la RD une seule fois.
- [ ] **COC-A2 · P1 — Blessures :** suivre DEF effective, tests de CON, actions perdues et durée des conséquences.
- [ ] **COC-A3 · P1 — PNJ :** distinguer rôles, critiques autorisés, santé Pulp et bandes de sbires.
- [ ] **COC-A4 · P2 — Héroïsme :** appliquer les bonus hors test à leur bonne destination et pour la bonne durée.
- [ ] **COC-A5 · P2 — Choc :** préparer l’événement psychique, son test, son état et ses conséquences.
- [ ] **COC-A6 · P2 — Voies :** intégrer d’abord quelques capacités officielles choisies, avec rang, effet, coût et source vérifiés.

### 6. Compléter Shadowrun Anarchy

- [ ] **SR-A1 · P1 — Drain :** conserver l’origine des blessures, refuser les soins interdits et suivre les malus temporaires.
- [ ] **SR-A3 · P1 — Matrice :** préparer mode de connexion, accès, Firewall, backdoor, risque minimum et surveillance.
- [ ] **SR-A2 · P2 — Cohérence :** aider les calculs de réserve/seuils et vérifier Anarchy au-delà de 99 ainsi que les suites d’Essence.
- [ ] **SR-A4 · P2 — Planification :** suivre préparation, paiement du flashback et menace, avec un seul débit et les bons droits.
- [ ] **SR-A5 · P2 — Opposition :** traiter les égalités et profils adverses ; éprouver la variante alternative déjà codée.
- [ ] **SR-A6 · P3 — Rigging :** choisir d’abord la référence de résistance avec David, puis suivre véhicule, mode et biofeedback.

### 7. Clore le lot choisi avant d’en commencer un autre

**Lot concerné par cette validation :** ____________________

- [ ] Les tests ciblés et le cas de recette du lot passent ; les limites restantes sont notées.
- [ ] L’import, la sauvegarde et le Hub ont été vérifiés quand le changement les concerne.
- [ ] David a essayé le résultat ; date et observations : ____________________
- [ ] Le manuel, les preuves, le registre et l’avancement de cette synthèse sont à jour.

**Suivi : 27 lots proposés + 4 contrôles de clôture.** Toutes les cases commencent vides ;
les **177 tests du socle déjà passés** ne valident pas les fonctions futures.
Avant toute modification du code applicatif, vérifier avec David que GM-OS est fermé.
`;
assert.equal(texte.split("## Vue d'ensemble").length,2);
texte=texte.replace("## Vue d'ensemble",plan+'\n'+"## Vue d'ensemble");
assert.equal((plan.match(/^- \[ \]/gm)||[]).length,31);fs.writeFileSync(fichier,texte);
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';
let r=fs.readFileSync(registre,'utf8').replaceAll('\r\n','\n');
const ancre='### 199 · Analyse des améliorations RuneQuest, Degenesis, COC et Shadowrun — 01/11/2026';
assert.equal(r.split(ancre).length,2);
r=r.replace(ancre,ancre+'\n\n**Complément demandé par David :** « fais moi un résumé et un plan d’action avec des checkbox que je peux remplir ». Résumé et plan ajoutés en tête de la synthèse : 27 lots à cocher, quatre contrôles de clôture, identifiants conservés et toutes les cases initialement vides. Aucun développement lancé.');fs.writeFileSync(registre,r);
const reprise='documentation/Planning/2026-11-01-etat-et-reprise-codex-analyse-pilotes.md';
fs.appendFileSync(reprise,'\n## Complément — résumé et cases à cocher\n\nÀ la demande de David, résumé et plan d’action ajoutés en tête de la synthèse : 27 lots,\nquatre contrôles de clôture, champs libres pour le jeu prioritaire, le prochain lot et les\nobservations. Toutes les cases sont vides ; les cocher après réalisation et essai de David.\nLes propositions détaillées et les compteurs restent inchangés. Aucun code modifié.\n');
console.log('Résumé et plan : 27 lots + 4 contrôles, cases vides.');
