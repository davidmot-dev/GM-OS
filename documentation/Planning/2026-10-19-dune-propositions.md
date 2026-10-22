# Dune — améliorations proposées après lecture du livre et de NotebookLM

> **Statut : projet futur, garé.** Décision de David du **19/10/2026** :
> « sauve-moi cela comme projet futur ». Conserver les propositions D0–D8 pour une reprise
> ultérieure, sur demande explicite de David. Aucune date fixée, aucun développement lancé.
> Référence du registre : **§ 143, ligne 79**.

Analyse de Codex, **19/10/2026**. Demande de David : « quelles sont les améliorations que
l'on peut faire sur le drivers de dune », avec le PDF sur CLOUDDAVID, puis « regarde aussi
sur notebooklm ». **Analyse et propositions uniquement ; aucun développement autorisé ici.**

## Périmètre et sources

- Pilote de référence livré : `src/data/defaultGameDrivers.ts`, constante `DUNE`, version
  `1.0.0`, et fiche `DUNE_TEMPLATE` dans `src/data/defaultSheetTemplates.ts` (18 champs).
  **Aucun export Dune récent trouvé dans `Export Dirvers/`** : l'analyse ne prétend pas décrire
  un pilote personnalisé installé dans les données de David, qui n'ont pas été consultées.
- Livre fourni : `\\CLOUDDAVID\Media\Jeux de Rôle\03. Futur\1. Space Opera\Dune\Dune_Aventures_dans_l'Imperium_BQ.pdf`.
  Copie de travail dans `scratch/dune-livre-audit.pdf` : 344 pages PDF.
  Dans le chapitre de règles, la page PDF correspond à la page imprimée **+7**.
  Pages 152, 157, 165 et 168 imprimées également rendues et relues à l'image.
