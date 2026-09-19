# 💡 Light-OS : Documentation Technique

Le module **Light-OS** gère l'ambiance lumineuse via le pont Philips Hue, en combinant des scènes natives et des effets pilotés par logiciel.

## 🏗️ Architecture

### 1. Store Global (`useLightStore.ts`)
*   **Zustand** : Stocke l'état des lampes (on/off, bri, xy, effect), les scènes disponibles et les paramètres de connexion au bridge.
*   **Persistence** : L'adresse IP et le Token sont persistés via le bridge sécurisé.
*   **`LightScene.effectSpeed`** : multiplicateur de vitesse des effets de la scène (2026-09-07), borné par `bornerVitesse` entre `VITESSE_EFFET_MIN` (0,25) et `VITESSE_EFFET_MAX` (3). **Champ optionnel** : absent vaut `VITESSE_EFFET_DEFAUT` (1), donc les scènes antérieures sont inchangées et **aucune migration n'est nécessaire**. Il vit dans `scenes`, donc il est persisté et sauvegardé avec elles.

### 2. Moteur d'Effets (`HueEngine.ts`)
Le moteur est une instance unique (singleton) qui gère les requêtes HTTP vers le pont Hue.
*   **Effets Natifs** : Comme `colorloop`, gérés directement par le matériel Hue.
*   **Effets Logiciels** : Boucles `setInterval`/`setTimeout` qui calculent les couleurs et la luminosité à la volée.
    *   **Performance** : Pour éviter de bloquer l'UI, ces boucles ne déclenchent pas de rendu React. Elles envoient des requêtes HTTP directes au bridge.
    *   **Variance XY** : Utilise la méthode `applyXyVariance` pour créer des scintillements naturels (feu, bougie).
    *   **Génération** (`generationEffet`) : chaque démarrage d'effet sur une lampe reçoit un numéro. Une boucle suspendue sur la réponse du pont vérifie ce numéro avant de se replanifier — sans quoi la boucle d'un effet **révolu** réinstallerait son minuteur par-dessus le nouveau, et la lampe resterait sur la scène précédente.

### 2 bis. Vitesse des effets (2026-09-07)
La cadence d'un effet est écrite dans son `case` (`interval`). La **vitesse de la scène la divise**, via la fonction pure `cadenceEffective(intervalleMs, vitesse)`.

*   **Plancher** : `CADENCE_PLANCHER_MS` = 100 ms, la valeur que les effets les plus rapides s'autorisaient déjà. Chaque lampe en effet a **sa propre boucle** et le pont accepte de l'ordre de dix commandes/seconde : sans plancher, un curseur au maximum sur une scène de quatre lampes le saturerait.
*   **Vitesse invalide** (0, négative, `NaN`, absente) → cadence d'origine. *Un réglage abîmé ne doit jamais figer un effet.*
*   **Provenance** : `startSoftwareEffect(id, effet, base?, sceneId?)` retient dans `sceneDeLEffet[id]` **de quelle scène vient l'effet** — c'est elle qui porte la vitesse. Un effet lancé depuis `BulbFooter` n'a pas de scène et garde sa cadence d'origine.
*   **Relecture** : la cadence est relue **à chaque tour**, et le minuteur n'est reposé que si l'attente voulue diffère de `cadencePlanifiee[id]` — sinon on reconstruirait un `setInterval` dix fois par seconde.
*   **Application immédiate** : `appliquerVitesseDeScene(sceneId)` replanifie sur-le-champ les effets nés de cette scène. *Sans cet appel, un effet lent (crépuscule : 10 s) n'apprendrait sa nouvelle vitesse qu'au tour suivant, ce qui se lit comme un réglage en panne.*
*   ⛔ **`setInterval` fige sa période** à la pose : c'est la raison pour laquelle les deux familles d'effets passent maintenant par une seule fonction `planifier()` interne — les dynamiques en `setTimeout` un tour à la fois, les autres en `setInterval` jusqu'à ce que la vitesse change.

### 2 ter. Les portes du retour — trois le 2026-09-07, **quatre depuis le 2026-09-20**
Quatre gestes ramènent la pièce au repos. **Ils se ressemblent assez pour être confondus dans le code, et ils ne visent pas la même chose.**

