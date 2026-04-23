# Walkthrough : Map Layer Effects v2

Cette mise à jour apporte une gestion avancée du brouillard de guerre et des couches tactiques pour le module **Map-OS**.

## Changements Majeurs

### 1. Brouillard de Guerre Persistant (per-map)
Le brouillard n'est plus "global". Chaque carte (identifiée par son URL) possède désormais son propre état de brouillard sauvegardé dans un registre.
- **Bénéfice** : Vous pouvez passer d'une carte à l'autre sans perdre vos dessins de brouillard.
- **Brouillard par défaut** : Toute nouvelle carte chargée est désormais **automatiquement couverte de brouillard noir** par défaut.
- **Réinitialisation** : Si vous retirez une carte, son brouillard reste en mémoire pour la prochaine fois que vous la chargez.

### 2. Gestion des Couches (Layers)
Un nouveau panneau **"Gestion des Couches"** a été ajouté dans la sidebar. Il permet de masquer/afficher dynamiquement les éléments suivants :
- **Brouillard (Fog)** : Masquer le brouillard pour voir toute la carte sans le supprimer.
- **Grille (Grid)** : Activer/Désactiver le quadrillage tactique.
- **Pions (Tokens)** : Cacher tous les pions d'un coup.
- **Effets Magiques & Zones de Danger** : Masquer les visuels d'AoE et de pièges.
- **Météo** : Activer/Désactiver les effets atmosphériques.

---

## Vérification Technique

### Tests Automatisés
Les tests unitaires ont validé :
- La sauvegarde automatique dans le registre lors du dessin.
- Le chargement automatique des données de brouillard lors du `setMap`.
- La bascule de visibilité des couches.

```bash
✓ src/modules/map/__tests__/MapFogRegistry.test.ts (4 tests)
```

### Amélioration de la Robutesse
- Correction d'un bug de "Buffer Clearing" : le brouillard est désormais repeint systématiquement après un redimensionnement de la carte.
- Sécurisation du `FogEngine` avec Error Handling sur les DataURLs corrompues.
