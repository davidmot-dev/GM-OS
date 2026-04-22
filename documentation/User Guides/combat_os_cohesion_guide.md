# ⚔️ Guide de Cohésion : Combat-OS & Forge v2

Cette documentation détaille le fonctionnement de l'intégration entre le module de combat (**Combat-OS**) et le moteur de systèmes (**Forge v2 / Game Drivers**).

## 1. Philosophie : Brain vs Body
Le système repose sur un découpage strict des responsabilités :
*   **Le "Brain" (Cerveau)** : Défini par le `GameDriver`. Il contient la logique (formules de dés, initiative, instructions IA).
*   **Le "Body" (Corps)** : Défini par le `SheetTemplate`. Il contient la structure visuelle (champs, sections, jauges).

Le **Combat-OS** agit comme l'interface opérationnelle qui réunit ces deux entités durant une rencontre.

---

## 2. Automatisation de l'Initiative
Le Combat-OS n'utilise plus de jet générique par défaut s'il détecte un système actif.

### Le "Jet Système"
Lorsqu'une campagne est liée à un `GameDriver` possédant une `initiativeFormula` (ex: `1d20 + [dex]`), un bouton bleu **« JET SYSTÈME »** apparaît dans les contrôles de combat.
*   **Résolution Dynamique** : Le moteur remplace automatiquement les variables entre crochets par les valeurs stockées sur la fiche du personnage.
*   **Fallback** : Si le personnage n'est pas lié ou si la stat est manquante, le système utilise un jet de `1d20` standard (ajustable via le sélecteur).

---

## 3. Cartographie Dynamique des Ressources
Les cartes de combattant (`CombatCard`) s'adaptent en temps réel aux données extraites par la Forge.

### Suivi des Stats Secondaires
Si ton système définit des ressources à suivre (ex: *Santé Mentale* dans Cthulhu, *Mana* dans un jeu fantasy), elles apparaissent automatiquement sous forme de barres de progression colorées.
*   **isResource: true** : Ce flag dans le Driver active l'affichage en combat.
*   **Coloration Contextuelle** : 
    *   `Sanity` / `Mental` → **Violet**
    *   `Mana` / `MP` / `Arcane` → **Bleu**
    *   `Experience` / `XP` → **Ambre**
    *   Autres → **Indigo**

---

## 4. Protocole de Synchronisation (Aetheric Link)
Le combat est souvent chaotique, mais les données doivent rester propres.

### Synchronisation des Points de Vie
Un bouton **« Sync PV vers Session »** permet de "pousser" les changements de PV faits durant le combat vers la base de données globale.
*   **Indicateur de Lien** : Une icône de maillon (`Link2`) pulsée indique qu'un combattant est activement synchronisé avec une fiche de personnage ou un PNJ.
*   **Persistance** : Les dégâts infligés en combat sont ainsi conservés pour la suite de l'aventure (exploration, repos, etc.).

---

## 5. Archivage Narratif
À la fin d'un combat, l'action **« Fin de combat »** déclenche plusieurs processus :
1.  **Génération de Rapport** : Un résumé Markdown est créé (participants, PV finaux, états actifs).
2.  **Liaison Chronologique** : Un événement de type `combat` est ajouté à la **Timeline**, permettant de garder une trace historique des affrontements majeurs.
3.  **Nettoyage** : La file d'initiative est archivée pour libérer la mémoire système.

---

> [!TIP]
> Pour une expérience optimale, assure-toi d'utiliser le **System Forge** pour extraire les "stats de combat" de ton PDF de règles. Cela configurera automatiquement le mapping des ressources pour le Combat-OS.
