# Améliorations possibles de tous les pilotes GM-OS

**Synthèse établie le 20 octobre 2026**, à la demande de David : « un document général qui
reprend les améliorations possibles pour tout les drivers », avec une section par pilote.
Base de l'inventaire initial : `712f70c1`.

**Document vivant.** David demande le 20/10/2026 : « il faut tenir ce document à jour quand
on met en place une amélioration et quand on rajoute un nouveau driver ». Cette règle est
inscrite dans [`AGENTS.md`](../../AGENTS.md) et s'applique à chaque livraison concernée.

Ce document rassemble les améliorations identifiées pour les jeux représentés dans
le dépôt par un manuel, un corpus ou un export (**douze lors du recensement initial**).
Il distingue les acquis, les travaux
proposés et les sujets à auditer. Il ne constitue pas un inventaire des pilotes installés
dans les campagnes de David, dont les données n'ont pas été consultées.

Les anciens projets ont été rapprochés des notes récentes et des lecteurs du code : les
fonctions déjà livrées, notamment pour Rêve de Dragon et Nephilim, ne sont pas remises à faire.
Les corpus techniques **2d20** et **SRD Year Zero Engine** ne constituent pas deux pilotes
de jeu supplémentaires ; leurs évolutions communes sont abordées en fin de document.

**Priorités proposées dans cette synthèse :**

- **P0** : référence indispensable ou erreur qui peut changer le résultat d'une règle.
- **P1** : raccord ou procédure centrale à compléter.
- **P2** : assistance supplémentaire, suivi ou confort de séance.
- **P3** : extension importante ou option à cadrer selon les usages.
- **Essai** : fonction déjà réalisée, à éprouver en conditions réelles.

**Indicateurs d'état** (demande de David du 22/10/2026 : *« que ce qui est accompli ou non soit
plus visible »*), en tête de chaque ligne de lot ou de sujet :

- 🟢 **fait** : livré et essayé par David, plus rien à faire sur cette ligne ;
- 🟠 **en partie, ou à essayer** : livré mais essai de David attendu, livré en partie (un reste
  est indiqué), ou fonction réalisée à éprouver en conditions réelles ;
- 🔴 **à faire** : rien de livré sur cette ligne.

Dans la vue d'ensemble, la colonne **Avancement** compte les lignes de chaque section.

Cette hiérarchie commune ne remplace pas les priorités détaillées des audits. Aucun lot de
développement n'est autorisé par la demande de synthèse seule. **Dune a été repris le 25/10**,
sur demande explicite de David : « Je voudrais finir les améliorations du driver Dune ».

**Analyse des quatre nouveaux pilotes — 01/11/2026**, base de code 0a9431ef :
RuneQuest 2.1.0 (recette initiale 2.0.0, **alignée sur 2.1.0 par RQ-A1**, § 202), Degenesis 2.0.0, COC **Chroniques
Oubliées Contemporain 2e édition** 2.0.0, Shadowrun **Anarchy 2.0** 2.0.0. Ce n'est ni
L'Appel de Cthulhu ni un autre Shadowrun. Les six propositions ajoutées par jeu sont distinctes du socle livré ;
leur état est actualisé ci-dessous à chaque réalisation et validation.
Un traitement laissé au MJ n'est pas, à lui seul, un défaut du pilote.

Lecture croisée : générateurs/exports conservés dans les lots, règles déjà relues, code,
manuels et rapports des quatre recettes. **177 tests ciblés / 12 fichiers passent** le 01/11
(jets, quatre portes de dégâts et quatre panneaux). Aucun nouvel essai Electron ni lecture
des campagnes personnelles ; les preuves d'import/Hub citées restent celles des lots datés.
[Périmètre et constats](2026-11-01-analyse-nouveaux-pilotes.md), registre **§ 199**.

## Résumé et plan d’action à cocher — les quatre nouveaux pilotes

**GM-05 corrigé et validé par David le 01/11/2026.** 70 tests ciblés et quatre tests
Electron passent : douze Hub simulés sans fuite, résumés publics reçus et secrets conservés
chez le MJ, y compris après reconnexion. [Bilan](2026-11-01-correction-gm05.md), registre § 200.
Les échecs GM-05 des anciennes recettes restent des constats historiques avant ce correctif.

**Validation de David le 01/11 :** « ok c’est essayé c’est bon... J’ai fait tout les autres tests en attentes aussi. On passe au point 2 affichage des PV ». Les fonctions déjà livrées des quatre pilotes passent au vert sur cette validation globale ; les rapports/CSV historiques ne sont pas réécrits ni détaillés a posteriori. Les propositions non réalisées restent à faire. **RQ-A2 est validé** par David : « ok c’est bon on fait RQ-A1 ». **RQ-A1 est livré et validé par David**, registre § 202 : trois archives 2.1.0, 320 champs, 78 cas dont douze LOCAL ; preuves séparées des rapports historiques.

**Plan du 01/11/2026, à remplir par David.** Les quatre pilotes ont déjà leurs jets,
leur santé centrale et leur fiche HTML reliée. Le travail proposé concerne surtout
les suites de combat, les ressources et les procédures encore manuelles.

| Jeu | Résumé du travail restant |
| --- | --- |
| RuneQuest | Recette 2.1.0 et affichage des PV de cible validés ; compléter dégâts spéciaux et rangs d’action |
| Degenesis | Relier l’Égo de l’initiative à la première action, puis aider défense, armure et contamination |
| COC Contemporain 2 | Relier l’arme aux dégâts, appliquer les conséquences des blessures et distinguer les rôles des PNJ |
| Shadowrun Anarchy | Suivre le drain et ses soins, préparer la Matrice, puis fiabiliser Anarchy et réserves collectives |
| Commun | GM-05 validé ; sécuriser la reprise des anciennes fiches et compléter les essais de droits/variantes |

**Mode d’emploi :** remplacer [ ] par [x] quand le lot est réalisé **et essayé par David**.
S’il est livré mais encore à essayer, laisser la case vide et écrire « livré, à essayer » à côté.
Les identifiants renvoient aux constats et critères détaillés dans les sections des jeux et
dans « Améliorations communes ». Les cases ne remplacent pas leurs indicateurs d’avancement.

**Jeu à travailler en premier après les urgences :** ____________________
**Prochain lot choisi :** ____________________
**Date / notes de suivi :** ____________________

### 1. Corriger les urgences et remettre la recette à niveau

- [x] **NP-C1 · P0 — GM-05 : corrigé et essayé (01/11).** Validation de David ; quatre contrôles applicatifs passent sur douze Hub.
- [x] **RQ-A2 · P0 — Cible RuneQuest : livré et validé par David (01/11).** Les PV maximum de zone suivent la cible sélectionnée ; valeur absente annoncée inconnue, aucune reprise des PV du lanceur.
- [x] **RQ-A1 · P1 — Recette RuneQuest : livré et validé par David (01/11).** Trois archives 2.1.0/320 champs, 78 cas dont douze LOCAL ; import, remplacement, coups localisés et trois Hub éprouvés en instance jetable.

### 2. Sécuriser les reprises et les essais communs

- [x] **NP-C2 · P1 — Anciennes fiches : livré et validé par David le 03/11.** Diagnostic, aperçu, correspondances explicites, export JSON et restauration protégée ; valeurs, notes et PV conservés. Quatre parcours applicatifs passent.
- [x] **NP-C3 · P1 — Droits et variantes : éprouvés et validés par David le 03/11.** Refus d’éditer autrui sur les quatre jeux et persistance ; COC 3d6 et Shadowrun alternatif importés, jets et retour au standard vérifiés.

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

## Vue d'ensemble

