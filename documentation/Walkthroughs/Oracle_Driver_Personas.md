# Walkthrough : Intégration des Personas Spécifiques au Driver

J'ai implémenté la prise en compte des personas contextuels définis directement dans vos drivers (Rule Engines). Désormais, si vous personnalisez une personnalité pour un système de jeu spécifique, l'Oracle l'utilisera en priorité.

## Changements Principaux

### 1. Logique de Prompt "Intelligente"
Le hook [useNotebookLM.ts](../../src/modules/session/hooks/useNotebookLM.ts) suit désormais cet ordre de priorité pour les instructions du persona :
1. **Driver Override** : Instructions définies dans l'onglet "Aetheric Resonance" du driver actif.
2. **System Override** : Instructions par défaut pour ce système (ex: Alien).
3. **Base Instructions** : Instructions globales du Gème.

### 3. Nouveau Sélecteur de Persona
L'interface de l'Oracle a été repensée pour être plus intuitive :
- **Bouton SWITCH** : Un bouton explicite "SWITCH" est désormais visible en haut à gauche de l'Oracle. Cliquez sur ce bouton (ou sur la carte du persona) pour ouvrir le menu.
- **Retour Visuel** : L'icône du persona s'anime lors du survol pour indiquer qu'elle est interactive.

### 4. Auto-Génération Smart (NOUVEAU)
Le bouton **"Générer avec l'IA"** dans l'éditeur de Driver permet de remplir instantanément les 7 personas. Cette génération est séquentielle pour garantir la qualité et supporte l'isolation RAG (seules les règles du système sont consultées en mode Driver).

---

## Vérification Technique

1. **Priorisation** : Le prompt est construit dynamiquement en fusionnant les instructions du driver avec la question de l'utilisateur.
2. **Robustesse** : Utilisation de `getActiveDriver()` pour garantir que même les drivers intégrés (builtin) sont pris en compte.
3. **UI Performance** : Correction des erreurs de rendu React (cascading renders) pour une interface plus fluide.

> [!TIP]
> Pour tester, allez dans le Rule Engine d'Alien, modifiez les instructions du persona "Scribe" et vérifiez le badge SYNC dans l'Oracle !
