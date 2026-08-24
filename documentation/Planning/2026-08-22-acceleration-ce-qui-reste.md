# Accélération IA — ce qui reste, et dans quel ordre

**Nature de ce document : référence vivante, et la SEULE autorité sur l'état des axes restants.**
Le plan du 2026-08-07 (`2026-08-07-acceleration-ia.md`) reste l'autorité sur **ce qu'est** chaque axe —
son diagnostic, ses mesures, ses arbitrages. Celui-ci dit **où on en est et par quoi commencer**.

> *Un reste vit à un seul endroit, et les autres y renvoient* — règle 2 du § 7 de
> `2026-08-19-reconciliation-plans-aout.md`. **Cocher ici, et nulle part ailleurs.**

**Créé le :** 2026-08-22, après la relecture du plan que le plan lui-même réclamait.
**Chaque état ci-dessous a été vérifié dans le code**, jamais recopié d'un document.

---

## 1. Ce qui est fait — et pourquoi le compter

| Axe | | Quand |
| --- | --- | --- |
| **A** — activer l'iGPU | ✅ | 12/08 |
| **B** — réparer le RAG | ✅ | 09/08 |
| **C** — ordre du prompt et contexte du Cortex | ✅ | 21/08 |
| **D** — annulation, verrou, plafonds | ✅ | 21/08 |
| **E.1-E.2** — la voie Ollama | ✅ | 21/08 (E.3 est **caduc** : `ChronicleService` n'existe plus) |
| **F.3** — les appels en partie qui portaient le RAG complet | ✅ | 21/08 |
| **H** — les canevas | ✅ | **déjà fait**, découvert le 22/08 |
| **I** — inverser la chaîne NotebookLM | ✅ | **déjà fait**, découvert le 22/08 |
| **K** — découper les Forges | ✅ | **déjà fait**, découvert le 22/08 |
| **L** — index des livres | ✅ | **déjà fait**, amélioré le 21/08 |
| **O** — la boucle de revue | ✅ | 22/08, ses cinq points |

**Quatre axes chiffrés à dix-huit heures étaient déjà faits** — H, I, K, L — par les chantiers de Forge,
sans jamais avoir été rapportés à ce plan. *Deux plans qui avancent sans se regarder finissent par se
croire en retard l'un sur l'autre.* C'est pourquoi cette colonne existe : pour ne pas les redécouvrir une
troisième fois.

---

## 2. Ce qui reste — un tiers d’axe, et c’est du dessin

### ✅ E.4 — le plafond de texte de la Forge · *fait le 2026-08-22*

- [x] Le plafonner sur le `num_ctx` effectif
- [x] **Avertir à l'écran** quand un document est écarté

> **Le plan décrivait un plafond ; le code en portait TROIS défauts, et deux étaient muets.** Le pavé de
> 100 000 caractères valait environ quatre fois ce qui entre dans un `num_ctx` de 16 384 ; la garde
> laissait passer le dernier document **entier** quel que soit son poids ; et une fois le plafond
> atteint, la boucle **cessait simplement d'ajouter** — *le meneur croit avoir forgé depuis quatre
> livres, la Forge en a lu deux.*
>
> Le journal de la Forge attendait déjà ces lignes : son commentaire annonce « une ligne par groupe, une
> par lacune et **une par fichier écarté** » depuis le 20/08. Le canal existait, personne ne lui parlait.

### ✅ F — brancher le mode · *fait le 2026-08-22*

Le signal « une séance est ouverte » ne décidait que des **plafonds de temps**.

- [x] F.1 — le **contexte** et le **moteur d'image** en dérivent ; **pas le fournisseur** — voir plus bas
- [x] F.2 — le motif du générateur de butin, généralisé : *le choix de contexte visible et
      surchargeable, pas caché*
- [x] F.4 — jamais de diffusion locale en partie (cloud direct pour les images)
- [x] F.5 — **afficher le mode là où il agit**, pas seulement dans le cockpit

> F.5 porte sa propre justification : *si la Forge se comporte différemment parce qu'une session est
> ouverte, c'est la Forge qui doit le dire, avec le moyen de passer outre. Sinon on recrée l'action à
> distance qu'on cherche à éviter.*

> **Deux écarts au plan, tous deux assumés.**
>
> **Le fournisseur ne bascule pas tout seul.** F.1 le demandait, mais l'axe J porte l'arbitrage de
> David — *« choix explicite à chaque lancement, jamais de bascule automatique »* — et il est
> postérieur. Une bascule silencieuse vers le cloud enverrait le contexte de campagne à un tiers sans
> que personne l'ait demandé.
>
> **Le contexte n'est allégé QUE pour les générateurs** — butin, PNJ, voix. *Décision de David, le
> 22/08.* Appliqué à l'Oracle, `lite` ne veut pas dire « moins de contexte » mais **aucune recherche
> dans le corpus** : il serait devenu aveugle en partie, ce qui est exactement l'état qu'on venait de
> réparer. Une réponse rapide et fausse ne vaut rien.
>
> Et un **opt-in aux points d'appel** plutôt qu'un défaut global : un futur chemin de questions qui
> oublierait de se déclarer chercherait alors dans un corpus vide, sans qu'on le voie.

### ✅ G — la pause de séance · *faite le 2026-08-22*

Un bouton pause avec chronomètre : la pause **lève les plafonds de partie**, la reprise récupère l'IA.

- [x] Un champ `pausedAt`, **et pas un quatrième statut** — cinq composants testent
      `status === 'active'`, et un statut `paused` les ferait tous croire la séance absente
- [x] À la reprise : **finir la passe en cours**, abandonner la file, prévenir
- [x] Plafonner par le **temps de pause restant** — « pause de 15 min : cette Forge en demande 4, on y va »
- [x] Le chronomètre, qui vaut le coup **même sans l'IA**

> **Un garde-fou que le plan ne demandait pas, et qu'il impliquait.** « Plafonner par le temps de pause
> restant » rendrait, à la quatorzième minute d'un quart d'heure, un plafond de quelques secondes —
> **plus sévère que celui de la partie**. Or le plan dit ailleurs que *« couper net à la onzième minute
> sur douze serait punitif et dissuaderait de rien lancer »*. **La pause ne peut donc que lever le
> plafond, jamais l'abaisser** : `max(partie, min(preparation, restant))`.
>
> **Et un champ qu'on oublie de nettoyer devient un état permanent.** Une séance close qui porterait
> encore son `pausedAt` lèverait les plafonds pour toujours. Plutôt que de nettoyer à trois endroits —
> `updateSession`, `launchSession`, la clôture — **c'est `estEnPause` qui exige aussi
> `status === 'active'`** : un seul juge, et le champ résiduel devient inoffensif.
>
> La reprise **avertit sans empêcher**, comme le § 7 l'exige partout ailleurs : elle nomme ce qui tourne
> et depuis combien de temps, et laisse choisir entre laisser finir et rendre la main.

> Sa seconde raison d'être — « couper à la reprise » suppose des passes — est **levée** : l'axe K est
> fait.

### ✅ J — sélecteur de moteur par Forge · *fait le 2026-08-22*

**Arbitrage de David : cloud accepté pour les Forges, choix explicite à chaque lancement**, jamais de
bascule automatique.

- [x] Un `provider` passé à l'appel, qui court-circuite le fournisseur global **sans le modifier**
- [x] Le badge moteur devient un sélecteur, avec estimation de durée
- [x] Idem dans `ForgeDashboard` — **le même composant**, comme le § 8 l'exige
- [x] Mémoriser le dernier choix par Forge, mais **toujours l'afficher**

> L'Oracle et le Cortex n'en ont pas besoin : depuis les axes A à C, le local tient leur budget.

> **`ChronicleForge.tsx` n'existe plus** — l'axe K l'a remplacé par l'atelier de campagne. Le sélecteur
> vit donc dans `ForgeDashboard` et `AtelierDeCampagne`, et c'est **le même composant** : le § 8 prévient
> que *« une préoccupation partagée corrigée dans un seul de ses deux exemplaires »* est le bug de la
> migration Gemini du 07/08.
>
> **Les durées annoncées sont celles du § 5, mesurées** — ~2 à 5 min en local, ~30 s sur Gemini — et
> jamais un chiffre unique : *annoncer « 3 min » et en mettre neuf fait plus de mal que de ne rien dire.*
> En pause, le sélecteur dit en plus si la Forge **tient dans le temps qui reste**, ce que la convergence
> des axes I et G rendait enfin possible.
>
> **L'invariant « sans le modifier » est tenu par un test de source**, et non par une réimplémentation :
> aucune Forge n'appelle `setProvider`. *Deux fois ce jour-là, la vérification dans les deux sens a
> montré qu'un correctif n'était tenu par aucun test* — celui-ci l'est, et la dégradation le prouve.

### ✅ M — l'Oracle bibliothécaire · *ses quatre étages faits le 2026-08-22*

Quatre étages, du moins coûteux au plus coûteux.

- [x] 1 — **la fiche**, sans invoquer aucun modèle — *fait le 22/08 ; le rapprochement est un
      RECOUVREMENT et non un score, parce qu'un seuil à régler serait un seuil à re-régler*
- [x] 2 — à défaut, **la référence dans le livre** (« p. 142, section Ivresse ») ; ouverture du PDF en
      secours ou sur demande, **jamais dans le chemin critique** — *fait le 22/08 : aucun modèle invoqué,
      aucun PDF ouvert, un rapprochement de mots sur l'index déjà extrait*
- [x] 3 — à défaut, **un jugement de table** en deux lignes — *fait le 22/08 ; l'étiquette est posée
      par l'écran et non par le modèle, parce qu'une consigne de placement se perd*
- [x] 4 — **le journal des lacunes** — *fait le 22/08*

Les quatre exigences du *ruling*, qui ne se négocient pas :

| | |
| --- | --- |
| **Deux lignes maximum** | *la longueur est le signal* : une réponse courte se lit comme une proposition, une longue comme une autorité |
| **L'étiquette AVANT le contenu** | placée après, elle arrive quand le meneur a déjà adopté la réponse |
| **Aucune citation, aucun numéro de page** | un ruling qui cite a l'apparence d'une règle ; *l'absence de source EST l'information* |
| **Versé au journal des lacunes** | un ruling est par définition une fiche manquante |

> **Le journal des lacunes est « la meilleure idée du lot »** selon le plan : les sujets à forger cessent
> d'être choisis à l'intuition, **l'usage réel en séance les désigne**. Deux points de conception :
> **pas de pouces haut/bas** (friction à table, jamais cliqués — une question reformulée dans la minute
> est un signal gratuit) et **regrouper avant de forger**, sinon dix questions sur l'ivresse produisent
> dix fiches au lieu d'une.
>
> **Ses trois appuis — L, H et O — sont désormais tous les trois faits.**

> **Les quatre étages étaient écrits et INATTEIGNABLES**, et il a fallu la soirée du 22/08 pour s'en
> apercevoir : le corpus ne se résolvait pas pour une campagne forgée, le coffre Obsidian remplaçait la
> racine documentaire à chaque question, la recherche dans le livre recevait `campaign.system` au lieu du
> corpus, et le chemin de streaming n'émettait aucun verdict. *Un axe coché sur la lecture du code peut
> n'avoir jamais tourné.* Détail dans `2026-08-22-etat-et-reprise.md`, § 2.7 à 2.11.

### 🟠 N — deux régimes d'interface · *ses deux premiers temps faits le 2026-08-22*

La partition existe **déjà de fait** dans `CurrentView`, et un module l'applique déjà (`session-prep` /
`session-focus`).

