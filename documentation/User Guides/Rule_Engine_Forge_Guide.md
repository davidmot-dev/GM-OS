# 🧠 Guide Utilisateur : Rule Engine & The Forge

Le **Rule Engine** (Le Cerveau) et **The Forge** (L'Atelier) forment le cœur technique de GM-OS v5. Ils permettent de définir comment le système de jeu fonctionne, comment les dés sont lancés, et comment l'IA doit se comporter.

---

## 🛠️ The Forge : L'Automatisation par l'IA

La Forge est un module révolutionnaire qui utilise l'IA (Gemini 1.5 Pro) pour "lire" vos livres de règles ou vos fiches de personnages et les transformer instantanément en code pour GM-OS.

### 1. Les Deux Canaux d'Extraction
Lorsque vous entrez dans la Forge, vous devez choisir votre cible :
- **Mode BRAIN (Cerveau)** : Extrait la logique de règles (dés, calculs de combat, instructions IA).
- **Mode BODY (Corps)** : Extrait la structure visuelle (sections, champs, jauges, inventaire).

### 2. Alimentation de la Forge
Vous pouvez nourrir la machine de trois manières :
- **Ritual Upload** : Glissez-déposez un PDF, une image de fiche, ou un fichier texte/Markdown.
- **Local Tomes** : Scannez vos dossiers locaux (notamment `systems/`) pour charger des documents déjà présents.
- **Aetheric Guidance** : Une zone de texte cruciale où vous donnez vos ordres à l'IA (ex: *"Priorise les règles de folie"*, *"Génère une fiche très minimaliste"*).

### 3. Le Processus de Forge
1. **Load** : Sélectionnez votre support.
2. **Ignite** : Lancez l'analyse. Vous verrez le "Neural Scan" défiler dans les logs.
3. **Quench & Save** : Une fois la prévisualisation JSON et visuelle validée, enregistrez l'élément dans votre bibliothèque.

---

## ⚙️ Rule Engine Editor : Configuration Manuelle

Si vous souhaitez affiner un système ou le créer de zéro, le Rule Engine Editor vous donne un contrôle total.

### 🎲 Dice-OS Core
Configurez le moteur de dés fondamental du système :
- **Dés par défaut** : La commande de base (ex: `1d20`, `2d6`).
- **Engines Spécialisés** : Choisissez parmi des moteurs pré-codés :
    - *Year Zero Engine* (Alien, Blade Runner) : Succès sur les 6.
    - *Pool / Exploding* : Pool de dés avec relances sur les critiques.
    - *Fate / Fudge* : Dés +, - et vides.
    - *2d20* (Dune, Star Trek).
    - *D100 / Rolemaster*.

### ⚔️ Combat & Initiative
- **Formule d'Init** : Définit comment l'ordre de tour est calculé (ex: `1d10 + Rapidité`).
- **Ordre de tri** : Croissant ou Décroissant.
- **Pool de Cartes** : Permet d'utiliser un système de tirage sans remise (de 1 à N).

### 🧠 Cortex Tactique (IA Map)
Le Cortex permet à GM-OS de comprendre les distances sur vos cartes :
- **Mapping des Portées** : Définissez les seuils (en cases) pour Contact, Courte, Moyenne, Longue et Extrême distance.
- **Modificateurs** : Associez un bonus/malus automatique à chaque portée pour aider l'IA à suggérer des jets de dés.

---

## 💎 Résonances IA (Personas)

Dans le Rule Engine, vous pouvez "surcharger" les instructions de l'IA pour chaque Persona (Gem).
- **Exemple** : Pour un système *Horreur*, vous pouvez forcer le Persona **Le Sage** à répondre de manière inquiétante et à toujours mentionner la perte de Santé Mentale dans ses explications techniques.

> [!IMPORTANT]
> **Lien NotebookLM** : C'est ici que vous liez l'URL de votre NotebookLM "Maître" pour ce système de jeu. Toutes les campagnes utilisant ce Driver hériteront de ses connaissances.

---

## 💡 Résumé du Flux de Travail
1. **Forge** un "Body" (le visuel) à partir d'une image de fiche.
2. **Forge** un "Brain" (la logique) à partir d'un PDF de règles.
3. **Lie** les deux dans le **Rule Engine Editor**.
4. **Active** le tout dans votre **Session OS** pour lancer votre campagne !
