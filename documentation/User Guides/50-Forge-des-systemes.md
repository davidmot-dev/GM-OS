# 🔨 Rule Engine & la Forge

Deux outils, deux moments. **La Forge** lit vos documents et en tire un système jouable ; **l'éditeur
de règles** vous laisse tout reprendre à la main.

---

## 🗂️ Forge-OS a trois ateliers

L'en-tête du module porte trois onglets numérotés, en haut à droite — **1. Forge du système**,
**2. Campagne**, **3. Trame** :

![La Forge du système : la destination du système, la dérivation depuis le corpus, les intentions du meneur, et à droite le résultat en attente](captures/module-forge.jpg)

| Atelier      | Ce qu'il produit                                                                                                            |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **1. Forge du système** | Un **système de jeu** : moteur de dés, combat, portées, consignes d'IA, gabarit de fiche. Deux sous-onglets : *Structure système* et *Atelier de règles* |
| **2. Campagne** | Une campagne jouable à partir d'un scénario — actes, scènes, PNJ, lieux. → [guide dédié](./12-Forge-de-campagne.md) |
| **3. Trame** | Le plan narratif d'une campagne existante. → [guide dédié](./11-Trame-actes-et-scenes.md)                                 |

---

## ⚙️ Choisir le moteur, à chaque forge

Avant de lancer, vous choisissez **quel modèle** travaille. Trois principes, tranchés une fois pour
toutes :

- **Le nuage est accepté ici.** Une forge n'a pas le contexte vivant d'une séance ; y envoyer un
  livre de règles ne coûte pas la même chose qu'y envoyer une question de table.
- **Le choix est explicite** à chaque lancement.
- **Rien ne bascule tout seul.** Le choix est mémorisé *par atelier*, mais **toujours affiché** —
  *mémoriser sans montrer redonnerait un réglage qu'on a oublié d'avoir posé.*

> ⛔ **Correction.** Ce guide annonçait « l'IA (Gemini 1.5 Pro) ». Aucun modèle n'est imposé : vous
> disposez des six fournisseurs configurés dans les réglages IA.

### Ce que ça coûte, en temps

Pour une forge système complète, mesuré :

| Moteur | Durée |
| :--- | :--- |
| Modèle local, sur processeur seul | **9 à 15 min** |
| Après distillation par NotebookLM | **2 à 5 min** |
| Gemini Flash | **~30 s** |

---

## 🔥 Forger un système

1. **Nommez le système** visé. S'il existe déjà et qu'il est personnalisé, la forge l'**enrichit**
   au lieu d'en créer un second.
2. **Donnez-lui de la matière** : un corpus de documents déjà présents, ou un carnet NotebookLM.
3. **Guidez-la** par une consigne libre — *« priorise les règles de folie »*, *« fiche
   minimaliste »*.
4. **Lancez**, puis relisez la prévisualisation avant d'enregistrer.

### ⭐ La forge enrichit, elle ne double pas

C'est le changement du 2026-08-16, et il n'était documenté nulle part. Viser un système existant ne
crée plus un doublon : la forge **remplit les champs vides** et laisse le reste intact. Le journal
dit combien de champs ont été remplis, et **rien n'est jamais écrasé**.

Une case décide du sort de la fiche de personnage :

| **Ne pas toucher à la fiche de personnage** | Effet |
| :--- | :--- |
| **Cochée** *(par défaut)* | Seul le système est enrichi. La fiche existante ne bouge pas — ses champs, leurs identifiants, et les valeurs déjà saisies sur vos personnages. |
| **Décochée** | La dérivation ajoute ses sections et ses champs manquants. ⚠️ **Si elle nomme `points_de_vie` ce que votre fiche appelle `hp`, vous obtiendrez les deux.** |

> ⛔ **Les modes « BRAIN » et « BODY » n'existent plus.** Ce guide demandait de choisir entre
> extraire la logique ou la structure visuelle. La forge produit désormais les deux ensemble, et
> c'est la case ci-dessus qui décide de ce qu'elle touche.

---

## 📚 Documenter un supplément

*Depuis le 2026-11-01.* L'**Atelier de règles** documente aussi les suppléments d'un jeu : un
bestiaire, un livre de magie, un manuel d'équipement. Exemple : le *Colonial Marines Operations
Manual* d'Alien.

1. Dans le panneau de gauche, choisissez le **corpus du jeu** (`alien`), puis, juste dessous, sous
   « Livre documenté », le **supplément**, ou tapez son titre et **Déclarer**.
2. Dans le **Bac à contexte**, cochez **la seule source** du supplément. Sans cela, l'inventaire
   lirait aussi le livre de base, et une alerte le signale.