| Pilote | Avancement | État de la connaissance | Première amélioration ou prochaine étape proposée |
| --- | --- | --- | --- |
| [Alien](#alien) | 🟢 11 · 🟠 0 · 🔴 0 | A0–A9 validés par David ; **A10, préréglages et remise à zéro des modules, livré et essayé le 23/10** (registre § 163) ; campagne de recette avec trois modules préparés livrée le 26/10 (§ 180) | Essayer les 74 cas du cahier ; GM-05 transversal signalé ; aucun lot A0–A10 à refaire |
| [Barbarians of Lemuria](#barbarians-of-lemuria) | 🟢 5 · 🟠 0 · 🔴 0 | **Nouveau pilote, fini le 27/10**, 2.0.0 (registre § 184) : corpus relu, jet contre 9 avec dés de bonus/malus et héroïsme, fiche HTML au moteur 19 reliée, thème contrôlé | Réimport avec Remplacer et essai de David |
| [Blade Runner](#blade-runner) | 🟢 4 · 🟠 0 · 🔴 0 | **Fini le 24/10, pilote 2.0.0** (registre § 174) : audit, pupitre, mort et stabilisation, guérison, et au-delà ; **essayé par David le 25/10** | Rien : tous les lots faits |
| [Chroniques Oubliées Contemporain](#chroniques-oubliées-contemporain) | 🟢 10 · 🟠 0 · 🔴 6 | **Nouveau pilote, fini le 31/10**, 2.0.0 (§ 193) : corpus relu 18/18, d20 + caractéristique, RD et vingt cases, Héros ou Blues, option 3d6 ; fiche au moteur 22 reliée (151/151), thème et visuels (§ 190-192) ; **lot de recette éprouvé (§ 194)**, 24 PJ, 70 cas, 71 tests, trois imports et Hub  **Fonctions livrées validées par David le 01/11.** | Arme → DM/critique, états/DEF, rôles PNJ et Pulp ; puis Héros hors test, choc, Voies ; socle et GM-05 validés le 01/11 ; NP-C2/NP-C3 livrés, six parcours applicatifs et validation de David (03/11) |
| [Crimes](#crimes) | 🟢 13 · 🟠 0 · 🔴 0 | Audit du manuel ; **C0 relu et validé le 23/10, C1 à C3, C5 et C6 livrés et essayés le 22/10** ; **tous les lots livrés et essayés le 23/10** : circonstances, hermétiques, opposition, psychologie et seuils, manœuvres, contacts, fortune, création (registre § 157–161) | Rien : tous les lots faits ; tir multiple, intimider, rivalités et fortune commune restent au meneur |
| [Cthulhu Hack](#cthulhu-hack) | 🟢 5 · 🟠 0 · 🔴 0 | Cinq améliorations livrées et essayées par David le 23/10 contre le livre français (p. 31–32, 34, 42, 50–52), registre § 164 ; campagnes de recette livrées le 25/10 et rattachées aux trois joueurs existants (§ 178) | Essayer les 59 cas du cahier ; défaut transversal GM-05 (`gmSecrets` transmis aux tablettes) consigné au § 1 bis. Soins spéciaux et suites mentales restent des sujets d'audit séparés |
| [Degenesis](#degenesis) | 🟢 7 · 🟠 0 · 🔴 6 | **Nouveau pilote, fini le 30/10**, 2.0.0 (registre § 188) : corpus relu 16/16 contre le livre, réserve de d6 à 4+ avec déclencheurs, échec critique, succès d'office au-delà de 12, Égo et Traumatismes ; deux pistes de santé et attaque mentale dans Combat-OS ; initiative en succès ; fiche HTML au moteur 21 reliée (129/129), thème contrôlé ; lot de recette § 189 : 21 PJ, 66 cas, imports et trois Hub éprouvés. **Fonctions livrées validées par David le 01/11.** | Égo initiative/première action, armure et défense, maxima explicites, contamination permanente ; socle et GM-05 validés le 01/11 ; NP-C2/NP-C3 livrés, six parcours applicatifs et validation de David (03/11) |
| [Dune](#dune) | 🟢 9 · 🟠 0 · 🔴 0 | D0–D8 et fiches PJ/Maison validés par David le 25/10, pilote 2.0.0 (§ 175–176), corpus relu (§ 173) ; campagne de recette avec Maison et conflits préparés livrée le 26/10 (§ 182) | Essayer les 66 cas du cahier ; GM-05 transversal signalé ; arbitrages narratifs au MJ |
| [Nephilim Légende](#nephilim-légende) | 🟢 9 · 🟠 1 · 🔴 0 | **N1–N9 livrés et essayés le 23/10** (registre § 165) ; campagne et deux laboratoires livrés le 26/10, 70 cas (§ 183) | L'essai sur tablette physique |
| [NOC](#noc) | 🟢 9 · 🟠 0 · 🔴 0 | **Tous les points validés par David le 25/10 : « ok tout fonctionne »** ; pilote 2.0.0, moteur de fiches 18, commit `bf83cbf6`. [Bilan](2026-10-25-noc-finir.md), registre § 177 ; campagne et Cabale de recette livrées (§ 179) | Essayer les 62 cas de recette ; GM-05 transversal signalé ; les portées et arbitrages narratifs restent à la Loi |
| [Rêve de Dragon](#rêve-de-dragon) | 🟢 6 · 🟠 1 · 🔴 0 | Socle R0–R7, boucle TMR ; **pilote fini le 24/10**, 2.0.0 (registre § 168, [bilan](2026-10-24-reve-de-dragon-finir.md)) : phases du round, famine/potions, entraînement, Haut-Rêve, calendrier Clock-OS, PNJ ; campagne de recette avec carte TMR et 14 tables livrée le 26/10 (§ 181) | Réimport et essai de David avec les 69 cas ; GM-05 transversal signalé |
| [RuneQuest](#runequest) | 🟢 10 · 🟠 0 · 🔴 4 | **Nouveau pilote, fini le 30/10**, 2.1.0 (registre § 187) : corpus relu 17/17 contre le livre et l'errata, d100 en cinq niveaux, test de caractéristique, résistance, augmentation, opposition, localisation ; coups localisés dans Combat-OS (armure, zone, total, effets) ; fiche HTML au moteur 20 reliée, thème contrôlé. **Fonctions livrées validées par David le 01/11.** | RQ-A1 (2.1.0, 78 cas), RQ-A2 et GM-05 validés par David le 01/11 ; dégâts spéciaux/RA puis dérivés/magie restent à faire ; NP-C2/NP-C3 livrés, six parcours applicatifs et validation de David (03/11) |
| [Shadowrun Anarchy](#shadowrun-anarchy) | 🟢 6 · 🟠 0 · 🔴 6 | **Pilote fini le 01/11**, 2.0.0 (registre § 197) : corpus relu 19/19 contre le livre, réserve compétence + attribut à 5+, dés de risque doublés et complications, RR de la ligne, Anarchy (avantage, relance, gains) ; moniteur d'état contre les seuils de la fiche ; fiche HTML au moteur 23 reliée (120/121). Thème, fiche, bannière et identité livrés le 31/10 (§ 196) ; **lot de recette éprouvé le 01/11 (§ 198)** : 22 PJ, 64 cas, 72 tests, imports et trois Hub. **Fonctions livrées validées par David le 01/11.** | Drain/soins, Matrice préparée, cohérence des dérivés et Anarchy, réserves/opposition ; rigging après arbitrage ; socle et GM-05 validés le 01/11 ; NP-C2/NP-C3 livrés, six parcours applicatifs et validation de David (03/11) |
| [Star Trek Adventures](#star-trek-adventures) | 🟢 4 · 🟠 1 · 🔴 0 | Pilote et LCARS documentés ; **audit et toutes les améliorations livrés le 23/10** (registre § 167, [audit](2026-10-23-star-trek-ameliorations.md)), pilote 2.0.0, **essai de David validé le 24/10** | Essais matériels LCARS |
| [Symbaroum](#symbaroum) | 🟢 10 · 🟠 0 · 🔴 0 | Audit du livre et de l'export corrigé ; jet corrigé et page du manuel livrés (registre § 145) ; **S1 à S4 livrés le 22/10** (§ 149, 150, 155), essai de David validé ; **S0, S2 et S5 à S9 livrés le 23/10** (§ 166), pilote 2.0.0 | Réimport du pilote 2.0.0 et essai de David |
| [Torg Eternity](#torg-eternity) | 🟢 0 · 🟠 0 · 🔴 5 | Nombreuses fonctions livrées ; limites documentées | Atouts/capacités structurés et échanges des Cartes du Destin |
| [Within](#within) | ⏸️ en suspens | Pilote retiré par David (24/10) ; rien à faire tant qu'il ne revient pas | Si le jeu revient : livre, corpus, configuration mécanique vérifiable |

## Alien

**Données de recette livrées le 26/10/2026** ([bilan](2026-10-26-campagne-recette-alien.md),
registre § 180) : enquête **La dernière relève d’Orphée**, trois PJ pour les joueurs existants
Thomas/Marie/Lucas, deux laboratoires et **74 cas manuels**. MU/TH/UR, M314 et combat spatial
déjà préparés dans les trois archives ; 17 contrôles de données, import et neuf ouvertures de
modules sur trois vrais Hub vérifiés. **Seule l’assertion transversale GM-05 échoue** (secrets
de séance diffusés) ; préparations privées des modules filtrées. Essais de David et matériel
restant à faire. Aucune modification des lots A0–A10 ni du code applicatif dans ce paquet.

**Références :** [audit détaillé](2026-10-19-alien-propositions.md) et
[registre A0–A8](2026-10-19-registre-ameliorations-alien.md), qui fait foi pour leur avancement.
L'analyse concerne le livre de base français et ses errata, sans mélange avec Evolved Edition.

**Mise à jour du 20/10 :** David engage A0/A1 et confirme GM-OS fermé. Export réel à
7 sections et 40 champs contrôlé ; corrigé 1.1.0 dans `Export Dirvers/corriges/`.
Annulation à 10+, effets, contagion, Stress après dégâts et bilan de traumatisme sont
livrés : 867 tests de régression, types, construction et lint ciblé réussis ; recette
Electron et vrai Hub Edge à 360/768/1 180 px validée, captures relues.
[État et preuves A0/A1](2026-10-20-alien-a0-a1.md).
David valide son essai A0/A1 le 20/10 (« ok j'ai fais le test c'est bien ») et demande A2.
A2 est livré en v1.2.0 : armes Bonus/Dégâts/Portée reliées à l'HTML, modificateurs signés,
aide, réserve sans plafond artificiel, opposition et budget d'éclats persistant.
Le corrigé conserve les 40 champs et en ajoute trois (43 au total). **1 005 tests**,
types, construction et lint ciblé réussis ; parcours Electron et Hub à trois tailles validé.
Voir le [bilan A2](2026-10-20-alien-a2.md). Le 21/10, David valide A2 (« ok A2 est testé
c'est bien, on fait A3 »). A3 est livré le 21/10 en v1.3.0 : tir automatique,
chargeurs, protection, critiques humains, Brisé, Trépas, soins séparés et guérison.
Le champ `armes_proprietes` porte le total à 44 ; les 42 liens HTML sont conservés.
**1 330 tests**, types, construction et lint ciblé réussis ; recette Electron,
carte de combat et vrai Hub à trois tailles réussie, onze captures relues, vrai Hub à 360/768/1 180 px.
Voir le [bilan A3](2026-10-21-alien-a3.md). **Essai A3 de David validé le 21/10** :
« ok c'est bon pour A3, commit et pousse ».

**21/10, reprise A4 :** David demande « reprend le travail, on va reprendre avec A4 »
et confirme GM-OS fermé. A4 est réalisé : synthétiques sans Stress/Panique/forçage,
critiques D6 persistants, aggravation du résultat immédiatement répété, activité selon
les avaries, Arrêt du système, réactivation et réparation Comtech distinctes,
trauma permanent conservé et immunités. Export v1.4.0, mêmes 44 champs et liens HTML.
**1 439 tests**, types, construction et lint ciblé sans erreur ; recette Electron,
carte de combat et vrai Hub Edge à trois tailles réussie, cinq captures relues et
ajoutées au manuel. Essai de David validé le 21/10. Voir le [bilan A4](2026-10-21-alien-a4.md).
A5 est demandé ensuite par David le 21/10 (« on va continuer avec A5 »), GM-OS confirmé
fermé : réserves individuelles/collectives, échéances, quatre états reliés à l'HTML,
restrictions de récupération, radiations temporaires/permanentes et encombrement réalisés.
Export **1.5.0**, **49 champs et 46 liens** ; types, build, lint ciblé et **1 460 tests**
réussis. Recette finale Electron/combat/Hub à trois tailles réussie, huit captures A5
relues et ajoutées au manuel. Voir le [bilan A5](2026-10-21-alien-a5.md).
**Essais A4 et A5 validés par David le 21/10** : « ok A4 et A5 tester c'est bon ».
David demande ensuite « on va continuer avec A6 et A7 » et confirme GM-OS fermé :
**A6/A7 livrés et contrôlés le 22/10**, après sa reprise « continue ».
A6 suit les actions/réactions, les cartes multiples d'une seule créature, ses critiques
et le sang acide XX121. A7 suit objectifs privés, fins d'acte, bilans PX, apprentissage,
Camarade/Rival et fétiche par période. Les circonstances et conséquences narratives
restent confirmées par Maman.
Exports **1.6.0 et 1.7.0**, ce dernier incluant A0–A6, **49 champs et 46 liens HTML**.
**1 567 tests dans 119 fichiers**, types/build et lint ciblé sans erreur ; recette réelle
A0–A7 Electron/combat/Hub à trois tailles réussie, neuf captures relues et intégrées.
Objectifs absents du flux public, remise privée retrouvée à la reconnexion ; réponses
du bilan et achats conservés sans double attribution. Voir le
[bilan A6/A7](2026-10-21-alien-a6-a7.md) et la
[passation du 22/10](2026-10-22-etat-et-reprise-codex-alien-a6-a7.md).
**Essais A6/A7 validés par David le 22/10** : « ca marche pour A6 et A7, commit et pousse, après tu fais A8, GM-OS est fermé ». Commit `3cffff3d` poussé après typage, lint global, 8 590 tests et build réussis ; A8 engagé ensuite.

**A8 livré et contrôlé le 22/10 :** mode discret optionnel du M314, zones et pions privés,
déplacements par Tour, scan unique et batterie propre ; dossiers d'acte et objectifs privés
dans MU/TH/UR. Export **1.8.0** incluant A0–A7, **49 champs et 46 liens** conservés.
**173 tests/21 fichiers, 74 vérifications autonomes**, types/build/lint ciblé réussis ;
recette réelle A8 et quatre parcours existants Electron/Hub réussis, six captures relues.
Les Tours écoulés sont reportés explicitement dans A5 ; détection et combat restent arbitrés
par Maman. Voir le [bilan A8](2026-10-22-alien-a8.md) et la
[passation](2026-10-22-etat-et-reprise-codex-alien-a8.md). **Essai A8 de David validé le 23/10** (« ca marche A8 est testé ») ;
réalisation A8 commitée dans `8b314bf5` avec les exports corrigés A4–A8, à la demande
de David du 22/10 (« commit tout ce qu'il reste sous ta responsabilité »), et poussée depuis.

**Déjà disponible :** réserve de base et Stress, forçage, test et cumul des paniques,
Points de Récit, gestes de repos/objet fétiche, santé raccordée, initiative par cartes,
fiche HTML, MU/TH/UR et détecteur de mouvement. Ces outils ne sont pas à reconstruire.

| Lot | Priorité | Amélioration possible |
| --- | --- | --- |
| 🟢 A0 | Livré et essayé | Export réel, identifiants et correspondance vérifiés ; Santé raccordée ; errata et référence de Panique corrigés. Essai de David validé le 20/10 |
| 🟢 A1 | Livré et essayé | Verdict, effets, contagion, Stress après dégâts et bilan de traumatisme vérifiés ; durées et conséquences narratives validées par Maman. Essai de David validé le 20/10 |
| 🟢 A2 | Livré et essayé | Bonus/Dégâts/Portée reliés ; modificateurs signés et aide (max. 3), bonus conservés au-delà de dix dés ; opposition, défenseur sans forçage et budget des actions d'éclat conservés. Essai de David validé le 21/10 |
| 🟢 A3 | Livré et essayé | Tir automatique et cibles secondaires, chargeurs/rechargement, protection avant dégâts, vrais D66 humains, Brisé, échéances de Trépas et soins séparés. Temps de jeu et résultats médicaux confirmés par Maman ; PNJ humain déclaré explicitement. Contrôlé et essai de David validé le 21/10 |
| 🟢 A4 | Livré et essayé | Aucun Stress/Panique/forçage ; D6 synthétiques persistants, avaries et activité, réactivation puis réparation Comtech, immunités et trauma conservé. 1 439 tests et recette Electron/Hub réussis le 21/10 ; essai de David validé le 21/10 |
| 🟢 A5 | Livré et essayé | Tests de Réserve sans Panique, stocks individuels/collectifs, échéances et reçus ; états HTML et restrictions, Rads permanents et surplus, charge sur masses confirmées. 1 460 tests et recette Electron/combat/Hub réussis le 21/10 ; huit captures relues ; essai de David validé le 21/10 |
| 🟢 A6 | Livré et essayé | Actions lentes/rapides, réactions et surveillance ; cartes selon la Vitesse avec une seule Santé ; attaques, critiques D6 et acide XX121. Contrôlé le 22/10 ; arbitrage narratif par Maman |
| 🟢 A7 | Livré et essayé | Objectifs remis en privé par acte, Récit Cinéma, bilan PX conservé, achats et apprentissage uniques, Camarade/Rival et fétiche par période. Contrôlé le 22/10 |
| 🟢 A8 | Livré et essayé | Détecteur raccordé en option au plan privé, déplacements par Tour, mouvements à portée et batterie M314 ; dossiers d'acte et remise privée dans MU/TH/UR. Contrôlé le 22/10 ; combat spatial séparé |

| 🟢 A9 | **Livré et essayé le 23/10** | Combat spatial (p. 188-201) : vaisseaux du livre ou libres, postes tenus par les PJ, Tours en quatre phases, ordres secrets depuis la tablette, verrouillage, pilotage, tirs, Protection, coque, avaries D66/2D6 (errata 55), réparations d'urgence, Panique spatiale ; pilote 1.9.0. Plan privé d'A8 affiché dès la première zone. Recette réelle Electron et Hub Edge, deux captures |
| 🟢 A10 | **Livré et essayé le 23/10** | Préréglages et remise à zéro des trois modules (MU/TH/UR, détecteur, combat spatial) : la préparation complète sous un nom, rappel et suppression confirmés, remise à zéro qui garde les préréglages ; exemple « relais à sept salles » pour le mode discret. Aucun pilote à réimporter. 10 essais du moteur, 2 d'écran, recette réelle Electron (`e2e/prereglagesAlien.spec.ts`, redémarrage compris), une capture ; suite complète 8 845 essais verts |

**A9 livré le 23/10 (registre § 162)**, demande de David : *« on va faire la suite d'Alien, je voudrais aussi finir Alien aujourd'hui »* ; périmètre « complet ». Module `alien-combat-spatial` (`outils/alien/modules/combat-spatial/`), écrans `src/modules/modulesDuJeu/combatSpatial/`, pilote `Export Dirvers/corriges/Alien_driver_gmos_combat-spatial.gmos-driver` (`outils/alien/ajouter-combat-spatial.mjs`). Réimporté ; **essai de David validé le 23/10** (« tout est testé, tu peux faire les commit et pousser »). Points tranchés : avarie mineure dès un point (table contre texte), contremesures dès la portée Courte, amarrage aux vélocités égales ; réactions et oppositions sans forçage. Le 23/10 aussi : les cases à cocher du poste MU/TH/UR montrent de nouveau leur coche.

**A10 livré le 23/10 (registre § 163)**, demande de David : *« je veux pouvoir faire des pré-reglages et aussi avoir un bouton de reset pour tout remettre à zéro (pour les 3 modules MU/TH/UR) »* ; choix : préparation complète, remise à zéro qui garde les préréglages, exemple du relais livré. Logique commune `outils/alien/modules/prereglages.mjs`, panneau commun `prereglages-vues.mjs` ; données MU/TH/UR v5, détecteur v4, combat spatial v2, migrées sans perte. **Essai de David validé le 23/10** (« A10 testé, c'est bon. Commit et pousse »).
**Cas témoin :** des six suivis d'une Panique effective de 10 annulent l'action ; un Point
de Récit ne doit pas contourner cette conséquence. L'export réel a été vérifié le 20/10.

## Barbarians of Lemuria

**Référence :** [manuel 2.0.0](../User%20Guides/54-Jeu-Barbarians-of-Lemuria.md) ; registre § 184.
**Statut : fini le 27/10/2026** contre le livre français (édition Mythic, `Barbarian of Lemuria-vf.pdf`, pages imprimées) ;
pilote **2.0.0** (`Export Dirvers/corriges/BOL_driver_gmos_2.0.0.gmos-driver`), à réimporter avec **Remplacer**.

**Livré par David le 27/10 :** le pilote forgé, le thème `barbarian` (accepté 0/0) et la fiche HTML
`barbarian-of-lemuria-fr` (acceptée, deux avertissements attendus d'une fiche nouvelle).

| Priorité | Amélioration | Réalisation |
| --- | --- | --- |
| 🟢 P0 | Le jet : le pilote forgé comparait chaque dé au seuil et n'exigeait aucune réussite — tout réussissait | **Livré le 27/10** : `jet.barbarians`, somme de 2d6 + attribut + carrière ou aptitude + difficulté − Défense contre 9 (p. 10, 56, 62) |
| 🟢 P1 | Dés de bonus et de malus, doubles 6 et 1 | **Livré le 27/10** : 2 + n dés, les deux meilleurs ou les deux pires ; succès héroïque, sauf quand seul un double 6 réussit ; échec automatique (p. 8, 56-57) |
| 🟢 P1 | Les points d'héroïsme au jet | **Livré le 27/10** : Faveur divine, succès héroïque et légendaire, échec critique et le point accordé, écrits sur la fiche (p. 57-59) ; jet de réaction et ordre du livre (p. 60) |
| 🟢 P1 | La fiche HTML reliée | **Livré le 27/10** : moteur 19, fiche GM-OS sur les 45 clés, correspondance directe, portrait sur la fiche ; attributs −1 à 5, carrières nommées, Vitalité sous zéro |
| 🟢 P0 avant extension | Corpus relu contre le livre | **Fait le 27/10** : 16/16, onze fiches corrigées |

**Reste :** les propositions ci-dessus ; les fonctions livrées ont été validées par David le 01/11. À la table, par choix : les dégâts (au pupitre), la magie et ses
conditions, la foi, l'alchimie, les batailles terrestres et navales.

**Sujets à auditer :** un jet de dégâts guidé par la catégorie d'arme (d6M, d6B, Vigueur ou sa
moitié, armure) ; le coût de la magie en points de pouvoir ; les points de vilenie des rivaux.

**Cas témoin :** Krongar, Vigueur 3 et Barbare 2, enfonce une porte Ardue : 2d6 + 4, un 4 et un 6
font 14, réussi ; un double 1 échoue même à +12.

## Blade Runner

**Référence :** [manuel 2.0.0](../User%20Guides/54-Jeu-Blade-Runner.md) ; [chantier du 24/10](2026-10-24-blade-runner-finir.md) ; registre § 174.
**Statut : fini le 24/10/2026** contre le livre de base français (`BRN-01_LivreDeRegles.pdf`, pages imprimées) ;
pilote **2.0.0** (`Export Dirvers/corriges/BladeRunner_driver_gmos_finir.gmos-driver`), à réimporter avec **Remplacer**.

**Déjà disponible avant :** dés échelonnés, forçage avec sélection d'un dé à une seule réussite
sur la fiche, coûts en Santé/Sang-froid, Brisé et effets critiques, stress subi, protection,
champs d'Humanité et raccord de la santé à la fiche HTML.

| Priorité | Amélioration | Réalisation |
| --- | --- | --- |
| 🟢 P1 | Offrir au pupitre le même choix de relancer un D10/D12 à une seule réussite que sur la fiche | **Livré le 24/10 (B1)** : « Relancer aussi » au pupitre. La télécommande force sans ce choix (elle ne voit pas les dés) |
| 🟢 P1 | Suivre sauvegardes contre la mort et stabilisation après blessure critique | **Livré le 24/10 (B3–B4)** : bloc « Blessures critiques » sur la carte et la fiche ; sauvegarde forçable hors Brisé, stabilisation Round → Quart → hors de danger, morts instantanées (p. 72–73) |
| 🟢 P2 | Gérer durées de guérison, échéances et rappels | **Livré le 24/10 (B5)** : soins d'un Quart, échéance sur l'horloge de Clock-OS (hors calendrier imaginaire), blessure permanente sur échec, implant (p. 72, 193) |
| 🟢 P0 avant extension | Auditer l'export réel, les exceptions humain/réplicant et les passages du livre | **Fait le 24/10 (B0)** : export du 22/10, tables de Table-OS (conformes), corpus relu 22/22 |

**Au-delà de la liste, retenu par David le 24/10 :** premiers secours et main secourable, critiques
aggravés, soutien et trois D12 (`plafondDesD12: 0`), souvenir clé et objet fétiche, Surprise et
échange de cartes d'initiative (Combat-OS, tout jeu à cartes hors Alien), tables de butin d'essai retirées.

**Essayé par David le 25/10 : validé. Reste :** rien. À la main, par choix : le moment des sauvegardes et des Quarts, les
touches critiques elles-mêmes, Promotion/chinyen/Humanité de fin de session, les manœuvres de poursuite.

**Cas témoin :** le choix de dés fait au pupitre conserve les mêmes réussites et paie le même coût
que le panneau de fiche ; un A/A avec avantage lance trois D12 ; une Plaie au ventre (Perforant 5)
demande une sauvegarde d'Endurance chaque Quart jusqu'à sa stabilisation.

## Chroniques Oubliées Contemporain

**NP-C2 / NP-C3 — reprise commune du 03/11.** Diagnostic et aperçu de reprise des anciennes fiches PJ livrés : conservation, export JSON et retour arrière protégé. 252 tests ciblés et six parcours Electron passent ; huit captures relues. **Validation globale de David le 03/11 : « ok tout est testé, commit et pousse »**. [Suivi et cases à cocher](2026-11-03-np-c2-c3-reprises-droits-variantes.md). Les fonctions du pilote déjà validées restent acquises ; aucun défaut de droits n’est déclaré sur la seule absence d’essai.

**Validation globale des fonctions déjà livrées par David le 01/11/2026**, citation et portée dans le plan à cocher ; les propositions ci-dessous restent séparées.

**Référence :** [manuel 2.0.0](../User%20Guides/54-Jeu-COC.md) ; registre § 193.
**Statut : fini le 31/10/2026** contre le livre de règles de la 2e édition
(`COC2_01_Livre_de_Regles_web_v0.pdf`, NAS), pages imprimées (PDF − 3) ; pilote **2.0.0**
(`Export Dirvers/corriges/coc/COC_driver_gmos_finir.gmos-driver`, variante au 3d6 par
`outils/coc/finir_coc.py --3d6`), à réimporter avec **Remplacer**.

**Livré le 31/10 :** le pilote forgé par David (`COC_driver_gmos_1793367242142`, pilote
`custom-1793122664880`, corpus `coc`) ; le thème `coc` (accepté 0/0, § 190), la fiche HTML
`coc2-fr` (deux pages, 151 clés, § 191, [bilan](2026-10-31-fiche-coc-studio.md)), la bannière et
l'identité d'images (§ 192), faits par Codex
([thème](2026-10-31-etat-et-reprise-codex-theme-coc.md), [fiche](2026-10-31-etat-et-reprise-codex-fiche-coc.md),
[bannière](2026-10-31-etat-et-reprise-codex-banniere-identite-coc.md)).

| Priorité | Amélioration | Réalisation |
| --- | --- | --- |
| 🟢 P0 | Le jet : le pilote forgé additionnait AGI et INT pour le seuil de chaque dé et exigeait dix réussites d'un d20 — tout échouait ; un 1 comptait double, un 20 était une complication | **Livré le 31/10** : `jet.coc` (`dice/systemes/coc.ts`) ; d20 + une caractéristique, l'ATC, l'ATD ou le bonus d'une arme nommée, contre la difficulté (5 à 25) ou la DEF ; 20 naturel réussite critique, 1 naturel échec critique, plages élargies ; dé bonus et dé malus ; conditions (±2/5/10), aides (+2), état préjudiciable, prendre son temps, mode rapide ; malus de l'état de santé sur les actions physiques (p. 56-65, 71, 87-88). Cartes `CocAuJet.tsx`. Validé par David le 01/11 |
| 🟢 P1 | La fiche GM-OS et le pilote 2.0.0 | **Livré le 31/10** : 162 champs — les 151 clés de la fiche HTML (trois traits, trois armes, la protection, six voies de cinq rangs) et les rubriques « Donner corps » du pilote forgé, le modèle d'évolution, l'expérience ; portées du livre sans modificateur fixe. Validé par David le 01/11 |
| 🟢 P1 | L'échelle de santé | **Livré le 31/10** : vingt cases noircies (`combat.casesDeSante`, états à 5/10/15/20) ; `combat.encaissement` (`combat/logic/encaissementDeCoc.ts`) retire la RD, tue au-delà de 20 + CON, appelle le coup de grâce, dit l'état franchi ; malus de l'état à l'initiative ; les cases suivent la fiche et remplacent une santé en PV au premier coup (`casesAligneesSurLaFiche`) ; le badge dit le seuil du jeu (p. 71-73, 88). Validé par David le 01/11 |
| 🟢 P1 | Une échelle d'évolution, héros ou blues (décision de David du 31/10) | **Livré le 31/10** : une jauge et son modèle sur la fiche ; héros : +2/+5 pour un échelon, doublé pour deux, Légende +10, +1 échelon sur un critique ; blues : ±1/3/5/10 sur la VOL, la coercition et les autres interactions (p. 80-84). Validé par David le 01/11 |
| 🟢 P2 | L'option du 3d6 (réglable dans le pilote, décision de David du 31/10) | **Livré le 31/10** : `jet.coc.des: '3d6'` ; 3d6, 4d6 les trois meilleurs, 2d6 ; difficultés 8-20 ; modificateurs réduits ; critique lu sur 18 et 3, que le livre ne chiffre pas (p. 60-61). Validé par David le 01/11 |
| 🟢 P0 avant extension | Corpus relu contre le livre | **Fait le 31/10** : 18/18 ; douze fiches corrigées, six conformes ; retirés : le cumul du héros et du blues, les sbires éliminés par tranche de DM, le premier rôle et sa garde, le round de repos de l'essoufflement ; le départ des vétérans au 10e ramené à son scénario |
| 🟢 P1 | La fiche HTML COC2 reliée | **Livré le 31/10** : moteur 21 → 22 (`outils/coc/integrer_au_moteur.mjs`), correspondance des 151 clés (`outils/coc/relier_fiche_coc.mjs`), validateur 0/0 ; e2e : fiche remplie depuis GM-OS. Validé par David le 01/11 |
| 🟢 P2 | Thème d’interface COC | **Livré le 31/10** par Codex : papier ivoire, prune et orange, deux matières, trois ornements, quinze icônes ; validateur 0/0, revalidé au contrôle. Validés par David le 01/11 |
| 🟢 P2 | Bannière et identité d’images COC2 | **Livrées le 31/10** par Codex : JPEG 2400 × 600, agrandissement de 10,5 % autorisé ; STYLE / AVOID 43/13 mots, déjà dans le pilote. Validés par David le 01/11 |
| 🟢 P1 | Campagnes de recette COC2 | **Livrées et éprouvées le 31/10**, [bilan](2026-10-31-campagne-recette-coc.md), registre § 194 : Les Minutes de Verre et deux laboratoires ; 24 nouveaux PJ pour les trois joueurs autorisés ; 70 cas humains indiqués NON TESTÉS dans le rapport initial ; validation globale de David le 01/11 ; 71 tests passent, trois imports, remplacement isolé, sentinelles, trois Hub, jets, dépenses Héros, fiches HTML et rechargement aboutissent. **GM-05 seul échec du rapport initial : douze chemins de secrets de séance**, corrigé et validé au § 200. Profils aux valeurs choisies, Voies officielles à compléter avec le livre |

**Analyse complémentaire du 01/11/2026 — propositions COC-A1 à COC-A6.**
Le jet, la RD, les vingt cases, Héros/Blues et le raccord HTML sont acquis ; les extensions
ci-dessous complètent les procédures. La relecture porte sur le code courant et le corpus
déjà relu, pas sur une nouvelle lecture intégrale du livre.
Sources : [dégâts](../../docs/systems/coc/rules/degats-et-types-de-degats.md),
[santé](../../docs/systems/coc/rules/sante-et-blessures.md),
[rôles et bandes](../../docs/systems/coc/rules/la-gestion-simplifiee-des-adversaires-par-roles-et-bandes-de-sbires.md),
[règle du jet](../../src/modules/dice/systemes/coc.ts),
[porte des dégâts](../../src/modules/combat/logic/encaissementDeCoc.ts).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🔴 P1 · COC-A1 — De l'arme aux dommages | Les bonus d'attaque se lancent, mais dés de DM, FOR et bonus critique restent saisis séparément. La RD et la santé sont déjà natives | Ajouter une résolution explicite arme/type/critique, aperçu des DM puis transfert à la cible ; retirer la RD une seule fois. Rejouer les 15 DM de l'exemple contre RD 2 : 13 cases. Ne pas doubler tous les DM pour simuler le bonus critique fixe |
| 🔴 P1 · COC-A2 — États de santé jusqu'au tour suivant | L'état modifie les tests physiques et le Jet système d'initiative ; les effets CON, action perdue, déplacement, inconscience et le malus de DEF sont surtout des messages ou des saisies | Proposer les tests de CON et des effets datés, afficher la DEF effective sans écraser sa base, laisser confirmer l'issue au MJ. À 10 cases : −3 en DEF et CON 10 pour la prochaine action ; un rechargement ne rejoue pas la perte d'action |
| 🔴 P1 · COC-A3 — PNJ par rôle et bandes | Le pilote n'expose pas de procédure de rôle/Pulp ; le calcul du critique borne son seuil au maximum naturel et ne possède pas de choix « aucun critique ». Une simple plage ne neutralise donc pas le 20 d'un figurant | Ajouter rôle, mode standard/Pulp, capacités, santé et règle de critique distincts. Vérifier figurant sans critique sur 20 ; 4/12/24 échelons en Pulp, états tous les 6 pour un premier rôle ; bande de trois sbires : une touche en retire un, sans jet de DM. Ne pas appliquer ces règles Pulp à tous les PNJ |
| 🔴 P2 · COC-A4 — Héroïsme hors du test | Dépenser des échelons pour le résultat du test et appliquer le Blues sont livrés ; bonus d'Init., DEF, DM ou mouvement restent manuels | Proposer la destination et la durée du bonus, débiter une seule fois l'échelle, tracer l'effet jusqu'à son expiration. Vérifier que l'achat d'un bonus de DEF ne modifie pas simultanément le test déjà lancé ; conserver un seul modèle Héros ou Blues |
| 🔴 P2 · COC-A5 — Santé psychique et choc | Le panneau sait lancer VOL et régler une plage d'échec critique ; rang de l'événement, état de choc et suivi des conséquences n'ont pas de parcours dédié | Préparer un événement avec son rang, lancer VOL sous les paramètres du corpus, proposer l'état et sa durée avec validation du MJ. Garder distincts choc ponctuel, état du Blues et séquelle ; ne pas dépenser une seconde échelle d'évolution |
| 🔴 P2 · COC-A6 — Capacités de Voies vérifiables | Les six Voies et leurs cinq rangs sont des champs reliés, sans moteur d'effets ; les PJ de recette n'ont pas de capacités officielles préremplies | Outiller d'abord un petit ensemble de capacités choisies dans le livre : rang, texte sourcé, effet déclaré, coût et durée, puis aperçu avant application. Une case de rang seule ne doit produire aucun bonus inventé ; suivre une capacité du formulaire au Hub et au journal |

**À cadrer avant extension :** la variante 3d6 existe déjà. Son import/remplacement réel
reste à essayer ; les critiques 18/3 sont une convention GM-OS explicitée dans le manuel,
pas une règle chiffrée du livre. Conserver un choix documenté, sans annoncer une correction
canonique. Poursuites et approches/sentiments peuvent rester des aides au MJ après ces lots.
GM-05 et migration des anciennes fiches relèvent des priorités communes en fin de document.

**Reste :** les propositions ci-dessus ; les fonctions livrées ont été validées par David le 01/11. À la table, par choix : les DM de l'arme et son bonus critique, les
manœuvres (−5 en « Autre »), l'échelle des PNJ selon leur rôle, les poursuites, la santé
psychique et ses états de choc, les égalités d'initiative (PJ d'abord).

**Sujets à auditer :** les DM et le bonus critique lancés depuis la carte d'arme ; les avantages
du héros hors du test (Init., DEF, DM, action) ; les échelons de santé réduits des PNJ (4, 12, 24,
noircis d'office) ; les conditions défavorables bravées en poursuite ; la santé psychique (test de
VOL, rang de l'événement, état de choc tiré) au panneau.

**Cas témoin :** sauter la haie, 8 au d20 + AGI 3 = 11 contre 10, réussi (p. 8) ; le revolver
d'Amelia, 15 DM moins RD 2 = 13 échelons, affaiblie (p. 72, 89).

## Crimes

**Références :** [audit détaillé](2026-10-19-crimes-propositions.md) et
[registre C0–C8](2026-10-19-registre-ameliorations-crimes.md), source des états.
L'audit porte sur *Crimes 2 — Manuel de l'Enquêteur* et l'export corrigé.

**Déjà disponible :** fiche HTML `crimes-fr` intégrée et raccordée, 12 sections et 203 champs,
compétences, spécialisations, styles, contacts et jauges. Le thème et l'identité existent.

**Depuis le 22/10 (registre § 148)**, la revue de la Forge signale le défaut de C1 : une
difficulté de 9 réussites sur une réserve plafonnée à 0 dé (erreur sur `jet.difficulte`).

**C0 ciblé et C1 livrés le 22/10 (registre § 157).** Corpus : quatre bilans (p. 385), jet sans
compétence (p. 411), santé sans mort automatique (p. 395–396), points d'enquête cumulés sans
dépense (p. 436–438), trace d'outil retirée. Jet : `potentielGarde.ts` et `jet.garde` — d10 ×
Potentiel, garde = Compétence, seuil 9/8/7, 1 gardés d'office, bilan du livre, Névrose dite ;
spécialisation cochée au menu, garde modifiable d'un clic puis consignée ; fiche et tablette.
Pilote `Export Dirvers/corriges/Crime_driver_gmos_garde.gmos-driver`
(`outils/crime/corriger_le_jet_garde.py`) ; page [Crimes](../User%20Guides/54-Jeu-Crimes.md) et
trois captures.

**C2 et C3 livrés le 22/10 (registre § 158).** Atteintes : fatigue, épuisement, blessures par
Potentiel, la plus grave prenant la place d'une moindre (p. 395) ; le jet lance le Potentiel
actuel ; carte « Potentiels et atteintes » ; « Fin de scène » et « Bonne nuit » (`bonneNuit`,
nouveau geste) ; hors de combat à 0, blessure grave sous −1, pas de mort. Dépassement : annoncé
avant le jet, réussites restées dehors gardées contre une fatigue chacune, un par scène. Fiche
HTML : neuf compteurs sous les Potentiels (moteur de fiches version 15). Pilote
`Export Dirvers/corriges/Crime_driver_gmos_c2-c3.gmos-driver`. Réimporté ; essai de David validé le 22/10 (*« ok C1 à C6 est testé »*). **C0 complet le 23/10 (§ 160)** : les 19 fiches relues et corrigées ; la mort à −2 est une consigne
au meneur (p. 393). Ces restes — carte de combat, C4, C7, C8, modificateur de seuil au tir — ont été livrés le
23/10 (§ 161, ci-dessous).

**C5 et C6 livrés le 22/10 (registre § 159).** Dossier d'enquête en tête des Indices : points par
style sur le compteur de la fiche, gain seulement dans un style possédé, points du jet proposés au
meneur ; indices à seuils (« Limier 3 ») révélés à **un seul** enquêteur — sa seule tablette les
reçoit, le serveur filtre par personnage — puis partagés, l'origine gardée. Armes du livre (13
blanches, 28 à feu), opposition, dégâts du livre écrits en marques sur la cible, portée utile et
maximale, incidents E/T/C ; tranches tactiques corrigées. Pilote
`Export Dirvers/corriges/Crime_driver_gmos_c5-c6.gmos-driver`. Réimporté ; essai de David validé le 22/10 (*« ok C1 à C6 est testé »*).

**C0.1 à C8 livrés le 23/10 (registre § 161)**, demande de David : *« Je voudrais finir
complètement Crime aujourd'hui »*. Circonstances du seuil et seuil de 9 imposé à l'angoisse
(p. 389-390, 412) ; consigne de mort à −2 sur la carte ; quinze spécialisations hermétiques ;
pupitre de Dice-OS en « Potentiel GARDE » ; test en opposition (p. 385). Psychologie : carte,
test psychotique, Névrose du jet notée, seuils sous le bandeau — Névrose au seuil à la moitié ou à
zéro, au choix du meneur (nouveaux `variantes` et `'moitie'`). Affaire par lieu et par témoin,
hypothèses. Physique actuel au combat, manœuvres et localisation, munitions, initiative narrative.
Contacts (loyauté de base et appels séparés, influence, perte à +1 Psychose, Nouveau scénario) et
fortune (niveau, jauge). Création (tempérament, budgets, spécialisations) et développement.
Pilote `Export Dirvers/corriges/Crime_driver_gmos_complet.gmos-driver`
(`outils/crime/completer_le_pilote.py`), page [Crimes](../User%20Guides/54-Jeu-Crimes.md) et quatre
captures nouvelles. Réimporté ; **essai de David validé le 23/10** (*« ok tout est testé, c'est bon »*). **Seuil de la jauge de fortune à 10 validé par David le 23/10** (le livre ne le chiffre pas) ; retenus à l’essai : la jauge qui repart à la moitié quand le niveau
change, « 3 points par degré » lu comme 3 × degré visé. **Restent au meneur :** tir multiple,
intimider, Névrose des rivalités entre styles, fortune commune, autres dépenses de développement.

| Lot | Priorité | Amélioration possible |
| --- | --- | --- |
| 🟢 C0 | **Livré et validé le 23/10** | Les 19 fiches relues contre le livre et corrigées, `relu: true` ([trace](2026-10-23-relecture-corpus-crimes.md), registre § 160) ; rapport relu et validé par David le 23/10 |
| 🟢 C1 | **Livré et essayé le 22/10 et le 23/10** | « Potentiel GARDE Compétence » : dés lancés/gardés, 1 obligatoires, spécialisations et quatre bilans ; garde modifiable. Le 23/10 : opposition (p. 385) et pupitre de Dice-OS |
| 🟢 C2 | **Livré et essayé le 22/10** | Potentiels de base et actuels ; fatigue, épuisement, blessures, soins, fin de scène et bonne nuit ; les dégâts du combat s'y écrivent depuis C6 |
| 🟢 C3 | **Livré et essayé le 22/10** | Dépassement annoncé avant le jet, sur les réussites réellement obtenues, une fatigue chacune, un par scène. L'exclusion des tests psychotiques se fera avec ces tests (C4) |
| 🟢 C4 | **Livré et essayé le 23/10** | Carte « Psychologie », test psychotique, Névrose du jet notée, seuils sous le bandeau (Névrose : moitié ou zéro au choix), psychose 6 et 10, angoisse 3 et plus, Innocence |
| 🟢 C5 | **Livré et essayé le 22/10 et le 23/10** | Cinq styles, points, indices à seuils révélés à un seul puis partagés. Le 23/10 : l'affaire par lieu et par témoin, hypothèses |
| 🟢 C6 | **Livré et essayé le 22/10 et le 23/10** | Armes, opposition, dégâts et blessures sur la cible, portées, protection, incidents. Le 23/10 : Physique actuel au combat, manœuvres et localisation, munitions, initiative narrative ; tir multiple au meneur |
| 🟢 C7 | **Livré et essayé le 23/10** | Contacts : loyauté de base et appels du scénario, influence, test Social GARDE X, perte à +1 Psychose, Nouveau scénario ; fortune : niveau et jauge. Seuil de la jauge à 10, validé par David le 23/10 |
| 🟢 C8 | **Livré et essayé le 23/10** | Tempérament et ses totaux, règles de création vérifiées (budgets selon l'âge, rangs, potentiels, spécialisations), points de développement dépensés |
| 🟢 C0.1 | **Livré et essayé le 23/10** | Corrections proposées par la relecture (23/10) : **modificateur de seuil du jet gardé** au tir — distance, mobilité, taille de la cible de −1 à +1, angoisse du tireur au-dessus de 3 de −1 à −2 ; seuil de 9 non modifiable pour viser à 3 d'angoisse et plus (p. 389-390, 412) |
| 🟢 C0.2 | **Livré et essayé le 23/10** | La carte des atteintes rappelle la **consigne de mort à −2** (implacable, logique ou évitée selon la conduite, p. 393), sans rien écrire |
| 🟢 C0.3 | **Livré et essayé le 23/10** | **Compétences hermétiques** déclarées au pilote : pas de jet « sans compétence » sur elles (p. 323-325) |
| 🟢 C0.4 | **Fait le 23/10** (rien à essayer) | Trois commentaires du code (`armesDeCrimes.ts`, son essai, `AttaqueDeCrimes.tsx`) citent la formule des dégâts en p. 395 : elle est en **p. 393** |

**Ordre conseillé :** C0 → C1 → C2/C3 → C4/C5 → C6–C8.
**Cas témoin :** `[1,3,4,6,8]`, compétence 2, seuil 8 : garder `[1,8]` donne une réussite
mitigée. L'ajout de champs dans le JSON ne remplace pas cette mécanique de conservation.

## Cthulhu Hack

**Campagnes de recette livrées le 25/10 :** [enquête et laboratoires](2026-10-25-campagnes-de-recette.md),
59 cas avec attendus, PJ rattachés aux joueurs existants Thomas D., Marie C. et Lucas R.
(identifiants de l’export RDD fourni par David le 25/10), outils transversaux ; registre § 178.
Les données et imports sont vérifiés, les essais humains restent à faire. **Défaut découvert :**
les secrets de séance `gmSecrets` sont transmis aux tablettes (GM-05, registre § 1 bis) ;
la recette n’est pas entièrement verte. Ce défaut transversal est distinct des cinq lots validés ci-dessous.

**Référence :** [manuel actuel](../User%20Guides/54-Jeu-Cthulhu-Hack.md),
et [audit et registre du 23/10](2026-10-23-cthulhu-hack-ameliorations.md).
Livre primaire fourni par David : `dmkl01bpdf_cthulhuhackreedition_v1v3.pdf`.
Relecture ciblée des cinq améliorations ; le corpus entier n'est pas déclaré relu.

**Déjà disponible :** Sauvegardes au d20, avantage/désavantage, Fortune après un jet raté,
dés d'usure, Folie/Choc, Hors Jeu avec table des Conséquences et récupération, PV raccordés
à la fiche. Le Hors Jeu standard n'est donc pas un nouveau chantier.

| Priorité | Amélioration possible |
| --- | --- |
| 🟢 P1 | Livré et essayé le 23/10 : aperçu, répartition exacte et application unique des pertes permanentes ; Détruit impose deux Sauvegardes distinctes |
| 🟢 P1 | Livré et essayé le 23/10 : PA déclarés sur les quatre emplacements ; déclin = −1 PA, restitué si la Fortune sauve l'usure |
| 🟢 P2 | Livré et essayé le 23/10 : défausse MJ contextualisée, relance du test mémorisé, Choc sans perte mentale et rappels narratifs |
| 🟢 P2 | Livré et essayé le 23/10 : suivi persistant des Moments, minutes, heures, scènes et échéances ; malus et Désavantages des effets généraux raccordés |
| 🟢 P3 | Livré et essayé le 23/10 : variante Pulp activée explicitement, coups suivants à zéro avec malus cumulatif, aucun PV rendu pendant le combat |

**Validation de David le 23/10 :** « ok c'est bon, c'est testé. Tu peux faire le commit et poussé ».

**Cas témoin :** une conséquence permanente n'est appliquée qu'une fois à la fiche ;
relever puis refaire tomber un personnage ne doit pas rejouer les pertes de son ancien tirage.
Barèmes contrôlés dans l'édition fournie. Les soins spéciaux, séquelles mentales définitives,
récupération mentale et cartes Contrecoups restent à auditer séparément ; ils ne sont pas
comptés parmi ces cinq améliorations. Vérifications et export dans le registre lié.

## Degenesis

**NP-C2 / NP-C3 — reprise commune du 03/11.** Diagnostic et aperçu de reprise des anciennes fiches PJ livrés : conservation, export JSON et retour arrière protégé. 252 tests ciblés et six parcours Electron passent ; huit captures relues. **Validation globale de David le 03/11 : « ok tout est testé, commit et pousse »**. [Suivi et cases à cocher](2026-11-03-np-c2-c3-reprises-droits-variantes.md). Les fonctions du pilote déjà validées restent acquises ; aucun défaut de droits n’est déclaré sur la seule absence d’essai.

**Validation globale des fonctions déjà livrées par David le 01/11/2026**, citation et portée dans le plan à cocher ; les propositions ci-dessous restent séparées.

**Référence :** [manuel 2.0.0](../User%20Guides/54-Jeu-Degenesis.md) ; registre § 188.
**Statut : fini le 30/10/2026** contre le livre de base français KatharSys
(`Degenesis - KATHARSYS_OCR.pdf`), pages imprimées (PDF − 1) ; pilote **2.0.0**
(`Export Dirvers/corriges/Degenesis_driver_gmos_finir.gmos-driver`), à réimporter avec **Remplacer**.

**Livré le 30/10 :** le pilote forgé par David (`Degenesis_driver_gmos_1793367219023`) ; le thème
`degenesis` (accepté 0/0), la fiche HTML `degenesis-fr` (129 clés) et la bannière, faits par Codex
([fiche](2026-10-30-etat-et-reprise-codex-fiche-degenesis.md), [thème](2026-10-30-etat-et-reprise-codex-theme-degenesis.md),
[bannière](2026-10-30-etat-et-reprise-codex-banniere-identite-degenesis.md)).

**Recette livrée le 30/10 :** [La Station des Cendres et deux laboratoires](2026-10-30-campagne-recette-degenesis.md), registre § 189 ; 21 nouveaux PJ pour les trois joueurs de l’export, 66 cas humains **NON TESTÉS**. **67 tests passent** ; imports natifs, remplacement isolé, trois Hub et Égo persisté éprouvés en instance jetable. **GM-05 confirmé dans le rapport initial** : douze secrets de séance transmis, assertion historique conservée ; corrigé et validé au § 200. Validation globale de David le 01/11 ; les résultats détaillés par appareil ne sont pas fournis.

| Priorité | Amélioration | Réalisation |
| --- | --- | --- |
| 🟢 P0 | Le jet : le pilote forgé prenait attribut + compétence pour le seuil de chaque dé, ne lançait aucun dé et exigeait quatre succès | **Livré le 30/10** : `jet.degenesis` (`dice/systemes/degenesis.ts`) ; réserve attribut + compétence, d6 réussis sur 4+ (`dice.successThreshold`), difficulté du livre en succès requis (Délicate 2 par défaut), modificateurs en dés, −1D par Traumatisme, Égo dépensé retiré de la fiche ; 12 dés au plus, le surplus en succès d'office ; déclencheurs « bien → légendaire » sur une réussite, échec critique quand les 1 dépassent les succès (p. 18-19, 100-106). Cartes `DegenesisAuJet.tsx`. Validé par David le 01/11 |
| 🟢 P1 | La fiche GM-OS et le pilote 2.0.0 | **Livré le 30/10** : 131 champs reprenant les 129 clés de la fiche HTML — 36 compétences au lieu de « Compétence 1 à 5 », six Potentiels, trois armes, deux armures, équipement — plus l'Égo maximal (à saisir) et la santé restante ; portées en bandes relatives à l'arme (−4D, −8D). Validé par David le 01/11 |
| 🟢 P1 | La santé à deux pistes et l'attaque mentale | **Livré le 30/10** : `combat.pistesDeSante` (`combat/logic/pistesDeDegenesis.ts`) à la porte des dégâts : Blessures superficielles jusqu'à (PHY+Résistance)×2, puis Traumatismes jusqu'à PHY+PSY ; la santé principale suit les deux pistes et se recalcule sur elles ; soin sur les Blessures ; dégât « mental » sur l'Égo (p. 94, 107). Validé par David le 01/11 |
| 🟢 P1 | L'initiative | **Livré le 30/10** : `combat.initiativeEnReserve` — PSY+Réactivité lancé en d6, score = succès, −1D par Traumatisme, actions en plus dites au journal (p. 100-101) ; le champ « reactivite » manquait au pilote forgé. Validé par David le 01/11 |
| 🟢 P0 avant extension | Corpus relu contre le livre | **Fait le 30/10** : 16/16 ; quatorze fiches corrigées, une conforme, la fiche du ton réécrite ; affirmations sans source retirées (défense active, double de la portée longue, incubation, couvert, cumuls de Potentiels) |
| 🟢 P1 | La fiche HTML reliée | **Livré le 30/10** : moteur 20 → 21 (`outils/degenesis/integrer_au_moteur.mjs`), correspondance des 129 clés (`relier_fiche_degenesis.mjs`), validateur 0/0 ; e2e : fiche remplie depuis GM-OS. Validé par David le 01/11 |
| 🟢 P2 | Le thème `degenesis` et la bannière | **Livrés le 30/10** par Codex, thème accepté 0/0 ; à activer dans une campagne. Validé par David le 01/11 |

**Analyse complémentaire du 01/11/2026 — propositions DEG-A1 à DEG-A6.**
La réserve, les déclencheurs, le débit d'Égo au test, les Traumatismes et les deux pistes
sont livrés. Les limites suivantes sont encore visibles dans les lecteurs du code.
Sources : [round et initiative](../../docs/systems/degenesis/rules/initiative-et-deroulement-du-tour.md),
[ressources](../../docs/systems/degenesis/rules/jauges-et-ressources-individuelles.md),
[Brûlure](../../docs/systems/degenesis/rules/la-brulure-et-la-stimulation-des-chakras.md),
[réserves et résolution](../../src/modules/dice/systemes/degenesis.ts),
[pistes](../../src/modules/combat/logic/pistesDeDegenesis.ts),
[Jet système](../../src/modules/combat/useCombatStore.ts).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🔴 P1 · DEG-A1 — Égo de l'initiative et première action | Le Jet système appelle la réserve avec des choix vides ; le panneau de test débite son Égo, mais sans souvenir partagé de la première action du round. Les actions supplémentaires sont dites au journal | Choisir 0–3 Égo avant initiative, débiter une fois, reporter les dés sur la première action puis les consommer ; suivre les actions disponibles et la surprise. Avec 2 Égo : +2D à initiative et première action, un seul débit de 2, aucun bonus sur la seconde ; rechargement sans second paiement |
| 🔴 P1 · DEG-A2 — Arme, défense et dégâts nets | Les circonstances sont saisissables ; armure, déclencheurs de dégâts et défense active restent arbitrés. La porte des pistes attend des dégâts déjà réduits | Choisir explicitement arme et protection active, calculer l'aperçu brut/déclencheurs/armure, puis envoyer le net aux pistes. Déclarer l'action de défense utilisée plutôt que multiplier librement les réactions ; 10 DM contre armure 3 doivent transmettre 7, pas déduire encore 3 au suivi de santé. Aucun cumul automatique des deux armures |
| 🔴 P2 · DEG-A3 — Maxima calculés et choix exclusifs | Égo maximal est un champ à saisir ; les formules dépendent de Concentration ou Pulsions, et Foi ou Volonté pour la Sporulation. La santé a déjà ses maxima natifs | Déclarer la branche retenue, calculer et expliquer les maxima, avertir d'une exclusivité contradictoire. INT 3 + Concentration 2 donne Égo max 10 ; une variation ne doit ni remplir gratuitement la jauge ni effacer les points permanents |
| 🔴 P2 · DEG-A4 — Coopération, combinaisons et confrontation | Le moteur compte les succès et les 6 ; il ne prépare pas la transmission des déclencheurs entre plusieurs jets ni une comparaison complète des deux camps | Proposer aide, test en chaîne et opposition comme procédures séparées. Pour la coopération, 2 déclencheurs apportent 2D au bénéficiaire ; en combinaison, reporter selon le corpus sans les compter deux fois ; à succès égaux, comparer les 6 avant l'arbitrage final. Conserver plafond de 12 dés et surplus en succès d'office |
| 🔴 P2 · DEG-A5 — Sporulation permanente, Brûlure et Potentiels | La piste de contamination existe, mais le permanent n'est pas isolé ; Brûlure et six textes de Potentiels n'ont pas de suivi d'effets | Séparer subi/permanent, enregistrer les traitements et un usage de Brûlure avec puissance/durée, puis un choix explicite du Potentiel applicable. Puissance 2 : Égo et contamination évoluent de 2 selon leurs bornes ; la fin du bonus ne retire pas la contamination permanente. Valider chaque effet de Potentiel, sans interpréter automatiquement tout texte libre |
| 🔴 P2 · DEG-A6 — Adversaire autonome à deux pistes | PJ et PNJ avec fiche passent par la porte des pistes ; l'adversaire de plateau sans fiche reste sur le suivi de PV générique | Donner à cet adversaire les valeurs minimales du système et utiliser la même résolution, y compris dégâts mentaux sur Égo. Rejouer la même attaque contre un PNJ lié et autonome : Blessures/Traumatismes identiques ; si les maxima manquent, demander une préparation explicite plutôt que prétendre calculer les pistes |

**Décision de périmètre :** conserver défense, cumul éventuel d'armures et Potentiels sous
validation du MJ tant que leurs entrées ne sont pas structurées. La présence de deux champs
d'armure n'autorise pas à additionner leurs protections. Ces propositions n'invalident pas
les 66 cas de recette déjà livrés ; elles demandent des cas supplémentaires après développement.

**Reste :** les propositions ci-dessus ; les fonctions livrées ont été validées par David le 01/11. À la table, par choix : l'armure (saisie déduite), la défense
passive ou active, les Potentiels, la Brûlure et la Sporulation permanente ; les adversaires sans
fiche perdent leurs PV d'un bloc.

**Sujets à auditer :** l'Égo maximal calculé selon Concentration ou Pulsions au lieu d'être
saisi ; l'Égo dépensé au Jet système d'initiative ; l'armure de la fiche retirée d'office ; les
combinaisons de tests (déclencheurs reportés) et la coopération (déclencheurs en dés de bonus) au
panneau ; les deux pistes sur un adversaire autonome.

**Cas témoin :** Falberg, INS 2 + Dressage 1 : 3 dés, 2-4-6 contre 2 — réussite « bien » ;
PHY+Résistance 4 : 10 dégâts → 8 Blessures superficielles et 2 Traumatismes (p. 18-19, 107).

## Dune

**Données de recette livrées le 26/10/2026** ([bilan](2026-10-26-campagne-recette-dune.md),
registre § 182) : **Le Sceau de Néréide**, trois PJ rattachés aux joueurs existants, **Maison
Vaëlan** remplie, deux laboratoires et **66 cas manuels**. Le module existant de conflits
embarque zones/atouts/désirs ; guide des cinq arènes, aucun module supplémentaire nécessaire.
21 contrôles de données réussis, dont les 40 champs de Maison ; import et trois vrais Hub,
fiches PJ/Maison, jets et progression HTML, Menace et révélation d’intrigue vérifiés.
**GM-05 transversal seul échec** ; essais humains/matériel à faire. Aucun lot D0–D8 ou code
applicatif modifié ; talents non préconfigurés pour isoler la recette de base.

**Référence :** [projet futur D0–D8](2026-10-19-dune-propositions.md).
**Repris le 25/10/2026**, David : « Je voudrais finir les améliorations du driver Dune » ;
GM-OS confirmé fermé. Registre : § 175, suite de § 143 ;
[bilan et recette](2026-10-25-dune-finir.md).
L'export `Dune_driver_gmos_1792659586664` a été audité puis corrigé en **2.0.0**, clés conservées.
Le livre français et l'errata local 1.0 ont été consultés ; l'errata officiel 1.1 corrige aussi
le prix de qualité des atouts.

**Déjà disponible :** Compétence + Principe, 2–5d20, réserves Impulsion/Menace,
dés achetés, alternance des camps et tâche de défaite. Dune n'a pas à recevoir des PV génériques.

| Lot | État au 25/10 | Réalisation |
| --- | --- | --- |
| 🟢 D0 | Livré ; validé par David | Corpus 20/20 déjà relu (§ 173). Export réel audité : faux champ PV retiré, anciennes portées métriques retirées, clés conservées ; constructeur d'export reproductible |
| 🟢 D1 | Livré ; validé par David | Spécialisation déclarée et liste sur la fiche ; un 5 sous Combat 6 spécialisé vaut deux réussites |
| 🟢 D2 | Livré ; validé par David | Paiement au choix déjà essayé le 22/10 (§ 151). Le test conserve maintenant son bilan jusqu'à clôture : bonus non conservable, dépenses d'informations/traits/atouts, versement unique du reliquat |
| 🟢 D3 | Livré ; validé par David | Maximes structurées, Détermination, un dé automatique et relances sélectives, bafouer après résolution, récupération et rééquilibrage, action supplémentaire et début d'aventure explicite |
| 🟢 D4 | Livré ; validé par David | PNJ payés en Menace ; reprise personnelle avec +1 difficulté ; rétention refusée après attaque/déplacement raté et gratuite après discrétion réussie |
| 🟢 D5 | Livré ; validé par David | Application unique d'une attaque réussie à un vrai combattant ; mineur/tâche étendue ; qualité défensive au-delà de 8 ; survie une fois par scène et récupération distincte des PV, conséquences au choix du MJ |
| 🟢 D6 | Livré ; validé par David | Dés d'aide séparés, opposition non plafonnée à 5, marge 1–5, rachat signé des complications, réussite mitigée mécaniquement échouée ; bilan du défenseur |
| 🟢 D7 | Livré ; validé par David | Module partagé « Dune : conflits et Maison » : cinq arènes, Agent/Architecte, zones reliées, atouts visibles/cachés, neutralisation/récupération, désirs secrets et enquête d'intrigue. Le MJ valide tests et dépenses |
| 🟢 D8 | Livré ; validé par David | Maison dans le module, Menace initiale selon type/joueurs, carnet de progression avec aperçu, historique, limite par aventure, reconversion et qualité à 2 × nouvelle valeur |

**Vérifié :** suite globale 9 111 tests, types, lint ciblé, construction et recette Electron (onze captures relues, vrai Hub à 360/768/1 180 px).
**Validation de David le 25/10/2026 : « tout est testé, c'est bon » ; D0–D8 passent au vert.**
**Atelier Studio du 25/10 :** fiches HTML fidèles PJ (30 champs) et Maison
(40 champs, armoiries importables) créées dans `output/fiches/dune/`, une page chacune.
Validation sans erreur, sauvegarde/JSON/zoom/impression/hors ligne et import réel dans un
moteur jetable vérifiés ; [livraison](../../output/fiches/dune/LIVRAISON.md).
**Intégrées et raccordées le 25/10 (registre § 176)** : rangées dans `docs/fiches/Dune/`, moteur 17 ; correspondance du personnage (maximes à leur principe dans `_gmos_dune`, spécialisations « Compétence : spécialisation ») ; Maison en **fiche de groupe**, qui fait foi, dont le pupitre du module prend le reflet (alliés et atouts restent au module). **Essayé et validé par David le 25/10** (pilote remplacé, Cockpit → Maison : « tout marche ») — `48b8691e`.
Aucun profil personnel n'a été ouvert. Les propositions historiques D0–D8 restent dans l'audit lié.
**Cas témoins :** un 5 sous Combat 6 spécialisé vaut deux réussites ; payer une action
d'un PNJ ennemi débite sa Menace ; une réserve pleine ne détruit pas l'Impulsion immédiatement
utilisable du test. Le plateau de zones fait partie de la livraison validée par David.

## Nephilim Légende

**Campagnes de recette Nephilim livrées le 26/10 :** [Le Méridien de verre et deux laboratoires](2026-10-26-campagne-recette-nephilim.md), registre **§ 183**. Astérion/Thomas, Ismérie/Marie, Nahal/Lucas et leurs Simulacres ; Magie, Kabbale et Alchimie, Pentacle fictif, **70 cas avec attendus**, outils transversaux préparés. Aucun module spécifique compatible dans le catalogue. **26 contrôles de données**, imports/remplacement et trois Hub/HTML/jets, Sapience et débordement de Traque persistés ; GM-05 seul échec (12 chemins). Cas humains et matériel à essayer. Pouvoirs fictifs RECETTE identifiés, aucun correctif du pilote.

**Références :** [chantier, § 15 et suite](2026-10-17-chantier-nephilim.md) et
[manuel actuel](../User%20Guides/54-Jeu-Nephilim.md).
Les propositions N1–N9 ajoutées à l'ancien document RdD ne décrivent plus à elles seules
l'état actuel : une grande partie a été réalisée depuis.

**Déjà disponible :** Arts occultes au jet, Stase et Effet Mnémos de bonus, suites proposées
des critiques, Ka dominant sur les deux fiches et plafond de Stase, Alchimie avec consommation
des Materiae Primae au lancer, recharge des MP, 31 époques et 155 Vécus, suggestions sur tablette.
Les captures correspondantes existent.

| Lot | État | Ce qui est livré (23/10, pilote 2.0.0) |
| --- | --- | --- |
| 🟢 N1 | Livré et essayé le 23/10 | Malus des Conséquences au jet : physiques sur une action physique, magiques sur les Arts, retirés du Vécu avant l'approche (p. 137-138) |
| 🟢 N2 | Livré et essayé le 23/10 | Santé en cases nommées, deux pistes ; « Encaisser N » propose les seules absorptions permises, hors de combat ou degré de Chute ; repos, transfert à la stase, durées de guérison (p. 135-139) |
| 🟢 N3 | Livré et essayé le 23/10 | Paliers des Chutes et alerte dès 8 ; forme du Khaïba et ses interdits au jet ; mise en jeu (PS de Chute, une fois par séance) (p. 148-152) |
| 🟢 N4 | Livré et essayé le 23/10 | Pacte de Kabbale en opposition, table des actions opposées et errata ; dommages et bannissement (p. 123, 198) |
| 🟢 N5 | Livré et essayé le 23/10 | Stase : test, pleine en la quittant, +1 par jour en Plexus ou Nexus (errata p. 160), rappels de la remise en stase |
| 🟢 N6 | Livré et essayé le 23/10 | Effet Mnémos en tant que Vécu, Sacrifice (réussite d'office), sort à retenter (1 PS ou 1 stase), Chute soignée par le critique, carte d'expérience (p. 118-119, 154-155, 183) |
| 🟢 N7 | Livré et essayé le 23/10 | Second élément de l'Œuvre au blanc consommé, Ka le plus faible du construct ; assemblage des constructs contrôlé (p. 216-220 ; errata p. 217) |
| 🟢 N8 | Livré et essayé le 23/10 | Lieu magique et conjonction au bandeau (réserves nommées) : bonus et malus aux Sciences occultes et aux approches (p. 160) |
| 🟢 N9 | Livré et essayé le 23/10 | Métamorphe exprimé, Impressionner, métamorphoses permanentes ; Seuil RK et jeton de Traque proposé (p. 112-113 ; errata p. 146, 174) |
| 🟠 Essai | Toujours ouvert | Vérifier sur tablette physique les suggestions et, en séance, la consommation automatique des MP |

**Décisions à préserver :** les suites de critiques passent par un bouton ; l'option finale
pour les MP est le débit **au lancer**, qui a remplacé le premier choix manuel. La Traque
monte immédiatement au Seuil RK selon le choix de David, même si l'errata situe l'effet à l'aube.
**N1–N9 livrés le 23/10 (registre § 165)**, demande de David : *« je propose que l'on s'attaque à finir Nephilim Legend » ; GM-OS éteint ; périmètre complet N1–N9 ; cases de santé nommées ; lieu et conjonction réglés par le MJ au bandeau ; à partir de l'export du 22/10*. Module
`src/modules/dice/systemes/nephilimRegles.ts`, cartes `NephilimAuJet.tsx`, pilote
`Export Dirvers/corriges/Nephilim_driver_gmos_finir.gmos-driver` (`outils/nephilim-vecus/finir_nephilim.py`).
**Essai de David validé le 23/10** (« ok tout est bon tu peux valider. Commit et pousse »). Vérifié : 36 essais du module et du panneau, 1 du bandeau, contrôles de la Forge (zéro constat sur le pilote), jet réel composé avec le pilote ; captures réelles dans Electron (14, dont 5 nouvelles) ; suite complète 8 904 essais verts. Points tranchés : les cases de bonus du
Ka-Terre sur la piste physique seulement (la fiche n'en prévoit pas en magique) ; l'action physique cochée
d'office quand une Conséquence physique l'est ; le malus magique sur les seuls Arts. La [consigne au Studio](2026-10-23-consigne-studio-nephilim-finir.md)
est livrée le soir même (validateur ACCEPTÉE, moteur 16). **Suite :** l'essai sur tablette physique.
Ne pas rouvrir ces choix en recopiant les premiers paragraphes historiques du chantier.

## NOC

**Campagnes de recette livrées le 25/10 :** [Le neuvième timbre et deux laboratoires](2026-10-25-campagne-recette-noc.md),
**Cabale Les Veilleurs du Palier déjà remplie**, trois Contacts et leurs Faveurs, PJ rattachés
aux mêmes joueurs existants (Thomas D., Marie C., Lucas R.), **62 cas avec attendus** ; registre
§ 179. Données et essais automatiques distincts des essais humains restant à faire.
Le défaut transversal GM-05 (`gmSecrets` diffusés aux tablettes, § 1 bis) reste consigné ;
aucun correctif applicatif dans cette livraison de données.

**Références :** [améliorations du 19/10](2026-10-19-ameliorations-noc.md) et
[reprise du 25/10, sources et contrôles](2026-10-25-noc-finir.md), registre § 177.
David demande de finir NOC et fournit le livre de base ; GM-OS confirmé fermé.
Les changements Dune de Claude ont été conservés. Les numéros restent ceux de la note du 19/10.

**Déjà disponible :** jet de Destin, Fiel/Menace, jauges de péril et malus, réserves des Héros,
Cabale, moment de calme, effets du Fiel et recharge de nouveau scénario.

| Point | État au 25/10 | Réalisation |
| --- | --- | --- |
| 🟢 1 | **Livré le 22/10** | La Séquelle se propose sous le bandeau quand une jauge de péril atteint 8 ; « Noter » l'ajoute au champ Séquelles (registre § 150, `NOC_driver_gmos_sequelles`). Réimporté et essai de David validé le 22/10 |
| 🟢 2 | Livré et validé par David le 25/10 | Bénéficiaire choisi avant attribution, écriture de Singularité et journal ; jet traité une seule fois |
| 🟢 3 | Livré et validé par David le 25/10 | Soupçon réparti dans l'aperçu, borné aux récupérations possibles ; application bloquée tant que le choix est incomplet |
| 🟢 4 | Livré et validé par David le 25/10 | Lumière répartie entre soi et les alliés à portée d'Aura ; sources cumulables, point jamais dupliqué ; la Loi valide les portées |
| 🟢 5 | Livré et validé par David le 25/10 | Participants au repos et partage d'Extase, plafond propre au bénéficiaire ; Fiel diminué seulement si tous les Héros se reposent |
| 🟢 6 | Livré et validé par David le 25/10 | Cibles explicites, personnages épargnés décochés ; Rouages alliés avec réserve d'Espoir inclus pour la Fatigue. Le livre parle des alliés des Héros |
| 🟢 7 | Livré et validé par David le 25/10 | Faveurs par Contact de Réseau, dépenses 1/3/5 et recharge ; complément de la feuille sur PC/tablette, règle Diffractions p. 134 |
| 🟢 8 | Livré et validé par David le 25/10 | Neuf pistes numériques, 78 anciennes clés conservées et synchronisées, imports et sauvegardes migrés ; moteur 18, aucun autre gabarit changé |
| 🟢 9 | Livré et validé par David le 25/10 | Recharge des pistes de Cabale et des Contacts au Nouveau scénario ; horodatage du groupe mis à jour pour la synchronisation |

**Audit du livre :** les dés offerts par les 10 sont optionnels, sur la fiche et au pupitre ;
Ferveur 4+ augmente les dés donnés par l'Espoir personnel ; au pupitre les 1 alimentent le Fiel
sans retirer de réussites. Export `Export Dirvers/corriges/NOC_driver_gmos_2.0.0.gmos-driver`.
**Déjà vérifié :** migration des anciennes données et fonctionnement hors ligne ; les deux
fiches sont acceptées sans erreur ni avertissement ; Forge sans constat. Recette Electron et
tablette réussie aux trois largeurs 360/768/1180, 17 captures actualisées. Types et lint réussis ;
9 150 tests réussis (quatre ignorés), construction de production réussie (`npm run validate`).
**Validation de David le 25/10 : « ok tout fonctionne ».** Les neuf points sont terminés et
validés ; réalisation commitée dans `bf83cbf6`. Les conséquences narratives des Séquelles,
les soins lourds et les portées restent à la Loi.

## Rêve de Dragon

**Données de recette livrées le 26/10/2026** ([bilan](2026-10-26-campagne-recette-rdd.md),
registre § 181) : **Le Moulin des heures oubliées**, trois nouveaux haut-rêvants aux joueurs
existants, deux laboratoires et **69 cas manuels**. À la demande « Les deux » de David :
**module TMR existant et carte officielle** préparés, **14 tables de rencontres Table-OS**
issues du moteur. 19 contrôles de données, 1400 tirages comparés ; import, trois vrais Hub,
trois montées payées et G4→H4 avec reçus persistés vérifiés. Confidentialité des demi-rêves
vérifiée ; **GM-05 transversal reste en échec**. Essais humains, import global des tables et
matériel restant à faire. Aucun changement de pilote ou du code applicatif dans le lot.

**Références actuelles :** [audit et livraison du 24/10](2026-10-24-reve-de-dragon-finir.md) contre le livre 2.3.1 (registre § 168),
[bilan R5–R7](2026-10-19-etat-et-reprise-codex-rdd-r5-r6-r7.md),
[livret numérique corrigé](2026-10-19-etat-et-reprise-codex-rdd-champs-numeriques.md) et
[manuel](../User%20Guides/54-Jeu-Reves-de-Dragons.md).
L'[analyse R0–R8 du 17/10](2026-10-17-reve-de-dragon-propositions.md) est historique :
ses lots ne sont plus tous « à faire ».

**Déjà disponible pour les PJ :** consolidation R0, fatigue R1, encaissement/blessures/soins R2,
ouvrages R3, repos/Château Dormant R4, stress/expérience/Archétype R5, recours R6 et astrologie
privée raccordée à Clock-OS R7. La carte TMR, son carnet et une première boucle de déplacement
avec débit sur la fiche sont livrés. Le livret HTML de cinq pages et ses champs numériques
corrigés sont intégrés.

**Livré le 22/10/2026 (`6f709c79`, registre § 147) :** à la demande de David, les mécaniques
du Voyageur — fatigue, encaissement et blessures, stress/expérience/Archétype, recours,
astrologie, ouvrages, repos — quittent le formulaire pour l'onglet **« Lancer un test »** de la
fiche, sous le jet, en cartes repliables, chez le meneur et sur la tablette. La reprise R0 reste
dans le formulaire et fait apparaître l'onglet. Vérifié : sept essais e2e du Voyageur verts,
captures du manuel refaites. **Essai de David à l'écran attendu.**

*Inventaire du 22/10, instruit le 24/10 — le tableau suivant dit ce qui en est fait.*

**Fini le 24/10** (registre § 168, [audit et livraison](2026-10-24-reve-de-dragon-finir.md)), à la
demande de David (« on va finir reve de dragons »), contre le livre 2.3.1 :

| Lot | Livré | Reste |
| --- | --- | --- |
| 🟢 P1 · initiative et phases | Mode `phases` : panneau des sept phases dans Combat-OS, facteur de l'arme lu sur la fiche + 1d6 + état général, longueur d'arme à l'engagement, charge, demi-surprise, mêlée inégale ; aide-mémoire, maladresses, difficulté de tir | La longueur des armes absentes de la table ; la charge rend aléatoire toute la mêlée (lecture à confirmer) |
| 🟢 P2 · famine et enchantements | Bilan du Château Dormant : famine et soif, endurance retenue jusqu'au repas normal ; potions suivies jusqu'à l'évaporation | — |
| 🟢 P2 · entraînement et apprentissage | Une heure d'entraînement (seul ou à deux) ; apprentissage avec un maître, en semaines | Lecture des livres et des méthodes (p. 352–356) |
| 🟢 P3 · Haut-Rêve | Carte « Haut-Rêve, queues et souffles » : rencontres, prisons, cases humides, sorts et réserves, JR, refoulement, queues, ombres, souffles et têtes ; le pupitre TMR tire la rencontre | Effets narratifs appliqués par le meneur |
| 🟢 Calendrier | `databases/calendars/reve-de-dragon.json` dans Clock-OS : mois lunaires, heures draconiques nommées, saisons et phases de lune ; repère astrologique calé dessus (registre § 169, 24/10) | Essai de David |
| 🟢 PNJ | **Décision de David le 24/10 : le Haut-Rêve seulement.** Carte Haut-Rêve sur la fiche d'un PNJ (modèle Livret du voyageur) et dans Combat-OS sous « Encaisser / soins RdD », pour un PNJ de campagne ou un adversaire fabriqué ; recette réelle (`e2e/santeVoyageur.spec.ts`) | Stress, chance et astrologie restent aux PJ, par décision |
| 🟠 Essai | Recette réelle dans Electron (`e2e/finirReveDeDragon.spec.ts`) | Réimport du pilote 2.0.0 et essai de David ; chiffres du livret dans la vraie fenêtre et sur tablette |

**Prochaine étape :** l'essai de David du pilote 2.0.0.
Conserver une seule réserve de rêve/fatigue sur la fiche. La position et le carnet TMR ne
doivent pas devenir une seconde fiche de ressources. Les secrets astrologiques restent filtrés.

## RuneQuest

**NP-C2 / NP-C3 — reprise commune du 03/11.** Diagnostic et aperçu de reprise des anciennes fiches PJ livrés : conservation, export JSON et retour arrière protégé. 252 tests ciblés et six parcours Electron passent ; huit captures relues. **Validation globale de David le 03/11 : « ok tout est testé, commit et pousse »**. [Suivi et cases à cocher](2026-11-03-np-c2-c3-reprises-droits-variantes.md). Les fonctions du pilote déjà validées restent acquises ; aucun défaut de droits n’est déclaré sur la seule absence d’essai.

**Validation globale des fonctions déjà livrées par David le 01/11/2026**, citation et portée dans le plan à cocher ; les propositions ci-dessous restent séparées.

**Référence :** [manuel 2.1.0](../User%20Guides/54-Jeu-RuneQuest.md) ; registre § 187.
**Statut : fini le 30/10/2026** contre le livre de base français (Deadcrows, 7e éd.,
`DCRQK02 - Livre de Base.pdf`) **et son errata** (`… - Errata.pdf`), pages imprimées (PDF − 1) ;
pilote **2.1.0** (`Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver`, coups localisés
ajoutés le même jour), à réimporter avec **Remplacer**.

**Livré par David le 30/10 :** le pilote forgé (`RQ_driver_gmos_1793346684184`), puis le thème
`runequest` (accepté 0/0) et la fiche HTML `runequest-fr` (735 clés, acceptée), faits dans l'atelier
GM-OS Studio ([livraison de la fiche](2026-10-30-fiche-runequest-studio.md)).

| Priorité | Amélioration | Réalisation |
| --- | --- | --- |
| 🟢 P0 | Le jet : le pilote forgé ne rendait que réussite ou échec, ratait un 4 à 3 % et réussissait un 97 à 120 % | **Livré le 30/10** : `jet.runequest` (`dice/systemes/runequest.ts`), cinq niveaux lus sur les chances modifiées — critique au vingtième, spéciale au cinquième, échec critique aux 5 % des chances d'échec, arrondis au plus proche —, 01-05 et 96-00 toujours ; la table p. 143 retrouvée ligne à ligne par un essai. Validé par David le 01/11 |
| 🟢 P1 | Test de caractéristique et table de résistance | **Livré le 30/10** : une caractéristique retenue se teste ×5 à ×0,5 (p. 141) ou contre une passive, 50 % + 5 % par point (p. 145, errata p. 147). Validé par David le 01/11 |
| 🟢 P1 | Augmentation, nouvelle tentative, opposition, localisation | **Livré le 30/10** : augmentation +50/+30/+20/−20/−50 servie au jet suivant (p. 144-145), −25 % (p. 142), excédent au-delà de 100 % retiré aux deux camps et issue au meilleur niveau (p. 144, errata p. 142), D20 de localisation (p. 146), affichage des PV de cible corrigé séparément dans RQ-A2. Validé par David le 01/11 |
| 🟢 P1 | La fiche GM-OS et le pilote 2.0.0 | **Livré le 30/10** : 193 champs — compétences du livre par catégorie au lieu des sept catégories, six Runes élémentaires et cinq paires, six Passions nommées, armes, sept localisations ; identifiants en double retirés ; combat RA DEX + RA TAI croissant, santé en PV totaux ; portées de poursuite. Validé par David le 01/11 |
| 🟢 P0 avant extension | Corpus relu contre le livre et l'errata | **Fait le 30/10** : 17/17, quinze fiches corrigées et deux précisées (égalité en opposition, score réduit au-delà de 100 %, Confusion, sorcellerie, inspiration, maladies…), affirmations sans source retirées |
| 🟢 P1 | La fiche HTML reliée | **Livré le 30/10** : moteur 19 → 20 (`outils/runequest/integrer_au_moteur.mjs`) ; fiche GM-OS étendue à 313 champs (compétences d'armes, deux cultes, Honneur et sept Passions à sujet, pièces) ; correspondance des 735 clés, 327 reliées, 408 absentes motivées (famille, ascendance, compagnon, récoltes, coches d'expérience) ; validateur 0/0 ; e2e : fiche créée et remplie depuis GM-OS. Validé par David le 01/11 |
| 🟢 P2 | Le thème `runequest` | **Livré le 30/10** par David, accepté 0/0 ; à activer dans une campagne. Validé par David le 01/11 |
| 🟢 P1 | Les coups localisés dans Combat-OS (demandés par David le 30/10 : « tu ne joues pas la localisation des dégâts dans Combat-OS ? ») | **Livré le 30/10**, pilote 2.1.0 : `combat.coupsLocalises` (`combat/logic/coupsDeRuneQuest.ts`) ; panneau des sept zones sur la carte de chaque combattant (D20 ou clic, dégâts, Encaisser, Soigner) ; armure retirée, membre plafonné au double en un coup, zone et total entamés, effets du livre dits au message et au journal (p. 146-148, relues en image) ; « Porter le coup » depuis le panneau de jet vers la cible ; sept champs `degats_<zone>` propres à GM-OS ; règle appliquée par `handleApplyImpact` (PJ, PNJ) et sur le plateau (adversaire autonome) ; e2e et capture `jeu-runequest-coups-localises`. Validé par David le 01/11 |

**Analyse complémentaire du 01/11/2026 — propositions RQ-A1 à RQ-A6.**
Le d100, les cinq niveaux, l'opposition et les coups localisés sont livrés. Deux écarts précis
doivent être traités avant d'élargir l'automatisation : version de recette et affichage de cible.
Sources : [inventaire du lot](../../output/campagnes-tests/runequest/inventaire.json),
[générateur 2.1.0](../../outils/runequest/finir_runequest.py),
[suites du jet](../../src/modules/session/components/fields/RuneQuestAuJet.tsx),
[coups localisés](../../src/modules/combat/logic/coupsDeRuneQuest.ts),
[dégâts](../../docs/systems/runequest/rules/degats-et-types-de-degats.md),
[rangs d'action](../../docs/systems/runequest/rules/initiative-et-deroulement-du-tour.md).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🟢 P1 · RQ-A1 — Recette alignée sur 2.1.0 | **Livré le 01/11**, registre § 202 : trois archives avec pilote 2.1.0/320 champs et sept compteurs de dégâts ; C07 bras 0/3, C08 tête −4/4 ; 21 PJ, 78 cas dont douze LOCAL ; ancien ZIP/CSV/rapports conservés à part | 96 tests passent ; pilote historique 2.0.0 conservé par Nexus puis remplacé explicitement par 2.1.0 ; imports, armure/plafond/soins, PJ/PNJ/autonome, Porter le coup, persistance et remplacement isolé de 02, trois Hub et zéro fuite éprouvés ; validation de David le 01/11 : « ok c’est bien, c’est testé. Commit et pousse ». [Confirmation](../../output/campagnes-tests/runequest/VALIDATION-DAVID.md). [Reprise](2026-11-01-etat-et-reprise-codex-runequest-recette-210.md) |
| 🟢 P0 · RQ-A2 — PV affichés du bon combattant | **Livré et validé par David le 01/11**, registre § 201 : localisation/journal sans PV du lanceur ; nom de cible + zone + PV maximum de sa fiche, actualisés au changement de cible et de fiche ; valeur absente inconnue, zéro conservé ; détails au meneur seulement | 89 tests ciblés, lint et build/types réussis ; essai Electron et capture dans la [reprise](2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md). David : « ok c’est bon on fait RQ-A1 » ; nouvel essai d’intégration au § 202 |
| 🔴 P1 · RQ-A3 — Résultat d'attaque jusqu'au coup | Le résultat spécial/critique est connu, mais « Porter le coup » reçoit une zone et un nombre ; la routine retire toujours l'armure. Dégâts d'arme, bonus, empalement/lacération/écrasement et parade restent à préparer à la table | Ajouter un aperçu selon arme et résultat de combat, avec bypass d'armure explicite sur critique et validation des effets. À dégâts et zone identiques, l'attaque ordinaire retire l'armure ; le critique l'ignore. Préserver le plafond d'un membre et ne pas appliquer deux fois bonus, soins ou dégâts totaux |
| 🔴 P1 · RQ-A4 — Rang d'action selon l'action | Le pilote trie RA DEX + RA TAI ; les RA d'armes sont stockés mais pas inclus dans une préparation d'action. Un tir ou un sort n'utilise pas automatiquement le même total qu'une mêlée | Préparer intention, arme/sort, délais et RA final ; distinguer mêlée et tir/magie, départager par DEX et gérer la limite 12. À RA final 13, ne pas présenter l'action comme exécutée durant le round courant ; conserver la décision de report du MJ |
| 🔴 P2 · RQ-A5 — Dérivés explicables | PV maximum, zones, bonus de dégâts, ENC, vitesse de guérison et modificateurs de catégorie restent principalement saisis | Proposer un calcul depuis les caractéristiques, avec détail et dérogation explicite. Une modification de CON/TAI prépare les nouveaux maxima et zones sans soigner gratuitement ni effacer les dégâts subis ; comparer plusieurs valeurs frontières aux tables relues du livre |
| 🔴 P2 · RQ-A6 — Magie, inspiration et progression assistées | Runes/Passions, PM et deux réserves de PR sont reliés ; coût des sorts, récupération, suites d'inspiration, INT libre et coches d'expérience ne sont pas des procédures persistantes complètes | Commencer par lancement avec coût annoncé et bon culte, puis issue d'inspiration et coche d'expérience nommée ; prévoir annulation et journal. Un coût payé sur le culte 2 ne débite ni culte 1 ni deux fois après reload. Ne pas appliquer l'augmentation générique comme toute la règle d'inspiration ; laisser les effets de sort au MJ hors catalogue vérifié |

**Après ces lots :** organiser les effets temporisés de blessures (hémorragie, perte de PV au
round, incapacité), annoncés mais non appliqués par le moteur. Les 408 clés HTML absentes sont
motivées : famille/ascendance/compagnon ne sont pas toutes des défauts de raccord à corriger.
Les statuts et coches utiles à la procédure de jeu sont à sélectionner, sans imposer de relier
les 735 clés. Le lot courant est aligné en 2.1.0 ; l'ancien lot 2.0.0 reste conservé comme historique.

**Reste :** RQ-A3 à RQ-A6 ; RQ-A1, RQ-A2 et les fonctions précédemment livrées sont validés par David le 01/11. Le cahier et le CSV initiaux restent vierges faute de résultats détaillés par cas ; validation globale consignée séparément. À la table, par choix :
les dégâts spéciaux, la magie (au panneau sous POU, une Rune ou le sort), les suites d'une
localisation que GM-OS dit sans les appliquer (combat au sol, hémorragie, −1 PV par round).

**Sujets à auditer :** les dérivés calculés (PV, ENC, bonus aux dégâts, modificateurs de catégorie)
au lieu d'être saisis ; les dégâts spéciaux (empalement, lacération, écrasement) portés avec le
coup localisé ; les inspirations de Rune et de
Passion avec leurs suites (tourment, désespoir) ; les tests d'expérience cochés.

**Cas témoin :** Épée large 65 %, augmentée d'une réussite (+20), situation −10 : 75 %, critique
01-04, spéciale 01-15, échec critique 00 ; à 56 %, un 02 est critique, un 99 un échec critique.

## Shadowrun Anarchy

**NP-C2 / NP-C3 — reprise commune du 03/11.** Diagnostic et aperçu de reprise des anciennes fiches PJ livrés : conservation, export JSON et retour arrière protégé. 252 tests ciblés et six parcours Electron passent ; huit captures relues. **Validation globale de David le 03/11 : « ok tout est testé, commit et pousse »**. [Suivi et cases à cocher](2026-11-03-np-c2-c3-reprises-droits-variantes.md). Les fonctions du pilote déjà validées restent acquises ; aucun défaut de droits n’est déclaré sur la seule absence d’essai.

**Validation globale des fonctions déjà livrées par David le 01/11/2026**, citation et portée dans le plan à cocher ; les propositions ci-dessous restent séparées.

**Préparation de Shadowrun : Anarchy 2.0**, ateliers Studio du 31/10/2026 ;
[reprise](2026-10-31-etat-et-reprise-codex-studio-shadowrun-anarchy.md), registre **§ 196**.
**Pilote fini le 01/11/2026**, 2.0.0, registre **§ 197**, contre le livre de base
`sran2_01anarchyv2_web_v1` (PDF = imprimée + 2) ; [manuel](../User%20Guides/54-Jeu-Shadowrun-Anarchy.md).
Références : PDF PJ d’une page, quatre pages example et trois illustrations dans
`docs/Reference/Shadowrun Anarchy/`. Dossier réel du corpus : `shadowrun-anarchy`.
Le sommaire a déjà été livré au § 195. Les ateliers du 31/10 n’auditaient pas le pilote : le
chantier du § 197 l’a fait.

**Campagnes de recette livrées et éprouvées le 01/11**, § 198 : mission originale et deux
laboratoires, 22 PJ pour les trois joueurs, 64 cas humains NON TESTÉS dans le rapport initial ; validation globale de David le 01/11 ; 72 tests passent,
imports/remplacement/rechargement et trois Hub 360/768/1180 vérifiés, jets et Anarchy,
fiche HTML sauvegardée. **GM-05 confirmé dans le rapport initial : secrets de séance transmis aux Hub**, assertion
finale conservée en échec historique ; corrigé et validé au § 200. [Livraison](2026-11-01-campagne-recette-shadowrun-anarchy.md).

| Priorité | Amélioration | Réalisation |
| --- | --- | --- |
| 🟢 P2 | Thème d’interface | **Livré le 31/10** : papier usé, cadre jaune, titres bruns, deux matières, trois ornements, quinze icônes ; validateur **0 erreur / 0 avertissement**. Vingt SVG décodés et planches 1440/390 px examinées hors ligne ; validé par David le 01/11 |
| 🟢 P0 | Le jet | **Livré le 01/11** (§ 197) : le pilote forgé formait un seuil de 9 par d6, ne lançait aucun dé et exigeait trois réussites — tout échouait. `jet.shadowrun` : réserve compétence + attribut (+2 de spécialisation) qui ne change jamais, 5+ (4+ sous avantage, 6 sous désavantage, borné à un), seuil 2-8, succès nets, réussite exceptionnelle ; dés de risque pris dans la réserve (table p. 71, action normale par défaut), succès doublés, complications mineure, critique, désastre ; RR lue sur la ligne de la compétence ; règle alternative réglable (`risqueAlternatif`). Validé par David le 01/11 |
| 🟢 P0 | Points d’Anarchy | **Livrés le 01/11** : avantage payé au lancer, +1 sur complication critique, +2 sur désastre, **Relancer** qui garde la complication du premier jet (p. 77) ; 4 au départ pour un humain, 3 sinon. Les autres gains et dépenses restent sur la jauge. Validé par David le 01/11 |
| 🟢 P1 | Moniteur d’état | **Livré le 01/11** : `combat.moniteurDEtat` — la VD contre les seuils de la fiche (principale, secondaire, sans armure, mental), une blessure par coup, aggravée quand ses cases sont pleines ; désavantage d’une grave au jet ; soin de la plus grave d’abord. Les quatre cases montrent la pire blessure : validées par David le 01/11 |
| 🟢 P1 | Fiche HTML du jeu | **Reliée le 01/11** : moteur **23**, correspondance 120/121 (portrait laissé à la fiche), validateur 0/0. Livrée le 31/10, modèle shadowrun-anarchy2-fr, une page native 600,945 × 779,528 points, **146 zones / 121 clés**, portrait, **39 hotspots / 14 pistes**. Validateur **0 erreur / 2 avertissements d’intégration** ; saisie/import/export/rechargement, portrait, refus sans perte, reset, zoom, mobile, impression CSS et import du modèle dans un moteur jetable vérifiés ; six captures examinées. Raccord permanent réalisé au § 197 ; validé par David le 01/11 |
| 🟢 P2 | Bannière et identité d’images | **Livrées le 31/10** : JPEG opaque **2400 × 600 / 375 284 octets**, agrandissement de 10,5 % autorisé par David, sans détail ajouté ; deux cadrages 54 px examinés hors GM-OS. Identité révisée le même jour à sa demande : cyberpunk saturé, cyan/magenta/ultraviolet et accents jaune acide, peinture texturée ; bloc anglais STYLE/AVOID **43/14 mots**, validateur et sens relus dans `output/identites/shadowrun-anarchy/`. Le ZIP Studio initial conserve le bloc précédent. Validés par David le 01/11 |

**Vérifications :** 51 tests de contrat passent ; lint ciblé sans erreur. Rapport, captures et
empreintes dans `output/studio/shadowrun-anarchy/`, `output/fiches/shadowrun-anarchy/` et
`theme/apercu/`. HTML reproduit octet pour octet depuis la recette et le PDF original intact.

**Limites :** Barlow Condensed approche les fontes de titre ; les planches utilisent les replis
système et ne prouvent pas le téléchargement de polices. Le thème ne change pas la géométrie
de GM-OS. La fiche garde son fond PDF ; RD, attribut et seuils restent saisissables, car le
manifeste ne propose pas d’addition à deux sources. Trois degrés de blessures distincts 3/2/1,
cercles pâles compris ; le passage au degré supérieur se fait dans GM-OS, pas sur la fiche. Portrait
recadré dans l’ellipse intérieure. Connexions Hub éprouvées au § 198 ; la validation globale de David est consignée ci-dessus, sans mesure détaillée d’impression physique.

**Vérifications du § 197 :** règle (15 essais, exemples du livre : Lightning, Iron et les
gangers, la rafale d’Iron, Rolling Thunder), porte des dégâts (8), panneau (5), contrôle du
pilote (zéro constat) ; `npx tsc -b`, eslint, `corpusDerivable`, manuel ; e2e des captures sur le
seul pilote Shadowrun, six captures relues. Corpus relu **19/19**, seize fiches corrigées.

**Cas témoin :** Armes à distance (pistolets) 7 + Agilité 4, RR 1, risque fort → 11 dés dont 7 de
risque ; 2 succès normaux + 2 de risque = 6, deux 1 dont un annulé : réussite, complication
mineure ; VD 5 + 3 nets = 8 contre 6/9/12 : blessure légère (p. 72).

**Analyse complémentaire du 01/11/2026 — propositions SR-A1 à SR-A6.**
Le risque, RR, Anarchy au jet, moniteur et raccord 120 clés sont livrés ; les lectures suivantes
repèrent les procédures encore manuelles. Aucun second moteur de jet n'est à créer.
Sources : [drain](../../docs/systems/shadowrun-anarchy/rules/le-drain-magique.md),
[Matrice](../../docs/systems/shadowrun-anarchy/rules/le-piratage-et-les-modes-de-connexion-a-la-matrice.md),
[planification](../../docs/systems/shadowrun-anarchy/rules/monnaie-de-table.md),
[rigging](../../docs/systems/shadowrun-anarchy/rules/le-rigging-et-la-plongee-dans-les-vehicules.md),
[moniteur](../../src/modules/combat/logic/moniteurDeShadowrun.ts),
[champs du pilote](../../outils/shadowrun-anarchy/finir_shadowrun.py).

| Priorité / lot proposé | Constat vérifié au 01/11 | Amélioration proposée et critère de recette |
| --- | --- | --- |
| 🔴 P1 · SR-A1 — Blessures, drain et soins admissibles | La grave pèse déjà sur le jet ; légère récente cochée manuellement. Le moniteur ne conserve ni origine drain ni autorisation des soins : son bouton de soin retire simplement la pire blessure | Ajouter origine et terme de la blessure/du malus, conséquences du drain proposées après le jet magique, repos et soins distingués. Une blessure de drain ne doit pas être effacée par premiers soins ou magie ; le désavantage temporaire expire au bon terme de narration, pas au simple passage d'un round |
| 🔴 P2 · SR-A2 — Cohérence des champs et des ressources | Réserve de compétence et seuils sont des nombres saisis ; les calculs du panneau ne réécrivent pas ces dérivés. Anarchy est déclarée max 99 malgré l'absence de plafond dans la règle ; Essence 0 ne marque pas à elle seule un état terminal | Proposer réserve/seuils dérivés avec dérogation explicite, supprimer ou rendre cohérent le plafond d'Anarchy dans tous les lecteurs, faire confirmer les suites d'Essence. Tester Anarchy 99 → 100 et une variation d'attribut sans effacer les blessures ; préserver les protections propres au profil, sans les deviner depuis leur nom |
| 🔴 P1 · SR-A3 — Piratage préparé et surveillance | La fiche contient minimum de risque et hausse du seuil ; mode RA/RV, accès, backdoor et surveillance de DIEU sont réglés à la main | Préparer un contexte de tentative : Firewall, accès visé, préparation, mode et minimum de risque ; garder la progression de surveillance et proposer les conséquences. Accès Aucun → Administrateur : +2 au seuil avant backdoor ; hot-sim : biofeedback mental létal, pas physique. Ne pas donner d'action/avantage RV à une connexion qui ne les permet pas |
| 🔴 P2 · SR-A4 — Planification, flashback et menace | Les deux réserves sont natives et leurs droits déclarés ; succès de préparation, paiement de flashback, alimentation de menace et désastre sont manuels | Proposer crédit des succès, paiement personnel/collectif validé et coût de flashback (1–4), sans achat de dés. En narration totale seulement, proposer les mouvements de menace et le dépassement ; 4 en planification, flashback 2 → 2, un seul débit et même valeur après reconnexion |
| 🔴 P2 · SR-A5 — Opposition et rôles adverses | Le panneau compare les succès à un seuil fixe, y compris celui saisi depuis l'adversaire ; il ne tranche pas la règle d'égalité ni la valeur moyenne d'un second rôle. Le dé spécial alternatif est déjà implémenté | Ajouter une comparaison explicitement opposée, égalité non départagée et arbitrage quand un vainqueur est nécessaire ; proposer le profil de second rôle. Deux camps à 4 succès ne deviennent pas automatiquement une victoire du lanceur. Tester séparément l'import de la variante alternative, sans la réimplémenter |
| 🔴 P3 · SR-A6 — Rigging et véhicule, après arbitrage | Aucun suivi natif des modes de contrôle, de l'appareil et de son biofeedback ; contradiction du livre sur la résistance des véhicules déjà consignée | Fixer d'abord avec David la référence de résistance, puis suivre appareil/rigger séparément, priorité des modes et nature du biofeedback. Une case grave cochée sur l'appareil provoque une légère au rigger, selon le mode ; ne pas copier le moniteur humanoïde comme règle universelle de Structure |

**À conserver comme choix de table :** narration, contenu d'un flashback et effets ouverts
des atouts. Les capacités proposées doivent assister leurs coûts et leur suivi, pas inventer
un catalogue de sorts ou automatiser une décision d'auteur. Les variantes « plus sombre »
demandent une option explicite avant tout changement de durée ou de guérison.

**Reste et sujets à auditer :** les fonctions livrées sont validées par David le 01/11 ; non automatisés :
drain (p. 170), surveillance de DIEU (p. 218), dommages des véhicules (Structure × 2, × 3), variantes
« plus sombre » (p. 69), valeur moyenne des seconds rôles (p. 81) ; le livre se contredit sur la
résistance des véhicules (p. 68 : Structure × 2 et × 3 ; p. 230 : Structure comme la Force).

## Star Trek Adventures

**Référence :** [audit et livraison du 23/10](2026-10-23-star-trek-ameliorations.md), contre le
Livre de Base de la **deuxième édition** ; [manuel du pilote et de LCARS](../User%20Guides/54-Jeu-Star-Trek.md) ;
registre § 167. **Mis à jour le 24/10** : pilote 2.0.0 réimporté, essai de David validé.

**Déjà disponible :** Attribut + Fonction, 2d20, spécialisations, achats de dés,
Impulsion/Menace ; LCARS intégré au Tablet Hub avec sept consoles, demandes arbitrées,
rapports privés, pièces jointes, alertes et sauvegarde par campagne. **Depuis le 23/10** : la
tâche complète au panneau (marge de complication, opposition, assistants, aide du vaisseau,
Occasion parfaite, Éclair d'inspiration, réussite mitigée) ; Stress et blessures ; alternance
des camps ; Réputation de fin de mission ; contrôle de création ; Menace de départ par
personnage ; module **Bataille spatiale et tâches étendues** en habillage LCARS.

*Inventaire du 20/10, conservé pour mémoire — chaque piste est instruite plus bas :*

| Priorité | Étape ou amélioration à instruire |
| --- | --- |
| 🔴 P0 avant extension | Auditer l'export actuel contre les règles de la deuxième édition : santé, réserves, complications et Détermination ; ne pas recopier les règles de Dune par parenté 2d20 |
| 🔴 P1 | Assister la Menace initiale à partir du nombre de PJ présents ; le manuel indique actuellement un montant fixe à ajuster |
| 🟠 Essai | Éprouver LCARS sur les appareils physiques : attribution des postes, confidentialité, déconnexion/reconnexion, son et retour de veille |
| 🔴 P2, à auditer | Examiner les raccords mécaniques des commandes de consoles, de la santé et des ressources, en distinguant mise en scène et résolution de règles |
| 🔴 P3, à cadrer | Déterminer si un suivi de vaisseau/équipage et des conflits spatiaux est souhaité, puis établir son périmètre avec le livre |

Ces deux dernières lignes sont **des pistes d'audit**, pas des fonctions déclarées absentes
ou des règles déjà validées. Les consoles LCARS et leurs échanges ne sont pas à recréer.

**Instruites et livrées le 23/10** (registre § 167, [audit et livraison](2026-10-23-star-trek-ameliorations.md)),
à la demande de David (« on va faire toute les améliorations de Star Trek ») :

| Lot | Livré | Reste |
| --- | --- | --- |
| 🟢 P0 · audit et corpus | Export du 22/10 audité contre la deuxième édition ; dix fiches du corpus corrigées, quatre relues | Six fiches encore `relu: false` |
| 🟢 P1 · Menace initiale | « Nouveau scénario » : 2 par personnage joueur (`departParPersonnage`), Impulsion à 0 | — |
| 🟢 P2 · raccords mécaniques | La tâche complète au panneau ; Stress et blessures ; Réputation ; alternance des camps ; Détermination à 1 par séance. LCARS reste une mise en scène, sans calcul | Talents non interprétés ; PNJ selon leur rang |
| 🟢 P3 · vaisseau et conflits spatiaux | Module `star-trek-operations`, habillage LCARS : vaisseaux, Boucliers, dégâts, brèches, noyau ; tâches étendues et défis | Actions de poste à la main. Trois lectures **confirmées par David le 24/10** : seuils des Boucliers cumulés, Détermination à 1 par séance, 1 Menace pour ouvrir sur un PNJ à la main |
| 🟠 Essai | Pilote 2.0.0 réimporté ; **essai de David validé le 24/10** (« ok j'ai tout testé c'est bien ») | LCARS sur les appareils physiques |

## Symbaroum

**Référence :** [audit S0–S9 du 20/10](2026-10-20-symbaroum-propositions.md), contre le
livre de base, avec NotebookLM limité à ce livre et vérifications déterministes du moteur.

**Déjà disponible :** fiche HTML `symbaroum-fr`, 182 zones et 158 clés, intégrée et raccordée ;
pilote corrigé à 10 sections et 139 champs, huit Attributs, talents, armes, protections,
artéfacts et compagnons. La fiche passe son validateur sans erreur ni avertissement.
Registre général : § 145, 149, 150, 155 et **166**, lignes 81 et 102.

**Livré (registre § 145) :** le jet **additionnait les huit Attributs** — une seule composante
désormais — et la santé de départ lit l'Endurance (`712f70c1`). En écrivant la page du manuel
(`54-Jeu-Symbaroum.md`, `34404411`), **chaque test réussissait, un 20 compris** : la Forge avait
rangé le modificateur du livre dans `jet.difficulte`, qui compte des réussites. Réglage retiré
du pilote, réimporté par David le 21/10 ; le modificateur se compte depuis à la main.

**S1 préparé, pas commencé (21/10) :** `DescripteurDeJet.modificateurDuSeuil` (−5 à +5) ajouté au
seuil d'un jet sous le seuil et expliqué ; curseur « Modificateur » du panneau, pour la fiche et la
tablette ; consigne et contrôle de la Forge ; script de raccord du pilote ; essais, guide 53 et
page Symbaroum. **Tranché par David le 22/10 : l'opposition explicite** de l'audit
(`12 + (10 − 13) = 9`).

**S1 livré le 22/10 (registre § 149) :** `jet.modificateurDuSeuil` (−5 à +5, et opposition
`10 − Attribut adverse`) au moteur ; case « Attribut adverse » et curseur « Modificateur » au
panneau, sur la fiche et la tablette, qui s'additionnent ; calcul lisible sous « Seuil » et
redit au journal ; consigne, contrôle et revue de la Forge. Le contre-exemple de l'audit échoue
(`10 / 9`). Pilote corrigé : `Export Dirvers/corriges/Symbaroum_driver_gmos_s1-opposition.gmos-driver`
(script `outils/symbaroum/ajouter_modificateur_du_seuil.py`) ; page du manuel et trois captures
refaites. **Réimporté ; essai de David validé le 22/10, comme S3 et S4.**

| Lot | Priorité | Amélioration possible |
| --- | --- | --- |
| 🟢 S0 | **Livré le 23/10** | Corpus corrigé : choix du joueur après douleur, tests de mort qui continuent, cécité, asymétrie, gain permanent de Corruption, dégâts alternatifs (registre § 166) |
| 🟢 S1 | **Livré le 22/10** | Opposition explicite et modificateur au seuil du d20, calcul lisible sous « Seuil » et redit au journal (registre § 149) ; essai de David validé |
| 🟢 S2 | **Livré** (22/10 et 23/10) | Endurance courante = santé principale, fiche neuve initialisée (§ 150) ; dérivées calculées et agonie (§ 166) |
| 🟢 S3 | **Livré le 22/10** | Case Avantage tactique (+2 au seuil, +1D4 aux dégâts rappelé, un seul d20) ; le double lancer renommé (registre § 155). La cécité (trois cas) et la cible à terre (mêlée seulement) se règlent au jet, rappelées par la carte Le tour de combat (§ 166) |
| 🟢 S4 | **Livré** (22/10 et 23/10) | Fin de scène (§ 150) ; Stigmate et 1D4 permanent au seuil, Abomination (§ 155) ; quel Stigmate et sa durée, Ombre, coûts des pouvoirs en gestes (§ 166) |
| 🟢 S5 | **Livré le 23/10** | Parcours attaque/Défense du joueur ; dégâts/protection fixes des PNJ ; dégâts nets, douleur, poison, acide, dégâts alternatifs (§ 166) |
| 🟢 S6 | **Livré le 23/10** | Initiative départagée par Vigilance puis d20 (`combat.departages`) ; retard par glisser ; rappels d'actions et réactions (§ 166) |
| 🟢 S7 | **Livré le 23/10** | Contrôle de création, progression sur l'Expérience à dépenser (§ 166) ; les effets des Talents restent à la main |
| 🟢 S8 | **Livré le 23/10** | Pas de critique de base ; options par campagne, confirmation, Mort subite, dégâts critiques, relances (§ 166) |
| 🟢 S9 | **Livré le 23/10** | Bourse unique réécrite sur un clic ; voyages du Tableau 26 ; manuel et captures (§ 166) |

**S0, S2 et S5 à S9 livrés le 23/10 (registre § 166)**, à la demande de David (« je voudrais
qu'on finisse Symbaroum »), contre le Livre de Base : logique pure `systemes/symbaroumRegles.ts`,
cartes `SymbaroumAuJet.tsx` au panneau de jet, départage commun de l'initiative
(`combat.departages`), règles optionnelles par campagne (`Campaign.reglesOptionnelles`), contrôles
de la Forge, pilote **2.0.0** par `outils/symbaroum/finir_symbaroum.py` (zéro constat), corpus
corrigé, page du manuel et neuf nouvelles captures. **Essai de David : à faire**, après réimport de
`Export Dirvers/corriges/Symbaroum_driver_gmos_finir.gmos-driver`.

| Lot | Livré le 23/10 | Vérifié | Reste à la main |
| --- | --- | --- | --- |
| 🟢 S0 | Neuf fiches du corpus corrigées ; santé, dégâts, initiative passées à `relu: true` ; trois affirmations sans passage retirées ; un écart de plus trouvé (dégâts alternatifs : l'Attribut à 0 **tue**, p. 205) | Contre les pages imprimées 103, 123–124, 152–157, 161–167, 177–184, 190, 205 | Six fiches encore `relu: false` (talents, problèmes gradués, toiles…) |
| 🟢 S2 | Valeurs dérivées comparées à la fiche, « Adopter » ; carte Endurance et agonie : Test de mort compté sur la fiche, soins et Medicus par rang | 27 essais du module, 7 du panneau | — |
| 🟢 S4 | Corruption, Ombre, sources (pouvoir, artéfact, apprendre, se lier — ou 1 Expérience), Stigmates du Tableau 24, temporaires un jour | Idem | Coûts propres à chaque tradition |
| 🟢 S5 | Nature du test ; dégâts de l'arme (Avantage, Attaque parfaite) moins la protection fixe du PNJ ; encaisser : dégâts fixes moins la protection lancée, quatre genres de dégâts, mourant à 0 | Idem ; captures `jeu-symbaroum-degats`, `-encaisser` | L'Endurance des PNJ dans le suivi de combat |
| 🟢 S6 | `combat.departages` : la Vigilance, puis un d20 relancé entre ex aequo ; carte Le tour de combat | 4 essais du départage | Retarder : glisser le combattant |
| 🟢 S7 | Contrôle de création (80, 5–15, un seul 15) ; Expérience gagnée ; rangs 10/20/30 sur l'Expérience à dépenser | Idem | Les effets des Talents |
| 🟢 S8 | Le d20 sans critique de base (panneau et tablette) ; six options du chapitre 19, par campagne ; confirmation ; relance unique | Idem | — |
| 🟢 S9 | Bourse en thalers, shillings, ortegs, réécrite sur la fiche sur un clic ; voyage du Tableau 26 et jour éreintant | Idem ; captures `-bourse`, `-voyage` | Rencontres du voyage |

**Cas témoin reproduit le 20/10, corrigé le 22/10 :** Précision 12, opposition 13, dé 10 : le
code annonçait une réussite sous 12 ; il annonce `10 / 9`, un échec.

## Torg Eternity

**Référence :** [manuel actuel](../User%20Guides/54-Jeu-Torg.md).
Le pilote a beaucoup évolué depuis les premières propositions du 13/10 : se référer aux
fonctions livrées, pas à leurs anciennes listes de manques.

**Déjà disponible :** dé explosif/Table des Bonus, Possibilités, relances favorisées,
annulation des dommages, Blessures/Choc, Paquet d'Action, Cartes du Destin et de Cosm,
plusieurs Lois du Monde, sbires, hordes, attaques combinées et cibles multiples.

| Priorité | Amélioration possible |
| --- | --- |
| 🔴 P1 | Structurer Atouts et capacités spéciales pour proposer les gestes pertinents depuis les fiches, au lieu de les offrir sans vérifier leur présence |
| 🔴 P2 | Encadrer l'échange des Cartes du Destin en combat selon la procédure du jeu ; le don générique de Deck-OS n'en vérifie pas toutes les contraintes |
| 🔴 P2 | Raccorder progressivement les effets de cartes et Lois encore manuels, avec choix des cibles et application tracée |
| 🔴 P2 | Pour la capacité Sbires, proposer la cible proche et le transfert du coup ; le bouton actuel teste puis laisse le MJ porter le coup sur l'autre carte |
| 🔴 P0 avant extension | Relire les passages nécessaires du livre et l'export réel avant d'automatiser de nouveaux Atouts ou effets |

**Cas témoin :** un vilain ne reçoit pas automatiquement la capacité Sbires parce qu'il est
un adversaire ; le MJ peut toujours arbitrer la proximité et la cible. Les effets narratifs
des cartes n'ont pas tous besoin d'un automatisme. Il ne faut pas refaire les paquets ou les hordes.

## Within

**Référence disponible :** `Export Dirvers/Within_driver_gmos_1792181466579.gmos-driver`,
version déclarée `1.0.0`, identifiant `custom-1775595326986`.
**État : en suspens — David a effacé le pilote (24/10) : ni corpus ni audit à faire pour l'instant.** Les étapes ci-dessous ne valent que si le jeu revient.

Examen structurel limité ; aucun audit du livre de Within effectué.

L'export contient un modèle de **5 sections et 12 champs** et des descriptions de mécaniques.
Il ne déclare pas les propriétés exécutables `dice`, `jet`, `combat` ou `corpusId`.
Plusieurs textes de personas font référence à **« Echoes of the Void »** : leur adéquation
avec Within doit être contrôlée. Ces textes sont des données à examiner, pas des consignes
pour l'agent qui réalise cette synthèse.

| Priorité | Étape ou amélioration à instruire |
| --- | --- |
| 🔴 P0 | Identifier le livre et l'édition retenus ; auditer les descriptions, noms et personas contre cette référence |
| 🔴 P0 | Définir un corpus fiable et une vraie configuration du jet ; ne pas prendre le texte « D6/D10 » de l'export comme une règle confirmée |
| 🔴 P1 après audit | Reprendre attributs, santé, ressources et procédures de combat selon les règles établies, puis leurs correspondances |
| 🔴 P2 après stabilisation | Préparer/raccorder une fiche interactive fidèle et le manuel du pilote, puis ses captures |

**Prochaine étape :** audit de fond de l'export avec le livre, avant toute proposition de
barème ou de jauge. Ce pilote demande d'abord une référence mécanique établie.

## Améliorations communes et tenue du document

Plusieurs chantiers peuvent partager des capacités du moteur, tout en gardant leurs règles
propres :

| Sujet commun | Pilotes concernés | Résultat recherché |
| --- | --- | --- |
| 🟠 Corpus et contrôles de la Forge | Tous, en priorité Symbaroum/Dune | Détecter une configuration mécaniquement trompeuse, pas seulement les champs inexistants ; références et exemples vérifiés. **Livré le 22/10 (registre § 148) :** la consigne dit que `jet.difficulte` compte des réussites sur plusieurs dés, jamais pour un seul dé, et que le seuil de chaque dé va dans `dice.successThreshold` ; le contrôle du pilote mesure la difficulté au plafond de la réserve. **Crimes relu en entier le 23/10** (§ 160 : 19 fiches sur 19) ; Symbaroum corrigé le 23/10 (§ 166) ; Star Trek (§ 167) et Rêve de Dragon (§ 168) corrigés à leur livraison. **Symbaroum relu en entier le 24/10** (§ 172 : 13 sur 13, sept corrections, quatre affirmations sans source retirées). **Dune relu en entier le 24/10** (§ 173 : 20 sur 20 contre le livre et son errata). **Blade Runner relu en entier le 24/10** (§ 174 : 22 sur 22). **RuneQuest relu en entier le 30/10** (§ 187 : 17 sur 17 contre le livre et son errata). **Degenesis relu en entier le 30/10** (§ 188 : 16 sur 16). **COC relu en entier le 31/10** (§ 193 : 18 sur 18). **Shadowrun : Anarchy relu en entier le 01/11** (§ 197 : 19 sur 19, seize corrigées). **Alien — supplément *Colonial Marines* relu en entier le 02/11** (§ 185 : 18 fiches et l'inventaire, contre l'édition française du carnet ; deux erreurs de chiffres, une soixantaine de noms anglais rétablis). **Compté le 24/10 — fiches encore `relu: false` :** Alien 23 sur 26, Cthulhu Hack 18, NOC 19, Nephilim 21, Rêve de Dragon 16 sur 21, Star Trek 15 sur 19, Torg 16, corpus 2d20 19, SRD YZE 17, Barbarian 16 ; Within n'a aucun corpus, et son pilote est retiré (David, 24/10 : pas la peine pour l'instant). **Reste :** les autres corpus, à relire quand leur jeu sera repris |
| 🟢 Modificateurs et contexte du jet | Symbaroum, Alien, puis audits des autres | Distinguer modificateur de seuil, nombre de dés, réussites exigées et meilleur/pire dé. **Avantage tactique livré le 22/10 (§ 155).** **Livré le 22/10 (registre § 149) :** `jet.modificateurDuSeuil`, capacité commune du moteur (tout jeu jeté sous un seuil additionné), avec opposition explicite ; Symbaroum la déclare. Les réussites exigées restent `difficulte` (Dune), le nombre de dés la réserve, meilleur/pire dé « Tirage ». **Rien de commun ne reste (24/10)** : le moteur est livré ; chaque jeu l'emploie dans son propre chantier (Crimes, Symbaroum, Star Trek, Nephilim, Rêve de Dragon et Blade Runner finis ; Dune, NOC et Torg dans leurs sections, Within en suspens) |
| 🟢 Choix du paiement et bilan du jet | Dune, Star Trek | Conserver coût, source, effets immédiats et reliquat, sans double dépense ni perte anticipée. **Livré le 22/10 (registre § 151) :** `paiementAuChoix` (« dont en Menace », depuis la fiche et la tablette) ; l'Impulsion du jet que la réserve pleine ne garde pas reste sur le test (dépenser ou verser). Activé pour Dune (D2) et pour **Star Trek**, audité et fini le 23/10 (§ 167). **Rien de commun ne reste (24/10)** : les dépenses contextualisées et l'Impulsion bonus sont propres à Dune, dans sa section (développées et validées par David le 25/10, § 175) |
| 🟢 Santé et séquelles | Symbaroum, Crimes, Alien, Blade Runner, Cthulhu Hack, NOC | Une valeur courante de référence ; distinguer temporaire/permanent, soins et états propres au jeu. **Livré le 22/10 (registre § 150) :** la fiche naît à sa santé de départ ; la Forge avertit d'une santé sans champ courant (Symbaroum corrigé, Crimes signalé) ; `franchissements` propose la séquelle permanente une fois par passage (NOC). Crimes C2 livré le 22/10 (§ 158 : Potentiel actuel, atteintes, bonne nuit). **Vérifié le 24/10 :** Crimes C6 livré (la carte de combat lit le Physique actuel, `CombatCard` → `physiqueActuel`, § 161) ; Cthulhu Hack fini le 23/10 (§ 164) ; agonie de Symbaroum (§ 166), Stress et blessures de Star Trek (§ 167), blessures et famine de Rêve de Dragon (§ 168). **Rien de commun ne reste** : la stabilisation de Blade Runner est livrée dans sa section le 24/10 (§ 174) |
| 🟢 Événements de scène, séance et temps de jeu | Corruption, Stress, soins, progression, voyages | Des déclencheurs nommés ; une reconnexion ne rejoue pas une dépense, un soin ou un franchissement. **Livré le 22/10 (registre § 150) :** « Fin de scène » écrit aussi les fiches (`gestesDesHeros.finDeScene`, `delta: 'vide'`) après aperçu, même sans réserve de table ; un franchissement traité est retenu par la fiche. La Corruption au seuil est livrée (§ 155) ; les durées de Cthulhu Hack le 23/10 (§ 164) ; potions et famine de Rêve de Dragon au Château Dormant le 24/10 (§ 168). **Rien de commun ne reste (24/10)** : les durées de guérison de Blade Runner sont livrées le 24/10 (§ 174) |
| 🟢 Fiches, tablettes et journal | Tous | Même calcul et mêmes ressources ; clés stables, secrets filtrés et modifications historisées. **Audit rendu le 22/10** ([rapport](2026-10-22-audit-fiches-tablettes-journal.md), registre § 151) : secrets du meneur envoyés aux tablettes des joueurs (S1 `lectureDuMeneur`, S2 `gmNotes`, S5 fenêtres locales), indices non révélés (S3), notes du meneur écrivables par un joueur (S4), modifications de fiche jamais historisées (H1), pupitre sans réserves (C1) ; motif des tablettes au journal corrigé (A1). **S1, S2, S5 corrigés le 22/10** (registre § 152) : les secrets du meneur ne partent plus vers les tablettes ni les fenêtres de la table ; **S3, S4 le même jour** (§ 153) : indices non révélés retenus, notes du meneur protégées ; **H1 et C1** (§ 154) : modifications de fiche au journal avec leur origine, réserves 2d20 réglées au pupitre et à la télécommande. **Tous les constats traités** ; les recettes des tablettes, cassées depuis `a128c7af`, toutes vertes (§ 156). **Clés stables, audit fini le 24/10** (§ 170) : quatre défauts corrigés — copie d'un pilote sur la fiche de l'original, duplication d'un gabarit sans ses règles, corbeille sans vérification d'usage, copie de campagne partageant les fiches HTML. **Essayé par David le 24/10 : tout marche. Rien ne reste** |
| 🟢 **Onglet « Lancer un test »** — livré le 22/10 (`6f709c79`, registre § 147) | Tous | Le test a son onglet sur la fiche du meneur (Formulaire / Lancer un test / Fiche du jeu) et sur la tablette (Vue synthétique / Lancer un test / Ma fiche / groupe), d'après les maquettes Stitch retenues : étapes Composer, Préparer, Lancer les dés, Résultat ; dés nommés ; blocs propres au jeu en cartes repliables (Alien : dernier test, blessures, Stress et Panique ; RdD : mécaniques du Voyageur). Aucun pilote modifié. Captures du manuel refaites pour les dix jeux. **Essai de David validé le 22/10** |
| 🟢 Catalogue d'équipement du pilote | Alien (*Colonial Marines*) d'abord, puis tous | Les armes, protections, véhicules et le matériel du jeu, dans le pilote, avec les colonnes que chaque jeu déclare. **Livré le 02/11 (registre § 203) :** étape A, le modèle et son contrôle (`controlerLeCatalogue` dans `controlerLePilote`) ; étape B, la section « Équipement » de l'éditeur du pilote, dessinée dans Stitch. **Essai de David attendu.** Étape C, la lecture livrée le 02/11 : `remplirDepuisLesFiches` lit les tableaux des fiches relues, sans carnet (66 objets de *Colonial Marines*) ; le livre de base est transcrit depuis le PDF en image (quatre fiches `equipement-*`, 89 objets). L'aperçu « Remplir depuis le corpus » est livré le même jour (écran Stitch), puis l'étape D : « Prendre dans le catalogue » sur la fiche Alien écrit une arme ou une protection dans les champs que le jet lit. **B, C et D essayés par David le 02/11 (« ça marche bien »).** Étape E livrée le même jour : le matériel et la protection prise entrent au Sac à dos, reliés au catalogue, et la carte « Équipement porté » rappelle au jet d'Alien les effets qui visent la compétence, cases décochées. **E essayée par David le 02/11 au soir (« ok ca marche »), après trois corrections vues à l'écran : compétences préfixées « Es_ », faux effet des Palmes, cible d'un effet choisie dans une liste.** **Reste :** les autres jeux ; le rappel des effets au panneau de jet ([plan](2026-11-02-catalogue-d-equipement.md)) |
| 🟢 Documentation et recette | Tous | Page 53, page 54 du jeu et captures conformes aux fonctions réellement livrées. **Recette du 24/10** (registre § 171) : les onze jeux rejoués sur leur dernier pilote et comparés au manuel ; six captures et deux légendes mises à jour ; l'essai des captures photographie désormais en pixels CSS. Within n'a pas de page : son pilote est retiré |

**Format des futures campagnes d’essais — décision du 01/11/2026.** David demande d’appliquer à toutes les prochaines créations une campagne complète, généralement **10 à 15 séances**, dans **un seul .gmos**, avec intrigue suivie, arcs, conséquences et fins ; ateliers de recette intégrés dans un acte hors fiction de la même Trame. Le plugin [GM-OS Campagnes de test](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf) **0.2.0 est publié et relu** ; procédure locale synchronisée. États de référence pour une restauration locale/manuelle des seuls champs d’essai ; Nexus Remplacer concerne toute la campagne. Les anciens lots et leur validation restent inchangés ; plusieurs campagnes seulement sur demande explicite. Douze tests structurels et paquet vérifiés, pas de nouvelle campagne créée par cette mise à jour. [Reprise](2026-11-01-etat-et-reprise-codex-plugin-campagne-complete.md).

**Priorités transversales réévaluées le 01/11 (les quatre nouveaux pilotes).**
Les validations du 22–24/10 ci-dessus restent des acquis dans leur périmètre ; elles ne
valident pas la confidentialité de tous les champs ajoutés depuis. Les recettes ultérieures
conservent le constat historique GM-05 ; le correctif du 01/11 est vérifié séparément au § 200.
Ne pas relire « rien ne reste » comme une clôture des nouveaux cas encore ouverts.

| Priorité / lot proposé | Constat et périmètre | Résultat attendu et preuve à obtenir |
| --- | --- | --- |
| 🟢 P0 · NP-C1 — Secrets de séance / GM-05 | **Corrigé et validé par David le 01/11**, § 200 : gmSecrets vidé par le filtre commun, état privé MJ conservé. Les quatre rapports de recette en échec décrivent la version précédente | 70 tests ciblés, build/types et lint passent ; quatre tests Electron sur douze Hub passent, synchronisation initiale/différentielle/reconnexion, résumés publics reçus et zéro fuite. Essai de David validé ; les archives historiques ne sont pas réécrites |
| 🟢 P1 · NP-C2 — Anciennes fiches et versions | **Livré et validé par David le 03/11.** Référence sur les nouveaux PJ, diagnostic sans version historique inventée ; correspondances explicites et aperçu. Nexus signale une dépendance différente conservée, même à version identique | Export JSON et restauration protégée ; anciennes clés, notes et santé conservées. **252 tests ciblés, quatre reprises dans Electron avec téléchargement, restauration et rechargement** ; captures relues. [Suivi](2026-11-03-np-c2-c3-reprises-droits-variantes.md) |
| 🟢 P1 · NP-C3 — Droits et variantes | **Éprouvé et validé par David le 03/11.** Quatre jeux sur la vraie porte WebSocket : refus d’autrui, propres éditions autorisées, notes MJ protégées et persistance. Aucun bug GM-06 trouvé | Deux parcours supplémentaires : COC 3d6 et Shadowrun alternatif, remplacement/import, jets, retour standard et rechargement ; personnages conservés. Six parcours verts au total et huit captures relues. Validation humaine globale de David ; aucune nouvelle preuve instrumentée de tablette physique. [Suivi](2026-11-03-np-c2-c3-reprises-droits-variantes.md) |

**Suite choisie par David :** NP-C1, RQ-A2 et RQ-A1 validés ; **NP-C2 et NP-C3 choisis le 02/11**. **NP-C2 et NP-C3 livrés, éprouvés et validés le 03/11** ; choisir ensuite un autre lot restant,
puis un lot central du jeu effectivement joué : DEG-A1, COC-A1/A2/A3 ou SR-A1/A3. Calculs,
progression et confort viennent ensuite. Le rigging reste conditionné à l'arbitrage de sa
référence. Les autres propositions restent à choisir ; le présent suivi ne choisit pas la campagne de David.

**Pour choisir une prochaine intervention (historique du 25/10, complété par l’analyse ci-dessus) :** Alien, Crimes, Cthulhu Hack,
Nephilim, Rêve de Dragon, Star Trek, Symbaroum et Blade Runner sont finis contre leur livre ;
Barbarians of Lemuria (27/10), RuneQuest et Degenesis (30/10) aussi ; les fonctions livrées des quatre nouveaux pilotes sont validées globalement par David le 01/11.
NOC est terminé et validé par David le 25/10 (§ 177) ; Torg reste à auditer ; Dune est validé
par David le 25/10 (§ 175) ; Within est en suspens, son pilote retiré par David. Ce repérage n'impose pas un ordre entre les
campagnes de David.

### Mise à jour obligatoire à chaque livraison

Les audits et registres liés conservent les références au livre, les preuves et les recettes.
Pour Alien et Crimes, leurs registres dédiés font foi pour l'avancement ; pour les autres,
utiliser le document de chantier/référence indiqué. La synthèse suit ces mêmes états.

- **Amélioration mise en place :** actualiser la section du pilote et sa ligne dans la vue
  d'ensemble. Ranger ce qui est livré dans les acquis, retirer ou reformuler le travail
  restant et réviser la prochaine étape/priorité si nécessaire.
- **Traçabilité :** indiquer la date, les références au chantier et aux fichiers ou commits,
  ainsi que les vérifications effectuées. Si la réalisation est partielle, préciser ce qui
  manque. Un essai de David encore attendu reste signalé comme tel.
- **Indicateurs :** passer la ligne de 🔴 à 🟠 à la livraison, de 🟠 à 🟢 quand David a
  essayé et qu'il ne reste rien ; recompter la colonne **Avancement** de la vue d'ensemble.
- **Nouveau pilote :** ajouter une section à son nom et une ligne dans la vue d'ensemble,
  avec la référence du pilote, ses acquis, les améliorations connues et les points à auditer.
  Ne pas inventer des règles ou des défauts pour remplir la section ; garder la liste et les
  renvois cohérents avec les pilotes effectivement recensés.
- **Cohérence :** mettre à jour dans la même livraison le registre détaillé concerné et,
  pour les fonctions livrées, le manuel des jeux et ses captures selon `AGENTS.md`.
  Ne pas déduire l'état actuel des anciens paragraphes historiques.

La création initiale de cette synthèse ne modifiait aucun pilote ni code applicatif ; les
livraisons ultérieures sont suivies dans les sections correspondantes. Avant tout travail
dans `src/` ou `electron/`, demander **« GM-OS tourne-t-il ? »** et attendre la réponse,
conformément à `AGENTS.md`. **Consolidé le 22/10 avec le registre général** (§ 143 Dune,
§ 145 Symbaroum, § 146–147) : les deux documents disent le même état, et les audits qu'ils
citent (Crimes, Dune, Symbaroum) sont versionnés.
