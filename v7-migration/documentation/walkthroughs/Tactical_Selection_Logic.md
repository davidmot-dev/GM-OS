# Walkthrough : Sélection Tactique Interactive

Cette mise à jour rend le Cerveau Tactique interactif en permettant au MJ de sélectionner manuellement le pion source pour les calculs de portée.

## Fonctionnalités Implémentées

### 1. Sélection Interactive sur la Carte
Vous pouvez maintenant cliquer sur n'importe quel pion sur la carte pour en faire l'acteur "actif" du Cerveau Tactique. 
- Un **halo bleu ciel** apparaît autour du pion sélectionné.
- Cliquer sur le fond de la carte désélectionne le pion et redonne la priorité au tour actuel.

### 2. Priorité Intelligente
Le système suit désormais cette hiérarchie pour choisir quel pion analyser :
1. **Pion Sélectionné** : Si vous avez cliqué sur un pion, c'est lui qui est mesuré par rapport aux autres.
2. **Combattant Actif** : Si aucun pion n'est sélectionné, l'IA revient automatiquement sur le personnage dont c'est le tour dans l'initiative.

### 3. Mesures Hors-Combat
Si vous sélectionnez un pion qui n'est pas dans le Combat Tracker (ex: un décor, un véhicule, un PNJ non hostille) :
- Le système calculera les distances vers **tous les autres pions** (et pas seulement les ennemis).
- Cela permet de mesurer rapidement n'importe quoi sur la carte.

## Changements Techniques
- **Map Store** : Ajout de `selectedTokenId`.
- **MapTokenNode** : Gestion de l'événement `PointerDown` pour la sélection et affichage du halo.
- **useTacticalOrchestrator** : Logique de priorité `Selection > Turn` et support des pions "hors combat".

## Vérification
- [x] Le clic sur un pion déclenche une analyse immédiate.
- [x] Le halo bleu confirme visuellement la sélection.
- [x] Le clic sur le fond désélectionne proprement.
- [x] L'analyse revient au combattant du tour actuel après désélection.
