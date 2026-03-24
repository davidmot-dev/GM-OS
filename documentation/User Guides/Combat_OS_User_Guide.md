# ⚔️ Guide Utilisateur : Combat OS

Le module **Combat OS** est votre tour de contrôle pour les affrontements. Il automatise la gestion de l'ordre de passage, le suivi de la santé, les effets de statut et synchronise le tout avec le plateau de jeu et la chronologie de votre campagne.

![Aperçu du module Combat OS](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/documentation/User%20Guides/combat_mockup.png)

## 📋 Présentation du Module

Combat OS est conçu pour libérer le MJ des calculs fastidieux et du suivi administratif :

1. **Liste d'Initiative** : Visualisez l'ordre des tours de manière claire.
2. **Gestionnaire de Rounds** : Suivi automatique de la progression du temps.
3. **Statuts Intelligents** : Gérez les buffs/debuffs avec gestion automatique des conflits.
4. **Sync PV (Points de Vie)** : Mettez à jour les fiches de personnages et de monstres en un clic.
5. **Rapport de Combat** : Exportez automatiquement un résumé narratif vers votre chronologie.

## 🎲 Lancement de l'Initiative

Vous avez deux méthodes pour définir l'ordre de combat :
- **Manuelle** : Cliquez sur le score d'initiative d'un combattant pour le modifier directement.
- **Jet Système (Auto-Initiative)** : 
    - **Standard** : Lance un dé (configurable, ex: d20) pour tous les combattants ayant une initiative à 0.
    - **Intelligent (Formula)** : Si un système de jeu (Driver) est actif, Combat OS utilise la formule officielle (ex: `1d10 + [DEX]`) ou un système de cartes.
    - **Tri** : Le système trie automatiquement la liste selon les règles du driver (Croissant ou Décroissant).

## 🦶 Déroulement des Tours

- **Tour Suivant / Précédent** : Utilisez les boutons de navigation pour faire défiler le combat.
- **Incrémentation du Round** : Une fois que le dernier combattant a terminé, le round s'incrémente automatiquement.
- **Focus Map OS** : Le pion correspondant au tour actuel est automatiquement mis en surbrillance sur le module **Map OS**.
- **Gestion des Durées** : À chaque nouveau tour d'un combattant, la durée de ses effets de statut diminue de 1 round.

## 🩸 Santé et Statuts

### Gestion des Statuts
Ajoutez des icônes et des noms d'effets (ex: *Étourdi*, *En Feu*).
- **Conflits Automatiques** : Le système possède une intelligence métier. Si vous ajoutez le statut "En Feu" à un personnage qui possède le statut "Mouillé", ce dernier sera automatiquement retiré.

### Synchronisation des PV
Modifiez les points de vie des participants durant le combat. Une fois l'affrontement terminé ou pendant une pause, cliquez sur **"Sync PV vers Session"** pour mettre à jour durablement les fiches de personnages (PJ) et d'entités (PNJ) dans la base de données de la campagne.

## 📑 Archive et Fin de Combat
Le bouton **"Tout Effacer"** (Fin de Combat) déclenche plusieurs actions de session :
1. **Résumé de Combat** : Génère une entrée dans le Journal listant les rounds écoulés, le nombre de participants, les survivants et les pertes.
2. **Constat de Décès** : Chaque PNJ ayant le statut "Mort" (💀) lors de la fin du combat crée une entrée dédiée dans le Journal et met à jour son statut dans le Session OS.
3. **Log de Session** : Ajoute l'événement à la chronologie de votre session active.
4. **Libération** : Vide la liste pour la prochaine rencontre.

---

## 💡 Astuces pour l'Immersion

> [!TIP]
> **Le Drag-and-Drop** : Vous pouvez réorganiser l'ordre d'initiative manuellement à tout moment en faisant glisser les cartes des combattants, idéal pour gérer les "Hold Actions" ou les changements d'ordre narratifs.

> [!IMPORTANT]
> **Lien Session OS** : Pour que la synchronisation des PV fonctionne, assurez-vous que vos combattants ont été importés depuis le **Session OS** ou le **NPC OS** plutôt que créés manuellement.

---

## ⚙️ Raccourcis Techniques

- **Jet Système** : Utilise le moteur de dés interne (**Dice OS**).
- **Snapshot** : Le combat en cours est sauvegardé en temps réel. Si l'application redémarre, le combat reprend exactement au même round et au même tour.
