# Walkthrough: Obsidian Bridge

L'intégration d'Obsidian est maintenant terminée. Vous pouvez parcourir votre Vault Obsidian directement dans GM-OS et utiliser vos notes pour nourrir l'intelligence de l'Oracle.

## Changements Majeurs

### 1. Backend & Bridge
- **[obsidian_bridge.ts](file:///C:/Users/david/OneDrive/Jeux%20de%20R%C3%B4les/GM-OS-v5/electron/obsidian_bridge.ts)** : Gestion de la lecture récursive du Vault et accès sécurisé aux fichiers `.md`.
- **Preload** : Exposition de `appBridge.obsidian` pour permettre au frontend d'interagir avec vos notes.

### 2. Interface Utilisateur
- **Nouveau Module "Obsidian"** : accessible via l'icône ✨ (Sparkles) dans la barre latérale "Aventure".
- **Explorateur de Notes** : une arborescence complète de votre Vault avec recherche intégrée.
- **Lecteur de Notes** : affichage clair de vos notes en préparation (lecture seule).
- **Deep Linking** : bouton pour ouvrir la note active directement dans Obsidian.

### 3. Intelligence (AI Link)
- **Synchronisation Oracle** : un bouton "Sync Oracle" permet d'envoyer le contenu de la note active à NotebookLM. L'Oracle connaîtra alors les détails de votre scénario ou de vos PNJ pour répondre précisément à vos questions.

## Comment l'utiliser ?

1. Cliquez sur l'icône **Obsidian** (✨) dans la barre latérale.
2. Parcourez vos dossiers pour trouver une note.
3. Pour que l'Oracle utilise cette note comme contexte, cliquez sur **Sync Oracle**.
4. Posez vos questions dans le panneau de l'Oracle (AI GEMS), il saura de quoi vous parlez !

## Vérification Technique
- [x] Listing récursif des fichiers `.md` (exclut les dossiers cachés comme `.obsidian`).
- [x] Chargement du contenu textuel.
- [x] Appel à l'outil MCP `notebook_add_text` pour la synchronisation.
- [x] Gestion des types TypeScript et nettoyage des erreurs de lint.

---
> [!TIP]
> GM-OS détecte automatiquement votre Vault à l'emplacement par défaut (`OneDrive/Obsidian Vault`).
