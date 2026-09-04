# Walkthrough : Ajout de Gemma 4 (12B) pour Ollama

Cette modification permet aux utilisateurs de sélectionner et de télécharger le modèle d'IA local **Gemma 4 (12B)** directement depuis l'interface des paramètres de GM-OS.

## Changements apportés

### 1. Interface Utilisateur (UI)
- **Fichier modifié** : [AISettings.tsx](../../src/modules/ai/components/AISettings.tsx)
  - Ajout de l'option `{ value: 'gemma4:12b', label: 'Gemma 4 (12B)' }` dans le menu déroulant des modèles pour Ollama et Ollama Cloud.
  - Ajout d'un bouton dédié sous le fournisseur Ollama pour télécharger (pull) le modèle `gemma4:12b` s'il n'est pas détecté localement.
  - Réorganisation des boutons de téléchargement de Gemma 4 (`gemma4:12b` et `gemma4:26b`) dans un conteneur flex vertical.

### 2. Localisation (Traductions)
- **Fichier modifié** : [settings.json (FR)](../../src/locales/fr/settings.json)
- **Fichier modifié** : [settings.json (EN)](../../src/locales/en/settings.json)
  - Ajout des traductions manquantes pour lancer le téléchargement, le succès et l'échec de Gemma 4 (26B).
  - Ajout des traductions pour le téléchargement, le succès et l'échec de Gemma 4 (12B).

### 3. Correction de bug (Pre-existing)
- **Fichier modifié** : [RemoteDicePad.tsx](../../src/modules/remote/components/RemoteDicePad.tsx)
  - Suppression d'un bloc de fermeture `}, []);` en double à la ligne 69 qui empêchait le build du projet de réussir.
  - Remplacement du typage lâche `params: any` par le typage strict `params: Parameters<typeof onRoll>[0]` pour satisfaire le standard TypeScript strict du projet.

## Vérification et Validation

### Tests Automatisés
- Exécution réussie de la suite de tests du module IA :
  - `npx vitest run src/modules/ai` : Tous les tests ont réussi avec succès.

### Compilation TypeScript
- Validation réussie de la compilation sans erreur dans le code modifié.
