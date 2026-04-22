# 🎭 Guide : Map Layer Effects v2

Cette version v2 du moteur de calques de **Map OS** introduit une gestion granulaire de la visibilité et une persistance intelligente du brouillard de guerre par carte.

## 🌟 Points Clés de la v2

### 💾 Persistance par Carte (Registry)
Contrairement aux versions précédentes où le brouillard était global, la v2 lie votre exploration directement à l'identifiant de la carte.
- **Continuité** : Préparez le brouillard sur plusieurs cartes à l'avance.
- **Changement de Scène** : Basculez entre une carte de ville et un donjon sans perdre l'état d'exploration de l'autre.
- **Stockage** : Les données sont sauvegardées localement (LocalStorage/IndexedDB) pour une reprise instantanée après redémarrage.

### 🛡️ Initialisation Sécurisée (Safe Start)
Pour éviter tout "spoil" accidentel lors de l'ouverture d'une nouvelle carte :
- **Noir Complet** : Toute carte non encore explorée est initialisée avec un brouillard opaque à 100%.
- **Zéro Fuite** : Aucun élément (pions, décors, pièges) n'est visible tant que vous ne décidez pas de commencer l'exploration.

### 🍱 Gestion Granulaire des Couches (Layers)
Le nouveau panneau de contrôle (`LayerVisibility`) permet d'isoler des éléments sans affecter la projection des joueurs :
- **Brouillard** : Masquez votre vue MJ du brouillard pour inspecter la carte tout en laissant les joueurs dans le noir.
- **Grille** : Toggle visuel pour l'alignement tactique.
- **Tokens** : Cachez tous les pions simultanément pour les "rencontres surprises".
- **Effets (Magie/Météo)** : Gérez l'encombrement visuel étape par étape.

## 🛠️ Workflow Recommandé

1.  **Préparation** : Importez votre carte. Elle apparaît en noir complet (Safe Start).
2.  **Placement** : Masquez temporairement le calque **Brouillard** pour placer vos pions et vos zones de danger.
3.  **Exploration** : Réactivez le calque **Brouillard** et utilisez l'outil **Reveal** pour dévoiler les zones au fur et à mesure de l'avancée des joueurs.
4.  **Transition** : Changez de carte ; l'état est sauvegardé automatiquement.

---

> [!IMPORTANT]
> **Masquage Physique** : N'oubliez pas que le brouillard v2 est une couche physique (`z-index: 20`). Tout ce qui est dessous est caché. Si un pion ne se voit pas sur l'écran joueur, vérifiez qu'il n'est pas sous une zone de brouillard non révélée !

> [!TIP]
> **Performance** : La v2 utilise un moteur de rendu canvas optimisé. Même avec des dizaines de calques actifs, la fluidité reste constante à 60fps sur le Player Hub.