- [x] 1 — **classer les vues** par affinité (préparation / partie / les deux) — `affiniteDesVues.ts`,
      **exhaustif par le typage** : une vue neuve ne peut pas naître sans être classée
- [x] 2 — **dédoubler `LayoutConfig`** par mode — `layoutConfigPartie`, et la restauration se déclenche
      désormais **au changement de moment**, pas seulement de campagne
- [x] 3 — deux vues **seulement là où c'est justifié** : combat, carte, PNJ, Oracle, journal.
      **Le 2026-08-23, sur ses deux axes objectifs** — `regimeDInterface.ts` (un seul fait, trois
      conséquences, une table de tailles partagée par les cinq) et `HorsDePortee.tsx` (le geste de plus
      qui éloigne le destructif en séance). Les **cinq** modules sont traités pour *« ce qui est à
      portée de main »* ; la **densité n'est calibrée que sur le combat**.

      ✅ **Jugée par David le 2026-08-24** : *« cela me convient pour l'instant, c'est clair et cela
      évite les erreurs. Pour moi, dans l'état c'est jouable. »* Les **tailles** sont donc validées —
      et *« ça évite les erreurs »* dit que la règle du destructif fait ce pour quoi elle existe.

      **Mais les quatre autres modules attendent la séance, délibérément.** Ce qui reste à décider
      pour eux n'est pas la taille — elle est partagée — c'est **quels éléments grossissent** dans
      chacun, et ça ne se devine pas depuis une vérification : *une densité se juge en jouant, pas en
      regardant.* Choisir maintenant, ce serait deviner quatre fois pour économiser une séance. *Comme les tailles vivent dans une seule table, la recalibrer coûtera une édition, pas
      cinq.*

      ⚠️ ✅ **CLOS le 2026-08-23 — trois défauts trouvés en chemin, et ce n'étaient pas des questions
      de densité** : supprimer un journal de séance, supprimer un événement et vider la discussion de
      l'Oracle se faisaient **sans la moindre confirmation**, depuis des boutons **invisibles jusqu'au
      survol**. *Une action qu'on ne voit pas venir ne peut pas s'éviter.* Le repli de séance n'y
      répondait qu'à moitié ; **la confirmation a été posée** — `gmConfirm` aux quatre endroits
      (journal ×2, Oracle, PNJ), **vérifié dans le code le 2026-08-24**.