- [Carnet NotebookLM Dune](https://notebooklm.google.com/notebook/10bc3b64-7d40-4aad-99e6-9da1bf780b46) :
  12 sources. Trois consultations, limitées à la source du **livre français**
  `6fab77c9-4913-4d9a-afc8-c87dd929fe8a`, pour éviter de mélanger SRD 2d20, campagnes et extensions.
  Réponses et citations sauvegardées dans `scratch/dune-audit/notebook-*.json`.
- [Errata français officiel 1.1, 11/08/2022](https://www.arkhane-asylum.fr/medias/2/DUNE-Errata-5100.pdf),
  contrôlé sur le site de l'éditeur. Le carnet a le livre, mais pas de source intitulée errata
  dans sa liste actuelle : ne pas lui faire corriger seul les contradictions du PDF.

## Ce qui existe déjà

Le pilote sait composer Compétence + Principe, lancer 2 à 5d20, compter le 1 pour deux
réussites, signaler le 20, calculer les réussites excédentaires et les créditer à l'Impulsion.
Les dés supplémentaires coûtent 1/2/3 points. Impulsion commune plafonnée à 6, Menace sans
plafond, érosion de fin de scène : les réserves sont déjà là.

L'ordre des camps alterne. La fiche porte Détermination (1 au départ, maximum 3), progression,
traits, talents et atouts. L'horloge de défaite peut lire la compétence défensive sur la fiche.
Il ne faut donc pas proposer de reconstruire ces fondations.

**Nuance :** `progressionDeLAttaque` sait calculer 2 + qualité, mais sa seule utilisation trouvée
hors déclaration est dans son test ; ce n'est pas une résolution complète d'attaque au cockpit.
Le manuel présente le principe général, tandis que l'application laisse encore des gestes au MJ.

## D0 — Fiabiliser la référence, les règles et les exemples

Avant d'étendre le pilote, relire les fiches Dune marquées `relu:false` contre le livre et l'errata.
L'inventaire contient des répétitions et des pages invraisemblables ; certaines synthèses
généralisent trop les coûts, les complications et les types de cible. NotebookLM aide à retrouver
un passage, mais sa réponse sur les conflits mentionne même du « Stress » : **ce n'est pas une
jauge à ajouter** à Dune.

Corrections officielles à faire respecter lors d'un développement :

- **Spécialisations, p. 103** : pas de minimum de compétence 6 pour en posséder une à la création.
- **Détermination, p. 157** : le joueur choisit les dés qu'il relance ; il n'est pas obligé de
  relancer toute sa réserve, malgré les résumés contradictoires du livre.
- **Tâches étendues, p. 159** : achevées lorsque la progression **atteint ou dépasse** les conditions.
- **Progression des atouts, p. 139** : coût d'amélioration égal à **deux fois la nouvelle qualité**,
  pas l'ancienne (sinon passer de qualité 0 à 1 semblerait gratuit).

Le corpus et le manuel devront suivre les changements effectifs, sans présenter une proposition
comme une fonction disponible.

## D1 — Activer les spécialisations : premier gain rapide

**Constat :** le moteur sait déjà élargir les doubles réussites grâce à
`DescripteurDeJet.specialisation` (utilisé pour Star Trek), mais `DUNE.jet` ne le déclare pas.
La fiche de référence ne possède pas de rubrique dédiée aux spécialisations.

**Résultat recherché :** liste des spécialisations sur la fiche, choix de celle qui s'applique,
et double réussite pour tout dé inférieur ou égal à la compétence choisie (p. 145, 148–149).
La pertinence du choix reste à la table.

**Preuve reproductible :** Combat 6 + Devoir 7 donne un seuil 13. Avec le pilote actuel,
`preparerLeJet(..., specialisation:true)` conserve le double sur 1 ; avec la déclaration
`specialisation:{label:'Spécialisation',composante:'competence'}`, il le porte à 6.
Un 5 passe ainsi d'une à **deux réussites**, sans changer le seuil.

**Portée :** configuration du pilote et fiche d'abord, mécanisme commun déjà disponible.

## D2 — Donner le choix des paiements et conserver l'Impulsion du jet

**Constat :** `ventilerLaDepense` dépense d'abord l'Impulsion et ne crée de la Menace qu'en cas
de manque. Or le livre autorise à payer **tout ou partie** de l'achat de dés en Menace,
même quand la réserve d'Impulsion est garnie (p. 149–152).

**Résultat recherché :** avant de lancer, choix explicite Impulsion / Menace / combinaison,
avec coût total inchangé 1/3/6 pour 1/2/3 dés. Le mouvement annoncé est celui réellement appliqué.

Il faut aussi distinguer **Impulsion générée par le test**, **Impulsion bonus** et **réserve
conservée** (p. 151). Le panneau actuel crédite immédiatement l'excédent à la réserve commune,
donc perd ce qui dépasse 6 avant de proposer ses dépenses immédiates.
Exemple : réserve déjà à 6, trois réussites excédentaires → trois points immédiatement perdus
par `gagner`, alors qu'ils peuvent financer les effets du test avant conservation du reliquat.
L'Impulsion bonus, elle, ne se conserve pas.

Ajouter des dépenses contextualisées : informations, création/modification d'un trait,
création/pérennisation d'un atout, effet sur une attaque. Les achats, les relances et les effets
du même jet doivent partager un seul bilan, afin de ne créditer ni dépenser deux fois.

**Portée :** moteur de jet et réserves communes, pas seulement un changement du JSON du pilote.

**Livré le 22/10/2026 (Claude Code, registre général § 151)**, à la demande de David — Dune reste
garé pour le reste : `paiementAuChoix` sur l'Impulsion (« dont en Menace », fiche et tablette) ;
l'excédent n'entre que dans la place libre, le reste se dépense sur le test ou se verse. Pas fait :
les dépenses contextualisées (informations, traits, atouts) et l'Impulsion bonus.

## D3 — Faire jouer Détermination, Principes et maximes

**Constat :** la Détermination se suit comme une jauge, les cinq Principes comme des nombres ;
les maximes et leur état ne sont pas structurés dans la fiche Dune. Les commandes de Détermination
et le cycle du Principe bafoué ne sont pas déclarés par le pilote.

Proposer, sous réserve d'une maxime pertinente validée à la table (p. 146–150, 157) :

1. Avant le lancer : fixer **un dé de la réserve** sur 1, sans ajouter un dé ni dépasser 5d20.
2. Après : relancer les dés choisis, au coût d'un point ; recalculer le résultat du **même jet**.
3. Créer, modifier ou retirer un trait, avec le MJ.
4. Accomplir une action supplémentaire dans un conflit.

Pour chaque Principe : maxime, état disponible/bafoué/récupéré et historique du choix.
Le MJ offre un point ; le joueur respecte le Principe avec complication, le bafoue, ou refuse
le point et en choisit un autre. **Biffer après la résolution du jet**, pas avant.
Un Principe bafoué reste indisponible jusqu'à récupération.

La récupération par introspection nécessite une scène sans gain ni dépense de Détermination,
ou intervient entre aventures. Elle permet une nouvelle maxime ou un rééquilibrage des priorités.
Un Principe récupéré dans cette aventure ne peut pas être bafoué à nouveau pendant celle-ci.
Prévoir un geste « Début d'aventure » pour la Détermination, pas une remise à 1 à chaque scène.

**Portée :** fiche enrichie, jet, état d'aventure ; pertinence morale arbitrée par le MJ.

## D4 — Terminer l'ordre d'action et les différences entre camps

La base d'alternance est là, mais trois comportements demandent une correction (p. 165–167) :

- **Paiement des PNJ ennemis :** `PanneauDAlternance` appelle toujours le même coût
  `2 impulsion`, sans lire le camp pour choisir la réserve. Avec Impulsion 6 / Menace 10,
  ce paiement donne 4 / 10 ; un PNJ ennemi devrait payer sa Menace, donc 6 / 8.
- **Conserver pour rejouer soi-même :** le livre permet une nouvelle action du même personnage
  (+1 à la difficulté de son éventuel test) **ou** le tour d'un allié. Le code ne propose que les
  combattants qui n'ont pas encore agi. Avec un seul PJ, il refuse la conservation faute d'allié.
- **Attaque ratée :** elle interdit de conserver l'initiative. Le décideur actuel n'a pas de
  résultat d'action pour distinguer ce cas d'une action réussie.

Inclure également les mouvements discrets permettant la conservation gratuite et l'action
supplémentaire par Détermination. Le surcoût de +1 est explicitement attaché à la nouvelle action
du même acteur ; **ne pas l'appliquer automatiquement à l'allié par extrapolation**.
Le livre ne le dit pas aussi clairement pour ce second cas.

## D5 — Relier attaques, atouts, défaite et récupération

Le livre distingue les cibles (p. 167–170) : un personnage mineur est vaincu par une attaque
réussie ; les principaux/notables et les atouts militaires concernés utilisent une tâche étendue.
Éviter une horloge uniforme appliquée à tout le monde.

Pour une cible à tâche étendue, afficher un aperçu avant application : compétence défensive,
qualité défensive, progression déjà marquée, qualité offensive et dépense éventuelle d'Impulsion.
La qualité d'un atout défensif augmente les **conditions**, tandis que sa présence dans la zone
augmente la **difficulté de l'attaque** : les deux effets sont différents. La borne de compétence
4–8 ne doit pas effacer le bonus de qualité défensive.

Après une attaque réussie : progression 2 + qualité offensive ; 2 Impulsion peuvent augmenter
la qualité de 1 pour cette attaque. À la défaite, proposer **Survivre à la défaite** : une fois
par scène, coût 1 + qualité offensive, en Impulsion ou Menace concédée pour un PJ, Menace dépensée
pour un PNJ ennemi, et complication choisie. Prévoir les exceptions de talents, sans les activer
pour tous. Une séquelle durable est un choix narratif, pas un résultat automatique.

La récupération dépend du contexte. L'aide à un allié peut éviter un effet permanent via un test
de difficulté 2 sans le remettre en jeu, ou suivre une tâche de récupération dans l'autre cas.
Ne pas remplacer cette procédure par un bouton de soins en points de vie.

**Portée :** résolution des conflits avec choix du MJ, reliée au vrai personnage.

## D6 — Assistance, oppositions et complications

- **Assistance** (p. 150) : l'assistant lance son propre d20 unique, sans achat, et n'ajoute ses
  réussites que si le personnage principal en a obtenu au moins une. Garder les dés et les
  complications de chaque participant ; une relance du principal ne relance pas ses assistants.
- **Opposition** (p. 158) : jet du défenseur puis difficulté du personnage actif fondée sur ses
  réussites, avec les facteurs externes explicités. Une opposition peut dépasser la difficulté
  usuelle 5 : ne pas plafonner automatiquement le résultat adverse à la borne du sélecteur.
  L'échec de l'actif peut générer de l'Impulsion pour son adversaire ; les PNJ convertissent
  leur Impulsion non utilisée en Menace.
- **Complications** (p. 153–154) : marge choisie 1–5, donc déclenchement sur 20, 19–20, …, 16–20.
  Le pilote actuel déclare seulement `complication:20`.
  Proposer le rachat à **+2 Menace par complication** pour les joueurs, et à **−2 Menace** pour
  un PNJ ennemi, sans confondre ce rachat avec une dépense d'Impulsion.
- **Réussite mitigée** : autorisation du MJ, échec mécanique conservé et complications ajoutées ;
  pas de crédit d'Impulsion ni de dépenses réservées à un test réellement réussi.

## D7 — Atouts structurés et zones pour les cinq formes de conflit

La fiche actuelle range les atouts dans une zone de texte. Structurer nom, propriétaire,
qualité, nature tangible/intangible, usage offensif/défensif, zone, visibilité et durée permettrait
de les sélectionner au jet et de les déplacer, neutraliser, récupérer ou pérenniser.

Le pilote traduit aujourd'hui les zones en cinq portées de grille, avec des malus +2/+3/+4
au-delà de la zone adjacente ; son commentaire reconnaît cette approximation. Le livre ne
fournit pas une échelle métrique universelle pour les cinq arènes (p. 164–188).

Un plateau de zones reliées conviendrait aux duels, escarmouches, espionnages, guerres et intrigues.
En intrigue, une zone peut représenter une personne ou une faction ; les champs Disposition et
Désir demandent leurs propres gestes. Distinguer mode Agent et mode Architecte pour que la
défaite de l'atout n'écrive pas automatiquement une blessure corporelle du personnage distant.
Prévoir les informations secrètes du MJ et la projection destinée aux joueurs.

**Portée :** chantier plus important, éventuellement un module de conflit raccordé à GM-OS.
Il n'est pas nécessaire pour livrer d'abord D1–D6.

## D8 — Fiche de Maison, début de partie et progression

Réutiliser la fiche de groupe pour la Maison : type, domaines, monde natal, rôles, alliés,
ennemis et atouts partagés. La Menace initiale est calculable après confirmation du nombre
de joueurs présents : **0 / 1 / 2 / 3 par joueur**, selon le type de Maison (p. 87), avec
ajustement explicite du MJ. Le pilote actuel laisse volontairement `depart:0`, faute de formule.
Le livre parle de session p. 87 et d'aventure p. 155 : nommer le geste choisi et confirmer son
effet, sans réinitialisation silencieuse à l'ouverture d'une fenêtre.

Ajouter un carnet de progression (p. 138–139) : gains proposés pour défaite, échec de difficulté
au moins 3, dépense importante de Menace et ambition, puis validation par le MJ. Historiser
les progressions acquises : une seule entre aventures ; une compétence ne peut augmenter
qu'une fois par cette voie et ne dépasse pas 8. Coûts et reconversion avec aperçu.
Pour un atout, appliquer **2 × nouvelle qualité**, conformément à l'errata.

Une fiche HTML fidèle serait un chantier Studio distinct, une fois les clés stabilisées ;
elle ne remplace pas les mécaniques du pilote.

## Ordre recommandé et recette

1. **D0 + D1**, puis corrections de paiement de **D2/D4** : enlever les erreurs qui changent les résultats.
2. **D3**, puis **D6** : donner aux joueurs les décisions centrales du 2d20.
3. **D5**, avec les premiers atouts structurés de D7 : résoudre les conflits de bout en bout.
4. **D8**, puis plateau D7 complet si David en souhaite l'usage à la table.

Cas de recette à conserver pour le développement : Combat 6 et dé 5 spécialisé → 2 réussites ;
achat intégral en Menace avec Impulsion encore pleine ; trois points utilisables immédiatement
malgré une réserve déjà à 6 ; rétention d'un PNJ débitée à la Menace ; rejouer un PJ seul ;
relance sélective sans relancer l'aide ni recréditer l'Impulsion ; mineur vaincu en un succès ;
qualité défensive ajoutée après le choix de compétence ; survie une seule fois par scène ;
quatre joueurs d'une Maison mineure → proposition de Menace initiale 4 ; qualité 0 → 1 coûte 2.
Les mêmes règles et décomptes devront fonctionner sur le poste MJ et les tablettes.

## État de cette analyse

Constats de fonctions pures exécutés dans `scratch/dune-audit/constats.mjs` : critique Dune 1
contre 6 une fois la déclaration ajoutée en mémoire, débit commun 6/10 → 4/10, trois points
perdus immédiatement sur réserve pleine, conservation refusée au PJ seul.
Ces vérifications ne modifient ni pilote ni application. Pas de test complet ni de recette
d'interface pour cet audit. **Aucun fichier `src/` ou `electron/` modifié, aucun paquet installé,
aucun service lancé, aucune donnée de campagne ouverte, aucun commit ni push.**

Les propositions sont rangées au registre § 143, ligne 79. Avant un développement, vérifier
l'export Dune effectivement utilisé par David et lui demander si GM-OS tourne.
