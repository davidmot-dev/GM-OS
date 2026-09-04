# ⚔️ Guide de Cohésion : Combat-OS & Forge v2

Cette documentation détaille le fonctionnement de l'intégration entre le module de combat (**Combat-OS**) et le moteur de systèmes (**Forge v2 / Game Drivers**).

## 1. Deux objets, deux responsabilités

> 🔎 **Ce découpage est celui des *données*, et il tient toujours.** Ne le confondez pas avec les
> anciens modes « BRAIN » et « BODY » de la Forge, qui demandaient de choisir ce qu'on extrayait :
> ceux-là ont disparu, la Forge produit les deux ensemble. →
> [Guide de la Forge](./Rule_Engine_Forge_Guide.md)

*   **Le "Brain" (Cerveau)** : Défini par le `GameDriver`. Il contient la logique (formules de dés, initiative, instructions IA).
*   **Le "Body" (Corps)** : Défini par le `SheetTemplate`. Il contient la structure visuelle (champs, sections, jauges).

Le **Combat-OS** agit comme l'interface opérationnelle qui réunit ces deux entités durant une rencontre.

---

## 2. Automatisation de l'Initiative
Le Combat-OS n'utilise plus de jet générique par défaut s'il détecte un système actif.

### Le "Jet Système"
Lorsqu'une campagne est liée à un `GameDriver` possédant une `initiativeFormula` (ex: `1d20 + [dex]`), un bouton bleu **« JET SYSTÈME »** apparaît dans les contrôles de combat.
*   **Résolution Dynamique** : Le moteur remplace automatiquement les variables entre crochets par les valeurs stockées sur la fiche du personnage.
*   **Les crochets sont facultatifs** : `1d20 + dex` est lu comme `1d20 + [dex]`.
*   ⚠️ **Une variable introuvable vaut `0`**, elle ne fait pas échouer le jet. `1d20 + [dex]` sur un
    combattant sans `dex` rend donc un `1d20` sec — le résultat est le même, mais rien ne signale
    que la caractéristique manquait. *Un modificateur silencieusement absent est plus difficile à
    voir qu'une erreur.*
*   Le repli sur un dé au hasard n'intervient que si la formule est **illisible**.

---

## 3. Les ressources secondaires sur les cartes

Une ressource déclarée par le pilote — Santé mentale, Mana, Détermination — apparaît sur la carte du
combattant, sous ses points de vie.

**Deux chemins, selon ce que le pilote déclare :**

- **Il a un `ui_config.gauges`** — chaque jauge y porte **sa couleur et son style**, choisis par
  vous (ou par la Forge) : barre, segments, néon.
- **Il n'en a pas** — repli sur `combat.statsToTrack` : toutes les ressources s'affichent en
  **segments, dans la couleur d'accent**, sur une échelle de dix.

> ⛔ **Correction.** Ce guide annonçait une coloration automatique par nom — *Sanity* en violet,
> *Mana* en bleu, *XP* en ambre, le reste en indigo. **Cette table n'existe pas.** La couleur vient
> du pilote, ou d'une seule couleur de repli. Relevé le 2026-09-04.

> 🔎 **Une jauge se règle au clic**, ce que personne n'avait écrit : **clic gauche −1**, **clic
> droit +1**. C'est le geste le plus rapide pour suivre une Santé mentale qui s'effrite.

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
2.  **Trace au Journal** : un événement de type `COMBAT` est écrit dans le **journal de séance** —
    et non dans la chronologie de la campagne, comme l'annonçait ce guide. Il rejoindra donc le
    compte rendu de fin de séance. → [Guide du journal](./Journal_De_Seance_User_Guide.md)
3.  **Nettoyage** : La file d'initiative est archivée pour libérer la mémoire système.

---

> [!TIP]
> Pour une expérience optimale, assure-toi d'utiliser le **System Forge** pour extraire les "stats de combat" de ton PDF de règles. Cela configurera automatiquement le mapping des ressources pour le Combat-OS.

---

*Guide révisé le 2026-09-04, code à l'appui. Trois corrections : la **coloration automatique des
ressources par nom n'existe pas** (la couleur vient du pilote) ; le rapport de fin de combat va au
**journal de séance**, pas à la chronologie ; et une variable d'initiative introuvable **vaut 0**
au lieu de déclencher un repli. Ajouté : le réglage d'une jauge au clic gauche / clic droit.*
