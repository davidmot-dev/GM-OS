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

Cette hiérarchie commune ne remplace pas les priorités détaillées des audits. Aucun lot de
développement n'est autorisé par la demande de synthèse. **Dune reste un projet futur garé**,
conformément à la décision de David du 19/10.

## Vue d'ensemble

| Pilote | État de la connaissance | Première amélioration ou prochaine étape proposée |
| --- | --- | --- |
| [Alien](#alien) | A0–A7 validés par David et poussés ; A8 livré et contrôlé le 22/10 | Essai A8 de David attendu ; combat spatial séparé |
| [Blade Runner](#blade-runner) | Limites documentées ; audit complet à faire | Même choix de forçage au pupitre et sur la fiche ; suivi des blessures |
| [Crimes](#crimes) | Audit du manuel et de l'export corrigé | Corpus puis résolution « Potentiel GARDE Compétence » |
| [Cthulhu Hack](#cthulhu-hack) | Limites documentées ; audit complet à faire | Effets du Hors Jeu et usure reliés aux valeurs de la fiche |
| [Dune](#dune) | Audit détaillé ; projet futur garé | Spécialisations et paiements Impulsion/Menace lors d'une reprise |
| [Nephilim Légende](#nephilim-légende) | Plusieurs anciens lots réalisés ; restes documentés | Conséquences/Chutes, Stase et pacte de Kabbale |
| [NOC](#noc) | Restes revérifiés dans le code le 19/10 | Séquelles et Singularité attribuée par un Rouage |
| [Rêve de Dragon](#rêve-de-dragon) | Socle R0–R7 livré pour les PJ ; première boucle TMR livrée ; mécaniques du Voyageur dans l'onglet « Lancer un test » le 22/10 | Initiative complète et suites du Haut-Rêve |
| [Star Trek Adventures](#star-trek-adventures) | Pilote et LCARS documentés ; audit mécanique détaillé à faire | Export actuel, règles de la deuxième édition et essais matériels LCARS |
| [Symbaroum](#symbaroum) | Audit du livre et de l'export corrigé ; jet corrigé et page du manuel livrés (registre § 145) | S1, modificateur du seuil : préparé, choix de David attendu (curseur seul ou opposition explicite) ; puis Endurance et Avantage tactique |
| [Torg Eternity](#torg-eternity) | Nombreuses fonctions livrées ; limites documentées | Atouts/capacités structurés et échanges des Cartes du Destin |
| [Within](#within) | Export examiné sommairement ; aucune règle primaire auditée | Reprendre la référence et construire une configuration mécanique vérifiable |

## Alien

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
carte de combat et vrai Hub à trois tailles réussie, sept captures relues.
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
[passation](2026-10-22-etat-et-reprise-codex-alien-a8.md). **Essai A8 de David attendu**,
réalisation A8 incluse dans le présent commit, avec les exports corrigés A4–A8, à la demande
de David du 22/10 : « commit tout ce qu'il reste sous ta responsabilité ». Aucun nouveau push demandé.

**Déjà disponible :** réserve de base et Stress, forçage, test et cumul des paniques,
Points de Récit, gestes de repos/objet fétiche, santé raccordée, initiative par cartes,
fiche HTML, MU/TH/UR et détecteur de mouvement. Ces outils ne sont pas à reconstruire.

| Lot | Priorité | Amélioration possible |
| --- | --- | --- |
| A0 | Livré et essayé | Export réel, identifiants et correspondance vérifiés ; Santé raccordée ; errata et référence de Panique corrigés. Essai de David validé le 20/10 |
| A1 | Livré et essayé | Verdict, effets, contagion, Stress après dégâts et bilan de traumatisme vérifiés ; durées et conséquences narratives validées par Maman. Essai de David validé le 20/10 |
| A2 | Livré et essayé | Bonus/Dégâts/Portée reliés ; modificateurs signés et aide (max. 3), bonus conservés au-delà de dix dés ; opposition, défenseur sans forçage et budget des actions d'éclat conservés. Essai de David validé le 21/10 |
| A3 | Livré et essayé | Tir automatique et cibles secondaires, chargeurs/rechargement, protection avant dégâts, vrais D66 humains, Brisé, échéances de Trépas et soins séparés. Temps de jeu et résultats médicaux confirmés par Maman ; PNJ humain déclaré explicitement. Contrôlé et essai de David validé le 21/10 |
| A4 | Livré et essayé | Aucun Stress/Panique/forçage ; D6 synthétiques persistants, avaries et activité, réactivation puis réparation Comtech, immunités et trauma conservé. 1 439 tests et recette Electron/Hub réussis le 21/10 ; essai de David validé le 21/10 |
| A5 | Livré et essayé | Tests de Réserve sans Panique, stocks individuels/collectifs, échéances et reçus ; états HTML et restrictions, Rads permanents et surplus, charge sur masses confirmées. 1 460 tests et recette Electron/combat/Hub réussis le 21/10 ; huit captures relues ; essai de David validé le 21/10 |
| A6 | Livré et essayé | Actions lentes/rapides, réactions et surveillance ; cartes selon la Vitesse avec une seule Santé ; attaques, critiques D6 et acide XX121. Contrôlé le 22/10 ; arbitrage narratif par Maman |
| A7 | Livré et essayé | Objectifs remis en privé par acte, Récit Cinéma, bilan PX conservé, achats et apprentissage uniques, Camarade/Rival et fétiche par période. Contrôlé le 22/10 |
| A8 | Livré, essai attendu | Détecteur raccordé en option au plan privé, déplacements par Tour, mouvements à portée et batterie M314 ; dossiers d'acte et remise privée dans MU/TH/UR. Contrôlé le 22/10 ; combat spatial séparé |

**Suite :** essai A8 de David ; combat spatial sur demande distincte.
**Cas témoin :** des six suivis d'une Panique effective de 10 annulent l'action ; un Point
de Récit ne doit pas contourner cette conséquence. L'export réel a été vérifié le 20/10.

## Blade Runner

**Référence :** [manuel actuel](../User%20Guides/54-Jeu-Blade-Runner.md), notamment
« Ce qui reste à la main ». Cette synthèse reprend les limites documentées ; elle ne
remplace pas un nouvel audit du livre et de l'export installé.

**Déjà disponible :** dés échelonnés, forçage avec sélection d'un dé à une seule réussite
sur la fiche, coûts en Santé/Sang-froid, Brisé et effets critiques, stress subi, protection,
champs d'Humanité et raccord de la santé à la fiche HTML.

| Priorité | Amélioration possible | Portée |
| --- | --- | --- |
| P1 | Offrir au pupitre le même choix de relancer un D10/D12 à une seule réussite que sur la fiche | Interface et conservation des choix de dés ; le mécanisme de forçage existe déjà |
| P1 | Suivre sauvegardes contre la mort et stabilisation après blessure critique | Procédure de santé à sourcer et raccorder aux critiques existants |
| P2 | Gérer durées de guérison, échéances et rappels | Suivi des blessures en temps de jeu, sans nouveau tirage à chaque ouverture |
| P0 avant extension | Auditer l'export réel, les exceptions humain/réplicant et les passages du livre | Définir les règles exactes et le périmètre avant d'ajouter des automatismes |

**Cas témoin :** le choix de dés fait au pupitre conserve les mêmes réussites et paie le
même coût que le panneau de fiche. Ne pas annoncer comme absents les critiques ou la protection.

## Crimes

**Références :** [audit détaillé](2026-10-19-crimes-propositions.md) et
[registre C0–C8](2026-10-19-registre-ameliorations-crimes.md), source des états.
L'audit porte sur *Crimes 2 — Manuel de l'Enquêteur* et l'export corrigé.

**Déjà disponible :** fiche HTML `crimes-fr` intégrée et raccordée, 12 sections et 203 champs,
compétences, spécialisations, styles, contacts et jauges. Le thème et l'identité existent.

| Lot | Priorité | Amélioration possible |
| --- | --- | --- |
| C0 | P0 | Relire le corpus : bilans des jets, santé, points d'enquête ; retirer les traces de réponses d'outils |
| C1 | P0 | Implémenter « Potentiel GARDE Compétence » : dés lancés/conservés, 1 obligatoires, spécialisations et quatre bilans |
| C2 | P1 | Séparer potentiels de base et actuels ; fatigue, épuisement, blessures, soins et récupérations |
| C3 | P1 | Proposer le dépassement sur les réussites supplémentaires obtenues, avec coût en fatigue et suivi par scène |
| C4 | P1 | Relier Angoisse, Névrose, Psychose et Innocence aux seuils, tests et conséquences |
| C5 | P1 | Dossier d'enquête par affaire : cinq styles, scènes, indices, témoins, preuves et visibilité des informations |
| C6 | P2 | Initiative, oppositions, portées, protection, munitions, incidents et blessures |
| C7 | P2 | Contacts : influence/loyauté et services ; fortune : niveau/piste ; valeurs de base/actuelles |
| C8 | P2 | Création et progression : budgets, âge, rangs, spécialisations, seuils et dépenses |

**Ordre conseillé :** C0 → C1 → C2/C3 → C4/C5 → C6–C8.
**Cas témoin :** `[1,3,4,6,8]`, compétence 2, seuil 8 : garder `[1,8]` donne une réussite
mitigée. L'ajout de champs dans le JSON ne remplace pas cette mécanique de conservation.

## Cthulhu Hack

**Référence :** [manuel actuel](../User%20Guides/54-Jeu-Cthulhu-Hack.md),
« Ce qui reste à la main ». Audit primaire complet à préparer avant automatisation des limites.

**Déjà disponible :** Sauvegardes au d20, avantage/désavantage, Fortune après un jet raté,
dés d'usure, Folie/Choc, Hors Jeu avec table des Conséquences et récupération, PV raccordés
à la fiche. Le Hors Jeu standard n'est donc pas un nouveau chantier.

| Priorité | Amélioration possible |
| --- | --- |
| P1 | Proposer l'application aux caractéristiques des Sauvegardes perdues par un Hors Jeu, avec aperçu des pertes permanentes |
| P1 | Raccorder la diminution de protection à l'usure de l'armure |
| P2 | Assister la défausse des jetons de Fortune par le meneur et ses effets |
| P2 | Suivre les durées des Chocs et Folies selon l'unité prévue : Moments, minutes ou heures |
| P3 | Ajouter un profil explicite pour la variante Pulp du Hors Jeu, séparé du fonctionnement standard |

**Cas témoin :** une conséquence permanente n'est appliquée qu'une fois à la fiche ;
relever puis refaire tomber un personnage ne doit pas rejouer les pertes de son ancien tirage.
Les variantes et barèmes restent à vérifier dans l'édition utilisée.

## Dune

**Référence :** [projet futur D0–D8](2026-10-19-dune-propositions.md).
**Statut conservé : garé**, sur demande de David du 19/10 ; aucune reprise engagée ici.
Registre général : § 143 et ligne 79 de la vue d'un coup d'œil.
L'audit concerne le pilote de référence du dépôt, le livre français et l'errata officiel,
pas un export personnalisé récent.

**Déjà disponible :** Compétence + Principe, 2–5d20, réserves Impulsion/Menace,
dés achetés, alternance des camps et tâche de défaite. Dune n'a pas à recevoir des PV génériques.

| Lot | Priorité | Amélioration possible lors d'une reprise |
| --- | --- | --- |
| D0 | P0 | Corpus et exemples corrigés contre le livre et l'errata ; vérifier l'export actuel |
| D1 | P0 | Déclarer les spécialisations dans le pilote et la fiche ; utiliser la double réussite étendue déjà supportée par le moteur |
| D2 | P0 | Choisir Impulsion/Menace ou un mélange pour payer ; dépenser l'Impulsion produite par le jet avant de plafonner le reliquat conservé |
| D3 | P1 | Détermination, invocation/remise en cause des Principes, maximes et relances sélectives |
| D4 | P0 | Rétention d'initiative payée par le bon camp, possibilité de rejouer soi-même, interdiction après attaque ratée |
| D5 | P1 | Attaque reliée aux atouts et à la tâche de défaite, types de cibles, survie à la défaite et récupération |
| D6 | P1 | Assistance, oppositions, complications variables et réussite mitigée autorisée par le MJ |
| D7 | P3 | Atouts structurés et plateau de zones pour duel, escarmouche, espionnage, guerre et intrigue |
| D8 | P2 | Fiche de Maison, Menace initiale selon le contexte, progression et amélioration des atouts |

**Ordre conservé pour une reprise :** D0/D1 et paiements D2/D4 → D3/D6 → D5 → D8/D7.
**Cas témoins :** un 5 sous Combat 6 spécialisé vaut deux réussites ; payer une action
d'un PNJ ennemi débite sa Menace ; une réserve pleine ne détruit pas l'Impulsion immédiatement
utilisable du test. Le plateau de zones peut attendre les corrections du jet.

## Nephilim Légende

**Références :** [chantier, § 15 et suite](2026-10-17-chantier-nephilim.md) et
[manuel actuel](../User%20Guides/54-Jeu-Nephilim.md).
Les propositions N1–N9 ajoutées à l'ancien document RdD ne décrivent plus à elles seules
l'état actuel : une grande partie a été réalisée depuis.

**Déjà disponible :** Arts occultes au jet, Stase et Effet Mnémos de bonus, suites proposées
des critiques, Ka dominant sur les deux fiches et plafond de Stase, Alchimie avec consommation
des Materiae Primae au lancer, recharge des MP, 31 époques et 155 Vécus, suggestions sur tablette.
Les captures correspondantes existent.

| Priorité | Amélioration encore possible |
| --- | --- |
| P1 | Proposer les malus des Conséquences au jet et les alertes aux seuils des Chutes |
| P1 | Assister le pacte de Kabbale en opposition, avec comparaison des résultats et suites choisies |
| P2 | Recharge contextualisée de Stase selon le livre/errata, avec temps écoulé et trace |
| P2 | Autres usages de Sapience : priorité, Effet Mnémos en tant que Vécu, Sacrifice et effets permanents |
| P2 | Second élément de l'Œuvre au blanc, assemblage et activation des constructs |
| Essai | Vérifier sur tablette physique les suggestions et, en séance, la consommation automatique des MP |

**Décisions à préserver :** les suites de critiques passent par un bouton ; l'option finale
pour les MP est le débit **au lancer**, qui a remplacé le premier choix manuel. La Traque
monte immédiatement au Seuil RK selon le choix de David, même si l'errata situe l'effet à l'aube.
**Prochaine étape proposée :** Conséquences/Chutes, puis pacte ou Stase selon les personnages joués.
Ne pas rouvrir ces choix en recopiant les premiers paragraphes historiques du chantier.

## NOC

**Référence :** [améliorations revérifiées le 19/10](2026-10-19-ameliorations-noc.md).
Les numéros ci-dessous sont ceux de cette note ; tous ne demandent pas une automatisation.

**Déjà disponible :** jet de Destin, Fiel/Menace, jauges de péril et malus, réserves des Héros,
Cabale, moment de calme, effets du Fiel et recharge de nouveau scénario.

| Point | Priorité | Amélioration possible |
| --- | --- | --- |
| 1 | P1 | Proposer la Séquelle lorsqu'une jauge de péril atteint 8 ; le plancher de récupération existe mais pas son incrément |
| 2 | P1 | Choisir le Héros désigné par la Loi et lui attribuer la Singularité restante d'un Rouage hostile quand le Fiel est vide |
| 3 | P2 | Aider à répartir la récupération amputée par le Soupçon, actuellement annoncée dans l'aperçu |
| 4–6 | P2 | Modéliser, si souhaité, Aura de lumière, partage de l'Extase et alliés de la Loi épargnés par certains effets |
| 7 | P2 | Ajouter le suivi de Faveur de la Cabale lié à l'Atout Réseau |
| 8 | P2 | Convertir les 78 cases des neuf pistes du Héros en hotspots numériques, en conservant les clés |
| 9 | Essai | Éprouver à l'écran la recharge des pistes de Cabale au Nouveau scénario, déjà implémentée |

**Ordre conseillé :** 1/2 → 7/8 ; 3–6 selon le besoin réel de la table. Le choix d'un allié
ou d'une répartition peut rester manuel. Les retouches de fiche passent par le Studio et le
raccord au moteur, sans reconstruire les mécaniques déjà présentes.

## Rêve de Dragon

**Références actuelles :** [bilan R5–R7](2026-10-19-etat-et-reprise-codex-rdd-r5-r6-r7.md),
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

| Priorité | Amélioration encore possible |
| --- | --- |
| P1 | Initiative par arme, caractéristiques/compétence/dé et sept phases du round ; le simple tri actuel ne remplace pas cette procédure |
| P2 | Compléter le bilan de repos pour famine et enchantements non permanents, encore arbitrés à la table |
| P2 | Mieux accompagner entraînement et apprentissage, dont les conditions et durées restent arbitrées ; l'allocation d'XP existe déjà |
| P3 | Étendre le Haut-Rêve : rencontres, jets de maîtrise, sorts, réserves et suites draconiques, actuellement consignés/arbitrés manuellement |
| P3 | Étendre, si utile, les commandes spécifiques R5–R7 aux PNJ/adversaires autonomes ; les panneaux actuels visent les PJ |
| Essai | Juger les chiffres du livret dans la vraie fenêtre GM-OS et sur tablette ; poursuivre les essais de séance des procédures livrées |

**Prochaine étape proposée :** initiative complète, ou suite du Haut-Rêve selon la campagne.
Conserver une seule réserve de rêve/fatigue sur la fiche. La position et le carnet TMR ne
doivent pas devenir une seconde fiche de ressources. Les secrets astrologiques restent filtrés.

## Star Trek Adventures

**Référence :** [manuel du pilote et de LCARS](../User%20Guides/54-Jeu-Star-Trek.md).
La page décrit la **deuxième édition**. Aucun audit mécanique primaire aussi détaillé que
ceux de Dune ou Symbaroum n'a été retrouvé dans les documents de synthèse consultés.

**Déjà disponible :** Attribut + Fonction, 2d20, spécialisations, achats de dés,
Impulsion/Menace ; LCARS intégré au Tablet Hub avec sept consoles, demandes arbitrées,
rapports privés, pièces jointes, alertes et sauvegarde par campagne.

| Priorité | Étape ou amélioration à instruire |
| --- | --- |
| P0 avant extension | Auditer l'export actuel contre les règles de la deuxième édition : santé, réserves, complications et Détermination ; ne pas recopier les règles de Dune par parenté 2d20 |
| P1 | Assister la Menace initiale à partir du nombre de PJ présents ; le manuel indique actuellement un montant fixe à ajuster |
| Essai | Éprouver LCARS sur les appareils physiques : attribution des postes, confidentialité, déconnexion/reconnexion, son et retour de veille |
| P2, à auditer | Examiner les raccords mécaniques des commandes de consoles, de la santé et des ressources, en distinguant mise en scène et résolution de règles |
| P3, à cadrer | Déterminer si un suivi de vaisseau/équipage et des conflits spatiaux est souhaité, puis établir son périmètre avec le livre |

Ces deux dernières lignes sont **des pistes d'audit**, pas des fonctions déclarées absentes
ou des règles déjà validées. Les consoles LCARS et leurs échanges ne sont pas à recréer.
**Prochaine étape :** audit du pilote de jeu et essais matériels, avant d'étendre LCARS.

## Symbaroum

**Référence :** [audit S0–S9 du 20/10](2026-10-20-symbaroum-propositions.md), contre le
livre de base, avec NotebookLM limité à ce livre et vérifications déterministes du moteur.

**Déjà disponible :** fiche HTML `symbaroum-fr`, 182 zones et 158 clés, intégrée et raccordée ;
pilote corrigé à 10 sections et 139 champs, huit Attributs, talents, armes, protections,
artéfacts et compagnons. La fiche passe son validateur sans erreur ni avertissement.
Registre général : § 145 et ligne 81.

**Livré (registre § 145) :** le jet **additionnait les huit Attributs** — une seule composante
désormais — et la santé de départ lit l'Endurance (`712f70c1`). En écrivant la page du manuel
(`54-Jeu-Symbaroum.md`, `34404411`), **chaque test réussissait, un 20 compris** : la Forge avait
rangé le modificateur du livre dans `jet.difficulte`, qui compte des réussites. Réglage retiré
du pilote, réimporté par David le 21/10 ; le modificateur se compte depuis à la main.

**S1 préparé, pas commencé (21/10) :** `DescripteurDeJet.modificateurDuSeuil` (−5 à +5) ajouté au
seuil d'un jet sous le seuil et expliqué ; curseur « Modificateur » du panneau, pour la fiche et la
tablette ; consigne et contrôle de la Forge ; script de raccord du pilote ; essais, guide 53 et
page Symbaroum. **À trancher par David :** ce curseur seul, ou l'opposition explicite de l'audit
(`12 + (10 − 13) = 9`). Avant de coder : « GM-OS tourne-t-il ? ».

| Lot | Priorité | Amélioration possible |
| --- | --- | --- |
| S0 | P0 | Corriger le corpus : choix du joueur après douleur, tests de mort qui continuent, cécité, asymétrie et gain permanent de Corruption |
| S1 | P0 | Appliquer opposition et modificateurs au seuil du d20, avec explication du calcul |
| S2 | P0 puis P1 | Déclarer l'Endurance courante comme santé principale ; initialiser les nouvelles fiches ; calculer les dérivées et accompagner l'agonie |
| S3 | P0 | Distinguer Avantage tactique (+2 et +1D4 dégâts) des deux lancers utilisés par d'autres effets |
| S4 | P1 | Total de Corruption, seuils, stigmates, gain permanent et fin de scène, avec gestion des événements déjà traités |
| S5 | P1 | Parcours attaque/défense du joueur ; dégâts/protection fixes des PNJ ; dégâts nets, douleur et effets particuliers |
| S6 | P1 | Initiative départagée par Vigilance puis d20, choix de retard et rappels d'actions/réactions |
| S7 | P2 | Création, budgets d'Attributs, effets des Talents et progression sur l'Expérience disponible |
| S8 | P2 | Profils explicites de critiques, confirmation, Mort subite et relances optionnelles |
| S9 | P2 | Unifier bourse et jauge monétaire, assister les voyages, ajouter le manuel du jeu et ses captures |

**Ordre conseillé :** S0/S1/S2-raccord → S3/S4/S5 → agonies et tours → progression/options.
**Cas témoin reproduit :** Précision 12, opposition 13, dé 10 : le code annonce aujourd'hui
une réussite sous 12, alors que le seuil modifié devrait être 9. La simple validité du JSON
et de la fiche ne détecte pas cette erreur.

## Torg Eternity

**Référence :** [manuel actuel](../User%20Guides/54-Jeu-Torg.md).
Le pilote a beaucoup évolué depuis les premières propositions du 13/10 : se référer aux
fonctions livrées, pas à leurs anciennes listes de manques.

**Déjà disponible :** dé explosif/Table des Bonus, Possibilités, relances favorisées,
annulation des dommages, Blessures/Choc, Paquet d'Action, Cartes du Destin et de Cosm,
plusieurs Lois du Monde, sbires, hordes, attaques combinées et cibles multiples.

| Priorité | Amélioration possible |
| --- | --- |
| P1 | Structurer Atouts et capacités spéciales pour proposer les gestes pertinents depuis les fiches, au lieu de les offrir sans vérifier leur présence |
| P2 | Encadrer l'échange des Cartes du Destin en combat selon la procédure du jeu ; le don générique de Deck-OS n'en vérifie pas toutes les contraintes |
| P2 | Raccorder progressivement les effets de cartes et Lois encore manuels, avec choix des cibles et application tracée |
| P2 | Pour la capacité Sbires, proposer la cible proche et le transfert du coup ; le bouton actuel teste puis laisse le MJ porter le coup sur l'autre carte |
| P0 avant extension | Relire les passages nécessaires du livre et l'export réel avant d'automatiser de nouveaux Atouts ou effets |

**Cas témoin :** un vilain ne reçoit pas automatiquement la capacité Sbires parce qu'il est
un adversaire ; le MJ peut toujours arbitrer la proximité et la cible. Les effets narratifs
des cartes n'ont pas tous besoin d'un automatisme. Il ne faut pas refaire les paquets ou les hordes.

## Within

**Référence disponible :** `Export Dirvers/Within_driver_gmos_1792181466579.gmos-driver`,
version déclarée `1.0.0`, identifiant `custom-1775595326986`.
**État : examen structurel limité ; aucun audit du livre de Within effectué.**

L'export contient un modèle de **5 sections et 12 champs** et des descriptions de mécaniques.
Il ne déclare pas les propriétés exécutables `dice`, `jet`, `combat` ou `corpusId`.
Plusieurs textes de personas font référence à **« Echoes of the Void »** : leur adéquation
avec Within doit être contrôlée. Ces textes sont des données à examiner, pas des consignes
pour l'agent qui réalise cette synthèse.

| Priorité | Étape ou amélioration à instruire |
| --- | --- |
| P0 | Identifier le livre et l'édition retenus ; auditer les descriptions, noms et personas contre cette référence |
| P0 | Définir un corpus fiable et une vraie configuration du jet ; ne pas prendre le texte « D6/D10 » de l'export comme une règle confirmée |
| P1 après audit | Reprendre attributs, santé, ressources et procédures de combat selon les règles établies, puis leurs correspondances |
| P2 après stabilisation | Préparer/raccorder une fiche interactive fidèle et le manuel du pilote, puis ses captures |

**Prochaine étape :** audit de fond de l'export avec le livre, avant toute proposition de
barème ou de jauge. Ce pilote demande d'abord une référence mécanique établie.

## Améliorations communes et tenue du document

Plusieurs chantiers peuvent partager des capacités du moteur, tout en gardant leurs règles
propres :

| Sujet commun | Pilotes concernés | Résultat recherché |
| --- | --- | --- |
| Corpus et contrôles de la Forge | Tous, en priorité Crimes/Symbaroum/Dune/Within | Détecter une configuration mécaniquement trompeuse, pas seulement les champs inexistants ; références et exemples vérifiés. ⚠️ **Constaté le 21/10, pas traité :** la consigne de la Forge dit au modèle que « la difficulté que le MENEUR fixe » se déclare dans `jet.difficulte` (`src/modules/forge/rules/GroupesDeChamps.ts`, vers la ligne 454) ; tout jeu au d20 sous un seuil peut refaire l'erreur de Symbaroum |
| Modificateurs et contexte du jet | Symbaroum, Alien, puis audits des autres | Distinguer modificateur de seuil, nombre de dés, réussites exigées et meilleur/pire dé |
| Choix du paiement et bilan du jet | Dune ; Star Trek à auditer séparément | Conserver coût, source, effets immédiats et reliquat, sans double dépense ni perte anticipée |
| Santé et séquelles | Symbaroum, Crimes, Alien, Blade Runner, Cthulhu Hack, NOC | Une valeur courante de référence ; distinguer temporaire/permanent, soins et états propres au jeu |
| Événements de scène, séance et temps de jeu | Corruption, Stress, soins, progression, voyages | Des déclencheurs nommés ; une reconnexion ne rejoue pas une dépense, un soin ou un franchissement |
| Fiches, tablettes et journal | Tous | Même calcul et mêmes ressources ; clés stables, secrets filtrés et modifications historisées |
| **Onglet « Lancer un test »** — livré le 22/10 (`6f709c79`, registre § 147) | Tous | Le test a son onglet sur la fiche du meneur (Formulaire / Lancer un test / Fiche du jeu) et sur la tablette (Vue synthétique / Lancer un test / Ma fiche / groupe), d'après les maquettes Stitch retenues : étapes Composer, Préparer, Lancer les dés, Résultat ; dés nommés ; blocs propres au jeu en cartes repliables (Alien : dernier test, blessures, Stress et Panique ; RdD : mécaniques du Voyageur). Aucun pilote modifié. Captures du manuel refaites pour les dix jeux. **Essai de David attendu** |
| Documentation et recette | Tous | Page 53, page 54 du jeu et captures conformes aux fonctions réellement livrées |

**Pour choisir une prochaine intervention :** les anomalies de résultat déjà reproduites de
Crimes et Symbaroum constituent des corrections P0 concrètes. Les premiers points NOC sont
plus petits. Dune reste garé. Les pistes Star Trek et Within demandent d'abord leur audit.
Ce repérage n'impose pas un ordre entre les campagnes de David.

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
