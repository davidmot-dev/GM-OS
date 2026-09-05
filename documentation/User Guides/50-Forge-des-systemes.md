# 🔨 Rule Engine & la Forge

Deux outils, deux moments. **La Forge** lit vos documents et en tire un système jouable ; **l'éditeur
de règles** vous laisse tout reprendre à la main.

---

## 🗂️ Forge-OS a trois ateliers

L'en-tête du module porte trois onglets, et ce guide n'en connaissait qu'un :

| Atelier      | Ce qu'il produit                                                                                                            |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **Forge**    | Un **système de jeu** : moteur de dés, combat, portées, consignes d'IA, gabarit de fiche                                    |
| **Campagne** | Une campagne jouable à partir d'un scénario — actes, scènes, PNJ, lieux. → [guide dédié](./12-Forge-de-campagne.md) |
| **Trame**    | Le plan narratif d'une campagne existante. → [guide dédié](./11-Trame-actes-et-scenes.md)                                 |

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

## 📖 L'éditeur de règles — sept sections

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