3. **Analyser les sources** ouvre l'atelier, sans rien demander au carnet ; cliquez **Demander
   l'inventaire**. Le carnet propose dix à vingt-cinq sujets : spécialités, talents,
   armes, véhicules, créatures, règles de campagne. Il laisse de côté l'histoire, l'univers et les
   scénarios.
4. **Choisissez** : renommez un sujet (crayon), écartez-le (corbeille), ajoutez-en un. Vos choix sont
   enregistrés et reviennent à la réouverture.
5. **Forgez et relisez** chaque fiche, comme pour le livre de base. Les tableaux du livre sont
   recopiés en tableau.

| Ce qui change pour un supplément | Pourquoi |
| :--- | :--- |
| Les fiches vont dans `docs/systems/<jeu>/supplements/<supplément>/rules/` | L'Oracle les cite avec le jeu ; le pilote et sa forge ne les lisent pas |
| Pas de liste fixe de quatorze sujets | Elle est faite pour un livre de base, et un supplément traite justement ce qu'elle exclut |
| Fiches dans la langue du corpus du jeu, avec le nom original entre parenthèses | « Fusilier (Rifleman) » : c'est le nom qu'on retrouve dans le livre |
| Les titres de section sont confrontés au sommaire du supplément | Déposé dans `supplements/<supplément>/index/` |
| Pas de personas | Ce sont les voix du jeu, pas d'un livre |

> Le supplément **n'ajoute encore aucun champ au pilote** : on documente d'abord. Décision de David
> du 2026-11-01 ; les champs viendront après l'essai de Colonial Marines.

---

## 📖 L'éditeur de règles — huit sections

On y arrive depuis Session-OS, par les **Règles** (le *Grimoire*).

| Section | Ce qu'on y règle |
| :--- | :--- |
| **Atelier** | Les fiches de règles écrites ou forgées → [les partager aux joueurs](./52-Partager-une-regle.md) |
| **Système** | Le moteur de dés : dés par défaut, et le moteur spécialisé |
| **Combat** | Statistiques, formule d'initiative et son sens de tri, dégâts |
| **Tactique** | Les seuils de portée du Cortex et leurs modificateurs |
| **Intelligence** | Les consignes des huit personas, réécrites pour ce jeu |
| **Trésors** | Les tables de butin, et le **vocabulaire** du jeu : sa monnaie, ses raretés |
| **Connaissance** | Le carnet NotebookLM de référence pour ce système |

> ⛔ **Ce guide n'en décrivait que trois** — le moteur de dés, le combat et le Cortex. L'**Atelier**,
> l'**Intelligence**, les **Trésors** et la **Connaissance** n'y figuraient pas.

### Les moteurs de dés

*Year Zero* (succès sur les 6, avec dés échelonnés pour Blade Runner) · *Réserve avec explosions* ·
*Fate / Fudge* · *2d20* (Dune, Star Trek) · *D100 et ses degrés de réussite* · le lancer standard.

→ [Guide de Dice-OS](./34-Dice-OS-le-pupitre.md)

### La section Trésors

Elle porte deux choses distinctes : les **tables de butin** du jeu, et son **vocabulaire** — comment
s'appelle sa monnaie, quels sont ses rangs de rareté. Sans ce vocabulaire, Loot-OS reste neutre :
il dira « pièces » là où votre jeu dit « eddies ».

→ [Guide de Loot-OS](./42-Butin-ecrire-les-tables.md)

---

## 💡 L'enchaînement

1. **Forgez le système** depuis vos documents de règles.
2. **Relisez-le** dans l'éditeur, section par section — c'est là qu'on rattrape ce que la forge a
   mal compris.
3. **Complétez le vocabulaire** (Trésors) et les portées (Tactique) : deux endroits que la forge
   remplit rarement bien seule.
4. **Attachez-le à une campagne** dans Session-OS.

> [!TIP]
> **Reforger n'est pas rejouer.** Vous pouvez relancer la forge sur le même système autant de fois
> que vous voulez, avec une consigne différente : elle comblera les trous sans défaire vos
> corrections.

---

*Guide refait le 2026-09-04, code à l'appui. Deux affirmations fausses retirées : le modèle n'est
pas « Gemini 1.5 Pro » mais celui que vous choisissez à chaque forge, et les modes **BRAIN / BODY**
n'existent plus. Ajouté : les **trois ateliers** de Forge-OS, l'**enrichissement** (2026-08-16) et
sa case de garde, les **quatre sections** de l'éditeur que ce guide ignorait, et les durées
mesurées.*

> 🖼️ **La bannière de l'en-tête** se choisit aussi dans l'éditeur du pilote, depuis le 2026-10-03 :
> une image du dossier du jeu, en fond de l'en-tête de Session-OS. → [Session-OS](./10-Session-OS-le-cockpit.md)

*Relu le 2026-10-03 : les onglets numérotés de la Forge. Capture de la campagne de démonstration.*