| Méthode | Appelée par | Vise |
| :--- | :--- | :--- |
| `revertToManualScene()` | Sound-OS, Music-OS, Ambient-OS (×2), `restoreAfterTactical` | `lastManualSceneId`, puis `defaultSceneId`, puis extinction |
| `revenirALEclairageNormal()` | le **Stop All** de `MasterAudioController` | `defaultSceneId` **directement**, puis extinction |
| `extinguishAll()` | le bouton rouge de la `Sidebar` de Light-OS | rien : elle éteint |
| `rendreLaPieceApresLEssai()` | « Revenir » de `PropositionDAmbiance` | **ce que la pièce montrait avant l'essai** — jamais une extinction |

*   **La règle commune** est isolée dans `logic/sceneDeRepli.ts` : prendre le premier candidat qui **porte réellement l'état d'une lampe**. Une scène absente, ou existante mais vide, est sautée — *un repli qui ne fait rien consomme le tour de celui qui aurait marché*.
*   ⛔ **Le défaut réparé** : avant ce jour, une soirée où aucune scène n'avait été cliquée finissait dans le noir à la fin du premier pad sonore — `lastManualSceneId` était `null`, et `applyScene(null)` éteint.
*   ⚠️ **Le Stop All ne passe pas par `lastManualSceneId`**, volontairement : *on ne retombe pas sur la scène d'alerte qui jouait il y a trois secondes.*
*   ⚠️ **`revenirALEclairageNormal` arrête d'abord tous les effets logiciels**, sur **toutes** les lampes connues. `applyScene` n'arrête que ceux des lampes qu'elle mentionne : une lampe absente de la scène normale garderait son orage en cours, et un geste nommé « tout arrêter » aurait laissé la pièce clignoter. Leur brillance, elle, n'est pas touchée.
*   **`defaultSceneId`** vit dans le store, est persisté, et **tombe à `null` quand la tuile désignée est effacée** (`clearScene`). `null` partout = comportement d'avant, à l'identique.
*   ⛔ **La quatrième porte existe parce que les trois autres visent une *scène*.** Sans scène jouée ni `defaultSceneId`, les trois tombent sur `extinguishAll` — or on essaie une ambiance en **préparant** une séance, pièce allumée. La visée est dans `logic/retourDEssai.ts` : **rejouer la scène qui tournait** (elle seule rallume les effets), ou **reposer le miroir** photographié au début de l'essai.
*   ⛔ **La photographie COPIE les états.** L'essai écrit dans le miroir à chaque lampe posée (`setLightState` → `updateLightState`) : une photographie par référence suivrait l'essai et rendrait l'ambiance dont on voulait sortir. *Une photographie qui change avec son sujet n'est pas une photographie.*
*   **`poserLesEtats(etats, intensite, sceneId?)`** est l'écrivain unique vers le pont depuis le 20/09 : `applyScene` et `essayerUneAmbiance` l'emploient toutes deux. `sceneId` absent = l'effet n'appartient à aucune tuile, donc vitesse et intensité pleines, comme un effet choisi à la main.

### 2 ter bis. L'atelier d'effets — un effet qui est de la DONNÉE (2026-09-20)
⛔ **Les 48 effets sont des `case` dans un `switch`.** Ajouter un effet demandait quatre fichiers et une règle non écrite sur le rapport fondu/battement — *donc chaque idée d'ambiance passait par un développeur.* Une **variante** contournait à moitié : elle décline un corps existant, elle n'en invente pas.

Un **effet d'atelier** (`logic/effetDAtelier.ts`) est une suite d'étapes `{couleur, brillance %, durée ms, fondu ms}` plus un **aléa**. Il n'a **aucun `case`**.

| Point | Règle |
| :--- | :--- |
| Identifiant | `atelier:<id>`, comme `variante:<id>` — `estUnEffetDAtelier` / `idDepuisLAtelier` |
| Où il se joue | **avant le `switch`**, qui ne le reconnaît pas et le laisse passer : tout ce qui vient **après** (brillance globale, intensité de tuile, rabotage du fondu) s'applique donc sans une ligne de plus |
| Famille de budget | **adaptatif** (`cadencePartagee`), jamais soliste |
| Relecture | à **chaque passage**, pas au démarrage |
| Bornes | dans le magasin (`modifierUnEffetDAtelier` → `effetBorne`), pas dans le champ de saisie |

