# Symbaroum — audit du pilote et améliorations proposées

Audit de Codex, **20 octobre 2026**, à la demande de David : « vérifier les améliorations
possible sur le drivers Symbaroum », en consultant le livre de base et NotebookLM.

**Trois corrections passent avant l'ajout de fonctions : appliquer les modificateurs au
seuil du d20, relier l'Endurance courante au combat et distinguer l'Avantage tactique des
deux lancers.** Le corpus doit aussi être relu : plusieurs formulations contredisent le livre.

Ce document contient des propositions, sans modification du pilote, du corpus, de la fiche
ou du moteur. Les priorités sont celles proposées par l'audit ; David n'a pas encore choisi
de lot de développement.

## Périmètre et preuves

- Dépôt examiné à `712f70c1` : Claude Code a déjà intégré le corpus, la fiche HTML
  `symbaroum-fr` et sa correspondance au moteur embarqué v14. Cette intégration est acquise.
- Export examiné : `Export Dirvers/corriges/Symbaroum_driver_gmos_relie.gmos-driver`.
  Son `state.json` est identique à `Export Dirvers/corriges/symbaroum_state.json`.
  Identifiant : `custom-1792493594094`, corpus : `symbaroum`, version déclarée : `1.0.0`.
  L'audit porte sur cet export et le code du dépôt, sans lecture d'une campagne installée.
- Livre fourni par David :
  `\\CLOUDDAVID\Media\Jeux de Rôle\01. Passé\2. Dark Fantasy\Symbaroum\Symbaroum - Livre de Base.pdf`.
  Le lecteur `Z:` était inaccessible ; le chemin UNC alternatif fonctionne. Copie de lecture :
  `scratch/symbaroum-audit/livre-de-base.pdf`, 272 pages PDF. Les références ci-dessous
  désignent les **pages imprimées** : ajouter **2** pour retrouver les pages PDF étudiées.
- Le texte a été extrait avec PDF.js. Les pages imprimées **103, 164, 165, 166, 179, 180,
  184 et 190** ont également été rendues et vérifiées visuellement.
