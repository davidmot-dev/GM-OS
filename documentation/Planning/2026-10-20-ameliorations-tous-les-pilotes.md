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

## Vue d'ensemble

| Pilote | Avancement | État de la connaissance | Première amélioration ou prochaine étape proposée |
| --- | --- | --- | --- |
| [Alien](#alien) | 🟢 11 · 🟠 0 · 🔴 0 | A0–A9 validés par David ; **A10, préréglages et remise à zéro des modules, livré et essayé le 23/10** (registre § 163) ; campagne de recette avec trois modules préparés livrée le 26/10 (§ 180) | Essayer les 74 cas du cahier ; GM-05 transversal signalé ; aucun lot A0–A10 à refaire |
| [Blade Runner](#blade-runner) | 🟢 4 · 🟠 0 · 🔴 0 | **Fini le 24/10, pilote 2.0.0** (registre § 174) : audit, pupitre, mort et stabilisation, guérison, et au-delà ; **essayé par David le 25/10** | Rien : tous les lots faits |
| [Crimes](#crimes) | 🟢 13 · 🟠 0 · 🔴 0 | Audit du manuel ; **C0 relu et validé le 23/10, C1 à C3, C5 et C6 livrés et essayés le 22/10** ; **tous les lots livrés et essayés le 23/10** : circonstances, hermétiques, opposition, psychologie et seuils, manœuvres, contacts, fortune, création (registre § 157–161) | Rien : tous les lots faits ; tir multiple, intimider, rivalités et fortune commune restent au meneur |
| [Cthulhu Hack](#cthulhu-hack) | 🟢 5 · 🟠 0 · 🔴 0 | Cinq améliorations livrées et essayées par David le 23/10 contre le livre français (p. 31–32, 34, 42, 50–52), registre § 164 ; campagnes de recette livrées le 25/10 et rattachées aux trois joueurs existants (§ 178) | Essayer les 59 cas du cahier ; défaut transversal GM-05 (`gmSecrets` transmis aux tablettes) consigné au § 1 bis. Soins spéciaux et suites mentales restent des sujets d'audit séparés |
| [Dune](#dune) | 🟢 9 · 🟠 0 · 🔴 0 | D0–D8 livrés, pilote 2.0.0 ; **tout testé et validé par David le 25/10**. Fiches HTML PJ/Maison **intégrées au moteur 17 et raccordées le 25/10** (§ 176 : maximes par principe, spécialisations par compétence, Maison en fiche de groupe qui fait foi). Corpus relu (§ 173) ; bilan § 175 | Fiches essayées et validées par David le 25/10 ; les arbitrages narratifs restent au MJ |
| [Nephilim Légende](#nephilim-légende) | 🟢 9 · 🟠 1 · 🔴 0 | **N1–N9 livrés et essayés le 23/10** (registre § 165) : tout le livre au jet et sur la fiche | L'essai sur tablette physique |
| [NOC](#noc) | 🟢 9 · 🟠 0 · 🔴 0 | **Tous les points validés par David le 25/10 : « ok tout fonctionne »** ; pilote 2.0.0, moteur de fiches 18, commit `bf83cbf6`. [Bilan](2026-10-25-noc-finir.md), registre § 177 ; campagne et Cabale de recette livrées (§ 179) | Essayer les 62 cas de recette ; GM-05 transversal signalé ; les portées et arbitrages narratifs restent à la Loi |
| [Rêve de Dragon](#rêve-de-dragon) | 🟢 6 · 🟠 1 · 🔴 0 | Socle R0–R7, boucle TMR ; **pilote fini le 24/10**, 2.0.0 (registre § 168, [bilan](2026-10-24-reve-de-dragon-finir.md)) : phases du round, famine/potions, entraînement, Haut-Rêve, calendrier Clock-OS, PNJ ; campagne de recette avec carte TMR et 14 tables livrée le 26/10 (§ 181) | Réimport et essai de David avec les 69 cas ; GM-05 transversal signalé |
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

## Dune

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
| 🟠 Corpus et contrôles de la Forge | Tous, en priorité Symbaroum/Dune | Détecter une configuration mécaniquement trompeuse, pas seulement les champs inexistants ; références et exemples vérifiés. **Livré le 22/10 (registre § 148) :** la consigne dit que `jet.difficulte` compte des réussites sur plusieurs dés, jamais pour un seul dé, et que le seuil de chaque dé va dans `dice.successThreshold` ; le contrôle du pilote mesure la difficulté au plafond de la réserve. **Crimes relu en entier le 23/10** (§ 160 : 19 fiches sur 19) ; Symbaroum corrigé le 23/10 (§ 166) ; Star Trek (§ 167) et Rêve de Dragon (§ 168) corrigés à leur livraison. **Symbaroum relu en entier le 24/10** (§ 172 : 13 sur 13, sept corrections, quatre affirmations sans source retirées). **Dune relu en entier le 24/10** (§ 173 : 20 sur 20 contre le livre et son errata). **Blade Runner relu en entier le 24/10** (§ 174 : 22 sur 22). **Compté le 24/10 — fiches encore `relu: false` :** Alien 23 sur 26, Cthulhu Hack 18, NOC 19, Nephilim 21, Rêve de Dragon 16 sur 21, Star Trek 15 sur 19, Torg 16, corpus 2d20 19, SRD YZE 17, Barbarian 16 ; Within n'a aucun corpus, et son pilote est retiré (David, 24/10 : pas la peine pour l'instant). **Reste :** les autres corpus, à relire quand leur jeu sera repris |
| 🟢 Modificateurs et contexte du jet | Symbaroum, Alien, puis audits des autres | Distinguer modificateur de seuil, nombre de dés, réussites exigées et meilleur/pire dé. **Avantage tactique livré le 22/10 (§ 155).** **Livré le 22/10 (registre § 149) :** `jet.modificateurDuSeuil`, capacité commune du moteur (tout jeu jeté sous un seuil additionné), avec opposition explicite ; Symbaroum la déclare. Les réussites exigées restent `difficulte` (Dune), le nombre de dés la réserve, meilleur/pire dé « Tirage ». **Rien de commun ne reste (24/10)** : le moteur est livré ; chaque jeu l'emploie dans son propre chantier (Crimes, Symbaroum, Star Trek, Nephilim, Rêve de Dragon et Blade Runner finis ; Dune, NOC et Torg dans leurs sections, Within en suspens) |
| 🟢 Choix du paiement et bilan du jet | Dune, Star Trek | Conserver coût, source, effets immédiats et reliquat, sans double dépense ni perte anticipée. **Livré le 22/10 (registre § 151) :** `paiementAuChoix` (« dont en Menace », depuis la fiche et la tablette) ; l'Impulsion du jet que la réserve pleine ne garde pas reste sur le test (dépenser ou verser). Activé pour Dune (D2) et pour **Star Trek**, audité et fini le 23/10 (§ 167). **Rien de commun ne reste (24/10)** : les dépenses contextualisées et l'Impulsion bonus sont propres à Dune, dans sa section (développées et validées par David le 25/10, § 175) |
| 🟢 Santé et séquelles | Symbaroum, Crimes, Alien, Blade Runner, Cthulhu Hack, NOC | Une valeur courante de référence ; distinguer temporaire/permanent, soins et états propres au jeu. **Livré le 22/10 (registre § 150) :** la fiche naît à sa santé de départ ; la Forge avertit d'une santé sans champ courant (Symbaroum corrigé, Crimes signalé) ; `franchissements` propose la séquelle permanente une fois par passage (NOC). Crimes C2 livré le 22/10 (§ 158 : Potentiel actuel, atteintes, bonne nuit). **Vérifié le 24/10 :** Crimes C6 livré (la carte de combat lit le Physique actuel, `CombatCard` → `physiqueActuel`, § 161) ; Cthulhu Hack fini le 23/10 (§ 164) ; agonie de Symbaroum (§ 166), Stress et blessures de Star Trek (§ 167), blessures et famine de Rêve de Dragon (§ 168). **Rien de commun ne reste** : la stabilisation de Blade Runner est livrée dans sa section le 24/10 (§ 174) |
| 🟢 Événements de scène, séance et temps de jeu | Corruption, Stress, soins, progression, voyages | Des déclencheurs nommés ; une reconnexion ne rejoue pas une dépense, un soin ou un franchissement. **Livré le 22/10 (registre § 150) :** « Fin de scène » écrit aussi les fiches (`gestesDesHeros.finDeScene`, `delta: 'vide'`) après aperçu, même sans réserve de table ; un franchissement traité est retenu par la fiche. La Corruption au seuil est livrée (§ 155) ; les durées de Cthulhu Hack le 23/10 (§ 164) ; potions et famine de Rêve de Dragon au Château Dormant le 24/10 (§ 168). **Rien de commun ne reste (24/10)** : les durées de guérison de Blade Runner sont livrées le 24/10 (§ 174) |
| 🟢 Fiches, tablettes et journal | Tous | Même calcul et mêmes ressources ; clés stables, secrets filtrés et modifications historisées. **Audit rendu le 22/10** ([rapport](2026-10-22-audit-fiches-tablettes-journal.md), registre § 151) : secrets du meneur envoyés aux tablettes des joueurs (S1 `lectureDuMeneur`, S2 `gmNotes`, S5 fenêtres locales), indices non révélés (S3), notes du meneur écrivables par un joueur (S4), modifications de fiche jamais historisées (H1), pupitre sans réserves (C1) ; motif des tablettes au journal corrigé (A1). **S1, S2, S5 corrigés le 22/10** (registre § 152) : les secrets du meneur ne partent plus vers les tablettes ni les fenêtres de la table ; **S3, S4 le même jour** (§ 153) : indices non révélés retenus, notes du meneur protégées ; **H1 et C1** (§ 154) : modifications de fiche au journal avec leur origine, réserves 2d20 réglées au pupitre et à la télécommande. **Tous les constats traités** ; les recettes des tablettes, cassées depuis `a128c7af`, toutes vertes (§ 156). **Clés stables, audit fini le 24/10** (§ 170) : quatre défauts corrigés — copie d'un pilote sur la fiche de l'original, duplication d'un gabarit sans ses règles, corbeille sans vérification d'usage, copie de campagne partageant les fiches HTML. **Essayé par David le 24/10 : tout marche. Rien ne reste** |
| 🟢 **Onglet « Lancer un test »** — livré le 22/10 (`6f709c79`, registre § 147) | Tous | Le test a son onglet sur la fiche du meneur (Formulaire / Lancer un test / Fiche du jeu) et sur la tablette (Vue synthétique / Lancer un test / Ma fiche / groupe), d'après les maquettes Stitch retenues : étapes Composer, Préparer, Lancer les dés, Résultat ; dés nommés ; blocs propres au jeu en cartes repliables (Alien : dernier test, blessures, Stress et Panique ; RdD : mécaniques du Voyageur). Aucun pilote modifié. Captures du manuel refaites pour les dix jeux. **Essai de David validé le 22/10** |
| 🟢 Documentation et recette | Tous | Page 53, page 54 du jeu et captures conformes aux fonctions réellement livrées. **Recette du 24/10** (registre § 171) : les onze jeux rejoués sur leur dernier pilote et comparés au manuel ; six captures et deux légendes mises à jour ; l'essai des captures photographie désormais en pixels CSS. Within n'a pas de page : son pilote est retiré |

**Pour choisir une prochaine intervention (revu le 25/10) :** Alien, Crimes, Cthulhu Hack,
Nephilim, Rêve de Dragon, Star Trek, Symbaroum et Blade Runner sont finis contre leur livre.
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