*   ⚠️ **Adaptatif et non soliste, et c'est un choix.** Un effet écrit par le meneur n'a pas d'identité déclarée dans le code : on ne peut pas savoir si sa vitesse *est* sa nature. Le rationnement soliste **éteindrait des lampes** sur un effet qu'il vient de composer. *Ralentir se voit et s'explique ; une lampe qui ne joue pas ne s'explique pas.*
*   ⭐ **Relu à chaque passage** : c'est ce qui permet de régler une étape pendant que la lampe la joue. Même leçon que le curseur d'intensité du 09/09 — *une couleur ne se juge pas dans un champ de saisie.*
*   ⛔ **Il peut disparaître sous la boucle** (supprimé à l'atelier, ou vidé de ses étapes) : c'est le **quatrième** ayant droit à `stopSoftwareEffect(id, 'rendreLEtat')`, recensé dans `etatARendre.test.ts`.
*   ⚠️ **Il écrit `on`, contrairement aux 48.** Une étape à 0 % éteint ; sans `on: true` au passage suivant, *la première étape noire serait la dernière de l'effet*. Et le pont refuse une couleur sur une ampoule qu'on éteint.
*   **Persistance** : `effetsDAtelier` est dans `partialize`, dans `tuilesDurables` (donc dans la sauvegarde **et** dans les champs qui l'arment) et déclaré dans `schemas.ts`. Les trois maillons ont été oubliés séparément dans ce dépôt — `lesEffetsDAtelierSontSauvegardes.test.ts` les garde tous les trois.

### 2 quater. Le clavier et la synchro (2026-09-07)

*   **`useLightKeyboardControls`** est monté dans `GlobalKeybinds`, aux côtés de Sound-OS et Music-OS. **Troisième écouteur `keydown` sur `window`** : les trois sont indépendants, donc une même touche peut déclencher un pad **et** une scène. Voulu ; ce qui ne l'est pas — deux scènes sur une touche — est écarté à l'écriture par `setSceneKeyCode`.
*   La garde est la fonction partagée **`estUneFrappeDePastille`** (champs de saisie, `role="dialog"`, Ctrl/Alt/Cmd). ⚠️ **Conséquence non évidente** : le bouton de Key Learn ne peut pas vivre dans `EditeurDeScene`, qui porte `role="dialog"` — la garde y rendrait le clavier à la boîte et la frappe n'arriverait jamais. Il est donc sur la tuile.
*   **`sceneEnApprentissage`** est un **mode**, non persisté : rouvrir GM-OS en attente d'une touche laisserait le clavier muet sans dire pourquoi. `Escape` en sort.
*   ⛔ **`isSyncEnabled` n'avait aucun écrivain** jusqu'à ce jour : lu dix fois dans Ambient-OS, Music-OS et Sound-OS, persisté, et `true` à jamais. L'interrupteur est dans `TopControls`. **Le voisin a été renommé** `mock_sync` → `mock_mode` : il porte le nom que le guide donnait à celui-ci, et bascule le pont en simulation.

### 2 quinquies. Relire les lampes sur le pont (2026-09-19)

Le magasin ne tenait **que le compte de ce que GM-OS avait envoyé** : `lights` n'était rafraîchi qu'à l'appairage. Un réglage fait depuis l'application Hue du téléphone était donc invisible, et `saveSceneSnapshot` enregistrait un état que plus personne ne voyait dans la pièce.

*   **`HueEngine.relireLesLampes()`** est désormais le seul écrivain du miroir ; `fetchLights()` ne fait que l'appeler. La règle vit en logique pure dans **`logic/relireLesLampes.ts`**.
*   ⛔ **Le pont rend de l'effectif, le magasin garde du nominal.** `bri` côté pont vaut `nominal × globalBrightness × sceneBrightness`. Recopier tel quel rabaisse le nominal d'un cran **à chaque lecture** : deux allers-retours suffisent à éteindre une scène par étapes — ce dont le commentaire de `setLightState` prévenait depuis toujours.
*   **La règle** : ou bien le pont répète ce qu'on lui a envoyé (à `TOLERANCE_DE_BRILLANCE` près) et on garde le nominal, ou bien il dit autre chose et c'est une valeur de la pièce, ramenée au nominal en défaisant **le curseur global seulement**.
*   ⚠️ **L'intensité de la tuile entre dans la comparaison, jamais dans la division**, et seulement pour les lampes que la tuile jouée commande. Sans ce tri, une lampe réglée au pied de page pendant qu'une tuile à 60 % joue passerait pour déplacée à chaque lecture.
*   ⛔ **Deux lampes ne sont jamais relues** : celle qui joue un **effet logiciel** (sa brillance est l'image d'un battement) et celle que le pont dit **injoignable** (il ne répète qu'un souvenir).
*   Un essai compare la reconnaissance à **`brillanceEffective`** : si la formule d'envoi change, il tombe. *Deux écritures d'une même formule dérivent en silence.*

### 2 sexies. Le rattachement à une campagne (2026-09-19)

*   **`LightScene.campagneId`** — *étiquette, pas cloison*. Absent ou `null` : la tuile est **commune**, visible partout. C'est le défaut, et c'est ce qui rend la bascule indolore : les dix-huit tuiles d'origine n'en portent pas. **Aucune migration.**
*   La règle de classement est **partagée avec Music-OS** dans `src/logic/rattachementALaCampagne.ts` ; `light/logic/tuilesDeLaCampagne.ts` n'ajoute que ce qui est propre au râtelier lumineux. `music/logic/playlistsDeLaCampagne.ts` ne fait plus que la rhabiller.
*   ⛔ **Six lecteurs** filtrent les tuiles, et le verdict doit être unique : la grille, le sélecteur partagé (Music/Sound/Ambient), la barre latérale, l'éditeur de zone de danger de Map-OS, le select du Storyboard, **et le clavier**. Les cinq écrans passent par `hooks/useTuilesVisibles.ts` ; le clavier appelle la **même fonction pure**, `tuileDuRaccourci`.
*   ⚠️ **`tuilesOffertesAuRepli` garde une exception** : la désignation en cours reste offerte même si elle appartient à une autre campagne. `defaultSceneId` est global et **il agit** — le masquer donnerait un réglage qui commande les lampes sans apparaître nulle part.
*   **`garnirLeRatelier(campagneId)`** complète un râtelier à `TAILLE_DU_RATELIER` (18). Idempotente, appelée à l'ouverture de `LightDashboard` pour la campagne **et** pour le pot commun. ⚠️ Dix-huit est un **plancher, pas un plafond** : rattacher une tuile commune à sa campagne lui en donne dix-neuf, et rien ne lui en retire.
*   **Les identifiants** : `SCENE_NN` pour le pot commun, `SCENE_<campagne>_NN` pour une campagne. ⛔ **L'identifiant n'est pas le propriétaire** — `campagneId` l'est, et lui seul ; un identifiant ne change jamais, sous peine de casser les liens que cinq modules tiennent dessus. Le numéro se relit **après le dernier tiret bas** (`numeroDeCase`) : `split('_')[1]` rendait la campagne, et `parseInt` en faisait `NaN`.
*   ⭐ **Deux règles se sont inversées le jour même** où les râteliers ont cessé d'être partagés : `clearScene` **garde** désormais le rattachement, et une case vide n'est plus visible hors de son râtelier. Les deux protégeaient d'un râtelier qui rétrécit. *Une règle juste peut s'inverser quand ce qu'elle protégeait change de forme.*

### 2 septies. Ce que Light-OS met dans une sauvegarde (2026-09-19)

⛔ **Le module n'était dans aucune sauvegarde** jusqu'à cette date — cinquième oubli de la liste de `construireLaSauvegarde`, après `entities`/`clues`/`sessions`, Music-OS, Map-OS et Image-OS.

*   **`logic/donneesDurables.ts`** définit la part sauvegardée — `scenes`, `variantes`, `defaultSceneId` — **en un seul endroit**, lu par la charge utile *et* par l'abonnement qui arme la sauvegarde. Deux listes recopiées divergeraient, et l'écart serait muet dans les deux sens.
*   ⚠️ **Les variantes voyagent avec les tuiles, obligatoirement** : une tuile peut porter `variante:<id>` comme effet. *Ce qui est référencé part avec ce qui référence.*
*   **Ce qui n'y est pas** : `globalBrightness`, `transitionTimeMs`, `isSyncEnabled`, `lights`, l'état du pont. Ils décrivent la pièce, pas l'univers — et `lights` change dix fois par seconde sous un effet.
*   ⛔ **La garde anti-écrasement ne peut pas compter les tuiles** : les dix-huit existent toujours. Le verdict est `logic/tuilePorteUnEtat.ts` — *qu'une tuile au moins tienne l'état d'une lampe*.
*   **Le déclencheur** : `session/store/index.ts` s'abonne à `useLightStore` **sur les seuls champs durables**. ⚠️ Un abonnement au magasin entier remettrait à zéro les deux minutes de repos à chaque battement d'effet, et **plus aucune sauvegarde ne partirait pendant une séance**.
*   **La restauration d'un instantané fusionne** (`logic/instantaneDeSeance.ts`, sur la règle commune `src/logic/fusionDInstantane.ts`) : *un instantané ne fait jamais disparaître un travail qui n'est pas le sien*. Il ne remplace une tuile pleine que si elle appartient au même propriétaire.

### 2 octies. L'ambiance composée par l'IA (2026-09-19)

Le geste vit dans **`session/components/TrameDashboard.tsx`**, sous le champ *Ambiance* d'une scène — c'est au moment où l'on écrit ce qui se joue qu'on sait ce que la pièce doit dire.

*   **`logic/proposerUneAmbiance.ts`** construit l'invite et appelle `generateJSON` avec `sansPersona` et un **schéma imposé au décodeur**. ⭐ *Ce qui décide du COMPTE s'énonce avant ce qui décide du CONTENU* : « exactement N entrées, une par lampe, dans cet ordre » est la première phrase. On ne donne que les **identifiants** d'effet, jamais les noms traduits.
*   **`logic/ambianceProposee.ts`** est le cœur : un effet inconnu devient `none`, une couleur non hexadécimale écarte la lampe, une lampe inventée est ignorée, une lampe oubliée est **éteinte**. ⛔ Un effet inventé ne lève **aucune erreur** — le moteur ne trouve pas son `case`, la lampe reste fixe, et *une ambiance à moitié muette ressemble à une ambiance ratée, pas à une panne*.
*   ⛔ **On ne demande jamais de `xy` au modèle** : c'est l'espace CIE avec un gamut par ampoule. Il rend un hexadécimal, `hexToXy` fait le reste. La conversion est passée en **callback** pour que la logique reste pure.
*   **`logic/caseLibreDuRatelier.ts`** choisit où ranger : la première case libre du râtelier de la campagne, **jamais le pot commun**. Sans campagne ouverte, on ne range pas et l'écran le dit.
*   L'écriture passe par **`saveSceneSnapshot`** (avec des lampes fabriquées portant les états proposés) plutôt que par un second écrivain de `lightStates`, et **complète le moment de storyboard de la scène** au lieu d'en créer un second.
*   ⚠️ **Rien n'est appliqué au pont avant l'enregistrement.** Le « Jouer maintenant » n'apparaît qu'après.

### 3. Hiérarchie des Overrides
1.  **Tactical State** (Flash, Alerte) : Priorité absolue. Interrompt les effets en cours.
2.  **Software Effects** (Loop) : Priorité haute.
3.  **Manual Scene** : État de base.

## 🌈 Configuration des Effets

Chaque effet est défini par :
*   `transitiontime` : Vitesse de changement (en dizaines de ms).
*   `interval` : Temps entre deux mises à jour.
*   `payload` : Les paramètres `bri` et `xy` envoyés au bridge.

### Ordonnancement Dynamique
Certains effets (Glitch, Neon, Lever de Soleil) modifient leur `interval` dynamiquement durant l'exécution pour simuler des comportements imprévisibles ou des séquences temporelles. La liste `dynamique` de `startSoftwareEffect` les désigne : ceux-là se replanifient **un tour à la fois**, les autres battent à cadence fixe.

> ⚠️ Cette liste est écrite **dans** `startSoftwareEffect`. Un nouvel effet qui change son `interval` au fil des tours doit y entrer, sinon il gardera la cadence de son premier passage.

## 🛠️ Maintenance & Ajout d'Effets
Pour ajouter un effet :
1.  Ajouter le `case` dans `HueEngine.startSoftwareEffect`.
2.  Ajouter la couleur de départ dans `BulbFooter.tsx` (`defaultColors`).
3.  Enregistrer l'option dans le `<select>` de `BulbFooter.tsx`.
4.  Ajouter la traduction dans `modules.json` sous `light.footer.effects`.
5.  Si l'effet modifie son `interval` en cours de route, l'ajouter à la liste `dynamique` (voir ci-dessus).

*Documentation complétée le 2026-09-07 : vitesse des effets par scène, plancher de cadence, numéro de génération ; les trois portes du retour et l'éclairage normal (`defaultSceneId`) ; puis le clavier (`keyCode`, enfin lu) et l'interrupteur de synchro (`isSyncEnabled`, enfin écrit).*