> **Ce qui reste n'est pas de la plomberie, c'est du dessin.** Le plan le dit lui-même : *« ce qui change
> vraiment entre les deux modes n'est pas la liste des boutons : la densité (à table on regarde de loin,
> parfois debout, souvent en parlant), les valeurs par défaut, et ce qui est à portée de main. »*
> Cinq modules à redessiner, et **chacun demande l'œil de David à sa table** — pas une estimation en
> heures. Les deux premiers temps, eux, livrent le bénéfice que le plan leur prêtait.
>
> **Le champ n'a pas été renommé, et c'est la migration** : `layoutConfig` reste l'atelier, donc les
> campagnes écrites avant l'axe N gardent la leur. *Renommer aurait fait repartir tout le monde d'une
> disposition vide, sans que personne comprenne pourquoi.*
>
> Un défaut trouvé en chemin : l'auto-sauvegarde **comparait à l'atelier même en partie**. *Lire ailleurs
> que là où l'on écrit est indétectable par construction* — le défaut que `corpusSysteme` documente
> depuis le 10/08.

> Ce qui change vraiment entre les deux modes n'est pas la liste des boutons : la **densité** (à table on
> regarde de loin, parfois debout, souvent en parlant), les **valeurs par défaut** (en préparation on
> veut choisir, en séance on veut que ce soit déjà choisi) et **ce qui est à portée de main**.
>
> *« On retrouve son atelier tel qu'on l'a laissé le samedi matin, et sa table telle qu'on l'a laissée le
> samedi soir. »*