- [Carnet NotebookLM Symbaroum](https://notebooklm.google.com/notebook/5a4f05a6-8bcd-40d2-a77b-90d8c2bb12dd),
  deux consultations limitées à la source du **Livre de Base**
  `3239d73f-c759-4b84-b85c-c9606ec064b6`. Les guides du joueur, du meneur et le Codex des
  Monstres présents dans le carnet ont été exclus. Réponses conservées dans
  `scratch/symbaroum-audit/notebook-regles.json` et `notebook-mecaniques.json`.
  Le PDF fait autorité : NotebookLM répète notamment l'erreur sur le choix après un coup
  douloureux et affirme un non-cumul de l'Avantage sans passage explicite retrouvé p. 166.
- Vérifications reproductibles : `scratch/symbaroum-audit/verifier.mjs` et `constats.json`.
  Elles appellent des fonctions pures du code actuel avec des dés déterministes et une
  fiche fictive. Elles ne constituent pas une validation de l'interface en séance.

## Acquis à conserver

Le pilote corrigé comporte **10 sections et 139 champs**, dont huit Attributs primaires,
les valeurs secondaires, deux corruptions, douze lignes de capacités, quatre armes,
deux protections, quatre artéfacts, les compagnons et l'histoire.

La fiche interactive comprend **2 pages, 182 zones et 158 clés stables**. La correspondance
couvre 157 clés ; le portrait est explicitement absent du raccord, GM-OS ayant son propre
portrait. `npm.cmd run fiche:valider -- symbaroum` est **accepté, 0 erreur, 0 avertissement**.
Il faut préserver ses clés et son apparence lors des améliorations mécaniques.

Le contrôle structurel `controlerLePilote` ne retourne **aucun constat** pour cet export.
Cela confirme les références du pilote, sans garantir la justesse des règles. Les erreurs
de seuil et l'absence de santé principale passent aujourd'hui ce contrôle.

Le jet utilise déjà **un seul Attribut choisi**, un d20 et le sens **inférieur ou égal**.
La santé de départ référence déjà `endurance`, ce qui évite de prendre directement Force
quand elle est inférieure à dix. Ces deux corrections du raccord ne sont pas à refaire.

## S0 — Corriger et sourcer le corpus (priorité 0)

Les **13 fichiers** de `docs/systems/symbaroum/rules/`, inventaire compris, sont marqués
`relu: false`. La relecture ciblée a identifié les points suivants :

| Sujet | Écart actuel | Référence et correction à préparer |
| --- | --- | --- |
| Résistance à la douleur | Le corpus donne le choix à l'attaquant | **Toujours le joueur** choisit entre chute et Attaque gratuite, même quand son PJ reçoit le coup ; p. 164. Corriger aussi l'inventaire |
| Test de mort, 2–10 | « État stable », puis « le stabilise » | Le PJ reste mourant et **continue les tests chaque tour** jusqu'aux soins ou au résultat terminal ; p. 164 |
| Bornes d'Endurance | « Minimum 10, maximum égal à la Force » | Le **maximum de base** vaut `max(10, Force)` ; l'Endurance courante peut descendre à zéro ; p. 103, 164 |
| Jets de dégâts/protection | Attaquant et défenseur lanceraient chacun leurs dés | PJ : dégâts/protection lancés ; PNJ : effets fixes. L'asymétrie doit apparaître dans les fiches santé et dégâts, pas seulement dans l'inventaire ; p. 177–178 |
| Combat à l'aveugle | L'adversaire voyant « agit normalement » | PJ seul affecté : deux lancers, pire résultat ; ennemi seul affecté : **le joueur** lance deux fois, meilleur résultat ; les deux affectés : pas d'ajustement ; p. 165 |
| Corruption | Gain au seuil omis | Atteindre le seuil pendant une scène fait gagner **1D4 de Corruption permanente**, avec conséquences éventuelles sur les seuils ; p. 180 |
| Conflits entre PJ | Jet opposé automatique attribué à cette section | Le passage recommande une discussion avec les joueurs et, pour le combat, un récit sans dés ni risque de mort des PJ ; p. 180. Une autre procédure relève d'un choix de table |
| Nouvelle attaque sur un mourant | Échec de mort automatique supplémentaire | Pas retrouvé dans la section citée p. 164. Retirer cette attribution au livre tant qu'une source précise n'est pas fournie |

Autres points à relire avant automatisation : le non-cumul de plusieurs causes d'Avantage
n'est pas formulé explicitement dans le passage p. 166 ; les dégâts critiques optionnels
p. 183 parlent de dégâts qui **dépassent** la Résistance à la douleur, alors que le corpus
dit « égaux ou supérieurs ». La douleur ordinaire et la Mort subite utilisent bien un seuil
atteint ou dépassé. Ne pas fusionner ces trois règles.

La relecture doit aussi distinguer les rangs des Talents et des Traits, les capacités qui
n'ont pas trois rangs et les exceptions des traditions mystiques. Ajouter les pages aux
fiches, sans déduire une règle générale d'un seul pouvoir.

**Acceptation :** les écarts confirmés sont corrigés, les affirmations sans passage identifié
sont retirées ou signalées comme arbitrages, et seuls les fichiers réellement vérifiés
passent à `relu: true`.

## S1 — Appliquer réellement les modificateurs et l'opposition (priorité 0)

Le livre p. 103 demande `d20 ≤ Attribut + modificateurs`. Contre un adversaire, le
modificateur vaut **10 − Attribut adverse**. Un obstacle fournit son modificateur propre.

Le pilote place `−5…+5` dans `jet.difficulte`. Or `preparerLeJet` traite ce champ comme un
**nombre de réussites exigées**, sans changer le seuil. Pour un seul dé, le panneau affiche
le verdict du moteur ; cette difficulté n'a donc pas l'effet attendu.

**Contre-exemple reproduit :** Précision 12, opposition 13 donc malus −3, dé 10.
Le préparateur donne `seuil: 12`, `reussitesRequises: -3`, et le moteur annonce
`10 / 12`, réussite. Le livre attend `10 / 9`, **échec**.

Prévoir une composante de modificateur signée et une opposition explicite, avec le calcul
lisible : `12 + (10 − 13) = 9`. Conserver le choix de l'Attribut afin de respecter les
substitutions des Talents. Une mécanique de cible dédiée est une piste ; un changement de
nom dans le JSON ne suffit pas, les mécaniques disponibles étant aujourd'hui Rêve de Dragon
et Nephilim. La plage usuelle −5…+5 ne doit pas écraser les bonus de Talents et de situation.

**Acceptation :** l'exemple ci-dessus échoue ; un dé égal au seuil réussit ; un modificateur
positif augmente les chances ; l'opposition ne provoque pas un second jet de PNJ. Vérifier
fiche, pupitre, tablette et journal sur le même calcul.

**Livré le 22/10/2026 (Claude Code, registre général § 149)**, en opposition explicite, choix de
David : `jet.modificateurDuSeuil` ; l'exemple échoue (`10 / 9`). Le pupitre, sans fiche, garde sa
case de caractéristique où le seuil se saisit calculé. Réimport du pilote corrigé et essai de
David attendus.

## S2 — Raccorder l'Endurance et accompagner l'agonie (priorité 0)

`combat.statsToTrack` ne désigne **aucun `isMainHP: true`**. Malgré les champs
`endurance` et `endurance_actuelle`, `champDeSantePrincipale` et
`santePrincipaleDeLaFiche` renvoient `null` : le raccord générique entre santé de combat et
valeur courante de la fiche manque.

Avec la fiche fictive `{ endurance: 14, endurance_actuelle: 5 }`, une déclaration en mémoire
du champ principal `endurance_actuelle`, maximum `endurance`, suffit à faire lire **5/14**
au helper existant. Cette première correction relève du **pilote**, pas d'un nouveau modèle
de santé. Elle n'a pas été écrite dans l'export.

Le défaut initial de `endurance_actuelle` vaut toutefois **0**. Il faut initialiser au maximum
les **nouvelles** fiches complètes sans remettre à neuf les personnages existants blessés.
Les valeurs secondaires sont aussi de simples nombres manuels : proposer les calculs de
base p. 103 avec ajustements explicites pour les Talents et l'armure :

- Maximum d'Endurance : `max(10, Force)`.
- Résistance à la douleur : `ceil(Force / 2)`, même avec Force inférieure à dix.
- Défense : Agilité − encombrement, puis exceptions pertinentes.
- Seuil de Corruption : `ceil(Volonté / 2)`.

Le calculateur de fiche sait déjà lire `max` et `ceil`
(`session/logic/CalculationEngine.ts`). Le lecteur de `santeDeDepart` n'accepte que
l'arithmétique : conserver sa référence au champ `endurance` plutôt que lui passer ces
fonctions. Vérifier que les valeurs calculées circulent aussi dans le raccord HTML et le
combat ; changer seulement l'affichage d'un champ ne prouve pas cette circulation.

Pour la suite, ajouter une procédure d'agonie **propre à Symbaroum** : PJ mourant à zéro,
tests aux tours suivants, compteur des résultats 11–19, réveil sur 1 avec 1D4 d'Endurance,
action possible au tour suivant, mort sur 20, interruption par les soins adaptés ; p. 164–165.
Les PNJ tombent à zéro selon la règle, avec latitude laissée au MJ. Le choix lié à la douleur
porte sur les dégâts nets d'un seul coup et revient au joueur.

**Raccord livré le 22/10/2026 (Claude Code, registre général § 150)** : `endurance_actuelle` est la
santé principale, plafonnée par `endurance` ; une fiche neuve naît à son Endurance maximale. Dérivées
calculées et agonie : pas commencées.

**Acceptation :** 5/14 est identique sur fiche et combat ; Force 7 donne maximum 10 et douleur
4 ; un 2–10 ne supprime pas les prochains tests ; trois résultats 11–19 déclenchent la mort.
L'agonie complète nécessite une évolution du moteur, au-delà du simple raccord de jauge.

## S3 — Distinguer Avantage tactique et deux lancers (priorité 0)

Le sélecteur générique « Avantage » est proposé pour ce d20 ; il appelle
`DiceEngine.rollAdvantage`, donc **deux dés, meilleur résultat**. Dans Symbaroum,
l'**Avantage tactique** donne **+2 à l'Attribut et +1D4 de dégâts** ; p. 166.

Prévoir un réglage de l'Avantage tactique qui agit sur le seuil et les dégâts, séparé du
« lancer deux fois » utilisé pour la cécité, certains Talents et l'option des dégâts critiques.
Pour un ennemi bénéficiant d'effets, traduire la situation dans le jet du joueur et les
valeurs fixes du PNJ. Les deux mécanismes peuvent interagir : l'un ne doit pas remplacer
l'autre.

**Acceptation :** Précision 12 avec Avantage tactique devient 14 et ajoute 1D4 aux dégâts,
sans deuxième d20. Une cible à terre donne cet Avantage en mêlée, pas au tir ; p. 166.
La cécité suit les trois cas p. 165. Le cumul de plusieurs causes doit être documenté comme
convention si aucun passage explicite n'est apporté.

## S4 — Donner un suivi complet à la Corruption (priorité 1)

Les champs temporaire et permanent existent, mais le pilote n'exprime ni total, ni
franchissements, ni stigmates, ni fin de scène. Prévoir, p. 179–180 :

- Total dérivé = temporaire + permanente ; seuil = `ceil(Volonté / 2)`.
- Alerte au seuil, choix/description du Stigmate, et **1D4 permanent** lors du
  franchissement en scène ; ce gain peut lui-même provoquer l'abomination.
- Stigmate temporaire pendant une journée ; stigmate permanent tant que la permanente
  n'est pas ramenée sous le seuil par les moyens prévus.
- Remise à zéro de la **seule temporaire** en fin de scène. Un geste explicite de jauge
  est déjà représentable par `statsToTrack[].gestes` ; un déclenchement automatique exige
  un événement de fin de scène fiable, sans l'assimiler à une simple fin de combat.
- Coûts contextualisés des pouvoirs, rituels et artéfacts. Les traditions créent des
  exceptions : ne pas facturer indistinctement 1D4 et un permanent à toute magie.
- Alerte à `total ≥ Volonté`, sans supprimer ou transférer silencieusement la fiche.

**Ambiguïté du texte à consigner :** la prose p. 179–180 emploie aussi « surpasse » et
« double du seuil », tandis que le tableau 25 et deux passages p. 180 disent **Volonté
atteinte ou dépassée**. Prendre ce dernier critère comme référence proposée et expliciter
ce choix. Avec Volonté 11, le seuil vaut 6 et l'abomination survient à **11**, pas à 12.

Le livre n'explicite pas ici toutes les réentrées possibles dans le seuil au cours d'une
même scène. Documenter cette limite avant automatisation ; ne pas déclencher un nouveau
1D4 à chaque rendu, synchronisation HTML ou restauration d'un état déjà traité.

**Fin de scène livrée le 22/10/2026 (registre général § 150)** : le geste « Fin de scène » remet la
seule temporaire à 0, après aperçu. Le reste de S4 (total, Stigmate, 1D4 au seuil, abomination)
n'est pas commencé ; `franchissements` donne le « une seule fois par événement » demandé ici.

**Acceptation :** Volonté impaire correctement traitée, permanente conservée en fin de scène,
gain au seuil tracé une seule fois pour un événement donné, transformation signalée avec
sa source. « Jouer une abomination » reste une option nécessitant l'accord du groupe ; p. 184.

## S5 — Résoudre les échanges de combat dans le sens du joueur (priorité 1)

Les armes, dégâts et protections sont présents sous forme de textes. Les types de dégâts
sont énumérés, sans procédure spécialisée pour Symbaroum. Prévoir les deux parcours
p. 163–164 et 177–178 :

| Situation | Test du joueur | Dégâts et protection |
| --- | --- | --- |
| PJ attaque un PNJ | Attribut d'attaque modifié par la Défense adverse | Dégâts lancés par le PJ − protection fixe du PNJ |
| PNJ attaque un PJ | Défense modifiée par l'Attribut d'attaque adverse | Dégâts fixes du PNJ − protection lancée par le PJ |

Le descripteur ne propose que les huit Attributs primaires. Le chemin de demande de jet
de fiche (`jetDepuisLaFiche.ts`) exclut donc actuellement `defense`, située parmi les valeurs
secondaires : une demande fictive de Défense est rejetée par `null`. Fournir un parcours
de Défense explicite et transporter aussi l'opposition et les modificateurs jusqu'au
résolveur du meneur ; la demande générique actuelle ne les porte pas.

Le livre donne 4 comme valeur fixe correspondant à 1D8 ; ne pas utiliser la moyenne
statistique 4,5 ni relancer pour le PNJ. Privilégier les valeurs du bloc de créature.
Les Talents et qualités modifient ensuite les paramètres. La protection générique existante
pour Blade Runner compte des réussites : elle ne reproduit pas le dé soustrait de Symbaroum.

Déduire la protection avant de vérifier la douleur ; ignorer les dégâts négatifs. Séparer
poison, acide, dégâts alternatifs sur un Attribut et dégâts physiques, avec durée et
résistance appropriées. Une liste de noms dans `damageTypes` ne réalise pas ces traitements.
Relire chaque effet avant de créer une règle générale de cumul ou d'arrêt.

**Acceptation :** un coup sans dégâts nets ne provoque pas de douleur ; plusieurs petits
coups ne s'additionnent pas pour ce seuil ; les dégâts alternatifs ne réduisent pas
automatiquement l'Endurance ; aucun jet de PNJ n'est inventé.

## S6 — Départager l'initiative et rappeler les actions (priorité 1)

Agilité décroissante est déjà configurée. Les tris de `useCombatStore.ts` comparent seulement
`init` ; le pilote ne déclare pas les départages **Vigilance, puis d20 le plus haut** ; p. 161.
Prévoir ces critères et le choix de se placer plus tard lors de l'établissement de l'ordre.
La substitution d'initiative par un Talent doit rester possible.

Rappeler l'Action de combat et l'Action de mouvement, la conversion combat → mouvement,
les réactions et actions gratuites ; p. 162–163. Éviter une limite générique d'une seule
réaction : le jeu permet notamment plusieurs défenses. Prévoir les rappels pour arme Longue
au premier tour, désengagement, élixir sur soi/autrui et action pour se relever ; p. 161, 165.

**Acceptation :** à Agilité égale, Vigilance départage ; la double égalité demande le d20 ;
l'ordre choisi reste stable ; les réactions ne consomment pas abusivement l'action normale.

## S7 — Assister la création, les Talents et la progression (priorité 2)

Les huit Attributs commencent actuellement tous à 5 : une fiche vierge totalise donc **40**,
sans contrôle des **80 points** ou de la répartition proposée. Prévoir un assistant/contrôle
de création : 5–15, un seul 15, somme 80 ; p. 77, 79. Ces contraintes de création ne sont pas
un plafond universel en cours de campagne : **Attribut exceptionnel** peut ajouter +1/+2/+3 ;
p. 116. Les valeurs effectives peuvent aussi être diminuées par des atteintes.

Les capacités disposent déjà de noms, types, rangs et effets manuels. Ajouter progressivement
des effets vérifiés, sans interpréter automatiquement un nom libre. Par exemple,
**Tacticien** remplace Agilité par Astuce pour l'initiative au rang Novice, pour la Défense
au rang Adepte et Précision pour l'attaque au rang Maître, hors arme lourde ; p. 126.
Conserver ajustements manuels et explication de la valeur effective.

Deux champs d'Expérience existent, total et non dépensée ; le suivi de ressource pointe
actuellement sur **le total**. Pour les achats, employer le disponible et conserver
l'historique : **10** pour un nouveau Novice, **20 supplémentaires** pour Adepte,
**30 supplémentaires** pour Maître ; p. 166. La création ordinaire propose cinq Novices ou
deux Novices et un Adepte ; p. 79, avec possibilités de départ expérimenté prévues par le livre.

**Acceptation :** les budgets sont contrôlés en création, sans écraser un PJ existant ;
acheter un Talent débite le disponible ; les rangs sont successifs ; un bonus de Talent
n'est ni perdu au recalcul ni appliqué deux fois.

## S8 — Rendre les options explicites (priorité 2)

Le pilote déclare `critique: 1`, `complication: 20` sans profil d'options. Le d20 est reconnu
automatiquement comme une « sauvegarde » par le moteur générique et affiche des libellés
critiques sur 1 et 20, même pour un simple test. Retirer les deux clés ne suffit donc pas à
supprimer ces libellés. Les effets de combat p. 184 sont **optionnels** :

| Dé | Attaque du PJ | Défense du PJ |
| --- | --- | --- |
| 1 | +1D6 dégâts | Attaque gratuite du PJ |
| 20 | Attaque gratuite de l'ennemi | +3 dégâts de l'ennemi |

Prévoir le choix de table, le contexte attaque/défense et, séparément, la confirmation du
critique. Les relances contre **1 XP** ou **1 Corruption permanente** sont aussi des options,
avec une relance par Action ou par test respectivement. La table détermine les jets admis ;
le livre recommande d'exclure Test de mort et échec critique en Défense ; p. 184.
Mort subite et dégâts critiques p. 183 constituent encore deux options distinctes.

**Acceptation :** aucun effet optionnel ne s'active silencieusement ; les coûts passent par
la ressource correcte ; un même résultat ne déclenche pas plusieurs paiements ; les tests
de mort et accidents de voyage gardent leurs résultats spéciaux propres.

## S9 — Réunir monnaie, voyages et manuel (priorité 2)

La bourse écrite sur la fiche HTML est reliée à `bourse`, tandis que la jauge de richesse
utilise `argent`, nombre de thalers indépendant. Un achat peut donc laisser deux soldes
différents. Choisir un modèle de monnaie unique ou une conversion explicite :
**1 thaler = 10 shillings = 100 ortegs**, p. 190 ; garder le troc et les biens non monétaires.
Ne pas essayer de convertir silencieusement un texte libre déjà rempli.

Un assistant de voyage serait utile pour Davokar : terrain, mode/allure, distance du jour,
guérison naturelle suspendue à allure forcée, perte d'Endurance et test de Force à allure
éreintante ; tableau 26 p. 190. Le résultat 20 y correspond à une blessure mortelle par
accident : cela mérite son propre contexte, pas un échec critique universel. Les cadences
d'exposition à la Corruption p. 180 restent choisies par le MJ selon la zone.

Aucune page `54-Jeu-Symbaroum` ni entrée Symbaroum dans les captures du manuel n'a été
retrouvée lors de l'audit. Après toute amélioration mise en œuvre, documenter le pilote dans
le manuel des jeux, sa ligne dans la page 53 et les captures `e2e/capturesDesJeux.spec.ts`,
conformément à `AGENTS.md`.

## Ordre de réalisation proposé et limites de l'audit

1. **S0 + S1 + S2 (raccord)** : règles fiables, jets modifiés correctement, santé synchronisée.
2. **S3 + S4 + S5** : Avantage juste, Corruption, échanges de combat et douleur.
3. **S2 (agonie) + S6** : tours, initiative et accompagnement des mourants.
4. **S7 + S8 + S9** : progression, options choisies, monnaie, voyages et manuel.

Le raccord de santé et un geste manuel de fin de scène peuvent utiliser des capacités
existantes du pilote. La résolution des modificateurs, l'Avantage propre au jeu, les seuils
de Corruption et l'agonie nécessitent une logique supplémentaire : ne pas présenter un
export JSON enrichi comme une automatisation complète.

Vérifications effectuées : identité du ZIP/JSON, contrôle structurel du pilote, validateur
de fiche, reproductions déterministes de résolution et de lecture de santé, comparaison
avec les passages du livre. Aucune suite globale, compilation ou séance d'interface n'a
été lancée pour cet audit documentaire. Les exemples ne couvrent pas tous les Talents,
rituels, qualités et créatures du livre.

Avant tout développement dans `src/` ou `electron/`, demander à David **« GM-OS tourne-t-il ? »**
et attendre sa réponse. Préserver les clés de fiche, prévoir la migration des valeurs
existantes et les essais aux seuils. Aucun changement Git en écriture ni accès aux données
personnelles n'a été effectué.
