# RdD — R5, R6 et R7, 19/10/2026

David : **« maintenant on va finir R5, R6, R7 »**, puis **« gm-os est fermé »**
et réponse identique à la question obligatoire avant les écritures dans `src/`/`electron/`.
Sa demande **« continue »** poursuit ce lot. La sélection Nephilim dans l'IDE est sans rapport.
Base : R3/R4 commité localement dans `ef659f35`, R0/R1/R2 et première boucle R8 poussés
dans `94e0aaed`. Aucun nouveau commit ni push demandé.

## État

**Intégration R5–R7 terminée pour les PJ et vérifications finales réussies.** Aucun réimport
du pilote R0 requis. David peut rouvrir GM-OS pour les essais ; demander à nouveau son état
avant une prochaine modification du code après ces essais.
Les sources des barèmes et le cadrage détaillé sont conservés dans
[l'audit du 18/10](2026-10-18-etat-et-reprise-codex-rdd-r5-r6-r7.md).
Livre primaire retenu par David : **2.3.1**, même empreinte privée que R0.
Pages 143–148 pour progression ; 150–157 pour chance/destinée/astrologie ; 158–161 pour moral.
Tables relues visuellement ; PDF et rendus restent ignorés dans `scratch/`.

## Ce qui est intégré

- **R5** : stress 1–20 par situation, cumul non plafonné à vingt ; conversion dans Château
  Dormant après au moins une heure de sommeil, sur rêve actuel à zéro, double particulière,
  arrondis et perte du point restant ; exaltation/dissolution traitées avant l'allocation.
  Réserve d'XP de stress, comptes par compétence séparés de l'exercice ; Archétype reporté
  explicitement, jamais inventé. Allocation plafonnée au potentiel et augmentation d'un niveau
  séparée, avec coût par niveau visé. Pas de progression directe de TAILLE/dérivées, plafond
  vingt pour physiques humaines. XP d'exercice depuis un résultat définitif, prise en compte
  des dommages d'attaque, tests de mémoire et composantes des dérivées. Provenance requise pour
  anciens carnets/apprentissage. Deux XP de stress pour un point de voyage ; dix points par
  destinée, sept destinées maximum.
- **R6** : résultat conservé avec caractéristique, compétence, valeur, ajustement et conditions.
  Recours persistants : chance réussie coûte un point et ouvre une seule relance, échec gratuit
  ferme aussi la destinée ; les paramètres initiaux sont conservés. La destinée directe donne
  une significative, refusée à −11 ou moins, avec exceptions CONSTITUTION et jet de vie.
  Ce dernier emploie **le même dé déjà tiré** dans l'aperçu R2, sans nouveau lancer caché.
  Une destinée rend aussi toute la chance. Appel au moral avant l'action, énergie du désespoir,
  coût annulé si le résultat annulé par la chance devient une réussite ; pas de second paiement.
  Moral sur tous les jets de VOLONTÉ, situations, exaltation et dissolution. Le Château Dormant
  traite stress avant perte de rêve, moral après soins, chance selon dépense journalière.
- **R7** : repère explicitement déclaré dans Clock-OS statique/fantastique, heures de 120 min,
  Vaisseau début du jour et Araignée minuit. Nombre astral secret stable par jour ; visibilité,
  éloignement, vingt minutes et observation nocturne. Une observation par personnage/jour/nuit,
  au moins vingt minutes entre observations. Succès donne le vrai nombre, échec un faux choisi
  par le MJ ; aucune indication de validité transmise. XP secrètes gardées puis communicables
  une fois. Prédictions filtrées par personnage au niveau de chaque socket, secrets retirés
  aussi des fenêtres natives projetées. Seuls CHANCE, appel à la chance et rituels reçoivent
  l'ajustement réel, jamais un bonus général. Ces jets sont réservés au MJ quand l'astrologie
  est active : une prédiction du joueur n'est pas le véritable nombre astral.

Réutilisation des aperçus/empreintes/reçus et du journal R3/R4. Les anciennes preuves ne sont
pas tronquées. Nouvelles métadonnées : `__rddProgression231`, `__rddMoral231`,
`__rddAction231`, `__rddChanceDepensee231`, conservées face à une ancienne fiche qui les omet.
Clés scalaires existantes conservées : `stress`, `moral`, `points_de_chance`,
`points_de_destinee`, `heure_naissance`. Le pilote R0 exporté reste inchangé, pas de réimport.
La campagne conserve `rddAstrologie` dans ses sauvegardes ; ce champ est projeté avant envoi.

## Fichiers et frontières

Moteurs : `moralDuVoyageur`, `progressionDuVoyageur`, `recoursDuVoyageur`,
`astrologieDuVoyageur`, `astrologiePartagee`. Panneaux : `PanneauProgressionVoyageur`,
`PanneauRecoursVoyageur`, `PanneauAstrologieVoyageur`, raccords dans `PanneauJetVoyageur`,
`PanneauReposVoyageur`, `PanneauSanteVoyageur`, fiches PC/tablette.
Secret : `SyncServer.broadcastAction` projette par personnage identifié ; `main.ts` retire
les secrets et toutes les prédictions personnelles des fenêtres de projection sans personnage.

Les commandes de progression/recours/astrologie sont **PJ, validées par le MJ** ; les tablettes
consultent, conservent leurs propres résultats et lisent leurs prédictions. Les PNJ/adversaires
autonomes n'ont pas ces nouveaux panneaux. Entraînement/apprentissage : conditions et temps
arbitrés, report d'XP avec motif ; pas de simulation ajoutée. Famine et enchantements restent
manuels dans le bilan. R8 garde la carte et le carnet dans le module externe, les règles et
réserves dans GM-OS ; pas d'autre réserve ni d'automatisation de rencontre/sort en chemin.

## Vérifications et pièges

- **Suite globale finale : 8 319 tests réussis, quatre ignorés ; 687 fichiers réussis et un
  ignoré**, en 324,07 s. Contrôles ciblés du manuel et des reçus après copie des images :
  **21 réussis sur deux fichiers**. Types et construction finale réussis.
- Lint global : **1 928 fichiers, zéro erreur, un avertissement préexistant** dans
  `useSaisieDifferee.ts:46`. Ne pas corriger ce fichier hors chantier. `git diff --check` propre.
- **Sept parcours E2E réussis en 3,3 minutes**, tous dans des profils isolés : consolidation
  R0 (19,9 s), fatigue R1 (24,9 s), ouvrages/repos R3/R4 (26,8 s), R5–R7 (34,1 s), raccord
  TMR avec reprise froide (36,1 s), santé R2 (27,2 s), carte privée TMR (27,0 s).
- Le parcours R5–R7 vérifie une nuit (stress, moral, chance, rêve), allocation/augmentation
  de Navigation, appel au moral raté puis chance et relance réussie avec restitution du moral,
  interdiction d'un autre recours, observation secrète, deux prédictions distinctes sur deux
  tablettes ; **inspection des messages réseau effectivement reçus**, sans nombre réel, sans
  observations et sans prédiction de l'autre personnage. Rechargements PC/tablette et traces
  uniques vérifiés ; panneaux sans débordement à 360 px. Toutes les instances sont fermées.
- Trois captures finales PC/tablette relues et copiées au manuel : progression, recours,
  astrologie ; les deux captures de repos et Château Dormant sont remplacées par leurs versions
  actuelles. Le guide 53 et le manuel 54 RdD décrivent les parcours et les frontières restantes.
- Pièges résolus : garde `nomsSansEcrivainNiLecteur` rouge sur la tolérance `addTime`, désormais
  effectivement appelée par R7 → retirer l'exception, conserver le contrôle. Sélecteur Nature du
  jet : ajouter un `aria-label` explicite pour éviter que les options contaminent son nom.
  Mémoire à ajustement −1 : pas de minimum d'une XP inventé ; le minimum d'un point concerne
  la caractéristique pure sans compétence. Un rituel reste une action pour l'exercice.

Commandes/logs : `scratch/reve-de-dragon-r567/`, `vitest-final.log`, `e2e-final.log`,
`build-final.log`, `lint-final.log`. E2E `progressionEtAstrologieVoyageur.spec.ts` et les six
recettes RdD antérieures ; instances isolées, jamais les données personnelles de David.

## Copie de travail partagée

Les modifications étrangères au lot vues au départ restent intactes : note TMR-sources,
guides 52 et 54 Alien/Blade Runner/Cthulhu Hack/NOC/Torg, `.claude/settings.local.json`,
exports, campagne Nouvelle Ys, bannière Nephilim, outil PDF-vers-MD. Registre et guide 53
étaient propres après `ef659f35` : seules les lignes RdD sont modifiées dans ce lot.
Pas de paquet installé, pas de nouveau service lancé hors des profils de test isolés.

**Livraison : 38 fichiers du lot modifiés ou créés, non commités et non poussés.** Export R0
inchangé : SHA-256 `66501921abd73c2bc98805dacc917867996b3a6c677db24b86dd3e5dd5a2e51a`.
Les fichiers étrangers ci-dessus restent hors du lot. Le registre § 141 et sa ligne 76 sont
actualisés. L'audit du 18/10 décrit le cadrage initial ; cette note du 19/10 fait foi pour la suite.

**Demande suivante de David, 19/10 : « commit et pousse ».** Commit et push du lot R5–R7
autorisés sur la branche actuelle, avec les hooks habituels. La mention « non commités et non
poussés » ci-dessus décrit la livraison avant cette demande ; le journal Git fait foi ensuite.