---

## 3. L'ordre proposé, et pourquoi

| Rang | Axe | Pourquoi ici |
| --- | --- | --- |
| ~~1~~ | ~~**E.4**~~ | ✅ **fait le 22/08** — la dernière troncature muette du chemin IA est fermée |
| ~~1~~ | ~~**M**~~ | ✅ **fait le 22/08** — ses quatre étages |
| 1 | **G** | Deux heures, un prérequis levé, et le chronomètre sert même sans l'IA |
| 2 | **J** | Du confort réel sur les Forges longues, sans dépendance |
| 3 | **F** | Le plus de plomberie pour le moins de gain immédiat |
| 4 | **N** | Le plus visible, le moins urgent — et il ne se juge qu'en jouant |

**Ce que cet ordre ne dit pas, et qui compte plus que lui** : rien de ce qui a été construit les 21 et
22 août n'a encore été vu tourner en séance. *Les onze défauts trouvés depuis le 17/08 l'ont tous été en
jouant — aucun à la lecture du code.*

---

## 4. Ce qui n'est pas dans ce plan, et qu'il ne faut pas y chercher

- **Le plafond du RAG à mesurer** (`MAX_CONTEXT_TOKENS = 4000`) — sa condition est remplie depuis le
  21/08. Il vit au § 5 de `2026-08-19-reconciliation-plans-aout.md`, avec le reste des restes.
- **Le corpus** — ~~194 fiches `relu: false`, 16 à régénérer, coc7 et dnd-5e vides~~. Même endroit.
  *Recompté le 2026-08-24 : **210** `relu: false` (le nombre monte parce qu'on forge, ce n'est pas une
  dette qui s'aggrave) et **zéro** `a_regenerer: true` dans un `rules/` — les 12 restants sont tous
  dans des `rules-v1/` archivés, hors index. **coc7 et dnd-5e ont été SUPPRIMÉS le 2026-08-24** — ils
  n'avaient pas de dossier `rules/`, donc rien à indexer, et personne ne les déclarait. **Le corpus n'a
  plus de reste.***
- **Le Cortex** — ses cinq axes sont faits ; restent deux questions, dont *« fusionner les deux appels »*.
  Elles vivent dans `2026-08-07-fiabilite-cortex-combat.md`, § 5.
